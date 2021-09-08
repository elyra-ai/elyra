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

import entrypoints
from jinja2 import Environment
from jinja2 import PackageLoader
from jsonschema import ValidationError
from traitlets.config import LoggingConfigurable

from elyra.metadata.error import MetadataNotFoundError
from elyra.metadata.manager import MetadataManager
from elyra.metadata.schema import SchemaFilter
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component import ComponentReader
from elyra.pipeline.component import DirectoryComponentReader
from elyra.pipeline.component import FilesystemComponentReader
from elyra.pipeline.component import UrlComponentReader


class ComponentRegistry(LoggingConfigurable):
    """
    Component Registry, responsible to provide a list of available components
    for each runtime. The registry uses component parser to read and parse each
    component entry from the catalog and transform them into a component value object.
    """
    _generic_category_label = "Elyra"
    _generic_components: Dict[str, Component] = {
        "notebook": Component(id="notebook",
                              name="Notebook",
                              description="Run notebook file",
                              op="execute-notebook-node",
                              location_type="elyra",
                              location="elyra",
                              extensions=[".ipynb"],
                              categories=[_generic_category_label]),
        "python-script": Component(id="python-script",
                                   name="Python Script",
                                   description="Run Python script",
                                   op="execute-python-node",
                                   location_type="elyra",
                                   location="elyra",
                                   extensions=[".py"],
                                   categories=[_generic_category_label]),
        "r-script": Component(id="r-script",
                              name="R Script",
                              description="Run R script",
                              op="execute-r-node",
                              location_type="elyra",
                              location="elyra",
                              extensions=[".r"],
                              categories=[_generic_category_label])}

    def __init__(self, parser: ComponentParser, **kwargs):
        super().__init__(**kwargs)
        self._parser = parser

    def get_all_components(self) -> List[Component]:
        """
        Retrieve all components from the component registry
        """

        components = self._read_component_registries()
        return list(components.values())

    def get_component(self, component_id: str) -> Component:
        """
        Retrieve the component with a given component_id.
        """

        component_dict = self._read_component_registries()
        component = component_dict.get(component_id)
        if component is None:
            self.log.error(f"Component with ID '{component_id}' could not be found in any "
                           f"{self._parser.component_platform} registries.")
            raise ValueError(f"Component with ID '{component_id}' could not be found in any "
                             f"{self._parser.component_platform} registries.")

        return component

    @staticmethod
    def get_generic_components() -> List[Component]:
        return list(ComponentRegistry._generic_components.values())

    @staticmethod
    def get_generic_component(component_id: str) -> Component:
        return ComponentRegistry._generic_components.get(component_id)

    @staticmethod
    def to_canvas_palette(components: List[Component]) -> Dict:
        """
        Converts registry components into appropriate canvas palette format
        """
        # Load jinja2 template
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)
        template = template_env.get_template('canvas_palette_template.jinja2')

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

        # Reorder the dictionary such that components with
        # no category to render last
        fallback_category = category_dict.pop(fallback_category_name, None)
        if fallback_category:
            category_dict[fallback_category_name] = fallback_category

        # Render template
        canvas_palette = template.render(category_dict=category_dict)
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

    def _read_component_registries(self) -> Dict[str, Component]:
        """
        Read through component registries and return a dictionary of components indexed by component_id.
        """
        component_dict: Dict[str, Component] = {}

        try:
            metadata_manager = MetadataManager(namespace=MetadataManager.NAMESPACE_COMPONENT_REGISTRIES)
            all_registries = [r.to_dict(trim=True) for r in metadata_manager.get_all()]

            # Filter registries according to processor type
            runtime_registries = filter(lambda r: r['metadata']['runtime'] == self._parser.component_platform,
                                        all_registries)
        except (ValidationError, ValueError):
            raise
        except MetadataNotFoundError:
            raise
        except Exception:
            raise

        for registry in runtime_registries:
            registry_name = registry['display_name']
            self.log.debug(f"Component registry: processing components in registry '{registry_name}'")

            # Assign reader based on the location type of the registry (file, directory, url)
            registry_type = registry['metadata']['location_type'].lower()
            reader = self._get_reader(registry_type, self._parser.file_types)

            # Read the path array to get the absolute paths of all components associated with this registry
            component_paths = reader.get_absolute_locations(registry['metadata']['paths'])
            for path in component_paths:
                # TODO Figure out what would be the best path to display to the user
                # TODO when accessing the node properties panel, since components can
                # TODO now come from myriad locations

                # Read in contents of the component
                component_definition = reader.read_component_definition(path)

                component_entry = {
                    "location_type": reader.resource_type,
                    "location": path,
                    "categories": registry['metadata'].get("categories", []),
                    "component_definition": component_definition
                }

                # Parse the component entry to get a fully qualified Component object
                components = self._parser.parse(SimpleNamespace(**component_entry)) or []
                for component in components:
                    component_dict[component.id] = component

        return component_dict

    def _get_reader(self, registry_location_type: str, file_types: List[str]) -> ComponentReader:
        """
        Find the proper reader based on the given registry location type
        """
        readers = {
            FilesystemComponentReader.location_type: FilesystemComponentReader(file_types),
            DirectoryComponentReader.location_type: DirectoryComponentReader(file_types),
            UrlComponentReader.location_type: UrlComponentReader(file_types)
        }

        reader = readers.get(registry_location_type)
        if not reader:
            raise ValueError(f"Unsupported registry type: '{registry_location_type}'")

        return reader


class CachedComponentRegistry(ComponentRegistry):
    """
    Cached component_entry registry, builds on top of the vanilla component_entry registry
    adding a cache layer to optimize registry reads.
    """

    _cached_components: Dict[str, Component] = {}
    _last_updated = None

    def __init__(self, parser: ComponentParser, cache_ttl_in_seconds: int = 60):
        super().__init__(parser)
        self.cache_ttl_in_seconds = cache_ttl_in_seconds

        # Initialize the cache
        self._update_cache()

    def get_all_components(self) -> List[Component]:
        """
        Retrieve all components from the component registry cache
        """
        if self._is_cache_expired():
            self._update_cache()

        return list(self._cached_components.values())

    def get_component(self, component_id: str) -> Optional[Component]:
        """
        Retrieve the component with a given component_id.
        """
        if self._is_cache_expired():
            self._update_cache()

        return self._cached_components.get(component_id)

    def _update_cache(self):
        self._cached_components = super()._read_component_registries()
        self._last_updated = time.time()

    def _is_cache_expired(self) -> bool:
        is_expired = True
        if self._last_updated:
            now = time.time()
            elapsed = int(now - self._last_updated)
            if elapsed < self.cache_ttl_in_seconds:
                is_expired = False

        return is_expired


class RegistrySchemaFilter(SchemaFilter):
    """
    This class exists to ensure that the component registry schema's runtime
    metadata appropriately reflects the available runtimes.
    """

    def post_load(self, name: str, schema_json: Dict) -> Dict:
        """Ensure available runtimes are present and add to schema as necessary."""

        filtered_schema = super().post_load(name, schema_json)

        # Get processor names
        runtime_enum = []
        for processor_name in entrypoints.get_group_named('elyra.pipeline.processors').keys():
            if processor_name == "local":
                continue
            runtime_enum.append(processor_name)

        # Add runtimes to schema
        filtered_schema['properties']['metadata']['properties']['runtime']['enum'] = runtime_enum
        return filtered_schema
