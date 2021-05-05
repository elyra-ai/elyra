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

default_current_parameters = {
    "filename": "",
    "runtime_image": "",
    "outputs": [],
    "env_vars": [],
    "dependencies": [],
    "include_subdirectories": False
}


def get_id_from_name(name):
    return ' '.join(name.lower().replace('-', '').split()).replace(' ', '-')


def set_node_type_data(id, label, description):
    node_type = {
        'id': "",
        'op': f"execute-{id}-node",
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
    properties: dict() = {}
    parameters: dict() = {}

    def __init__(self):
        super().__init__()
        self.properties = self.get_common_config('properties')

    def get_common_config(self, config_name):
        common_dir = os.path.join(os.path.dirname(__file__), 'resources')
        common_file = os.path.join(common_dir, f"{config_name}.json")
        with io.open(common_file, 'r', encoding='utf-8') as f:
            common_json = json.load(f)

        return common_json

    def _get_component_catalog_json(self):
        catalog_dir = os.path.join(os.path.dirname(__file__), "resources")
        catalog_file = os.path.join(catalog_dir, f"{self._type}_component_catalog.json")
        with open(catalog_file, 'r') as f:
            catalog_json = json.load(f)

        return catalog_json['components']

    def list_all_components(self):
        components = []
        if self._type != "local":
            for component in self._get_component_catalog_json():
                assert "path" in component
                components.append(component)

        return components

    def return_component_if_exists(self, component_id):
        for component in self._get_component_catalog_json():
            if component['id'] == component_id:
                return component
        return None

    def add_component(self, request_body):
        component_json = {
            'name': request_body['name'],
            'id': get_id_from_name(request_body['name']),
            'path': request_body['path']
        }

        catalog_json = self._get_component_catalog_json()
        catalog_json['components'].append(component_json)

        catalog_dir = os.path.join(os.path.dirname(__file__), "resources")
        catalog_file = os.path.join(catalog_dir, f"{self._type}_component_catalog.json")
        with open(catalog_file, 'a') as f:
            f.write(json.dumps(catalog_json))

    def parse_component_details(self, component):
        """Get component name, id, description for palette JSON"""
        pass

    def parse_component_properties(self, component):
        """Get component properties for properties JSON"""
        raise NotImplementedError


class KfpComponentParser(ComponentParser):
    _type = "kfp"

    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_body):
        component_json = {
            'label': component_body['name'],
            'image': "",
            'id': get_id_from_name(component_body['name']),
            'description': ' '.join(component_body['description'].split()),
            'node_types': []
        }

        node_type = set_node_type_data(component_json['id'],
                                       component_json['label'],
                                       component_json['description'])
        component_json['node_types'].append(node_type)

        return component_json

    def parse_component_properties(self, component_body):
        '''
        Build the current_parameters object according to the YAML, return this portion.
        '''
        # Start with generic properties
        component_parameters = self.get_common_config('properties')

        # TODO Do we need to/should we pop these?
        for element in ['runtime_image', 'env_vars', 'dependencies', 'outputs', 'include_subdirectories']:
            component_parameters['current_parameters'].pop(element, None)

        # Define new input group object
        input_group_info = {
            'id': "nodeInputControls",  # need to actually figure out the control id
            'type': "controls",
            'parameter_refs': []
        }

        inputs = component_body['inputs']
        for input_object in inputs:
            new_parameter, parameter_info = self.build_parameter(input_object, "input")

            # TODO: Adjust this to return an empty value for whatever type the parameter is?
            default_value = ""
            if "default" in input_object:
                default_value = input_object['default']

            # Add to existing parameter list
            component_parameters['parameters'].append(new_parameter)
            component_parameters['current_parameters'][new_parameter['id']] = default_value

            # Add to existing parameter info list
            component_parameters['uihints']['parameter_info'].append(parameter_info)

            # Add parameter to input group info
            input_group_info['parameter_refs'].append(new_parameter['id'])

        # Append input group info to parameter details
        component_parameters['uihints']['group_info'][0]['group_info'].append(input_group_info)

        # Define new output group object
        output_group_info = {
            'id': "nodeOutputControls",  # need to actually figure out the control id
            'type': "controls",
            'parameter_refs': []
        }

        outputs = component_body['outputs']
        for output_object in outputs:
            new_parameter, parameter_info = self.build_parameter(output_object, "output")

            # TODO Adjust this to return an empty value for whatever type the parameter is?
            default_value = ""

            # Add to existing parameter list
            component_parameters['parameters'].append(new_parameter)
            component_parameters['current_parameters'][new_parameter['id']] = default_value

            # Add to existing parameter info list
            component_parameters['uihints']['parameter_info'].append(parameter_info)

            # Add parameter to output group info
            output_group_info['parameter_refs'].append(new_parameter['id'])

        # Append output group info to parameter details
        component_parameters['uihints']['group_info'][0]['group_info'].append(output_group_info)

        return component_parameters

    def build_parameter(self, obj, obj_type):
        new_parameter = {}

        new_parameter['id'] = f"elyra{obj_type}_{obj['name'].replace(' ', '_')}"

        # Assign type, default to string??
        if "type" in obj:
            new_parameter['type'] = obj['type']
        else:
            new_parameter['type'] = "string"

        # Determine whether parameter is optional
        if ("optional" in obj and obj['optional']) \
                or ("description" in obj and "required" in obj['description'].lower()):
            new_parameter['required'] = True
        else:
            new_parameter['required'] = False

        # Build parameter_info
        # TODO Determine if any other param info should be added here, e.g. control, separator, orientation, etc.
        parameter_info = {
            'parameter_ref': new_parameter['id'],
            'label': {
                "default": obj['name']
            },
            'description': {
                "default": obj['description']
            }
        }

        # TODO Add conditions?

        return new_parameter, parameter_info

    def parse_component_execution_instructions(self, component_body):
        pass


