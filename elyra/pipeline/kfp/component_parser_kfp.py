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
from types import SimpleNamespace
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

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

                # Assign parsed data type (default to string)
                data_type_parsed = param.get('type', 'string')

                # Change type to reflect the parameter type (inputValue vs inputPath vs outputPath)
                data_type_adjusted = data_type_parsed
                if self._is_path_based_parameter(param.get('name'), component_yaml):
                    data_type_adjusted = f"{param_type[:-1]}Path"

                data_type_info = self.determine_type_information(data_type_adjusted)
                if data_type_info.undetermined:
                    self.log.debug(f"Data type from parsed data ('{data_type_parsed}') could not be determined. "
                                   f"Proceeding as if 'string' was detected.")

                if not data_type_info.required:
                    required = data_type_info.required

                # Get value if provided
                value = param.get('default', '')

                # Set parameter ref (id) and display name
                ref_name = param.get('name').lower().replace(' ', '_')
                display_name = param.get('name')

                description = param.get('description', '')
                if data_type_info.data_type != 'inputpath':
                    # Add parsed data type hint to description in parenthesis
                    description = self._format_description(description=description,
                                                           data_type=data_type_parsed)

                if data_type_info.data_type == 'outputpath':
                    ref_name = f"output_{ref_name}"
                    # Add sentence to description to clarify that paraeter is an output
                    description = f"This is an output of this component. {description}"

                properties.append(ComponentParameter(id=ref_name,
                                                     name=display_name,
                                                     data_type=data_type_info.data_type,
                                                     value=(value or data_type_info.default_value),
                                                     description=description,
                                                     control=data_type_info.control,
                                                     control_id=data_type_info.control_id,
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
            self.log.warning(f"Could not read definition for component at "
                             f"location: '{registry_entry.location}' -> {str(e)}")
            return None

    def _is_path_based_parameter(self, parameter_name: str, component_body: Dict[str, Any]) -> bool:
        """
        Check whether parameter is a KFP path parameter (as opposed to a value parameter)

        :param parameter_name: the name of the parameter that will be checked
        :param component_body: the component YAML contents
        """
        # Get component_body['implementation']['container'] sub-dictionary if it exists
        component_impl = component_body.get('implementation', {}).get('container', {})

        # Get list of component commands/arguments
        commands_and_args = component_impl.get("command", []) + component_impl.get("args", [])

        # Loop through dictionary-types only; parameter-based fields will
        # always be of the format {'inputPath': 'parameter name'}
        for param_dict in [c for c in commands_and_args if isinstance(c, dict)]:
            # Check the (single-element) list of values for a
            # match on the full parameter name given
            if parameter_name in list(param_dict.values()):
                # Check whether the first (and only) key contains the
                # phrase "Path", e.g. inputPath or outputPath
                if "Path" in list(param_dict.keys())[0]:
                    return True
                # Otherwise, assume inputValue for this parameter name
                # and do not proceed to check other parameter dicts
                break

        return False

    def determine_type_information(self, parsed_type: str) -> SimpleNamespace:
        """
        Takes the type information of a component parameter as parsed from the component
        specification and returns a new type that is one of several standard options.

        """
        data_type_info = super().determine_type_information(parsed_type)
        if data_type_info.undetermined:
            if 'inputpath' in data_type_info.parsed_data:
                data_type_info.data_type = 'inputpath'
                data_type_info.control_id = "NestedEnumControl"
                data_type_info.undetermined = False
                data_type_info.default_value = None
            elif 'inputvalue' in data_type_info.parsed_data:
                data_type_info.data_type = 'inputvalue'
                data_type_info.undetermined = False
            elif 'outputpath' in data_type_info.parsed_data:
                data_type_info.data_type = 'outputpath'
                data_type_info.required = False
                data_type_info.control = "readonly"
                data_type_info.undetermined = False

        return data_type_info
