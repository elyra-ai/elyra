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

import pytest

from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.metadata.manager import MetadataManager
from elyra.pipeline.component_catalog import ComponentCache

pytest_plugins = ["jupyter_server.pytest_plugin"]

TEST_CATALOG_NAME = "new_test_catalog"

KFP_COMPONENT_CACHE_INSTANCE = {
    "display_name": "KFP Example Components",
    "metadata": {"runtime_type": "KUBEFLOW_PIPELINES", "categories": ["examples"]},
    "schema_name": "elyra-kfp-examples-catalog",
}

AIRFLOW_TEST_OPERATOR_CATALOG = {
    "display_name": "Airflow Test Operator",
    "metadata": {
        "runtime_type": "APACHE_AIRFLOW",
        "base_path": str(Path(__file__).parent / "elyra" / "tests" / "pipeline" / "resources" / "components"),
        "paths": ["airflow_test_operator.py"],
    },
    "schema_name": "local-file-catalog",
}


@pytest.fixture
def component_cache(jp_environ):
    """
    Initialize a component cache that emulates a running server process
    """
    # Create new instance and load the cache
    component_cache = ComponentCache.instance(emulate_server_app=True)
    component_cache.load()

    yield component_cache
    component_cache.cache_manager.stop()
    ComponentCache.clear_instance()


@pytest.fixture
def catalog_instance(component_cache, request):
    """Creates an instance of a component catalog and removes after test."""
    instance_metadata = request.param
    instance_name = "component_cache"
    md_mgr = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)
    catalog = md_mgr.create(instance_name, Metadata(**instance_metadata))
    component_cache.wait_for_all_cache_tasks()
    yield catalog
    md_mgr.remove(instance_name)


@pytest.fixture
def catalog_instance_no_server_process(request):
    """
    Creates an instance of a component catalog that does not emulate a server process,
    then removes instance after test. This is used for testing CLI functionality where
    a server process would not be present.
    """
    instance_metadata = request.param
    instance_name = "component_cache"
    md_mgr = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)
    md_mgr.create(instance_name, Metadata(**instance_metadata))
    ComponentCache.clear_instance()  # Clear cache instance created during instance creation
    yield
    md_mgr.remove(instance_name)


@pytest.fixture
def metadata_manager_with_teardown(jp_environ):
    """
    This fixture provides a MetadataManager instance for certain tests that modify the component
    catalog. This ensures the catalog instance is removed even when the test fails
    """
    metadata_manager = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)

    # Run test with provided metadata manager
    yield metadata_manager

    # Remove test catalog
    try:
        if metadata_manager.get(TEST_CATALOG_NAME):
            metadata_manager.remove(TEST_CATALOG_NAME)
    except Exception:
        pass


# Set Elyra server extension as enabled (overriding server_config fixture from jupyter_server)
@pytest.fixture
def jp_server_config():
    return {"ServerApp": {"jpserver_extensions": {"elyra": True}}}
