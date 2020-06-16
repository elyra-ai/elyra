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
import copy
import json
import os
import shutil
import pytest

from jsonschema import validate, ValidationError, draft7_format_checker
from elyra.metadata import Metadata, MetadataManager, SchemaManager, METADATA_TEST_NAMESPACE
from .test_utils import valid_metadata_json, invalid_metadata_json, byo_metadata_json, create_json_file, \
    get_schema, invalid_no_display_name_json, valid_display_name_json


os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests namespace

# Test factory schemas.
# Note: should we ever decide to allow folks to bring their own schemas, we'd want to expose this.
schema_schema = {
    "title": "Schema for Elyra schema.",
    "properties": {
        "name": {
            "description": "The name of the schema.",
            "type": "string",
            "pattern": "^[a-z][a-z0-9-_]*[a-z0-9]$"
        },
        "namespace": {
            "description": "The namespace corresponding to the schema and its instances.",
            "type": "string",
            "pattern": "^[a-z][a-z0-9-_]*[a-z0-9]$"
        },
        "properties": {
            "type": "object",
            "propertyNames": {
                "enum": ["schema_name", "display_name", "metadata"]
            },
            "additionalProperties": True
        }
    },
    "required": ["name", "namespace", "properties"]
}


def test_validate_factory_schemas():
    # Test that each of our factory schemas meet the minimum requirements.
    namespace_schemas = SchemaManager.load_namespace_schemas()
    for namespace, schemas in namespace_schemas.items():
        for name, schema in schemas.items():
            print("Validating schema '{namespace}/{name}'...".format(namespace=namespace, name=name))
            validate(instance=schema, schema=schema_schema, format_checker=draft7_format_checker)


# ########################## MetadataManager Tests ###########################
def test_manager_add_invalid(tests_manager, data_dir):

    with pytest.raises(ValueError):
        MetadataManager(namespace='invalid')

    # Attempt with non Metadata instance
    with pytest.raises(TypeError):
        tests_manager.add(valid_metadata_json)

    # and invalid parameters
    with pytest.raises(TypeError):
        tests_manager.add(None, invalid_no_display_name_json)

    with pytest.raises(ValueError):
        tests_manager.add("foo", None)


def test_manager_add_no_name(tests_manager, metadata_tests_dir):
    metadata_name = 'valid_metadata_instance'

    metadata = Metadata(**valid_metadata_json)
    instance = tests_manager.add(None, metadata)

    assert instance is not None
    assert instance.name == metadata_name

    # Ensure file was created
    metadata_file = os.path.join(metadata_tests_dir, '{}.json'.format(metadata_name))
    assert os.path.exists(metadata_file)

    # And finally, remove it.
    tests_manager.remove(metadata_name)
    assert not os.path.exists(metadata_file)


def test_manager_add_display_name(tests_manager, metadata_tests_dir):
    metadata_display_name = '1 teste "rápido"'
    metadata_name = 'a_1_teste_rpido'

    metadata = Metadata(**valid_display_name_json)
    instance = tests_manager.add(None, metadata)

    assert instance is not None
    assert instance.name == metadata_name
    assert instance.display_name == metadata_display_name

    # Ensure file was created
    metadata_file = os.path.join(metadata_tests_dir, '{}.json'.format(metadata_name))
    assert os.path.exists(metadata_file)

    with open(metadata_file, 'r', encoding='utf-8') as f:
        valid_add = json.loads(f.read())
        assert "display_name" in valid_add
        assert valid_add['display_name'] == metadata_display_name

    # And finally, remove it.
    tests_manager.remove(metadata_name)
    assert not os.path.exists(metadata_file)


def test_manager_list_summary(tests_manager):
    metadata_summary_list = tests_manager.get_all_metadata_summary(include_invalid=False)
    assert len(metadata_summary_list) == 2
    metadata_summary_list = tests_manager.get_all_metadata_summary(include_invalid=True)
    assert len(metadata_summary_list) == 3


def test_manager_list_all(tests_manager):
    metadata_list = tests_manager.get_all()
    assert len(metadata_list) == 2
    # Ensure name is getting derived from resource and not from contents
    for metadata in metadata_list:
        if metadata.display_name == "Another Metadata Instance (2)":
            assert metadata.name == "another"
        else:
            assert metadata.name == "valid"


