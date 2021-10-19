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
from http import HTTPStatus
import os
from queue import Empty
from queue import Queue
from threading import Thread
from typing import Any
from typing import Dict
from typing import List
from typing import Tuple

from jupyter_core.paths import ENV_JUPYTER_PATH
import requests
from traitlets.config import LoggingConfigurable
from traitlets.traitlets import Integer

from build.lib.elyra.pipeline.component import Component
from elyra.metadata.metadata import Metadata


class ComponentReader(LoggingConfigurable):
    """
    Abstract class to model component_entry readers that can read components from different locations
    """
    catalog_type: str = None

    max_readers = Integer(3, config=True, allow_none=True,
                          help="""Sets the number of reader threads""")

    def __init__(self, file_types: List[str]):
        super().__init__()
        self.file_types = file_types

    @abstractmethod
    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.
        """
        raise NotImplementedError()

    @abstractmethod
    def read_component_definition(self,
                                  component_metadata_tuple: Tuple[str, Dict],
                                  hash_to_metadata: Dict[str, Dict]) -> Dict[str, Dict]:
        """
        Read a component specification file given its component_metadata

        :param component_metadata_tuple: a Tuple of the form (component_hash, component_metadata)
        :param hash_to_metadata: a mapping of component hash to a dictionary of the form
            {
                'definition': 'component-definition-as-string',
                'metadata': {}
            }
            where the 'metadata' key stores any information that may be needed to retrieve
            the component definition in subsequent calls to read_component_definition()

        :returns: the given 'hash_to_metadata' object, optionally including a new
                  key-value pair if the given component location is successfully read
                  TODO
        """
        raise NotImplementedError()

    @abstractmethod
    def get_component_source_kwargs(self, component: Component) -> Dict[str, str]:
        """
        TODO
        """
        raise NotImplementedError()

    def get_unique_component_hash(self, catalog_class: str, component_metadata: Dict[str, Any]) -> str:
        """
        Constructs a unique hash for the given component based on the component's catalog
        reader class and other elements specific to that class (passed in as args) that
        serve to unique-ify a component id

        Example: A component using a FilesystemComponentReader class, will have the following
        arguments: catalog_class = FilesystemComponentReader and *args = ['abspath_to_comp_def']
        """
        hash_str = catalog_class
        for value in component_metadata.values():
            hash_str = f"{hash_str}:{value}"

        return str(hash(hash_str))

    def read_component_definitions(self, registry_metadata: List[Metadata]) -> Dict[str, Dict]:
        """
        This function starts a number of threads ('max_reader' or fewer) that read component
        definitions in parallel.

        The 'hash_to_metadata' variable is a mapping of a unique component hash to its metadata. TODO
        As a mutable object, this dictionary provides a means to retrieve a return value for
        each thread. If a thread is able to successfully read the content of the given
        component file location, a hash-to-metadata mapping is added to 'hash_to_metadata'.
        """
        hash_to_metadata = {}

        loc_q = Queue()
        for component_metadata in self.get_component_metadata_from_registry(registry_metadata):
            component_hash = self.get_unique_component_hash(str(self.__class__), component_metadata)
            loc_q.put_nowait((component_hash, component_metadata))

        def read_with_thread():
            """Get a location from the queue and read contents"""
            while not loc_q.empty():
                try:
                    self.log.debug("Retrieving component metadata from queue...")
                    component_md_tuple = loc_q.get(timeout=.1)
                except Empty:
                    continue

                try:
                    self.log.debug(f"Attempting read of component definition for component with metadata: "
                                   f"'{component_md_tuple[1]}'...")

                    # Add component hash and metadata to the dictionary
                    hash_to_metadata[component_md_tuple[0]] = {'metadata': component_md_tuple[1]}
                    self.read_component_definition(component_md_tuple, hash_to_metadata)
                except Exception:
                    self.log.warning(f"Could not read component definition for component with metadata: "
                                     f"'{component_md_tuple[1]}'. Skipping...")
                    pass

                loc_q.task_done()

        # Start 'max_reader' reader threads if registry includes more than 'max_reader'
        # number of locations, else start one thread per location
        num_threads = min(loc_q.qsize(), self.max_readers)
        for i in range(num_threads):
            Thread(target=read_with_thread).start()

        # Wait for all queued locations to be processed
        loc_q.join()

        return hash_to_metadata


class FilesystemComponentReader(ComponentReader):
    """
    Read a singular component definition from the local filesystem
    """
    catalog_type = 'local-file-catalog'
    rendering_type = 'filename'

    def determine_location(self, location_path: str) -> str:
        """
        Determines the absolute location of a given path. Error
        checking is delegated to the calling function
        """
        # Expand path to include user home if necessary
        path = os.path.expanduser(location_path)

        # Check for absolute path
        if os.path.isabs(path):
            return path

        # If path is not absolute, default to the Jupyter share location
        path = os.path.join(ENV_JUPYTER_PATH[0], 'components', path)
        return path

    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        The metadata for the FilesystemComponentReader class is of the following form:
        {'location': 'absolute_path_to_component_definition_in_localfs'}
        """
        component_metadata = []
        paths = registry_metadata['paths']

        # Concatenate paths with the base_path if provided
        if registry_metadata['base_path']:
            paths = [os.path.join(registry_metadata['base_path'], path) for path in paths]

        for path in paths:
            absolute_path = self.determine_location(path)
            if not os.path.exists(absolute_path):
                self.log.warning(f"File does not exist -> {absolute_path}")
                continue

            component_metadata.append({'location': absolute_path})
        return component_metadata

    def read_component_definition(self,
                                  component_metadata_tuple: Tuple[str, Dict],
                                  hash_to_metadata: Dict[str, Dict]) -> Dict[str, Dict]:
        location = component_metadata_tuple[1]['location']
        if not os.path.exists(location):
            self.log.warning(f"Invalid location for component: {location}")
        else:
            with open(location, 'r') as f:
                component_hash = component_metadata_tuple[0]
                hash_to_metadata[component_hash]['definition'] = f.read()

        return hash_to_metadata

    def get_component_source_kwargs(self, component: Component) -> Dict[str, str]:
        """
        TODO and add abstractmethod
        """
        return {self.rendering_type: component.metadata.get('location')}


