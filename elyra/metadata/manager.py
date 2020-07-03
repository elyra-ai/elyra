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
import io
import json
import os
import re

from jsonschema import validate, ValidationError, draft7_format_checker
from traitlets import Type
from traitlets.config import LoggingConfigurable
from typing import Optional, List

from .metadata import Metadata
from .schema import SchemaManager
from .storage import MetadataStore, FileMetadataStore


class MetadataManager(LoggingConfigurable):

    # System-owned namespaces
    NAMESPACE_RUNTIMES = "runtimes"
    NAMESPACE_CODE_SNIPPETS = "code-snippets"
    NAMESPACE_RUNTIME_IMAGES = "runtime-images"

    metadata_class = Type(Metadata, config=True,
                          help="""The metadata class.  This is configurable to allow subclassing of
                          the MetadataManager for customized behavior.""")

    def __init__(self, namespace: str, store: Optional[MetadataStore] = None, **kwargs):
        """
        Generic object to read Notebook related metadata
        :param namespace: the partition where it is stored, this might have
        a unique meaning for each of the supported metadata storage
        :param store: the metadata store to be used
        :param kwargs: additional arguments to be used to instantiate a metadata store
        """
        super(MetadataManager, self).__init__(**kwargs)

        self.schema_mgr = SchemaManager.instance()
        self.schema_mgr.validate_namespace(namespace)
        self.namespace = namespace
        if store:
            self.metadata_store = store
        else:
            self.metadata_store = FileMetadataStore(namespace, **kwargs)

    def namespace_exists(self) -> bool:
        """Returns True if the namespace for this instance exists"""
        return self.metadata_store.namespace_exists()

    def get_all(self, include_invalid: bool = False) -> List[Metadata]:
        """Returns all metadata instances in summary form (name, display_name, location)"""

        instances = []
        instance_list = self.metadata_store.fetch_instances()
        for metadata in instance_list:
            # validate the instance prior to return, include invalid instances as appropriate
            try:
                self.validate(metadata.name, metadata)
                instances.append(metadata)
            except Exception as ex:  # Ignore ValidationError and others when fetching all instances
                self.log.debug("Fetch of instance '{}' of namespace '{}' encountered an exception: {}".
                               format(metadata.name, self.namespace, ex))
                if include_invalid:
                    metadata.reason = ex.__class__.__name__
                    instances.append(metadata)

        return instances

    def get(self, name: str) -> Metadata:
        """Returns the metadata instance corresponding to the given name"""
        instance_list = self.metadata_store.fetch_instances(name=name)
        metadata = instance_list[0]
        # validate the instance prior to return...
        self.validate(name, metadata)
        return metadata

    def create(self, name: str, metadata: Metadata) -> Metadata:
        """Creates the given metadata, returning the created instance"""
        return self._save(name, metadata)

    def update(self, name: str, metadata: Metadata) -> Metadata:
        """Updates the given metadata, returning the updated instance"""
        return self._save(name, metadata, for_update=True)

    def remove(self, name: str) -> None:
        """Removes the metadata instance corresponding to the given name"""
        self.log.info("Removing metadata resource '{}' from namespace '{}'.".format(name, self.namespace))
        self.metadata_store.delete_instance(name)

    def validate(self, name: str, metadata: Metadata) -> None:
        """Validate metadata against its schema.

        Ensure metadata is valid based on its schema.  If invalid or schema
        is not found, ValidationError will be raised.
        """
        metadata_dict = metadata.to_dict(trim=True)
        schema_name = metadata_dict.get('schema_name')
        if not schema_name:
            raise ValidationError("Metadata instance '{}' in namespace '{}' is missing a 'schema_name' field!".
                                  format(name, self.namespace))

        schema = self._get_schema(schema_name)  # returns a value or throws

        self.log.debug("Validating metadata resource '{}' against schema '{}'...".format(name, schema_name))
        try:
            validate(instance=metadata_dict, schema=schema, format_checker=draft7_format_checker)
        except ValidationError as ve:
            # Because validation errors are so verbose, only provide the first line.
            first_line = str(ve).partition('\n')[0]
            msg = "Schema validation failed for metadata '{}' in namespace '{}' with error: {}.".\
                format(name, self.namespace, first_line)
            self.log.error(msg)
            raise ValidationError(msg) from ve

    def _get_normalized_name(self, name: str) -> str:
        # lowercase and replaces spaces with underscore
        name = re.sub('\\s+', '_', name.lower())
        # remove all invalid characters
        name = re.sub('[^a-z0-9-_]+', '', name)
        # begin with alpha
        if not name[0].isalpha():
            name = 'a_' + name
        # end with alpha numeric
        if not name[-1].isalnum():
            name = name + '_0'
        return name

    def _get_schema(self, schema_name: str) -> dict:
        """Loads the schema based on the schema_name and returns the loaded schema json.
           Throws ValidationError if schema file is not present.
        """
        schema_json = self.schema_mgr.get_schema(self.namespace, schema_name)
        if schema_json is None:
            schema_file = os.path.join(os.path.dirname(__file__), 'schemas', schema_name + '.json')
            if not os.path.exists(schema_file):
                raise ValidationError("Metadata schema file '{}' is missing!".format(schema_file))

            self.log.debug("Loading metadata schema from: '{}'".format(schema_file))
            with io.open(schema_file, 'r', encoding='utf-8') as f:
                schema_json = json.load(f)
            self.schema_mgr.add_schema(self.namespace, schema_name, schema_json)

        return schema_json

    def _save(self, name: str, metadata: Metadata, for_update: bool = False) -> Metadata:
        if not metadata:
            raise ValueError("An instance of class 'Metadata' was not provided.")

        if not isinstance(metadata, Metadata):
            raise TypeError("'metadata' is not an instance of class 'Metadata'.")

        if not name and not for_update:  # name is derived from display_name only on creates
            if metadata.display_name:
                name = self._get_normalized_name(metadata.display_name)
                metadata.name = name

        if not name:  # At this point, name must be set
            raise ValueError('Name of metadata was not provided.')

        match = re.search("^[a-z]([a-z0-9-_]*[a-z,0-9])?$", name)
        if match is None:
            raise ValueError("Name of metadata must be lowercase alphanumeric, beginning with alpha and can include "
                             "embedded hyphens ('-') and underscores ('_').")

        # Validate the metadata prior to persistence.  We'll validate again after persistence.
        self.validate(name, metadata)
        return self.metadata_store.persist_instance(name, metadata, for_update=for_update)
