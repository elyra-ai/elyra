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
from pathlib import Path

from elyra.pipeline.catalog_connector import UrlComponentCatalogConnector


def test_url_connector_valid_get_entry_data():
    """
    Validate that UrlComponentCatalogConnector.get_entry_data(...) returns
    the expected results
    """

    # Test valid "file://" inputs
    test_conn = UrlComponentCatalogConnector([".yaml"])
    resource_location = Path(__file__).parent / "resources" / "components" / "download_data.yaml"
    resource_url = resource_location.as_uri()
    ed = test_conn.get_entry_data({"url": resource_url}, {"display_name": "file://is-valid-test"})
    assert ed is not None
    with open(resource_location, "r") as source:
        assert ed.definition == source.read()


def test_url_connector_invalid_get_entry_data():
    """
    Validate that UrlComponentCatalogConnector.get_entry_data(...) returns
    the expected results for invalid inputs
    """

    # Test invalid "file://" inputs ...
    # ... input refers to a directory
    test_conn = UrlComponentCatalogConnector([".yaml"])
    resource_location = Path(__file__).parent / "resources" / "components"
    resource_url = resource_location.as_uri()
    ed = test_conn.get_entry_data({"url": resource_url}, {"display_name": "file://is-a-dir-test"})
    assert ed is None, resource_url

    # ... input refers to a non-existing file
    test_conn = UrlComponentCatalogConnector([".yaml"])
    resource_location = Path(__file__).parent / "resources" / "components" / "no-such-file.yaml"
    resource_url = resource_location.as_uri()
    ed = test_conn.get_entry_data({"url": resource_url}, {"display_name": "file://no-such-file-test"})
    assert ed is None, resource_url
