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

from abc import abstractmethod
from traitlets.config import LoggingConfigurable

from elyra.pipeline.component import ComponentParser, Component
from typing import List, Dict


class ComponentReader(LoggingConfigurable):
    """
    Abstract class to model component readers that can read components from different locations
    """
    _type: str = None

    @property
    def type(self):
        return self._type

    @abstractmethod
    def read_component_definition(self, location: str, component: str) -> str:
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    """
    Read a component_id definition from the local filesystem
    """
    _type = 'filename'

    def read_component_definition(self, location: str, component: str) -> str:
        if not os.path.exists(location):
            self.log.error(f'Invalid location for component_id {component}: {location}')
            raise FileNotFoundError(f'Invalid location for component_id {component}: {location}')

        with open(location, 'r') as f:
            return f.read()


class UrlComponentReader(ComponentReader):
    """
    Read a component_id definition from a url
    """
    _type = 'url'

    def read_component_definition(self, location: str, component: str) -> str:
        res = requests.get(location)
        if res.status_code != HTTPStatus.OK:
            self.log.error(f'Invalid location for component_id {component}: {location}')
            raise FileNotFoundError(f'Invalid location for component_id {component}: {location}')

        return res.text


class ComponentRegistry(LoggingConfigurable):
    """
    Component Registry, responsible to provide a list of available components
    for each runtime. The registry uses component_id readers to read the component_id
    from the different locations and component_id parser to process the raw components
    and transform them into a component_id value object.
    """

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

    def get_all_components(self) -> List[Component]:
        """
        Retrieve all components from the component_id registry
        """
        components: List[Component] = list()

        # Read component_id catalog to get JSON
        component_entries = self._read_component_registry()

        for component_id, component_entry in component_entries.items():
            self.log.debug(f"Component registry found component_id {component_entry.get('name')}")

            # Get appropriate reader to read component_id definition
            reader = self._get_reader(component_entry)

            component_location = component_entry['location'][reader._type]
            # Adjust location to dislay full path
            if reader._type == "filename":
                component_location = os.path.join(os.path.dirname(__file__), component_location)

            component_definition = reader.read_component_definition(component_location, component_id)

            # Parse component_id details and add to list
            component = self._parser.parse(component_id, component_definition)
            if component:
                components.extend(component)

        return components

    def get_component_catalog_entry(self, component_id):
        """
        Get the body of the component_id catalog entry with the given id
        """
        # Read component_id catalog to get JSON
        component_entries = self._read_component_registry()

        # Find entry with the appropriate id, if exists
        component_entry = next((entry for id, entry in component_entries.items() if component_id == id), None)
        if not component_entry:
            self.log.error(f"Component with ID '{component_id}' could not be found in the " +
                           f"{self._component_registry_location} component_id catalog.")
            raise ValueError(f"Component with ID '{component_id}' could not be found in the " +
                             f"{self._component_registry_location} component_id catalog.")

        return component_entry

    def get_component(self, component_id):
        """
        Return the properties JSON for a given component_id.
        """
        # Read component catalog to get component with given id
        adjusted_id = self._parser.get_adjusted_component_id(component_id)
        component_entry = self.get_component_catalog_entry(adjusted_id)

        # Get appropriate reader to read component_id definition
        reader = self._get_reader(component_entry)

        component_location = component_entry['location'][reader._type]
        # Adjust location to dislay full path
        if reader._type == "filename":
            component_location = os.path.join(os.path.dirname(__file__), component_location)

        component_definition = reader.read_component_definition(component_location, component_id)

        properties = self._parser.parse_properties(component_id, component_definition,
                                                   component_location, reader._type)
        component = self._parser.parse(component_id, component_definition, properties)

        return component

    @staticmethod
    def get_generic_components() -> List[Component]:
        generic_components = [Component(id="notebooks",
                                        name="Notebook",
                                        description="Notebook file",
                                        op="execute-notebook-node"),
                              Component(id="python-script",
                                        name="Python",
                                        description="Python Script",
                                        op="execute-python-node"),
                              Component(id="r-script",
                                        name="R",
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

        return template.render(components=components)

    @staticmethod
    def to_canvas_properties(component: Component) -> dict:
        """
        Converts registry components into appropriate canvas properties format
        """
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)

        # If component_id is one of the generic set, render with generic template,
        # else render with the runtime-specific property template
        if component in ('notebooks', 'python-script', 'r-script'):
            template = template_env.get_template('generic_properties_template.jinja2')
            if component == "notebooks":
                component_type = "notebook"
                file_type = ".ipynb"
            elif component == "python-script":
                component_type = "Python"
                file_type = ".py"
            elif component == "r-script":
                component_type = "R"
                file_type = ".r"

            properties_json = template.render(component_type=component_type, file_type=file_type)
        else:
            template = template_env.get_template('canvas_properties_template.jinja2')
            properties_json = template.render(properties=component.properties)

        return properties_json

    def _read_component_registry(self) -> Dict:
        """
        Read a component_id catalog and return its component_id definitions.
        """

        with open(self._component_registry_location, 'r') as catalog_file:
            catalog_json = json.load(catalog_file)

        if 'components' in catalog_json.keys():
            return catalog_json['components']
        else:
            return dict()

    def _get_reader(self, component):
        """
        Find the proper reader based on the given registry component_id.
        """
        if not component:
            raise ValueError("Invalid null component_id")

        try:
            # Get first (and only) key of 'location' subdictionary
            component_type = next(iter(component.get('location')))
            return self.readers.get(component_type)
        except Exception:
            raise ValueError(f'Unsupported registry type {component_type}.')
