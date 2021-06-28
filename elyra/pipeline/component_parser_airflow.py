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

    def parse(self, component_name, class_name, component_definition, properties):
        component_name = component_name.replace(" ", "-").lower()
        # Adjust name to include operator and classname
        component = Component(id=f"elyra_op_{component_name}_{get_id_from_name(class_name)}",
                              name=class_name,
                              description='',
                              runtime=self._type,
                              properties=properties)
        return component

    def parse_all(self, component_name, component_definition, properties):
        components: List[Component] = list()
        component_name = component_name.replace(" ", "-").lower()
        # Adjust name to include operator and classname
        classes = self.get_all_classes(component_definition).keys()
        for class_name in classes:
            components.append(Component(id=f"elyra_op_{component_name}_{get_id_from_name(class_name)}",
                                        name=class_name,
                                        description='',
                                        runtime=self._type,
                                        properties=properties))
        return components

    def get_all_classes(self, component_definition):
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

        classes.pop("no_class")
        return classes

    def get_class_with_classname(self, classname, component_definition):
        classes = self.get_all_classes(component_definition)

        if classname not in [x.lower() for x in classes.keys()]:
            raise ValueError("Not found")

        # Loop through classes to find init function for each class; grab init parameters as properties
        init_regex = re.compile(r"def __init__\(([\s\d\w,=\-\'\"\*\s\#.\\\/:?]*)\):")
        for class_name in classes:
            if class_name.lower() != classname:
                continue

            classname = class_name
            # Concatenate class body and search for __init__ function
            class_content = ''.join(classes[class_name]['content'])
            for match in init_regex.finditer(class_content):
                # Get list of parameter:default-value pairs
                classes[class_name]['args'].extend([x.strip() for x in match.group(1).split(',')])

        return classes[classname]

    def parse_properties(self, op_name, class_name, component_definition, location, source_type):
        properties: List[ComponentProperty] = list()

        operator_names = []
        # For Airflow we need a property for path to component_id, component_id source type, and available operators
        properties.extend(self.get_runtime_specific_properties("", location, source_type, operator_names))

        component_definition = self.get_class_with_classname(class_name, component_definition)
        class_content = ''.join(component_definition.get('content'))
        for arg in component_definition.get('args'):
            # For each argument to the init function, build a new parameter and add to existing
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

            ref = f"elyra_op_{op_name}_elyra_class_{class_name}_{name_adjust}{arg}"
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
                                            description="The path to the component_id specification file.",
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
