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
from collections import OrderedDict
import copy
import json
import os
import shutil
import time

from jsonschema import ValidationError
import pytest

from elyra.metadata.error import MetadataExistsError
from elyra.metadata.error import MetadataNotFoundError
from elyra.metadata.error import SchemaNotFoundError
from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE
from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE_ID
from elyra.metadata.storage import FileMetadataCache
from elyra.metadata.storage import FileMetadataStore
from elyra.metadata.storage import MetadataStore
from elyra.tests.metadata.test_utils import byo_metadata_json
from elyra.tests.metadata.test_utils import create_instance
from elyra.tests.metadata.test_utils import create_json_file
from elyra.tests.metadata.test_utils import invalid_metadata_json
from elyra.tests.metadata.test_utils import invalid_no_display_name_json
from elyra.tests.metadata.test_utils import MockMetadataStore
from elyra.tests.metadata.test_utils import valid_display_name_json
from elyra.tests.metadata.test_utils import valid_metadata2_json
from elyra.tests.metadata.test_utils import valid_metadata_json


os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests schemaspace


# ########################## MetadataManager Tests ###########################
def test_manager_add_invalid(tests_manager):
    with pytest.raises(ValueError):
        MetadataManager(schemaspace="invalid")

    # Attempt with non Metadata instance
    with pytest.raises(TypeError):
        tests_manager.create(valid_metadata_json)

    # and invalid parameters
    with pytest.raises(TypeError):
        tests_manager.create(None, invalid_no_display_name_json)

    with pytest.raises(ValueError):
        tests_manager.create("foo", None)


def test_manager_add_no_name(tests_manager, schemaspace_location):
    metadata_name = "valid_metadata_instance"

    metadata = Metadata.from_dict(METADATA_TEST_SCHEMASPACE_ID, {**valid_metadata_json})
    instance = tests_manager.create(None, metadata)

    assert instance is not None
    assert instance.name == metadata_name
    assert instance.pre_property == instance.metadata.get("required_test")
    assert instance.post_property == instance.display_name

    # Ensure file was created using store_manager
    instance_list = tests_manager.metadata_store.fetch_instances(metadata_name)
    assert len(instance_list) == 1
    instance = Metadata.from_dict(METADATA_TEST_SCHEMASPACE, instance_list[0])
    metadata_location = _compose_instance_location(tests_manager.metadata_store, schemaspace_location, metadata_name)
    assert instance.resource == metadata_location
    assert instance.pre_property == instance.metadata.get("required_test")
    # This will be None because the hooks don't get called when fetched directly from the store
    assert instance.post_property is None

    # And finally, remove it.
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_add_short_name(tests_manager, schemaspace_location):
    # Found that single character names were failing validation
    metadata_name = "a"
    metadata = Metadata(**valid_metadata_json)
    instance = tests_manager.create(metadata_name, metadata)

    assert instance is not None
    assert instance.name == metadata_name

    # Ensure file was created using store_manager
    instance_list = tests_manager.metadata_store.fetch_instances(metadata_name)
    assert len(instance_list) == 1
    instance = Metadata.from_dict(METADATA_TEST_SCHEMASPACE_ID, instance_list[0])
    metadata_location = _compose_instance_location(tests_manager.metadata_store, schemaspace_location, metadata_name)
    assert instance.resource == metadata_location

    # And finally, remove it.
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_add_empty_display_name(tests_manager):
    # Found that empty display_name values were passing validation, so minLength=1 was added
    metadata_name = "empty_display_name"
    metadata = Metadata(**valid_metadata_json)
    metadata.display_name = ""
    with pytest.raises(ValidationError):
        tests_manager.create(metadata_name, metadata)

    # Ensure file was not created using storage manager
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_add_display_name(tests_manager, schemaspace_location):
    metadata_display_name = '1 teste "rápido"'
    metadata_name = "a_1_teste_rpido"

    metadata = Metadata(**valid_display_name_json)
    instance = tests_manager.create(None, metadata)

    assert instance is not None
    assert instance.name == metadata_name
    assert instance.display_name == metadata_display_name

    # Ensure file was created using store_manager
    instance_list = tests_manager.metadata_store.fetch_instances(metadata_name)
    assert len(instance_list) == 1
    instance = Metadata.from_dict(METADATA_TEST_SCHEMASPACE, instance_list[0])
    metadata_location = _compose_instance_location(tests_manager.metadata_store, schemaspace_location, metadata_name)
    assert instance.resource == metadata_location
    assert instance.display_name == metadata_display_name

    # And finally, remove it.
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


