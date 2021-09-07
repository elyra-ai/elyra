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

import re
from typing import Dict
from typing import List
from typing import Optional

from elyra.metadata.storage import FileMetadataStore
from elyra.metadata.storage import MetadataStore


class Schemaspace(object):
    _id: str
    _name: str
    _description: str
    _storage_class: MetadataStore
    _schemas: List[Dict]

    def __init__(self,
                 schemaspace_id: str,
                 name: str,
                 description: Optional[str] = "",
                 storage_class: Optional[MetadataStore] = FileMetadataStore):
        self._id = schemaspace_id
        self._name = name
        self._description = description
        self._storage_class = storage_class
        self._schemas = []

        # Validate properties
        #  We may want another dictionary that maps name to id
        assert self._id is not None and len(self._id) > 0, "Property 'id' requires a value!"
        assert self._validate_id(), f"The value of property 'id' ({self._id}) does not conform to a UUID!"

        assert self._name is not None and len(self._name) > 0, "Property 'name' requires a value!"

        assert isinstance(self._storage_class, MetadataStore,
                          f"The value of property 'storage_class' ({self._storage_class.__name__}) "
                          f"must be an instance of '{MetadataStore.__name__}'!")

    @property
    def id(self) -> str:
        """The id (uuid) of the schemaspace"""
        return self._id

    @property
    def name(self) -> str:
        """The name of the schemaspace"""
        return self._name

    @property
    def description(self) -> str:
        """The description of the schemaspace"""
        return self._description

    @property
    def storage_class(self) -> MetadataStore:
        """The storage class used to store instances of the schemas associated with this schemaspace"""
        return self._storage_class

    @property
    def schemas(self) -> List[Dict]:
        """Returns the schemas currently associated with this schemaspace"""
        return self._schemas

    @classmethod
    def add_schema(self, schema: Dict) -> None:
        """Associates the given schema to this schemaspace"""
        assert isinstance(schema, dict, "Parameter 'schema' is not a dictionary!")
        self._schemas.append(schema)

    @classmethod
    def _validate_id(self) -> bool:
        """
            Validate that id is uuidv4 compliant
            """
        is_valid = False
        uuidv4_regex = re.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
        if uuidv4_regex.match(self._id):
            is_valid = True

        return is_valid
