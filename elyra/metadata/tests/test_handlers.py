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
import json
import os
import shutil

from jupyter_server.tests.utils import expected_http_error
from jupyter_server.utils import url_path_join
import pytest
from tornado.httpclient import HTTPClientError

from elyra.metadata.schema import METADATA_TEST_NAMESPACE
from elyra.metadata.tests.test_utils import byo_metadata_json
from elyra.metadata.tests.test_utils import create_json_file
from elyra.metadata.tests.test_utils import get_instance
from elyra.metadata.tests.test_utils import invalid_metadata_json
from elyra.metadata.tests.test_utils import valid_metadata_json

os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests namespace


async def test_bogus_namespace(jp_fetch, bogus_location):
    # Validate missing is not found.  Remove the bogus location to ensure its not created
    shutil.rmtree(bogus_location)
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', 'bogus', 'missing')

    assert expected_http_error(e, 400)
    assert not os.path.exists(bogus_location)


async def test_missing_instance(jp_fetch, setup_data):
    # Validate missing is not found
    name = 'missing'
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, name)
    assert expected_http_error(e, 404)


async def test_invalid_instance(jp_fetch, setup_data):
    # Validate invalid throws 404 with validation message
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'invalid')
    assert expected_http_error(e, 400)


async def test_valid_instance(jp_fetch, setup_data):
    # Ensure valid metadata can be found
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid')

    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert 'schema_name' in metadata
    assert metadata['display_name'] == 'valid metadata instance'


async def test_get_instances(jp_fetch, setup_data):
    # Ensure all valid metadata can be found
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE)
    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert isinstance(metadata, dict)
    assert len(metadata) == 1
    instances = metadata[METADATA_TEST_NAMESPACE]
    assert len(instances) == 2
    assert isinstance(instances, list)
    assert get_instance(instances, 'name', 'another')
    assert get_instance(instances, 'name', 'valid')


async def test_get_empty_namespace_instances(jp_fetch, namespace_location, setup_data):
    # Delete the metadata dir contents and attempt listing metadata
    shutil.rmtree(namespace_location)
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE)
    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert isinstance(metadata, dict)
    assert len(metadata) == 1
    instances = metadata[METADATA_TEST_NAMESPACE]
    assert len(instances) == 0

    # Now create empty namespace
    os.makedirs(namespace_location)
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE)
    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert isinstance(metadata, dict)
    assert len(metadata) == 1
    instances = metadata[METADATA_TEST_NAMESPACE]
    assert len(instances) == 0


async def test_get_hierarchy_instances(jp_fetch, setup_hierarchy):
    # Ensure all valid metadata can be found
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE)
    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert isinstance(metadata, dict)
    assert len(metadata) == 1
    instances = metadata[METADATA_TEST_NAMESPACE]
    assert len(instances) == 3
    assert isinstance(instances, list)
    assert get_instance(instances, 'name', 'byo_1')
    assert get_instance(instances, 'name', 'byo_2')
    assert get_instance(instances, 'name', 'byo_3')
    byo_3 = get_instance(instances, 'name', 'byo_3')
    assert byo_3['display_name'] == 'factory'


async def test_create_instance(jp_base_url, jp_fetch):
    """Create a simple instance - not conflicting with factory instances. """

    valid = copy.deepcopy(valid_metadata_json)
    valid['name'] = 'valid'
    body = json.dumps(valid)

    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body, method='POST')
    assert r.code == 201
    assert r.headers.get('Location') == url_path_join(jp_base_url, '/elyra', 'metadata',
                                                      METADATA_TEST_NAMESPACE, 'valid')
    metadata = json.loads(r.body.decode())
    # Add expected "extra" fields to 'valid' so whole-object comparison is satisfied.
    # These are added during the pre_save() hook on the MockMetadataTest class instance
    # or when default values for missing properties are applied.
    valid['for_update'] = False
    valid['special_property'] = valid['metadata']['required_test']
    valid['metadata']['number_default_test'] = 42
    assert metadata == valid


async def test_create_hierarchy_instance(jp_fetch, setup_hierarchy):
    """Attempts to create an instance from one in the hierarchy. """

    byo_instance = copy.deepcopy(byo_metadata_json)
    byo_instance['display_name'] = 'user'
    byo_instance['name'] = 'byo_2'
    body = json.dumps(byo_instance)

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body, method='POST')
    assert expected_http_error(e, 409)

    # Confirm the instance was not changed
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE)
    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert isinstance(metadata, dict)
    assert len(metadata) == 1
    instances = metadata[METADATA_TEST_NAMESPACE]
    assert len(instances) == 3
    assert isinstance(instances, list)
    byo_2 = get_instance(instances, 'name', 'byo_2')
    assert byo_2['display_name'] == 'factory'


