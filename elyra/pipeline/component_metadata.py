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
from logging import getLogger
from typing import Any

from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.pipeline.processor import PipelineProcessorRegistry


class ComponentRegistryMetadata(Metadata):
    """
    This class contains methods to trigger cache updates on modification
    and deletion of component registry metadata instances.
    """

    def on_load(self, **kwargs: Any) -> None:
        """Since this class is tied to a deprecated schema, use on_load to trigger migration """

        if self.metadata['location_type'] == 'URL':
            self.schema_name = "url-catalog"
        elif self.metadata['location_type'] == 'Directory':
            self.schema_name = "local-directory-catalog"
        else:  # self.location_type == 'Filename'
            self.schema_name = "local-file-catalog"

        self.metadata.pop('location_type')
        self.version = 1

        getLogger('ServerApp').info(f"Migrating 'component-registry' instance '{self.name}' "
                                    f"to schema '{self.schema_name}'...")
        MetadataManager(schemaspace="component-registries").update(self.name, self, for_migration=True)

    def post_save(self, **kwargs: Any) -> None:
        raise RuntimeError("ComponentRegistry schema is deprecated!")

    def post_delete(self, **kwargs: Any) -> None:
        raise RuntimeError("ComponentRegistry schema is deprecated!")


class ComponentCatalogMetadata(Metadata):
    """
    This class contains methods to trigger cache updates on modification
    and deletion of component registry metadata instances.
    """
    def on_load(self, **kwargs: Any) -> None:
        """Check for runtime property and update to runtime_type """
        if 'runtime' in self.metadata:
            if self.metadata['runtime'] == 'kfp':
                self.metadata['runtime_type'] = 'KUBEFLOW_PIPELINES'
            else:  # self.metadata['runtime'] == 'airflow'
                self.metadata['runtime_type'] = 'APACHE_AIRFLOW'
            self.metadata.pop('runtime', None)
            getLogger('ServerApp').info(f"Upgrading component-registry {self.schema_name} instance '{self.name}' "
                                        f"to include runtime_type '{self.metadata['runtime_type']}'...")
            MetadataManager(schemaspace="component-registries").update(self.name, self, for_migration=True)

    def post_save(self, **kwargs: Any) -> None:
        processor_name = self.metadata.get('runtime')

        # Get processor instance and update its cache
        try:
            processor = PipelineProcessorRegistry.instance().get_processor(processor_name=processor_name)
            if processor.component_registry.caching_enabled:
                processor.component_registry.update_cache()
        except Exception:
            pass

    def post_delete(self, **kwargs: Any) -> None:
        processor_type = self.metadata.get('runtime')

        # Get processor instance and update its cache
        try:
            processor = PipelineProcessorRegistry.instance().get_processor(processor_name=processor_type)
            if processor.component_registry.caching_enabled:
                processor.component_registry.update_cache()
        except Exception:
            pass


class UrlCatalogMetadata(ComponentCatalogMetadata):
    pass


class DirectoryCatalogMetadata(ComponentCatalogMetadata):
    pass


class FilenameCatalogMetadata(ComponentCatalogMetadata):
    pass
