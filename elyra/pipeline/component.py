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
import ast
from http import HTTPStatus
from logging import Logger
import os
from typing import List
from typing import Optional

import requests
from traitlets.config import LoggingConfigurable


class ComponentParameter(object):
    """
    Represents a single property for a pipeline component
    """

    def __init__(self, ref: str, name: str, type: str, value: str, description: str, required: bool = False,
                 control: str = "custom", control_id: str = "StringControl", items: List[str] = []):
        """
        :param ref: Unique identifier for a property
        :param name: The name of the property for display
        :param type: The type that the property value takes on
        :param value: The default value of the property
        :param description: A description of the property for display
        :param control: The control of the property on the display, e.g. custom or readonly
        :param control_id: The control type of the property, if the control is 'custom', e.g. StringControl, EnumControl
        :param items: For properties with a control of 'EnumControl', the items making up the enum
        :param required: Whether the property is required
        """

        if not ref:
            raise ValueError("Invalid component: Missing field 'ref'.")
        if not name:
            raise ValueError("Invalid component: Missing field 'name'.")

        self._ref = ref
        self._name = name

        # Set default value according to type
        type_lowered = type.lower()
        if type_lowered in ['str', 'string']:
            control_id = "StringControl"
            type = 'string'
            if not value:
                value = ''
        elif type_lowered in ['int', 'integer', 'number']:
            control_id = "NumberControl"
            if not value:
                value = 0
        elif type_lowered in ['bool', 'boolean']:
            control_id = "BooleanControl"
            if not value:
                value = False
            else:
                value = ast.literal_eval(str(value))
        elif type_lowered in ['dict', 'dictionary']:
            if not value:
                value = ''
        elif type_lowered in ['list']:
            if not value:
                value = ''
        elif type_lowered in ['file']:
            if not value:
                value = ''
        else:
            type = 'string'
            if not value:
                value = ''

        self._type = type
        self._value = value

        # Add type information to description as hint
        if ref.startswith("elyra_path_"):
            if type == "string":
                description += " (type: path)"
            else:
                description += f" (type: path to {type})"
        else:
            description += f" (type: {type})"

        self._description = description
        self._control = control
        self._control_id = control_id
        self._items = items

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
        if self._required:
            return self._required
        else:
            return False


class Component(object):
    """
    Represents a runtime-specific component
    """

    def __init__(self, id: str, name: str, description: Optional[str], source_type: str,
                 source: str, runtime: Optional[str] = None, op: Optional[str] = None,
                 properties: Optional[List[ComponentParameter]] = None,
                 extensions: Optional[List[str]] = None,
                 filehandler_parameter_ref: Optional[str] = None):
        """
        :param id: Unique identifier for a component
        :param name: The name of the component for display
        :param description: The description of the component
        :param runtime: The runtime of the component (e.g. KFP or Airflow)
        :param properties: The set of properties for the component
        :type properties: List[ComponentParameter]
        :param op: The operation name of the component; used by generic components in rendering the palette
        :param extension: The file extension used by the component
        :type extension: str
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
        self._properties = properties

        if self._source_type == "elyra" and not filehandler_parameter_ref:
            filehandler_parameter_ref = "filename"

        if extensions and not filehandler_parameter_ref:
            Component._log_warning(f"Component '{self._id}' specifies extensions '{extensions}' but \
                                   no 'filehandler_parameter_ref' value and cannot participate in \
                                   drag and drop functionality as a result.")

        self._extensions = extensions
        self._filehandler_parameter_ref = filehandler_parameter_ref

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
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
    def properties(self) -> Optional[List[ComponentParameter]]:
        return self._properties

    @property
    def extensions(self) -> Optional[List[str]]:
        return self._extensions

    @property
    def filehandler_parameter_ref(self) -> Optional[str]:
        return self._filehandler_parameter_ref

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

    @abstractmethod
    def read_component_definition(self, registry_entry: dict) -> str:
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    """
    Read a component definition from the local filesystem
    """
    type = 'filename'

    def read_component_definition(self, registry_entry: dict) -> Optional[str]:
        component_path = os.path.join(os.path.dirname(__file__), "resources", registry_entry.location)
        if not os.path.exists(component_path):
            self.log.warning(f"Invalid location for component: {registry_entry.id} -> {component_path}")
            return None

        with open(component_path, 'r') as f:
            return f.read()


class UrlComponentReader(ComponentReader):
    """
    Read a component definition from a url
    """
    type = 'url'

    def read_component_definition(self, registry_entry: dict) -> Optional[str]:
        try:
            res = requests.get(registry_entry.location)
        except Exception as e:
            self.log.warning(f"Failed to connect to URL for component: {registry_entry.id} -> " +
                             f"{registry_entry.location}: {str(e)}")
            return None

        if res.status_code != HTTPStatus.OK:
            self.log.warning(f"Invalid location for component: {registry_entry.id} -> {registry_entry.location} " +
                             f"(HTTP code {res.status_code})")
            return None

        return res.text


class ComponentParser(LoggingConfigurable):  # ABC
    _readers = {
        FilesystemComponentReader.type: FilesystemComponentReader(),
        UrlComponentReader.type: UrlComponentReader()
    }

    @abstractmethod
    def parse(self, registry_entry: dict) -> List[Component]:
        raise NotImplementedError()

    def get_adjusted_component_id(self, component_id: str) -> str:
        return component_id

    def _get_reader(self, component_entry: dict) -> ComponentReader:
        """
        Find the proper reader based on the given registry component entry.
        """
        if not component_entry:
            raise ValueError("Missing component entry.")

        try:
            return self._readers.get(component_entry.type)
        except Exception:
            raise ValueError(f'Unsupported registry type {component_entry.type}.')