@pytest.mark.parametrize(
    "complex_string, valid",
    [
        ("", False),
        (" ", False),
        (" starting-whitespace", False),
        ("ending-whitespace ", False),
        (" whitespace-both-ends ", False),
        ("whitespace in between", True),
        ("no-whitespace", True),
    ],
)
def test_manager_complex_string_schema(tests_manager, schemaspace_location, complex_string, valid):
    metadata_name = "valid_metadata_instance"
    metadata_dict = {**valid_metadata_json}
    metadata_dict["metadata"]["string_complex_test"] = complex_string
    metadata = Metadata.from_dict(METADATA_TEST_SCHEMASPACE_ID, metadata_dict)

    if not valid:
        with pytest.raises(ValidationError):
            tests_manager.create(metadata_name, metadata)

    else:
        instance = tests_manager.create(metadata_name, metadata)
        assert instance.metadata.get("string_complex_test") == complex_string

        # And finally, remove it.
        tests_manager.remove(metadata_name)

        # Verify removal using metadata_store
        with pytest.raises(MetadataNotFoundError):
            tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_get_include_invalid(tests_manager):
    metadata_list = tests_manager.get_all(include_invalid=False)
    assert len(metadata_list) == 2
    metadata_list = tests_manager.get_all(include_invalid=True)
    assert len(metadata_list) == 5


def test_manager_get_of_schema(tests_manager):
    metadata_list = tests_manager.get_all(include_invalid=True)
    assert len(metadata_list) == 5
    metadata_list = tests_manager.get_all(include_invalid=True, of_schema="metadata-test")
    assert len(metadata_list) == 3  # does not include metadata with schema {unknown} and metadata-testxxx


def test_manager_get_bad_json(tests_manager):
    with pytest.raises(ValueError) as ve:
        tests_manager.get("bad")
    assert "JSON failed to load for instance 'bad'" in str(ve.value)


def test_manager_get_all(tests_manager):
    metadata_list = tests_manager.get_all()
    assert len(metadata_list) == 2
    # Ensure name is getting derived from resource and not from contents
    for metadata in metadata_list:
        if metadata.display_name == "Another Metadata Instance (2)":
            assert metadata.name == "another"
        else:
            assert metadata.name == "valid"


def test_manager_get_none(tests_manager, schemaspace_location):
    # Attempt to get a metadata instance using `None` (error expected)
    with pytest.raises(ValueError, match="The 'name' parameter requires a value."):
        tests_manager.get(name=None)


def test_manager_get_all_none(tests_manager, schemaspace_location):
    # Delete the schemaspace contents and attempt listing metadata
    _remove_schemaspace(tests_manager.metadata_store, schemaspace_location)
    assert tests_manager.schemaspace_exists() is False
    _create_schemaspace(tests_manager.metadata_store, schemaspace_location)
    assert tests_manager.schemaspace_exists()

    metadata_list = tests_manager.get_all()
    assert len(metadata_list) == 0


def test_manager_add_remove_valid(tests_manager, schemaspace_location):
    metadata_name = "valid_add_remove"

    # Remove schemaspace_location and ensure it gets created
    _remove_schemaspace(tests_manager.metadata_store, schemaspace_location)

    metadata = Metadata(**valid_metadata_json)

    instance = tests_manager.create(metadata_name, metadata)
    assert instance is not None

    # Attempt to create again w/o replace, then replace it.
    with pytest.raises(MetadataExistsError):
        tests_manager.create(metadata_name, metadata)

    instance = tests_manager.update(metadata_name, metadata)
    assert instance is not None

    # And finally, remove it.
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_remove_invalid(tests_manager, schemaspace_location):
    # Ensure invalid metadata file isn't validated and is removed.
    create_instance(tests_manager.metadata_store, schemaspace_location, "remove_invalid", invalid_metadata_json)
    metadata_name = "remove_invalid"
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_remove_missing(tests_manager):
    # Ensure removal of missing metadata file is handled.
    metadata_name = "missing"
    with pytest.raises(MetadataNotFoundError):
        tests_manager.remove(metadata_name)


