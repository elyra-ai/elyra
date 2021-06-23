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
import copy
import re

from elyra.pipeline.component import ComponentParser, get_id_from_name, set_node_type_data, empty_properties


class AirflowComponentParser(ComponentParser):
    _type = "airflow"

    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_body, component_name=None):
        # Component_body never used, but component_name never used in KFP parser

        label = component_name

        # TODO: Is there any way to reliably get the description for the operator overall?
        # Could maybe pull from a class description but this wouldn't work for operators
        # with multiple classes or those without docstrings at all.
        description = ""

        component_json = {
            'label': label,
            'image': "",
            'id': get_id_from_name(label),
            'description': ' '.join(description.split()),
            'node_types': []
        }

        node_type = set_node_type_data(get_id_from_name(label), label, description)
        component_json['node_types'].append(node_type)

        return component_json

    def parse_component_properties(self, component_body, component_path):
        '''
        Build the properties object according to the operator python file and return properties.
        '''
        # Start with empty properties object
        component_parameters = copy.deepcopy(empty_properties)

        # Add path details
        component_parameters['current_parameters']['component_source'] = component_path

        # Add class information as parameter
        component_parameters['parameters'].append({"id": "elyra_airflow_class_name"})
        # TODO Test this with empty string or otherwise determine a solution here
        component_parameters['current_parameters']["elyra_airflow_class_name"] = ""

        class_parameter_info = {
            "parameter_ref": "elyra_airflow_class_name",
            "control": "custom",
            "custom_control_id": "EnumControl",
            "label": {
                "default": "Available Operators"
            },
            "description": {
                "default": "List of operators available in the given operator specification file. \
                            Select the operator that you wish to execute from the drop down menu \
                            and include the appropriate parameter values below.",
                "placement": "on_panel"
            },
            "data": {
                "items": [],
                "required": True
            }
        }
        component_parameters['uihints']['parameter_info'].append(class_parameter_info)

        class_group_info = {
            "id": "elyra_airflow_class_name",
            "type": "controls",
            "parameter_refs": ["elyra_airflow_class_name"]
        }
        component_parameters['uihints']['group_info'][0]['group_info'].append(class_group_info)

        # Organize lines according to the class to which they belong
        classes = {}
        class_name = "no_class"
        classes["no_class"] = {
            'lines': []
        }
        class_regex = re.compile(r"class ([\w]+)\(\w*\):")
        for line in component_body.split('\n'):
            # Remove any inline comments (must follow the '2 preceding spaces and one following space'
            # rule). This avoids the case where the default value of an __init__ arg contains '#'.
            line = re.sub(r"  # .*\n?", "", line)  # .decode("utf-8"))
            match = class_regex.search(line)
            if match:
                class_name = match.group(1)
                classes[class_name] = {'lines': [], 'init_args': []}
            classes[class_name]['lines'].append(line)

        # Loop through classes to find init function for each class; grab init parameters as properties
        init_regex = re.compile(r"def __init__\(([\s\d\w,=\-\'\"\*\s\#.\\\/:?]*)\):")
        for class_name in classes:
            if class_name == "no_class":
                continue

            # Concatenate class body and search for __init__ function
            class_content = ''.join(classes[class_name]['lines'])
            for match in init_regex.finditer(class_content):
                # Add class as available operator. Note that elyra_airflow_class_names will always be in
                # position 3 of the array as it is added as a 4th element to the empty_properties object
                class_names_param = component_parameters['uihints']['parameter_info'][3]
                class_names_param['data']['items'].append(class_name)
                group_info = {
                    'id': class_name,
                    'type': "controls",
                    'parameter_refs': []
                }

                classes[class_name]['init_args'] = [x.strip() for x in match.group(1).split(',')]

                # For each argument to the init function, build a new parameter and add to existing
                for arg in classes[class_name]['init_args']:
                    if arg in ['self', '*args', '**kwargs']:
                        continue

                    # TODO: Fix default values that wrap lines or consider omitting altogether.
                    # Default information could also potentially go in the description instead.
                    default_value = ''
                    if '=' in arg:
                        arg, default_value = arg.split('=', 1)[:2]
                        default_value = ast.literal_eval(default_value)

                    new_parameter_info = self.build_parameter(arg, class_name, class_content)

                    component_parameters['parameters'].append({"id": new_parameter_info['parameter_ref']})
                    if 'data' in new_parameter_info:
                        if 'format' in new_parameter_info['data']:
                            component_parameter_format = new_parameter_info['data']['format']
                            if component_parameter_format:
                                if component_parameter_format == 'str' or component_parameter_format == 'string':
                                    if not default_value:
                                        default_value = ''
                                elif component_parameter_format == 'int':
                                    if not default_value:
                                        default_value = 0
                                elif component_parameter_format == 'bool' or component_parameter_format == 'Boolean':
                                    if not default_value:
                                        default_value = False
                                elif component_parameter_format == 'dict' or component_parameter_format == 'Dictionary':
                                    if not default_value:
                                        default_value = ''
                                elif component_parameter_format.lower() == 'list':
                                    if not default_value:
                                        default_value = ''

                    component_parameters['current_parameters'][new_parameter_info['parameter_ref']] = default_value

                    # Add to existing parameter info list
                    component_parameters['uihints']['parameter_info'].append(new_parameter_info)

                    # Add parameter to output group info
                    group_info['parameter_refs'].append(new_parameter_info['parameter_ref'])

                # Append output group info to parameter details
                component_parameters['uihints']['group_info'][0]['group_info'].append(group_info)

        # TODO Consider setting the first available operator as the default value in current_params

        return component_parameters

    def build_parameter(self, parameter_name, class_name, component_body):
        # Search for :param [param] in class doctring to get parameter description
        parameter_description = " "
        param_regex = re.compile(f":param {parameter_name}:" + r"([\s\S]*?(?=:type|:param))")
        match = param_regex.search(component_body)
        if match:
            parameter_description = match.group(1).strip()

        data_object = {}
        # Search description to determine whether parameter is optional
        if "not optional" in parameter_description.lower() or \
                ("required" in parameter_description.lower() and
                 "not required" not in parameter_description.lower() and
                 "n't required" not in parameter_description.lower()):
            data_object['required'] = True
        else:
            data_object['required'] = False

        # Set default type to string
        data_object['format'] = "string"
        custom_control_id = "StringControl"
        name_adjust = ""

        # Search for :type [param] information in class docstring
        type_regex = re.compile(f":type {parameter_name}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''))")
        match = type_regex.search(component_body)
        if match:
            # TODO: Determine where this field is used -- does it need to be set?
            # TODO: Add some more robust type-checking here
            if "str" not in match.group(1).strip():
                data_object['format'] = match.group(1).strip()
                custom_control_id = self.get_custom_control_id(match.group(1).strip().lower())
            if "dict" in match.group(1).strip():
                name_adjust = "elyra_dict_"
            elif "int" in match.group(1).strip():
                name_adjust = "elyra_int_"

            # Add type to description as hint to users?
            if not parameter_description:
                parameter_description = f"(type: {data_object['format']})"
            else:
                parameter_description += f" (type: {data_object['format']})"

        # Build parameter info
        new_parameter = self.compose_parameter(f"{class_name}_{name_adjust}{parameter_name}",
                                               custom_control_id,
                                               parameter_name,
                                               parameter_description,
                                               data_object)

        return new_parameter
