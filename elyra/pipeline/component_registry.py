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
from jinja2 import Environment, PackageLoader
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

    def __init__(self, _component_registry_location: str, parser: ComponentParser):
        super().__init__()
        self._component_registry_location = _component_registry_location
        self._parser = parser
        self.log.info(f'Creating new registry using {self.registry_location}')

    @property
    def registry_location(self) -> str:
        return self._component_registry_location

    def get_all_components(self):
        """
        Retrieve all components from the component registry
        """
        components: List[Component] = list()

        # Read component catalog to get JSON
        component_entries = self._read_component_registry()

        for component_id, component_entry in component_entries.items():
            self.log.debug(f"Component registry found component {component_entry.get('name')}")

            # Parse component details and add to list
            component: Component = self.get_component(component_id, component_entry, parse_properties=False)
            if component:
                components.append(component)

        return components

    def get_component_catalog_entry(self, component_id):
        """
        Get the body of the component catalog entry with the given id
        """
        # Read component catalog to get JSON
        component_entries = self._read_component_registry()

        # Find entry with the appropriate id, if exists
        component_entry = next((entry for id, entry in component_entries.items() if component_id == id), None)
        if not component_entry:
            self.log.error(f"Component with ID '{component_id}' could not be found in the " +
                           f"{self._component_registry_location} component catalog.")
            raise ValueError(f"Component with ID '{component_id}' could not be found in the " +
                             f"{self._component_registry_location} component catalog.")

        return component_entry

    def get_component(self, component_id, component_entry=None, parse_properties=True):
        """
        Return the properties JSON for a given component.
        """

        # Find component with given id in component catalog
        if not component_entry:
            component_entry = self.get_component_catalog_entry(component_id)

        # Get appropriate reader to read component definition
        reader = self._get_reader(component_entry)

        component_location = component_entry['location'][reader._type]
        # if reader._type == "filename":
        #    component_location = os.path.join(os.path.dirname(__file__), component_location)

        component_definition = reader.read_component_definition(component_location)

        properties = None
        if parse_properties:
            properties = self._parser.parse_properties(component_definition, component_location, reader._type)
        component: Component = self._parser.parse(component_entry.get('name'), component_definition, properties)

        return component

    @staticmethod
    def get_generic_components() -> List[Component]:
        generic_components = [Component(id="notebooks",
                                        name="Notebook",
                                        description="Notebook file",
                                        op="execute-notebook-node"),
                              Component(id="python-script",
                                        name="Python Script",
                                        description="Python Script",
                                        op="execute-python-node"),
                              Component(id="r-script",
                                        name="R Script",
                                        description="R Script",
                                        op="execute-r-node")]
        return generic_components

    @staticmethod
    def to_canvas_palette(components: List[Component]) -> dict:
        """
        Converts registry components into appropriate canvas palette format
        """
        # Load jinja2 template
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)
        template = template_env.get_template('canvas_palette_template.jinja2')

        return template.render(components=components,
                               num_components=len(components))

    @staticmethod
    def to_canvas_properties(component: Component) -> dict:
        """
        Converts registry components into appropriate canvas properties format
        """
        # Load jinja2 template
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)
        template = template_env.get_template('canvas_properties_template.jinja2')

        return template.render(properties=component.properties,
                               num_properties=len(component.properties))

    def _read_component_registry(self):
        """
        Read a component catalog and return its component definitions.
        """

        with open(self._component_registry_location, 'r') as catalog_file:
            catalog_json = json.load(catalog_file)

        if 'components' in catalog_json.keys():
            return catalog_json['components']
        else:
            return dict()

    def _get_reader(self, component):
        """
        Find the proper reader based on the given registry component.
        """
        if not component:
            raise ValueError("Invalid null component")

        try:
            # Get first (and only) key of 'location' subdictionary
            component_type = next(iter(component.get('location')))
            return self.readers.get(component_type)
        except Exception:
            raise ValueError(f'Unsupported registry type {component_type}.')
