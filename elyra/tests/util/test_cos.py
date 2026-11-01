#
# Copyright 2018-2026 Elyra Authors
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

from unittest import mock

import pytest

from elyra.metadata.metadata import Metadata
from elyra.util import cos
from elyra.util.cos import CosClient
from elyra.util.cos import join_paths


def test_join_paths():
    """
    Verify that join_path yields the expected results
    """

    # one or more paths is None
    assert join_paths(None, None) == ""
    assert join_paths("", None) == ""
    assert join_paths(None, "") == ""
    assert join_paths("path", None) == "path"
    assert join_paths("/path", None) == "path"
    assert join_paths("path/", None) == "path"
    assert join_paths("/path/", None) == "path"

    # one or more paths is the empty string
    assert join_paths("", "") == ""
    assert join_paths("path", "") == "path"
    assert join_paths("/path", "") == "path"
    assert join_paths("path/", "") == "path"
    assert join_paths("/path/", "") == "path"
    assert join_paths("", "path") == "path"
    assert join_paths("", "/path") == "path"
    assert join_paths("", "path/") == "path"
    assert join_paths("", "/path/") == "path"

    assert join_paths("path", "path2") == "path/path2"
    assert join_paths("/path", "path2") == "path/path2"
    assert join_paths("path/", "path2") == "path/path2"
    assert join_paths("/path/", "path2") == "path/path2"
    assert join_paths("path", "/path2") == "path/path2"
    assert join_paths("path", "path2/") == "path/path2"
    assert join_paths("path", "/path2/") == "path/path2"
    assert join_paths("/path", "/path2") == "path/path2"
    assert join_paths("/path", "path2/") == "path/path2"
    assert join_paths("/path", "/path2/") == "path/path2"
    assert join_paths("/path/", "/path2") == "path/path2"
    assert join_paths("/path/", "path2/") == "path/path2"
    assert join_paths("/path/", "/path2/") == "path/path2"

    # multiple //
    assert join_paths("//path", "path2") == "path/path2"
    assert join_paths("path//", "path2") == "path/path2"
    assert join_paths("//path//", "path2") == "path/path2"
    assert join_paths("path", "//path2") == "path/path2"
    assert join_paths("path", "path2//") == "path/path2"
    assert join_paths("path", "//path2//") == "path/path2"
    assert join_paths("//path", "//path2") == "path/path2"
    assert join_paths("//path", "path2//") == "path/path2"
    assert join_paths("//path", "//path2//") == "path/path2"
    assert join_paths("//path//", "//path2") == "path/path2"
    assert join_paths("//path//", "path2//") == "path/path2"
    assert join_paths("//path//", "//path2//") == "path/path2"


@pytest.mark.parametrize("cos_region", [None, "", "us-east-1"])
def test_cos_client_region(monkeypatch, cos_region):
    """
    Verify that CosClient uses the region specified in the runtime configuration, if any
    """
    metadata = {
        "cos_endpoint": "http://test.example.com:30001",
        "cos_bucket": "test-bucket",
        "cos_auth_type": "USER_CREDENTIALS",
        "cos_username": "test",
        "cos_password": "test-password",
    }
    if cos_region is not None:
        metadata["cos_region"] = cos_region
    config = Metadata(name="test-config", display_name="test", schema_name="kfp", metadata=metadata)

    minio_client = mock.Mock()
    minio_client.return_value.bucket_exists.return_value = True
    monkeypatch.setattr(cos.minio, "Minio", minio_client)

    CosClient(config=config)

    minio_client.assert_called_once()
    assert minio_client.call_args.kwargs["region"] == (cos_region or None)
