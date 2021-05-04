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


default_components = ["notebooks", "python-script", "r-script"]


def set_node_type_data(id, label, description):
    node_type = {}
    node_type['id'] = ""
    node_type['op'] = f"execute-{id}-node"
    node_type['type'] = "execution_node"
    node_type['inputs'] = [inputs]
    node_type['outputs'] = [outputs]
    node_type['parameters'] = {}

    node_type['app_data'] = {}
    node_type['app_data']['ui_data'] = {}
    node_type['app_data']['ui_data']['label'] = label
    node_type['app_data']['ui_data']['description'] = description
    node_type['app_data']['ui_data']['image'] = ""
    node_type['app_data']['ui_data']['x_pos'] = 0
    node_type['app_data']['ui_data']['y_pos'] = 0

    return node_type


class ComponentParser(SingletonConfigurable):
    properties: dict() = {}

    def __init__(self):
        super().__init__()

    def get_common_config(self, config_name):
        common_dir = os.path.join(os.path.dirname(__file__), 'resources')
        common_file = os.path.join(common_dir, f"{config_name}.json")
        with io.open(common_file, 'r', encoding='utf-8') as f:
            common_json = json.load(f)

        return common_json

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
        component_json = {}

        component_id = ' '.join(component_body['name'].lower().replace('-', '').split()).replace(' ', '-')

        component_json['label'] = component_body['name']
        component_json['image'] = ""
        component_json['id'] = component_id
        component_json['description'] = ' '.join(component_body['description'].split())

        component_json['node_types'] = []

        node_type = set_node_type_data(component_json['id'],
                                       component_json['label'],
                                       component_json['description'])
        component_json['node_types'].append(node_type)

        # Set properties info for this component for each of later access
        # May want to move this if taking too long to return component info
        self.parse_component_properties(component_body)

        return component_json

    def parse_component_properties(self, component_body):
        '''
        Add new parameters to properties object according to the YAML.
        Build the current_parameters object according to the YAML, return this portion.

        parameters []: {id, type, required (T/F)}
        uihints {}: lots of this will need to be dictated by frontend needs
        conditions []: based on logic given in YAML
        '''
        component_id = ' '.join(component_body['name'].lower().replace('-', '').split()).replace(' ', '-')

        current_parameters = {}
        if component_id in self.properties:
            current_parameters = self.properties[component_id]
        elif component_id in default_components:
            current_parameters = default_current_parameters
        else:
            current_parameters = {"param": "value"}
            self.properties[component_id] = current_parameters

        print(current_parameters)
        return current_parameters


class AirflowComponentParser(ComponentParser):
    _type = "airflow"

    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_filename):
        return None

    def parse_component_properties(self, component):
        return None


class ComponentReader(SingletonConfigurable):
    reader_type = 'local'

    def __init__(self):
        super().__init__()

    def _get_component_catalog_json(self):
        catalog_dir = os.path.join(os.path.dirname(__file__), "resources")
        catalog_file = os.path.join(catalog_dir, "kfp_component_catalog.json")
        with open(catalog_file, 'r') as f:
            catalog_json = json.load(f)
        return catalog_json['components']

    def list_all_components(self):
        return self._get_component_catalog_json()

    def get_component(self, component_id):
        for component in self.list_all_components():
            print(component)
            if component['id'] == component_id:
                return component['path'][self.reader_type]

    def add_component(self, processor_type, component_json):
        pass

    def component_exists(self, component_id):
        for component in self._get_component_catalog_json():
            if component['id'] == component_id:
                return component
        return False


class FilesystemComponentReader(ComponentReader):
    reader_type = 'file'
    _dir_path: str = 'resources'

    def __init__(self):
        super().__init__()

    def list_all_components(self):
        components = []
        for component in self._get_component_catalog_json():
            if "path" in component and "file" in component['path']:
                components.append(component)
        return components

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
    reader_type = 'url'
    _url_path: str

    def __init__(self):
        super().__init__()

    def list_all_components(self):
        components = []
        for component in self._get_component_catalog_json():
            if "path" in component and "url" in component['path']:
                components.append(component)
        return components

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
        'local': ComponentParser()
    }

    readers = {
        FilesystemComponentReader.reader_type: FilesystemComponentReader(),
        UrlComponentReader.reader_type: UrlComponentReader(),
        'local': ComponentReader()
    }

    def get_all_components(self, registry_type, processor_type):
        """
        Builds a component palette in the form of a dictionary of components.
        """

        parser = self._get_parser(processor_type)

        # Get components common to all runtimes
        components = parser.get_common_config('palette')

        # Set properties for default components
        parser.properties = parser.get_common_config('properties')

        # Loop through all the component definitions for the given registry type
        for component in ComponentReader().list_all_components():
            print(f"component registry -> found component {component['name']}")

            # TODO: Figure out how to handle default components
            if component['id'] in default_components:
                continue

            # Get appropriate reader in oder to read component definition
            reader = self._get_reader(list(component['path'].keys())[0])
            component_body = reader.get_component_body(component['path'][reader.reader_type])

            # Parse the component definition in order to add to palette
            component_json = parser.parse_component_details(component_body)
            if component_json is None:
                continue
            components['categories'].append(component_json)

        return components

    def get_properties(self, processor_type, component_id):
        '''
        if component_id in default_components:
            return parser.properties
        elif reader.component_exists(component_id):
            current_params = parser.parse_component_properties(component_id)
            parser.properties["current_parameters"] = current_params
        '''
        parser = self._get_parser(processor_type)
        parser.properties = parser.get_common_config('properties')
        current_parameters = default_current_parameters

        if ComponentReader().component_exists(component_id):
            if component_id not in default_components:
                reader = self._get_reader_from_catalog(component_id)
                component_path = reader.get_component(component_id)
                component_body = reader.get_component_body(component_path)
                current_parameters = parser.parse_component_properties(component_body)
        else:
            raise ValueError(f"Component with ID {component_id} not found.")

        parser.properties['current_parameters'] = current_parameters
        return parser.properties

    def _get_reader(self, registry_type: str):
        """
        Find the proper reader based on the given registry type.
        """

        try:
            return self.readers.get(registry_type)
        except Exception:
            raise ValueError(f"Unsupported registry type: {registry_type}")

    def _get_reader_from_catalog(self, component_id: str):
        """
        Find the proper reader based on the given component id.
        """

        for component in ComponentReader().list_all_components():
            if 'path' not in component:
                continue

            path = component['path']
            if component['id'] == component_id and 'file' in path:
                return self.readers.get('file')
            elif component['id'] == component_id and 'url' in path:
                return self.readers.get('url')

        raise ValueError("Could not determine registry type from component catalog.")

    def _get_parser(self, processor_type: str):
        """
        Find the proper parser based on processor type.
        """

        try:
            return self.parsers.get(processor_type)
        except Exception:
            raise ValueError(f"Unsupported processor type: {processor_type}")
