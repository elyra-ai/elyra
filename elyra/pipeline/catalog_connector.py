#
# Copyright 2018-2021 Elyra Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from abc import abstractmethod
import hashlib
from http import HTTPStatus
import os
from pathlib import Path
from queue import Empty
from queue import Queue
from threading import Thread
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from jupyter_core.paths import ENV_JUPYTER_PATH
import requests
from traitlets.config import LoggingConfigurable
from traitlets.traitlets import default
from traitlets.traitlets import Integer

from elyra.metadata.metadata import Metadata


class ComponentCatalogConnector(LoggingConfigurable):
    """
    Abstract class to model component_entry readers that can read components from different locations
    """
    max_threads_default = 3
    max_readers_env = 'ELYRA_CATALOG_CONNECTOR_MAX_READERS'
    max_readers = Integer(max_threads_default,
                          help="""Sets the maximum number of reader threads to be used to read
                          catalog entries in parallel""").tag(config=True)

    @default('max_readers')
    def max_readers_default(self):
        max_reader_threads = ComponentCatalogConnector.max_threads_default
        try:
            max_reader_threads = int(os.getenv(self.max_readers_env, max_reader_threads))
        except ValueError:
            pass
        return max_reader_threads

    def __init__(self, file_types: List[str], **kwargs):
        super().__init__(**kwargs)
        self._file_types = file_types

    @abstractmethod
    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.

        Each catalog_entry_data dictionary contains the information needed to access a single component
        definition. The form that each catalog_entry_data takes is determined by the unique requirements
        of the reader class.

        For example, the FilesystemCatalogConnector includes both a base directory ('base_dir') key-value
        pair and a relative path ('path') key-value pair in its 'catalog_entry_data' dict. Both fields
        are needed in order to access the corresponding component definition in read_catalog_entry().

        Every catalog_entry_data should contain each of the keys returned in get_hash_keys() to ensure
        uniqueness and portability among entries. For the same reason, no two catalog entries should have
        equivalent catalog_entry_data dictionaries.

        :param catalog_metadata: the dictionary form of the metadata associated with a single catalog;
                                 the general structure is given in the example below

                example:
                    {
                        "description": "...",  # only present if a description is added
                        "runtime_type": "...",  # must be present
                        "categories": ["category1", "category2", ...],  # may be an empty array
                        "your_property1": value1,
                        "your_property2": value2,
                        ...
                    }

        :returns: a list of catalog entry dictionaries, each of which contains the information
                  needed to access a component definition in read_catalog_entry()
        """
        raise NotImplementedError(
            "abstract method 'get_catalog_entries()' must be implemented"
        )

    @abstractmethod
    def read_catalog_entry(self,
                           catalog_entry_data: Dict[str, Any],
                           catalog_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Reads a component definition for a single catalog entry using the catalog_entry_data returned
        from get_catalog_entries() and, if needed, the catalog metadata.

        :param catalog_entry_data: a dictionary that contains the information needed to read the content
                                   of the component definition; below is an example data structure returned
                                   from get_catalog_entries()

                example:
                    {
                        "directory_path": "/Users/path/to/directory",
                        "relative_path": "subdir/file.py"
                    }

        :param catalog_metadata: the metadata associated with the catalog in which this catalog entry is
                                 stored; this is the same dictionary that is passed into get_catalog_entries();
                                 in addition to catalog_entry_data, catalog_metadata may also be
                                 needed to read the component definition for certain types of catalogs

        :returns: the content of the given catalog entry's definition in string form, if found, or None;
                  if None is returned, this catalog entry is skipped and a warning message logged
        """
        raise NotImplementedError(
            "abstract method 'read_catalog_entry()' must be implemented"
        )

    @abstractmethod
    def get_hash_keys(self) -> List[Any]:
        """
        Provides a list of keys, available in the 'catalog_entry_data' dictionary, whose values
        will be used to construct a unique hash id for each entry with the given catalog type.

        Besides being a means to uniquely identify a single component (catalog entry), the hash id
        also enables pipeline portability across installations when the keys returned here are
        chosen strategically. For example, the FilesystemCatalogConnector includes both a base
        directory key-value pair and a relative path key-value pair in its 'catalog_entry_data' dict.
        Both fields are required to access the component definition in read_catalog_entry(), but
        only the relative path field is used to create the unique hash. This allows a component
        that has the same relative path defined in two separate a catalogs in two separate
        installations to resolve to the same unique id in each, and therefore to be portable across
        pipelines in these installations.

        To ensure the hash is unique, no two catalog entries can have the same key-value pairs
        over the set of keys returned by this function. If two entries resolve to the same hash,
        the one whose definition is read last will overwrite the other(s).

        Example:
        Given a set of keys ['key1', 'key2', 'key3'], the below two catalog_entry_data dictionaries
        will produce unique hashes. The same can not be said, however, if the set of keys
        returned is ['key2', 'key3'].

            component_entry_data for entry1:        component_entry_data for entry2:
            {                                       {
                'key1': 'value1',                       'key1': 'value4',
                'key2': 'value2',                       'key2': 'value2',
                'key3': 'value3'                        'key3': 'value3'
            }                                       {

        Additionally, every catalog_entry_data dict should include each key in the set returned
        here. If this is not the case, a catalog entry's portability and uniqueness may be negatively
        affected.

        :returns: a list of keys
        """
        raise NotImplementedError(
            "abstract method 'get_hash_keys()' must be implemented"
        )

    def get_unique_component_hash(self,
                                  catalog_type: str,
                                  catalog_entry_data: Dict[str, Any],
                                  catalog_hash_keys: List[Any]) -> str:
        """
        Constructs a unique hash for the given component based on the name of the catalog
        connector class and any information specific to that component-and-catalog-type
        combination as given in catalog_hash_keys.

        :param catalog_type: the identifying type of this Connector class, as taken from the
                             schema_name of the related schema (e.g., url-catalog)
        :param catalog_entry_data: the identifying data associated with the catalog entry; this data
                                   structure is one of the dicts returned from get_catalog_entries()
        :param catalog_hash_keys: the list of keys (present in the catalog_entry_data dict)
                                  whose values will be used to construct the hash

        :returns: a unique component id of the form '<catalog-type>:<hash_of_entry_data>'
        """
        hash_str = ""
        for key in catalog_hash_keys:
            if not catalog_entry_data.get(key):
                self.log.warning(f"Catalog entry does not have key '{key}'. Continuing to build hash "
                                 f"string without this key...")
                continue
            hash_str = hash_str + str(catalog_entry_data[key]) + ":"
        hash_str = hash_str[:-1]

        # Use only the first 12 characters of the resulting hash
        hash_digest = f"{hashlib.sha256(hash_str.encode()).hexdigest()[:12]}"
        return f"{catalog_type}:{hash_digest}"

    def read_component_definitions(self, catalog_instance: Metadata) -> Dict[str, Dict]:
        """
        This function compiles the definitions of all catalog entries in a given catalog.

        Catalog entry data is first retrieved for each entry in the given catalog. This data is added
        to a queue, and a number of reader threads ('max_reader' or fewer) are started.

        Each reader thread pulls the data for a singe catalog entry from the queue and uses it to read
        the definition associated with that entry.

        As a mutable object, the 'catalog_entry_map' provides a means to retrieve a return value for
        each thread. If a thread is able to successfully read the content of the given catalog entry,
        a unique hash is created for the entry and a mapping is added to the catalog_entry_map.

        The catalog_instance Metadata parameter will have the following attributes of interest in
        addition to a few additional attributes used internally:


        :param catalog_instance: the Metadata instance for this catalog; below is an example instance

                example:
                    display_name: str = "Catalog Name"
                    schema_name: str = "connector-type"
                    metadata: Dict[str, Any] = {
                        "description": "...",  # only present if a description is added
                        "runtime": "...",  # must be present
                        "categories": ["category1", "category2", ...],  # may be an empty array
                        "your_property1": value1,
                        "your_property2": value2,
                        ...
                    }

        :returns: a mapping of a unique component ids to their definition and identifying data
        """
        catalog_entry_map = {}
        catalog_entry_q = Queue()

        try:
            # Retrieve list of keys that will be used to construct
            # the catalog entry hash for each entry in the catalog
            keys_to_hash = self.get_hash_keys()

            # Add catalog entry data dictionaries to the thread queue
            for entry_data in self.get_catalog_entries(catalog_instance.metadata):
                catalog_entry_q.put_nowait(entry_data)

        except NotImplementedError as e:
            err_msg = f"{self.__class__.__name__} does not meet the requirements of a catalog connector class: {e}"
            self.log.error(err_msg)
        except Exception as e:
            err_msg = f"Could not get catalog entry information for catalog '{catalog_instance.display_name}': {e}"
            # Dump stack trace with error message
            self.log.exception(err_msg)

        def read_with_thread():
            """
            Gets a catalog entry data dictionary from the queue and attempts to read corresponding definition
            """
            while not catalog_entry_q.empty():
                try:
                    # Pull a catalog entry dictionary from the queue
                    catalog_entry_data = catalog_entry_q.get(timeout=.1)
                except Empty:
                    continue

                try:
                    # Read the entry definition given its returned data and the catalog entry data
                    self.log.debug(f"Attempting read of definition for catalog entry with identifying information: "
                                   f"{str(catalog_entry_data)}...")
                    definition = self.read_catalog_entry(catalog_entry_data=catalog_entry_data,
                                                         catalog_metadata=catalog_instance.metadata)

                    # Ignore this entry if no definition content is returned
                    if not definition:
                        self.log.warning(f"No definition content found for catalog entry with identifying information: "
                                         f"{str(catalog_entry_data)}. Skipping...")
                        catalog_entry_q.task_done()
                        continue

                    # Generate hash for this catalog entry
                    catalog_entry_id = self.get_unique_component_hash(catalog_type=catalog_instance.schema_name,
                                                                      catalog_entry_data=catalog_entry_data,
                                                                      catalog_hash_keys=keys_to_hash)

                    # Add entry definition and identifying data to mapping
                    catalog_entry_map[catalog_entry_id] = {
                        "definition": definition,
                        "identifier": catalog_entry_data
                    }

                except NotImplementedError as e:
                    msg = f"{self.__class__.__name__} does not meet the requirements of a catalog connector class: {e}."
                    self.log.error(msg)
                except Exception as e:
                    # Dump stack trace with error message and continue
                    self.log.exception(f"Could not read definition for catalog entry with identifying information: "
                                       f"{str(catalog_entry_data)}: {e}")

                # Mark this thread's read as complete
                catalog_entry_q.task_done()

        # Start 'max_reader' reader threads if catalog includes more than 'max_reader'
        # number of catalog entries, else start one thread per entry
        num_threads = min(catalog_entry_q.qsize(), self.max_readers)
        for i in range(num_threads):
            Thread(target=read_with_thread).start()

        # Wait for all queued entries to be processed
        catalog_entry_q.join()

        return catalog_entry_map


