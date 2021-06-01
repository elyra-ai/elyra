#
# Copyright 2018-2020 IBM Corporation
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
import io
import json
import yaml
import urllib
import re
import copy

from traitlets.config import SingletonConfigurable


cardinality = {
    'min': 0,
    'max': -1
}

inputs = {
    "id": "inPort",
    "app_data": {
        "ui_data": {
            "cardinality": cardinality,
            "label": "Input Port"
        }
    }
}

outputs = {
    "id": "outPort",
    "app_data": {
        "ui_data": {
            "cardinality": cardinality,
            "label": "Output Port"
        }
    }
}

empty_properties = {
    "current_parameters": {"component_source_type": "", "filename": "", "runtime_image": ""},
    "parameters": [{"id": "component_source_type"}, {"id": "filename"}, {"id": "runtime_image"}],
    "uihints": {
        "id": "nodeProperties",
        "parameter_info": [
            {
                "parameter_ref": "component_source_type",
                "control": "readonly",
                "label": {
                    "default": "Component Source Type"
                },
                "data": {
                    "format": "string"
                }
            },
            {
                "parameter_ref": "filename",
                "control": "readonly",
                "label": {
                    "default": "Path to Component"
                },
                "description": {
                    "default": "The path to the component specification file.",
                    "placement": "on_panel"
                },
                "data": {
                    "format": "string"
                }
            },
            {
                "parameter_ref": "runtime_image",
                "control": "custom",
                "custom_control_id": "EnumControl",
                "label": {
                    "default": "Runtime Image"
                },
                "description": {
                    "default": "Docker image used as execution environment.",
                    "placement": "on_panel"
                },
                "data": {
                    "items": [],
                    "required": True
                }
            }
        ],
        "group_info": [
            {
                "id": "nodeGroupInfo",
                "type": "panels",
                "group_info": [
                    {"id": "component_source_type", "type": "controls", "parameter_refs": ["component_source_type"]},
                    {"id": "filename", "type": "controls", "parameter_refs": ["filename"]},
                    {"id": "runtime_image", "type": "controls", "parameter_refs": ["runtime_image"]}
                ]
            }
        ]
    },
    "resources": {}
}


def get_id_from_name(name):
    """
    Takes the lowercase name of a component and removes '-' and redundant spaces by splitting and
    then rejoining on spaces. Spaces and underscores are finally replaced with '-'.
    """
    return ' '.join(name.lower().replace('-', '').split()).replace(' ', '-').replace('_', '-')


def set_node_type_data(id, label, description):
    node_type = {
        'id': "",
        'op': id,
        'type': "execution_node",
        'inputs': [inputs],
        'outputs': [outputs],
        'parameters': {},
        'app_data': {
            'ui-data': {
                'label': label,
                'description': description,
                'image': "",
                'x_pos': 0,
                'y_pos': 0
            }
        }
    }

    return node_type


