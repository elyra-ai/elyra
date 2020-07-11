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
from elyra.metadata import Metadata, MetadataManager, MetadataStore, FileMetadataStore, SchemaManager, \
    MetadataNotFoundError, MetadataExistsError, SchemaNotFoundError, METADATA_TEST_NAMESPACE
from .test_utils import valid_metadata_json, invalid_metadata_json, byo_metadata_json, create_json_file, \
    create_instance, get_schema, invalid_no_display_name_json, valid_display_name_json, MockMetadataStore


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
def test_manager_add_invalid(tests_manager):

    with pytest.raises(ValueError):
        MetadataManager(namespace='invalid')

    # Attempt with non Metadata instance
    with pytest.raises(TypeError):
        tests_manager.create(valid_metadata_json)

    # and invalid parameters
    with pytest.raises(TypeError):
        tests_manager.create(None, invalid_no_display_name_json)

    with pytest.raises(ValueError):
        tests_manager.create("foo", None)


def test_manager_add_no_name(tests_manager, namespace_location):
    metadata_name = 'valid_metadata_instance'

    metadata = Metadata.from_dict(METADATA_TEST_NAMESPACE, {**valid_metadata_json})
    instance = tests_manager.create(None, metadata)

    assert instance is not None
    assert instance.name == metadata_name

    # Ensure file was created using store_manager
    instance_list = tests_manager.metadata_store.fetch_instances(metadata_name)
    assert len(instance_list) == 1
    instance = Metadata.from_dict(METADATA_TEST_NAMESPACE, instance_list[0])
    metadata_location = _compose_instance_location(tests_manager.metadata_store, namespace_location, metadata_name)
    assert instance.resource == metadata_location
    assert instance.special_property == instance.metadata['required_test']

    # And finally, remove it.
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_add_short_name(tests_manager, namespace_location):
    # Found that single character names were failing validation
    metadata_name = 'a'
    metadata = Metadata(**valid_metadata_json)
    instance = tests_manager.create(metadata_name, metadata)

    assert instance is not None
    assert instance.name == metadata_name

    # Ensure file was created using store_manager
    instance_list = tests_manager.metadata_store.fetch_instances(metadata_name)
    assert len(instance_list) == 1
    instance = Metadata.from_dict(METADATA_TEST_NAMESPACE, instance_list[0])
    metadata_location = _compose_instance_location(tests_manager.metadata_store, namespace_location, metadata_name)
    assert instance.resource == metadata_location

    # And finally, remove it.
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_add_empty_display_name(tests_manager):
    # Found that empty display_name values were passing validation, so minLength=1 was added
    metadata_name = 'empty_display_name'
    metadata = Metadata(**valid_metadata_json)
    metadata.display_name = ''
    with pytest.raises(ValidationError):
        tests_manager.create(metadata_name, metadata)

    # Ensure file was not created using storage manager
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_add_display_name(tests_manager, namespace_location):
    metadata_display_name = '1 teste "rápido"'
    metadata_name = 'a_1_teste_rpido'

    metadata = Metadata(**valid_display_name_json)
    instance = tests_manager.create(None, metadata)

    assert instance is not None
    assert instance.name == metadata_name
    assert instance.display_name == metadata_display_name

    # Ensure file was created using store_manager
    instance_list = tests_manager.metadata_store.fetch_instances(metadata_name)
    assert len(instance_list) == 1
    instance = Metadata.from_dict(METADATA_TEST_NAMESPACE, instance_list[0])
    metadata_location = _compose_instance_location(tests_manager.metadata_store, namespace_location, metadata_name)
    assert instance.resource == metadata_location
    assert instance.display_name == metadata_display_name

    # And finally, remove it.
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_get_include_invalid(tests_manager):
    metadata_list = tests_manager.get_all(include_invalid=False)
    assert len(metadata_list) == 2
    metadata_list = tests_manager.get_all(include_invalid=True)
    assert len(metadata_list) == 4


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


def test_manager_get_none(tests_manager, namespace_location):
    # Delete the namespace contents and attempt listing metadata
    _remove_namespace(tests_manager.metadata_store, namespace_location)
    assert tests_manager.namespace_exists() is False
    _create_namespace(tests_manager.metadata_store, namespace_location)
    assert tests_manager.namespace_exists()

    metadata_list = tests_manager.get_all()
    assert len(metadata_list) == 0


