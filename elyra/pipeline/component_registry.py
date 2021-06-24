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
import json
from http import HTTPStatus
import os
import requests

from traitlets.config import SingletonConfigurable, LoggingConfigurable

from elyra.pipeline.component import ComponentParser, Component
from typing import List


class ComponentReader(SingletonConfigurable):
    _type = 'local'

    def read_component_definition(self, location: str):
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    _type = 'filename'
    _dir_path: str = ''

    def read_component_definition(self, location):
        component_file = os.path.join(os.path.dirname(__file__), location)

        if not os.path.exists(component_file):
            raise FileNotFoundError(f'Invalid component location: {location}')

        with open(component_file, 'r') as f:
            return f.readlines()


class UrlComponentReader(ComponentReader):
    _type = 'url'
    _url_path: str

    def read_component_definition(self, location):
        res = requests.get(location)
        if res.status_code != HTTPStatus.OK:
            raise FileNotFoundError(f'Invalid component location: {location}')

        return res.text


class ComponentRegistry(LoggingConfigurable):
    readers = {
        FilesystemComponentReader._type: FilesystemComponentReader(),
        UrlComponentReader._type: UrlComponentReader()
    }

    def __init__(self, component_catalog_location: str, parser: ComponentParser):
        super().__init__()
        self._component_catalog_location = component_catalog_location
        self._parser = parser
        self.log.info(f'Creating new registry using {self.catalog_location}')

        # Read component catalog to get JSON
        self._catalog_json = self._read_component_catalog()

        self._components: List[Component] = list()
        for component_entry in self.component_catalog:
            # TODO Check for duplicate components?

            self.log.debug(f"Component registry found component {component_entry['name']}")

            # Get appropriate reader in order to read component definition
            reader = self._get_reader(component_entry)
            component_definition = \
                reader.read_component_definition(component_entry['location'][reader._type])

            # Parse the component definition and add to component object
            component: Component = self._parser.parse(component_entry['name'], component_definition)
            if component:
                self._components.append(component)

    @property
    def catalog_location(self) -> str:
        return self._component_catalog_location

    @property
    def component_catalog(self) -> list:
        if self._catalog_json:
            return list(self._catalog_json.values())
        else:
            return list()

    @property
    def components(self) -> list:
        return self._components

    def get_all_components(self):
        """
        Builds a component palette in the form of a dictionary of components.
        """

        print(f'Retrieving components from {self.catalog_location}')
        return self.to_canvas_palette()

    def get_component(self, component_id):
        """
        Get the body of the component catalog entry with the given id
        """
        component_entry = next((entry for id, entry in self._catalog_json.items() if component_id == id), None)
        if not component_entry:
            self.log.error(f"Component with ID '{component_id}' could not be found in the " +
                           f"{self._component_catalog_location} component catalog.")
            raise ValueError(f"Component with ID '{component_id}' could not be found in the " +
                             f"{self._component_catalog_location} component catalog.")

        return component_entry

    def get_properties(self, processor_type, component_id):
        """
        Return the properties JSON for a given component.
        """

        # Process component catalog
        # component_catalog = self._read_component_catalog()

        # Find component with given id in component catalog
        component_entry = self.get_component(component_id)

        # Get appropriate reader in order to read component definition
        reader = self._get_reader(component_entry)

        component_location = component_entry['location'][reader._type]
        if reader._type == "filename":
            component_location = os.path.join(os.path.dirname(__file__), component_location)

        component_body = reader.read_component_definition(component_location)
        properties = self._parser.parse_component_properties(component_body, component_location)
        properties['current_parameters']['component_source_type'] = reader._type

        return properties  # self.to_canvas_properties()

    def to_canvas_palette(self):
        """
        Converts registry components into appropriate canvas palette format
        """
        palette_json = list()

        for component in self.components:
            component_json = {
                'label': component.name,
                'image': "",
                'id': component.id,
                'description': component.description,
                'node_types': [{
                    'id': "",
                    'op': component.id,
                    'type': "execution_node",
                    'inputs': [{
                        "id": "inPort",
                        "app_data": {
                            "ui_data": {
                                "cardinality": {'min': 0, 'max': -1},
                                "label": "Input Port"
                            }
                        }
                    }],
                    'outputs': [{
                        "id": "outPort",
                        "app_data": {
                            "ui_data": {
                                "cardinality": {'min': 0, 'max': -1},
                                "label": "Output Port"
                            }
                        }
                    }],
                    'parameters': {},
                    'app_data': {
                        'ui-data': {
                            'label': component.name,
                            'description': component.description,
                            'image': "",
                            'x_pos': 0,
                            'y_pos': 0
                        }
                    }
                }]
            }

            palette_json.append(component_json)
        return palette_json

    def to_canvas_properties(self):
        """
        Converts registry components into appropriate canvas properties format
        """
        raise NotImplementedError()

    def _read_component_catalog(self):
        """
        Read a component catalog and return its component definitions.
        """

        with open(self._component_catalog_location, 'r') as catalog_file:
            catalog_json = json.load(catalog_file)

        if 'components' in catalog_json.keys():
            return catalog_json['components']
        else:
            return dict()

    def _get_reader(self, component):
        """
        Find the proper reader based on the given registry component.
        """
        try:
            # Get first (and only) key of 'location' subdictionary
            component_type = next(iter(component.get('location')))
            return self.readers.get(component_type)
        except Exception:
            raise ValueError("Unsupported registry type.")
