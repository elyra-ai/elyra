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
import threading
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
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.pipeline.airflow.component_parser_airflow import AirflowComponentParser  # noqa F401 - TODO
from elyra.pipeline.catalog_connector import ComponentCatalogConnector
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component_metadata import ComponentCatalogMetadata
from elyra.pipeline.kfp.component_parser_kfp import KfpComponentParser  # noqa F401 - TODO
from elyra.pipeline.runtime_type import RuntimeProcessorType


class ComponentCatalog(SingletonConfigurable):
    # The _component_cache is indexed at the top level by runtime type name, e.g. 'APACHE_AIRFLOW',
    # and has as it's value another dictionary. At the second level, each sub-dictionary is indexed by
    # a ComponentCatalogMetadata instance name and its value is also a sub-dictionary. This lowest
    # level dictionary is indexed by component id and maps to the corresponding Component object.
    _component_cache: Dict[str, Dict[str, Dict[str, Component]]] = {}

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

        # Indicate whether this is a test environment. This is relevant in
        # update_cache_for_catalog() - we want to wait for the cache updater
        # thread to finish in test envs
        self._for_test = bool(kwargs.get('for_test'))

        self._cache_lock = threading.Lock()
        if not self._component_cache:
            self._build_cache()

    def _build_cache(self):
        """
        Reads through all ComponentCatalogMetadata instances to build the initial component cache
        """

        all_catalogs = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID).get_all()
        for catalog in all_catalogs:
            self.update_cache_for_catalog(catalog)  # type: ignore

    def update_cache_for_catalog(self, catalog: ComponentCatalogMetadata, operation: Optional[str] = None):
        """
        Updates the component cache for the given ComponentCatalogMetadata instance.
        """
        platform_name = catalog.runtime_type.name

        # Add sub-dictionary for this platform type if not present
        if not self._component_cache.get(platform_name):
            self._component_cache[platform_name] = {}

        def update_cache_with_thread():
            catalog_components = self._read_component_catalog(catalog)

            # Acquire lock before accessing component cache
            with self._cache_lock:
                if operation == 'delete':
                    # Remove only the components from this catalog
                    self._component_cache[platform_name].pop(catalog.name, None)
                else:
                    # Replace all components for the given catalog
                    self._component_cache[platform_name][catalog.name] = catalog_components

        # Start thread to perform the cache update
        updater_thread = threading.Thread(target=update_cache_with_thread)
        updater_thread.start()

        # Wait for tests to finish if test environment was indicated
        if self._for_test:
            updater_thread.join()

    def get_all_components(self, platform: RuntimeProcessorType) -> List[Component]:
        """
        Retrieve all components from component catalog cache
        """
        components: List[Component] = []

        platform_components = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_components in platform_components.items():
            components.extend(list(catalog_components.values()))

        if not components:
            self.log.error(f"No components could be found in any catalog for platform type '{platform.name}'.")

        return components

    def get_component(self, platform: RuntimeProcessorType, component_id: str) -> Optional[Component]:
        """
        Retrieve the component with a given component_id from component catalog cache
        """
        component: Optional[Component] = None

        platform_components = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_components in platform_components.items():
            component = catalog_components.get(component_id)
            if component:
                break

        if not component:
            self.log.error(f"Component with ID '{component_id}' could not be found in any catalog.")

        return component

    def _load_catalog_reader_class(self, catalog: ComponentCatalogMetadata, file_types: List[str]) \
            -> Optional[ComponentCatalogConnector]:
        """
        Load the appropriate entrypoint class based on the schema name indicated in
        the ComponentCatalogMetadata instance and the file types associated with the component
        parser in use
        """
        try:
            catalog_reader = entrypoints.get_group_named('elyra.component.catalog_types').get(catalog.schema_name)
            if not catalog_reader:
                self.log.error(f"No entrypoint with name '{catalog.schema_name}' was found in group "
                               f"'elyra.component.catalog_types' to match the 'schema_name' given in catalog "
                               f"'{catalog.display_name}'. Skipping...")
                return None

            catalog_reader = catalog_reader.load()(file_types, parent=self.parent)
        except Exception as e:
            self.log.error(f"Could not load appropriate ComponentCatalogConnector class: {e}. Skipping...")
            return None

        return catalog_reader

    def _read_component_catalog(self, catalog: ComponentCatalogMetadata) -> Dict[str, Component]:
        """
        Read a component catalog and return a dictionary of components indexed by component_id.

        :param catalog: a metadata instances from which to read and construct Component objects

        :returns: a dictionary of component id to Component object for all read/parsed components
        """
        components: Dict[str, Component] = {}

        # Assign component parser based on the runtime platform type
        parser = ComponentParser.create_instance(platform=catalog.runtime_type)

        # Assign reader based on the type of the catalog (the 'schema_name')
        catalog_reader = self._load_catalog_reader_class(catalog, parser.file_types)
        if not catalog_reader:
            return components

        # Get content of component definition file for each component in this catalog
        self.log.debug(f"Processing components in catalog '{catalog.display_name}'")
        component_data_dict = catalog_reader.read_component_definitions(catalog)
        if not component_data_dict:
            return components

        for component_id, component_data in component_data_dict.items():
            component_entry = {
                "component_id": component_id,
                "catalog_type": catalog.schema_name,
                "categories": catalog.metadata.get("categories", []),
                "component_definition": component_data.get('definition'),
                "component_identifier": component_data.get('identifier')
            }

            # Parse the component entry to get a fully qualified Component object
            parsed_components = parser.parse(SimpleNamespace(**component_entry)) or []
            for component in parsed_components:
                components[component.id] = component

        return components

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
        category_to_components: Dict[str, List[Component]] = {}
        for component in components:
            categories = component.categories

            # Assign a fallback category so that component is not
            # lost during palette render
            if not categories:
                categories = [fallback_category_name]

            for category in categories:
                if category not in category_to_components.keys():
                    category_to_components[category] = []

                if component.id not in [comp.id for comp in category_to_components[category]]:
                    category_to_components[category].append(component)

        # Render template
        canvas_palette = template.render(category_dict=category_to_components)
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
