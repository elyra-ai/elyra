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
from traitlets.traitlets import Integer


class ComponentCatalogConnector(LoggingConfigurable):
    """
    Abstract class to model component_entry readers that can read components from different locations
    """

    # TODO make this configurable per connector; allow to override max_readers setting
    # TODO show in help-all, see classes array in elyra_app.py and add the connector to the array
    # TODO Data structure to encapsulate various flags/capabilities dictionary for extensibility
    max_readers = Integer(3, config=True, allow_none=True,
                          help="""Sets the number of reader threads""")

    def __init__(self, catalog_type: str, file_types: List[str]):
        super().__init__()
        self._catalog_type = catalog_type
        self.file_types = file_types

    @property
    def catalog_type(self) -> Optional[str]:
        return self._catalog_type

    @abstractmethod
    def get_hash_keys(self) -> List[Any]:
        """
        Provides a list of keys available in the 'catalog_entry_data' dictionary whose values
        will be used to construct a unique hash id for each entry with the given catalog type

        :returns: a list of keys
        """
        raise NotImplementedError()

    @abstractmethod
    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.
        The form that each catalog_entry_data takes is determined by the unique requirements of the
        reader class.

        :param catalog_metadata: the dictionary form of the Metadata instance for a single catalog

        :returns: a list of catalog entry dictionaries, each of which contains the information
                  needed to access a component definition in read_catalog_entry()
        """
        raise NotImplementedError()

    @abstractmethod
    def read_catalog_entry(self,
                           catalog_entry_data: Dict[str, Any],
                           catalog_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Read a component definition for a single catalog entry using the its data (as returned from
        get_catalog_entries()) and the catalog metadata, if needed

        :param catalog_entry_data: a dictionary that contains the information needed to read the content
                                   of the component definition
        :param catalog_metadata: the metadata associated with the catalog in which this catalog entry is
                                 stored; in addition to catalog_entry_data, catalog_metadata may also be
                                 needed to read the component definition for certain types of catalogs

        :returns: the content of the given catalog entry's definition in string form
        """
        raise NotImplementedError()

    def get_unique_component_hash(self,
                                  catalog_entry_data: Dict[str, Any],
                                  catalog_hash_keys: List[Any]) -> str:
        """
        Constructs a unique hash for the given component based on the name of the catalog
        connector class and any information specific to that component/catalog-type combination
        as given in catalog_hash_keys.

        :param catalog_entry_data: the metadata associated with the component
        :param catalog_hash_keys: the list of keys (present in the catalog_entry_data dict)
                                  whose values will be used to construct the hash

        :returns: a unique component id of the form '<catalog-type>:<hash_of_given_metadata>'
        """
        hash_str = ""
        for key in catalog_hash_keys:
            if not catalog_entry_data.get(key):
                continue
            hash_str = hash_str + catalog_entry_data[key] + ":"
        hash_str = hash_str[:-1]

        # Use only the first 12 characters of the resulting hash
        hash_digest = f"{hashlib.sha256(hash_str.encode()).hexdigest()[:12]}"
        return f"{self.catalog_type}:{hash_digest}"

    def read_component_definitions(self, catalog_metadata: Dict[str, Any]) -> Dict[str, Dict]:
        """
        This function compiles the definitions of all catalog entries in a given catalog.

        Catalog entry data is first retrieved for each entry in the catalog. This data is added to a
        queue, and a number of reader threads ('max_reader' or fewer) are started.

        Each reader thread pulls the data for a singe catalog entry from the queue and uses it to read
        the definition associated with that entry.

        As a mutable object, the 'catalog_entry_map' provides a means to retrieve a return value for
        each thread. If a thread is able to successfully read the content of the given catalog entry,
        a unique hash is created for the entry and a mapping is added to the catalog_entry_map.

        :param catalog_metadata: the metadata associated with this catalog instance

        :returns: a mapping of a unique component ids to their definition and identifying data
        """
        catalog_entry_map = {}
        catalog_entry_q = Queue()

        # Retrieve list of keys that will be used to construct
        # the catalog entry hash for each entry in the catalog
        keys_to_hash = self.get_hash_keys()

        try:
            # Add catalog entry data dictionaries to the thread queue
            for entry_data in self.get_catalog_entries(catalog_metadata):
                catalog_entry_q.put_nowait(entry_data)

        except Exception as e:
            self.log.warning(f"Could not get catalog entry information for catalog with metadata: "
                             f"'{str(catalog_metadata)}': {e}")

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
                    # Read the entry definition given its returned data and the catalog metadata
                    self.log.debug(f"Attempting read of definition for catalog entry with identifying information: "
                                   f"{str(catalog_entry_data)}...")
                    definition = self.read_catalog_entry(catalog_entry_data=catalog_entry_data,
                                                         catalog_metadata=catalog_metadata)

                    # Ignore this entry if no definition content is returned
                    if not definition:
                        self.log.warning(f"No definition content found for catalog entry with identifying information: "
                                         f"{str(catalog_entry_data)}. Skipping...")
                        catalog_entry_q.task_done()
                        continue

                    # Generate hash for this catalog entry and add entry definition and identifying data to mapping
                    catalog_entry_id = self.get_unique_component_hash(catalog_entry_data, keys_to_hash)
                    catalog_entry_map[catalog_entry_id] = {
                        "definition": definition,
                        "identifier": catalog_entry_data
                    }

                except Exception as e:
                    self.log.warning(f"Could not read definition for catalog entry with identifying information: "
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

    def determine_absolute_path(self, path: str, base_path: Optional[str] = None) -> str:
        """
        Determines the absolute location of a given path. Error checking is delegated to
        the calling function
        """
        # Expand path to include user home if necessary
        path = os.path.expanduser(path)

        # Check for absolute path
        if os.path.isabs(path):
            return path

        # Concatenate paths with the base_path and check for absolute path again
        if base_path:
            concat_path = os.path.join(os.path.expanduser(base_path), path)
            if os.path.isabs(concat_path):
                return concat_path

        # If path is still not absolute, default to the Jupyter share location
        path = os.path.join(ENV_JUPYTER_PATH[0], 'components', path)
        return path

    def get_hash_keys(self) -> List[Any]:
        return ['path']

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.
        The form that each catalog_entry_data takes is determined by the unique requirements of the
        reader class.

        The metadata for the FilesystemComponentCatalogConnector class is of the following form:
        {'path': 'abspath_to_component_definition_in_local_fs'}
        """
        catalog_entry_data = []
        for path in catalog_metadata.get('paths'):
            absolute_path = self.determine_absolute_path(path, catalog_metadata.get('base_path'))
            if not os.path.exists(absolute_path):
                self.log.warning(f"File does not exist -> {absolute_path}")
                continue

            catalog_entry_data.append({'path': absolute_path})
        return catalog_entry_data

    def read_catalog_entry(self,
                           catalog_entry_data: Dict[str, Any],
                           catalog_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Read a component definition for a single catalog entry using the its data (as returned from
        get_catalog_entries()) and the catalog metadata, if needed

        catalog_entry_data takes the following for for FilesystemComponentCatalogConnector and
        DirectoryComponentCatalogConnector:

            catalog_entry_data = {
                'path': 'abspath_to_component_definition_in_local_fs'
            }

        """
        path = catalog_entry_data.get('path')
        if not os.path.exists(path):
            self.log.warning(f"Invalid location for component: {path}")
        else:
            with open(path, 'r') as f:
                return f.read()

        return None


class DirectoryComponentCatalogConnector(FilesystemComponentCatalogConnector):
    """
    Read component definitions from a local directory
    """

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.
        The form that each catalog_entry_data takes is determined by the unique requirements of the
        reader class.

        The metadata for the DirectoryComponentCatalogConnector class is of the following form:
        {'path': 'abspath_to_component_definition_in_local_fs'}
        """
        catalog_entry_data = []
        for path in catalog_metadata.get('paths'):
            absolute_path = self.determine_absolute_path(path, catalog_metadata.get('base_path'))
            if not os.path.exists(absolute_path):
                self.log.warning(f"Invalid directory -> {absolute_path}")
                continue

            for filename in os.listdir(absolute_path):
                if filename.endswith(tuple(self.file_types)):
                    catalog_entry_data.append({'path': os.path.join(absolute_path, filename)})

        return catalog_entry_data


class UrlComponentCatalogConnector(ComponentCatalogConnector):
    """
    Read a singular component definition from a url
    """

    def get_hash_keys(self) -> List[Any]:
        return ['url']

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of catalog_entry_data dictionary instances, one per entry in the given catalog.
        The form that each catalog_entry_data takes is determined by the unique requirements of the
        reader class.

        The metadata for the UrlComponentCatalogConnector class is of the following form:
        {'url': 'url_of_remote_component_definition'}
        """
        return [{'url': url} for url in catalog_metadata.get('paths')]

    def read_catalog_entry(self,
                           catalog_entry_data: Dict[str, Any],
                           catalog_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Read a component definition for a single catalog entry using the its data (as returned from
        get_catalog_entries()) and the catalog metadata, if needed

        catalog_entry_data takes the following for for UrlComponentCatalogConnector:

            catalog_entry_data = {
                'url': 'url_of_remote_component_definition'
            }

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