class AirflowComponentParser(ComponentParser):
    _type = "airflow"

    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_filename):
        return None

    def parse_component_properties(self, component):
        return None


class ComponentReader(SingletonConfigurable):
    _type = 'local'

    def __init__(self):
        super().__init__()

    def get_component_body(self, component_path):
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    _type = 'file'
    _dir_path: str = 'resources'

    def __init__(self):
        super().__init__()

    def get_component_body(self, component_path):
        component_dir = os.path.join(os.path.dirname(__file__), self._dir_path)
        component_file = os.path.join(component_dir, component_path)

        with open(component_file, 'r') as f:
            try:
                component_yaml = yaml.safe_load(f)
            except yaml.YAMLError as e:
                raise RuntimeError from e

        return component_yaml


class UrlComponentReader(ComponentReader):
    _type = 'url'
    _url_path: str

    def __init__(self):
        super().__init__()

    def get_component_body(self, component_path):
        try:
            component_body = urllib.request.urlopen(component_path)
            component_yaml = yaml.safe_load(component_body)
        except yaml.YAMLError as e:
            raise RuntimeError from e
        except Exception as e:
            raise RuntimeError from e

        return component_yaml


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

    def get_all_components(self, registry_type, processor_type):
        """
        Builds a component palette in the form of a dictionary of components.
        """

        parser = self._get_parser(processor_type)
        assert processor_type == parser._type

        # Get components common to all runtimes
        components = parser.get_common_config('palette')

        # Loop through all the component definitions for the given registry type
        reader = None
        for component in parser.list_all_components():
            print(f"component registry -> found component {component['name']}")

            # Get appropriate reader in order to read component definition
            if reader is None or reader._type != list(component['path'].keys())[0]:
                reader = self._get_reader(component)

            component_body = reader.get_component_body(component['path'][reader._type])

            # Parse the component definition in order to add to palette
            component_json = parser.parse_component_details(component_body)
            if component_json is None:
                continue
            components['categories'].append(component_json)

        return components

    def get_properties(self, processor_type, component_id):
        """
        Return the properties JOSN for a given component.
        """
        default_components = ["notebooks", "python-script", "r-script"]

        parser = self._get_parser(processor_type)

        if parser._type == "local" or component_id in default_components:
            properties = parser.get_common_config('properties')
        else:
            component = parser.return_component_if_exists(component_id)
            if component is None:
                raise ValueError(f"Component with ID {component_id} not found.")

            reader = self._get_reader(component)

            component_path = component['path'][reader._type]
            component_body = reader.get_component_body(component_path)
            properties = parser.parse_component_properties(component_body)

        return properties

    def add_component(self, processor_type, request_body):
        """
        Add a component based on the provided definition. Definition will be provided in POST body
        in the format {"name": "desired_name", path": {"file/url": "filepath/urlpath"}}.
        """

        parser = self._get_parser(processor_type)
        parser.add_component(request_body)  # Maybe make this async to prevent reading issues in get_all_components()

        components = self.get_all_components(None, parser._type)
        return components

    def get_component_execution_details(self, processor_type, component_id):
        """
        Returns the implementation details of a given component.
        """
        parser = self._get_parser(processor_type)
        assert parser._type != "local"  # Local components should not have execution details

        component = parser.return_component_if_exists(component_id)

        reader = self._get_reader(component)
        component_path = component['path'][reader._type]
        component_body = reader.get_component_body(component_path)

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
            return self.parsers.get(processor_type)
        except Exception:
            raise ValueError(f"Unsupported processor type: {processor_type}")
