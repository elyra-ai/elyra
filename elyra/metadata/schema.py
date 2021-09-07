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
import copy
import io
import json
import os
from typing import Dict
from typing import Optional
import warnings

from ipython_genutils.importstring import import_item
from traitlets.config import SingletonConfigurable

from elyra.metadata.error import SchemaNotFoundError

default_schema_filter_class_name = 'elyra.metadata.schema.SchemaFilter'

METADATA_TEST_SCHEMASPACE = "metadata-tests"  # exposed via METADATA_TESTING env


class SchemaFilter(object):
    """
    This class is used by the SchemaManager to process schema instances if the
    schema references a `schema_filter_class_name` meta-property.  It is meant to be
    subclassed since instances of this class are associated with a specific schema
    and have knowledge about how to filter instances of "their" schema.

    Instances of SchemaFilter are meant to be short-lived and stateless, essentially
    performing an operation on the schema and returning its filtered result.
    """

    def post_load(self, name: str, schema_json: Dict) -> Dict:
        """Called by SchemaManager after fetching the schema instance, this method
        filters the schema based on current runtime situations.

        :param name: The name of the schema
        :param schema_json: The schema itself
        :return: The filtered schema
        """
        return schema_json


class SchemaManager(SingletonConfigurable):
    """Singleton used to store all schemas for all metadata types.
       Note: we currently don't refresh these entries.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # schemaspace_schemas is a dict of schemaspace keys to dict of schema_name keys of JSON schema
        self.schemaspace_schemas = SchemaManager.load_schemaspace_schemas()

    def validate_schemaspace(self, schemaspace: str) -> None:
        """Ensures the schemaspace is valid and raises ValueError if it is not."""
        if schemaspace not in self.schemaspace_schemas.keys():
            raise ValueError("schemaspace '{}' is not in the list of valid schemaspaces: '{}'".
                             format(schemaspace, self.get_schemaspaces()))

    def get_schemaspaces(self) -> list:
        return list(self.schemaspace_schemas.keys())

    def get_schemaspace_schemas(self, schemaspace: str) -> dict:
        self.validate_schemaspace(schemaspace)
        schemas = self.schemaspace_schemas.get(schemaspace)
        return schemas

    def get_schema(self, schemaspace: str, schema_name: str) -> dict:
        self.validate_schemaspace(schemaspace)
        schemas = self.schemaspace_schemas.get(schemaspace)
        if schema_name not in schemas.keys():
            raise SchemaNotFoundError(schemaspace, schema_name)
        schema_json = schemas.get(schema_name)

        return schema_json

    def add_schema(self, schemaspace: str, schema_name: str, schema: dict) -> None:
        """Adds (updates) schema to set of stored schemas. """
        self.validate_schemaspace(schemaspace)
        self.log.debug("SchemaManager: Adding schema '{}' to schemaspace '{}'".format(schema_name, schemaspace))
        self.schemaspace_schemas[schemaspace][schema_name] = schema

    def clear_all(self) -> None:
        """Primarily used for testing, this method reloads schemas from initial values. """
        self.log.debug("SchemaManager: Reloading all schemas for all schemaspaces.")
        self.schemaspace_schemas = SchemaManager.load_schemaspace_schemas()

    def remove_schema(self, schemaspace: str, schema_name: str) -> None:
        """Removes the schema entry associated with schemaspace & schema_name. """
        self.validate_schemaspace(schemaspace)
        self.log.debug("SchemaManager: Removing schema '{}' from schemaspace '{}'".format(schema_name, schemaspace))
        self.schemaspace_schemas[schemaspace].pop(schema_name)

    @classmethod
    def load_schemaspace_schemas(cls, schema_dir: Optional[str] = None) -> dict:
        """Loads the static schema files into a dictionary indexed by schemaspace.
           If schema_dir is not specified, the static location relative to this
           file will be used.
           Note: The schema file must have a top-level string-valued attribute
           named 'schemaspace' to be included in the resulting dictionary.
        """
        # The following exposes the metadata-test schemaspace if true or 1.
        # Metadata testing will enable this env.  Note: this cannot be globally
        # defined, else the file could be loaded before the tests have enable the env.
        metadata_testing_enabled = bool(os.getenv("METADATA_TESTING", 0))

        schemaspace_schemas = {}
        if schema_dir is None:
            schema_dir = os.path.join(os.path.dirname(__file__), 'schemas')
        if not os.path.exists(schema_dir):
            raise RuntimeError("Metadata schema directory '{}' was not found!".format(schema_dir))

        schema_files = [json_file for json_file in os.listdir(schema_dir) if json_file.endswith('.json')]
        for json_file in schema_files:
            schema_file = os.path.join(schema_dir, json_file)
            with io.open(schema_file, 'r', encoding='utf-8') as f:
                schema_json = json.load(f)

            # Elyra schema files are required to have a schemaspace property (see test_validate_factory_schema)
            schemaspace = schema_json.get('schemaspace')
            if schemaspace is None:
                warnings.warn("Schema file '{}' is missing its schemaspace attribute!  Skipping...".format(schema_file))
                continue
            # Skip test schemaspace unless we're testing metadata
            if schemaspace == METADATA_TEST_SCHEMASPACE and not metadata_testing_enabled:
                continue
            if schemaspace not in schemaspace_schemas:  # Create the schemaspace dict
                schemaspace_schemas[schemaspace] = {}
            # Add the schema file indexed by name within the schemaspace
            name = schema_json.get('name')
            if name is None:
                # If schema is missing a name attribute, use file's basename.
                name = os.path.splitext(os.path.basename(schema_file))[0]

            # apply post-load filter
            schema_filter_class_name = schema_json.get('schema_filter_class_name', default_schema_filter_class_name)
            schema_filter_class = import_item(schema_filter_class_name)
            filtered_schema = schema_filter_class().post_load(name, schema_json)
            schemaspace_schemas[schemaspace][name] = filtered_schema

        return copy.deepcopy(schemaspace_schemas)
