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
import pytest

from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.metadata.manager import MetadataManager
from elyra.pipeline.component_catalog import ComponentCache

pytest_plugins = ["jupyter_server.pytest_plugin"]

TEST_CATALOG_NAME = 'new_test_catalog'

KFP_COMPONENT_CACHE_INSTANCE = {
    "display_name": "KFP Example Components",
    "metadata": {
        "runtime_type": "KUBEFLOW_PIPELINES",
        "categories": ["examples"]
    },
    "schema_name": "elyra-kfp-examples-catalog"
}

AIRFLOW_COMPONENT_CACHE_INSTANCE = {
    "display_name": "Airflow Example Components",
    "metadata": {
        "runtime_type": "APACHE_AIRFLOW",
        "categories": ["examples"]
    },
    "schema_name": "elyra-airflow-examples-catalog"
}


@pytest.fixture
def component_catalog(jp_environ):
    """
    TODO
    """
    # Clear any ComponentCache instance so next parametrized test starts with clean instance
    ComponentCache.clear_instance()

    # Create new instance and wait for all load tasks
    component_catalog = ComponentCache.instance()
    component_catalog.load()
    component_catalog.wait_for_all_tasks()
    yield component_catalog


@pytest.fixture
def component_cache_instance(jp_environ, request):
    """Creates an instance of a component catalog and removes after test."""
    instance_metadata, wait_for_cache_updates = request.param

    instance_name = "component_cache"
    md_mgr = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)
    # clean possible orphaned instance...
    try:
        md_mgr.remove(instance_name)
    except Exception:
        pass

    try:
        # Create instance and wait for the cache update to complete
        component_cache_instance = md_mgr.create(instance_name, Metadata(**instance_metadata))
        # component_catalog.wait_for_all_tasks()
        yield component_cache_instance.name

        # Remove instance
        md_mgr.remove(component_cache_instance.name)
        if wait_for_cache_updates:
            ComponentCache.instance().wait_for_all_tasks()

    # Test was not parametrized, so component instance is not needed
    except AttributeError:
        yield None


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
            # ComponentCache.instance().wait_for_all_cache_updates()
    except Exception:
        pass
