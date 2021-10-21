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
# from typing import Tuple

from jupyter_core.paths import ENV_JUPYTER_PATH
import requests
from traitlets.config import LoggingConfigurable
from traitlets.traitlets import Integer

from elyra.pipeline.component import Component


class ComponentCatalogConnector(LoggingConfigurable):
    """
    Abstract class to model component_entry readers that can read components from different locations
    """

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
    def get_component_hash_keys(self) -> List[Any]:
        """
        Provides a list of keys from the component_metadata dictionary whose values are
        used to construct a unique hash id for a component with the given catalog type

        :returns: a list of keys
        """
        raise NotImplementedError()

    @abstractmethod
    def get_catalog_entries(self, registry_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        :param registry_metadata: the dictionary-form of the Metadata instance for a single registry

        :returns: a list of component-specific metadata dictionaries, each of which contains the
                  information needed to access the content of a component definition
        """
        raise NotImplementedError()

    @abstractmethod
    def read_catalog_entry(self,
                           component_id: str,
                           component_metadata: Dict[str, Any],
                           registry_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Read a component specification file given its component_metadata

        :param component_id: the unique id of this component
        :param component_metadata: a dictionary that contains the information needed to read the content
                                   of the component definition
        :param registry_metadata: the metadata associated with the registry in which this catalog entry is
                                  stored; in addition to component_metadata, registry_metadata may also be
                                  needed to read the component definition for some types of catalogs
        :param hash_to_metadata: a mapping of component hash to a dictionary of the form
            {
                'definition': 'component-definition-as-string',
                'metadata': component_metadata
            }
            where the 'metadata' key stores the dictionary of info that may be needed to retrieve
            the component definition in subsequent calls to read_catalog_entry()

        :returns: the given 'hash_to_metadata' object, optionally including a new
                  key-value pair if the given component location is successfully read
        """
        raise NotImplementedError()

    def log_message(self, pre_amble: str,
                    message: str,
                    post_amble: str,
                    log_level: Optional[str] = None):
        """
        Log a message at the specified level
        """
        full_message = f"{pre_amble}{message}{post_amble}"
        if log_level == 'info':
            self.log.info(full_message)
        elif log_level == 'debug':
            self.log.debug(full_message)
        elif log_level == 'warning':
            self.log.warning(full_message)
        elif log_level == 'error':
            self.log.error(full_message)
        else:
            self.log.debug(full_message)

    def get_log_message_dialog(self, metadata: Dict[str, Any]) -> str:
        """
        Provides message dialog to better identify a component during logging.
        Subclasses can extend this to provide information specific to that
        reader class.
        """
        return f"with metadata: '{metadata}'"

    @staticmethod
    def get_unique_component_hash(catalog_class: str,
                                  component_metadata: Dict[str, Any],
                                  component_hash_keys: List[Any]) -> str:
        """
        Constructs a unique hash for the given component based on the name of the catalog
        connector class and any information specific to that component/catalog-type combination
        as given in component_hash_keys.

        :param catalog_class: the catalog_type of the ComponentCatalogConnector class for
                              this component, e.g. url-catalog
        :param component_metadata: the metadata associated with the component
        :param component_hash_keys: the list of keys (present in the component_metadata dict)
                                    whose values will be used to construct the hash

        :returns: a unique component id of the form '<catalog-type>:<hash_of_given_metadata>'
        TODO
        """
        hash_str = ""
        for key_to_hash in component_hash_keys:
            hash_str = hash_str + component_metadata[key_to_hash] + ":"
        hash_str = hash_str[:-1]

        # Use only the first 12 characters of the resulting hash
        hash_digest = f"{hashlib.sha256(hash_str.encode()).hexdigest()[:12]}"
        return f"{catalog_class}:{hash_digest}"

    def read_component_definitions(self, registry_metadata: Dict[str, Any]) -> Dict[str, Dict]:
        """
        Starts a number of threads ('max_reader' or fewer) that read component definitions in parallel.

        The 'hash_to_metadata' variable is a mapping of a unique component hash to its definition and
        metadata. As a mutable object, this dictionary provides a means to retrieve a return value for
        each thread. If a thread is able to successfully read the content of the given component file
        location, a definition key is added to its hash_to_metadata mapping entry.
        """
        hash_to_metadata = {}

        catalog_entry_q = Queue()

        try:
            keys_to_hash = self.get_component_hash_keys()
            for entry_data in self.get_catalog_entries(registry_metadata):
                catalog_entry_q.put_nowait(entry_data)

        except Exception:
            # self.log.warning(f"Could not read component catalog '{registry_metadata[]}'. Skipping...")
            pass

        def read_with_thread():
            """Get a location from the queue and read contents"""
            while not catalog_entry_q.empty():
                try:
                    self.log.debug("Retrieving component metadata from queue...")
                    catalog_entry_data = catalog_entry_q.get(timeout=.1)
                except Empty:
                    continue

                try:
                    # Generate hash for this entry
                    component_hash = ComponentCatalogConnector.get_unique_component_hash(self.catalog_type,
                                                                                         catalog_entry_data,
                                                                                         keys_to_hash)

                    self.log.debug(f"Attempting read of component definition for component with metadata: "
                                   f"'{catalog_entry_data}'...")

                    # Add component hash and metadata to the dictionary
                    hash_to_metadata[component_hash] = {'metadata': catalog_entry_data}

                    # TODO Test returning a value and constructing hash_to_md here
                    definition = self.read_catalog_entry(component_id=component_hash,
                                                         component_metadata=catalog_entry_data,
                                                         registry_metadata=registry_metadata)

                    hash_to_metadata[component_hash] = {
                        "definition": definition,
                        "metadata": catalog_entry_data
                    }

                except Exception:
                    self.log.warning(f"Could not read component definition for component with metadata: "
                                     f"'{catalog_entry_data}'. Skipping...")
                    pass

                catalog_entry_q.task_done()

        # Start 'max_reader' reader threads if registry includes more than 'max_reader'
        # number of locations, else start one thread per location
        num_threads = min(catalog_entry_q.qsize(), self.max_readers)
        for i in range(num_threads):
            Thread(target=read_with_thread).start()

        # Wait for all queued locations to be processed
        catalog_entry_q.join()

        return hash_to_metadata


class FilesystemComponentCatalogConnector(ComponentCatalogConnector):
    """
    Read a singular component definition from the local filesystem
    """

    def determine_absolute_path(self, path: str, base_path: Optional[str] = None) -> str:
        """
        Determines the absolute location of a given path. Error
        checking is delegated to the calling function
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

    def get_component_hash_keys(self) -> List[Any]:
        return ['path']

    def get_catalog_entries(self, registry_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        The metadata for the FilesystemComponentCatalogConnector class is of the following form:
        {'location': 'absolute_path_to_component_definition_in_localfs'}
        """
        component_metadata = []
        for path in registry_metadata['paths']:
            absolute_path = self.determine_absolute_path(path, registry_metadata.get('base_path'))
            if not os.path.exists(absolute_path):
                self.log.warning(f"File does not exist -> {absolute_path}")
                continue

            component_metadata.append({'path': absolute_path})
        return component_metadata

    def read_catalog_entry(self,
                           component_id: str,
                           component_metadata: Dict[str, Any],
                           registry_metadata: Dict[str, Any]) -> Optional[str]:

        path = component_metadata['path']
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

    def get_catalog_entries(self, registry_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        The metadata for the DirectoryComponentCatalogConnector class is of the following form:
        {'location': 'absolute_path_to_component_definition_in_localfs'}
        """
        component_metadata = []
        for path in registry_metadata['paths']:
            absolute_path = self.determine_absolute_path(path, registry_metadata.get('base_path'))
            if not os.path.exists(absolute_path):
                self.log.warning(f"Invalid directory -> {absolute_path}")
                continue

            for filename in os.listdir(absolute_path):
                if filename.endswith(tuple(self.file_types)):
                    component_metadata.append({'location': os.path.join(absolute_path, filename)})

        return component_metadata


class UrlComponentCatalogConnector(ComponentCatalogConnector):
    """
    Read a singular component definition from a url
    """

    def get_component_hash_keys(self) -> List[Any]:
        return ['url']

    def get_catalog_entries(self, registry_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        The metadata for the UrlComponentCatalogConnector class is of the following form:
        {'location': 'url_of_remote_component_definition'}
        """
        return [{'url': url} for url in registry_metadata['paths']]

    def read_catalog_entry(self,
                           component_id: str,
                           component_metadata: Dict[str, Any],
                           registry_metadata: Dict[str, Any]) -> Optional[str]:
        url = component_metadata['url']
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
