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
from notebook.utils import url_path_join
from notebook.tests.launchnotebook import NotebookTestBase, assert_http_error

from .test_utils import valid_metadata_json, invalid_metadata_json, another_metadata_json, create_json_file


class MetadataRestAPI(object):
    """Wrapper for kernel REST API requests"""
    def __init__(self, request, namespace, base_url, headers):
        self.request = request
        self.namespace = namespace
        self.base_url = base_url
        self.headers = headers

    def _req(self, verb, path, body=None):
        response = self.request(verb, url_path_join('api', 'metadata', self.namespace, path), data=body)

        if 400 <= response.status_code < 600:
            try:
                response.reason = response.json()['message']
            except Exception:
                pass
        response.raise_for_status()

        return response

    def get_all(self):
        return self._req('GET', '')

    def get(self, name):
        return self._req('GET', name)


class MetadataHandlerTest(NotebookTestBase):
    """Test Metadata REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}})

    def setUp(self):
        self.runtime_dir = os.path.join(self.data_dir, 'metadata', 'runtimes')
        self.bogus_dir = os.path.join(self.data_dir, 'metadata', 'bogus')

        create_json_file(self.runtime_dir, 'valid.json', valid_metadata_json)
        create_json_file(self.runtime_dir, 'another.json', another_metadata_json)
        create_json_file(self.runtime_dir, 'invalid.json', invalid_metadata_json)

        self.runtime_api = MetadataRestAPI(self.request,
                                           namespace='runtimes',
                                           base_url=self.base_url(),
                                           headers=self.auth_headers(), )

        self.bogus_namespace_api = MetadataRestAPI(self.request,
                                                   namespace='bogus',
                                                   base_url=self.base_url(),
                                                   headers=self.auth_headers(), )

    def tearDown(self):
        pass

    def test_bogus_namespace(self):
        # Validate missing is not found
        with assert_http_error(404, "Namespace 'bogus' was not found!"):
            self.bogus_namespace_api.get('missing')

        self.assertFalse(os.path.exists(self.bogus_dir))

    def test_missing_runtime(self):
        # Validate missing is not found
        with assert_http_error(404, "Metadata 'missing' in namespace 'runtimes' was not found!"):
            self.runtime_api.get('missing')

    def test_invalid_runtime(self):
        # Validate invalid throws 404 with validation message
        with assert_http_error(404, "Schema validation failed for metadata 'invalid'"):
            self.runtime_api.get('invalid')

    def test_valid_runtime(self):
        # Ensure valid metadata can be found
        r = self.runtime_api.get('valid')
        self.assertEqual(r.status_code, 200)
        metadata = r.json()
        self.assertTrue('schema_name' in metadata)
        self.assertEqual(metadata['display_name'], 'valid runtime')

    def test_get_runtimes(self):
        # Ensure all valid metadata can be found
        r = self.runtime_api.get_all()
        self.assertEqual(r.status_code, 200)
        metadata = r.json()
        assert isinstance(metadata, dict)
        self.assertEqual(len(metadata), 1)
        runtimes = metadata['runtimes']
        self.assertEqual(len(runtimes), 2)
        self.assertIn('another', runtimes.keys())
        self.assertIn('valid', runtimes.keys())

    def test_get_runtimes_empty(self):
        # Delete the metadata dir contents and attempt listing metadata
        shutil.rmtree(self.runtime_dir)
        with assert_http_error(404, "Namespace 'runtimes' was not found!"):
            r = self.runtime_api.get_all()

        # Now create empty namespace
        os.makedirs(self.runtime_dir)
        r = self.runtime_api.get_all()
        self.assertEqual(r.status_code, 200)
        metadata = r.json()
        assert isinstance(metadata, dict)
        self.assertEqual(len(metadata), 1)
        runtimes = metadata['runtimes']
        self.assertEqual(len(runtimes), 0)