def test_manager_read_valid_by_name(tests_manager, schemaspace_location):
    metadata_name = "valid"
    some_metadata = tests_manager.get(metadata_name)
    assert some_metadata.name == metadata_name
    assert some_metadata.schema_name == "metadata-test"
    metadata_location = _compose_instance_location(tests_manager.metadata_store, schemaspace_location, metadata_name)
    assert metadata_location == some_metadata.resource


def test_manager_read_invalid_by_name(tests_manager):
    metadata_name = "invalid"
    with pytest.raises(ValidationError):
        tests_manager.get(metadata_name)


def test_manager_read_missing_by_name(tests_manager):
    metadata_name = "missing"
    with pytest.raises(MetadataNotFoundError):
        tests_manager.get(metadata_name)


def test_manager_rollback_create(tests_manager):
    metadata_name = "rollback_create"

    metadata = Metadata(**valid_metadata2_json)

    os.environ["METADATA_TEST_HOOK_OP"] = "create"  # Tell test class which op to raise
    # Create post-save hook will throw NotImplementedError
    with pytest.raises(NotImplementedError):
        tests_manager.create(metadata_name, metadata)

    # Ensure nothing got created
    with pytest.raises(MetadataNotFoundError):
        tests_manager.get(metadata_name)

    os.environ.pop("METADATA_TEST_HOOK_OP")  # Restore normal operation
    instance = tests_manager.create(metadata_name, metadata)
    instance2 = tests_manager.get(metadata_name)
    assert instance.name == instance2.name
    assert instance.schema_name == instance2.schema_name
    assert instance.post_property == instance2.post_property


def test_manager_rollback_update(tests_manager):
    metadata_name = "rollback_update"

    metadata = Metadata(**valid_metadata2_json)

    # Create the instance
    instance = tests_manager.create(metadata_name, metadata)
    original_display_name = instance.display_name
    instance.display_name = "Updated_" + original_display_name

    os.environ["METADATA_TEST_HOOK_OP"] = "update"  # Tell test class which op to raise
    # Update post-save hook will throw ModuleNotFoundError
    with pytest.raises(ModuleNotFoundError):
        tests_manager.update(metadata_name, instance)

    # Ensure the display_name is still the original value.
    instance2 = tests_manager.get(metadata_name)
    assert instance2.display_name == original_display_name

    os.environ.pop("METADATA_TEST_HOOK_OP")  # Restore normal operation
    # Ensure we can still update
    instance = tests_manager.update(metadata_name, instance)
    assert instance.display_name == "Updated_" + original_display_name


def test_manager_rollback_delete(tests_manager):
    metadata_name = "rollback_delete"

    metadata = Metadata(**valid_metadata2_json)

    # Create the instance
    instance = tests_manager.create(metadata_name, metadata)

    os.environ["METADATA_TEST_HOOK_OP"] = "delete"  # Tell test class which op to raise
    # Delete post-save hook will throw FileNotFoundError
    with pytest.raises(FileNotFoundError):
        tests_manager.remove(metadata_name)

    # Ensure the instance still exists
    instance2 = tests_manager.get(metadata_name)
    assert instance2.display_name == instance.display_name

    os.environ.pop("METADATA_TEST_HOOK_OP")  # Restore normal operation
    # Ensure we can still delete
    tests_manager.remove(metadata_name)

    # Ensure the instance was deleted
    with pytest.raises(MetadataNotFoundError):
        tests_manager.get(metadata_name)


