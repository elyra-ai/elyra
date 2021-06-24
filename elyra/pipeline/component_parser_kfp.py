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
import copy
import yaml

from elyra.pipeline.component import Component, ComponentParser, get_id_from_name, set_node_type_data, empty_properties


class KfpComponentParser(ComponentParser):
    _type = "kfp"

    def __init__(self):
        super().__init__()

    def parse(self, component_name, component_definition):
        component_yaml = self._read_component_yaml(component_definition)

        # TODO May have to adjust description if there are parsing issues
        component = Component(id=get_id_from_name(component_yaml.get('name')),
                              name=component_yaml.get('name'),
                              description=component_yaml.get('description'))
        return component

    def _read_component_yaml(self, component_body):
        """
        Convert component_body string to YAML object.
        """
        try:
            return yaml.safe_load(component_body)
        except yaml.YAMLError as e:
            raise RuntimeError from e

    def get_adjusted_parameter_fields(self,
                                      component_body,
                                      io_object_name,
                                      io_object_type,
                                      parameter_ref,
                                      parameter_type,
                                      description):
        """
        TODO: Add docstring
        """
        ref = parameter_ref
        desc = f"{description} (type: {parameter_type})"
        if "implementation" in component_body and "container" in component_body['implementation']:
            if "command" in component_body['implementation']['container']:
                for command in component_body['implementation']['container']['command']:
                    if isinstance(command, dict) and list(command.values())[0] == io_object_name and \
                            list(command.keys())[0] == f"{io_object_type}Path":
                        ref = f"elyra_path_{parameter_ref}"
                        if parameter_type == "string":
                            desc = f"{description} (type: path)"
                        else:
                            desc = f"{description} (type: path to {parameter_type})"

            if "args" in component_body['implementation']['container']:
                for arg in component_body['implementation']['container']['args']:
                    if isinstance(arg, dict) and list(arg.values())[0] == io_object_name and \
                            list(arg.keys())[0] == f"{io_object_type}Path":
                        ref = f"elyra_path_{parameter_ref}"
                        if parameter_type == "string":
                            desc = f"{description} (type: path)"
                        else:
                            desc = f"{description} (type: path to {parameter_type})"

        return ref, desc

    def parse_component_details(self, component_body, component_name=None):
        component_body = self._read_component_yaml(component_body)

        component_description = ""
        if "description" in component_body:
            component_description = ' '.join(component_body['description'].split())

        component_json = {
            'label': component_body['name'],
            'image': "",
            'id': get_id_from_name(component_body['name']),
            'description': component_description,
            'node_types': []
        }

        node_type = set_node_type_data(component_json['id'],
                                       component_json['label'],
                                       component_json['description'])
        component_json['node_types'].append(node_type)

        return component_json

    def parse_component_properties(self, component_body, component_path):
        '''
        Build the properties object according to the YAML and return properties.
        '''
        component_body = self._read_component_yaml(component_body)

        # Start with empty properties object
        component_parameters = copy.deepcopy(empty_properties)

        # Add runtime image details. Note that runtime image will always be in position 1
        # due to the structure of the empty_properties object
        refs = [param['parameter_ref'] for param in component_parameters['uihints']['parameter_info']]
        index = refs.index('runtime_image')

        runtime_image_param = component_parameters['uihints']['parameter_info'][index]
        runtime_image_param['control'] = "readonly"
        runtime_image_param.pop("custom_control_id")
        runtime_image_param['data'] = {"required": True}
        try:
            component_parameters['current_parameters']['runtime_image'] = \
                component_body['implementation']['container']['image']
        except Exception:
            raise RuntimeError("Error accessing runtime image for component.")

        # Add path details
        component_parameters['current_parameters']['component_source'] = component_path

        # Define new input group object
        input_group_info = {
            'id': "inputs",
            'type': "controls",
            'parameter_refs': []
        }

        inputs = component_body['inputs']
        for input_object in inputs:
            new_parameter_info = self.build_parameter(input_object, "input")

            # Change parameter_ref and description to reflect the type of input (inputValue vs inputPath)
            new_parameter_info['parameter_ref'], new_parameter_info['description']['default'] = \
                self.get_adjusted_parameter_fields(component_body=component_body,
                                                   io_object_name=input_object['name'],
                                                   io_object_type="input",
                                                   parameter_ref=new_parameter_info['parameter_ref'],
                                                   parameter_type=new_parameter_info['data']['format'],
                                                   description=new_parameter_info['description']['default'])

            # TODO:Consider adjusting this to return an empty value based on parameter type
            default_value = ""
            if "default" in input_object:
                default_value = input_object['default']

            # Add to existing parameter list
            component_parameters['parameters'].append({"id": new_parameter_info['parameter_ref']})
            component_parameters['current_parameters'][new_parameter_info['parameter_ref']] = default_value

            # Add to existing parameter info list
            component_parameters['uihints']['parameter_info'].append(new_parameter_info)

            # Add parameter to input group info
            input_group_info['parameter_refs'].append(new_parameter_info['parameter_ref'])

        # Append input group info to parameter details
        component_parameters['uihints']['group_info'][0]['group_info'].append(input_group_info)

        return component_parameters

    def build_parameter(self, obj, obj_type):
        data_object = {}
        # Determine whether parameter is optional
        if ("optional" in obj and not obj['optional']) \
                or ("description" in obj and "required" in obj['description'].lower()):
            data_object['required'] = True
        else:
            data_object['required'] = False

        # Set description
        parameter_description = ""
        if "description" in obj:
            parameter_description = obj['description']

        # Assign type, default to string
        data_object['format'] = "string"
        custom_control_id = "StringControl"
        if "type" in obj:
            data_object['format'] = obj['type']
            custom_control_id = self.get_custom_control_id(obj['type'].lower())

        # Build label name
        label = f"{obj['name']}"

        # Build parameter info
        new_parameter = self.compose_parameter(obj['name'], custom_control_id, label,
                                               parameter_description, data_object)

        return new_parameter

    def parse_component_execution_instructions(self, component_body):
        pass