async def test_create_invalid_instance(jp_fetch):
    """Create a simple instance - not conflicting with factory instances. """

    invalid = copy.deepcopy(invalid_metadata_json)
    invalid['name'] = 'invalid'
    body = json.dumps(invalid)

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body, method='POST')
    assert expected_http_error(e, 400)


async def test_create_instance_missing_schema(jp_fetch, namespace_location):
    """Attempt to create an instance using an invalid schema """

    missing_schema = copy.deepcopy(valid_metadata_json)
    missing_schema['name'] = 'missing_schema'
    missing_schema['schema_name'] = 'missing_schema'
    missing_schema.pop('display_name')
    body = json.dumps(missing_schema)

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body, method='POST')
    assert expected_http_error(e, 404)

    # Ensure instance was not created.  Can't use REST here since it will correctly trigger 404
    # even though an instance was created and not removed due to failure to validate (due to
    # missing schema).  Fixed by trapping the FileNotFoundError raised due to no schema.
    assert not os.path.exists(os.path.join(namespace_location, 'missing_schema.json'))

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'missing_schema')
    assert expected_http_error(e, 404)


async def test_update_non_existent(jp_fetch, namespace_location):
    """Attempt to update a non-existent instance. """

    # Try to update a non-existent instance - 404 expected...
    valid = copy.deepcopy(valid_metadata_json)
    valid['name'] = 'valid'
    valid['metadata']['number_range_test'] = 7
    body = json.dumps(valid)

    # Update (non-existent) instance
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid', body=body, method='PUT')
    assert expected_http_error(e, 404)


async def test_update_instance(jp_fetch, namespace_location):
    """Update a simple instance. """

    # Create an instance, then update
    create_json_file(namespace_location, 'valid.json', valid_metadata_json)
    valid = copy.deepcopy(valid_metadata_json)
    valid['name'] = 'valid'
    valid['metadata']['number_range_test'] = 7
    body = json.dumps(valid)

    # Update instance
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid', body=body, method='PUT')
    assert r.code == 200
    instance = json.loads(r.body.decode())
    assert instance['metadata']['number_range_test'] == 7

    # Confirm update via jp_fetch
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid')
    assert r.code == 200
    instance = json.loads(r.body.decode())
    assert instance['metadata']['number_range_test'] == 7


async def test_invalid_update(jp_fetch, namespace_location):
    """Update a simple instance with invalid metadata. """

    # Create an instance, then update with invalid metadata
    create_json_file(namespace_location, 'update_bad_md.json', valid_metadata_json)

    # Fetch it to get the valid instance
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'update_bad_md')
    assert r.code == 200
    instance = json.loads(r.body.decode())

    # Now attempt the update with bad metadata and ensure previous still exists
    valid2 = copy.deepcopy(valid_metadata_json)
    valid2['name'] = 'valid'
    valid2['metadata']['number_range_test'] = 42
    body2 = json.dumps(valid2)

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'update_bad_md', body=body2, method='PUT')
    assert expected_http_error(e, 400)

    # Fetch again and ensure it matches the previous instance
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'update_bad_md')
    assert r.code == 200
    instance2 = json.loads(r.body.decode())
    assert instance2 == instance


async def test_update_fields(jp_fetch, namespace_location):

    # Create an instance, then update with a new field
    create_json_file(namespace_location, 'update_fields.json', valid_metadata_json)
    valid = copy.deepcopy(valid_metadata_json)
    valid['metadata']['number_range_test'] = 7
    body = json.dumps(valid)

    # Update instance adding number_range_test
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'update_fields', body=body, method='PUT')
    assert r.code == 200
    instance = json.loads(r.body.decode())
    assert instance['metadata']['number_range_test'] == 7

    # Add a new field (per schema) and remove another -
    valid['metadata'].pop('number_range_test')
    valid['metadata']['string_length_test'] = "valid len"
    body = json.dumps(valid)

    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'update_fields', body=body, method='PUT')
    assert r.code == 200
    instance = json.loads(r.body.decode())
    assert instance['metadata']['string_length_test'] == "valid len"
    assert 'number_range_test' not in instance['metadata']