def test_manager_get_all_none(tests_manager, namespace_location):
    # Delete the namespace contents and attempt listing metadata
    _remove_namespace(tests_manager.metadata_store, namespace_location)
    assert tests_manager.namespace_exists() is False
    _create_namespace(tests_manager.metadata_store, namespace_location)
    assert tests_manager.namespace_exists()

    metadata_list = tests_manager.get_all()
    assert len(metadata_list) == 0


def test_manager_add_remove_valid(tests_manager, namespace_location):
    metadata_name = 'valid_add_remove'

    # Remove namespace_location and ensure it gets created
    _remove_namespace(tests_manager.metadata_store, namespace_location)

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


def test_manager_remove_invalid(tests_manager, namespace_location):
    # Ensure invalid metadata file isn't validated and is removed.
    create_instance(tests_manager.metadata_store, namespace_location, 'remove_invalid', invalid_metadata_json)
    metadata_name = 'remove_invalid'
    tests_manager.remove(metadata_name)

    # Verify removal using metadata_store
    with pytest.raises(MetadataNotFoundError):
        tests_manager.metadata_store.fetch_instances(metadata_name)


def test_manager_remove_missing(tests_manager):
    # Ensure removal of missing metadata file is handled.
    metadata_name = 'missing'
    with pytest.raises(MetadataNotFoundError):
        tests_manager.remove(metadata_name)


def test_manager_read_valid_by_name(tests_manager, namespace_location):
    metadata_name = 'valid'
    some_metadata = tests_manager.get(metadata_name)
    assert some_metadata.name == metadata_name
    assert some_metadata.schema_name == "metadata-test"
    metadata_location = _compose_instance_location(tests_manager.metadata_store, namespace_location, metadata_name)
    assert metadata_location == some_metadata.resource


def test_manager_read_invalid_by_name(tests_manager):
    metadata_name = 'invalid'
    with pytest.raises(ValidationError):
        tests_manager.get(metadata_name)


def test_manager_read_missing_by_name(tests_manager):
    metadata_name = 'missing'
    with pytest.raises(MetadataNotFoundError):
        tests_manager.get(metadata_name)


def test_manager_hierarchy_fetch(tests_hierarchy_manager, factory_location, shared_location, namespace_location):

    # fetch initial instances, only factory data should be present
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure these are all factory instances
    for metadata in metadata_list:
        assert metadata.display_name == "factory"

    byo_3 = tests_hierarchy_manager.get('byo_3')
    assert byo_3.resource.startswith(str(factory_location))

    # add a shared instance and confirm list count is still the same, but
    # only that instance is present in shared directory...
    byo_instance = byo_metadata_json
    byo_instance['display_name'] = 'shared'
    create_json_file(shared_location, 'byo_3.json', byo_instance)

    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure the proper instances exist
    for metadata in metadata_list:
        if metadata.name == 'byo_3':
            assert metadata.display_name == "shared"
        else:
            assert metadata.display_name == "factory"

    byo_3 = tests_hierarchy_manager.get('byo_3')
    assert byo_3.resource.startswith(str(shared_location))

    # add a shared and a user instance confirm list count is still the same, but
    # both the user and shared instances are correct.
    byo_instance = byo_metadata_json
    byo_instance['display_name'] = 'shared'
    create_json_file(shared_location, 'byo_2.json', byo_instance)
    byo_instance['display_name'] = 'user'
    create_json_file(namespace_location, 'byo_2.json', byo_instance)

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
    assert byo_2.resource.startswith(str(namespace_location))

    # delete the user instance and ensure its shared copy is now exposed
    tests_hierarchy_manager.metadata_store.delete_instance(byo_2.to_dict())

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
    assert byo_2.resource.startswith(str(shared_location))

    # delete both shared copies and ensure only factory is left
    # Note: because we can only delete user instances via the APIs, this
    # code is metadata_store-sensitive.  If other stores implement this
    # hierachy scheme, similar storage-specific code will be necessary.
    if isinstance(tests_hierarchy_manager.metadata_store, FileMetadataStore):
        os.remove(os.path.join(shared_location, 'byo_2.json'))
        os.remove(os.path.join(shared_location, 'byo_3.json'))

    # fetch initial instances, only factory data should be present
    metadata_list = tests_hierarchy_manager.get_all()
    assert len(metadata_list) == 3
    # Ensure these are all factory instances
    for metadata in metadata_list:
        assert metadata.display_name == "factory"

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(factory_location))