def test_manager_hierarchy_fetch(tests_hierarchy_manager, factory_location, shared_location, schemaspace_location):
    # fetch initial instances, only factory data should be present
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure these are all factory instances
    for metadata in metadata_list:
        assert metadata.display_name == "factory"

    byo_3 = tests_hierarchy_manager.get("byo_3")
    assert byo_3.resource.startswith(str(factory_location))

    # add a shared instance and confirm list count is still the same, but
    # only that instance is present in shared directory...
    byo_instance = byo_metadata_json
    byo_instance["display_name"] = "shared"
    create_json_file(shared_location, "byo_3.json", byo_instance)

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == "byo_3":
            assert metadata.display_name == "shared"
        else:
            assert metadata.display_name == "factory"

    byo_3 = tests_hierarchy_manager.get("byo_3")
    assert byo_3.resource.startswith(str(shared_location))

    # add a shared and a user instance confirm list count is still the same, but
    # both the user and shared instances are correct.
    byo_instance = byo_metadata_json
    byo_instance["display_name"] = "shared"
    create_json_file(shared_location, "byo_2.json", byo_instance)
    byo_instance["display_name"] = "user"
    create_json_file(schemaspace_location, "byo_2.json", byo_instance)

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == "byo_1":
            assert metadata.display_name == "factory"
        if metadata.name == "byo_2":
            assert metadata.display_name == "user"
        if metadata.name == "byo_3":
            assert metadata.display_name == "shared"

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(schemaspace_location))

    # delete the user instance and ensure its shared copy is now exposed
    tests_hierarchy_manager.metadata_store.delete_instance(byo_2.to_dict())

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == "byo_1":
            assert metadata.display_name == "factory"
        if metadata.name == "byo_2":
            assert metadata.display_name == "shared"
        if metadata.name == "byo_3":
            assert metadata.display_name == "shared"

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(shared_location))

    # delete both shared copies and ensure only factory is left
    # Note: because we can only delete user instances via the APIs, this
    # code is metadata_store-sensitive.  If other stores implement this
    # hierachy scheme, similar storage-specific code will be necessary.
    if isinstance(tests_hierarchy_manager.metadata_store, FileMetadataStore):
        os.remove(os.path.join(shared_location, "byo_2.json"))
        os.remove(os.path.join(shared_location, "byo_3.json"))

    # fetch initial instances, only factory data should be present
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure these are all factory instances
    for metadata in metadata_list:
        assert metadata.display_name == "factory"

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(factory_location))


def test_manager_hierarchy_create(tests_hierarchy_manager, schemaspace_location):
    # Note, this is really more of an update test (replace = True), since you cannot "create" an
    # instance if it already exists - which, in this case, it exists in the factory area

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = "user"
    with pytest.raises(MetadataExistsError):
        tests_hierarchy_manager.create("byo_2", metadata)

    instance = tests_hierarchy_manager.update("byo_2", metadata)
    assert instance is not None
    assert instance.resource.startswith(str(schemaspace_location))

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == "byo_1":
            assert metadata.display_name == "factory"
        if metadata.name == "byo_2":
            assert metadata.display_name == "user"
        if metadata.name == "byo_3":
            assert metadata.display_name == "factory"

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(schemaspace_location))

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = "user"
    instance = tests_hierarchy_manager.update("byo_3", metadata)
    assert instance is not None
    assert instance.resource.startswith(str(schemaspace_location))

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == "byo_1":
            assert metadata.display_name == "factory"
        if metadata.name == "byo_2":
            assert metadata.display_name == "user"
        if metadata.name == "byo_3":
            assert metadata.display_name == "user"

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(schemaspace_location))


def test_manager_hierarchy_update(tests_hierarchy_manager, factory_location, shared_location, schemaspace_location):
    # Create a copy of existing factory instance and ensure its in the user area
    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(factory_location))

    byo_2.display_name = "user"
    with pytest.raises(MetadataExistsError):
        tests_hierarchy_manager.create("byo_2", byo_2)

    # Repeat with replacement enabled
    instance = tests_hierarchy_manager.update("byo_2", byo_2)
    assert instance is not None
    assert instance.resource.startswith(str(schemaspace_location))

    # now "slip in" a shared instance behind the updated version and ensure
    # the updated version is what's returned.
    byo_instance = byo_metadata_json
    byo_instance["display_name"] = "shared"
    create_json_file(shared_location, "byo_2.json", byo_instance)

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(schemaspace_location))

    # now remove the updated instance and ensure the shared instance appears
    tests_hierarchy_manager.remove("byo_2")

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(shared_location))


