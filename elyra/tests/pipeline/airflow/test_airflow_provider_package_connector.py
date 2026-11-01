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

import io
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlparse
import zipfile

import pytest
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


OPERATOR_SOURCE = """
from airflow.models import BaseOperator


class MyOperator(BaseOperator):
    def __init__(self, my_property: str, *args, **kwargs):
        super().__init__(*args, **kwargs)
"""


def create_provider_package(directory: Path, files: dict) -> str:
    """
    Create a provider package archive that contains the specified files
    and return its URL
    """
    archive = directory / "my_provider-1.0.0-py3-none-any.whl"
    with zipfile.ZipFile(archive, "w") as zip_file:
        for name, content in files.items():
            zip_file.writestr(name, content)
    return archive.as_uri()


@pytest.mark.parametrize(
    "provider_info_files",
    [
        # provider info function declared as entry point, in a module with a custom name
        {
            "my_provider/provider.py": "def provider_info():\n    return PROVIDER_INFO\n",
            "my_provider-1.0.0.dist-info/entry_points.txt": (
                "[apache_airflow_provider]\nprovider_info = my_provider.provider:provider_info\n"
            ),
        },
        # provider info function declared as entry point, in a package
        {
            "my_provider/info/__init__.py": "def get_info():\n    return PROVIDER_INFO\n",
            "my_provider-1.0.0.dist-info/entry_points.txt": (
                "[console_scripts]\nmy-script = my_provider.cli:main\n\n"
                "[apache_airflow_provider]\nprovider_info = my_provider.info:get_info\n"
            ),
        },
        # no entry point, 'get_provider_info.py' module
        {
            "my_provider/get_provider_info.py": "def get_provider_info():\n    return PROVIDER_INFO\n",
            "my_provider-1.0.0.dist-info/METADATA": "Name: my-provider\n",
        },
    ],
)
def test_locate_provider_info(provider_info_files):
    """
    Test that the provider info is located using the 'provider_info' entry point, if
    the provider package declares one, and the 'get_provider_info.py' module otherwise.
    """
    provider_info = {"operators": [{"python-modules": ["my_provider.operators.my_operator"]}]}
    files = {
        name: f"PROVIDER_INFO = {provider_info}\n\n\n{content}" if name.endswith(".py") else content
        for name, content in provider_info_files.items()
    }
    files["my_provider/operators/my_operator.py"] = OPERATOR_SOURCE

    with TemporaryDirectory() as dirpath:
        url = create_provider_package(Path(dirpath), files)

        appc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
        ces = appc.get_catalog_entries({"airflow_provider_package_download_url": url, "display_name": "my-provider"})
        assert ces == [
            {
                "provider_package": "my_provider-1.0.0-py3-none-any.whl",
                "provider": "my_provider",
                "file": "my_provider/operators/my_operator.py",
            }
        ]


@pytest.mark.parametrize(
    "files, error",
    [
        # the entry point module isn't in the archive
        (
            {
                "my_provider/get_provider_info.py": "def get_provider_info():\n    return {}\n",
                "my_provider-1.0.0.dist-info/entry_points.txt": (
                    "[apache_airflow_provider]\nprovider_info = my_provider.missing:provider_info\n"
                ),
            },
            "does not contain the module 'my_provider.missing' of the 'provider_info' entry point",
        ),
        # the entry point function isn't defined
        (
            {
                "my_provider/provider.py": "def other_function():\n    return {}\n",
                "my_provider-1.0.0.dist-info/entry_points.txt": (
                    "[apache_airflow_provider]\nprovider_info = my_provider.provider:provider_info\n"
                ),
            },
            "cannot invoke 'provider_info' method",
        ),
        # no entry point and no 'get_provider_info.py' module
        (
            {"my_provider/provider.py": "def provider_info():\n    return {}\n"},
            "does not declare a 'provider_info' entry point and contains 0 file(s) named 'get_provider_info.py'",
        ),
    ],
)
def test_locate_provider_info_errors(caplog, files, error):
    """
    Test that an error is logged if the provider info cannot be located
    """
    with TemporaryDirectory() as dirpath:
        url = create_provider_package(Path(dirpath), files)

        appc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
        ces = appc.get_catalog_entries({"airflow_provider_package_download_url": url, "display_name": "my-provider"})
        assert ces == []
        assert error in caplog.text


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
