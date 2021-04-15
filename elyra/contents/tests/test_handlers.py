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
import pytest
import os

from tornado.httpclient import HTTPClientError
from .test_utils import expected_http_error


async def test_file_not_found(jp_fetch):
    filepath = "nofile.py"

    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'contents/properties', filepath)
    assert expected_http_error(e, 404)


async def test_file_is_not_directory(jp_fetch, jp_root_dir):
    # print(test_directory)
    directory = "dir.py"
    dir_path = os.path.join(jp_root_dir, directory)

    os.mkdir(dir_path)
    print(dir_path)
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch('elyra', 'contents/properties', dir_path)
    assert expected_http_error(e, 400)

    os.rmdir(directory)
