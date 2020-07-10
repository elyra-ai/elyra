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

from typing import Type, TypeVar

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

    def __init__(self, **kwargs):
        self.name = kwargs.get('name')
        self.display_name = kwargs.get('display_name')
        self.schema_name = kwargs.get('schema_name')
        self.metadata = kwargs.get('metadata', {})
        self.resource = kwargs.get('resource')
        self.reason = kwargs.get('reason')

    @classmethod
    def from_dict(cls: Type[M], metadata_dict: dict) -> M:
        """Creates an instance of Metadata from a dictionary instance """
        return cls(name=metadata_dict.get('name'),
                   display_name=metadata_dict.get('display_name'),
                   schema_name=metadata_dict.get('schema_name'),
                   metadata=metadata_dict.get('metadata', {}),
                   resource=metadata_dict.get('resource'),
                   reason=metadata_dict.get('reason'))

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
