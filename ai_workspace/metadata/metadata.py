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
from jupyter_core.paths import jupyter_data_dir, jupyter_path, SYSTEM_JUPYTER_PATH
from traitlets import HasTraits, List, Unicode, Dict, Set, Bool, Type, log
from traitlets.config import LoggingConfigurable, SingletonConfigurable


class Metadata(HasTraits):
    name = Unicode()
    display_name = Unicode()
    resource = Unicode()
    metadata = Dict()

    def __init__(self, **kwargs):
        super(Metadata, self).__init__(**kwargs)

        if 'name' not in kwargs:
            raise AttributeError("Missing required 'name' attribute")

        if 'resource' not in kwargs:
            raise AttributeError("Missing required 'resource' attribute")

        if 'display_name' not in kwargs:
            raise AttributeError("Missing required 'display_name' attribute")

        self.name = kwargs.get('name')
        self.resource = kwargs.get('resource')
        self.display_name = kwargs.get('display_name')
        self.metadata = kwargs.get('metadata', Dict())

    def to_dict(self):
        d = dict(name=self.name,
                 resource=self.resource,
                 display_name=self.display_name,
                 metadata=self.metadata
                 )

        return d

    def to_json(self):
        j = json.dumps(self.to_dict())

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

    def validate(self, schema_name, schema, metadata):
        """Ensure metadata is valid based on its schema."""
        is_valid = False
        try:
            validate(instance=metadata, schema=schema)
            is_valid = True
        except ValidationError as ve:
            self.log.error("Schema validation failed for schema_name: '{}' in namespace: '{}' with error: {}".
                                   format(schema_name, self.namespace, ve.message))

        return is_valid


class FileMetadataStore(MetadataStore):

    def __init__(self, namespace, **kwargs):
        super(FileMetadataStore, self).__init__(namespace, **kwargs)
        self.data_dir = kwargs.get('data_dir', jupyter_data_dir())
        self.metadata_dir = kwargs.get('metadata_dir', os.path.join(self.data_dir, 'metadata/' + self.namespace))
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
                    'location': metadata.resource
                }
            )
        return metadata_list

    def get_all(self):
        return self._load_metadata_resources()

    def read(self, name):
        metadata = self._load_metadata_resources(name=name)
        if metadata is None:
            self.log.warn("Metadata with name '{}' not found!".format(name))

        return metadata

    def save(self, name, metadata, replace=True):
        if not isinstance(metadata, Metadata):
            raise TypeError('metadata is not an instance of Metadata')
        metadata_resource_name = '{}.json'.format(name)
        resource = os.path.join(self.metadata_dir, metadata_resource_name)

        if os.path.exists(resource):
            if replace:
                os.remove(resource)
            else:
                self.log.info("Metadata resource '{}' already exists. Please use the replace flag.".format(resource))
                return None

        with io.open(resource, 'w', encoding='utf-8') as f:
            f.write(metadata.to_json())

        return resource

    def remove(self, name):
        self.log.info("Removing Metadata with name '{}'".format(name))
        metadata = self._load_metadata_resources(name=name)
        if metadata is None:
            self.log.warn("Metadata '{}' not found!".format(name))
            return
        else:
            os.remove(metadata.resource)

        return metadata.resource

    def _load_metadata_resources(self, name=None):
        """Loads metadata files with .json suffix and return requested items.
           if 'name' is provided, the single file is loaded and returned, else
           all files ending in '.json' are loaded and returned in a list.
        """
        resources = None
        if os.path.exists(self.metadata_dir):
            for f in os.listdir(self.metadata_dir):
                path = os.path.join(self.metadata_dir, f)
                if path.endswith(".json"):
                    if name:
                        if os.path.splitext(os.path.basename(path))[0] == name:
                            return self._load_from_resource(path)
                    else:
                        metadata = self._load_from_resource(path)
                        if metadata is not None:
                            if resources is None:
                                resources = []
                            resources.append(metadata)
        return resources

    def _get_schema(self, schema_name, dir):
        """Loads the schema based on the directory and schema_name and returns the loaded json."""
        schema_file = os.path.join(dir, schema_name + '.schema')
        if not os.path.exists(schema_file):
            return None

        epoch = int(os.path.getmtime(schema_file))
        if self.schema_mgr.is_schema_stale(self.namespace, schema_name, epoch):
            with io.open(schema_file, 'r', encoding='utf-8') as f:
                schema_json = json.load(f)
            self.schema_mgr.add_schema(self.namespace, schema_name, schema_json, epoch)

        schema_json = self.schema_mgr.get_schema(self.namespace, schema_name)
        return schema_json

    def _load_from_resource(self, resource):
        # This is always called with an existing resource (path) so no need to check existence.
        with io.open(resource, 'r', encoding='utf-8') as f:
            metadata_json = json.load(f)

        metadata = None
        is_schema_valid = False

        name = os.path.splitext(os.path.basename(resource))[0]
        schema_name = metadata_json.get('schema_name')
        if schema_name is None:  # Schema name is not required - but preferred - so issue warning
            self.log.warn("Metadata resource '{}' is missing 'schema_name'.".format(resource))
        else:
            schema = self._get_schema(schema_name, os.path.dirname(resource))
            if schema:
                is_schema_valid = self.validate(schema_name, schema, metadata_json)

        if is_schema_valid or schema_name is None:
            metadata = Metadata(name=name,
                                display_name=metadata_json['display_name'],
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

    schemas = {}        # Dict of namespace & schema name to schema content
    schema_epochs = {}  # Dict of namespace & schema name to content epoch

    @staticmethod
    def _get_key(namespace, schema_name):
        return namespace + '.' + schema_name

    def get_schema(self, namespace, schema_name):
        return self.schemas.get(SchemaManager._get_key(namespace, schema_name))

    def add_schema(self, namespace, schema_name, schema, epoch):
        """Adds (updates) schema to set of stored schemas and registers last epoch. """
        key = SchemaManager._get_key(namespace, schema_name)
        self.schemas[key] = schema
        self.schema_epochs[key] = epoch

    def is_schema_stale(self, namespace, schema_name, epoch):
        """Returns True if the schema associated with namespace & schema_name is out of
           stale or if schema is not found; False otherwise.
        """
        schema_epoch = self.schema_epochs.get(SchemaManager._get_key(namespace, schema_name), 0)
        if epoch != schema_epoch:
            return True

        return False

    def remove_all(self):
        """Primarily used for testing, this method removes all items across all namespaces. """
        self.schema_epochs.clear()
        self.schemas.clear()

    def remove_schema(self, namespace, schema_name):
        """Removes the schema entry associated with namespace & schema_name. """
        key = SchemaManager._get_key(namespace, schema_name)
        self.schema_epochs.pop(key)
        self.schemas.pop(key)
