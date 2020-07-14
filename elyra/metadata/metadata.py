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

import json

from ipython_genutils.importstring import import_item
from typing import Type, TypeVar, Any

from .schema import SchemaManager

# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
M = TypeVar('M', bound='Metadata')


class Metadata(object):
    name = None
    resource = None
    display_name = None
    schema_name = None
    metadata = {}
    reason = None

    def __init__(self, **kwargs: Any) -> None:
        self.name = kwargs.get('name')
        self.display_name = kwargs.get('display_name')
        self.schema_name = kwargs.get('schema_name')
        self.metadata = kwargs.get('metadata', {})
        self.resource = kwargs.get('resource')
        self.reason = kwargs.get('reason')

    def post_load(self, **kwargs: Any) -> None:
        """Called by MetadataManager after fetching the instance.

        :param kwargs: additional arguments
        """
        pass

    def pre_save(self, **kwargs: Any) -> None:
        """Called by MetadataManager prior to saving the instance.

        :param kwargs: additional arguments
        Keyword Args:
            for_update (bool): indicates if this save operation if for update (True) or create (False)
        """
        pass

    def pre_delete(self, **kwargs: Any) -> None:
        """Called by MetadataManager prior to deleting the instance.

        :param kwargs: additional arguments
        """
        pass

    @classmethod
    def from_dict(cls: Type[M], namespace: str, metadata_dict: dict) -> M:
        """Creates an appropriate instance of Metadata from a dictionary instance """

        # Get the schema and look for metadata_class entry and use that, else Metadata.
        metadata_class_name = 'elyra.metadata.Metadata'
        schema_name = metadata_dict.get('schema_name')
        if schema_name:
            try:
                schema = SchemaManager.instance().get_schema(namespace, schema_name)
                metadata_class_name = schema.get('metadata_class_name', metadata_class_name)
            except Exception:  # just use the default
                pass
        metadata_class = import_item(metadata_class_name)
        try:
            instance = metadata_class(**metadata_dict)
            if not isinstance(instance, Metadata):
                raise ValueError("The metadata_class_name ('{}') for schema '{}' must be a subclass of '{}'!".
                                 format(metadata_class_name, schema_name, cls.__name__))
        except TypeError as te:
            raise ValueError("The metadata_class_name ('{}') for schema '{}' must be a subclass of '{}'!".
                             format(metadata_class_name, schema_name, cls.__name__)) from te
        return instance

    def to_dict(self, trim: bool = False) -> dict:
        # Exclude resource, and reason only if trim is True since we don't want to persist that information.
        #  Method prepare_write will be used to remove name prior to writes.
        d = dict(name=self.name, display_name=self.display_name, metadata=self.metadata, schema_name=self.schema_name)
        if not trim:
            if self.resource:
                d['resource'] = self.resource
            if self.reason:
                d['reason'] = self.reason

        return d

    def to_json(self, trim: bool = False) -> str:
        return json.dumps(self.to_dict(trim=trim), indent=2)

    def prepare_write(self) -> dict:
        """Prepares this instance for storage, stripping name, reason, and resource and converting to a dict"""
        prepared = self.to_dict(trim=True)  # we should also trim 'name' when storing
        prepared.pop('name', None)
        return prepared

    def __repr__(self):
        return self.to_json()
