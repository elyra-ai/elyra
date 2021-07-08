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
import os
from typing import List

import yaml

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component import ComponentProperty
from elyra.pipeline.component import FilesystemComponentReader


class KfpComponentParser(ComponentParser):
    _type = "kfp"

    def __init__(self):
        super().__init__()

    def get_adjusted_component_id(self, component_id):
        return component_id

    def parse(self, registry_entry) -> List[Component]:
        component_yaml = self._read_component_yaml(registry_entry)

        # Adjust filename for display on frontend
        if registry_entry.type == FilesystemComponentReader.type:
            registry_entry.location = os.path.join(os.path.dirname(__file__),
                                                   registry_entry.location)

        description = ""
        if component_yaml.get('description'):
            description = ' '.join(component_yaml.get('description').split())

        component_properties = self._parse_properties(registry_entry, component_yaml)

        component = Component(id=registry_entry.id,
                              name=component_yaml.get('name'),
                              description=description,
                              runtime=self._type,
                              properties=component_properties)
        return [component]

    def _parse_properties(self, registry_entry, component_yaml):
        properties: List[ComponentProperty] = list()

        # For KFP we need a property for runtime image, path to component source, and component source type
        runtime_image = component_yaml.get('implementation').get('container').get('image')
        if not runtime_image:
            raise RuntimeError(f"Invalid component: Missing runtime image for component {registry_entry.id}.")

        properties.extend(
            self.get_runtime_specific_properties(runtime_image,
                                                 registry_entry.location,
                                                 registry_entry.type))

        # Then loop through and create custom properties
        for param in component_yaml.get('inputs'):
            # Set description
            description = ""
            if "description" in param:
                description = param.get('description')

            # Determine whether parameter is optional
            required = False
            if "optional" in param and not param.get('optional'):
                required = True

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
            properties.append(ComponentProperty(ref=ref,
                                                name=param.get('name'),
                                                type=type,
                                                value=default_value,
                                                description=description,
                                                required=required))
        return properties

    def get_runtime_specific_properties(self, runtime_image, location, source_type):
        """
        Define properties that are common to the KFP runtime.
        """
        properties = [ComponentProperty(ref="runtime_image",
                                        name="Runtime Image",
                                        type="string",
                                        value=runtime_image,
                                        description="Docker image used as execution environment.",
                                        control="readonly",
                                        required=True),
                      ComponentProperty(ref="component_source",
                                        name="Path to Component",
                                        type="string",
                                        value=location,
                                        description="The path to the component specification file.",
                                        control="readonly",
                                        required=True),
                      ComponentProperty(ref="component_source_type",
                                        name="Component Source Type",
                                        type="string",
                                        value=source_type,
                                        description="",
                                        control="readonly",
                                        required=True)]
        return properties

    def _read_component_yaml(self, registry_entry):
        """
        Convert component_body string to YAML object.
        """
        try:
            reader = self._get_reader(registry_entry)
            component_definition = \
                reader.read_component_definition(registry_entry.id, registry_entry.location)

            return yaml.safe_load(component_definition)
        except yaml.YAMLError as e:
            raise RuntimeError from e

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
