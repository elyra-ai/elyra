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
from typing import List

from elyra.pipeline.component import Component, ComponentProperty, ComponentParser, get_id_from_name


class AirflowComponentParser(ComponentParser):
    _type = "airflow"

    def __init__(self):
        super().__init__()

    def parse(self, component_name, component_definition, properties):
        component = Component(id=get_id_from_name(component_name),
                              name=component_name,
                              description='',
                              runtime=self._type,
                              properties=properties)
        return component

    def parse_properties(self, component_definition, location, source_type):
        properties: List[ComponentProperty] = list()

        operator_names = list()

        # Organize lines according to the class to which they belong
        classes = {}
        class_name = "no_class"
        classes["no_class"] = {"content": [], "args": []}
        class_regex = re.compile(r"class ([\w]+)\(\w*\):")
        for line in component_definition.split('\n'):
            # Remove any inline comments (must follow the '2 preceding spaces and one following space'
            # rule). This avoids the case where the default value of an __init__ arg contains '#'.
            line = re.sub(r"  # .*\n?", "", line)  # .decode("utf-8"))
            match = class_regex.search(line)
            if match:
                class_name = match.group(1)
                classes[class_name] = {"content": [], "args": []}
            classes[class_name]['content'].append(line)

        # Loop through classes to find init function for each class; grab init parameters as properties
        init_regex = re.compile(r"def __init__\(([\s\d\w,=\-\'\"\*\s\#.\\\/:?]*)\):")
        for class_name in classes:
            if class_name == "no_class":
                continue

            # Concatenate class body and search for __init__ function
            class_content = ''.join(classes[class_name]['content'])
            for match in init_regex.finditer(class_content):
                # Add class as available operator
                operator_names.append(class_name)

                # Get list of parameter:default-value pairs
                classes[class_name]['args'].extend([x.strip() for x in match.group(1).split(',')])

        # For Airflow we need a property for path to component, component source type, and available operators
        properties.extend(self.get_runtime_specific_properties("", location, source_type, operator_names))

        for class_name, values in classes.items():
            # For each argument to the init function, build a new parameter and add to existing
            for arg in values.get('args'):
                if arg in ['self', '*args', '**kwargs']:
                    continue

                # TODO: Fix default values that wrap lines or consider omitting altogether.
                default_value = ""
                if '=' in arg:
                    arg, default_value = arg.split('=', 1)[:2]
                    default_value = ast.literal_eval(default_value)

                # Search for :param [param] in class doctring to get description
                description = ""
                param_regex = re.compile(f":param {arg}:" + r"([\s\S]*?(?=:type|:param))")
                match = param_regex.search(class_content)
                if match:
                    description = match.group(1).strip().replace("\"", "'")

                # Set default type to string
                type = "string"
                control_id = "StringControl"
                name_adjust = ""

                # Search for :type [param] information in class docstring
                # TODO Move the below into a get_adjusted_parameter_fields() function (see KFP)
                type_regex = re.compile(f":type {arg}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''))")
                match = type_regex.search(class_content)
                if match:
                    # TODO: Determine where this field is used -- does it need to be set?
                    # TODO: Add some more robust type-checking here
                    if "str" not in match.group(1).strip():
                        type = match.group(1).strip()
                    if "dict" in match.group(1).strip():
                        name_adjust = "elyra_dict_"
                    elif "int" in match.group(1).strip():
                        name_adjust = "elyra_int_"

                ref = f"{class_name.lower()}_{name_adjust}{arg}"
                properties.append(ComponentProperty(ref=ref,
                                                    name=arg,
                                                    type=type,
                                                    value=default_value,
                                                    description=description,
                                                    control_id=control_id))

        return properties

    def get_runtime_specific_properties(self, runtime_image, location, source_type, class_names):
        """
        Define properties that are common to the Airflow runtime.
        """
        properties: List[ComponentProperty] = list()

        classname_description = "List of operators available in the given operator specification file. \
                                 Select the operator that you wish to execute from the drop down menu \
                                 and include the appropriate parameter values below."

        properties.extend([ComponentProperty(ref="runtime_image",
                                             name="Runtime Image",
                                             type="string",
                                             value=runtime_image,
                                             description="Docker image used as execution environment.",
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
                                            description="",
                                            control="readonly",
                                            required=True),
                          ComponentProperty(ref="elyra_airflow_class_name",
                                            name="Available Operators",
                                            type="string",
                                            value="",
                                            description=classname_description,
                                            control="custom",
                                            control_id="EnumControl",
                                            items=class_names,
                                            required=True)])
        return properties