async def test_update_hierarchy_instance(jp_fetch, setup_hierarchy):
    """Update a simple instance - that's conflicting with factory instances. """

    # Do not name intentionally, since this is an update
    byo_instance = copy.deepcopy(byo_metadata_json)
    byo_instance['display_name'] = 'user'
    byo_instance['metadata']['number_range_test'] = 7
    body = json.dumps(byo_instance)

    # Because this is considered an update, replacement is enabled.
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2', body=body, method='PUT')
    assert r.code == 200

    # Confirm the instances and ensure byo_2 is in USER area
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE)
    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert isinstance(metadata, dict)
    assert len(metadata) == 1
    instances = metadata[METADATA_TEST_NAMESPACE]
    assert len(instances) == 3
    assert isinstance(instances, list)
    byo_2 = get_instance(instances, 'name', 'byo_2')
    assert byo_2['schema_name'] == byo_metadata_json['schema_name']
    assert byo_2['metadata']['number_range_test'] == 7

    # Attempt to rename the resource, exception expected.
    byo_2['name'] = 'byo_2_renamed'
    body = json.dumps(byo_2)

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2', body=body, method='PUT')
    assert expected_http_error(e, 400)

    # Confirm no update occurred
    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2')
    assert r.code == 200
    instance = json.loads(r.body.decode())
    assert instance['name'] == 'byo_2'


async def test_delete_instance(jp_fetch, namespace_location, setup_data):
    """Create a simple instance - not conflicting with factory instances and delete it. """

    # First, attempt to delete non-existent resource, exception expected.
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'missing', method='DELETE')
    assert expected_http_error(e, 404)

    create_json_file(namespace_location, 'valid.json', valid_metadata_json)

    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid', method='DELETE')
    assert r.code == 204

    # Confirm deletion
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid', method='DELETE')
    assert expected_http_error(e, 404)


async def test_delete_hierarchy_instance(jp_fetch, namespace_location, setup_hierarchy):
    """Create a simple instance - that conflicts with factory instances and delete it only if local. """

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2', method='DELETE')
    assert expected_http_error(e, 403)

    # create local instance, delete should succeed
    create_json_file(namespace_location, 'byo_2.json', byo_metadata_json)

    r = await jp_fetch('elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2', method='DELETE')
    assert r.code == 204


async def test_bogus_schema(jp_fetch):
    # Validate missing is not found

    # Remove self.request (and other 'self.' prefixes) once transition to jupyter_server occurs
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'schema', 'bogus')
    assert expected_http_error(e, 404)


async def test_missing_runtimes_schema(jp_fetch):
    # Validate missing is not found
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'schema', 'runtimes', 'missing')
    assert expected_http_error(e, 404)


async def test_get_runtimes_schemas(jp_fetch):
    # Ensure all schema for runtimes can be found
    await _get_namespace_schemas(jp_fetch, 'runtimes', ['kfp', 'airflow'])


async def test_get_code_snippets_schemas(jp_fetch):
    # Ensure all schema for code-snippets can be found
    await _get_namespace_schemas(jp_fetch, 'code-snippets', ['code-snippet'])


async def test_get_test_schemas(jp_fetch):
    # Ensure all schema for metadata_tests can be found
    await _get_namespace_schemas(jp_fetch, METADATA_TEST_NAMESPACE, ['metadata-test', 'metadata-test2'])


async def test_get_runtimes_schema(jp_fetch):
    # Ensure all schema for runtimes can be found
    await _get_namespace_schema(jp_fetch, 'runtimes', 'kfp')


async def test_get_code_snippets_schema(jp_fetch):
    # Ensure all schema for code-snippets can be found
    await _get_namespace_schema(jp_fetch, 'code-snippets', 'code-snippet')


async def test_get_test_schema(jp_fetch):
    # Ensure all schema for code-snippets can be found
    await _get_namespace_schema(jp_fetch, METADATA_TEST_NAMESPACE, 'metadata-test')


async def _get_namespace_schemas(jp_fetch, namespace, expected):
    r = await jp_fetch('elyra', 'schema', namespace,)
    assert r.code == 200
    namespace_schemas = json.loads(r.body.decode())
    assert isinstance(namespace_schemas, dict)
    assert len(namespace_schemas) == 1
    schemas = namespace_schemas[namespace]
    assert len(schemas) == len(expected)
    for expected_schema in expected:
        assert get_instance(schemas, 'name', expected_schema)


async def _get_namespace_schema(jp_fetch, namespace, expected):
    r = await jp_fetch('elyra', 'schema', namespace, expected)
    assert r.code == 200
    namespace_schema = json.loads(r.body.decode())
    assert isinstance(namespace_schema, dict)
    assert expected == namespace_schema['name']
    assert namespace == namespace_schema['namespace']


async def test_get_namespaces(jp_fetch):
    expected_namespaces = ['runtimes', 'code-snippets']

    r = await jp_fetch('elyra', 'namespace')
    assert r.code == 200
    namespaces = json.loads(r.body.decode('utf-8'))
    assert isinstance(namespaces, dict)
    assert len(namespaces['namespaces']) >= len(expected_namespaces)

    for expected_namespace in expected_namespaces:
        assert expected_namespace in namespaces['namespaces']
