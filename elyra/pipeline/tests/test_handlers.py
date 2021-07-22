#
# Copyright 2018-2021 Elyra Authors
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

import pytest

from elyra.pipeline.tests import resources

# from jupyter_server.tests.utils import expected_http_error
# from tornado.httpclient import HTTPClientError

try:
    import importlib.resources as pkg_resources
except ImportError:
    # Try backported to PY<37 `importlib_resources`.
    import importlib_resources as pkg_resources


# Set Elyra server extension as enabled (overriding server_config fixture from jupyter_server)
@pytest.fixture
def jp_server_config():
    return {
        "ServerApp": {
            "jpserver_extensions": {
                "elyra": True
            }
        }
    }


# async def test_invalid_config_resource(jp_fetch):
#     with pytest.raises(HTTPClientError) as e:
#         await jp_fetch('elyra', 'pipeline', 'config', 'invalid', method='GET')
#
#     assert expected_http_error(e, 400)


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