def test_manager_hierarchy_create(tests_hierarchy_manager, namespace_location):

    # Note, this is really more of an update test (replace = True), since you cannot "create" an
    # instance if it already exists - which, in this case, it exists in the factory area

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user'
    with pytest.raises(MetadataExistsError):
        tests_hierarchy_manager.create('byo_2', metadata)

    instance = tests_hierarchy_manager.update('byo_2', metadata)
    assert instance is not None
    assert instance.resource.startswith(str(namespace_location))

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
    assert byo_2.resource.startswith(str(namespace_location))

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user'
    instance = tests_hierarchy_manager.update('byo_3', metadata)
    assert instance is not None
    assert instance.resource.startswith(str(namespace_location))

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
    assert byo_2.resource.startswith(str(namespace_location))


def test_manager_hierarchy_update(tests_hierarchy_manager, factory_location, shared_location, namespace_location):

    # Create a copy of existing factory instance and ensure its in the user area
    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(factory_location))

    byo_2.display_name = 'user'
    with pytest.raises(MetadataExistsError):
        tests_hierarchy_manager.create('byo_2', byo_2)

    # Repeat with replacement enabled
    instance = tests_hierarchy_manager.update('byo_2', byo_2)
    assert instance is not None
    assert instance.resource.startswith(str(namespace_location))

    # now "slip in" a shared instance behind the updated version and ensure
    # the updated version is what's returned.
    byo_instance = byo_metadata_json
    byo_instance['display_name'] = 'shared'
    create_json_file(shared_location, 'byo_2.json', byo_instance)

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(namespace_location))

    # now remove the updated instance and ensure the shared instance appears
    tests_hierarchy_manager.remove('byo_2')

    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(shared_location))


def test_manager_update(tests_hierarchy_manager, namespace_location):

    # Create some metadata, then attempt to update it with a known schema violation
    # and ensure the previous copy still exists...

    # Create a user instance...
    metadata = Metadata.from_dict(METADATA_TEST_NAMESPACE, {**byo_metadata_json})
    metadata.display_name = 'user1'
    instance = tests_hierarchy_manager.create('update', metadata)
    assert instance is not None
    assert instance.resource.startswith(str(namespace_location))
    assert instance.for_update is False
    assert instance.special_property == instance.metadata['required_test']

    # Now update the user instance - add a field - and ensure that the original renamed file is not present.

    instance2 = tests_hierarchy_manager.get('update')
    instance2.display_name = 'user2'
    instance2.metadata['number_range_test'] = 7
    instance = tests_hierarchy_manager.update('update', instance2)
    assert instance.for_update is True
    assert instance.special_property == instance.metadata['required_test']

    _ensure_single_instance(tests_hierarchy_manager, namespace_location, "update.json")

    instance2 = tests_hierarchy_manager.get('update')
    assert instance2.display_name == 'user2'
    assert instance2.metadata['number_range_test'] == 7


def test_manager_bad_update(tests_hierarchy_manager, namespace_location):

    # Create some metadata, then attempt to update it with a known schema violation
    # and ensure the previous copy still exists...

    # Create a user instance...
    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user1'
    instance = tests_hierarchy_manager.create('bad_update', metadata)
    assert instance is not None
    assert instance.resource.startswith(str(namespace_location))

    # Now, attempt to update the user instance, but include a schema violation.
    # Verify the update failed, but also ensure the previous instance is still there.

    instance2 = tests_hierarchy_manager.get('bad_update')
    instance2.display_name = 'user2'
    instance2.metadata['number_range_test'] = 42  # number is out of range
    with pytest.raises(ValidationError):
        tests_hierarchy_manager.update('bad_update', instance2)

    _ensure_single_instance(tests_hierarchy_manager, namespace_location, "bad_update.json")

    instance2 = tests_hierarchy_manager.get('bad_update')
    assert instance2.display_name == instance.display_name
    assert 'number_range_test' not in instance2.metadata

    # Now try update without providing a name, ValueError expected
    instance2 = tests_hierarchy_manager.get('bad_update')
    instance2.display_name = 'user update with no name'
    with pytest.raises(ValueError):
        tests_hierarchy_manager.update(None, instance2)

    _ensure_single_instance(tests_hierarchy_manager, namespace_location, "bad_update.json")


