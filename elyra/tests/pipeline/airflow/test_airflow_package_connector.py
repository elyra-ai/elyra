#
# Copyright 2018-2022 Elyra Authors
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

from elyra.pipeline.airflow.package_catalog_connector.airflow_package_catalog_connector import AirflowPackageCatalogConnector  # noqa:E501
from elyra.pipeline.catalog_connector import AirflowCatalogEntry

AIRFLOW_1_10_15_PKG_URL = 'https://files.pythonhosted.org/packages/f0/3a/'\
                          'f5ce74b2bdbbe59c925bb3398ec0781b66a64b8a23e2f6adc7ab9f1005d9/'\
                          'apache_airflow-1.10.15-py2.py3-none-any.whl'

AIRFLOW_SUPPORTED_FILE_TYPES = [".py"]


def test_empty_workdir():
    """
    Verify that the workdir isn't set by default
    """
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    assert hasattr(apc, 'tmp_archive_dir') is False
    apc.get_hash_keys()
    assert hasattr(apc, 'tmp_archive_dir') is False
    cd = apc.get_component_definition({'file': 'dummyfile'},
                                      {})
    assert cd is None


def test_get_hash_keys():
    """
    Verify that `get_hash_keys` returns the expected hash key.
    """
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    hk = apc.get_hash_keys()
    assert len(hk) == 1
    assert hk[0] == 'file'


def test_invalid_download_input():
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)

    # handle input yields HTTP error
    ce = apc.get_catalog_entries({'airflow_package_download_url': 'http://no.such.host/'})
    assert len(ce) == 0

    # handle input yields not a ZIP archive
    ce = apc.get_catalog_entries({'airflow_package_download_url': 'https://github.com/elyra-ai/elyra'})
    assert len(ce) == 0

    # handle not a distribution package
    # TODO (requires test asset)

# -----------------------------------
# Long running test(s)
# ----------------------------------


def test_1_10_15_distribution():
    """
    Test connector using Apache Airflow 1.10.15 built distribution.
    """
    apc = AirflowPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    # get catalog entries for the specified distribution
    ces = apc.get_catalog_entries({'airflow_package_download_url': AIRFLOW_1_10_15_PKG_URL})
    # this distribution should contain 37 Python scripts with operator definitions
    assert len(ces) == 37
    # each entry must contain two keys
    for entry in ces:
        # built distribution package file name
        assert entry.get('airflow_package') == 'apache_airflow-1.10.15-py2.py3-none-any.whl'
        # a Python script
        assert entry.get('file', '').endswith('.py')

    # fetch and validate the first entry
    ce = apc.get_component_definition({'file': ces[0]['file']},
                                      {})
    assert ce is not None
    assert isinstance(ce, AirflowCatalogEntry)
    assert ce.definition is not None
    assert isinstance(ce.identifier, dict)
    assert Path(ce.identifier['file']) == Path('airflow') / 'operators' / Path(ce.identifier['file']).name
