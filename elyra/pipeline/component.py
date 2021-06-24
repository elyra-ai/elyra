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
from abc import ABC, abstractmethod
from traitlets.config import LoggingConfigurable
from typing import List, Optional


cardinality = {
    'min': 0,
    'max': -1
}

inputs = {
    "id": "inPort",
    "app_data": {
        "ui_data": {
            "cardinality": cardinality,
            "label": "Input Port"
        }
    }
}

outputs = {
    "id": "outPort",
    "app_data": {
        "ui_data": {
            "cardinality": cardinality,
            "label": "Output Port"
        }
    }
}

empty_properties = {
    "current_parameters": {"component_source": "", "runtime_image": "", "component_source_type": ""},
    "parameters": [{"id": "component_source"}, {"id": "runtime_image"}, {"id": "component_source_type"}],
    "uihints": {
        "id": "nodeProperties",
        "parameter_info": [
            {
                "parameter_ref": "component_source",
                "control": "readonly",
                "label": {
                    "default": "Path to Component"
                },
                "description": {
                    "default": "The path to the component specification file.",
                    "placement": "on_panel"
                },
                "data": {
                    "format": "string"
                }
            },
            {
                "parameter_ref": "runtime_image",
                "control": "custom",
                "custom_control_id": "EnumControl",
                "label": {
                    "default": "Runtime Image"
                },
                "description": {
                    "default": "Docker image used as execution environment.",
                    "placement": "on_panel"
                },
                "data": {
                    "items": [],
                    "required": True
                }
            },
            {
                "parameter_ref": "component_source_type",
                "control": "readonly",
                "label": {
                    "default": "Component Source Type"
                },
                "data": {
                    "format": "string"
                }
            }
        ],
        "group_info": [
            {
                "id": "nodeGroupInfo",
                "type": "panels",
                "group_info": [
                    {"id": "component_source", "type": "controls", "parameter_refs": ["component_source"]},
                    {"id": "runtime_image", "type": "controls", "parameter_refs": ["runtime_image"]},
                    {"id": "component_source_type", "type": "controls", "parameter_refs": ["component_source_type"]}
                ]
            }
        ]
    },
    "resources": {}
}



class Property(object):

    name: str
    type: str
    value: str
    required: bool


class Component(object):
    """
    Reoresents a runtime specific component
    """

    id: str
    name: str
    description: str
    runtime: str
    properties: List[Property]

    def __init__(self, id: str, name: str, description: str, runtime: Optional[str] = None, properties: List[Property]=None):
        self._id = id
        self._name = name
        self._description = description
        self._runtime = runtime
        self._properties = properties


def get_id_from_name(name):
    """
    Takes the lowercase name of a component and removes '-' and redundant spaces by splitting and
    then rejoining on spaces. Spaces and underscores are finally replaced with '-'.
    """
    return ' '.join(name.lower().replace('-', '').split()).replace(' ', '-').replace('_', '-')


def set_node_type_data(id, label, description):
    node_type = {
        'id': "",
        'op': id,
        'type': "execution_node",
        'inputs': [inputs],
        'outputs': [outputs],
        'parameters': {},
        'app_data': {
            'ui-data': {
                'label': label,
                'description': description,
                'image': "",
                'x_pos': 0,
                'y_pos': 0
            }
        }
    }

    return node_type


class ComponentParser(LoggingConfigurable):  # ABC

    @abstractmethod
    def parse(self, component_name, component_definition):
        raise NotImplementedError()

    def parse_component_details(self, component, component_name=None):
        """Get component name, id, description for palette JSON"""
        raise NotImplementedError

    def parse_component_properties(self, component_body, component_path):
        """Get component properties for properties JSON"""
        raise NotImplementedError

    def get_custom_control_id(self, parameter_type):
        # This may not be applicable in every case
        if parameter_type in ["number", "integer"]:
            return "NumberControl"
        elif parameter_type in ["bool", "boolean"]:
            return "BooleanControl"
        # elif "array" in parameter_type:
        #     return "StringArrayControl"
        else:
            return "StringControl"

    def compose_parameter(self, name, control_id, label, description, data):
        formatted_description = "" if not description else description[0].upper() + description[1:]
        parameter = {
            'parameter_ref': name.lower().replace(' ', '_'),
            'control': "custom",
            'custom_control_id': control_id,
            'label': {
                'default': label
            },
            'description': {
                'default': formatted_description,
                'placement': "on_panel"
            },
            "data": data
        }

        return parameter
