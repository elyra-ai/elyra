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
import asyncio
import json
import os

from conftest import KFP_COMPONENT_CACHE_INSTANCE
import jupyter_core
import pytest
import requests
from tornado.httpclient import HTTPClientError

from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.pipeline.runtime_type import RuntimeTypeResources
from elyra.tests.pipeline import resources
from elyra.tests.util.handlers_utils import expected_http_error


try:
    import importlib.resources as pkg_resources
except ImportError:
    # Try backported to PY<37 `importlib_resources`.
    import importlib_resources as pkg_resources


COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], "components")
TEST_CATALOG_NAME = "test_handlers_catalog"


def _get_resource_path(filename):
    resource_path = os.path.join(os.path.dirname(__file__), "resources", "components", filename)
    resource_path = os.path.normpath(resource_path)
    return resource_path


async def cli_catalog_instance(jp_fetch):
    # Create new registry instance with a single URL-based component
    # This is not a fixture because it needs to
    paths = [_get_resource_path("kfp_test_operator.yaml")]

    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RuntimeProcessorType.KUBEFLOW_PIPELINES.name,
        "categories": ["New Components"],
        "paths": paths,
    }
    instance = Metadata(
        schema_name="local-file-catalog",
        name=TEST_CATALOG_NAME,
        display_name="New Test Catalog",
        metadata=instance_metadata,
    )

    body = json.dumps(instance.to_dict())
    r = await jp_fetch(
        "elyra", "metadata", ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID, body=body, method="POST"
    )
    assert r.code == 201
    r = await jp_fetch("elyra", "metadata", ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)
    assert r.code == 200
    metadata = json.loads(r.body.decode())
    assert len(metadata) >= 1


async def test_get_components(jp_fetch):
    # Ensure all valid components can be found
    runtime_type = RuntimeProcessorType.LOCAL
    response = await jp_fetch("elyra", "pipeline", "components", runtime_type.name)
    assert response.code == 200
    payload = json.loads(response.body.decode())
    palette = json.loads(pkg_resources.read_text(resources, "palette.json"))
    assert payload == palette


async def test_get_component_properties_config(jp_fetch):
    # Ensure all valid component_entry properties can be found
    runtime_type = RuntimeProcessorType.LOCAL
    response = await jp_fetch("elyra", "pipeline", "components", runtime_type.name, "notebook", "properties")
    assert response.code == 200
    payload = json.loads(response.body.decode())
    properties = json.loads(pkg_resources.read_text(resources, "properties.json"))
    assert payload == properties


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_get_component_properties_definition(catalog_instance, jp_fetch, caplog):
    # Ensure the definition for a component can be found
    component_url = (
        "https://raw.githubusercontent.com/elyra-ai/examples/master/component-catalog-connectors/"
        "kfp-example-components-connector/kfp_examples_connector/resources/download_data.yaml"
    )
    definition = requests.get(component_url)

    component_id = "elyra-kfp-examples-catalog:a08014f9252f"  # static id for the 'Download Data' example component

    # Test with shorthand runtime (e.g. 'kfp', 'airflow') (support to be removed in later release)
    response = await jp_fetch("elyra", "pipeline", "components", "kfp", component_id)
    assert response.code == 200
    payload = json.loads(response.body.decode())
    assert payload["content"] == definition.text
    assert payload["mimeType"] == "text/x-yaml"

    assert "Deprecation warning" in caplog.text
    caplog.clear()

    # Test with runtime type name in endpoint
    runtime_type = RuntimeProcessorType.KUBEFLOW_PIPELINES
    response = await jp_fetch("elyra", "pipeline", "components", runtime_type.name, component_id)
    assert response.code == 200
    payload = json.loads(response.body.decode())
    assert payload["content"] == definition.text
    assert payload["mimeType"] == "text/x-yaml"

    assert "Deprecation warning" not in caplog.text


async def test_runtime_types_resources(jp_fetch):
    # Ensure appropriate runtime types resources can be fetched
    response = await jp_fetch("elyra", "pipeline", "runtimes", "types")
    assert response.code == 200

    resources = json.loads(response.body.decode())

    runtime_types = resources["runtime_types"]
    assert len(runtime_types) >= 1  # We should have Local for sure
    for runtime_type_resources in runtime_types:
        assert runtime_type_resources.get("id") in ["LOCAL", "KUBEFLOW_PIPELINES", "APACHE_AIRFLOW", "ARGO"]

        # Acquire corresponding instance and compare that results are the same
        runtime_type = RuntimeProcessorType.get_instance_by_name(runtime_type_resources.get("id"))
        resources_instance = RuntimeTypeResources.get_instance_by_type(runtime_type)

        assert runtime_type_resources.get("display_name") == resources_instance.display_name
        assert runtime_type_resources.get("export_file_types") == resources_instance.export_file_types
        assert runtime_type_resources.get("icon") == resources_instance.icon_endpoint


async def test_double_refresh(jp_fetch):
    # Ensure that attempts to refresh the component cache while another is in progress result in 409

    await cli_catalog_instance(jp_fetch)

    refresh = {"action": "refresh"}
    body = json.dumps(refresh)

    response = await jp_fetch("elyra", "pipeline", "components", "cache", body=body, method="PUT")
    assert response.code == 204
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch("elyra", "pipeline", "components", "cache", body=body, method="PUT")
    assert expected_http_error(e, 409)
    # Give the first refresh attempt a chance to complete and try again to ensure it has
    await asyncio.sleep(2)
    response = await jp_fetch("elyra", "pipeline", "components", "cache", body=body, method="PUT")
    assert response.code == 204


async def test_malformed_refresh(jp_fetch):
    # Ensure that providing the endpoints with a bad body generate 400 errors.
    refresh = {"no-action": "refresh"}
    body = json.dumps(refresh)

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch("elyra", "pipeline", "components", "cache", body=body, method="PUT")
    assert expected_http_error(e, 400)

    refresh = {"action": "no-refresh"}
    body = json.dumps(refresh)

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch("elyra", "pipeline", "components", "cache", body=body, method="PUT")
    assert expected_http_error(e, 400)


async def test_get_pipeline_properties_definition(jp_fetch):
    runtime_list = ["kfp", "airflow", "local"]

    for runtime in runtime_list:
        response = await jp_fetch("elyra", "pipeline", runtime, "properties")
        assert response.code == 200
        payload = json.loads(response.body.decode())
        # Spot check
        assert payload["parameters"] == [
            {"id": "name"},
            {"id": "runtime"},
            {"id": "description"},
            {"id": "cos_object_prefix"},
            {"id": "elyra_runtime_image"},
            {"id": "elyra_env_vars"},
            {"id": "elyra_kubernetes_secrets"},
            {"id": "elyra_mounted_volumes"},
        ]
