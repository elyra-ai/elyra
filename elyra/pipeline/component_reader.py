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
from typing import Dict
from typing import List
from typing import Tuple

from jupyter_core.paths import ENV_JUPYTER_PATH
import requests
from traitlets.config import LoggingConfigurable
from traitlets.traitlets import Integer

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

    @property
    def resource_type(self):
        """
        The RuntimePipelineProcessor accesses this property in order to
        process components on pipeline submit/export. The value must be
        one of ('filename', 'url').
        """
        return self.catalog_type

    @abstractmethod
    def get_absolute_locations(self, paths: List[str]) -> List[str]:
        """
        Returns a list of absolute paths to component specification file(s)
        based on the array of potentially relative locations given
        """
        raise NotImplementedError()

    @abstractmethod
    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Tuple[str, Dict]]:
        """
        TODO
        Formerly get_absolute_locations
        """
        raise NotImplementedError()

    @abstractmethod
    def read_component_definition(self,
                                  location: str,
                                  location_to_def: Dict[str, str]) -> Dict[str, Dict]:
        """
        Read an absolute location to get the contents of a component specification file

        :param location: an absolute path to the specification file to read
        :param location_to_def: a mapping of component locations to file contents

        :returns: the given 'location_to_def' object, optionally including a new
                  key-value pair if the given component location is successfully read
        """
        raise NotImplementedError()

    def get_unique_component_hash(self, location_type, *args) -> str:
        """
        TODO
        """
        hash_str = location_type
        for arg in args:
            hash_str = f"{hash_str}:{arg}"

        return str(hash(hash_str))

    def read_component_definitions(self, registry_metadata: List[Metadata]) -> Dict[str, Dict]:
        """
        This function starts a number of threads ('max_reader' or fewer) that read component
        definitions in parallel.

        The 'location_to_def' variable is a mapping of a component location to its content.
        As a mutable object, this dictionary provides a means to retrieve a return value for
        each thread. If a thread is able to successfully read the content of the given
        component file location, a location-to-content mapping is added to 'location_to_def'.
        """
        # location_to_def = {}

        hash_to_metadata = {}

        loc_q = Queue()
        # for location in self.get_absolute_locations(locations):
        #    loc_q.put_nowait(location)
        for component_metadata in self.get_component_metadata_from_registry(registry_metadata):
            loc_q.put_nowait(component_metadata)

        def read_with_thread():
            """Get a location from the queue and read contents"""
            while not loc_q.empty():
                try:
                    self.log.debug("Retrieving component definition file location from queue...")
                    component_metadata = loc_q.get(timeout=.1)
                except Empty:
                    continue

                try:
                    # self.log.debug(f"Attempting read of component definition file at location '{loc}'...")
                    # component_hash = list(component_metadata.keys())[0]
                    # location_to_def[component_hash] = {}
                    # self.read_component_definition(component_metadata, location_to_def)
                    self.read_component_definition(component_metadata, hash_to_metadata)
                except Exception:
                    # self.log.warning(f"Could not read component definition file at location '{loc}'. Skipping...")
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

    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Tuple[str, Dict]]:
        """
        TODO
        """
        hash_to_metadata = []
        for path in registry_metadata['paths']:
            absolute_path = self.determine_location(path)
            if not os.path.exists(absolute_path):
                self.log.warning(f"File does not exist -> {absolute_path}")

            component_hash = self.get_unique_component_hash(self.__class__, absolute_path or "")
            hash_to_metadata.append((component_hash, {'location': absolute_path}))
        return hash_to_metadata

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

    def read_component_definition(self,
                                  component_metadata: Tuple[str, Dict],
                                  hash_to_metadata: Dict[str, Dict]) -> Dict[str, Dict]:
        location = component_metadata[1]['location']
        if not os.path.exists(location):
            self.log.warning(f"Invalid location for component: {location}")
        else:
            with open(location, 'r') as f:
                component_hash = component_metadata[0]
                hash_to_metadata[component_hash] = {
                    'definition': f.read(),
                    'metadata': component_metadata[1]
                }

        return hash_to_metadata

    def get_absolute_locations(self, paths: List[str]) -> List[str]:
        absolute_paths = []
        for path in paths:
            absolute_path = self.determine_location(path)
            if not os.path.exists(absolute_path):
                self.log.warning(f"File does not exist -> {absolute_path}")
            absolute_paths.append(absolute_path)
        return absolute_paths


class DirectoryComponentReader(FilesystemComponentReader):
    """
    Read component definitions from a local directory
    """
    catalog_type = 'local-directory-catalog'
    rendering_type = 'filename'

    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Tuple[str, Dict]]:
        """
        TODO
        """
        hash_to_metadata = []
        for path in registry_metadata['paths']:
            absolute_path = self.determine_location(path)
            if not os.path.exists(absolute_path):
                self.log.warning(f"Invalid directory -> {absolute_path}")
                continue

            for filename in os.listdir(absolute_path):
                if filename.endswith(tuple(self.file_types)):
                    component_hash = self.get_unique_component_hash(self.__class__, filename or "")
                    hash_to_metadata.append((component_hash, {'location': os.path.join(absolute_path, filename)}))

        return hash_to_metadata

    def get_absolute_locations(self, paths: List[str]) -> List[str]:
        absolute_paths = []
        for path in paths:
            absolute_path = self.determine_location(path)
            if not os.path.exists(absolute_path):
                self.log.warning(f"Invalid directory -> {absolute_path}")
                continue

            for filename in os.listdir(absolute_path):
                if filename.endswith(tuple(self.file_types)):
                    absolute_paths.append(os.path.join(absolute_path, filename))

        return absolute_paths

    @property
    def resource_type(self):
        """
        The RuntimePipelineProcessor accesses this property in order to process
        components on pipeline submit/export. The superclass location_type is
        used because the value must be one of ('filename', 'url').
        """
        return super().location_type


class UrlComponentReader(ComponentReader):
    """
    Read a singular component definition from a url
    """
    catalog_type = 'url-catalog'
    rendering_type = 'url'

    def get_component_metadata_from_registry(self, registry_metadata: List[Metadata]) -> List[Tuple[str, Dict]]:
        """
        TODO
        """
        hash_to_metadata = []
        for path in registry_metadata['paths']:
            component_hash = self.get_unique_component_hash(self.__class__, path or "")
            hash_to_metadata.append((component_hash, {'location': path}))
        return hash_to_metadata

    def read_component_definition(self,
                                  component_metadata: Tuple[str, Dict],
                                  hash_to_metadata: Dict[str, Dict]) -> Dict[str, Dict]:
        location = component_metadata[1]['location']
        try:
            res = requests.get(location)
        except Exception as e:
            self.log.warning(f"Failed to connect to URL for component: {location}: {e}")
        else:
            if res.status_code != HTTPStatus.OK:
                self.log.warning(f"Invalid location for component: {location} (HTTP code {res.status_code})")
            else:
                component_hash = component_metadata[0]
                hash_to_metadata[component_hash] = {
                    'definition': res.text,
                    'metadata': component_metadata[1]
                }

        return hash_to_metadata

    def get_absolute_locations(self, paths: List[str]) -> List[str]:
        return paths


class GitHubComponentReader(UrlComponentReader):
    """
    Read component definitions from a github repo
    """
    location_type = 'github'

    def get_absolute_locations(self, paths: List[str]) -> List[str]:
        pass

    @property
    def resource_type(self):
        """
        The RuntimePipelineProcessor accesses this property in order to process
        components on pipeline submit/export. The superclass location_type is
        used because the value must be one of ('filename', 'url').
        """
        return super().location_type