def test_manager_update(tests_hierarchy_manager, schemaspace_location):
    # Create some metadata, then attempt to update it with a known schema violation
    # and ensure the previous copy still exists...

    # Create a user instance...
    metadata = Metadata.from_dict(METADATA_TEST_SCHEMASPACE_ID, {**byo_metadata_json})
    metadata.display_name = "user1"
    instance = tests_hierarchy_manager.create("update", metadata)
    assert instance is not None
    assert instance.resource.startswith(str(schemaspace_location))
    assert instance.pre_property == instance.metadata["required_test"]
    assert instance.post_property == instance.display_name

    # Now update the user instance - add a field - and ensure that the original renamed file is not present.

    instance2 = tests_hierarchy_manager.get("update")
    instance2.display_name = "user2"
    instance2.metadata["number_range_test"] = 7
    instance = tests_hierarchy_manager.update("update", instance2)
    assert instance.pre_property == instance.metadata["required_test"]
    assert instance.post_property == instance2.display_name

    _ensure_single_instance(tests_hierarchy_manager, schemaspace_location, "update.json")

    instance2 = tests_hierarchy_manager.get("update")
    assert instance2.display_name == "user2"
    assert instance2.metadata["number_range_test"] == 7


def test_manager_default_value(tests_hierarchy_manager, schemaspace_location):
    # Create some metadata, then attempt to update it with a known schema violation
    # and ensure the previous copy still exists...

    # Create a user instance...
    metadata = Metadata.from_dict(METADATA_TEST_SCHEMASPACE, {**byo_metadata_json})
    metadata.display_name = "user1"
    instance = tests_hierarchy_manager.create("default_value", metadata)
    assert instance.metadata["number_default_test"] == 42  # Ensure default value was applied when not present

    instance2 = tests_hierarchy_manager.get("default_value")
    instance2.metadata["number_default_test"] = 37
    tests_hierarchy_manager.update("default_value", instance2)

    instance3 = tests_hierarchy_manager.get("default_value")
    assert instance3.metadata["number_default_test"] == 37

    # Now remove the updated value and ensure it comes back with the default
    instance3.metadata.pop("number_default_test")
    assert "number_default_test" not in instance3.metadata
    tests_hierarchy_manager.update("default_value", instance3)

    instance4 = tests_hierarchy_manager.get("default_value")
    assert instance4.metadata["number_default_test"] == 42


def test_manager_bad_update(tests_hierarchy_manager, schemaspace_location):
    # Create some metadata, then attempt to update it with a known schema violation
    # and ensure the previous copy still exists...

    # Create a user instance...
    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = "user1"
    instance = tests_hierarchy_manager.create("bad_update", metadata)
    assert instance is not None
    assert instance.resource.startswith(str(schemaspace_location))

    # Now, attempt to update the user instance, but include a schema violation.
    # Verify the update failed, but also ensure the previous instance is still there.

    instance2 = tests_hierarchy_manager.get("bad_update")
    instance2.display_name = "user2"
    instance2.metadata["number_range_test"] = 42  # number is out of range
    with pytest.raises(ValidationError):
        tests_hierarchy_manager.update("bad_update", instance2)

    _ensure_single_instance(tests_hierarchy_manager, schemaspace_location, "bad_update.json")

    instance2 = tests_hierarchy_manager.get("bad_update")
    assert instance2.display_name == instance.display_name
    assert "number_range_test" not in instance2.metadata

    # Now try update without providing a name, ValueError expected
    instance2 = tests_hierarchy_manager.get("bad_update")
    instance2.display_name = "user update with no name"
    with pytest.raises(ValueError):
        tests_hierarchy_manager.update(None, instance2)

    _ensure_single_instance(tests_hierarchy_manager, schemaspace_location, "bad_update.json")


def test_manager_hierarchy_remove(tests_hierarchy_manager, factory_location, shared_location, schemaspace_location):
    # Create additional instances in shared and user areas
    byo_2 = byo_metadata_json
    byo_2["display_name"] = "shared"
    create_json_file(shared_location, "byo_2.json", byo_2)

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = "user"
    instance = tests_hierarchy_manager.update("byo_2", metadata)
    assert instance is not None
    assert instance.resource.startswith(str(schemaspace_location))

    # Confirm on in user is found...
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == "byo_1":
            assert metadata.display_name == "factory"
        if metadata.name == "byo_2":
            assert metadata.display_name == "user"
        if metadata.name == "byo_3":
            assert metadata.display_name == "factory"

    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(schemaspace_location))

    # Now remove instance.  Should be allowed since it resides in user area
    tests_hierarchy_manager.remove("byo_2")
    _ensure_single_instance(tests_hierarchy_manager, schemaspace_location, "byo_2.json", expected_count=0)

    # Attempt to remove instance from shared area and its protected
    with pytest.raises(PermissionError) as pe:
        tests_hierarchy_manager.remove("byo_2")
    assert "Removal of instance 'byo_2'" in str(pe.value)

    # Ensure the one that exists is the one in the shared area
    byo_2 = tests_hierarchy_manager.get("byo_2")
    assert byo_2.resource.startswith(str(shared_location))

    # Attempt to remove instance from factory area and its protected as well
    with pytest.raises(PermissionError) as pe:
        tests_hierarchy_manager.remove("byo_1")
    assert "Removal of instance 'byo_1'" in str(pe.value)

    byo_1 = tests_hierarchy_manager.get("byo_1")
    assert byo_1.resource.startswith(str(factory_location))