class ComponentParser(SingletonConfigurable):
    _type = "local"
    _resources_dir = "resources"

    def __init__(self):
        self.properties = self.get_common_config('properties')

    def get_common_config(self, config_name):
        common_dir = os.path.join(os.path.dirname(__file__), self._resources_dir)
        common_file = os.path.join(common_dir, f"{config_name}.json")
        with io.open(common_file, 'r', encoding='utf-8') as f:
            common_json = json.load(f)

        return common_json

    def _get_component_catalog_json(self):
        catalog_dir = os.path.join(os.path.dirname(__file__), self._resources_dir)
        catalog_file = os.path.join(catalog_dir, f"{self._type}_component_catalog.json")
        with open(catalog_file, 'r') as f:
            catalog_json = json.load(f)

        return catalog_json

    def list_all_components(self):
        if self._type == "local":
            return []

        component_json = self._get_component_catalog_json()
        return component_json['components'].values()

    def return_component_if_exists(self, component_id):
        component_json = self._get_component_catalog_json()
        return component_json['components'].get(component_id)

    def add_component(self, request_body):
        """
        Adds a component to the component catalog. Implementation subject to change
        once support for adding components is available.
        """
        assert "path" in request_body

        component_json = {
            'name': request_body['name'],
            'id': get_id_from_name(request_body['name']),
            'path': request_body['path']
        }

        catalog_json = self._get_component_catalog_json()
        catalog_json['components'].append(component_json)

        catalog_dir = os.path.join(os.path.dirname(__file__), self._resources_dir)
        catalog_file = os.path.join(catalog_dir, f"{self._type}_component_catalog.json")
        with open(catalog_file, 'w') as f:
            f.write(json.dumps(catalog_json))

    def parse_component_details(self, component, component_name=None):
        """Get component name, id, description for palette JSON"""
        raise NotImplementedError

    def parse_component_properties(self, component_body, component_path):
        """Get component properties for properties JSON"""
        raise NotImplementedError

    def get_custom_control_id(self, parameter_type):
        # This may not be applicable in every case
        if parameter_type in ["number", "integer"]:
            return "NumberControl"
        elif parameter_type in ["bool", "boolean"]:
            return "BooleanControl"
        # elif "array" in parameter_type:
        #     return "StringArrayControl"
        else:
            return "StringControl"

    def compose_parameter(self, name, control_id, label, description, data):
        formatted_description = "" if not description else description[0].upper() + description[1:]
        parameter = {
            'parameter_ref': name.lower().replace(' ', '_'),
            'control': "custom",
            'custom_control_id': control_id,
            'label': {
                'default': label
            },
            'description': {
                'default': formatted_description,
                'placement': "on_panel"
            },
            "data": data
        }

        return parameter


