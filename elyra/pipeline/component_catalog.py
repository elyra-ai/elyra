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
from types import SimpleNamespace
from typing import Dict
from typing import List
from typing import Optional

import entrypoints
from jinja2 import Environment
from jinja2 import PackageLoader
from jinja2 import Template
from traitlets.config import SingletonConfigurable

from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.pipeline.airflow.component_parser_airflow import AirflowComponentParser  # noqa F401 - TODO
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.kfp.component_parser_kfp import KfpComponentParser  # noqa F401 - TODO


class ComponentCatalog(SingletonConfigurable):
    _component_cache: Dict[str, Dict] = {}

    @property
    def component_cache(self):
        return self._component_cache

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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        if not self._component_cache:
            self._build_cache()

    def _build_cache(self):
        """
        Reads through all catalog Metadata instances to build the initial component cache
        """
        all_catalogs = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID).get_all()
        for catalog in all_catalogs:
            self.update_cache_for_catalog(catalog)

    def update_cache_for_catalog(self, catalog: Metadata, operation: Optional[str] = None):
        """
        Updates the component cache for the given catalog Metadata instance
        """
        platform_type = catalog.metadata['runtime_type']

        # Add sub-dictionary for this platform type if not present
        if not self._component_cache.get(platform_type):
            self._component_cache[platform_type] = {}
        catalog_components = self._read_component_catalog(catalog, platform_type)

        if operation == 'delete':
            # Remove only the components from this catalog
            self._component_cache[platform_type].pop(catalog.name)
        else:
            # Replace all components for the given catalog
            self._component_cache[platform_type][catalog.name] = catalog_components

    def get_all_components(self, platform_type: str) -> List[Component]:
        """
        Retrieve all components from component catalog cache
        """
        components: List[Component] = []

        platform_components_dict = ComponentCatalog._component_cache.get(platform_type, {})
        for catalog_name, component_dict in platform_components_dict.items():
            components.extend(list(component_dict.values()))

        if not components:
            self.log.error(f"No components could be found in any catalog for platform type '{platform_type}'.")

        return components

    def get_component(self, platform_type: str, component_id: str) -> Optional[Component]:
        """
        Retrieve the component with a given component_id from component catalog cache
        """
        component: Optional[Component] = None

        platform_components_dict = ComponentCatalog._component_cache.get(platform_type, {})
        for catalog_name, component_dict in platform_components_dict.items():
            component = component_dict.get(component_id)
            if component:
                break

        if not component:
            self.log.error(f"Component with ID '{component_id}' could not be found in any catalog.")

        return component

    def _read_component_catalog(self, catalog: Metadata, platform_type) -> Dict[str, Component]:
        """
        Read a component catalog and return a dictionary of components indexed by component_id.

        :param catalog: a metadata instances from which to read and construct Component objects

        :returns: a dictionary of component id to Component object for all read/parsed components
        """
        component_dict: Dict[str, Component] = {}

        # Assign reader based on the type of the catalog (the 'schema_name')
        try:
            parser = ComponentParser(platform_type=platform_type)

            catalog_reader = entrypoints.get_group_named('elyra.component.catalog_types').get(catalog.schema_name)
            if not catalog_reader:
                self.log.error(f"No entrypoint with name '{catalog.schema_name}' was found in group "
                               f"'elyra.component.catalog_types' to match the 'schema_name' given in catalog "
                               f"'{catalog.display_name}'. Skipping...")
                return component_dict

            catalog_reader = catalog_reader.load()(parser.file_types, parent=self.parent)
        except Exception as e:
            self.log.error(f"Could not load appropriate ComponentCatalogConnector class: {e}. Skipping...")
            return component_dict

        # Get content of component definition file for each component in this catalog
        self.log.debug(f"Processing components in catalog '{catalog.display_name}'")
        component_data_dict = catalog_reader.read_component_definitions(catalog)
        if not component_data_dict:
            return component_dict

        for component_id, component_data in component_data_dict.items():
            component_entry = {
                "component_id": component_id,
                "catalog_type": catalog.schema_name,
                "categories": catalog.metadata.get("categories", []),
                "component_definition": component_data.get('definition'),
                "component_identifier": component_data.get('identifier')
            }

            # Parse the component entry to get a fully qualified Component object
            components = parser.parse(SimpleNamespace(**component_entry)) or []
            for component in components:
                component_dict[component.id] = component

        return component_dict

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