def test_manager_hierarchy_remove(tests_hierarchy_manager, factory_location, shared_location, namespace_location):

    # Create additional instances in shared and user areas
    byo_2 = byo_metadata_json
    byo_2['display_name'] = 'shared'
    create_json_file(shared_location, 'byo_2.json', byo_2)

    metadata = Metadata(**byo_metadata_json)
    metadata.display_name = 'user'
    instance = tests_hierarchy_manager.update('byo_2', metadata)
    assert instance is not None
    assert instance.resource.startswith(str(namespace_location))

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
    assert byo_2.resource.startswith(str(namespace_location))

    # Now remove instance.  Should be allowed since it resides in user area
    tests_hierarchy_manager.remove('byo_2')
    _ensure_single_instance(tests_hierarchy_manager, namespace_location, "byo_2.json", expected_count=0)

    # Attempt to remove instance from shared area and its protected
    with pytest.raises(PermissionError) as pe:
        tests_hierarchy_manager.remove('byo_2')
    assert "Removal of instance 'byo_2'" in str(pe.value)

    # Ensure the one that exists is the one in the shared area
    byo_2 = tests_hierarchy_manager.get('byo_2')
    assert byo_2.resource.startswith(str(shared_location))

    # Attempt to remove instance from factory area and its protected as well
    with pytest.raises(PermissionError) as pe:
        tests_hierarchy_manager.remove('byo_1')
    assert "Removal of instance 'byo_1'" in str(pe.value)

    byo_1 = tests_hierarchy_manager.get('byo_1')
    assert byo_1.resource.startswith(str(factory_location))


# ########################## MetadataStore Tests ###########################
def test_store_namespace(store_manager, namespace_location):
    # Delete the metadata dir contents and attempt listing metadata
    _remove_namespace(store_manager, namespace_location)
    assert store_manager.namespace_exists() is False

    # create some metadata
    store_manager.store_instance('ensure_namespace_exists', Metadata(**valid_metadata_json).prepare_write())
    assert store_manager.namespace_exists()


def test_store_fetch_instances(store_manager):
    instances_list = store_manager.fetch_instances()
    assert len(instances_list) == 3


def test_store_fetch_no_namespace(store_manager, namespace_location):
    # Delete the namespace contents and attempt listing metadata
    _remove_namespace(store_manager, namespace_location)

    instance_list = store_manager.fetch_instances()
    assert len(instance_list) == 0


def test_store_fetch_by_name(store_manager):
    metadata_name = 'valid'
    instance_list = store_manager.fetch_instances(name=metadata_name)
    assert instance_list[0].get('name') == metadata_name


def test_store_fetch_missing(store_manager):
    metadata_name = 'missing'
    with pytest.raises(MetadataNotFoundError):
        store_manager.fetch_instances(name=metadata_name)


def test_store_store_instance(store_manager, namespace_location):

    _remove_namespace(store_manager, namespace_location)  # Remove namespace to test raw creation and confirm perms

    metadata_name = 'persist'
    metadata = Metadata(**valid_metadata_json)
    metadata_dict = metadata.prepare_write()

    instance = store_manager.store_instance(metadata_name, metadata_dict)
    assert instance is not None

    if isinstance(store_manager, FileMetadataStore):
        dir_mode = oct(os.stat(namespace_location).st_mode & 0o777777)  # Be sure to include other attributes
        assert dir_mode == "0o40700"  # and ensure this is a directory with only rwx by owner enabled

        # Ensure file was created
        metadata_file = os.path.join(namespace_location, 'persist.json')
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
    with pytest.raises(MetadataExistsError):
        store_manager.store_instance(metadata_name, metadata.prepare_write())

    metadata.metadata['number_range_test'] = 10
    instance = store_manager.store_instance(metadata_name, metadata.prepare_write(), for_update=True)
    assert instance is not None
    assert instance.get('metadata')['number_range_test'] == 10


