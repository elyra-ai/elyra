#
# Copyright 2018-2019 IBM Corporation
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

from abc import ABC, abstractmethod
from jsonschema import validate, ValidationError
from jupyter_core.paths import jupyter_data_dir
from traitlets import HasTraits, List, Unicode, Dict, Type, log
from traitlets.config import SingletonConfigurable, LoggingConfigurable

DEFAULT_SCHEMA_NAME = 'kfp'


class Metadata(HasTraits):
    name = None
    resource = None
    display_name = Unicode()
    metadata = Dict()
    schema_name = Unicode()

    def __init__(self, **kwargs):
        super(Metadata, self).__init__(**kwargs)

        if 'display_name' not in kwargs:
            raise AttributeError("Missing required 'display_name' attribute")

        self.display_name = kwargs.get('display_name')
        self.schema_name = kwargs.get('schema_name') or DEFAULT_SCHEMA_NAME
        self.metadata = kwargs.get('metadata', Dict())
        self.name = kwargs.get('name')
        self.resource = kwargs.get('resource')

    def to_dict(self, trim=False):
        # Exclude name, resource only if trim is True since we don't want to persist that information.
        # Only include schema_name if it has a value (regardless of trim).
        d = dict(display_name=self.display_name, metadata=self.metadata, schema_name=self.schema_name)
        if not trim:
            if self.name:
                d['name'] = self.name
            if self.resource:
                d['resource'] = self.resource

        return d

    def to_json(self, trim=False):
        j = json.dumps(self.to_dict(trim=trim))

        return j


class MetadataManager(LoggingConfigurable):
    metadata_class = Type(Metadata, config=True,
        help="""The metadata class.  This is configurable to allow
        subclassing of the MetadataManager for customized behavior.
        """
    )

    def __init__(self, namespace, store=None, **kwargs):
        """
        Generic object to read Notebook related metadata
        :param namespace: the partition where it is stored, this might have
        a unique meaning for each of the supported metadata storage
        :param store: the metadata store to be used
        :param kwargs: additional arguments to be used to instantiate a metadata store
        """
        super(MetadataManager, self).__init__(**kwargs)

        self.namespace = namespace
        if store:
            self.metadata_store = store
        else:
            self.metadata_store = FileMetadataStore(namespace, **kwargs)

    @property
    def get_metadata_location(self):
        return self.metadata_store.get_metadata_location

    def get_all_metadata_summary(self):
        return self.metadata_store.get_all_metadata_summary()

    def get_all(self):
        return self.metadata_store.get_all()

    def get(self, name):
        return self.metadata_store.read(name)

    def add(self, name, metadata, replace=True):
        return self.metadata_store.save(name, metadata, replace)

    def remove(self, name):
        return self.metadata_store.remove(name)


class MetadataStore(ABC):
    def __init__(self, namespace, **kwargs):
        self.namespace = namespace
        self.log = log.get_logger()

    @abstractmethod
    def get_metadata_location(self):
        pass

    @abstractmethod
    def get_all_metadata_summary(self):
        pass

    @abstractmethod
    def get_all(self):
        pass

    @abstractmethod
    def read(self, name):
        pass

    @abstractmethod
    def save(self, name, metadata, replace=True):
        pass

    @abstractmethod
    def remove(self, name):
        pass

    # FIXME - we should rework this area so that its more a function of the processor provider
    # since its the provider that knows what is 'valid' or not.  Same goes for _get_schema() below.
    def validate(self, name, schema, metadata):
        """Ensure metadata is valid based on its schema.  If invalid, ValidationError will be raised. """

        try:
            validate(instance=metadata, schema=schema)
        except ValidationError as ve:
            # Because validation errors are so verbose, only provide the first line.
            msg = "Schema validation failed for metadata '{}' in namespace '{}' with error: {}".\
                format(name, self.namespace, str(ve).partition('\n')[0])
            raise ValidationError(msg)


