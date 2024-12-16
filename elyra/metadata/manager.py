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
#
import re
from typing import Any
from typing import Dict
from typing import List
from typing import Union

from jsonschema import ValidationError
from traitlets import Type  # noqa H306
from traitlets.config import LoggingConfigurable  # noqa H306

from elyra.metadata.metadata import Metadata
from elyra.metadata.schema import SchemaManager
from elyra.metadata.storage import FileMetadataStore
from elyra.metadata.storage import MetadataStore


class MetadataManager(LoggingConfigurable):
    """Manages the persistence and retrieval of metadata instances"""

    metadata_store_class = Type(
        default_value=FileMetadataStore,
        config=True,
        klass=MetadataStore,
        help="""The metadata store class.  This is configurable to allow subclassing of
                                the MetadataStore for customized behavior.""",
    )

    def __init__(self, schemaspace: str, **kwargs: Any):
        """
        Generic object to manage metadata instances.
        :param schemaspace (str): the partition where metadata instances are stored
        :param kwargs: additional arguments to be used to instantiate a metadata manager
        Keyword Args:
            metadata_store_class (str): the name of the MetadataStore subclass to use for storing managed instances
        """
        super().__init__(**kwargs)

        self.schema_mgr = SchemaManager.instance()
        schemaspace_instance = self.schema_mgr.get_schemaspace(schemaspace)
        self.schemaspace = schemaspace_instance.name
        self.metadata_store = self.metadata_store_class(self.schemaspace, **kwargs)

    def schemaspace_exists(self) -> bool:
        """Returns True if the schemaspace for this instance exists"""
        return self.metadata_store.schemaspace_exists()

    def get_all(self, include_invalid: bool = False, of_schema: str = None) -> List[Metadata]:
        """Returns all metadata instances in summary form (name, display_name, location)"""

        instances = []
        instance_list = self.metadata_store.fetch_instances(include_invalid=include_invalid)
        for metadata_dict in instance_list:
            # validate the instance prior to return, include invalid instances as appropriate
            try:
                metadata = Metadata.from_dict(self.schemaspace, metadata_dict)
                if of_schema and metadata.schema_name != of_schema:  # If provided, filter on of_schema
                    continue
                metadata.on_load()  # Allow class instances to handle loads
                # if we're including invalid and there was an issue on retrieval, add it to the list
                if include_invalid and metadata.reason:
                    # If no schema-name is present, set to '{unknown}' since we can't make that determination.
                    if not metadata.schema_name:
                        metadata.schema_name = "{unknown}"
                else:  # go ahead and validate against the schema
                    self.validate(metadata.name, metadata)
                instances.append(metadata)
            except Exception as ex:  # Ignore ValidationError and others when fetching all instances
                # Since we may not have a metadata instance due to a failure during `from_dict()`,
                # instantiate a bad instance directly to use in the message and invalid result.
                invalid_instance = Metadata(**metadata_dict)
                self.log.warning(
                    f"Fetch of instance '{invalid_instance.name}' "
                    f"of schemaspace '{self.schemaspace}' "
                    f"encountered an exception: {ex}"
                )
                if include_invalid and (not of_schema or invalid_instance.schema_name == of_schema):
                    # Export invalid instances if requested and if a schema was not specified
                    # or the specified schema matches the instance's schema.
                    invalid_instance.reason = ex.__class__.__name__
                    instances.append(invalid_instance)
        return instances

    def get(self, name: str) -> Metadata:
        """Returns the metadata instance corresponding to the given name"""
        if name is None:
            raise ValueError("The 'name' parameter requires a value.")
        instance_list = self.metadata_store.fetch_instances(name=name)
        metadata_dict = instance_list[0]
        metadata = Metadata.from_dict(self.schemaspace, metadata_dict)

        # Allow class instances to alter instance
        metadata.on_load()

        # Validate the instance on load
        self.validate(name, metadata)

        return metadata

    def create(self, name: str, metadata: Metadata) -> Metadata:
        """Creates the given metadata, returning the created instance"""
        return self._save(name, metadata)

    def update(self, name: str, metadata: Metadata, for_migration: bool = False) -> Metadata:
        """Updates the given metadata, returning the updated instance"""
        return self._save(name, metadata, for_update=True, for_migration=for_migration)

    def remove(self, name: str) -> None:
        """Removes the metadata instance corresponding to the given name"""

        instance_list = self.metadata_store.fetch_instances(name=name)
        metadata_dict = instance_list[0]

        self.log.debug(f"Removing metadata resource '{name}' from schemaspace '{self.schemaspace}'.")

        metadata = Metadata.from_dict(self.schemaspace, metadata_dict)
        metadata.pre_delete()  # Allow class instances to handle delete

        self.metadata_store.delete_instance(metadata_dict)

        try:
            metadata.post_delete()  # Allow class instances to handle post-delete tasks (e.g., cache updates, etc.)
        except Exception as ex:
            self._rollback(name, metadata, "delete", ex)
            raise ex

    def validate(self, name: str, metadata: Metadata) -> None:
        """Validate metadata against its schema.

        Ensure metadata is valid based on its schema.  If invalid or schema
        is not found, ValidationError will be raised.
        """
        metadata_dict = metadata.to_dict()
        schema_name = metadata_dict.get("schema_name")
        if not schema_name:
            raise ValueError(
                f"Instance '{name}' in the {self.schemaspace} schemaspace is missing a 'schema_name' field!"
            )

        try:
            self.schema_mgr.validate_instance(self.schemaspace, schema_name, metadata_dict)
        except ValidationError as ve:
            # Because validation errors are so verbose, only provide the first line.
            first_line = str(ve).partition("\n")[0]
            msg = f"Validation failed for instance '{name}' using the {schema_name} schema with error: {first_line}."
            self.log.error(msg)
            raise ValidationError(msg) from ve

    @staticmethod
    def get_normalized_name(name: str) -> str:
        # lowercase and replaces spaces with underscore
        name = re.sub("\\s+", "_", name.lower())
        # remove all invalid characters
        name = re.sub("[^a-z0-9-_]+", "", name)
        # begin with alpha
        if not name[0].isalpha():
            name = "a_" + name
        # end with alpha numeric
        if not name[-1].isalnum():
            name = name + "_0"
        return name

    def _save(self, name: str, metadata: Metadata, for_update: bool = False, for_migration: bool = False) -> Metadata:
        if not metadata:
            raise ValueError("An instance of class 'Metadata' was not provided.")

        if not isinstance(metadata, Metadata):
            raise TypeError("'metadata' is not an instance of class 'Metadata'.")

        if not name and not for_update:  # name is derived from display_name only on creates
            if metadata.display_name:
                name = MetadataManager.get_normalized_name(metadata.display_name)
                metadata.name = name

        if not name:  # At this point, name must be set
            raise ValueError("Name of metadata was not provided.")

        match = re.search("^[a-z]([a-z0-9-_]*[a-z,0-9])?$", name)
        if match is None:
            raise ValueError(
                "Name of metadata must be lowercase alphanumeric, beginning with alpha and can include "
                "embedded hyphens ('-') and underscores ('_')."
            )

        orig_value = None
        if for_update:
            if for_migration:  # Avoid triggering a on_load() call since migrations will likely stem from there
                instance_list = self.metadata_store.fetch_instances(name=name)
                orig_value = instance_list[0]
            else:
                orig_value = self.get(name)

        # Allow class instances to handle pre-save tasks
        metadata.pre_save(for_update=for_update)

        self._apply_defaults(metadata)

        # Validate the metadata prior to storage then store the instance.
        self.validate(name, metadata)

        metadata_dict = self.metadata_store.store_instance(name, metadata.prepare_write(), for_update=for_update)

        metadata_post_op = Metadata.from_dict(self.schemaspace, metadata_dict)

        # Allow class instances to handle post-save tasks (e.g., cache updates, etc.)
        # Note that this is a _different_ instance from pre-save call
        try:
            metadata_post_op.post_save(for_update=for_update)
        except Exception as ex:
            if for_update:
                self._rollback(name, orig_value, "update", ex)
            else:  # Use the metadata instance prior to post op
                self._rollback(name, Metadata.from_dict(self.schemaspace, metadata_dict), "create", ex)
            raise ex

        return self.get(name)  # Retrieve updated/new instance so load hook can be called

    def _rollback(self, name: str, orig_value: Union[Metadata, Dict], operation: str, exception: Exception):
        """Rolls back the original value depending on the operation.

        For rolled back creation attempts, we must remove the created instance.  For rolled back
        update or deletion attempts, we must restore the original value.  Note that these operations
        must call the metadata store directly so that class hooks are not called.
        """
        self.log.debug(f"Rolling back metadata operation '{operation}' for instance '{name}' due to: {exception}")
        if operation == "create":  # remove the instance, orig_value is the newly-created instance.
            if isinstance(orig_value, Metadata):
                orig_value = orig_value.to_dict()
            self.metadata_store.delete_instance(orig_value)
        elif operation == "update":  # restore original as an update
            if isinstance(orig_value, dict):
                orig_value = Metadata.from_dict(self.schemaspace, orig_value)
            self.metadata_store.store_instance(name, orig_value.prepare_write(), for_update=True)
        elif operation == "delete":  # restore original as a create
            if isinstance(orig_value, dict):
                orig_value = Metadata.from_dict(self.schemaspace, orig_value)
            self.metadata_store.store_instance(name, orig_value.prepare_write(), for_update=False)
        self.log.warning(
            f"Rolled back metadata operation '{operation}' for instance '{name}' due to "
            f"failure in post-processing method: {exception}"
        )

    def _apply_defaults(self, metadata: Metadata) -> None:
        """If a given property has a default value defined, and that property is not currently represented,

        assign it the default value.  We will also treat constants similarly.

        For schema-level properties (i.e., not application-level), we will check if such a property
        has a corresponding attribute and, if so, set the property to that value.
        Note: we only consider constants updates for schema-level properties
        """

        # Get the schema and build a dict consisting of properties and their default/const values (for those
        # properties that have defaults/consts defined).  Then walk the metadata instance looking for missing
        # properties and assign the corresponding value.  Note that we do not consider existing properties with
        # values of None for default replacement since that may be intentional (although those values will
        # likely fail subsequent validation).  We also don't consider defaults when applying values to the
        # schema-level properties since these settings are function of a defined attribute.

        schema = self.schema_mgr.get_schema(self.schemaspace, metadata.schema_name)

        def _update_instance(target_prop: str, schema_properties: Dict, instance: Union[Metadata, Dict]) -> None:
            property_defaults = {}
            for name, property in schema_properties.items():
                if target_prop in property:
                    property_defaults[name] = property[target_prop]

            if property_defaults:  # schema defines defaulted properties
                if isinstance(instance, Metadata):  # schema properties, updated constants
                    for name, default in property_defaults.items():
                        if hasattr(instance, name):
                            setattr(instance, name, default)
                else:  # instance properties, update missing defaults
                    instance_properties = instance
                    for name, default in property_defaults.items():
                        if name not in instance_properties:
                            instance_properties[name] = default

        # Update default properties of instance properties
        _update_instance("default", schema["properties"]["metadata"]["properties"], metadata.metadata)

        # Update const properties of schema properties
        _update_instance("const", schema["properties"], metadata)