class FilesystemComponentCatalogConnector(ComponentCatalogConnector):
    """
    Read a singular component definition from the local filesystem
    """

    def get_absolute_path(self, path: str) -> str:
        """
        Determines the absolute location of a given path. Error checking is delegated to
        the calling function
        """
        # Expand path to include user home if necessary
        path = os.path.expanduser(path)

        # Check for absolute path
        if os.path.isabs(path):
            return path

        # If path is still not absolute, default to the Jupyter share location
        return os.path.join(ENV_JUPYTER_PATH[0], 'components', path)

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.

        :returns: a list of component_entry_data; for the FilesystemComponentCatalogConnector class this
                  takes the form:

                    {
                        'base_dir': 'base/directory/for/file',  # can be empty
                        'path': 'path/to/definition_in_local_fs.ext'  # may be relative or absolute
                    }
        """
        catalog_entry_data = []
        base_dir = catalog_metadata.get('base_path', '')
        if base_dir:
            base_dir = self.get_absolute_path(base_dir)
            if not os.path.exists(base_dir):
                # If the base directory is not found, skip this catalog
                self.log.warning(f"Base directory does not exist -> {base_dir}")
                return catalog_entry_data

        for path in catalog_metadata.get('paths'):
            path = os.path.expanduser(path)
            if not base_dir and not os.path.isabs(path):
                base_dir = os.path.join(ENV_JUPYTER_PATH[0], 'components')

            catalog_entry_data.append({
                'base_dir': base_dir,
                'path': path
            })
        return catalog_entry_data

    def read_catalog_entry(self,
                           catalog_entry_data: Dict[str, Any],
                           catalog_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Reads a component definition for a single catalog entry using the catalog_entry_data returned
        from get_catalog_entries() and, if needed, the catalog metadata.

        :param catalog_entry_data: for the Filesystem- and DirectoryComponentCatalogConnector classes,
                                   this includes 'path' and 'base_dir' keys
        :param catalog_metadata: Filesystem- and DirectoryComponentCatalogConnector classes do not need this
                                 field to read individual catalog entries

        """
        path = os.path.join(catalog_entry_data.get('base_dir', ''), catalog_entry_data.get('path'))
        if not os.path.exists(path):
            self.log.warning(f"Invalid location for component: {path}")
        else:
            with open(path, 'r') as f:
                return f.read()

        return None

    def get_hash_keys(self) -> List[Any]:
        """
        For the Filesystem- and DirectoryComponentCatalogConnector classes, only the
        'path' value is needed from the catalog_entry_data dictionary to construct a
        unique hash id for a single catalog entry
        """
        return ['path']


