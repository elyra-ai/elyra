#
# Copyright 2018-2021 Elyra Authors
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
import os
import time
from types import SimpleNamespace
from typing import Dict
from typing import List
from typing import Optional

import entrypoints
from jinja2 import Environment
from jinja2 import PackageLoader
from jinja2 import Template
from traitlets import default
from traitlets import Integer
from traitlets.config import LoggingConfigurable  # noqa: H306 (alphabetical order catch-22)

from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser


class ComponentCatalog(LoggingConfigurable):
    """
    Component Catalog, responsible to provide a list of available components
    for each runtime. The catalog uses component parser to read and parse each
    component entry from the catalog and transform them into a component value object.
    """
    _cached_components: Dict[str, Component] = {}
    _cache_last_updated = None

    _generic_category_label = "Elyra"
    _generic_components: Dict[str, Component] = {
        "notebook": Component(id="notebook",
                              name="Notebook",
                              description="Run notebook file",
                              op="execute-notebook-node",
                              catalog_type="elyra",
                              source_identifier="elyra",
                              extensions=[".ipynb"],
                              categories=[_generic_category_label]),
        "python-script": Component(id="python-script",
                                   name="Python Script",
                                   description="Run Python script",
                                   op="execute-python-node",
                                   catalog_type="elyra",
                                   source_identifier="elyra",
                                   extensions=[".py"],
                                   categories=[_generic_category_label]),
        "r-script": Component(id="r-script",
                              name="R Script",
                              description="Run R script",
                              op="execute-r-node",
                              catalog_type="elyra",
                              source_identifier="elyra",
                              extensions=[".r"],
                              categories=[_generic_category_label])}

    ttl_default = 300
    cache_ttl_env = 'ELYRA_COMPONENT_CATALOG_CACHE_TTL'
    cache_ttl = Integer(ttl_default,
                        help="Time-to-live (in seconds) for Component Catalog cache entries. "
                             "(ELYRA_COMPONENT_CATALOG_CACHE_TTL env var)").tag(config=True)

    @default('cache_ttl')
    def cache_ttl_default(self):
        ttl = ComponentCatalog.ttl_default
        try:
            ttl = int(os.getenv(self.cache_ttl_env, ttl))
        except ValueError:
            pass
        return ttl

    def __init__(self,
                 parser: ComponentParser,
                 caching_enabled: bool = True,
                 **kwargs):
        super().__init__(**kwargs)
        self._parser = parser

        # Initialize the cache
        self.caching_enabled = caching_enabled
        if self.caching_enabled:
            self.log.debug(f"ComponentCatalog cache TTL: {self.cache_ttl}")
            self.update_cache()

    def get_all_components(self) -> List[Component]:
        """
        Retrieve all components; use the component catalog cache if enabled
        """
        if self.caching_enabled:
            if self._is_cache_expired():
                self.update_cache()
            return list(self._cached_components.values())

        return list(self._read_component_catalogs().values())

    def get_component(self, component_id: str) -> Optional[Component]:
        """
        Retrieve the component with a given component_id; use component catalog
        cache if enabled
        """
        component: Component
        if self.caching_enabled:
            if self._is_cache_expired():
                self.update_cache()
            component = self._cached_components.get(component_id)
        else:
            component = self._read_component_catalogs().get(component_id)

        if component is None:
            self.log.error(f"Component with ID '{component_id}' could not be found in any "
                           f"{self._parser.component_platform.name} catalog.")

        return component

    def update_cache(self, catalog: Optional[Metadata] = None, operation: Optional[str] = None):
        updated_components = self._read_component_catalogs([catalog] if catalog else None)

        if operation == 'modify':
            # Replace only the components most recently re-read
            for component_id, component in updated_components.items():
                self._cached_components[component_id] = component
        elif operation == 'delete':
            # Remove only the components most recently re-read
            for component_id, component in updated_components.items():
                self._cached_components.pop(component_id)
        else:
            # Replace all components in the cache
            self._cached_components = updated_components

        self._cache_last_updated = time.time()

    def _is_cache_expired(self) -> bool:
        is_expired = True
        if self._cache_last_updated:
            now = time.time()
            elapsed = int(now - self._cache_last_updated)
            if elapsed < self.cache_ttl:
                is_expired = False

        return is_expired

    @staticmethod
    def get_generic_components() -> List[Component]:
        return list(ComponentCatalog._generic_components.values())

    @staticmethod
    def get_generic_component(component_id: str) -> Component:
        return ComponentCatalog._generic_components.get(component_id)

    @staticmethod
    def load_jinja_template(template_name: str) -> Template:
        """
        Loads the jinja template of the given name from the
        elyra/templates/components folder
        """
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)

        return template_env.get_template(template_name)

    @staticmethod
    def to_canvas_palette(components: List[Component]) -> Dict:
        """
        Converts catalog components into appropriate canvas palette format
        """
        template = ComponentCatalog.load_jinja_template('canvas_palette_template.jinja2')

        # Define a fallback category for components with no given categories
        fallback_category_name = "No Category"

        # Convert the list of all components into a dictionary of
        # component lists keyed by category
        category_dict: Dict[str, List[Component]] = {}
        for component in components:
            categories = component.categories

            # Assign a fallback category so that component is not
            # lost during palette render
            if not categories:
                categories = [fallback_category_name]

            for category in categories:
                if category not in category_dict.keys():
                    category_dict[category] = []

                if component.id not in [comp.id for comp in category_dict[category]]:
                    category_dict[category].append(component)

        # Render template
        canvas_palette = template.render(category_dict=category_dict)
        return json.loads(canvas_palette)

    @staticmethod
    def to_canvas_properties(component: Component) -> Dict:
        """
        Converts catalog components into appropriate canvas properties format

        If component_id is one of the generic set, generic template is rendered,
        otherwise, the  runtime-specific property template is rendered
        """
        if component.id in ('notebook', 'python-script', 'r-script'):
            template = ComponentCatalog.load_jinja_template('generic_properties_template.jinja2')
        else:
            template = ComponentCatalog.load_jinja_template('canvas_properties_template.jinja2')

        canvas_properties = template.render(component=component)
        return json.loads(canvas_properties)

    def _read_component_catalogs(self, catalogs: Optional[List[Metadata]] = None) -> Dict[str, Component]:
        """
        Read through component catalogs and return a dictionary of components indexed by component_id.

        :param catalogs: a list of metadata instances from which to read and construct Component objects;
                         if none provided, all registries for the active runtime platform are assumed

        :returns: a dictionary of component id to Component object for all read/parsed components
        """
        component_dict: Dict[str, Component] = {}

        if not catalogs:
            catalogs = self._get_catalogs_for_runtime()
        for catalog in catalogs:
            # Assign reader based on the type of the catalog (the 'schema_name')
            try:
                catalog_reader = entrypoints.get_group_named('elyra.component.catalog_types').get(catalog.schema_name)
                if not catalog_reader:
                    self.log.error(f"No entrypoint with name '{catalog.schema_name}' was found in group "
                                   f"'elyra.component.catalog_types' to match the 'schema_name' given in catalog "
                                   f"'{catalog.display_name}'. Skipping...")
                    continue
                catalog_reader = catalog_reader.load()(self._parser.file_types, parent=self.parent)
            except Exception as e:
                self.log.error(f"Could not load appropriate ComponentCatalogConnector class: {e}. Skipping...")
                continue

            # Get content of component definition file for each component in this catalog
            self.log.debug(f"Processing components in catalog '{catalog.display_name}'")
            component_data_dict = catalog_reader.read_component_definitions(catalog)
            if not component_data_dict:
                continue

            for component_id, component_data in component_data_dict.items():
                component_entry = {
                    "component_id": component_id,
                    "catalog_type": catalog.schema_name,
                    "categories": catalog.metadata.get("categories", []),
                    "component_definition": component_data.get('definition'),
                    "component_identifier": component_data.get('identifier')
                }

                # Parse the component entry to get a fully qualified Component object
                components = self._parser.parse(SimpleNamespace(**component_entry)) or []
                for component in components:
                    component_dict[component.id] = component

        return component_dict

    def _get_catalogs_for_runtime(self) -> List[Metadata]:
        """
        Retrieve the catalogs relevant to the calling processor instance
        """
        runtime_catalogs = []
        try:
            registries = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID).get_all()

            # Filter catalogs according to processor type
            runtime_catalogs = \
                [r for r in registries if r.metadata['runtime_type'] == self._parser.component_platform.name]
        except Exception:
            self.log.error(f"Could not access catalogs for processor type: {self._parser.component_platform.name}")

        return runtime_catalogs
