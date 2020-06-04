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
import jupyter_core.paths
import os
import pytest
import shutil
import sys

from traitlets.config import Config
from notebook.tests.launchnotebook import NotebookTestBase

from ..metadata import METADATA_TEST_NAMESPACE
from .test_utils import valid_metadata_json, invalid_metadata_json, another_metadata_json, byo_metadata_json, \
    create_json_file, get_instance
from .conftest import fetch  # FIXME - remove once jupyter_server is used


os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests namespace


class MetadataTestBase(NotebookTestBase):
    """Base class to override environment patch.  Note that because the notebook doesn't
       enable proper subclassing patching, we need to override the method completely.
    """
    @classmethod
    def get_patch_env(cls):
        return {
            'HOME': cls.home_dir,
            'PYTHONPATH': os.pathsep.join(sys.path),
            'IPYTHONDIR': os.path.join(cls.home_dir, '.ipython'),
            'JUPYTER_NO_CONFIG': '1',  # needed in the future
            'JUPYTER_CONFIG_DIR': cls.config_dir,
            'JUPYTER_DATA_DIR': cls.data_dir,
            'JUPYTER_RUNTIME_DIR': cls.runtime_dir,
            'METADATA_TESTING': '1',
        }


class MetadataHandlerTest(MetadataTestBase):
    """Test Metadata REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}})

    def setUp(self):
        # The _dir names here are fixtures that should be referenced by the appropriate
        # test methods once transition to jupyter_server occurs.
        self.metadata_tests_dir = os.path.join(self.data_dir, 'metadata', METADATA_TEST_NAMESPACE)
        self.metadata_bogus_dir = os.path.join(self.data_dir, 'metadata', 'bogus')

        create_json_file(self.metadata_tests_dir, 'valid.json', valid_metadata_json)
        create_json_file(self.metadata_tests_dir, 'another.json', another_metadata_json)
        create_json_file(self.metadata_tests_dir, 'invalid.json', invalid_metadata_json)

    def test_bogus_namespace(self):
        # Validate missing is not found

        # Remove self.request (and other 'self.' prefixes) once transition to jupyter_server occurs
        r = fetch(self.request, 'elyra', 'metadata', 'bogus', 'missing',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Namespace 'bogus' is not in the list of valid namespaces:" in r.text
        assert not os.path.exists(self.metadata_bogus_dir)

    def test_missing_instance(self):
        # Validate missing is not found
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'missing',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Metadata 'missing' in namespace '{}' was not found!".format(METADATA_TEST_NAMESPACE) in r.text

    def test_invalid_instance(self):
        # Validate invalid throws 404 with validation message
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'invalid',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Schema validation failed for metadata 'invalid'" in r.text

    def test_valid_instance(self):
        # Ensure valid metadata can be found
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid',
                  base_url=self.base_url(), headers=self.auth_headers())

        assert r.status_code == 200
        metadata = r.json()
        assert 'schema_name' in metadata
        assert metadata['display_name'] == 'valid metadata instance'

    def test_get_instances(self):
        # Ensure all valid metadata can be found
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
        assert isinstance(metadata, dict)
        assert len(metadata) == 1
        instances = metadata[METADATA_TEST_NAMESPACE]
        assert len(instances) == 2
        assert isinstance(instances, list)
        assert get_instance(instances, 'name', 'another')
        assert get_instance(instances, 'name', 'valid')

    def test_get_empty_namespace_instances(self):
        # Delete the metadata dir contents and attempt listing metadata
        shutil.rmtree(self.metadata_tests_dir)
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Metadata namespace '{}' was not found!".format(METADATA_TEST_NAMESPACE) in r.text

        # Now create empty namespace
        os.makedirs(self.metadata_tests_dir)
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
        assert isinstance(metadata, dict)
        assert len(metadata) == 1
        instances = metadata[METADATA_TEST_NAMESPACE]
        assert len(instances) == 0


@pytest.mark.usefixtures("environ")
class MetadataHandlerHierarchyTest(MetadataTestBase):
    """Test Metadata REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}})

    def setUp(self):
        # The _dir names here are fixtures that should be referenced by the appropriate
        # test methods once transition to jupyter_server occurs.
        self.metadata_tests_dir = os.path.join(jupyter_core.paths.jupyter_data_dir(),
                                               'metadata', METADATA_TEST_NAMESPACE)

        env_path = getattr(jupyter_core.paths, 'ENV_JUPYTER_PATH')
        self.factory_dir = os.path.join(env_path[0], 'metadata', METADATA_TEST_NAMESPACE)

        system_path = getattr(jupyter_core.paths, 'SYSTEM_JUPYTER_PATH')
        self.shared_dir = os.path.join(system_path[0], 'metadata', METADATA_TEST_NAMESPACE)

        byo_instance = byo_metadata_json.copy()
        byo_instance['display_name'] = 'factory'
        create_json_file(self.factory_dir, 'byo_1.json', byo_instance)
        create_json_file(self.factory_dir, 'byo_2.json', byo_instance)
        create_json_file(self.factory_dir, 'byo_3.json', byo_instance)

    def test_get_hierarchy_instances(self):
        # Ensure all valid metadata can be found
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
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

    def test_create_instance(self):
        """Create a simple instance - not conflicting with factory instances. """

        valid = valid_metadata_json.copy()
        valid['name'] = 'valid'
        body = json.dumps(valid)

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body,
                  method='POST', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 201
        assert r.headers.get('location') == r.request.path_url + '/valid'
        metadata = r.json()
        assert metadata == valid

    def test_create_hierarchy_instance(self):
        """Attempts to create an instance from one in the hierarchy. """

        byo_instance = byo_metadata_json.copy()
        byo_instance['display_name'] = 'user'
        byo_instance['name'] = 'byo_2'
        body = json.dumps(byo_instance)

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body,
                  method='POST', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 409
        assert "already exists" in r.text

        # Confirm the instance was not changed
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
        assert isinstance(metadata, dict)
        assert len(metadata) == 1
        instances = metadata[METADATA_TEST_NAMESPACE]
        assert len(instances) == 3
        assert isinstance(instances, list)
        byo_2 = get_instance(instances, 'name', 'byo_2')
        assert byo_2['display_name'] == 'factory'

    def test_create_invalid_instance(self):
        """Create a simple instance - not conflicting with factory instances. """

        invalid = invalid_metadata_json.copy()
        invalid['name'] = 'invalid'
        body = json.dumps(invalid)

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body,
                  method='POST', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 400
        assert "Schema validation failed for metadata" in r.text

    def test_create_instance_missing_schema(self):
        """Attempt to create an instance using an invalid schema """

        missing_schema = valid_metadata_json.copy()
        missing_schema['name'] = 'missing_schema'
        missing_schema['schema_name'] = 'missing_schema'
        missing_schema.pop('display_name')
        body = json.dumps(missing_schema)

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, body=body,
                  method='POST', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404

        # Ensure instance was not created.  Can't use REST here since it will correctly trigger 404
        # even though an instance was created and not removed due to failure to validate (due to
        # missing schema).  Fixed by trapping the FileNotFoundError raised due to no schema.
        assert not os.path.exists(os.path.join(self.metadata_tests_dir, 'missing_schema.json'))

    def test_update_instance(self):
        """Update a simple instance. """

        # First, try to update a non-existent instance - 404 expected...
        valid = valid_metadata_json.copy()
        valid['name'] = 'valid'
        valid['metadata']['number_range_test'] = 7
        body = json.dumps(valid)

        # Update instance
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid', body=body,
                  method='PUT', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404

        # Now create an instance, then re-attempt the update
        create_json_file(self.metadata_tests_dir, 'valid.json', valid_metadata_json)

        # Update instance
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid', body=body,
                  method='PUT', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        instance = r.json()
        assert instance['metadata']['number_range_test'] == 7

        # Confirm update via fetch
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        instance = r.json()
        assert instance['metadata']['number_range_test'] == 7

    def test_update_hierarchy_instance(self):
        """Update a simple instance - that's conflicting with factory instances. """

        # Do not provide schema_name (or name) intentionally, since this is an update
        byo_instance = byo_metadata_json.copy()
        byo_instance.pop('schema_name')
        byo_instance['display_name'] = 'user'
        byo_instance['metadata']['number_range_test'] = 7
        body = json.dumps(byo_instance)

        # Because this is considered an update, replacement is enabled.
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2', body=body,
                  method='PUT', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200

        # Confirm the instances and ensure byo_2 is in USER area
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
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

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2', body=body,
                  method='PUT', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 400
        assert "The attempt to rename instance" in r.text

        # Confirm no update occurred
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        instance = r.json()
        assert instance['name'] == 'byo_2'

    def test_delete_instance(self):
        """Create a simple instance - not conflicting with factory instances and delete it. """

        # First, attempt to delete non-existent resource, exception expected.
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'missing',
                  method='DELETE', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404

        create_json_file(self.metadata_tests_dir, 'valid.json', valid_metadata_json)

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid',
                  method='DELETE', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 204
        assert len(r.text) == 0

        # Confirm deletion
        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'valid',
                  method='DELETE', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404

    def test_delete_hierarchy_instance(self):
        """Create a simple instance - that conflicts with factory instances and delete it only if local. """

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2',
                  method='DELETE', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 403

        # create local instance, delete should succeed
        create_json_file(self.metadata_tests_dir, 'byo_2.json', byo_metadata_json)

        r = fetch(self.request, 'elyra', 'metadata', METADATA_TEST_NAMESPACE, 'byo_2',
                  method='DELETE', base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 204
        assert len(r.text) == 0


class SchemaHandlerTest(MetadataTestBase):
    """Test Schema REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}})

    def test_bogus_namespace(self):
        # Validate missing is not found

        # Remove self.request (and other 'self.' prefixes) once transition to jupyter_server occurs
        r = fetch(self.request, 'elyra', 'schema', 'bogus',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Namespace 'bogus' is not in the list of valid namespaces:" in r.text

    def test_missing_runtimes_schema(self):
        # Validate missing is not found
        r = fetch(self.request, 'elyra', 'schema', 'runtimes', 'missing',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Schema 'missing' in namespace 'runtimes' was not found!" in r.text

    def test_get_runtimes_schemas(self):
        # Ensure all schema for runtimes can be found
        self._get_namespace_schemas('runtimes', ['kfp'])

    def test_get_code_snippets_schemas(self):
        # Ensure all schema for code-snippets can be found
        self._get_namespace_schemas('code-snippets', ['code-snippet'])

    def test_get_test_schemas(self):
        # Ensure all schema for code-snippets can be found
        self._get_namespace_schemas(METADATA_TEST_NAMESPACE, ['metadata-test'])

    def test_get_runtimes_schema(self):
        # Ensure all schema for runtimes can be found
        self._get_namespace_schema('runtimes', 'kfp')

    def test_get_code_snippets_schema(self):
        # Ensure all schema for code-snippets can be found
        self._get_namespace_schema('code-snippets', 'code-snippet')

    def test_get_test_schema(self):
        # Ensure all schema for code-snippets can be found
        self._get_namespace_schema(METADATA_TEST_NAMESPACE, 'metadata-test')

    def _get_namespace_schemas(self, namespace, expected):
        r = fetch(self.request, 'elyra', 'schema', namespace,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        namespace_schemas = r.json()
        assert isinstance(namespace_schemas, dict)
        assert len(namespace_schemas) == 1
        schemas = namespace_schemas[namespace]
        assert len(schemas) == len(expected)
        for expected_schema in expected:
            assert get_instance(schemas, 'name', expected_schema)

    def _get_namespace_schema(self, namespace, expected):
        r = fetch(self.request, 'elyra', 'schema', namespace, expected,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        namespace_schema = r.json()
        assert isinstance(namespace_schema, dict)
        assert expected == namespace_schema['name']
        assert namespace == namespace_schema['namespace']


class NamespaceHandlerTest(MetadataTestBase):
    """Test Namespace REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}})

    def test_get_namespaces(self):
        expected_namespaces = ['runtimes', 'code-snippets']

        r = fetch(self.request, 'elyra', 'namespace',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        namespaces = r.json()
        assert isinstance(namespaces, dict)
        assert len(namespaces['namespaces']) >= len(expected_namespaces)

        for expected_namespace in expected_namespaces:
            assert expected_namespace in namespaces['namespaces']