class FileMetadataStore(MetadataStore):

    def __init__(self, namespace, **kwargs):
        super(FileMetadataStore, self).__init__(namespace, **kwargs)
        self.metadata_dir = os.path.join(jupyter_data_dir(), 'metadata', self.namespace)
        self.schema_mgr = SchemaManager.instance()

    @property
    def get_metadata_location(self):
        return self.metadata_dir

    def get_all_metadata_summary(self):
        metadata_list = self._load_metadata_resources()
        metadata_summary = {}
        for metadata in metadata_list:
            metadata_summary.update(
                {
                    'name': metadata.name,
                    'display_name': metadata.display_name,
                    'location': self._get_resource(metadata)
                }
            )
        return metadata_list

    def get_all(self):
        return self._load_metadata_resources()

    def read(self, name):
        if not name:
            raise ValueError('Name of metadata was not provided')
        return self._load_metadata_resources(name=name)

    def save(self, name, metadata, replace=True):
        if not name:
            raise ValueError('Name of metadata was not provided')

        if not metadata:
            raise ValueError('Metadata was not provided')

        if not isinstance(metadata, Metadata):
            raise TypeError('metadata is not an instance of Metadata')

        metadata_resource_name = '{}.json'.format(name)
        resource = os.path.join(self.metadata_dir, metadata_resource_name)

        if os.path.exists(resource):
            if replace:
                os.remove(resource)
            else:
                self.log.info("Metadata resource '{}' already exists. Use the replace flag to overwrite.".format(resource))
                return None

        with io.open(resource, 'w', encoding='utf-8') as f:
            f.write(metadata.to_json(trim=True))  # Only persist necessary items

        # Now that its written, attempt to load it so, if a schema is present, we can validate it.
        try:
            self._load_from_resource(resource)
        except ValidationError as ve:
            self.log.error(str(ve) + "\nRemoving metadata resource '{}'.".format(resource))
            os.remove(resource)
            resource = None

        return resource

    def remove(self, name):
        self.log.info("Removing Metadata with name '{}' from namespace '{}'.".format(name, self.namespace))
        try:
            metadata = self._load_metadata_resources(name=name, validate_metadata=False)  # Don't validate on remove
        except KeyError:
            self.log.warn("Metadata '{}' in namespace '{}' was not found!".format(name, self.namespace))
            return

        resource = self._get_resource(metadata)
        os.remove(resource)

        return resource

    def _get_resource(self, metadata):
        metadata_resource_name = '{}.json'.format(metadata.name)
        resource = os.path.join(self.metadata_dir, metadata_resource_name)
        return resource

    def _load_metadata_resources(self, name=None, validate_metadata=True):
        """Loads metadata files with .json suffix and return requested items.
           if 'name' is provided, the single file is loaded and returned, else
           all files ending in '.json' are loaded and returned in a list.
        """
        resources = []
        if os.path.exists(self.metadata_dir):
            for f in os.listdir(self.metadata_dir):
                path = os.path.join(self.metadata_dir, f)
                if path.endswith(".json"):
                    if name:
                        if os.path.splitext(os.path.basename(path))[0] == name:
                            return self._load_from_resource(path, validate_metadata=validate_metadata)
                    else:
                        metadata = None
                        try:
                            metadata = self._load_from_resource(path, validate_metadata=validate_metadata)
                        except Exception:
                            pass  # Ignore ValidationError and others when loading all resources
                        if metadata is not None:
                            resources.append(metadata)

        if name:  # If we're looking for a single metadata and we're here, then its not found
            raise KeyError("Metadata '{}' in namespace '{}' was not found!".format(name, self.namespace))

        return resources

    def _get_schema(self, schema_name):
        """Loads the schema based on the schema_name and returns the loaded schema json."""

        schema_json = self.schema_mgr.get_schema(self.namespace, schema_name)
        if schema_json is None:
            schema_file = os.path.join(os.path.dirname(__file__), 'schemas', schema_name + '.json')
            if not os.path.exists(schema_file):
                raise ValidationError("Metadata schema file '{}' is missing!".format(schema_file))

            with io.open(schema_file, 'r', encoding='utf-8') as f:
                schema_json = json.load(f)
            self.schema_mgr.add_schema(self.namespace, schema_name, schema_json)

        return schema_json

    def _load_from_resource(self, resource, validate_metadata=True):
        # This is always called with an existing resource (path) so no need to check existence.
        with io.open(resource, 'r', encoding='utf-8') as f:
            metadata_json = json.load(f)

        # Always take name from resource so resources can be copied w/o having to change content
        name = os.path.splitext(os.path.basename(resource))[0]

        if validate_metadata:
            schema = self._get_schema(metadata_json['schema_name'])
            if schema:
                self.validate(name, schema, metadata_json)

        metadata = Metadata(name=name,
                            display_name=metadata_json['display_name'],
                            schema_name=metadata_json['schema_name'],
                            resource=resource,
                            metadata=metadata_json['metadata'])
        return metadata


class SchemaManager(SingletonConfigurable):
    """Singleton used to store all schemas for all metadata types.  The storage class
       (and caller) is responsible for providing an appropraite epoch.  For file-based classes
       it is recommended that the file's last modified time be used.  For db-based classes,
       a monotonically increasing column value is appropriate, or even a uuid.  Staleness
       is a straight equality check against the provider's epoch vs. the one associated
       with the entry.
    """

    schemas = {}        # Dict of namespace & schema_name to schema content

    @staticmethod
    def _get_key(namespace, schema_name):
        return namespace + '.' + schema_name

    def get_schema(self, namespace, schema_name):
        return self.schemas.get(SchemaManager._get_key(namespace, schema_name))

    def add_schema(self, namespace, schema_name, schema):
        """Adds (updates) schema to set of stored schemas. """
        key = SchemaManager._get_key(namespace, schema_name)
        self.schemas[key] = schema

    def remove_all(self):
        """Primarily used for testing, this method removes all items across all namespaces. """
        self.schemas.clear()

    def remove_schema(self, namespace, schema_name):
        """Removes the schema entry associated with namespace & schema_name. """
        key = SchemaManager._get_key(namespace, schema_name)
        self.schemas.pop(key)
