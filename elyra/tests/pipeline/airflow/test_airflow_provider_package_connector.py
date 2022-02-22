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

from elyra.pipeline.airflow.provider_package_catalog_connector.airflow_provider_package_catalog_connector import AirflowProviderPackageCatalogConnector  # noqa:E501
from elyra.pipeline.catalog_connector import AirflowCatalogEntry

HTTP_PROVIDER_PKG_URL = 'https://files.pythonhosted.org/packages/a1/08/'\
                        '91653e9f394cbefe356ac07db809be7e69cc89b094379ad91d6cef3d2bc9/'\
                        'apache_airflow_providers_http-2.0.2-py3-none-any.whl'

AIRFLOW_SUPPORTED_FILE_TYPES = [".py"]


def test_empty_workdir():
    """
    Verify that the workdir isn't set by default
    """
    apc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
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
    apc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    hk = apc.get_hash_keys()
    assert len(hk) == 2
    assert hk[0] == 'provider'
    assert hk[1] == 'file'


def test_invalid_download_input():
    apc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)

    # handle input yields HTTP error
    ce = apc.get_catalog_entries({'airflow_provider_package_download_url': 'http://no.such.host/'})
    assert len(ce) == 0

    # handle input yields not a ZIP archive
    ce = apc.get_catalog_entries({'airflow_provider_package_download_url': 'https://github.com/elyra-ai/elyra'})
    assert len(ce) == 0

    # handle not a distribution package
    # TODO (requires test asset)

# -----------------------------------
# Long running test(s)
# ----------------------------------


def test_http_provider_package():
    """
    Test connector using HTTP provider package
    """
    appc = AirflowProviderPackageCatalogConnector(AIRFLOW_SUPPORTED_FILE_TYPES)
    # get catalog entries for the specified provider package
    ces = appc.get_catalog_entries({'airflow_provider_package_download_url': HTTP_PROVIDER_PKG_URL})
    # this package should contain 1 Python scripts with operator definitions
    assert len(ces) == 1
    # each entry must contain three keys
    for entry in ces:
        # provider package file name
        assert entry.get('provider_package') == 'apache_airflow_providers_http-2.0.2-py3-none-any.whl'
        # provider name
        assert entry.get('provider') == 'apache_airflow_providers_http'
        # a Python script
        assert entry.get('file', '').endswith('.py')

    # fetch and validate the first entry
    ce = appc.get_component_definition({'file': ces[0]['file']},
                                       {})
    assert ce is not None
    assert isinstance(ce, AirflowCatalogEntry)
    assert ce.definition is not None
    assert isinstance(ce.identifier, dict)
    assert Path(ce.identifier['file']) == Path('airflow') / 'providers' / 'http' / 'operators' / 'http.py'
