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

    def get_common_config(self):
        common_dir = os.path.join(os.path.dirname(__file__), 'resources')
        common_file = os.path.join(common_dir, "palette.json")
        with io.open(common_file, 'r', encoding='utf-8') as f:
            common_json = json.load(f)

            properties_file = os.path.join(common_dir, "properties.json")
            with io.open(properties_file, 'r', encoding='utf-8') as props:
                properties = json.load(props)

                for component in common_json['categories']:
                    self.properties[component["id"]] = properties
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

    def parse_component_details(self, component_filename):
        component_json = {}

        with open(component_filename, 'r') as f:
            try:
                yaml_obj = yaml.safe_load(f)

                component_json['label'] = yaml_obj['name']
                component_json['image'] = ""
                component_json['id'] = ' '.join(yaml_obj['name'].lower().replace('-', '').split()).replace(' ', '-')
                component_json['description'] = ' '.join(yaml_obj['description'].split())

                component_json['node_types'] = []

                node_type = set_node_type_data(component_json['id'],
                                               component_json['label'],
                                               component_json['description'])
                component_json['node_types'].append(node_type)

                # self.properties = self.parse_component_properties(component)
                self.properties[component_json['id']] = {"prop": "value"}

            except yaml.YAMLError as e:
                raise RuntimeError from e

        return component_json

    def parse_component_properties(self, component):
        properties_json = {}

        with open(component + ".yaml", 'r') as f:
            try:
                yaml_obj = yaml.safe_load(f)
                properties_json = yaml_obj

                # Add additional properties to properties_json
            except yaml.YAMLError as e:
                raise RuntimeError from e

        return properties_json


class AirflowComponentParser(ComponentParser):
    _type = "airflow"

    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_filename):
        return None

    def parse_component_properties(self, component):
        return None


class ComponentReader(SingletonConfigurable):

    def __init__(self):
        super().__init__()

    def _list_all_components(self):
        # Relative to jupyter work_dir right now
        pass

    def add_component(self, processor_type, component_json):
        pass

    def component_exists(self, processor_type, component):
        pass


class FilesystemComponentReader(ComponentReader):
    reader_type = 'file'
    _dir_path: str

    def __init__(self):
        super().__init__()

    def _list_all_components(self):
        # Relative to jupyter work_dir right now
        return []
        # return ["examples/example1.yaml", "examples/example2.yaml"]

    def add_component(self, processor_type, component_json):
        pass

    def component_exists(self, processor_type, component):
        pass


class UrlComponentReader(ComponentReader):
    reader_type = 'url'
    _url_path: str

    def __init__(self):
        super().__init__()


class ComponentRegistry(SingletonConfigurable):

    parsers = {
        'kfp': KfpComponentParser(),
        'airflow': AirflowComponentParser(),
        'local': ComponentParser()
    }

    readers = {
        FilesystemComponentReader.reader_type: FilesystemComponentReader(),
        UrlComponentReader.reader_type: UrlComponentReader(),
    }

    def get_all_components(self, processor_type, registry_type):
        """
        Builds a component palette in the form of a dictionary of components.
        """

        reader = self._get_reader(registry_type)
        parser = self._get_parser(processor_type)

        # First get components common to all runtimes
        components = parser.get_common_config()

        # Loop through all the component definitions for the given registry type
        for component in reader._list_all_components():
            print(f'component registry -> found component {component}')

            component_json = parser.parse_component_details(component)
            if component_json is None:
                continue
            components['categories'].append(component_json)

        return components

    def get_properties(self, processor_type, component):
        parser = ComponentParser.instance()
        print(parser.properties)
        try:
            return parser.properties[component]
        except KeyError:
            raise KeyError(f"Component {component} not found")

    def _get_reader(self, registry_type: str):
        """
        Find the proper reader based on the given registry type.
        """

        try:
            return self.readers.get(registry_type)
        except Exception:
            raise ValueError(f"Unsupported registry type: {registry_type}")

    def _get_parser(self, processor_type: str):
        """
        Find the proper parser based on processor type.
        """

        try:
            return self.parsers.get(processor_type)
        except Exception:
            raise ValueError(f"Unsupported processor type: {processor_type}")