def test_validation_performance():
    import psutil

    metadata_mgr = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)
    metadata_dict = {**valid_metadata_json}
    metadata = Metadata.from_dict(METADATA_TEST_SCHEMASPACE_ID, metadata_dict)

    process = psutil.Process(os.getpid())
    # warm up
    metadata_mgr.validate("perf_test", metadata)

    iterations = 10000
    memory_start = process.memory_info()
    t0 = time.time()
    for _ in range(0, iterations):
        metadata_mgr.validate("perf_test", metadata)

    t1 = time.time()
    memory_end = process.memory_info()
    diff = (memory_end.rss - memory_start.rss) / 1024
    print(
        f"\nMemory: {diff:,} kb, Start: {memory_start.rss / 1024 / 1024:,.3f} mb, "
        f"End: {memory_end.rss / 1024 / 1024:,.3f} mb., "
        f"Elapsed time: {t1 - t0:.3f}s over {iterations} iterations."
    )


# ########################## MetadataStore Tests ###########################
def test_store_schemaspace(store_manager, schemaspace_location):
    # Delete the metadata dir contents and attempt listing metadata
    _remove_schemaspace(store_manager, schemaspace_location)
    assert store_manager.schemaspace_exists() is False

    # create some metadata
    store_manager.store_instance("ensure_schemaspace_exists", Metadata(**valid_metadata_json).prepare_write())
    assert store_manager.schemaspace_exists()


def test_store_fetch_instances(store_manager):
    instances_list = store_manager.fetch_instances()
    assert len(instances_list) == 4


def test_store_fetch_no_schemaspace(store_manager, schemaspace_location):
    # Delete the schemaspace contents and attempt listing metadata
    _remove_schemaspace(store_manager, schemaspace_location)

    instance_list = store_manager.fetch_instances()
    assert len(instance_list) == 0


def test_store_fetch_by_name(store_manager):
    metadata_name = "valid"
    instance_list = store_manager.fetch_instances(name=metadata_name)
    assert instance_list[0].get("name") == metadata_name


def test_store_fetch_missing(store_manager):
    metadata_name = "missing"
    with pytest.raises(MetadataNotFoundError):
        store_manager.fetch_instances(name=metadata_name)


def test_store_store_instance(store_manager, schemaspace_location):
    # Remove schemaspace to test raw creation and confirm perms
    _remove_schemaspace(store_manager, schemaspace_location)

    metadata_name = "persist"
    metadata = Metadata(**valid_metadata_json)
    metadata_dict = metadata.prepare_write()

    instance = store_manager.store_instance(metadata_name, metadata_dict)
    assert instance is not None

    if isinstance(store_manager, FileMetadataStore):
        dir_mode = oct(os.stat(schemaspace_location).st_mode & 0o777777)  # Be sure to include other attributes
        assert dir_mode == "0o40700"  # and ensure this is a directory with only rwx by owner enabled

        # Ensure file was created
        metadata_file = os.path.join(schemaspace_location, "persist.json")
        assert os.path.exists(metadata_file)
        file_mode = oct(os.stat(metadata_file).st_mode & 0o777777)  # Be sure to include other attributes
        assert file_mode == "0o100600"  # and ensure this is a regular file with only rw by owner enabled

        with open(metadata_file, "r", encoding="utf-8") as f:
            valid_add = json.loads(f.read())
            assert "resource" not in valid_add
            assert "name" not in valid_add
            assert "display_name" in valid_add
            assert valid_add["display_name"] == "valid metadata instance"
            assert "schema_name" in valid_add
            assert valid_add["schema_name"] == "metadata-test"

    # Attempt to create again w/o replace, then replace it.
    with pytest.raises(MetadataExistsError):
        store_manager.store_instance(metadata_name, metadata.prepare_write())

    metadata.metadata["number_range_test"] = 10
    instance = store_manager.store_instance(metadata_name, metadata.prepare_write(), for_update=True)
    assert instance is not None
    assert instance.get("metadata")["number_range_test"] == 10


