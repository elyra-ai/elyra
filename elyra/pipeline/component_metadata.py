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
from typing import Any

from elyra.metadata.metadata import Metadata
from elyra.pipeline.processor import PipelineProcessorRegistry


class ComponentRegistryMetadata(Metadata):
    pass


class ComponentCatalogMetadata(Metadata):
    """
    This class contains methods to trigger cache updates on modification
    and deletion of component catalog metadata instances.
    """

    def post_save(self, **kwargs: Any) -> None:
        processor_type = self.metadata.get('runtime_type')

        # Get component catalog and update its cache
        try:  # TODO: This should move to ComponentCatalog once made a singleton
            component_catalog = PipelineProcessorRegistry.instance().get_catalog(processor_type)
            if component_catalog.caching_enabled:
                component_catalog.update_cache(catalog=self, operation='modify')
        except Exception:
            pass

    def post_delete(self, **kwargs: Any) -> None:
        processor_type = self.metadata.get('runtime_type')

        # Get component catalog and update its cache
        try:  # TODO: This should move to ComponentCatalog once made a singleton
            component_catalog = PipelineProcessorRegistry.instance().get_catalog(processor_type)
            if component_catalog.caching_enabled:
                component_catalog.update_cache(catalog=self, operation='delete')
        except Exception:
            pass


class UrlCatalogMetadata(ComponentCatalogMetadata):
    pass


class DirectoryCatalogMetadata(ComponentCatalogMetadata):
    pass


class FilenameCatalogMetadata(ComponentCatalogMetadata):
    pass
