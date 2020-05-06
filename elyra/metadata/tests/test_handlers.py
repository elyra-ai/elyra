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
import os
import shutil

from traitlets.config import Config
from notebook.tests.launchnotebook import NotebookTestBase

from .test_utils import valid_metadata_json, invalid_metadata_json, another_metadata_json, create_json_file
from .conftest import fetch  # FIXME - remove once jupyter_server is used


class MetadataHandlerTest(NotebookTestBase):
    """Test Metadata REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}})

    def setUp(self):
        # The _dir names here are fixtures that should be referenced by the appropriate
        # test methods once transition to jupyter_server occurs.
        self.metadata_namespace_dir = os.path.join(self.data_dir, 'metadata', 'elyra-metadata-tests')
        self.metadata_bogus_dir = os.path.join(self.data_dir, 'metadata', 'bogus')

        create_json_file(self.metadata_namespace_dir, 'valid.json', valid_metadata_json)
        create_json_file(self.metadata_namespace_dir, 'another.json', another_metadata_json)
        create_json_file(self.metadata_namespace_dir, 'invalid.json', invalid_metadata_json)

    def test_bogus_namespace(self):
        # Validate missing is not found

        # Remove self.request (and other 'self.' prefixes) once transition to jupyter_server occurs
        r = fetch(self.request, 'api', 'metadata', 'bogus', 'missing',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Namespace 'bogus' is not in the list of valid namespaces:" in r.text
        assert not os.path.exists(self.metadata_bogus_dir)

    def test_missing_instance(self):
        # Validate missing is not found
        r = fetch(self.request, 'api', 'metadata', 'elyra-metadata-tests', 'missing',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Metadata 'missing' in namespace 'elyra-metadata-tests' was not found!" in r.text

    def test_invalid_instance(self):
        # Validate invalid throws 404 with validation message
        r = fetch(self.request, 'api', 'metadata', 'elyra-metadata-tests', 'invalid',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Schema validation failed for metadata 'invalid'" in r.text

    def test_valid_instance(self):
        # Ensure valid metadata can be found
        r = fetch(self.request, 'api', 'metadata', 'elyra-metadata-tests', 'valid',
                  base_url=self.base_url(), headers=self.auth_headers())

        assert r.status_code == 200
        metadata = r.json()
        assert 'schema_name' in metadata
        assert metadata['display_name'] == 'valid metadata instance'

    def test_get_instances(self):
        # Ensure all valid metadata can be found
        r = fetch(self.request, 'api', 'metadata', 'elyra-metadata-tests',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
        assert isinstance(metadata, dict)
        assert len(metadata) == 1
        instances = metadata['elyra-metadata-tests']
        assert len(instances) == 2
        assert 'another' in instances.keys()
        assert 'valid' in instances.keys()

    def test_get_empty_namespace_instances(self):
        # Delete the metadata dir contents and attempt listing metadata
        shutil.rmtree(self.metadata_namespace_dir)
        r = fetch(self.request, 'api', 'metadata', 'elyra-metadata-tests',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Metadata namespace 'elyra-metadata-tests' was not found!" in r.text

        # Now create empty namespace
        os.makedirs(self.metadata_namespace_dir)
        r = fetch(self.request, 'api', 'metadata', 'elyra-metadata-tests',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
        assert isinstance(metadata, dict)
        assert len(metadata) == 1
        instances = metadata['elyra-metadata-tests']
        assert len(instances) == 0


class SchemaHandlerTest(NotebookTestBase):
    """Test Metadata REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}})

    def test_bogus_namespace(self):
        # Validate missing is not found

        # Remove self.request (and other 'self.' prefixes) once transition to jupyter_server occurs
        r = fetch(self.request, 'api', 'metadata_schema', 'bogus',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Namespace 'bogus' is not in the list of valid namespaces:" in r.text

    def test_missing_runtimes_schema(self):
        # Validate missing is not found
        r = fetch(self.request, 'api', 'metadata_schema', 'runtimes', 'missing',
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
        self._get_namespace_schemas('elyra-metadata-tests', ['test'])

    def test_get_runtimes_schema(self):
        # Ensure all schema for runtimes can be found
        self._get_namespace_schema('runtimes', 'kfp')

    def test_get_code_snippets_schema(self):
        # Ensure all schema for code-snippets can be found
        self._get_namespace_schema('code-snippets', 'code-snippet')

    def test_get_test_schema(self):
        # Ensure all schema for code-snippets can be found
        self._get_namespace_schema('elyra-metadata-tests', 'test')

    def _get_namespace_schemas(self, namespace, expected):
        r = fetch(self.request, 'api', 'metadata_schema', namespace,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        namespace_schemas = r.json()
        assert isinstance(namespace_schemas, dict)
        assert len(namespace_schemas) == 1
        schemas = namespace_schemas[namespace]
        assert len(schemas) == len(expected)
        for expected_schema in expected:
            assert expected_schema in schemas.keys()

    def _get_namespace_schema(self, namespace, expected):
        r = fetch(self.request, 'api', 'metadata_schema', namespace, expected,
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        namespace_schema = r.json()
        assert isinstance(namespace_schema, dict)
        assert expected == namespace_schema['name']
        assert namespace == namespace_schema['namespace']
