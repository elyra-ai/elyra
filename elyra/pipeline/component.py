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
import os
from typing import List
from typing import Optional

import requests
from traitlets.config import LoggingConfigurable


class ComponentProperty(object):
    """
    Represents a single property for a pipeline component
    """

    ref: str
    name: str
    type: str
    value: str
    description: str
    control: str
    control_id: str
    items: list
    required: bool

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
    def ref(self):
        return self._ref

    @property
    def name(self):
        return self._name

    @property
    def type(self):
        return self._type

    @property
    def value(self):
        return self._value

    @property
    def description(self):
        return self._description

    @property
    def control(self):
        return self._control

    @property
    def control_id(self):
        return self._control_id

    @property
    def items(self):
        return self._items

    @property
    def required(self):
        if self._required:
            return self._required
        else:
            return False


class Component(object):
    """
    Represents a runtime-specific component
    """

    id: str
    name: str
    description: str
    runtime: str
    properties: List[ComponentProperty]
    op: str
    extension: str

    def __init__(self, id: str, name: str, description: Optional[str], runtime: Optional[str] = None,
                 properties: Optional[List[ComponentProperty]] = None, op: Optional[str] = None,
                 extension: str = None):
        """
        :param id: Unique identifier for a component
        :param name: The name of the component for display
        :param description: The description of the component
        :param runtime: The runtime of the component (e.g. KFP or Airflow)
        :param properties: The set of properties for the component
        :type properties: List[ComponentProperty]
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
        self._runtime = runtime
        self._properties = properties
        self._op = op
        self._extension = extension

    @property
    def id(self):
        return self._id

    @property
    def name(self):
        return self._name

    @property
    def description(self):
        return self._description

    @property
    def runtime(self):
        return self._runtime

    @property
    def properties(self):
        return self._properties

    @property
    def op(self):
        if self._op:
            return self._op
        else:
            return self._id

    @property
    def extension(self):
        return self._extension


class ComponentReader(LoggingConfigurable):
    """
    Abstract class to model component_entry readers that can read components from different locations
    """
    type: str = None

    @property
    def type(self) -> str:
        return self.type

    @abstractmethod
    def read_component_definition(self, component_id: str, location: str) -> str:
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    """
    Read a component definition from the local filesystem
    """
    type = 'filename'

    def read_component_definition(self, component_id: str, location: str) -> str:
        component_location = os.path.join(os.path.dirname(__file__), location)
        if not os.path.exists(component_location):
            self.log.error(f'Invalid location for component: {component_id} -> {component_location}')
            raise FileNotFoundError(f'Invalid location for component: {component_id} -> {component_location}')

        with open(component_location, 'r') as f:
            return f.read()


class UrlComponentReader(ComponentReader):
    """
    Read a component definition from a url
    """
    type = 'url'

    def read_component_definition(self, component_id: str, location: str) -> str:
        res = requests.get(location)
        if res.status_code != HTTPStatus.OK:
            self.log.error (f'Invalid location for component: {component_id} -> {location} (HTTP code {res.status_code})')  # noqa: E211 E501
            raise FileNotFoundError (f'Invalid location for component: {component_id} -> {location} (HTTP code {res.status_code})')  # noqa: E211 E501

        return res.text


class ComponentParser(LoggingConfigurable):  # ABC
    _readers = {
        FilesystemComponentReader.type: FilesystemComponentReader(),
        UrlComponentReader.type: UrlComponentReader()
    }

    @abstractmethod
    def parse(self, registry_entry) -> List[Component]:
        raise NotImplementedError()

    def _get_reader(self, component_entry):
        """
        Find the proper reader based on the given registry component entry.
        """
        if not component_entry:
            raise ValueError("Missing component entry.")

        try:
            return self._readers.get(component_entry.type)
        except Exception:
            raise ValueError(f'Unsupported registry type {component_entry.type}.')
