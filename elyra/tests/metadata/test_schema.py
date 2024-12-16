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
import copy
import os
from typing import List
from typing import Optional

from entrypoints import EntryPoint
import pytest

from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE_ID
from elyra.metadata.schema import SchemaManager
from elyra.metadata.schema import Schemaspace
from elyra.metadata.schema import SchemasProvider
from elyra.tests.metadata.test_utils import BYOSchemaspace
from elyra.tests.metadata.test_utils import NON_EXISTENT_SCHEMASPACE_ID

""" This file contains tests for testing SchemaManager, Schemaspace and SchemasProvider classes """

os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests schemaspace


schemaspace_map = {
    "metadata-tests": ("elyra.tests.metadata.test_utils", "MetadataTestSchemaspace"),
    "byo_schemaspace_bad_id": ("elyra.tests.metadata.test_utils", "BYOSchemaspaceBadId"),
    "byo.schemaspace-bad.name": ("elyra.tests.metadata.test_utils", "BYOSchemaspaceBadName"),
    "byo.schemaspace_CaseSensitiveName": ("elyra.tests.metadata.test_utils", "BYOSchemaspaceCaseSensitiveName"),
    "byo-schemaspace": ("elyra.tests.metadata.test_utils", "BYOSchemaspace"),
    "byo-schemaspace-bad-class": ("elyra.tests.metadata.test_utils", "BYOSchemaspaceBadClass"),
    "byo-schemaspace-throws": ("elyra.tests.metadata.test_utils", "BYOSchemaspaceThrows"),
}
schemas_provider_map = {
    "metadata-tests": ("elyra.tests.metadata.test_utils", "MetadataTestSchemasProvider"),
    "byo-schemas-provider-throws": ("elyra.tests.metadata.test_utils", "BYOSchemasProviderThrows"),
    "byo-schemas-provider-bad-class": ("elyra.tests.metadata.test_utils", "BYOSchemasProviderBadClass"),
    "byo-schemas-provider": ("elyra.tests.metadata.test_utils", "BYOSchemasProvider"),
}


def mock_get_schemaspaces(ep_map: Optional[dict] = None) -> List[EntryPoint]:
    result = []
    if ep_map is None:
        ep_map = schemaspace_map
    for name, epstr in ep_map.items():
        result.append(EntryPoint(name, epstr[0], epstr[1]))
    return result


def mock_get_schemas_providers(ep_map: Optional[dict] = None) -> List[EntryPoint]:
    result = []
    if ep_map is None:
        ep_map = schemas_provider_map
    for name, epstr in ep_map.items():
        result.append(EntryPoint(name, epstr[0], epstr[1]))
    return result


@pytest.fixture
def byo_schemaspaces(monkeypatch):
    """Setup the BYO Schemaspaces and SchemasProviders, returning the SchemaManager instance."""
    monkeypatch.setattr(SchemaManager, "_get_schemaspaces", mock_get_schemaspaces)
    monkeypatch.setattr(SchemaManager, "_get_schemas_providers", mock_get_schemas_providers)
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


# ########################## SchemaManager, Schemaspace and SchemasProvider Tests ###########################


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


def test_schema_no_side_effect():
    """Ensures that schemas returned from get_schema_schemas can be altered and not side-effect the next access."""
    schema_mgr = SchemaManager.instance()
    schemas = schema_mgr.get_schemaspace_schemas(METADATA_TEST_SCHEMASPACE_ID)
    for name, schema in schemas.items():
        if name == "metadata-test":
            orig_schema = copy.deepcopy(schema_mgr.get_schema(METADATA_TEST_SCHEMASPACE_ID, name))  # capture good copy
            schema["metadata_class_name"] = "bad_class"
            assert schema != orig_schema

            fresh_schema = schema_mgr.get_schema(METADATA_TEST_SCHEMASPACE_ID, name)
            assert fresh_schema == orig_schema


def test_byo_schema(byo_schemaspaces):
    """Validates that the expected number of BYO schemas exist (2 of 4 are valid)"""
    SchemaManager.clear_instance()
    schema_mgr = SchemaManager.instance()
    byo_ss = schema_mgr.get_schemaspace(BYOSchemaspace.BYO_SCHEMASPACE_ID)
    assert len(byo_ss.schemas) == 2
    for name, schema in byo_ss.schemas.items():
        assert schema["name"] in ["byo-test-0", "byo-test-1"]