class DirectoryComponentReader(FilesystemComponentReader):
    """
    Read component definitions from a local directory
    """
    catalog_type = 'local-directory-catalog'
    rendering_type = 'filename'

    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        The metadata for the DirectoryComponentReader class is of the following form:
        {'location': 'absolute_path_to_component_definition_in_localfs'}
        """
        component_metadata = []
        for path in registry_metadata['paths']:
            absolute_path = self.determine_location(path)
            if not os.path.exists(absolute_path):
                self.log.warning(f"Invalid directory -> {absolute_path}")
                continue

            for filename in os.listdir(absolute_path):
                if filename.endswith(tuple(self.file_types)):
                    component_metadata.append({'location': os.path.join(absolute_path, filename)})

        return component_metadata


class UrlComponentReader(ComponentReader):
    """
    Read a singular component definition from a url
    """
    catalog_type = 'url-catalog'
    rendering_type = 'url'

    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Dict[str, Any]]:
        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        The metadata for the UrlComponentReader class is of the following form:
        {'location': 'url_of_remote_component_definition'}
        """
        return [{'location': path} for path in registry_metadata['paths']]

    def read_component_definition(self,
                                  component_metadata_tuple: Tuple[str, Dict],
                                  hash_to_metadata: Dict[str, Dict]) -> Dict[str, Dict]:
        location = component_metadata_tuple[1]['location']
        try:
            res = requests.get(location)
        except Exception as e:
            self.log.warning(f"Failed to connect to URL for component: {location}: {e}")
        else:
            if res.status_code != HTTPStatus.OK:
                self.log.warning(f"Invalid location for component: {location} (HTTP code {res.status_code})")
            else:
                component_hash = component_metadata_tuple[0]
                hash_to_metadata[component_hash]['definition'] = res.text,

        return hash_to_metadata

    def get_component_source_kwargs(self, component: Component) -> Dict[str, str]:
        """
        TODO and add abstractmethod
        """
        # TODO Add a try-catch?
        return {self.rendering_type: component.metadata.get('location')}


class GitHubComponentReader(UrlComponentReader):
    """
    Read component definitions from a github repo
    """
    catalog_type = 'github-catalog'
    rendering_type = 'url'

    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Tuple[str, Dict]]:
        pass
