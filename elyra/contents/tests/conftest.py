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

from elyra.contents.tests.test_utils import create_dir
from elyra.contents.tests.test_utils import create_file
from elyra.contents.tests.test_utils import empty_notebook_content
from elyra.contents.tests.test_utils import notebook_content
from elyra.contents.tests.test_utils import python_content
from elyra.contents.tests.test_utils import r_content
from elyra.contents.tests.test_utils import text_content


@pytest.fixture
def directory_name():
    return "dir.py"


@pytest.fixture
def text_filename():
    return "test.txt"


@pytest.fixture
def notebook_filename():
    return "test.ipynb"


@pytest.fixture
def python_filename():
    return "test.py"


@pytest.fixture
def r_filename():
    return "test.r"


@pytest.fixture
def create_directory(jp_root_dir, directory_name):
    create_dir(jp_root_dir, directory_name)


@pytest.fixture
def create_text_file(jp_root_dir, text_filename):
    create_file(jp_root_dir, text_filename, text_content)


@pytest.fixture
def create_notebook_file(jp_root_dir, notebook_filename):
    create_file(jp_root_dir, notebook_filename, json.dumps(notebook_content))


@pytest.fixture
def create_python_file(jp_root_dir, python_filename):
    create_file(jp_root_dir, python_filename, python_content)


@pytest.fixture
def create_r_file(jp_root_dir, r_filename):
    create_file(jp_root_dir, r_filename, r_content)


@pytest.fixture
def create_empty_notebook_file(jp_root_dir, notebook_filename):
    create_file(jp_root_dir, notebook_filename, json.dumps(empty_notebook_content))


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
