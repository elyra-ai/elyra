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

from abc import ABCMeta
import io
import json
import os
from typing import Dict
from typing import List

import entrypoints
try:
    from kfp_tekton import TektonClient
except ImportError:
    # We may not have kfp-tekton available and that's okay!
    TektonClient = None

from elyra.metadata.schema import SchemasProvider


class ElyraSchemasProvider(SchemasProvider, metaclass=ABCMeta):
    """Base class used for retrieving Elyra-based schema files from its metadata/schemas directory."""

    def __init__(self):
        # get set of registered runtimes
        self._runtime_processor_names = set()
        for processor in entrypoints.get_group_all('elyra.pipeline.processors'):
            # load the names of the runtime processors (skip 'local')
            if processor.name == 'local':
                continue
            self._runtime_processor_names.add(processor.name)

    def get_schemas_by_name(self, schema_names: List[str]) -> List[Dict]:
        schemas = []
        schema_dir = os.path.join(os.path.dirname(__file__), 'schemas')
        schema_files = [json_file for json_file in os.listdir(schema_dir) if json_file.endswith('.json')]
        for json_file in schema_files:
            basename = os.path.splitext(json_file)[0]
            if basename in schema_names:
                schema_file = os.path.join(schema_dir, json_file)
                with io.open(schema_file, 'r', encoding='utf-8') as f:
                    schema_json = json.load(f)
                    schemas.append(schema_json)
        return schemas


class RuntimesSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Runtimes schemaspace only for THIS provider."""

    elyra_processors = ['airflow', 'kfp']

    def get_schemas(self) -> List[Dict]:
        schemas = []
        kfp_needed = False
        # determine if both airflow and kfp are needed and note if kfp is needed for later
        for elyra_processor in self.elyra_processors:
            if elyra_processor in self._runtime_processor_names:
                schemas.append(elyra_processor)
                if elyra_processor == 'kfp':
                    kfp_needed = True

        runtime_schemas = self.get_schemas_by_name(schemas)
        if kfp_needed:  # Update the kfp engine enum to reflect current packages...
            # If TektonClient package is missing, navigate to the engine property
            # and remove 'tekton' entry if present and return updated result.
            if not TektonClient:
                # locate the schema and update the enum
                for schema in runtime_schemas:
                    if schema['name'] == 'kfp':
                        engine_enum: list = schema['properties']['metadata']['properties']['engine']['enum']
                        if 'Tekton' in engine_enum:
                            engine_enum.remove('Tekton')
                            schema['properties']['metadata']['properties']['engine']['enum'] = engine_enum
        return runtime_schemas


class RuntimeImagesSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Runtime Images schemaspace."""
    def get_schemas(self) -> List[Dict]:
        return self.get_schemas_by_name(['runtime-image'])


class CodeSnippetsSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Code Snippets schemaspace."""
    def get_schemas(self) -> List[Dict]:
        return self.get_schemas_by_name(['code-snippet'])


class ComponentRegistriesSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Component Registries schemaspace."""
    def get_schemas(self) -> List[Dict]:
        schemas = self.get_schemas_by_name(['component-registry'])

        # Update runtime enum with set of currently registered runtimes
        for schema in schemas:
            schema['properties']['metadata']['properties']['runtime']['enum'] = list(self._runtime_processor_names)

        return schemas