def test_store_delete_instance(store_manager, schemaspace_location):
    metadata_name = "valid"
    instance_list = store_manager.fetch_instances(name=metadata_name)
    metadata = instance_list[0]
    store_manager.delete_instance(metadata)

    with pytest.raises(MetadataNotFoundError):
        store_manager.fetch_instances(name=metadata_name)

    if isinstance(store_manager, FileMetadataStore):
        # Ensure file was physically deleted
        metadata_file = os.path.join(schemaspace_location, "valid.json")
        assert not os.path.exists(metadata_file)


# ########################## Error Tests ###########################
def test_error_metadata_not_found():
    schemaspace = METADATA_TEST_SCHEMASPACE
    resource = "missing_metadata"
    try:
        raise MetadataNotFoundError(schemaspace, resource)
    except MetadataNotFoundError as mnfe:
        assert str(mnfe) == f"No such instance named '{resource}' was found in the {schemaspace} schemaspace."


def test_error_metadata_exists():
    schemaspace = METADATA_TEST_SCHEMASPACE
    resource = "existing_metadata"
    try:
        raise MetadataExistsError(schemaspace, resource)
    except MetadataExistsError as mee:
        assert str(mee) == f"An instance named '{resource}' already exists in the {schemaspace} schemaspace."


def test_error_schema_not_found():
    schemaspace = METADATA_TEST_SCHEMASPACE
    resource = "missing_schema"
    try:
        raise SchemaNotFoundError(schemaspace, resource)
    except SchemaNotFoundError as snfe:
        assert str(snfe) == f"No such schema named '{resource}' was found in the {schemaspace} schemaspace."


def test_cache_init():
    FileMetadataCache.clear_instance()
    cache = FileMetadataCache.instance()
    assert cache.max_size == 128
    FileMetadataCache.clear_instance()

    cache = FileMetadataCache.instance(max_size=3)
    assert cache.max_size == 3
    FileMetadataCache.clear_instance()


def test_cache_ops(tests_manager, schemaspace_location):
    FileMetadataCache.clear_instance()

    test_items = OrderedDict({"a": 3, "b": 4, "c": 5, "d": 6, "e": 7})
    test_resources = {}
    test_content = {}

    # Setup test data
    for name, number in test_items.items():
        content = copy.deepcopy(valid_metadata_json)
        content["display_name"] = name
        content["metadata"]["number_range_test"] = number
        resource = create_instance(tests_manager.metadata_store, schemaspace_location, name, content)
        test_resources[name] = resource
        test_content[name] = content

    # Add initial entries
    cache = FileMetadataCache.instance(max_size=3)
    for name in test_items:  # Add the items to the cache
        cache.add_item(test_resources[name], test_content[name])

    assert len(cache) == 3
    assert cache.trims == 2
    assert cache.get_item(test_resources.get("a")) is None
    assert cache.get_item(test_resources.get("b")) is None
    assert cache.get_item(test_resources.get("c")) is not None
    assert cache.get_item(test_resources.get("d")) is not None
    assert cache.get_item(test_resources.get("e")) is not None
    assert cache.misses == 2
    assert cache.hits == 3

    cache.add_item(test_resources.get("a"), test_content.get("a"))
    assert len(cache) == 3
    assert cache.trims == 3
    assert cache.get_item(test_resources.get("c")) is None  # since 'c' was aged out
    assert cache.get_item(test_resources.get("a")) is not None
    assert cache.misses == 3
    assert cache.hits == 4

    e_val = cache.remove_item(test_resources.get("e"))
    assert len(cache) == 2
    assert e_val["metadata"]["number_range_test"] == test_items.get("e")
    assert cache.get_item(test_resources.get("e")) is None
    assert cache.misses == 4
    assert cache.hits == 4
    assert cache.trims == 3

    a_val = cache.remove_item(test_resources.get("a"))
    assert len(cache) == 1
    assert a_val["metadata"]["number_range_test"] == test_items.get("a")
    assert cache.get_item(test_resources.get("a")) is None
    assert cache.misses == 5
    assert cache.hits == 4
    assert cache.trims == 3

    d_val = cache.get_item(test_resources.get("d"))
    assert len(cache) == 1
    assert d_val["metadata"]["number_range_test"] == test_items.get("d")
    assert cache.misses == 5
    assert cache.hits == 5
    assert cache.trims == 3

    if isinstance(tests_manager.metadata_store, FileMetadataStore):
        # Exercise delete from filesystem and ensure cached item is removed
        assert os.path.exists(test_resources.get("d"))
        os.remove(test_resources.get("d"))
        recorded = 0.0
        for i in range(1, 6):  # allow up to a second for delete to record in cache
            time.sleep(0.2)  # initial tests are showing only one sub-second delay is necessary
            recorded += 0.2
            if len(cache) == 0:
                break
        assert len(cache) == 0
        print(f"\ntest_cache_ops: Delete recorded after {recorded} seconds")
        assert cache.get_item(test_resources.get("d")) is None
        assert cache.misses == 6
        assert cache.hits == 5
        assert cache.trims == 3


