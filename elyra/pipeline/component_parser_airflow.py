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
import re
from types import SimpleNamespace
from typing import Dict
from typing import List
from typing import Optional

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParameter
from elyra.pipeline.component import ComponentParser


class AirflowComponentParser(ComponentParser):
    _type = "airflow"

    def __init__(self):
        super().__init__()

    def get_catalog_entry_id_for_component(self, component_id: str) -> str:
        # Component ids are structure differently in Airflow to handle the case
        # where there are multiple classes in one operator file. The id queried
        # must be adjusted to match the id expected in the component_entry catalog.
        return component_id.split('_')[0]

    def parse(self, registry_entry: SimpleNamespace) -> Optional[List[Component]]:
        components: List[Component] = list()

        component_definition = self._read_component_definition(registry_entry)
        if not component_definition:
            return None

        # If id is different from the catalog_entry_id, only parse for the class specified in the id.
        # Else, parse the component definition for all classes
        if registry_entry.catalog_entry_id != registry_entry.id:
            component_class = registry_entry.id.split('_')[-1]
            component_properties = self._parse_properties(component_definition, component_class)
            components.append(Component(id=registry_entry.id,
                                        name=component_class,
                                        description='',
                                        runtime=self._type,
                                        source_type=registry_entry.type,
                                        source=registry_entry.location,
                                        catalog_entry_id=registry_entry.catalog_entry_id,
                                        properties=component_properties,
                                        category_id=registry_entry.category_id))
        else:
            component_classes = self._get_all_classes(component_definition)
            for component_class in component_classes.keys():
                component_properties = self._parse_properties(component_definition, component_class)
                components.append(Component(id=f"{registry_entry.catalog_entry_id}_{component_class}",
                                            name=component_class,
                                            description='',
                                            runtime=self._type,
                                            source_type=registry_entry.type,
                                            source=registry_entry.location,
                                            catalog_entry_id=registry_entry.catalog_entry_id,
                                            properties=component_properties,
                                            category_id=registry_entry.category_id))

        return components

    def _get_all_classes(self, component_definition: str) -> Dict[str, Dict]:
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

    def _get_class_with_classname(self, classname: str, component_definition: str) -> Dict[str, List]:
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

    def _parse_properties(self, component_definition: str, component_class: str) -> List[ComponentParameter]:
        properties: List[ComponentParameter] = list()

        # NOTE: Currently no runtime-specific properties are needed, including runtime image. See
        # justification here: https://github.com/elyra-ai/elyra/issues/1912#issuecomment-879424452
        # properties.extend(self.get_runtime_specific_properties())

        # Retrieve the content of the specified class only
        component_definition = self._get_class_with_classname(component_class, component_definition)
        class_content = ''.join(component_definition.get('content'))
        for arg in component_definition.get('args'):
            # For each argument to the init function, build a new parameter and add to existing
            if arg in ['self', '*args', '**kwargs']:
                continue

            value = None
            if '=' in arg:
                arg, value = arg.split('=', 1)[:2]
                value = ast.literal_eval(value)
                if value and "\n" in str(value):
                    value = value.replace("\n", " ")

            # Search for :type [param] information in class docstring
            type_regex = re.compile(f":type {arg}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.))")
            match = type_regex.search(class_content)
            type = match.group(1).strip() if match else "string"

            # Search for :param [param] in class doctring to get description
            description = ""
            param_regex = re.compile(f":param {arg}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.))")
            match = param_regex.search(class_content)
            if match:
                description = match.group(1).strip().replace("\"", "'")

            # Amend description to include type information
            description = self._format_description(description=description, type=type)

            type, control_id, default_value = self.determine_type_information(type)

            properties.append(ComponentParameter(id=arg,
                                                 name=arg,
                                                 type=type,
                                                 value=(value or default_value),
                                                 description=description,
                                                 control_id=control_id))
        return properties

    def get_runtime_specific_properties(self) -> List[ComponentParameter]:
        """
        Define properties that are common to the Airflow runtime.
        """
        properties = [ComponentParameter(id="runtime_image",
                                         name="Runtime Image",
                                         type="string",
                                         value="",
                                         description="Container image used as execution environment.",
                                         control="custom",
                                         control_id="EnumControl",
                                         required=True)]
        return properties

    def _read_component_definition(self, registry_entry: SimpleNamespace) -> str:
        """
        Delegate to ComponentReader to read component definition
        """
        reader = self._get_reader(registry_entry)
        component_definition = reader.read_component_definition(registry_entry)

        return component_definition
