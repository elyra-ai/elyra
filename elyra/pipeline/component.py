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
from logging import Logger
import os
from queue import Empty
from queue import Queue
from threading import Thread
from types import SimpleNamespace
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from jupyter_core.paths import ENV_JUPYTER_PATH
import requests
from traitlets.config import LoggingConfigurable
from traitlets.traitlets import Integer


class ComponentParameter(object):
    """
    Represents a single property for a pipeline component
    """

    def __init__(self, id: str,
                 name: str,
                 data_type: str,
                 value: str,
                 description: str,
                 required: bool = False,
                 control: str = "custom",
                 control_id: str = "StringControl",
                 items: Optional[List[str]] = None):
        """
        :param id: Unique identifier for a property
        :param name: The name of the property for display
        :param data_type: The type that the property value takes on
        :param value: The default value of the property
        :param description: A description of the property for display
        :param control: The control of the property on the display, e.g. custom or readonly
        :param control_id: The control type of the property, if the control is 'custom', e.g. StringControl, EnumControl
        :param items: For properties with a control of 'EnumControl', the items making up the enum
        :param required: Whether the property is required
        """

        if not id:
            raise ValueError("Invalid component: Missing field 'id'.")
        if not name:
            raise ValueError("Invalid component: Missing field 'name'.")

        self._ref = id
        self._name = name
        self._data_type = data_type
        self._value = value

        self._description = description
        self._control = control
        self._control_id = control_id
        self._items = items or []

        # Check description for information about 'required' parameter
        if "not optional" in description.lower() or \
                ("required" in description.lower() and
                    "not required" not in description.lower() and
                    "n't required" not in description.lower()):
            required = True

        self._required = required

    @property
    def ref(self) -> str:
        return self._ref

    @property
    def name(self) -> str:
        return self._name

    @property
    def data_type(self) -> str:
        return self._data_type

    @property
    def value(self) -> str:
        return self._value

    @property
    def description(self) -> str:
        return self._description

    @property
    def control(self) -> str:
        return self._control

    @property
    def control_id(self) -> str:
        return self._control_id

    @property
    def items(self) -> List[str]:
        return self._items

    @property
    def required(self) -> bool:
        return bool(self._required)


class Component(object):
    """
    Represents a generic or runtime-specific component
    """

    def __init__(self, id: str, name: str,
                 description: Optional[str],
                 location_type: str,
                 location: str,
                 runtime: Optional[str] = None,
                 op: Optional[str] = None,
                 categories: Optional[List[str]] = None,
                 properties: Optional[List[ComponentParameter]] = None,
                 extensions: Optional[List[str]] = None,
                 parameter_refs: Optional[dict] = None):
        """
        :param id: Unique identifier for a component
        :param name: The name of the component for display
        :param description: The description of the component
        :param location_type: Indicates the type of component definition resource
                              location; one of ['url', filename', 'directory]
        :param location: The location of the component definition
        :param runtime: The runtime of the component (e.g. KFP or Airflow)
        :param op: The operation name of the component; used by generic components in rendering the palette
        :param categories: A list of categories that this component belongs to
        :param properties: The set of properties for the component
        :param extensions: The file extension used by the component
        """

        if not id:
            raise ValueError("Invalid component: Missing field 'id'.")
        if not name:
            raise ValueError("Invalid component: Missing field 'name'.")

        self._id = id
        self._name = name
        self._description = description
        self._location_type = location_type
        self._location = location

        self._runtime = runtime
        self._op = op
        self._categories = categories or []
        self._properties = properties

        if not parameter_refs:
            if self._location_type == "elyra":
                parameter_refs = {
                    "filehandler": "filename"
                }
            else:
                parameter_refs = {}

        if extensions and not parameter_refs.get('filehandler'):
            Component._log_warning(f"Component '{self._id}' specifies extensions '{extensions}' but \
                                   no entry in the 'parameter_ref' dictionary for 'filehandler' and \
                                   cannot participate in drag and drop functionality as a result.")

        self._extensions = extensions
        self._parameter_refs = parameter_refs

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> Optional[str]:
        return self._description

    @property
    def location_type(self) -> str:
        return self._location_type

    @property
    def location(self) -> str:
        return self._location

    @property
    def runtime(self) -> Optional[str]:
        return self._runtime

    @property
    def op(self) -> Optional[str]:
        if self._op:
            return self._op
        else:
            return self._id

    @property
    def categories(self) -> List[str]:
        return self._categories

    @property
    def properties(self) -> Optional[List[ComponentParameter]]:
        return self._properties

    @property
    def extensions(self) -> Optional[List[str]]:
        return self._extensions

    @property
    def parameter_refs(self) -> dict:
        return self._parameter_refs

    @staticmethod
    def _log_warning(msg: str, logger: Optional[Logger] = None):
        if logger:
            logger.warning(msg)
        else:
            print(f"WARNING: {msg}")


