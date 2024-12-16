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
import zipfile

from elyra.pipeline.airflow.package_catalog_connector.airflow_package_catalog_connector import (
    AirflowPackageCatalogConnector,  # noqa:H301
)
from elyra.pipeline.catalog_connector import AirflowEntryData

AIRFLOW_1_10_15_PKG_URL = (
    "https://files.pythonhosted.org/packages/f0/3a/"
    "f5ce74b2bdbbe59c925bb3398ec0781b66a64b8a23e2f6adc7ab9f1005d9/"
    "apache_airflow-1.10.15-py2.py3-none-any.whl"
)

AIRFLOW_SUPPORTED_FILE_TYPES = [".py"]


def test_empty_workdir():
    """
    Verify that the workdir isn't set by default. (The property is only set
    after 'get_catalog_entries' was invoked.)
    """
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    assert hasattr(apc, "tmp_archive_dir") is False
    apc.get_hash_keys()
    assert hasattr(apc, "tmp_archive_dir") is False
    cd = apc.get_entry_data({"file": "dummyfile"}, {})
    assert cd is None
    assert hasattr(apc, "tmp_archive_dir") is False


def test_get_hash_keys():
    """
    Verify that `get_hash_keys` returns the expected hash key.
    """
    hk = AirflowPackageCatalogConnector.get_hash_keys()
    assert len(hk) == 1
    assert hk[0] == "file"


def test_invalid_download_input(requests_mock):
    """
    Test invalid input scenarios.
    """
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)

    # Input is an invalid URL/host.
    requests_mock.get("http://no.such.host/a-file", real_http=True)
    ce = apc.get_catalog_entries({"airflow_package_download_url": "http://no.such.host/a-file"})
    assert len(ce) == 0

    # Input is a valid URL but does not include a filename.
    requests_mock.get("http://server.domain.com", text="a-file-content")
    ce = apc.get_catalog_entries({"airflow_package_download_url": "http://server.domain.com/"})
    assert len(ce) == 0

    # Input is a valid URL, but does not return a ZIP-compressed file.
    requests_mock.get("http://server.domain.com/a-file", text="another-file-content")
    ce = apc.get_catalog_entries({"airflow_package_download_url": "http://server.domain.com/a-file"})
    assert len(ce) == 0

    # Input is a valid URL and a ZIP-compressed file, but is not an Airflow built distribution.
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("dummy_file.txt", "I am a dummy file, living in a ZIP archive.")
    requests_mock.get("http://server.domain.com/a-zip-file", content=zip_buffer.getvalue())
    ce = apc.get_catalog_entries({"airflow_package_download_url": "http://server.domain.com/a-zip-file"})
    assert len(ce) == 0


def test_invalid_get_entry_data():
    """
    Validate that AirflowPackageCatalogConnector.get_entry_data(...) returns
    the expected results for invalid inputs
    """
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)

    # Test invalid "file://" inputs ...
    # ... input refers to a directory
    resource_location = Path(__file__).parent / ".." / "resources" / "components"
    resource_url = resource_location.as_uri()
    ce = apc.get_catalog_entries({"airflow_package_download_url": resource_url, "display_name": "file://is-a-dir-test"})
    assert isinstance(ce, list), resource_url
    assert len(ce) == 0

    # ... input refers to a non-existing whl file
    resource_location = Path(__file__).parent / ".." / "resources" / "components" / "no-such.whl"
    resource_url = resource_location.as_uri()
    ce = apc.get_catalog_entries(
        {"airflow_package_download_url": resource_url, "display_name": "file://no-such-file-test"}
    )
    assert isinstance(ce, list), resource_url
    assert len(ce) == 0


# -----------------------------------
# Long running test(s)
# ----------------------------------


def test_1_10_15_distribution():
    """
    Test connector using Apache Airflow 1.10.15 built distribution.
    """
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    # get catalog entries for the specified distribution
    ces = apc.get_catalog_entries({"airflow_package_download_url": AIRFLOW_1_10_15_PKG_URL})
    # this distribution should contain 37 Python scripts with operator definitions
    assert len(ces) == 37
    # each entry must contain two keys
    for entry in ces:
        # built distribution package file name
        assert entry.get("airflow_package") == "apache_airflow-1.10.15-py2.py3-none-any.whl"
        # a Python script
        assert entry.get("file", "").endswith(".py")

    # fetch and validate the first entry
    ce = apc.get_entry_data({"file": ces[0]["file"]}, {})

    assert ce is not None
    assert isinstance(ce, AirflowEntryData)
    assert ce.definition is not None
    assert ce.package_name.startswith("airflow.operators.")
