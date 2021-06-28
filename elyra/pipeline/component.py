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
from traitlets.config import LoggingConfigurable
from typing import List, Optional


class ComponentProperty(object):
    """
    Represents a single property for a pipeline component_id
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
            raise ValueError("Invalid component_id: Missing field 'ref'.")
        if not name:
            raise ValueError("Invalid component_id: Missing field 'name'.")

        self._ref = ref
        self._name = name

        # Set default value according to type
        if type == 'str' or type.lower() == 'string':
            if not value:
                value = ''
        elif type == 'int' or type.lower() == 'integer':
            if not value:
                value = 0
        elif type == 'bool' or type.lower() == 'boolean':
            if not value:
                value = False
        elif type == 'dict' or type.lower() == 'dictionary':
            if not value:
                value = ''
        elif type.lower() == 'list':
            if not value:
                value = ''
        else:
            type = "string"
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

        # Change control id based on type
        if type.lower() in ["number", "integer", "int"]:
            control_id = "NumberControl"
        elif type.lower() in ["bool", "boolean"]:
            control_id = "BooleanControl"

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
    Represents a runtime-specific component_id
    """

    id: str
    name: str
    description: str
    runtime: str
    properties: List[ComponentProperty]
    op: str

    def __init__(self, id: str, name: str, description: Optional[str], runtime: Optional[str] = None,
                 properties: Optional[List[ComponentProperty]] = None, op: Optional[str] = None):
        """
        :param id: Unique identifier for a component_id
        :param name: The name of the component_id for display
        :param description: The description of the component_id
        :param runtime: The runtime of the component_id (e.g. KFP or Airflow)
        :param properties: The set of properties for the component_id
        :type properties: List[ComponentProperty]
        :param op: The operation name of the component_id; used by generic components in rendering the palette
        """

        if not id:
            raise ValueError("Invalid component_id: Missing field 'id'.")
        if not name:
            raise ValueError("Invalid component_id: Missing field 'name'.")

        self._id = id
        self._name = name
        self._description = description
        self._runtime = runtime
        self._properties = properties
        self._op = op

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


def get_id_from_name(name):
    """
    Takes the lowercase name of a component_id and removes '-' and redundant spaces by splitting and
    then rejoining on spaces. Spaces and underscores are finally replaced with '-'.
    """
    return ' '.join(name.lower().replace('-', '').split()).replace(' ', '-').replace('_', '-')


class ComponentParser(LoggingConfigurable):  # ABC

    @abstractmethod
    def parse(self, component_name, component_definition):
        raise NotImplementedError()

    @abstractmethod
    def parse_properties(self, component_definition, location, source_type):
        raise NotImplementedError

    def parse_component_details(self, component, component_name=None):
        """Get component_id name, id, description for palette JSON"""
        raise NotImplementedError

    def parse_component_properties(self, component_body, component_path):
        """Get component_id properties for properties JSON"""
        raise NotImplementedError