def test_schemaspace_case_sensitive_name_id(byo_schemaspaces, caplog):
    """Ensures that a schemaspace with case sensitive name and id has its instance properties unaltered."""
    SchemaManager.clear_instance()
    schema_mgr = SchemaManager.instance()
    byo_ss_name = "byo-schemaspace_CaseSensitiveName"
    byo_ss_id = "1b1e461a-c7fa-40f2-a3a3-bf1f2fd48EEA"
    schema_mgr_ss_names = schema_mgr.get_schemaspace_names()

    # Check schemaspace name is normalized in schema manager reference list
    assert byo_ss_name.lower() in schema_mgr_ss_names

    byo_ss_instance_name = schema_mgr.get_schemaspace_name(byo_ss_name)
    assert byo_ss_instance_name == byo_ss_name

    byo_ss_instance_name = schema_mgr.get_schemaspace_name(byo_ss_id)
    assert byo_ss_instance_name == byo_ss_name
    # Confirm this schemaspace produces an "empty schemaspace warning
    assert "The following schemaspaces have no schemas: ['byo-schemaspace_CaseSensitiveName']" in caplog.text


def validate_log_output(caplog: pytest.LogCaptureFixture, expected_entry: str) -> Schemaspace:
    """Common negative test pattern that validates expected log output."""

    SchemaManager.clear_instance()
    schema_mgr = SchemaManager.instance()
    assert expected_entry in caplog.text
    byo_ss = schema_mgr.get_schemaspace(BYOSchemaspace.BYO_SCHEMASPACE_ID)
    # Ensure there are two valid schemas and make sure our bad one is not in the list.
    assert len(byo_ss.schemas) == 2
    for name, schema in byo_ss.schemas.items():
        assert schema["name"] in ["byo-test-0", "byo-test-1"]
    return byo_ss  # in case caller wants to check other things.


def test_schemaspace_bad_name(byo_schemaspaces, caplog):
    """Ensure a Schemaspace with a bad name (not alphanumeric, w/ dash, underscore) is handled cleanly."""

    validate_log_output(
        caplog, "The 'name' property (byo.schemaspace-bad.name) must " "be alphanumeric with dash or underscore only!"
    )


def test_schemaspace_bad_class(byo_schemaspaces, caplog):
    """Ensure a Schemaspace that is registered but not a subclass of Schemaspace is handled cleanly."""

    validate_log_output(caplog, "'byo-schemaspace-bad-class' is not an instance of 'Schemaspace'")


def test_schemaspace_throws(byo_schemaspaces, caplog):
    """Ensure a schemaspace that throws from its constructor doesn't affect the loads of other schemas."""

    validate_log_output(caplog, "Test that throw from constructor is not harmful.")


def test_schemasprovider_bad_class(byo_schemaspaces, caplog):
    """Ensure a bad SchemasProvider class doesn't affect the loads of other schemas."""

    validate_log_output(
        caplog,
        "SchemasProvider instance 'byo-schemas-provider-bad-class' is not an "
        f"instance of '{SchemasProvider.__name__}'!",
    )


def test_schemasprovider_throws(byo_schemaspaces, caplog):
    """Ensure exception thrown by SchemasProvider doesn't affect the loads of other schemas."""

    validate_log_output(caplog, "Error loading schemas for SchemasProvider 'byo-schemas-provider-throws'")


def test_schemasprovider_no_schemaspace(byo_schemaspaces, caplog):
    """Ensure SchemasProvider that references a non-existent schemaspace doesn't affect the loads of other schemas."""

    byo_ss = validate_log_output(
        caplog,
        "Schema 'byo-test-unknown_schemaspace' references a schemaspace "
        f"'{NON_EXISTENT_SCHEMASPACE_ID}' that is not loaded!",
    )
    assert len(byo_ss.schemas) == 2
    for name, schema in byo_ss.schemas.items():
        assert schema["name"] != "byo-test-unknown_schemaspace"