class ComponentReader(LoggingConfigurable):
    """
    Abstract class to model component_entry readers that can read components from different locations
    """
    location_type: str = None

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
        return self.location_type

    @abstractmethod
    def read_component_definition(self,
                                  location: str,
                                  location_to_def: Dict[str, str]) -> Dict[str, str]:
        """
        Read an absolute location to get the contents of a component specification file

        :param location: an absolute path to the specification file to read
        :param location_to_def: a mapping of component locations to file contents

        :returns: the given 'location_to_def' object, optionally including a new
                  key-value pair if the given component location is successfully read
        """
        raise NotImplementedError()

    def read_component_definitions(self, locations: List[str]) -> Dict[str, str]:
        """
        This function starts a number of threads ('max_reader' or fewer) that read component
        definitions in parallel.

        The 'location_to_def' variable is a mapping of a component location to its content.
        As a mutable object, this dictionary provides a means to retrieve a return value for
        each thread. If a thread is able to successfully read the content of the given
        component file location, a location-to-content mapping is added to 'location_to_def'.
        """
        location_to_def = {}

        loc_q = Queue()
        for location in self.get_absolute_locations(locations):
            loc_q.put_nowait(location)

        def read_with_thread():
            """Get a location from the queue and read contents"""
            while not loc_q.empty():
                try:
                    self.log.debug("Retrieving component definition file location from queue...")
                    loc = loc_q.get(timeout=.1)
                except Empty:
                    continue

                try:
                    self.log.debug(f"Attempting read of component definition file at location '{loc}'...")
                    self.read_component_definition(loc, location_to_def)
                except Exception:
                    self.log.warning(f"Could not read component definition file at location '{loc}'. Skipping...")

                loc_q.task_done()

        # Start 'max_reader' reader threads if registry includes more than 'max_reader'
        # number of locations, else start one thread per location
        num_threads = min(loc_q.qsize(), self.max_readers)
        for i in range(num_threads):
            Thread(target=read_with_thread).start()

        # Wait for all queued locations to be processed
        loc_q.join()

        return location_to_def

    @abstractmethod
    def get_absolute_locations(self, paths: List[str]) -> List[str]:
        """
        Returns a list of absolute paths to component specification file(s)
        based on the array of potentially relative locations given
        """
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    """
    Read a singular component definition from the local filesystem
    """
    location_type = 'filename'

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
                                  location: str,
                                  location_to_def: Dict[str, str]) -> Dict[str, str]:
        if not os.path.exists(location):
            self.log.warning(f"Invalid location for component: {location}")
        else:
            with open(location, 'r') as f:
                location_to_def[location] = f.read()

        return location_to_def

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
    location_type = 'directory'

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
    location_type = 'url'

    def read_component_definition(self,
                                  location: str,
                                  location_to_def: Dict[str, str]) -> Dict[str, str]:
        try:
            res = requests.get(location)
        except Exception as e:
            self.log.warning(f"Failed to connect to URL for component: {location}: {str(e)}")
        else:
            if res.status_code != HTTPStatus.OK:
                self.log.warning(f"Invalid location for component: {location} (HTTP code {res.status_code})")
            else:
                location_to_def[location] = res.text

        return location_to_def

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