def test_manager_list_summary_none(tests_manager, metadata_tests_dir):
    # Delete the metadata dir contents and attempt listing metadata
    shutil.rmtree(metadata_tests_dir)
    assert tests_manager.namespace_exists() is False
    os.makedirs(metadata_tests_dir)
    assert tests_manager.namespace_exists()

    metadata_summary_list = tests_manager.get_all_metadata_summary()
    assert len(metadata_summary_list) == 0


def test_manager_list_all_none(tests_manager, metadata_tests_dir):
    # Delete the metadata dir contents and attempt listing metadata
    shutil.rmtree(metadata_tests_dir)
    assert tests_manager.namespace_exists() is False
    os.makedirs(metadata_tests_dir)
    assert tests_manager.namespace_exists()

    metadata_list = tests_manager.get_all()
    assert len(metadata_list) == 0


def test_manager_add_remove_valid(tests_manager, metadata_tests_dir):
    metadata_name = 'valid_add_remove'

    # Remove metadata_tests_dir and ensure it gets created with appropriate perms.
    shutil.rmtree(metadata_tests_dir)

    metadata = Metadata(**valid_metadata_json)

    instance = tests_manager.add(metadata_name, metadata)
    assert instance is not None
    dir_mode = oct(os.stat(metadata_tests_dir).st_mode & 0o777777)  # Be sure to include other attributes
    assert dir_mode == "0o40700"  # and ensure this is a directory with only rwx by owner enabled

    # Ensure file was created
    metadata_file = os.path.join(metadata_tests_dir, 'valid_add_remove.json')
    assert os.path.exists(metadata_file)
    file_mode = oct(os.stat(metadata_file).st_mode & 0o777777)  # Be sure to include other attributes
    assert file_mode == "0o100600"  # and ensure this is a regular file with only rw by owner enabled

    with open(metadata_file, 'r', encoding='utf-8') as f:
        valid_add = json.loads(f.read())
        assert "resource" not in valid_add
        assert "name" not in valid_add
        assert "display_name" in valid_add
        assert valid_add['display_name'] == "valid metadata instance"
        assert "schema_name" in valid_add
        assert valid_add['schema_name'] == "metadata-test"

    # Attempt to create again w/o replace, then replace it.
    with pytest.raises(FileExistsError):
        tests_manager.add(metadata_name, metadata)

    instance = tests_manager.add(metadata_name, metadata, replace=True)
    assert instance is not None

    # And finally, remove it.
    tests_manager.remove(metadata_name)
    assert not os.path.exists(metadata_file)


def test_manager_remove_invalid(tests_manager, metadata_tests_dir):
    # Ensure invalid metadata file isn't validated and is removed.
    create_json_file(metadata_tests_dir, 'remove_invalid.json', invalid_metadata_json)
    metadata_name = 'remove_invalid'
    tests_manager.remove(metadata_name)
    metadata_file = os.path.join(metadata_tests_dir, 'remove_invalid.json')
    assert not os.path.exists(metadata_file)


def test_manager_remove_missing(tests_manager):
    # Ensure removal of missing metadata file is handled.
    metadata_name = 'missing'
    with pytest.raises(FileNotFoundError):
        tests_manager.remove(metadata_name)


def test_manager_read_valid_by_name(tests_manager, metadata_tests_dir):
    metadata_name = 'valid'
    some_metadata = tests_manager.get(metadata_name)
    assert some_metadata.name == metadata_name
    assert some_metadata.schema_name == "metadata-test"
    assert str(metadata_tests_dir) in some_metadata.resource


def test_manager_read_invalid_by_name(tests_manager):
    metadata_name = 'invalid'
    with pytest.raises(ValidationError):
        tests_manager.get(metadata_name)


def test_manager_read_missing_by_name(tests_manager):
    metadata_name = 'missing'
    with pytest.raises(FileNotFoundError):
        tests_manager.get(metadata_name)