def test_store_delete_instance(store_manager, namespace_location):
    metadata_name = 'valid'
    instance_list = store_manager.fetch_instances(name=metadata_name)
    metadata = instance_list[0]
    store_manager.delete_instance(metadata)

    with pytest.raises(MetadataNotFoundError):
        store_manager.fetch_instances(name=metadata_name)

    if isinstance(store_manager, FileMetadataStore):
        # Ensure file was physically deleted
        metadata_file = os.path.join(namespace_location, 'valid.json')
        assert not os.path.exists(metadata_file)


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
    with pytest.raises(SchemaNotFoundError):
        schema_manager.get_schema(METADATA_TEST_NAMESPACE, "metadata-test")

    schema_manager.clear_all()  # Ensure test schema has been restored
    test_schema = schema_manager.get_schema(METADATA_TEST_NAMESPACE, "metadata-test")
    assert test_schema is not None
    assert test_schema == test_schema_json


# ########################## Error Tests ###########################
def test_error_metadata_not_found():
    namespace = METADATA_TEST_NAMESPACE
    resource = 'missing_metadata'
    try:
        raise MetadataNotFoundError(namespace, resource)
    except MetadataNotFoundError as mnfe:
        assert str(mnfe) == "No such instance named '{}' was found in the {} namespace.".format(resource, namespace)


def test_error_metadata_exists():
    namespace = METADATA_TEST_NAMESPACE
    resource = 'existing_metadata'
    try:
        raise MetadataExistsError(namespace, resource)
    except MetadataExistsError as mee:
        assert str(mee) == "An instance named '{}' already exists in the {} namespace.".format(resource, namespace)


def test_error_schema_not_found():
    namespace = METADATA_TEST_NAMESPACE
    resource = 'missing_schema'
    try:
        raise SchemaNotFoundError(namespace, resource)
    except SchemaNotFoundError as snfe:
        assert str(snfe) == "No such schema named '{}' was found in the {} namespace.".format(resource, namespace)


def _ensure_single_instance(tests_hierarchy_manager, namespace_location, name, expected_count=1):
    """Because updates can trigger the copy of the original, this methods ensures that
       only the named instance (`name`) exists after the operation.  The expected_count
       can be altered so that it can also be used to ensure clean removals.
    """
    if isinstance(tests_hierarchy_manager.metadata_store, FileMetadataStore):
        # Ensure only the actual metadata file exists.  The renamed instance will start with 'name' but have
        # a timestamp appended to it.
        count = 0
        actual = 0
        for f in os.listdir(str(namespace_location)):
            if name in f:
                count = count + 1
            if name == f:
                actual = actual + 1
        assert count == expected_count, "Temporarily renamed file was not removed"
        assert actual == expected_count


def _create_namespace(store_manager: MetadataStore, namespace_location: str):
    """Creates namespace in a storage-independent manner"""
    if isinstance(store_manager, FileMetadataStore):
        os.makedirs(namespace_location)
    elif isinstance(store_manager, MockMetadataStore):
        instances = getattr(store_manager, 'instances')
        if instances is None:
            setattr(store_manager, 'instances', dict())


def _remove_namespace(store_manager: MetadataStore, namespace_location: str):
    """Removes namespace in a storage-independent manner"""
    if isinstance(store_manager, FileMetadataStore):
        shutil.rmtree(namespace_location)
    elif isinstance(store_manager, MockMetadataStore):
        setattr(store_manager, 'instances', None)


def _compose_instance_location(store_manager: MetadataStore, location: str, name: str) -> str:
    """Compose location of the named instance in a storage-independent manner"""
    if isinstance(store_manager, FileMetadataStore):
        location = os.path.join(location, '{}.json'.format(name))
    elif isinstance(store_manager, MockMetadataStore):
        location = None
    return location
