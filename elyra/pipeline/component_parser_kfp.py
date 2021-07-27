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
    _type = "kfp"

    def __init__(self):
        super().__init__()

    def parse(self, registry_entry: SimpleNamespace) -> Optional[List[Component]]:
        component_yaml = self._read_component_yaml(registry_entry)
        if not component_yaml:
            return None

        description = ""
        if component_yaml.get('description'):
            description = ' '.join(component_yaml.get('description').split())

        component_properties = self._parse_properties(component_yaml)

        component = Component(id=registry_entry.id,
                              name=component_yaml.get('name'),
                              description=description,
                              runtime=self._type,
                              source_type=registry_entry.type,
                              source=registry_entry.location,
                              catalog_entry_id=registry_entry.catalog_entry_id,
                              properties=component_properties,
                              category_id=registry_entry.category_id)
        return [component]

    def _parse_properties(self, component_yaml: Dict[str, Any]) -> List[ComponentParameter]:
        properties: List[ComponentParameter] = list()

        # NOTE: Currently no runtime-specific properties are needed
        # properties.extend(self.get_runtime_specific_properties())

        # Then loop through and create custom properties
        for param in component_yaml.get('inputs'):
            # KFP components default to being required unless otherwise stated.
            # Reference: https://www.kubeflow.org/docs/components/pipelines/reference/component-spec/#interface
            required = True
            if "optional" in param and param.get('optional') is True:
                required = False

            # Assign type, default to string
            type = param.get('type', 'string')

            # Set description and include parsed type information
            description = self._format_description(description=param.get('description', ''), type=type)

            # Change type to reflect the type of input (inputValue vs inputPath)
            type = self._get_adjusted_parameter_fields(component_body=component_yaml,
                                                       io_object_name=param.get('name'),
                                                       io_object_type="input",
                                                       parameter_type=type)

            type, control_id, default_value = self.determine_type_information(type)

            # Get value if provided
            value = param.get('default', '')

            ref = param.get('name').lower().replace(' ', '_')
            properties.append(ComponentParameter(id=ref,
                                                 name=param.get('name'),
                                                 type=type,
                                                 value=(value or default_value),
                                                 description=description,
                                                 control_id=control_id,
                                                 required=required))
        return properties

    def get_runtime_specific_properties(self) -> List[ComponentParameter]:
        """
        Define properties that are common to the KFP runtime.
        """
        properties = [ComponentParameter(id="runtime_image",
                                         name="Runtime Image",
                                         type="string",
                                         value="",
                                         description="Docker image used as execution environment.",
                                         control="readonly",
                                         required=True)]
        return properties

    def _read_component_yaml(self, registry_entry: SimpleNamespace) -> Optional[Dict[str, Any]]:
        """
        Convert component_body string to YAML object.
        """
        try:
            reader = self._get_reader(registry_entry)
            component_definition = reader.read_component_definition(registry_entry)
            return yaml.safe_load(component_definition)
        except Exception as e:
            self.log.debug(f"Could not read definition for component: {registry_entry.id} -> {str(e)}")
            return None

    def _get_adjusted_parameter_fields(self,
                                       component_body: Dict[str, Any],
                                       io_object_name: str,
                                       io_object_type: str,
                                       parameter_type: str) -> str:
        """
        Change the parameter ref according if it is a KFP path parameter (as opposed to a value parameter)
        """
        type = parameter_type
        if "implementation" in component_body and "container" in component_body['implementation']:
            if "command" in component_body['implementation']['container']:
                for command in component_body['implementation']['container']['command']:
                    if isinstance(command, dict) and list(command.values())[0] == io_object_name and \
                            list(command.keys())[0] == f"{io_object_type}Path":
                        type = "file"
            if "args" in component_body['implementation']['container']:
                for arg in component_body['implementation']['container']['args']:
                    if isinstance(arg, dict) and list(arg.values())[0] == io_object_name and \
                            list(arg.keys())[0] == f"{io_object_type}Path":
                        type = "file"

        return type
