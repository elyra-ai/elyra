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
import ast
import os
import re
from typing import List

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component import ComponentProperty


class AirflowComponentParser(ComponentParser):
    _type = "airflow"

    def __init__(self):
        super().__init__()

    def get_adjusted_component_id(self, component_id):
        # Component ids are structure differently in Airflow to handle the case
        # where there are multiple classes in one operator file. The id queried
        # must be adjusted to match the id expected in the component_entry catalog.
        return component_id.split('_')[0]

    def parse(self, registry_entry) -> List[Component]:
        components: List[Component] = list()

        component_definition = self._read_component_definition(registry_entry)

        # Adjust filename for display on frontend
        if registry_entry.type == "filename":
            registry_entry.location = os.path.join(os.path.dirname(__file__),
                                                   registry_entry.location)

        # If id is prepended with elyra_op_, only parse for the class specified in the id.
        # Else, parse the component definition for all classes
        if registry_entry.adjusted_id:
            component_class = registry_entry.adjusted_id.split('_')[-1]
            component_properties = self._parse_properties(registry_entry, component_definition,
                                                          component_class)
            components.append(Component(id=registry_entry.adjusted_id,
                                        name=component_class,
                                        description='',
                                        runtime=self._type,
                                        properties=component_properties))
        else:
            component_classes = self._get_all_classes(component_definition)
            for component_class in component_classes.keys():
                component_properties = self._parse_properties(registry_entry, component_definition,
                                                              component_class)
                components.append(Component(id=f"{registry_entry.id}_{component_class}",
                                            name=component_class,
                                            description='',
                                            runtime=self._type,
                                            properties=component_properties))

        return components

    def _get_all_classes(self, component_definition):
        # Organize lines according to the class to which they belong
        classes = {}
        class_name = "no_class"
        classes["no_class"] = {"content": [], "args": []}
        class_regex = re.compile(r"class ([\w]+)\(\w*\):")
        for line in component_definition.split('\n'):
            # Remove any inline comments (must follow the '2 preceding spaces and one following space'
            # rule). This avoids the case where the default value of an __init__ arg contains '#'.
            line = re.sub(r"  # .*\n?", "", line)
            match = class_regex.search(line)
            if match:
                class_name = match.group(1)
                classes[class_name] = {"content": [], "args": []}
            classes[class_name]['content'].append(line)

        classes.pop("no_class")
        return classes

    def _get_class_with_classname(self, classname, component_definition):
        classes = self._get_all_classes(component_definition)

        if classname not in classes.keys():
            raise ValueError(f"Component with class name {classname} not found")

        # Loop through classes to find init function for each class; grab init parameters as properties
        init_regex = re.compile(r"def __init__\(([\s\d\w,=\-\'\"\*\s\#.\\\/:?]*)\):")
        for class_name in classes:
            if class_name != classname:
                continue

            # Concatenate class body and search for __init__ function
            class_content = ''.join(classes[class_name]['content'])
            for match in init_regex.finditer(class_content):
                # Get list of parameter:default-value pairs
                classes[class_name]['args'] = [x.strip() for x in match.group(1).split(',')]

        return classes[classname]

    def _parse_properties(self, registry_entry, component_definition, component_class):
        properties: List[ComponentProperty] = list()

        # For Airflow we need a property for path to component source and component source type
        properties.extend(
            self.get_runtime_specific_properties("", registry_entry.location, registry_entry.type))

        # Retrieve the content of the specified class only
        component_definition = self._get_class_with_classname(component_class, component_definition)
        class_content = ''.join(component_definition.get('content'))
        for arg in component_definition.get('args'):
            # For each argument to the init function, build a new parameter and add to existing
            if arg in ['self', '*args', '**kwargs']:
                continue

            default_value = None
            if '=' in arg:
                arg, default_value = arg.split('=', 1)[:2]
                default_value = ast.literal_eval(default_value)
                if default_value and "\n" in str(default_value):
                    default_value = default_value.replace("\n", " ")

            # Search for :param [param] in class doctring to get description
            description = ""
            param_regex = re.compile(f":param {arg}:" + r"([\s\S]*?(?=:type|:param))")
            match = param_regex.search(class_content)
            if match:
                description = match.group(1).strip().replace("\"", "'")

            # Set default type to string
            type = "string"
            control_id = "StringControl"

            # Search for :type [param] information in class docstring
            type_regex = re.compile(f":type {arg}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''))")
            match = type_regex.search(class_content)
            if match:
                type = match.group(1).strip()

            properties.append(ComponentProperty(ref=arg,
                                                name=arg,
                                                type=type,
                                                value=default_value,
                                                description=description,
                                                control_id=control_id))
        return properties

    def get_runtime_specific_properties(self, runtime_image, location, source_type):
        """
        Define properties that are common to the Airflow runtime.
        """
        properties = [ComponentProperty(ref="runtime_image",
                                        name="Runtime Image",
                                        type="string",
                                        value=runtime_image,
                                        description="Container image used as execution environment.",
                                        control="custom",
                                        control_id="EnumControl",
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
                                        description="The type of component",
                                        control="readonly",
                                        required=True)]
        return properties

    def _read_component_definition(self, registry_entry):
        """
        Delegate to ComponentReader to read component definition
        """
        reader = self._get_reader(registry_entry)
        component_definition = \
            reader.read_component_definition(registry_entry.id, registry_entry.location)

        return component_definition
