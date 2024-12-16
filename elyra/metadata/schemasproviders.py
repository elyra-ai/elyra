#
# Copyright 2018-2025 Elyra Authors
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
from traitlets import log  # noqa H306

try:
    from kfp_tekton import TektonClient
except ImportError:
    # We may not have kfp-tekton available and that's okay, for example when only using airflow!
    TektonClient = None

from elyra.metadata.schema import SchemasProvider
from elyra.metadata.schemaspaces import CodeSnippets
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.metadata.schemaspaces import RuntimeImages
from elyra.metadata.schemaspaces import Runtimes
from elyra.util.gitutil import SupportedGitTypes

try:
    from elyra.pipeline.kfp.kfp_authentication import SupportedAuthProviders
except ImportError:
    # We may not have kfp available and that's okay, for example when only using airflow!
    SupportedAuthProviders = None


class ElyraSchemasProvider(SchemasProvider, metaclass=ABCMeta):
    """Base class used for retrieving Elyra-based schema files from its metadata/schemas directory."""

    # Just read the schema files once.  Note that this list will also include the meta-schema.json.
    local_schemas = []
    schema_dir = os.path.join(os.path.dirname(__file__), "schemas")
    schema_files = [json_file for json_file in os.listdir(schema_dir) if json_file.endswith(".json")]
    for json_file in schema_files:
        schema_file = os.path.join(schema_dir, json_file)
        with io.open(schema_file, "r", encoding="utf-8") as f:
            schema_json = json.load(f)
            local_schemas.append(schema_json)

    def __init__(self):
        self.log = log.get_logger()
        # get set of registered runtimes
        self._runtime_processor_names = set()
        for processor in entrypoints.get_group_all("elyra.pipeline.processors"):
            # load the names of the runtime processors (skip 'local')
            if processor.name == "local":
                continue
            self._runtime_processor_names.add(processor.name)

    def get_local_schemas_by_schemaspace(self, schemaspace_id: str) -> List[Dict]:
        """Returns a list of local schemas associated with the given schemaspace_id"""
        schemas = []
        for schema in ElyraSchemasProvider.local_schemas:
            if schema.get("schemaspace_id") == schemaspace_id:
                schemas.append(schema)
        return schemas


class RuntimesSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Runtimes schemaspace only for THIS provider."""

    def get_schemas(self) -> List[Dict]:
        kfp_schema_present = False
        airflow_schema_present = False
        # determine if both airflow and kfp are needed and note if kfp is needed for later
        runtime_schemas = []
        schemas = self.get_local_schemas_by_schemaspace(Runtimes.RUNTIMES_SCHEMASPACE_ID)
        for schema in schemas:
            if schema["name"] in self._runtime_processor_names:
                runtime_schemas.append(schema)
                if schema["name"] == "kfp":
                    kfp_schema_present = True
                elif schema["name"] == "airflow":
                    airflow_schema_present = True
            else:
                self.log.error(
                    f"No entrypoint with name '{schema['name']}' was found in group "
                    f"'elyra.pipeline.processor' to match the schema with the same name. Skipping..."
                )

        if kfp_schema_present:  # Update the kfp engine enum to reflect current packages...
            # If TektonClient package is missing, navigate to the engine property
            # and remove 'tekton' entry if present and return updated result.
            if not TektonClient:
                # locate the schema and update the enum
                for schema in runtime_schemas:
                    if schema["name"] == "kfp":
                        engine_enum: list = schema["properties"]["metadata"]["properties"]["engine"]["enum"]
                        if "Tekton" in engine_enum:
                            engine_enum.remove("Tekton")
                            schema["properties"]["metadata"]["properties"]["engine"]["enum"] = engine_enum

            # For KFP schemas replace placeholders:
            # - properties.metadata.properties.auth_type.enum ({AUTH_PROVIDER_PLACEHOLDERS})
            # - properties.metadata.properties.auth_type.default ({DEFAULT_AUTH_PROVIDER_PLACEHOLDER})
            if SupportedAuthProviders is not None:
                auth_type_enum = SupportedAuthProviders.get_provider_names()
                auth_type_default = SupportedAuthProviders.get_default_provider().name

            for schema in runtime_schemas:
                if schema["name"] == "kfp":
                    if (
                        schema["properties"]["metadata"]["properties"].get("auth_type") is not None
                        and SupportedAuthProviders is not None
                    ):
                        schema["properties"]["metadata"]["properties"]["auth_type"]["enum"] = auth_type_enum
                        schema["properties"]["metadata"]["properties"]["auth_type"]["default"] = auth_type_default

        if airflow_schema_present:
            # Replace Git Type placeholders
            git_type_enum = list(map(lambda c: c.name, SupportedGitTypes.get_enabled_types()))
            git_type_default = SupportedGitTypes.get_default_type().name
            for schema in runtime_schemas:
                if schema["name"] == "airflow":
                    if schema["properties"]["metadata"]["properties"].get("git_type") is not None:
                        schema["properties"]["metadata"]["properties"]["git_type"]["enum"] = git_type_enum
                        schema["properties"]["metadata"]["properties"]["git_type"]["default"] = git_type_default

        return runtime_schemas


class RuntimeImagesSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Runtime Images schemaspace."""

    def get_schemas(self) -> List[Dict]:
        return self.get_local_schemas_by_schemaspace(RuntimeImages.RUNTIME_IMAGES_SCHEMASPACE_ID)


class CodeSnippetsSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Code Snippets schemaspace."""

    def get_schemas(self) -> List[Dict]:
        return self.get_local_schemas_by_schemaspace(CodeSnippets.CODE_SNIPPETS_SCHEMASPACE_ID)


class ComponentCatalogsSchemas(ElyraSchemasProvider):
    """Returns schemas relative to Component Catalogs schemaspace."""

    def get_schemas(self) -> List[Dict]:
        schemas = self.get_local_schemas_by_schemaspace(ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)
        return schemas