def test_manager_hierarchy_fetch(tests_hierarchy_manager, factory_dir, shared_dir, metadata_tests_dir):

    # fetch initial instances, only factory data should be present
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure these are all factory instances
    for metadata in metadata_list:
        assert metadata.display_name == "factory"

    byo_3 = tests_hierarchy_manager.get('byo_3')
    assert byo_3.resource.startswith(str(factory_dir))

    # add a shared instance and confirm list count is still the same, but
    # only that instance is present in shared directory...
    byo_instance = byo_metadata_json
    byo_instance['display_name'] = 'shared'
    create_json_file(shared_dir, 'byo_3.json', byo_instance)

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == 'byo_3':
            assert metadata.display_name == "shared"
        else:
            assert metadata.display_name == "factory"

    byo_3 = tests_hierarchy_manager.get('byo_3')
    assert byo_3.resource.startswith(str(shared_dir))

    # add a shared and a user instance confirm list count is still the same, but
    # both the user and shared instances are correct.
    byo_instance = byo_metadata_json
    byo_instance['display_name'] = 'shared'
    create_json_file(shared_dir, 'byo_2.json', byo_instance)
    byo_instance['display_name'] = 'user'
    create_json_file(metadata_tests_dir, 'byo_2.json', byo_instance)

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == 'byo_1':
            assert metadata.display_name == "factory"
        if metadata.name == 'byo_2':
            assert metadata.display_name == "user"
        if metadata.name == 'byo_3':
            assert metadata.display_name == "shared"

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(metadata_tests_dir))

    # delete the user instance and ensure its shared copy is now exposed
    os.remove(os.path.join(metadata_tests_dir, 'byo_2.json'))

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == 'byo_1':
            assert metadata.display_name == "factory"
        if metadata.name == 'byo_2':
            assert metadata.display_name == "shared"
        if metadata.name == 'byo_3':
            assert metadata.display_name == "shared"

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(shared_dir))

    # delete both shared copies and ensure only factory is left
    os.remove(os.path.join(shared_dir, 'byo_2.json'))
    os.remove(os.path.join(shared_dir, 'byo_3.json'))
    # fetch initial instances, only factory data should be present
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure these are all factory instances
    for metadata in metadata_list:
        assert metadata.display_name == "factory"

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(factory_dir))


def test_manager_hierarchy_create(tests_hierarchy_manager, metadata_tests_dir):

    # Note, this is really more of an update test (replace = True), since you cannot "create" an
    # instance if it already exists - which, in this case, it exists in the factory area

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user'
    with pytest.raises(FileExistsError):
        tests_hierarchy_manager.add('byo_2', metadata)

    instance = tests_hierarchy_manager.add('byo_2', metadata, replace=True)
    assert instance is not None
    assert instance.resource.startswith(str(metadata_tests_dir))

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == 'byo_1':
            assert metadata.display_name == "factory"
        if metadata.name == 'byo_2':
            assert metadata.display_name == "user"
        if metadata.name == 'byo_3':
            assert metadata.display_name == "factory"

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(metadata_tests_dir))

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user'
    instance = tests_hierarchy_manager.add('byo_3', metadata, replace=True)
    assert instance is not None
    assert instance.resource.startswith(str(metadata_tests_dir))

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == 'byo_1':
            assert metadata.display_name == "factory"
        if metadata.name == 'byo_2':
            assert metadata.display_name == "user"
        if metadata.name == 'byo_3':
            assert metadata.display_name == "user"

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(metadata_tests_dir))


def test_manager_hierarchy_update(tests_hierarchy_manager, factory_dir, shared_dir, metadata_tests_dir):

    # Create a copy of existing factory instance and ensure its in the user area
    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(factory_dir))

    byo_2.display_name = 'user'
    with pytest.raises(FileExistsError):
        tests_hierarchy_manager.add('byo_2', byo_2)

    # Repeat with replacement enabled
    instance = tests_hierarchy_manager.add('byo_2', byo_2, replace=True)
    assert instance is not None
    assert instance.resource.startswith(str(metadata_tests_dir))

    # now "slip in" a shared instance behind the updated version and ensure
    # the updated version is what's returned.
    byo_instance = byo_metadata_json
    byo_instance['display_name'] = 'shared'
    create_json_file(shared_dir, 'byo_2.json', byo_instance)

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(metadata_tests_dir))

    # now remove the updated instance and ensure the shared instance appears
    tests_hierarchy_manager.remove('byo_2')

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(shared_dir))