def test_cache_disabled(tests_manager, schemaspace_location):
    FileMetadataCache.clear_instance()

    test_items = OrderedDict({"a": 3, "b": 4, "c": 5, "d": 6, "e": 7})
    test_resources = {}
    test_content = {}

    # Setup test data
    for name, number in test_items.items():
        content = copy.deepcopy(valid_metadata_json)
        content["display_name"] = name
        content["metadata"]["number_range_test"] = number
        resource = create_instance(tests_manager.metadata_store, schemaspace_location, name, content)
        test_resources[name] = resource
        test_content[name] = content

    # Add initial entries
    cache = FileMetadataCache.instance(max_size=3, enabled=False)

    assert hasattr(cache, "observer") is False
    assert hasattr(cache, "observed_dirs") is False

    for name in test_items:  # Add the items to the cache
        cache.add_item(test_resources[name], test_content[name])

    assert len(cache) == 0
    assert cache.trims == 0
    assert cache.get_item(test_resources.get("a")) is None
    assert cache.get_item(test_resources.get("b")) is None
    assert cache.get_item(test_resources.get("c")) is None
    assert cache.get_item(test_resources.get("d")) is None
    assert cache.get_item(test_resources.get("e")) is None
    assert cache.misses == 0
    assert cache.hits == 0


def _ensure_single_instance(tests_hierarchy_manager, schemaspace_location, name, expected_count=1):
    """Because updates can trigger the copy of the original, this methods ensures that
    only the named instance (`name`) exists after the operation.  The expected_count
    can be altered so that it can also be used to ensure clean removals.
    """
    if isinstance(tests_hierarchy_manager.metadata_store, FileMetadataStore):
        # Ensure only the actual metadata file exists.  The renamed instance will start with 'name' but have
        # a timestamp appended to it.
        count = 0
        actual = 0
        for f in os.listdir(str(schemaspace_location)):
            if name in f:
                count = count + 1
            if name == f:
                actual = actual + 1
        assert count == expected_count, "Temporarily renamed file was not removed"
        assert actual == expected_count


def _create_schemaspace(store_manager: MetadataStore, schemaspace_location: str):
    """Creates schemaspace in a storage-independent manner"""
    if isinstance(store_manager, FileMetadataStore):
        os.makedirs(schemaspace_location)
    elif isinstance(store_manager, MockMetadataStore):
        instances = store_manager.instances
        if instances is None:
            setattr(store_manager, "instances", dict())


def _remove_schemaspace(store_manager: MetadataStore, schemaspace_location: str):
    """Removes schemaspace in a storage-independent manner"""
    if isinstance(store_manager, FileMetadataStore):
        shutil.rmtree(schemaspace_location)
    elif isinstance(store_manager, MockMetadataStore):
        setattr(store_manager, "instances", None)


def _compose_instance_location(store_manager: MetadataStore, location: str, name: str) -> str:
    """Compose location of the named instance in a storage-independent manner"""
    if isinstance(store_manager, FileMetadataStore):
        location = os.path.join(location, f"{name}.json")
    elif isinstance(store_manager, MockMetadataStore):
        location = None
    return location
