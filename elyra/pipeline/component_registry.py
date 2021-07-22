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
from typing import Optional
from typing import Tuple

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
        "notebook": Component(id="notebook",
                              name="Notebook",
                              description="Run notebook file",
                              op="execute-notebook-node",
                              source_type="elyra",
                              source="elyra",
                              extensions=[".ipynb"],
                              category_id="generic"),
        "python-script": Component(id="python-script",
                                   name="Python Script",
                                   description="Run Python script",
                                   op="execute-python-node",
                                   source_type="elyra",
                                   source="elyra",
                                   extensions=[".py"],
                                   category_id="generic"),
        "r-script": Component(id="r-script",
                              name="R Script",
                              description="Run R script",
                              op="execute-r-node",
                              source_type="elyra",
                              source="elyra",
                              extensions=[".r"],
                              category_id="generic")}

    _generic_category: dict = SimpleNamespace(**({
        "id": "generic",
        "label": "Generic",
        "image": "",
        "description": "Components that are supported by all runtimes"
    }))

    def __init__(self, component_registry_location: str, parser: ComponentParser):
        super().__init__()
        self._component_registry_location = component_registry_location
        self._parser = parser
        self.log.info(f'Creating new registry using {self.registry_location}')

    @property
    def registry_location(self) -> str:
        return self._component_registry_location

    def get_all_components(self) -> Tuple[List[Component], List[Dict]]:
        """
        Retrieve all components from the component registry
        """
        components: List[Component] = list()

        # Read registry to find list of components
        component_entries, category_entries = self._read_component_registry()

        for component_entry in component_entries:
            # Parse component details and add to list
            component = self._parser.parse(component_entry)
            if component:
                components.extend(component)

        return components, category_entries

    def get_component(self, component_id) -> Component:
        """
        Return the properties JSON for a given component_id.
        """
        # Read component_entry catalog to get component_entry with given id
        catalog_entry_id = self._parser.get_catalog_entry_id_for_component(component_id)
        component_entry = self._get_component_registry_entry(catalog_entry_id)

        # Assign catalog_entry id for the use of parsers if suffixes have been added
        if catalog_entry_id != component_id:
            component_entry.id = component_id

        component = self._parser.parse(component_entry)
        if component:
            component = next(iter(component), None)
        return component

    @staticmethod
    def get_generic_components() -> List[Component]:
        return list(ComponentRegistry._generic_components.values())

    @staticmethod
    def get_generic_component(component_id: str) -> Component:
        return ComponentRegistry._generic_components.get(component_id)

    @staticmethod
    def get_generic_category() -> Dict:
        return ComponentRegistry._generic_category

    @staticmethod
    def to_canvas_palette(components: List[Component], categories: list) -> Dict:
        """
        Converts registry components into appropriate canvas palette format
        """
        # Load jinja2 template
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)
        template = template_env.get_template('canvas_palette_template.jinja2')

        canvas_palette = template.render(components=components, categories=categories)
        palette_json = json.loads(canvas_palette)
        return palette_json

    @staticmethod
    def to_canvas_properties(component: Component) -> Dict:
        """
        Converts registry components into appropriate canvas properties format
        """
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)

        # If component_id is one of the generic set, render with generic template,
        # else render with the runtime-specific property template
        if component.id in ('notebook', 'python-script', 'r-script'):
            template = template_env.get_template('generic_properties_template.jinja2')
        else:
            template = template_env.get_template('canvas_properties_template.jinja2')

        canvas_properties = template.render(component=component)
        properties_json = json.loads(canvas_properties)
        return properties_json

    def _read_component_registry(self) -> Tuple[List, List]:
        """
        Read a component registry and return a list of component definitions.
        """

        component_entries: list = list()
        category_entries: list = list()
        with open(self._component_registry_location, 'r') as catalog_file:
            catalog_json = json.load(catalog_file)
            if 'components' in catalog_json.keys():
                for component_id, component_entry in catalog_json['components'].items():
                    self.log.debug(f"Component registry: processing component {component_entry.get('name')}")

                    component_type = next(iter(component_entry.get('location')))
                    component_location = self._get_relative_location(component_type,
                                                                     component_entry["location"][component_type])

                    # TODO Add error checking for category here or elsewhere
                    entry = {
                        "id": component_id,
                        "name": component_entry["name"],
                        "type": component_type,
                        "location": component_location,
                        "catalog_entry_id": component_id,
                        "category_id": component_entry.get("category")
                    }
                    component_entries.append(SimpleNamespace(**entry))
            if 'categories' in catalog_json.keys():
                for category_id, category_metadata in catalog_json['categories'].items():

                    category_entry = {
                        "id": category_id,
                        "label": category_metadata["label"],
                        "image": category_metadata["image"],
                        "description": category_metadata["description"]
                    }
                    category_entries.append(SimpleNamespace(**category_entry))

        return component_entries, category_entries

    def _get_relative_location(self, component_type: str, component_path: str):
        """
        Gets the absolute path for a component from a file-based registry
        """
        if component_type == "filename":
            component_path = f"{self._parser._type}/{component_path}"
        return component_path

    def _get_component_registry_entry(self, component_id):
        """
        Get the body of the component registry entry with the given id
        """
        # Read registry to find list of components
        component_entries, _ = self._read_component_registry()

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

    _cached_components: List[Component] = list()
    _cached_categories: List[Dict] = list()
    _last_updated = None

    def __init__(self, component_registry_location: str, parser: ComponentParser, cache_ttl_in_seconds: int = 60):
        super().__init__(component_registry_location, parser)
        self.cache_ttl_in_seconds = cache_ttl_in_seconds

        # Initialize the cache
        self._update_cache()

    def get_all_components(self) -> List[Component]:
        if self._is_cache_expired():
            self._update_cache()

        return self._cached_components

    def get_component(self, component_id: str) -> Optional[Component]:
        if self._is_cache_expired():
            self._update_cache()

        cached_component = next((component for component in self._cached_components
                                 if component.id == component_id), None)
        return cached_component

    def get_categories(self) -> List[Dict]:
        if self._is_cache_expired():
            self._update_cache()

        return self._cached_categories

    def _update_cache(self):
        self._cached_components, self._cached_categories = super().get_all_components()
        self._last_updated = time.time()

    def _is_cache_expired(self) -> bool:
        is_expired = True
        if self._last_updated:
            now = time.time()
            elapsed = int(now - self._last_updated)
            if elapsed < self.cache_ttl_in_seconds:
                is_expired = False

        return is_expired
