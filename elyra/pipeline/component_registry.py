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
import time
from types import SimpleNamespace
from typing import Dict
from typing import List

from jinja2 import Environment
from jinja2 import PackageLoader
from traitlets.config import LoggingConfigurable

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser


class ComponentRegistry(LoggingConfigurable):
    """
    Component Registry, responsible to provide a list of available components
    for each runtime. The registry uses component parser to read and parse each
    component entry from the catalog and transform them into a component value object.
    """

    _generic_components: Dict[str, Component] = {
        "notebooks": Component(id="notebooks",
                               name="Notebook",
                               description="Run notebook file",
                               op="execute-notebook-node",
                               extension=".ipynb"),
        "python-script": Component(id="python-script",
                                   name="Python Script",
                                   description="Run Python script",
                                   op="execute-python-node",
                                   extension=".py"),
        "r-script": Component(id="r-script",
                              name="R Script",
                              description="Run R script",
                              op="execute-r-node",
                              extension=".r")}

    def __init__(self, component_registry_location: str, parser: ComponentParser):
        super().__init__()
        self._component_registry_location = component_registry_location
        self._parser = parser
        self.log.info(f'Creating new registry using {self.registry_location}')

    @property
    def registry_location(self) -> str:
        return self._component_registry_location

    def get_all_components(self) -> List[Component]:
        """
        Retrieve all components from the component registry
        """
        components: List[Component] = list()

        # Read registry to find list of components
        component_entries = self._read_component_registry()

        for component_entry in component_entries:
            # Parse component details and add to list
            component = self._parser.parse(component_entry)
            if component:
                components.extend(component)

        return components

    def get_component(self, component_id) -> Component:
        """
        Return the properties JSON for a given component_id.
        """
        # Read component_entry catalog to get component_entry with given id
        adjusted_id = self._parser.get_adjusted_component_id(component_id)
        component_entry = self._get_component_registry_entry(adjusted_id)

        # Assign adjusted id for the use of parsers if prefixes have been added
        if adjusted_id != component_id:
            component_entry.adjusted_id = component_id

        component = self._parser.parse(component_entry)[0]
        return component

    @staticmethod
    def get_generic_components() -> List[Component]:
        return list(ComponentRegistry._generic_components.values())

    @staticmethod
    def get_generic_component(component_id: str) -> Component:
        return ComponentRegistry._generic_components.get(component_id)

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
        if component.id in ('notebooks', 'python-script', 'r-script'):
            template = template_env.get_template('generic_properties_template.jinja2')
            properties_json = template.render(component=component)
        else:
            template = template_env.get_template('canvas_properties_template.jinja2')
            properties_json = template.render(properties=component.properties)

        return properties_json

    def _read_component_registry(self) -> List:
        """
        Read a component registry and return a list of component definitions.
        """

        component_entries: list = list()
        with open(self._component_registry_location, 'r') as catalog_file:
            catalog_json = json.load(catalog_file)
            if 'components' in catalog_json.keys():
                for component_id, component_entry in catalog_json['components'].items():
                    self.log.debug(f"Component registry: processing component {component_entry.get('name')}")

                    component_type = next(iter(component_entry.get('location')))
                    entry = {
                        "id": component_id,
                        "name": component_entry["name"],
                        "type": component_type,
                        "location": component_entry["location"][component_type],
                        "adjusted_id": None
                    }
                    component_entries.append(SimpleNamespace(**entry))

        return component_entries

    def _get_component_registry_entry(self, component_id):
        """
        Get the body of the component registry entry with the given id
        """
        # Read registry to find list of components
        component_entries = self._read_component_registry()

        # Find entry with the appropriate id, if exists
        component_entry = next((entry for entry in component_entries if entry.id == component_id), None)
        if not component_entry:
            self.log.error(f"Component with ID '{component_id}' could not be found in the " +
                           f"{self._component_registry_location} component_id catalog.")
            raise ValueError(f"Component with ID '{component_id}' could not be found in the " +
                             f"{self._component_registry_location} component_id catalog.")

        return component_entry


class CachedComponentRegistry(ComponentRegistry):
    """
    Cached component_entry registry, builds on top of the vanilla component_entry registry
    adding a cache layer to optimize catalog reads.
    """

    _cache: List[Component] = list()
    _last_updated = None

    def __init__(self, component_registry_location: str, parser: ComponentParser, cache_ttl_in_seconds: int = 60):
        super().__init__(component_registry_location, parser)
        self.cache_ttl_in_seconds = cache_ttl_in_seconds

        # Initialize the cache
        self.get_all_components()

    def get_all_components(self) -> List[Component]:
        if self._is_cache_expired():
            self._update_cache()

        return self._cache

    def get_component(self, component_id: str) -> Component:
        if self._is_cache_expired():
            self._update_cache()

        cached_component = next((component for component in self._cache if component.id == component_id), None)
        return cached_component

    def _update_cache(self):
        self._cache = super().get_all_components()
        self._last_updated = time.time()

    def _is_cache_expired(self):
        is_expired = True
        if self._last_updated:
            now = time.time()
            elapsed = int(now - self._last_updated)
            if elapsed < self.cache_ttl_in_seconds:
                is_expired = False

        return is_expired
