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

from jinja2 import Environment
from jinja2 import PackageLoader
from traitlets.config import LoggingConfigurable

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentCategory
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
                              catalog_entry_id="elyra",
                              extensions=[".ipynb"],
                              category_id="generic"),
        "python-script": Component(id="python-script",
                                   name="Python Script",
                                   description="Run Python script",
                                   op="execute-python-node",
                                   source_type="elyra",
                                   source="elyra",
                                   catalog_entry_id="elyra",
                                   extensions=[".py"],
                                   category_id="generic"),
        "r-script": Component(id="r-script",
                              name="R Script",
                              description="Run R script",
                              op="execute-r-node",
                              source_type="elyra",
                              source="elyra",
                              catalog_entry_id="elyra",
                              extensions=[".r"],
                              category_id="generic")}

    _generic_category = ComponentCategory(id="generic",
                                          label="Generic",
                                          image_location="",
                                          description="Components that are supported by all runtimes")

    def __init__(self, component_registry_location: str, parser: ComponentParser, **kwargs):
        super().__init__(**kwargs)
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

        components: List[Component] = self._read_component_registry().get('components')
        return components

    def get_component(self, component_id: str) -> Component:
        """
        Return the component with a given component_id.
        """

        catalog_entry_id = self._parser.get_catalog_entry_id_for_component(component_id)
        component = self._read_registry_for_component(component_id, catalog_entry_id)

        return component

    def get_all_categories(self) -> List[ComponentCategory]:
        """
        Retrieve all categories from the component registry
        """

        categories: List[ComponentCategory] = self._read_component_registry().get('categories')
        return categories

    @staticmethod
    def get_generic_components() -> List[Component]:
        return list(ComponentRegistry._generic_components.values())

    @staticmethod
    def get_generic_component(component_id: str) -> Component:
        return ComponentRegistry._generic_components.get(component_id)

    @staticmethod
    def get_generic_category() -> ComponentCategory:
        return ComponentRegistry._generic_category

    @staticmethod
    def to_canvas_palette(components: List[Component], categories: List[ComponentCategory]) -> Dict:
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

    def _read_component_registry(self) -> Dict[str, List]:
        """
        Read a component registry and return a dictionary of lists of components and categories.
        """

        registry = {
            "components": list(),
            "categories": list()
        }

        with open(self._component_registry_location, 'r') as catalog_file:
            catalog_json = json.load(catalog_file)
            # Process component entries from catalog
            if 'components' in catalog_json.keys():
                for component_id, component_entry in catalog_json['components'].items():
                    self.log.debug(f"Component registry: processing component {component_id}")

                    component_type = next(iter(component_entry.get('location')))
                    component_location = self._get_relative_location(component_type,
                                                                     component_entry["location"][component_type])

                    # TODO Add error checking for category here or elsewhere
                    # TODO Consider creating a miscellaneous category if none is given
                    component_entry = {
                        "id": component_id,
                        "name": component_entry.get("name"),
                        "type": component_type,
                        "location": component_location,
                        "catalog_entry_id": component_id,
                        "category_id": component_entry.get("category")
                    }

                    # Parse the component entry to get a fully qualified Component object
                    component = self._parser.parse(SimpleNamespace(**component_entry))
                    if component:
                        registry['components'].extend(component)

            # Process category entries from catalog
            if 'categories' in catalog_json.keys():
                for category_id, category_metadata in catalog_json['categories'].items():

                    category_entry = ComponentCategory(id=category_id,
                                                       label=category_metadata.get('label'),
                                                       image_location=category_metadata.get('image'),
                                                       description=category_metadata.get('description'))
                    registry['categories'].append(category_entry)

        return registry

    def _get_relative_location(self, component_type: str, component_path: str) -> str:
        """
        Gets the absolute path for a component from a file-based registry
        """
        if component_type == "filename":
            component_path = f"{self._parser._type}/{component_path}"
        return component_path

    def _read_registry_for_component(self, queried_component_id: str, catalog_entry_id: str) -> Component:
        with open(self._component_registry_location, 'r') as catalog_file:
            catalog_json = json.load(catalog_file)
            component_entry = catalog_json['components'].get(catalog_entry_id)
            if not component_entry:
                self.log.error(f"Component with ID '{queried_component_id}' could not be found in the " +
                               f"{self._component_registry_location} component_id catalog.")
                raise ValueError(f"Component with ID '{queried_component_id}' could not be found in the " +
                                 f"{self._component_registry_location} component_id catalog.")

            # Get the key name ('url' or 'filename') from the 'location' dictionary entry
            location_type = next(iter(component_entry.get('location')))
            component_location = self._get_relative_location(location_type,
                                                             component_entry["location"][location_type])

            component_entry = {
                "id": queried_component_id,
                "name": component_entry.get("name"),
                "type": location_type,
                "location": component_location,
                "catalog_entry_id": catalog_entry_id,
                "category_id": component_entry.get("category")
            }

            # Parse component entry to get a fully qualified Component object
            component = self._parser.parse(SimpleNamespace(**component_entry))
            return component


class CachedComponentRegistry(ComponentRegistry):
    """
    Cached component_entry registry, builds on top of the vanilla component_entry registry
    adding a cache layer to optimize catalog reads.
    """

    _cached_components: List[Component] = list()
    _cached_categories: List[ComponentCategory] = list()
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

    def get_all_categories(self) -> List[ComponentCategory]:
        if self._is_cache_expired():
            self._update_cache()

        return self._cached_categories

    def _update_cache(self):
        registry = super()._read_component_registry()
        self._cached_components = registry.get('components')
        self._cached_categories = registry.get('categories')

        self._last_updated = time.time()

    def _is_cache_expired(self) -> bool:
        is_expired = True
        if self._last_updated:
            now = time.time()
            elapsed = int(now - self._last_updated)
            if elapsed < self.cache_ttl_in_seconds:
                is_expired = False

        return is_expired
