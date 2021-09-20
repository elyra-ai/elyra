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
from typing import Dict

import entrypoints

from elyra.metadata.metadata import Metadata
from elyra.metadata.schema import SchemaFilter
from elyra.pipeline.processor import PipelineProcessorRegistry


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


class ComponentRegistryMetadata(Metadata):
    """
    This class contains methods to trigger cache updates on modification
    and deletion of component registry metadata instances.
    """

    def post_save(self, **kwargs: Any) -> None:
        processor_type = self.to_dict()['metadata']['runtime']

        # Get processor instance and update its cache
        processor = PipelineProcessorRegistry.instance().get_processor(processor_type=processor_type)
        processor.component_registry.update_cache()

    def post_delete(self, **kwargs: Any) -> None:
        processor_type = self.to_dict()['metadata']['runtime']

        # Get processor instance and update its cache
        processor = PipelineProcessorRegistry.instance().get_processor(processor_type=processor_type)
        processor.component_registry.update_cache()
