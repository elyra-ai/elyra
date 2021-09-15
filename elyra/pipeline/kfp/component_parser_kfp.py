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
import re
from types import SimpleNamespace
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

import yaml

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParameter
from elyra.pipeline.component import ComponentParser


class KfpComponentParser(ComponentParser):
    _component_platform = "kfp"
    _file_types = [".yaml"]

    def parse(self, registry_entry: SimpleNamespace) -> Optional[List[Component]]:
        # Get YAML object from component definition
        component_yaml = self._read_component_yaml(registry_entry)
        if not component_yaml:
            return None

        # Assign component_id and description
        component_id = self.get_component_id(registry_entry.location, component_yaml.get('name', ''))
        description = ""
        if component_yaml.get('description'):
            # Remove whitespace characters and replace with spaces
            description = ' '.join(component_yaml.get('description').split())

        component_properties = self._parse_properties(component_yaml)

        component = Component(id=component_id,
                              name=component_yaml.get('name'),
                              description=description,
                              runtime=self.component_platform,
                              location_type=registry_entry.location_type,
                              location=registry_entry.location,
                              properties=component_properties,
                              categories=registry_entry.categories)

        return [component]

    def _parse_properties(self, component_yaml: Dict[str, Any]) -> List[ComponentParameter]:
        properties: List[ComponentParameter] = list()

        # NOTE: Currently no runtime-specific properties are needed
        # properties.extend(self.get_runtime_specific_properties())

        # Then loop through and create custom properties
        # Get parameter sub-dictionaries from YAML object

        input_params = component_yaml.get('inputs', [])
        output_params = component_yaml.get('outputs', [])

        all_params = {"inputs": input_params, "outputs": output_params}

        # Loop through inputs and outputs and create custom properties
        for param_type, params in all_params.items():
            for param in params:
                # KFP components default to being required unless otherwise stated.
                # Reference: https://www.kubeflow.org/docs/components/pipelines/reference/component-spec/#interface
                required = True
                if param.get('optional') is True:
                    required = False

                # Assign type, default to string
                data_type = param.get('type', 'string')

                # Set description and include parsed type information
                description = self._format_description(description=param.get('description', ''),
                                                       data_type=data_type)

                # Change type to reflect the type of input (inputValue vs inputPath)
                data_type = self._get_adjusted_parameter_fields(component_body=component_yaml,
                                                                io_object_name=param.get('name'),
                                                                io_object_type=param_type[:-1],
                                                                parameter_type=data_type)

                type, control, control_id, required_param, default_value = self.determine_type_information(data_type)
                if not required_param:
                    required = required_param

                # Get value if provided
                value = param.get('default', '')

                ref_name = param.get('name').lower().replace(' ', '_')

                properties.append(ComponentParameter(id=ref_name,
                                                     name=param.get('name'),
                                                     data_type=data_type,
                                                     value=(value or default_value),
                                                     description=description,
                                                     control=control,
                                                     control_id=control_id,
                                                     required=required))
        return properties

    def get_runtime_specific_properties(self) -> List[ComponentParameter]:
        """
        Define properties that are common to the KFP runtime.
        """
        return [
            ComponentParameter(
                id="runtime_image",
                name="Runtime Image",
                data_type="string",
                value="",
                description="Docker image used as execution environment.",
                control="readonly",
                required=True,
            )
        ]

    def _read_component_yaml(self, registry_entry: SimpleNamespace) -> Optional[Dict[str, Any]]:
        """
        Convert component_definition string to YAML object
        """
        try:
            return yaml.safe_load(registry_entry.component_definition)
        except Exception as e:
            self.log.debug(f"Could not read definition for component at "
                           f"location: '{registry_entry.location}' -> {str(e)}")
            return None

    def _get_adjusted_parameter_fields(self,
                                       component_body: Dict[str, Any],
                                       io_object_name: str,
                                       io_object_type: str,
                                       parameter_type: str) -> str:
        """
        Change the parameter ref according if it is a KFP path parameter (as opposed to a value parameter)
        """
        adjusted_type = parameter_type
        if "implementation" in component_body and "container" in component_body['implementation']:
            if "command" in component_body['implementation']['container']:
                for command in component_body['implementation']['container']['command']:
                    if isinstance(command, dict) and list(command.values())[0] == io_object_name and \
                            list(command.keys())[0] == f"{io_object_type}Path":
                        adjusted_type = f"{io_object_type}Path"
            if "args" in component_body['implementation']['container']:
                for arg in component_body['implementation']['container']['args']:
                    if isinstance(arg, dict) and list(arg.values())[0] == io_object_name and \
                            list(arg.keys())[0] == f"{io_object_type}Path":
                        adjusted_type = f"{io_object_type}Path"

        return adjusted_type

    def determine_type_information(self, parsed_type: str) -> Tuple[str, str, str, bool, Any]:
        """
        Takes the type information of a component parameter as parsed from the component
        specification and returns a new type that is one of several standard options.

        """
        type_lowered = parsed_type.lower()
        type_options = ['dictionary', 'dict', 'set', 'list', 'array', 'arr', 'inputpath', 'inputvalue', 'outputpath']

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
        control = "custom"
        control_id = "StringControl"
        default_value = ''
        required_param = True
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
        elif type_lowered in ['inputpath']:
            type_lowered = "inputpath"
            control_id = "FoobarControl"
        elif type_lowered in ['inputvalue']:
            type_lowered = "inputvalue"
        elif type_lowered in ['outputpath']:
            control = "readonly"
            type_lowered = "outputpath"
            required_param = False
        else:
            type_lowered = "string"

        return type_lowered, control, control_id, required_param, default_value