class KfpComponentParser(ComponentParser):
    _type = "kfp"

    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_body, component_name=None):
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
        # Start with empty properties object
        component_parameters = copy.deepcopy(empty_properties)

        component_parameters['uihints']['parameter_info'][1]['data']['value'] = component_path

        # Add runtime image details
        component_parameters['uihints']['parameter_info'][2]['control'] = "readonly"
        component_parameters['uihints']['parameter_info'][2]['data'] = {"format": "string"}
        try:
            component_parameters['current_parameters']['runtime_image'] = \
                component_body['implementation']['container']['image']
        except Exception:
            raise RuntimeError("Error accessing runtime image for component.")

        # Add path details
        component_parameters['current_parameters']['filename'] = component_path

        # Define new input group object
        input_group_info = {
            'id': "inputs",
            'type': "controls",
            'parameter_refs': []
        }

        inputs = component_body['inputs']
        for input_object in inputs:
            new_parameter_info = self.build_parameter(input_object, "input")

            # TODO: Adjust this to return an empty value for whatever type the parameter is?
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

        # TODO: Determine whether outputs should be included. Some components throw an error when
        # attempting to execute a component where output fields have been passed, even if no value
        # is specified.
        # Define new output group object
        output_group_info = {
            'id': "outputs",  # need to actually figure out the control id
            'type': "controls",
            'parameter_refs': []
        }

        outputs = component_body['outputs']
        for output_object in outputs:
            new_parameter_info = self.build_parameter(output_object, "output")

            if new_parameter_info['parameter_ref'] in input_group_info['parameter_refs']:
                new_parameter_info['parameter_ref'] = f"elyra_outputs_{new_parameter_info['parameter_ref']}"

            # Add to existing parameter list
            component_parameters['parameters'].append({"id": new_parameter_info['parameter_ref']})
            component_parameters['current_parameters'][new_parameter_info['parameter_ref']] = ""

            # Add to existing parameter info list
            component_parameters['uihints']['parameter_info'].append(new_parameter_info)

            # Add parameter to output group info
            output_group_info['parameter_refs'].append(new_parameter_info['parameter_ref'])

        # Append output group info to parameter details
        component_parameters['uihints']['group_info'][0]['group_info'].append(output_group_info)

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

            # Add type to description as hint to users?
            if not parameter_description:
                parameter_description = f"(type: {data_object['format']})"
            else:
                parameter_description += f" (type: {data_object['format']})"

        # Build label name
        label = f"{obj['name']} ({obj_type})"

        # Build parameter info
        new_parameter = self.compose_parameter(obj['name'], custom_control_id, label,
                                               parameter_description, data_object)

        return new_parameter

    def parse_component_execution_instructions(self, component_body):
        pass


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
        component_parameters['current_parameters']['filename'] = component_path

        # Organize lines according to the class to which they belong
        # TODO: Determine how to handle the case where one operator.py file has multiple
        # class definitions. How will we differentiate on the frontend? How will we
        # execute on the backend?
        classes = {}
        class_name = "no_class"
        classes["no_class"] = {
            'lines': []
        }
        class_regex = re.compile(r"class ([\w]+)\(\w*\):")
        for line in component_body:
            line = line.decode("utf-8")
            match = class_regex.search(line)
            if match:
                class_name = match.group(1)
                classes[class_name] = {'lines': [], 'init_args': []}
            classes[class_name]['lines'].append(line)

        # Loop through classes to find init function for each class; grab init parameters as properties
        init_regex = re.compile(r"def __init__\(([\s\d\w,=\-\'\"\*]*)\):")
        for class_name in classes:
            if class_name == "no_class":
                continue

            group_info = {
                'id': class_name,
                'type': "controls",
                'parameter_refs': []
            }

            # Concatenate class body and search for __init__ function
            class_content = ''.join(classes[class_name]['lines'])
            for match in init_regex.finditer(class_content):
                classes[class_name]['init_args'] = [x.strip() for x in match.group(1).split(',')]

                # For each argument to the init function, build a new parameter and add to existing
                for arg in classes[class_name]['init_args']:
                    if arg in ['self', '*args', '**kwargs']:
                        continue

                    default_value = ""
                    if '=' in arg:
                        split_arg = arg.split('=')
                        arg = split_arg[0]
                        default_value = split_arg[1]

                    new_parameter_info = self.build_parameter(arg, class_name, class_content)

                    # Add to existing parameter list
                    component_parameters['parameters'].append({"id": new_parameter_info['parameter_ref']})
                    component_parameters['current_parameters'][new_parameter_info['parameter_ref']] = default_value

                    # Add to existing parameter info list
                    component_parameters['uihints']['parameter_info'].append(new_parameter_info)

                    # Add parameter to output group info
                    group_info['parameter_refs'].append(new_parameter_info['parameter_ref'])

            # Append output group info to parameter details
            component_parameters['uihints']['group_info'][0]['group_info'].append(group_info)

        return component_parameters

    def build_parameter(self, parameter_name, class_name, component_body):
        # Search for :param [param] in class doctring to get parameter description
        parameter_description = ""
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

        # Search for :type [param] information in class docstring
        type_regex = re.compile(f":type {parameter_name}:" + r"([\s\S]*?(?=:type|:param))")
        match = type_regex.search(component_body)
        if match:
            # TODO: Determine where this field is used -- does it need to be set
            data_object['format'] = match.group(1).strip()
            custom_control_id = self.get_custom_control_id(match.group(1).strip().lower())

            # Add type to description as hint to users?
            if not parameter_description:
                parameter_description = f"(type: {data_object['format']})"
            else:
                parameter_description += f" (type: {data_object['format']})"

        # Build parameter info
        new_parameter = self.compose_parameter(f"{class_name}_{parameter_name}",
                                               custom_control_id,
                                               parameter_name,
                                               parameter_description,
                                               data_object)

        return new_parameter


class ComponentReader(SingletonConfigurable):
    _type = 'local'

    def get_component_body(self, component_path, parser_type):
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    _type = 'filename'
    _dir_path: str = ''

    def get_component_body(self, component_path, parser_type):
        component_file = os.path.join(os.path.dirname(__file__), component_path)
        component_extension = os.path.splitext(component_path)[-1]

        with open(component_file, 'r') as f:
            if parser_type == "kfp":
                assert component_extension == '.yaml'
                try:
                    return yaml.safe_load(f)
                except yaml.YAMLError as e:
                    raise RuntimeError from e
            elif parser_type == "airflow":
                assert component_extension == '.py'
                # TODO: Is there a better way to read in files? Can we assume operator files are always
                # small enough to be read into memory? Reading and yielding by line likely won't
                # work because multiple lines need to be checked at once (or multiple times).
                return f.readlines()
            else:
                raise ValueError(f'File type {component_extension} is not supported.')


