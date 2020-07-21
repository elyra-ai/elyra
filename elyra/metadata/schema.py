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
import copy
import io
import json
import os
import warnings

from traitlets.config import SingletonConfigurable
from typing import Optional

from .error import SchemaNotFoundError


METADATA_TEST_NAMESPACE = "metadata-tests"  # exposed via METADATA_TESTING env


class SchemaManager(SingletonConfigurable):
    """Singleton used to store all schemas for all metadata types.
       Note: we currently don't refresh these entries.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # namespace_schemas is a dict of namespace keys to dict of schema_name keys of JSON schema
        self.namespace_schemas = SchemaManager.load_namespace_schemas()

    def validate_namespace(self, namespace: str) -> None:
        """Ensures the namespace is valid and raises ValueError if it is not."""
        if namespace not in self.namespace_schemas.keys():
            raise ValueError("Namespace '{}' is not in the list of valid namespaces: '{}'".
                             format(namespace, self.get_namespaces()))

    def get_namespaces(self) -> list:
        return list(self.namespace_schemas.keys())

    def get_namespace_schemas(self, namespace: str) -> dict:
        self.validate_namespace(namespace)
        schemas = self.namespace_schemas.get(namespace)
        return schemas

    def get_schema(self, namespace: str, schema_name: str) -> dict:
        self.validate_namespace(namespace)
        schemas = self.namespace_schemas.get(namespace)
        if schema_name not in schemas.keys():
            raise SchemaNotFoundError(namespace, schema_name)
        schema_json = schemas.get(schema_name)

        return schema_json

    def add_schema(self, namespace: str, schema_name: str, schema: dict) -> None:
        """Adds (updates) schema to set of stored schemas. """
        self.validate_namespace(namespace)
        self.log.debug("SchemaManager: Adding schema '{}' to namespace '{}'".format(schema_name, namespace))
        self.namespace_schemas[namespace][schema_name] = schema

    def clear_all(self) -> None:
        """Primarily used for testing, this method reloads schemas from initial values. """
        self.log.debug("SchemaManager: Reloading all schemas for all namespaces.")
        self.namespace_schemas = SchemaManager.load_namespace_schemas()

    def remove_schema(self, namespace: str, schema_name: str) -> None:
        """Removes the schema entry associated with namespace & schema_name. """
        self.validate_namespace(namespace)
        self.log.debug("SchemaManager: Removing schema '{}' from namespace '{}'".format(schema_name, namespace))
        self.namespace_schemas[namespace].pop(schema_name)

    @classmethod
    def load_namespace_schemas(cls, schema_dir: Optional[str] = None) -> dict:
        """Loads the static schema files into a dictionary indexed by namespace.
           If schema_dir is not specified, the static location relative to this
           file will be used.
           Note: The schema file must have a top-level string-valued attribute
           named 'namespace' to be included in the resulting dictionary.
        """
        # The following exposes the metadata-test namespace if true or 1.
        # Metadata testing will enable this env.  Note: this cannot be globally
        # defined, else the file could be loaded before the tests have enable the env.
        metadata_testing_enabled = bool(os.getenv("METADATA_TESTING", 0))

        namespace_schemas = {}
        if schema_dir is None:
            schema_dir = os.path.join(os.path.dirname(__file__), 'schemas')
        if not os.path.exists(schema_dir):
            raise RuntimeError("Metadata schema directory '{}' was not found!".format(schema_dir))

        schema_files = [json_file for json_file in os.listdir(schema_dir) if json_file.endswith('.json')]
        for json_file in schema_files:
            schema_file = os.path.join(schema_dir, json_file)
            with io.open(schema_file, 'r', encoding='utf-8') as f:
                schema_json = json.load(f)

            # Elyra schema files are required to have a namespace property (see test_validate_factory_schema)
            namespace = schema_json.get('namespace')
            if namespace is None:
                warnings.warn("Schema file '{}' is missing its namespace attribute!  Skipping...".format(schema_file))
                continue
            # Skip test namespace unless we're testing metadata
            if namespace == METADATA_TEST_NAMESPACE and not metadata_testing_enabled:
                continue
            if namespace not in namespace_schemas:  # Create the namespace dict
                namespace_schemas[namespace] = {}
            # Add the schema file indexed by name within the namespace
            name = schema_json.get('name')
            if name is None:
                # If schema is missing a name attribute, use file's basename.
                name = os.path.splitext(os.path.basename(schema_file))[0]
            namespace_schemas[namespace][name] = schema_json

        return copy.deepcopy(namespace_schemas)
