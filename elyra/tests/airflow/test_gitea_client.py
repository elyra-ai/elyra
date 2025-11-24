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
import base64
import os
import tempfile
import unittest
from unittest.mock import Mock, patch, MagicMock

from elyra.util.gitea import GiteaClient


class TestGiteaClient(unittest.TestCase):

    def setUp(self):
        """Set up test fixtures"""
        self.api_endpoint = "http://192.168.1.64:3000/"
        self.token = "48d6cecb0f41b1b9cfa6725060d393a6aeb1258c"
        self.repo = "moganthkumar/elyra-airflow-dag-1"
        self.branch = "main"

        self.client = GiteaClient(
            server_url=self.api_endpoint,
            token=self.token,
            repo=self.repo,
            branch=self.branch
        )

    def test_init_valid_repo(self):
        """Test initialization with valid repository format"""
        self.assertEqual(self.client.repo_owner, "test_user")
        self.assertEqual(self.client.repo_name, "test_repo")
        self.assertEqual(self.client.branch, "main")

    def test_init_invalid_repo(self):
        """Test initialization with invalid repository format"""
        with self.assertRaises(ValueError) as context:
            GiteaClient(
                server_url=self.api_endpoint,
                token=self.token,
                repo="invalid_repo_format",
                branch=self.branch
            )
        self.assertIn("owner/repo", str(context.exception))

    @patch('requests.get')
    @patch('requests.post')
    def test_upload_new_dag(self, mock_post, mock_get):
        """Test uploading a new DAG file"""
        # Mock that file doesn't exist
        mock_get.return_value.status_code = 404

        # Mock successful file creation
        mock_post.return_value.status_code = 201
        mock_post.return_value.json.return_value = {
            'content': {'sha': 'abc123'},
            'commit': {'sha': 'commit123'}
        }

        # Create temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write("# Test DAG file\nprint('Hello, Airflow!')")
            temp_file = f.name

        try:
            result = self.client.upload_dag(
                pipeline_filepath=temp_file,
                pipeline_name="test_pipeline"
            )

            # Verify the result
            self.assertIn('content', result)

            # Verify POST was called with correct parameters
            mock_post.assert_called_once()
            call_args = mock_post.call_args

            # Verify URL
            expected_url = (
                f"{self.api_endpoint}/repos/{self.client.repo_owner}/"
                f"{self.client.repo_name}/contents/dags/{os.path.basename(temp_file)}"
            )
            self.assertEqual(call_args[0][0], expected_url)

            # Verify payload
            payload = call_args[1]['json']
            self.assertEqual(payload['branch'], self.branch)
            self.assertIn('content', payload)
            self.assertIn('message', payload)

        finally:
            os.unlink(temp_file)

    @patch('requests.get')
    @patch('requests.put')
    def test_upload_existing_dag(self, mock_put, mock_get):
        """Test updating an existing DAG file"""
        # Mock that file exists
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'sha': 'existing_sha_123'
        }

        # Mock successful file update
        mock_put.return_value.status_code = 200
        mock_put.return_value.json.return_value = {
            'content': {'sha': 'new_sha_456'},
            'commit': {'sha': 'commit456'}
        }

        # Create temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write("# Updated DAG file")
            temp_file = f.name

        try:
            result = self.client.upload_dag(
                pipeline_filepath=temp_file,
                pipeline_name="test_pipeline"
            )

            # Verify PUT was called
            mock_put.assert_called_once()

            # Verify payload includes SHA
            call_args = mock_put.call_args
            payload = call_args[1]['json']
            self.assertEqual(payload['sha'], 'existing_sha_123')

        finally:
            os.unlink(temp_file)

    def test_get_git_url(self):
        """Test Git URL construction"""
        url = GiteaClient.get_git_url(
            api_url="https://gitea.example.com/api/v1",
            repository_name="user/repo",
            repository_branch="develop"
        )

        expected_url = "https://gitea.example.com/user/repo/src/branch/develop/dags"
        self.assertEqual(url, expected_url)

    @patch('requests.get')
    def test_verify_repo_access_success(self, mock_get):
        """Test successful repository access verification"""
        mock_get.return_value.status_code = 200

        result = self.client.verify_repo_access()

        self.assertTrue(result)
        mock_get.assert_called_once()

    @patch('requests.get')
    def test_verify_repo_access_failure(self, mock_get):
        """Test failed repository access verification"""
        mock_get.return_value.status_code = 404

        result = self.client.verify_repo_access()

        self.assertFalse(result)

    @patch('requests.get')
    def test_verify_repo_access_exception(self, mock_get):
        """Test repository access verification with exception"""
        mock_get.side_effect = Exception("Connection error")

        result = self.client.verify_repo_access()

        self.assertFalse(result)


if __name__ == '__main__':
    unittest.main()