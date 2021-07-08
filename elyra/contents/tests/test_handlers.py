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

from jupyter_server.tests.utils import expected_http_error
import pytest
from tornado.httpclient import HTTPClientError

from elyra.contents.tests.test_utils import expected_response
from elyra.contents.tests.test_utils import expected_response_empty


async def test_file_not_found(jp_fetch):
    filepath = "nofile.py"

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'contents/properties', filepath)
    assert expected_http_error(e, 404)


async def test_file_is_not_directory(jp_fetch, create_directory, directory_name):
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'contents/properties', directory_name)
    assert expected_http_error(e, 400)


async def test_invalid_post_request(jp_fetch, create_python_file, python_filename):
    response = await jp_fetch('elyra', 'contents/properties', python_filename, body=json.dumps(""), method='POST')
    response_body = json.loads(response.body)

    assert response_body['title'] == "Operation not supported."


async def test_invalid_file_type(jp_fetch, create_text_file, text_filename):
    response = await jp_fetch('elyra', 'contents/properties', text_filename)

    assert response.code == 200
    assert json.loads(response.body) == expected_response_empty


async def test_valid_notebook(jp_fetch, create_notebook_file, notebook_filename):
    response = await jp_fetch('elyra', 'contents/properties', notebook_filename)

    assert response.code == 200
    assert json.loads(response.body) == expected_response


async def test_valid_python_file(jp_fetch, create_python_file, python_filename):
    response = await jp_fetch('elyra', 'contents/properties', python_filename)

    assert response.code == 200
    assert json.loads(response.body) == expected_response


async def test_valid_r_file(jp_fetch, create_r_file, r_filename):
    response = await jp_fetch('elyra', 'contents/properties', r_filename)

    assert response.code == 200
    assert json.loads(response.body) == expected_response


async def test_empty_notebook(jp_fetch, create_empty_notebook_file, notebook_filename):
    response = await jp_fetch('elyra', 'contents/properties', notebook_filename)

    assert response.code == 200
    assert json.loads(response.body) == expected_response_empty
