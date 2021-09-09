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
        input_params = component_yaml.get('inputs', [])
        for param in input_params:
            # KFP components default to being required unless otherwise stated.
            # Reference: https://www.kubeflow.org/docs/components/pipelines/reference/component-spec/#interface
            required = True
            if "optional" in param and param.get('optional') is True:
                required = False

            # Assign type, default to string
            data_type = param.get('type', 'string')

            # Set description and include parsed type information
            description = self._format_description(description=param.get('description', ''),
                                                   data_type=data_type)

            # Change type to reflect the type of input (inputValue vs inputPath)
            data_type = self._get_adjusted_parameter_fields(component_body=component_yaml,
                                                            io_object_name=param.get('name'),
                                                            io_object_type="input",
                                                            parameter_type=data_type)

            data_type, control_id, default_value = self.determine_type_information(data_type)

            # Get value if provided
            value = param.get('default', '')

            ref = param.get('name').lower().replace(' ', '_')
            properties.append(ComponentParameter(id=ref,
                                                 name=param.get('name'),
                                                 data_type=data_type,
                                                 value=(value or default_value),
                                                 description=description,
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
                        adjusted_type = "file"
            if "args" in component_body['implementation']['container']:
                for arg in component_body['implementation']['container']['args']:
                    if isinstance(arg, dict) and list(arg.values())[0] == io_object_name and \
                            list(arg.keys())[0] == f"{io_object_type}Path":
                        adjusted_type = "file"

        return adjusted_type
