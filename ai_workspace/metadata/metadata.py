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
import logging
import os

from abc import ABC, abstractmethod
from traitlets import HasTraits, List, Unicode, Dict, Set, Bool, Type
from traitlets.config import LoggingConfigurable
from jupyter_core.paths import jupyter_data_dir, jupyter_path, SYSTEM_JUPYTER_PATH


class Metadata(HasTraits):
    name = Unicode()
    display_name = Unicode()
    resource = Unicode()
    metadata = Dict()

    def __init__(self, **kwargs):
        super(Metadata, self).__init__(**kwargs)
        if 'resource' not in kwargs:
            raise AttributeError('Missing required resource location attribute')

        if 'display_name' not in kwargs:
            raise AttributeError('Missing required display_name attribute')

        self.resource = kwargs.get('resource')
        # retrieve the name from the metadata file name
        self.name = os.path.splitext(os.path.basename(self.resource))[0]
        self.display_name = kwargs.get('display_name')
        self.metadata = kwargs.get('metadata', Dict())

    @classmethod
    def from_resource(cls, resource):
        if not os.path.exists(resource):
            return

        with io.open(resource, 'r', encoding='utf-8') as f:
            metadata_json = json.load(f)

        name = os.path.splitext(os.path.basename(resource))[0]
        metadata_as_dict = Dict(metadata_json['metadata'])
        return cls(name=name,
                   display_name=metadata_json['display_name'],
                   resource=resource,
                   metadata=metadata_json['metadata'])

    def to_dict(self):
        d = dict(name=self.name,
                 resource=self.resource,
                 display_name=self.display_name,
                 metadata=self.metadata,
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
        ...

    @abstractmethod
    def get_metadata_location(self):
        ...

    @abstractmethod
    def get_all_metadata_summary(self):
        ...

    @abstractmethod
    def get_all(self):
        ...

    @abstractmethod
    def read(self, name):
        ...

    @abstractmethod
    def save(self, name, metadata, replace=True):
        ...

    @abstractmethod
    def remove(self, name):
        ...


class FileMetadataStore(MetadataStore):

    def __init__(self, namespace, **kwargs):
        self.namespace = namespace
        self.data_dir = kwargs.get('data_dir', jupyter_data_dir())
        self.metadata_dir = kwargs.get('metadata_dir', os.path.join(self.data_dir, 'metadata/' + self.namespace))

    @property
    def get_metadata_location(self):
        return self.metadata_dir

    def get_all_metadata_summary(self):
        metadata_list = self._find_all_metadata()
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
        return self._find_all_metadata()

    def read(self, name):
        metadata = self._find_metadata_resource(name)
        if metadata is None:
            logging.warning('Metadata with name {} not found!'.format(name))

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
                logging.info('Metadata resource {} already exists. Please use the replace flag.'.format(resource))
                return None

        with io.open(resource, 'w', encoding='utf-8') as f:
            f.write(metadata.to_json())

        return resource

    def remove(self, name):
        logging.info('Removing Metadata with name {}'.format(name))
        metadata = self._find_metadata_resource(name)
        if metadata is None:
            logging.warning('Metadata {} not found !'.format(name))
            return
        else:
            os.remove(metadata.resource)

        return metadata.resource

    def _find_metadata_resource(self, name):
        if os.path.exists(self.metadata_dir):
            for f in os.listdir(self.metadata_dir):
                resource = os.path.join(self.metadata_dir, f)
                if os.path.splitext(os.path.basename(resource))[0] == name:
                    # TODO - valiate metadata against its schema before returning
                    return Metadata.from_resource(resource)

        # Metadata not found
        return None

    def _find_all_metadata(self):
        metadata_list = []
        if os.path.exists(self.metadata_dir):
            for f in os.listdir(self.metadata_dir):
                path = os.path.join(self.metadata_dir, f)
                metadata = Metadata.from_resource(path)
                # TODO - valiate metadata against its schema before adding to list
                metadata_list.append(metadata)

        return metadata_list
