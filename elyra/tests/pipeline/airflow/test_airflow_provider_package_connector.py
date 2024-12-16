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

import io
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlparse
import zipfile

from requests import get

from elyra.pipeline.airflow.provider_package_catalog_connector.airflow_provider_package_catalog_connector import (
    AirflowProviderPackageCatalogConnector,  # noqa: H301
)
from elyra.pipeline.catalog_connector import AirflowEntryData

HTTP_PROVIDER_PKG_URL = (
    "https://files.pythonhosted.org/packages/a1/08/"
    "91653e9f394cbefe356ac07db809be7e69cc89b094379ad91d6cef3d2bc9/"
    "apache_airflow_providers_http-2.0.2-py3-none-any.whl"
)

AIRFLOW_SUPPORTED_FILE_TYPES = [".py"]


def test_empty_workdir():
    """
    Verify that the workdir isn't set by default. (The property is only set
    after 'get_catalog_entries' was invoked.)
    """
    appc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    assert hasattr(appc, "tmp_archive_dir") is False
    appc.get_hash_keys()
    assert hasattr(appc, "tmp_archive_dir") is False
    cd = appc.get_entry_data({"file": "dummyfile"}, {})
    assert cd is None
    assert hasattr(appc, "tmp_archive_dir") is False


def test_get_hash_keys():
    """
    Verify that `get_hash_keys` returns the expected hash key.
    """
    hk = AirflowProviderPackageCatalogConnector.get_hash_keys()
    assert len(hk) == 2
    assert hk[0] == "provider"
    assert hk[1] == "file"


def test_invalid_download_input(requests_mock):
    """
    Test invalid input scenarios.
    """
    appc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)

    # Input is an invalid URL/host.
    requests_mock.get("http://no.such.host/a-file", real_http=True)
    ce = appc.get_catalog_entries({"airflow_provider_package_download_url": "http://no.such.host/a-file"})
    assert len(ce) == 0

    # Input is a valid URL but does not include a filename.
    requests_mock.get("http://server.domain.com", text="a-file-content")
    ce = appc.get_catalog_entries({"airflow_provider_package_download_url": "http://server.domain.com/"})
    assert len(ce) == 0

    # Input is a valid URL but but does not return a ZIP-compressed file.
    requests_mock.get("http://server.domain.com/a-file", text="a-file-content")
    ce = appc.get_catalog_entries({"airflow_provider_package_download_url": "http://server.domain.com/a-file"})
    assert len(ce) == 0

    # Input is a valid URL and a ZIP-compressed file, but not a provider package
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("dummy_file.txt", "I am a dummy file, living in a ZIP archive.")
    requests_mock.get("http://server.domain.com/a-zip-file", content=zip_buffer.getvalue())
    ce = appc.get_catalog_entries({"airflow_provider_package_download_url": "http://server.domain.com/a-zip-file"})
    assert len(ce) == 0


def test_invalid_input_get_catalog_entries():
    """
    Validate that AirflowProviderPackageCatalogConnector.get_catalog_entries(...) returns
    the expected results for invalid inputs
    """
    apc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)

    # Test invalid "file://" inputs ...
    # ... input refers to a directory
    resource_location = Path(__file__).parent / ".." / "resources" / "components"
    resource_url = resource_location.as_uri()
    ce = apc.get_catalog_entries(
        {"airflow_provider_package_download_url": resource_url, "display_name": "file://is-a-dir-test"}
    )
    assert isinstance(ce, list), resource_url
    assert len(ce) == 0

    # ... input refers to a non-existing whl file
    resource_location = Path(__file__).parent / ".." / "resources" / "components" / "no-such.whl"
    resource_url = resource_location.as_uri()
    ce = apc.get_catalog_entries(
        {"airflow_provider_package_download_url": resource_url, "display_name": "file://no-such-file-test"}
    )
    assert isinstance(ce, list), resource_url
    assert len(ce) == 0


# -----------------------------------
# Long running test(s)
# ----------------------------------


def test_valid_url_http_provider_package():
    """
    Test connector using HTTP provider package
    """
    appc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    # get catalog entries for the specified provider package
    ces = appc.get_catalog_entries({"airflow_provider_package_download_url": HTTP_PROVIDER_PKG_URL})
    # this package should contain 1 Python scripts with operator definitions
    assert len(ces) == 1
    # each entry must contain three keys
    for entry in ces:
        # provider package file name
        assert entry.get("provider_package") == "apache_airflow_providers_http-2.0.2-py3-none-any.whl"
        # provider name
        assert entry.get("provider") == "apache_airflow_providers_http"
        # a Python script
        assert entry.get("file", "").endswith(".py")

    # fetch and validate the first entry
    ce = appc.get_entry_data({"file": ces[0]["file"]}, {})
    assert ce is not None
    assert isinstance(ce, AirflowEntryData)
    assert ce.definition is not None
    assert ce.package_name == "airflow.providers.http.operators.http"


def test_valid_file_http_provider_package():
    """
    Test connector using a local copy of the HTTP provider package
    """

    # Download the test provider package and store it in the local file system
    resp = get(HTTP_PROVIDER_PKG_URL)
    assert resp.status_code == 200

    with TemporaryDirectory() as dirpath:
        local_file_copy = Path(dirpath) / Path(urlparse(HTTP_PROVIDER_PKG_URL).path).name
        with open(local_file_copy, "wb") as downloaded_package:
            downloaded_package.write(resp.content)

        local_provider_package_file_copy_url = local_file_copy.as_uri()

        appc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
        # get catalog entries for the specified provider package
        ces = appc.get_catalog_entries(
            {
                "airflow_provider_package_download_url": local_provider_package_file_copy_url,
                "display_name": "file://local-provider-package",
            }
        )
        # this package should contain 1 Python script with operator definitions
        assert len(ces) == 1
        # each entry must contain three keys
        for entry in ces:
            # provider package file name
            assert entry.get("provider_package") == Path(urlparse(HTTP_PROVIDER_PKG_URL).path).name
            # provider name
            assert entry.get("provider") == "apache_airflow_providers_http"
            # a Python script
            assert entry.get("file", "").endswith(".py")

        # fetch and validate the first entry
        ce = appc.get_entry_data({"file": ces[0]["file"]}, {})
        assert ce is not None
        assert isinstance(ce, AirflowEntryData)
        assert ce.definition is not None
        assert ce.package_name == "airflow.providers.http.operators.http"