def _ensure_single_file(metadata_tests_dir, filename, expected_count=1):
    """Because updates can trigger the copy of the original, this methods ensures that
       only the name file (`filename`) exists after the operation.  The expected_count
       can be altered so that it can also be used to ensure clean removals.
    """
    # Ensure only the actual metadata file exists.  The renamed file will start with 'filename' but have
    # a timestamp appended to it.
    count = 0
    actual = 0
    for f in os.listdir(str(metadata_tests_dir)):
        if filename in f:
            count = count + 1
        if filename == f:
            actual = actual + 1
    assert count == expected_count, "Temporarily renamed file was not removed"
    assert actual == expected_count


def test_manager_update(tests_hierarchy_manager, metadata_tests_dir):

    # Create some metadata, then attempt to update it with a known schema violation
    # and ensure the previous copy still exists...

    # Create a user instance...
    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user1'
    instance = tests_hierarchy_manager.add('update', metadata)
    assert instance is not None
    assert instance.resource.startswith(str(metadata_tests_dir))

    # Now update the user instance - add a field - and ensure that the original renamed file is not present.

    instance2 = tests_hierarchy_manager.get('update')
    instance2.display_name = 'user2'
    instance2.metadata['number_range_test'] = 7
    tests_hierarchy_manager.add('update', instance2, replace=True)

    _ensure_single_file(metadata_tests_dir, "update.json")

    instance2 = tests_hierarchy_manager.get('update')
    assert instance2.display_name == 'user2'
    assert instance2.metadata['number_range_test'] == 7


def test_manager_bad_update(tests_hierarchy_manager, metadata_tests_dir):

    # Create some metadata, then attempt to update it with a known schema violation
    # and ensure the previous copy still exists...

    # Create a user instance...
    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user1'
    instance = tests_hierarchy_manager.add('bad_update', metadata)
    assert instance is not None
    assert instance.resource.startswith(str(metadata_tests_dir))

    # Now, attempt to update the user instance, but include a schema violation.
    # Verify the update failed, but also ensure the previous instance is still there.

    instance2 = tests_hierarchy_manager.get('bad_update')
    instance2.display_name = 'user2'
    instance2.metadata['number_range_test'] = 42  # number is out of range
    with pytest.raises(ValidationError):
        tests_hierarchy_manager.add('bad_update', instance2, replace=True)

    _ensure_single_file(metadata_tests_dir, "bad_update.json")

    instance2 = tests_hierarchy_manager.get('bad_update')
    assert instance2.display_name == instance.display_name
    assert 'number_range_test' not in instance2.metadata

    # Now try update without providing a name, ValueError expected
    instance2 = tests_hierarchy_manager.get('bad_update')
    instance2.display_name = 'user update with no name'
    with pytest.raises(ValueError):
        tests_hierarchy_manager.add(None, instance2, replace=True)

    _ensure_single_file(metadata_tests_dir, "bad_update.json")


def test_manager_hierarchy_remove(tests_hierarchy_manager, factory_dir, shared_dir, metadata_tests_dir):

    # Create additional instances in shared and user areas
    byo_2 = byo_metadata_json
    byo_2['display_name'] = 'shared'
    create_json_file(shared_dir, 'byo_2.json', byo_2)

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user'
    instance = tests_hierarchy_manager.add('byo_2', metadata, replace=True)
    assert instance is not None
    assert instance.resource.startswith(str(metadata_tests_dir))

    # Confirm on in user is found...
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == 'byo_1':
            assert metadata.display_name == "factory"
        if metadata.name == 'byo_2':
            assert metadata.display_name == "user"
        if metadata.name == 'byo_3':
            assert metadata.display_name == "factory"

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(metadata_tests_dir))

    # Now remove instance.  Should be allowed since it resides in user area
    tests_hierarchy_manager.remove('byo_2')
    _ensure_single_file(metadata_tests_dir, "byo_2.json", expected_count=0)

    # Attempt to remove instance from shared area and its protected
    with pytest.raises(PermissionError) as pe:
        tests_hierarchy_manager.remove('byo_2')
    assert "Removal of metadata resource" in str(pe.value)

    # Ensure the one that exists is the one in the shared area
    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(shared_dir))

    # Attempt to remove instance from factory area and its protected as well
    with pytest.raises(PermissionError) as pe:
        tests_hierarchy_manager.remove('byo_1')
    assert "Removal of metadata resource" in str(pe.value)

    byo_1 = tests_hierarchy_manager.get('byo_1')
    assert byo_1.resource.startswith(str(factory_dir))


