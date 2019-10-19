#
# Copyright 2018-2019 IBM Corporation
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

from .test_utils import test_schema_json, valid_metadata_json, \
    invalid_metadata_json, another_metadata_json, create_json_file


class MetadataAPI(object):
    """Wrapper for kernel REST API requests"""
    def __init__(self, request, base_url, headers):
        self.request = request
        self.base_url = base_url
        self.headers = headers

    def _req(self, verb, path, body=None):
        response = self.request(verb,
                url_path_join('metadata/runtime', path), data=body)

        if 400 <= response.status_code < 600:
            try:
                response.reason = response.json()['message']
            except:
                pass
        response.raise_for_status()

        return response

    def get_all(self):
        return self._req('GET', '')

    def get(self, name):
        return self._req('GET', name)


class MetadataHandlerTest(NotebookTestBase):
    """Test Metadata REST API"""
    config = Config({'NotebookApp': {"nbserver_extensions": {"ai_workspace": True}}})

    def setUp(self):
        self.metadata_dir = os.path.join(self.data_dir, 'metadata', 'runtime')

        create_json_file(self.metadata_dir, 'test_schema.schema', test_schema_json)
        create_json_file(self.metadata_dir, 'valid.json', valid_metadata_json)
        create_json_file(self.metadata_dir, 'another.json', another_metadata_json)
        create_json_file(self.metadata_dir, 'invalid.json', invalid_metadata_json)

        self.metadata_api = MetadataAPI(self.request,
                                        base_url=self.base_url(),
                                        headers=self.auth_headers(),)

    def tearDown(self):
        pass

    def test_missing_runtime(self):
        # Validate missing is not found
        with assert_http_error(404, "Metadata 'missing' in namespace 'runtime' was not found!"):
            self.metadata_api.get('missing')

    def test_invalid_runtime(self):
        # Validate invalid throws 404 with validation message
        with assert_http_error(404, "Schema validation failed for metadata 'invalid'"):
            self.metadata_api.get('invalid')

    def test_valid_runtime(self):
        # Ensure valid metadata can be found
        r = self.metadata_api.get('valid')
        self.assertEqual(r.status_code, 200)
        metadata = r.json()
        self.assertTrue('schema_name' in metadata)
        self.assertEquals(metadata['display_name'], 'valid runtime')

    def test_get_runtimes(self):
        # Ensure all valid metadata can be found
        r = self.metadata_api.get_all()
        self.assertEqual(r.status_code, 200)
        metadata = r.json()
        assert isinstance(metadata, dict)
        self.assertEquals(len(metadata), 2)
        self.assertIn('another', metadata.keys())
        self.assertIn('valid', metadata.keys())

    def test_get_runtimes_none(self):
        # Delete the metadata dir and attempt listing metadata
        shutil.rmtree(self.metadata_dir)

        r = self.metadata_api.get_all()
        self.assertEqual(r.status_code, 200)
        metadata = r.json()
        assert isinstance(metadata, dict)
        self.assertEquals(len(metadata), 0)
