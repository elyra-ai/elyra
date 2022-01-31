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
def component_cache_instance(request):
    """Creates an instance of a component cache and removes after test."""

    # Create a ComponentCache instance to handle the cache update on metadata instance creation
    component_catalog = ComponentCache.instance()

    instance_name = "component_cache"
    md_mgr = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)
    # clean possible orphaned instance...
    try:
        md_mgr.remove(instance_name)
    except Exception:
        pass

    # Attempt to create the instance
    try:
        component_cache_instance = md_mgr.create(instance_name, Metadata(**request.param))

        # Wait for the cache update to complete
        component_catalog.wait_for_all_cache_updates()

        yield component_cache_instance.name
        md_mgr.remove(component_cache_instance.name)

    # Test was not parametrized, so component instance is not needed
    except AttributeError:
        yield None
