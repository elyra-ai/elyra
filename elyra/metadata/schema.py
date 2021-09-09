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
from abc import ABC
from abc import abstractmethod
import copy
import os
import re
from typing import Dict
from typing import List
from typing import Optional

import entrypoints
from traitlets.config import LoggingConfigurable
from traitlets.config import SingletonConfigurable
from traitlets import Type  # noqa H306

from elyra.metadata.error import SchemaNotFoundError
from elyra.metadata.storage import FileMetadataStore
from elyra.metadata.storage import MetadataStore

METADATA_TEST_SCHEMASPACE_ID = "8182fc28-899a-4521-8342-1a0e218c3a4d"
METADATA_TEST_SCHEMASPACE = "metadata-tests"  # exposed via METADATA_TESTING env


class SchemaManager(SingletonConfigurable):
    """Singleton used to store all schemas for all metadata types.
       Note: we currently don't refresh these entries.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._load_schemaspace_schemas()

    def _validate_schemaspace(self, schemaspace_name_or_id: str) -> None:
        """Ensures the schemaspace is valid and raises ValueError if it is not."""
        if schemaspace_name_or_id not in list(self.schemaspaces.keys()) + list(self.schemaspace_name_to_id.keys()):
            raise ValueError("schemaspace '{}' is not in the list of valid schemaspaces: '{}'".
                             format(schemaspace_name_or_id, self.get_schemaspace_names()))

    def get_schemaspace_names(self) -> list:
        """Retuns list of registered schemaspace names."""
        return list(self.schemaspace_name_to_id.keys())

    def get_schemaspace_schemas(self, schemaspace_name_or_id: str) -> dict:
        self._validate_schemaspace(schemaspace_name_or_id)
        schemaspace = self.get_schemaspace(schemaspace_name_or_id)
        schemas = schemaspace.schemas
        return copy.deepcopy(schemas)

    def get_schema(self, schemaspace_name_or_id: str, schema_name: str) -> dict:
        """Returns the specified schema for the specified schemaspace."""
        self._validate_schemaspace(schemaspace_name_or_id)

        schemaspace = self.get_schemaspace(schemaspace_name_or_id)
        schemas = schemaspace.schemas
        if schema_name not in schemas.keys():
            raise SchemaNotFoundError(schemaspace_name_or_id, schema_name)
        schema_json = schemas.get(schema_name)

        return copy.deepcopy(schema_json)

    def get_schemaspace(self, schemaspace_name_or_id: str) -> 'Schemaspace':
        """Returns the Schemaspace instance associated with the given name or id."""

        # Need to determine if this is an id or name.  We'll be optimistic and assume Id,
        # then try name and if both fail, raise ValueError
        self._validate_schemaspace(schemaspace_name_or_id)
        if schemaspace_name_or_id in self.schemaspaces.keys():
            schemaspace_id = schemaspace_name_or_id  # we have an id
        else:
            schemaspace_id = self.schemaspace_name_to_id.get(schemaspace_name_or_id)

        if not schemaspace_id:
            raise ValueError(f"The provided schemaspace name or id '{schemaspace_name_or_id}' "
                             f"is not associated with a registered Schemaspace!")

        return self.schemaspaces.get(schemaspace_id)

    def clear_all(self) -> None:
        """Primarily used for testing, this method reloads schemas from initial values. """
        self.log.debug("SchemaManager: Reloading all schemas for all schemaspaces.")
        self._load_schemaspace_schemas()

    def _load_schemaspace_schemas(self):
        """Gets Schemaspaces and SchemasProviders via entrypoints and validates/loads their schemas."""

        # The following exposes the metadata-test schemaspace if true or 1.
        # Metadata testing will enable this env.  Note: this cannot be globally
        # defined, else the file could be loaded before the tests have enable the env.
        metadata_testing_enabled = bool(os.getenv("METADATA_TESTING", 0))

        self.schemaspaces = {}
        self.schemaspace_name_to_id = {}
        for schemaspace in entrypoints.get_group_all('metadata.schemaspaces'):
            # Record the Schemaspace instance and create the name-to-id map
            try:
                # If we're not testing, skip our test schemaspace
                if not metadata_testing_enabled and schemaspace.name == METADATA_TEST_SCHEMASPACE:
                    continue
                # instantiate an actual instance of the Schemaspace
                self.log.info(f"Loading schemaspace '{schemaspace.name}'...")
                schemaspace_instance = schemaspace.load()(parent=self.parent)  # Load an instance
                if not isinstance(schemaspace_instance, Schemaspace):
                    raise ValueError(f"Schemaspace instance '{schemaspace.name}' is not an "
                                     f"instance of '{Schemaspace.__name__}'!")
                self.schemaspaces[schemaspace_instance.id] = schemaspace_instance
                self.schemaspace_name_to_id[schemaspace_instance.name] = schemaspace_instance.id
            except Exception as err:
                # log and ignore initialization errors
                self.log.error(f"Error loading schemaspace '{schemaspace.name}' - {err}")

        for schemas_provider in entrypoints.get_group_all('metadata.schemas'):
            try:
                # If we're not testing, skip our test schemas
                if not metadata_testing_enabled and schemas_provider.name == METADATA_TEST_SCHEMASPACE:
                    continue
                # instantiate an actual instance of the processor
                self.log.info(f"Loading SchemasProvider '{schemas_provider.name}'...")
                schemas_provider_instance = schemas_provider.load()()  # Load an instance
                if not isinstance(schemas_provider_instance, SchemasProvider):
                    raise ValueError(f"SchemasProvider instance '{schemas_provider.name}' is not an "
                                     f"instance of '{SchemasProvider.__name__}'!")
                self._load_schemas(schemas_provider_instance)
            except Exception as err:
                # log and ignore initialization errors
                self.log.error(f"Error loading schemas for SchemasProvider '{schemas_provider.name}' - {err}")

    def _load_schemas(self, provider: 'SchemasProvider'):
        """Calls get_schemas() on the provider, validates the referenced schemaspace id, and adds

        to schemaspace instance.
        """
        schemas = provider.get_schemas()
        for schema in schemas:
            # TODO - validate schema against meta-schema

            schemaspace_id = schema.get("schemaspace_id")
            schema_name = schema.get("name")
            if schemaspace_id not in self.schemaspaces:
                raise ValueError(f"Schema '{schema_name}' references a schemaspace "
                                 f"'{schemaspace_id}' that is not loaded!")

            self.schemaspaces[schemaspace_id].add_schema(schema)


class Schemaspace(LoggingConfigurable):
    _id: str
    _name: str
    _description: str
    _storage_class: MetadataStore
    _schemas: Dict[str, Dict]  # use a dict to prevent duplicate entries

    metadata_store_class = Type(default_value=FileMetadataStore, config=True,
                                klass=MetadataStore,
                                help="""The metadata store class.  This is configurable to allow subclassing of
                                the MetadataStore for customized behavior.""")

    def __init__(self,
                 schemaspace_id: str,
                 name: str,
                 display_name: Optional[str] = None,
                 description: Optional[str] = "",
                 storage_class: Optional[MetadataStore] = FileMetadataStore,
                 **kwargs):
        super().__init__(**kwargs)

        self._schemas = {}

        # Validate properties
        if not schemaspace_id:
            raise ValueError("Property 'id' requires a value!")

        if not Schemaspace._validate_id(schemaspace_id):
            raise ValueError(f"The value of property 'id' ({self._id}) does not conform to a UUID!")

        if not name:
            raise ValueError("Property 'name' requires a value!")

        if not isinstance(storage_class, MetadataStore):
            ValueError(f"The value of property 'storage_class' ({storage_class.__name__}) "
                       f"must be an instance of '{MetadataStore.__name__}'!")

        self._id = schemaspace_id
        self._name = name
        self._display_name = display_name or name
        self._description = description
        self._storage_class = storage_class

    @property
    def id(self) -> str:
        """The id (uuid) of the schemaspace"""
        return self._id

    @property
    def name(self) -> str:
        """The name of the schemaspace"""
        return self._name

    @property
    def display_name(self) -> str:
        """The display_name of the schemaspace"""
        return self._display_name

    @property
    def description(self) -> str:
        """The description of the schemaspace"""
        return self._description

    @property
    def storage_class(self) -> MetadataStore:
        """The storage class used to store instances of the schemas associated with this schemaspace"""
        return self._storage_class

    @property
    def schemas(self) -> Dict[str, Dict]:
        """Returns the schemas currently associated with this schemaspace"""
        return self._schemas

    def add_schema(self, schema: Dict) -> None:
        """Associates the given schema to this schemaspace"""
        assert isinstance(schema, dict), "Parameter 'schema' is not a dictionary!"
        self._schemas[schema.get('name')] = schema

    @staticmethod
    def _validate_id(id) -> bool:
        """
            Validate that id is uuidv4 compliant
            """
        is_valid = False
        uuidv4_regex = re.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
        if uuidv4_regex.match(id):
            is_valid = True

        return is_valid


class SchemasProvider(ABC):
    """Abstract base class used to obtain schema definitions from registered schema providers."""

    @abstractmethod
    def get_schemas(self) -> List[Dict]:
        """Returns a list of schemas"""
        pass