class DirectoryComponentCatalogConnector(FilesystemComponentCatalogConnector):
    """
    Read component definitions from a local directory
    """

    def get_relative_path_from_base(self, base_dir: str, file_path: str) -> str:
        """
        Determines the relative portion of a path from the given base directory.

        :param base_dir: the absolute path to a base directory to compare against
        :param file_path: the absolute path to a file within the given base directory

        :returns: the path to the given file relative to the given base directory

        Example:
            given: base_path = "/path/to/folder"
            given: absolute_path = "/path/to/folder/nested/file.py"

            returns: 'nested/file.py'
        """
        base_list = base_dir.split('/')
        absolute_list = file_path.split('/')
        while base_list:
            base_list = base_list[1:]
            absolute_list = absolute_list[1:]

        return '/'.join(absolute_list)

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.

        :returns: a list of component_entry_data; for the DirectoryComponentCatalogConnector class this
                  takes the form

                    {
                        'base_dir': 'base/directory/for/files',  # given in base_path
                        'path': 'path/to/definition_in_local_fs.ext'  # may be relative or absolute
                    }
        """
        catalog_entry_data = []
        for dir_path in catalog_metadata.get('paths'):
            base_dir = self.get_absolute_path(dir_path)
            if not os.path.exists(base_dir):
                self.log.warning(f"Invalid directory -> {base_dir}")
                continue

            # Include '**/' in the glob pattern if files in subdirectories should be included
            recursive_flag = "**/" if catalog_metadata.get("include_subdirs", False) else ""

            patterns = [f"{recursive_flag}*{file_type}" for file_type in self._file_types]
            for file_pattern in patterns:
                catalog_entry_data.extend([
                    {
                        'base_dir': base_dir,
                        'path': self.get_relative_path_from_base(base_dir, str(absolute_path))
                    } for absolute_path in Path(base_dir).glob(file_pattern)
                ])

        return catalog_entry_data


class UrlComponentCatalogConnector(ComponentCatalogConnector):
    """
    Read a singular component definition from a url
    """

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.

        :returns: a list of component_entry_data; for the UrlComponentCatalogConnector class this takes
                  the form:

                    {
                        'url': 'url_of_remote_component_definition'
                    }
        """
        return [{'url': url} for url in catalog_metadata.get('paths')]

    def read_catalog_entry(self,
                           catalog_entry_data: Dict[str, Any],
                           catalog_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Reads a component definition for a single catalog entry using the catalog_entry_data returned
        from get_catalog_entries() and, if needed, the catalog metadata.

        :param catalog_entry_data: for the UrlComponentCatalogConnector class this includes a 'url' key
        :param catalog_metadata: UrlComponentCatalogConnector does not need this field to read
                                 individual catalog entries

        """

        url = catalog_entry_data.get('url')
        try:
            res = requests.get(url)
        except Exception as e:
            self.log.warning(f"Failed to connect to URL for component: {url}: {e}")
        else:
            if res.status_code != HTTPStatus.OK:
                self.log.warning(f"Invalid location for component: {url} (HTTP code {res.status_code})")
            else:
                return res.text

        return None

    def get_hash_keys(self) -> List[Any]:
        """
        For the UrlComponentCatalogConnector class, only the 'url' value is needed
        from the catalog_entry_data dictionary to construct a unique hash id for a
        single catalog entry
        """
        return ['url']
