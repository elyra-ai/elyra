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

import json

from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.pipeline.runtime_type import RuntimeTypeResources
from elyra.tests.pipeline import resources

try:
    import importlib.resources as pkg_resources
except ImportError:
    # Try backported to PY<37 `importlib_resources`.
    import importlib_resources as pkg_resources


async def test_get_components(jp_fetch):
    # Ensure all valid components can be found
    response = await jp_fetch('elyra', 'pipeline', 'components', 'local')
    assert response.code == 200
    payload = json.loads(response.body.decode())
    palette = json.loads(pkg_resources.read_text(resources, 'palette.json'))
    assert payload == palette


async def test_get_component_properties_config(jp_fetch):
    # Ensure all valid component_entry properties can be found
    response = await jp_fetch('elyra', 'pipeline', 'components', 'local', 'notebook', 'properties')
    assert response.code == 200
    payload = json.loads(response.body.decode())
    properties = json.loads(pkg_resources.read_text(resources, 'properties.json'))
    assert payload == properties


async def test_runtime_types_resources(jp_fetch):
    # Ensure appropriate runtime types resources can be fetched
    response = await jp_fetch('elyra', 'pipeline', 'runtimes', 'types')
    assert response.code == 200

    resources = json.loads(response.body.decode())

    runtime_types = resources['runtime_types']
    assert len(runtime_types) >= 1  # We should have Local for sure
    for runtime_type_resources in runtime_types:
        assert runtime_type_resources.get('id') in ['LOCAL', 'KUBEFLOW_PIPELINES', 'APACHE_AIRFLOW', 'ARGO']

        # Acquire corresponding instance and compare that results are the same
        runtime_type = RuntimeProcessorType.get_instance_by_name(runtime_type_resources.get('id'))
        resources_instance = RuntimeTypeResources.get_instance_by_type(runtime_type)

        assert runtime_type_resources.get('display_name') == resources_instance.display_name
        assert runtime_type_resources.get('export_file_types') == resources_instance.export_file_types
        assert runtime_type_resources.get('icon') == resources_instance.icon_endpoint