# ########################## FileMetadataStore Tests ###########################
def test_filestore_list_summary(filestore):
    metadata_summary_list = filestore.get_all_metadata_summary(include_invalid=False)
    assert len(metadata_summary_list) == 2
    metadata_summary_list = filestore.get_all_metadata_summary(include_invalid=True)
    assert len(metadata_summary_list) == 3


def test_filestore_list_all(filestore):
    metadata_list = filestore.get_all()
    assert len(metadata_list) == 2


def test_filestore_list_summary_none(filestore, metadata_tests_dir):
    # Delete the metadata dir contents and attempt listing metadata
    shutil.rmtree(metadata_tests_dir)
    assert filestore.namespace_exists() is False
    os.makedirs(metadata_tests_dir)
    assert filestore.namespace_exists()

    metadata_summary_list = filestore.get_all_metadata_summary(include_invalid=True)
    assert len(metadata_summary_list) == 0


def test_filestore_list_all_none(filestore, metadata_tests_dir):
    # Delete the metadata dir contents and attempt listing metadata
    shutil.rmtree(metadata_tests_dir)
    assert filestore.namespace_exists() is False
    os.makedirs(metadata_tests_dir)
    assert filestore.namespace_exists()

    metadata_list = filestore.get_all()
    assert len(metadata_list) == 0


def test_filestore_read_valid_by_name(filestore):
    metadata_name = 'valid'
    some_metadata = filestore.read(metadata_name)
    assert some_metadata.name == metadata_name


def test_filestore_read_invalid_by_name(filestore):
    metadata_name = 'invalid'
    with pytest.raises(ValidationError):
        filestore.read(metadata_name)


def test_filestore_read_missing_by_name(filestore):
    metadata_name = 'missing'
    with pytest.raises(FileNotFoundError):
        filestore.read(metadata_name)


# ########################## SchemaManager Tests ###########################
def test_schema_manager_all(schema_manager):
    schema_manager.clear_all()

    test_schema_json = get_schema('metadata-test')

    with pytest.raises(ValueError):
        schema_manager.add_schema("foo", "metadata-test", test_schema_json)

    with pytest.raises(ValueError):
        schema_manager.add_schema("bar", "metadata-test", test_schema_json)

    schema_manager.add_schema(METADATA_TEST_NAMESPACE, "metadata-test", test_schema_json)

    test_schema = schema_manager.get_schema(METADATA_TEST_NAMESPACE, "metadata-test")
    assert test_schema is not None
    assert test_schema == test_schema_json

    # extend the schema... add and ensure update exists...
    modified_schema = copy.deepcopy(test_schema)
    modified_schema['properties']['metadata']['properties']['bar'] = {"type": "string", "minLength": 5}

    schema_manager.add_schema(METADATA_TEST_NAMESPACE, "metadata-test", modified_schema)
    bar_schema = schema_manager.get_schema(METADATA_TEST_NAMESPACE, "metadata-test")
    assert bar_schema is not None
    assert bar_schema != test_schema_json
    assert bar_schema == modified_schema

    schema_manager.remove_schema(METADATA_TEST_NAMESPACE, "metadata-test")
    with pytest.raises(FileNotFoundError):
        schema_manager.get_schema(METADATA_TEST_NAMESPACE, "metadata-test")

    schema_manager.clear_all()  # Ensure test schema has been restored
    test_schema = schema_manager.get_schema(METADATA_TEST_NAMESPACE, "metadata-test")
    assert test_schema is not None
    assert test_schema == test_schema_json
