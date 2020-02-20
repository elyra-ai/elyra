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
        self.metadata_runtimes_dir = os.path.join(self.data_dir, 'metadata', 'runtimes')
        self.metadata_bogus_dir = os.path.join(self.data_dir, 'metadata', 'bogus')

        create_json_file(self.metadata_runtimes_dir, 'valid.json', valid_metadata_json)
        create_json_file(self.metadata_runtimes_dir, 'another.json', another_metadata_json)
        create_json_file(self.metadata_runtimes_dir, 'invalid.json', invalid_metadata_json)

    def test_bogus_namespace(self):
        # Validate missing is not found

        # Remove self.request (and other 'self.' prefixes) once transition to jupyter_server occurs
        r = fetch(self.request, 'api', 'metadata', 'bogus', 'missing',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Namespace 'bogus' was not found!" in r.text
        assert not os.path.exists(self.metadata_bogus_dir)

    def test_missing_runtime(self):
        # Validate missing is not found
        r = fetch(self.request, 'api', 'metadata', 'runtimes', 'missing',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Metadata 'missing' in namespace 'runtimes' was not found!" in r.text

    def test_invalid_runtime(self):
        # Validate invalid throws 404 with validation message
        r = fetch(self.request, 'api', 'metadata', 'runtimes', 'invalid',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Schema validation failed for metadata 'invalid'" in r.text

    def test_valid_runtime(self):
        # Ensure valid metadata can be found
        r = fetch(self.request, 'api', 'metadata', 'runtimes', 'valid',
                  base_url=self.base_url(), headers=self.auth_headers())

        assert r.status_code == 200
        metadata = r.json()
        assert 'schema_name' in metadata
        assert metadata['display_name'] == 'valid runtime'

    def test_get_runtimes(self):
        # Ensure all valid metadata can be found
        r = fetch(self.request, 'api', 'metadata', 'runtimes',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
        assert isinstance(metadata, dict)
        assert len(metadata) == 1
        runtimes = metadata['runtimes']
        assert len(runtimes) == 2
        assert 'another' in runtimes.keys()
        assert 'valid' in runtimes.keys()

    def test_get_runtimes_empty(self):
        # Delete the metadata dir contents and attempt listing metadata
        shutil.rmtree(self.metadata_runtimes_dir)
        r = fetch(self.request, 'api', 'metadata', 'runtimes',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 404
        assert "Namespace 'runtimes' was not found!" in r.text

        # Now create empty namespace
        os.makedirs(self.metadata_runtimes_dir)
        r = fetch(self.request, 'api', 'metadata', 'runtimes',
                  base_url=self.base_url(), headers=self.auth_headers())
        assert r.status_code == 200
        metadata = r.json()
        assert isinstance(metadata, dict)
        assert len(metadata) == 1
        runtimes = metadata['runtimes']
        assert len(runtimes) == 0