class UrlComponentReader(ComponentReader):
    _type = 'url'
    _url_path: str

    def get_component_body(self, component_path, parser_type):
        parsed_path = urllib.parse.urlparse(component_path).path

        component_extension = os.path.splitext(parsed_path)[-1]
        component_body = urllib.request.urlopen(component_path)

        if parser_type == "kfp":
            assert component_extension == ".yaml"
            try:
                return yaml.safe_load(component_body)
            except yaml.YAMLError as e:
                raise RuntimeError from e
        elif parser_type == "airflow":
            assert component_extension == ".py"
            return component_body.readlines()
        else:
            raise ValueError(f'File type {component_extension} is not supported.')


class ComponentRegistry(SingletonConfigurable):

    parsers = {
        KfpComponentParser._type: KfpComponentParser(),
        AirflowComponentParser._type: AirflowComponentParser(),
        ComponentParser._type: ComponentParser()
    }

    readers = {
        FilesystemComponentReader._type: FilesystemComponentReader(),
        UrlComponentReader._type: UrlComponentReader(),
        'local': ComponentReader()
    }

    def get_all_components(self, processor_type):
        """
        Builds a component palette in the form of a dictionary of components.
        """
        # Get parser for this processor
        parser = self._get_parser(processor_type)
        assert processor_type == parser._type

        # Get components common to all runtimes
        components = parser.get_common_config('palette')

        # Loop through all the component definitions for the given registry type
        reader = None
        for component in parser.list_all_components():
            self.log.debug(f"Component registry found component {component['name']}")

            # Get appropriate reader in order to read component definition
            if reader is None or reader._type != list(component['path'].keys())[0]:
                reader = self._get_reader(component)

            component_body = reader.get_component_body(component['path'][reader._type], parser._type)

            # Parse the component definition in order to add to palette
            component_json = parser.parse_component_details(component_body, component['name'])
            if component_json is None:
                continue
            components['categories'].append(component_json)

        return components

    def get_properties(self, processor_type, component_id):
        """
        Return the properties JSON for a given component.
        """
        default_components = ["notebooks", "python-script", "r-script"]

        # Get parser for this processor
        parser = self._get_parser(processor_type)

        properties = {}
        if parser._type == "local" or component_id in default_components:
            properties = parser.properties
        else:
            # Find component with given id in component catalog
            component = parser.return_component_if_exists(component_id)
            if component is None:
                raise ValueError(f"Component with ID {component_id} not found.")

            # Get appropriate reader in order to read component definition
            reader = self._get_reader(component)

            component_path = component['path'][reader._type]
            if reader._type == "filename":
                component_path = os.path.join(os.path.dirname(__file__), component_path)

            component_body = reader.get_component_body(component_path, parser._type)
            properties = parser.parse_component_properties(component_body, component_path)
            properties['current_parameters']['component_source_type'] = reader._type

        return properties

    def add_component(self, processor_type, request_body):
        """
        Add a component based on the provided definition. Definition will be provided in POST body
        in the format {"name": "desired_name", path": {"file/url": "filepath/urlpath"}}.
        """

        parser = self._get_parser(processor_type)
        parser.add_component(request_body)  # Maybe make this async to prevent reading issues in get_all_components()

        components = self.get_all_components(parser._type)
        return components

    def get_component_execution_details(self, processor_type, component_id):
        """
        Returns the implementation details of a given component.
        """
        parser = self._get_parser(processor_type)
        assert parser._type != "local"  # Local components should not have execution details

        component = parser.return_component_if_exists(component_id)
        if component is None:
            raise RuntimeError(f"Could not find parser for component {component_id}.")

        reader = self._get_reader(component)
        component_path = component['path'][reader._type]
        component_body = reader.get_component_body(component_path, parser._type)

        execution_instructions = parser.parse_component_execution_instructions(component_body)
        return execution_instructions

    def _get_reader(self, component):
        """
        Find the proper reader based on the given registry component.
        """
        try:
            component_type = list(component['path'].keys())[0]
            return self.readers.get(component_type)
        except Exception:
            raise ValueError("Unsupported registry type.")

    def _get_parser(self, processor_type: str):
        """
        Find the proper parser based on processor type.
        """
        try:
            return self.parsers[processor_type]
        except KeyError as ke:
            raise KeyError(f"Unsupported processor type: {processor_type}") from ke
