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
import re
from types import SimpleNamespace
from typing import Any
from typing import List
from typing import Optional
from typing import Tuple

from jupyter_core.paths import ENV_JUPYTER_PATH
import requests
from traitlets.config import LoggingConfigurable


class ComponentParameter(object):
    """
    Represents a single property for a pipeline component
    """

    def __init__(self, id: str, name: str, type: str, value: str, description: str, required: bool = False,
                 control: str = "custom", control_id: str = "StringControl", items: Optional[List[str]] = None):
        """
        :param id: Unique identifier for a property
        :param name: The name of the property for display
        :param type: The type that the property value takes on
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
        self._type = type
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
    def type(self) -> str:
        return self._type

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
                 source_type: str,
                 source: str,
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
        :param source_type: Indicates the type of component definition resource location; one of ['url', filename']
        :param source: The location of the component definition
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
        self._source_type = source_type
        self._source = source

        self._runtime = runtime
        self._op = op
        self._category_ids = categories
        self._properties = properties

        if not parameter_refs:
            if self._source_type == "elyra":
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
    def source_type(self) -> str:
        return self._source_type

    @property
    def source(self) -> str:
        return self._source

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
    def categories(self) -> Optional[List[str]]:
        if not self._category_ids:
            return []
        return self._category_ids

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
    type: str = None

    @property
    def type(self) -> str:
        return self.type

    @property
    def base_type(self):
        return self.type

    @abstractmethod
    def read_component_definition(self, location: str) -> Optional[str]:
        """
        Read an absolute location to get the contents of a component
        specification file
        """
        raise NotImplementedError()

    @abstractmethod
    def get_list_of_paths(self, location: str, parser_file_types: List[str]) -> List[str]:
        """
        Returns a list of absolute paths to component specification file(s)
        based on the relative location given
        """
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    """
    Read a singular component definition from the local filesystem
    """
    type = 'filename'

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

    def read_component_definition(self, location: str) -> Optional[str]:
        if not os.path.exists(location):
            self.log.warning(f"Invalid location for component: {location}")
            return None

        with open(location, 'r') as f:
            return f.read()

    def get_list_of_paths(self, location: str, parser_file_types: List[str]) -> List[str]:
        filepath = self.determine_location(location)
        if not os.path.exists(filepath):
            self.log.warning(f"File does not exist -> {filepath}")
            return []
        return [filepath]


class DirectoryComponentReader(FilesystemComponentReader):
    """
    Read component definitions from a local directory
    """
    type = 'directory'

    def get_list_of_paths(self, location: str, parser_file_types: List[str]) -> List[str]:
        paths = []
        dirpath = self.determine_location(location)
        if not os.path.exists(dirpath):
            self.log.warning(f"Invalid directory -> {dirpath}")
            return paths

        for filename in os.listdir(dirpath):
            if filename.endswith(tuple(parser_file_types)):
                paths.append(os.path.join(dirpath, filename))

        return paths

    @property
    def base_type(self):
        return super().type


class UrlComponentReader(ComponentReader):
    """
    Read a singular component definition from a url
    """
    type = 'url'

    def read_component_definition(self, location: str) -> Optional[str]:
        try:
            res = requests.get(location)
        except Exception as e:
            self.log.warning(f"Failed to connect to URL for component: {location}: {str(e)}")
            return None

        if res.status_code != HTTPStatus.OK:
            self.log.warning(f"Invalid location for component: {location} (HTTP code {res.status_code})")
            return None

        return res.text

    def get_list_of_paths(self, location: str, parser_file_types: List[str]) -> List[str]:
        return [location]


class GitHubComponentReader(UrlComponentReader):
    """
    Read component definitions from a github repo
    """
    type = 'github'

    def get_list_of_paths(self, location: str, parser_file_types: List[str]) -> List[str]:
        pass

    @property
    def base_type(self):
        return super().type


class ComponentParser(LoggingConfigurable):  # ABC
    _type = None
    _file_types = None

    @property
    def type(self) -> str:
        return self._type

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

    def _format_description(self, description: str, type: str) -> str:
        """
        Adds type information parsed from component specification to parameter description.
        """
        if description:
            return f"{description} (type: {type})"
        return f"(type: {type})"

    def determine_type_information(self, parsed_type: str) -> Tuple[str, str, Any]:
        """
        Takes the type information of a component parameter as parsed from the component
        specification and returns a new type that is one of several standard options.

        """
        type_lowered = parsed_type.lower()
        type_options = ['dictionary', 'dict', 'set', 'list', 'array', 'arr']

        # Prefer types that occur in a clause of the form "[type] of ..."
        # E.g. "a dictionary of key/value pairs" will produce the type "dictionary"
        for option in type_options:
            if any(word + " of " in type_lowered for word in type_options):
                reg = re.compile(f"({option}) of ")
                match = reg.search(type_lowered)
                if match:
                    type_lowered = option
                    break
            elif option in type_lowered:
                type_lowered = option
                break

        # Set control id and default value for UI rendering purposes
        # Standardize type names
        control_id = "StringControl"
        default_value = ''
        if any(word in type_lowered for word in ["str", "string"]):
            type_lowered = "string"
        elif any(word in type_lowered for word in ['int', 'integer', 'number']):
            type_lowered = "number"
            control_id = "NumberControl"
            default_value = 0
        elif any(word in type_lowered for word in ['bool', 'boolean']):
            type_lowered = "boolean"
            control_id = "BooleanControl"
            default_value = False
        elif type_lowered in ['dict', 'dictionary']:
            type_lowered = "dictionary"
        elif type_lowered in ['list', 'set', 'array', 'arr']:
            type_lowered = "list"
        elif type_lowered in ['file']:
            type_lowered = "file"
        else:
            type_lowered = "string"

        return type_lowered, control_id, default_value