class ComponentParser(LoggingConfigurable):  # ABC
    _component_platform = None

    @property
    def component_platform(self) -> str:
        return self._component_platform

    @property
    def file_types(self) -> List[str]:
        return self._file_types

    @abstractmethod
    def parse(self, registry_entry: SimpleNamespace) -> Optional[List[Component]]:
        """
        Parse a component definition given in the registry entry and return
        a list of fully-qualified Component objects
        """
        raise NotImplementedError()

    def get_component_id(self, location: str, name: str) -> str:
        """
        Get a unique id for a component based on its file basename and
        it's given name.
        """
        file_basename = os.path.basename(location)
        filename = os.path.splitext(file_basename)[0]
        component_name = f"{filename}_{name.replace(' ', '')}"
        return component_name

    def _format_description(self, description: str, data_type: str) -> str:
        """
        Adds parameter type information parsed from component specification
        to parameter description.
        """
        if description:
            return f"{description} (type: {data_type})"
        return f"(type: {data_type})"

    def determine_type_information(self, parsed_type: str) -> SimpleNamespace:
        """
        Takes the type information of a component parameter as parsed from the component
        specification and returns a new type that is one of several standard options.

        """
        parsed_type_lowered = parsed_type.lower()

        data_type_info: SimpleNamespace

        # Determine if this is a "container type"
        # Prefer types that occur in a clause of the form "[type] of ..." (i.e., "container" types)
        # E.g. "a dictionary of key/value pairs" will produce the type "dictionary"
        container_types = ['dictionary', 'dict', 'set', 'list', 'array', 'arr']
        for option in container_types:
            if option in parsed_type_lowered:
                data_type = option
                if data_type in ['dict', 'dictionary']:
                    data_type = "dictionary"
                elif data_type in ['list', 'set', 'array', 'arr']:
                    data_type = "list"

                # Since we know the type, create our return value and bail
                data_type_info = ComponentParser.create_data_type_info(parsed_data=parsed_type_lowered,
                                                                       data_type=data_type)
                break
        else:  # None of the container types were found...
            # Standardize type names
            if any(word in parsed_type_lowered for word in ["str", "string"]):
                data_type_info = ComponentParser.create_data_type_info(parsed_data=parsed_type_lowered,
                                                                       data_type="string")
            elif any(word in parsed_type_lowered for word in ['int', 'integer', 'number']):
                data_type_info = ComponentParser.create_data_type_info(parsed_data=parsed_type_lowered,
                                                                       data_type="number",
                                                                       control_id="NumberControl",
                                                                       default_value=0)
            elif any(word in parsed_type_lowered for word in ['bool', 'boolean']):
                data_type_info = ComponentParser.create_data_type_info(parsed_data=parsed_type_lowered,
                                                                       data_type="boolean",
                                                                       control_id="BooleanControl",
                                                                       default_value=False)
            else:  # Let this be undetermined.  Callers should check for this status and adjust
                data_type_info = ComponentParser.create_data_type_info(parsed_data=parsed_type_lowered,
                                                                       data_type="string",
                                                                       undetermined=True)

        return data_type_info

    @staticmethod
    def create_data_type_info(parsed_data: str,
                              data_type: str = 'string',
                              default_value: Any = '',
                              required: bool = True,
                              control_id: str = 'StringControl',
                              control: str = 'custom',
                              undetermined: bool = False) -> SimpleNamespace:
        """Returns a SimpleNamespace instance that contains the current state of data-type parsing.

        This method is called by ComponentParser.determine_type_information() and used by subclass
        implementations to determine the current state of parsing a data-type.

        The instance will indicate that the base ComponentParser could not determine the actual data-type
        via a `True` value in its `undetermined` attribute, in which case subclass implementations
        are advised to attempt further parsing. In such cases, the rest of the attributes of the instance
        will reflect a 'string' data type as that is the most flexible data_type and, hence, the default.
        """
        dti = SimpleNamespace(parsed_data=parsed_data,
                              data_type=data_type,
                              default_value=default_value,
                              required=required,
                              control_id=control_id,
                              control=control,
                              undetermined=undetermined)
        return dti
