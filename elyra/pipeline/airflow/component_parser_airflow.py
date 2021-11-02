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
from elyra.pipeline.runtime_type import RuntimeProcessorType


class AirflowComponentParser(ComponentParser):
    _component_platform: RuntimeProcessorType = RuntimeProcessorType.APACHE_AIRFLOW
    _file_types: List[str] = [".py"]

    def parse(self, registry_entry: SimpleNamespace) -> Optional[List[Component]]:
        components: List[Component] = list()

        component_definition = registry_entry.component_definition
        if not component_definition:
            return None

        # Parse the component definition for all defined classes
        component_classes = self._get_all_classes(component_definition)

        for component_class, component_content in component_classes.items():
            # Create a Component object for each class
            component_properties = self._parse_properties(component_content)

            components.append(
                Component(
                    id=registry_entry.component_id,
                    name=component_class,
                    description='',
                    catalog_type=registry_entry.catalog_type,
                    source_identifier=registry_entry.component_identifier,
                    definition=self.get_class_def_as_string(component_content),
                    runtime_type=self.component_platform.name,
                    categories=registry_entry.categories,
                    properties=component_properties
                )
            )

        return components

    def _get_all_classes(self, component_definition: str) -> Dict[str, Dict]:
        # Organize lines and arguments according to the class to which they belong
        class_to_content = {
            "no_class": {"lines": [], "args": []}
        }

        class_name = "no_class"
        class_regex = re.compile(r"class ([\w]+[.\w]*)\(\w*\):")
        for line in component_definition.split('\n'):
            # Remove any inline comments (must follow the '2 preceding spaces and one following space'
            # rule). This avoids the case where the default value of an __init__ arg contains '#'.
            line = re.sub(r"  # .*\n?", "", line)
            match = class_regex.search(line)
            if match:
                class_name = match.group(1)
                class_to_content[class_name] = {"lines": [], "args": []}
            class_to_content[class_name]['lines'].append(line)

        class_to_content.pop("no_class")

        init_regex = re.compile(r"def __init__\(([\s\d\w,=\-\'\"\*\s\#.\\\/:?]*)\):")
        for class_name, content in class_to_content.items():
            # Concatenate class body and search for __init__ function
            class_content = self.get_class_def_as_string(content)
            for match in init_regex.finditer(class_content):
                # Get list of parameter:default-value pairs
                class_to_content[class_name]['args'] = [x.strip() for x in match.group(1).split(',')]

        return class_to_content

    def _parse_properties(self, content: Dict[str, List]) -> List[ComponentParameter]:
        properties: List[ComponentParameter] = list()

        # NOTE: Currently no runtime-specific properties are needed, including runtime image. See
        # justification here: https://github.com/elyra-ai/elyra/issues/1912#issuecomment-879424452
        # properties.extend(self.get_runtime_specific_properties())

        class_definition = self.get_class_def_as_string(content)
        for arg in content.get('args'):
            # For each argument to the init function, build a new parameter and add to existing
            if arg in ['self', '*args', '**kwargs']:
                continue

            value = None
            if '=' in arg:
                arg, value = arg.split('=', 1)[:2]
                value = ast.literal_eval(value)
                if value and "\n" in str(value):
                    value = value.replace("\n", " ")

            # Search for data type (':type [param]:') in class docstring
            type_regex = re.compile(f":type {arg}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.))")
            match = type_regex.search(class_definition)
            data_type = match.group(1).strip() if match else "string"

            # Search for description (':param [param]:') in class docstring
            param_regex = re.compile(f":param {arg}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.))")
            match = param_regex.search(class_definition)
            description = match.group(1).strip().replace("\"", "'") if match else ""

            # Amend description to include type information
            description = self._format_description(description=description, data_type=data_type)

            data_type_info = self.determine_type_information(data_type)
            if data_type_info.undetermined:
                self.log.warning(f"Data type from parsed data ('{data_type}') could not be determined. "
                                 f"Proceeding as if 'string' was detected.")

            properties.append(
                ComponentParameter(
                    id=arg,
                    name=arg,
                    data_type=data_type_info.data_type,
                    value=(value or data_type_info.default_value),
                    description=description,
                    control_id=data_type_info.control_id
                )
            )

        return properties

    def get_class_def_as_string(self, content: Dict[str, List[str]]) -> str:
        """
        TODO
        """
        return ''.join(content['lines'])

    def get_runtime_specific_properties(self) -> List[ComponentParameter]:
        """
        Define properties that are common to the Airflow runtime.
        """
        return [
            ComponentParameter(
                id="runtime_image",
                name="Runtime Image",
                data_type="string",
                value="",
                description="Container image used as execution environment.",
                control="custom",
                control_id="EnumControl",
                required=True,
            )
        ]
