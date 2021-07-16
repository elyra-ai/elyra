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

    def parse(self, registry_entry) -> Optional[List[Component]]:
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
                              properties=component_properties)
        return [component]

    def _parse_properties(self, component_yaml):
        properties: List[ComponentParameter] = list()

        # NOTE: Currently no runtime-specific properties are needed
        # properties.extend(self.get_runtime_specific_properties())

        # Then loop through and create custom properties
        for param in component_yaml.get('inputs'):
            # Set description
            description = ""
            if "description" in param:
                description = param.get('description')

            # KFP components default to being required unless otherwise stated.
            # Reference: https://www.kubeflow.org/docs/components/pipelines/reference/component-spec/#interface
            required = True
            if "optional" in param and param.get('optional') is True:
                required = False

            # Assign type, default to string
            type = "string"
            if "type" in param:
                type = param.get('type')

            # Change type to reflect the type of input (inputValue vs inputPath)
            type = self._get_adjusted_parameter_fields(component_body=component_yaml,
                                                       io_object_name=param.get('name'),
                                                       io_object_type="input",
                                                       parameter_type=type)

            default_value = ''
            if "default" in param:
                default_value = param.get('default')

            ref = param.get('name').lower().replace(' ', '_')
            properties.append(ComponentParameter(ref=ref,
                                                 name=param.get('name'),
                                                 type=type,
                                                 value=default_value,
                                                 description=description,
                                                 required=required))
        return properties

    def get_runtime_specific_properties(self):
        """
        Define properties that are common to the KFP runtime.
        """
        properties = [ComponentParameter(ref="runtime_image",
                                         name="Runtime Image",
                                         type="string",
                                         value="",
                                         description="Docker image used as execution environment.",
                                         control="readonly",
                                         required=True)]
        return properties

    def _read_component_yaml(self, registry_entry):
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
                                       component_body,
                                       io_object_name,
                                       io_object_type,
                                       parameter_type):
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
