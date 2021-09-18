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
import os
from typing import List

from entrypoints import EntryPoint
import pytest

from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE_ID
from elyra.metadata.schema import SchemaManager
from elyra.metadata.tests.test_utils import BYOSchemaspace

""" This file contains tests for testing SchemaManager, Schemaspace and SchemasProvider classes """

os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests schemaspace


schemaspace_map = {
    'metadata-tests': ('elyra.metadata.tests.test_utils', 'MetadataTestSchemaspace'),
    'byo_schemaspace_bad_id': ('elyra.metadata.tests.test_utils', 'BYOSchemaspaceBadId'),
    'byo.schemaspace-bad.name': ('elyra.metadata.tests.test_utils', 'BYOSchemaspaceBadName'),
    'byo-schemaspace': ('elyra.metadata.tests.test_utils', 'BYOSchemaspace'),
}
schemas_provider_map = {
    'metadata-tests': ('elyra.metadata.tests.test_utils', 'MetadataTestSchemasProvider'),
    'byo-schemas-provider': ('elyra.metadata.tests.test_utils', 'BYOSchemasProvider'),
}


def mock_get_schemaspaces() -> List[EntryPoint]:
    result = []
    for name, epstr in schemaspace_map.items():
        result.append(EntryPoint(name, epstr[0], epstr[1]))
    return result


def mock_get_schemas_providers() -> List[EntryPoint]:
    result = []
    for name, epstr in schemas_provider_map.items():
        result.append(EntryPoint(name, epstr[0], epstr[1]))
    return result


@pytest.fixture
def byo_schemaspaces(monkeypatch):
    """Setup the BYO Schemaspaces and SchemasProviders, returning the SchemaManager instance."""
    monkeypatch.setattr(SchemaManager, '_get_schemaspaces', mock_get_schemaspaces)
    monkeypatch.setattr(SchemaManager, '_get_schemas_providers', mock_get_schemas_providers)
    yield  # We must clear the SchemaManager instance else follow-on tests will be side-effected
    SchemaManager.clear_instance()


def test_validate_factory_schemas():
    # Test that each of our factory schemas meet the minimum requirements.
    # This is accomplished by merely accessing the schemas of the schemaspace
    # and ensuring their presence.
    schema_mgr = SchemaManager.instance()  # validation actually happens here
    schemaspace_names = schema_mgr.get_schemaspace_names()
    for schemaspace_name in schemaspace_names:
        schemaspace = schema_mgr.get_schemaspace(schemaspace_name)
        for name, schema in schemaspace.schemas.items():
            print(f"Schema '{schemaspace_name}/{name}' is valid.")


# ########################## SchemaManager Tests ###########################
# TODO - add tests for SchemaManager, Schemaspaces, and SchemasProviders
#
# Tests to add
# test_no_side_effect - get schema, make deepcopy (as original), modify schema obtained directly.
#                       Confirm different from copy. Fetch same schema from manager and confirm same as copy.
#
# test_schemaspace - Ensure schemaspace is loaded.  If possible, confirm schemas are added from provider.
# test_schemaspace_bad_class - Schemaspace that is registered but not a subclass of Schemaspace
# test_schemaspace_throw - throws error (and doesn't alter schema manager)
# test_schemasprovider - Ensure offered schemas are loaded and available from schemaManager
# test_schemasprovider_bad_class - SchemasProvider that is registered but not a subclass of SchemasProvider
# test_schemasprovider_throw - throws error (and doesn't alter schema manager)
# test_schemasprovider_no_schemaspace - have schemasprovider that references non-existent schemaspace
#
# Test case-insensitivity - use mixed case on schemaspace name and ensure scehamspace can be located, etc.


def test_schemaspace_display_name():
    """Ensures that display_name properly defaults from name (or not when provided itself)."""
    schema_mgr = SchemaManager.instance()
    # Only metadata-tests have matching name and display_name values
    schemaspace = schema_mgr.get_schemaspace("metadata-tests")
    assert schemaspace.name == "metadata-tests"
    assert schemaspace.display_name == schemaspace.name

    # All others have a separate name, we'll check runtime-images
    schemaspace = schema_mgr.get_schemaspace("runtime-images")
    assert schemaspace.name == "runtime-images"
    assert schemaspace.display_name == "Runtime Images"


def test_schema_durability():
    """Ensures that schemas retruned from get_schema_schemas can be altered and not side-effect the next access."""
    schema_mgr = SchemaManager.instance()
    schemas = schema_mgr.get_schemaspace_schemas(METADATA_TEST_SCHEMASPACE_ID)
    for name, schema in schemas.items():
        if name == "metadata-test":
            orig_schema = copy.deepcopy(schema_mgr.get_schema(METADATA_TEST_SCHEMASPACE_ID, name))  # capture good copy
            schema['metadata_class_name'] = "bad_class"
            assert schema != orig_schema

            fresh_schema = schema_mgr.get_schema(METADATA_TEST_SCHEMASPACE_ID, name)
            assert fresh_schema == orig_schema


def test_byo_schema(byo_schemaspaces):
    SchemaManager.clear_instance()
    schema_mgr = SchemaManager.instance()
    byo_ss = schema_mgr.get_schemaspace(BYOSchemaspace.BYO_SCHEMASPACE_ID)
    assert len(byo_ss.schemas) == 2
