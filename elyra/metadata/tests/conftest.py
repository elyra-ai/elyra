#
# Copyright 2018-2020 IBM Corporation
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
import os
import pytest
import sys
from traitlets.config import Config
import jupyter_core.paths

from notebook.utils import url_path_join
from tornado.escape import url_escape
from elyra.metadata import MetadataManager, SchemaManager, METADATA_TEST_NAMESPACE  # noqa: F401

from .test_utils import valid_metadata_json, invalid_metadata_json, another_metadata_json, byo_metadata_json, \
    invalid_json, create_json_file, create_instance


# BEGIN - Remove once transition to jupyter_server occurs
def mkdir(tmp_path, *parts):
    path = tmp_path.joinpath(*parts)
    if not path.exists():
        path.mkdir(parents=True)
    return path


config = pytest.fixture(lambda: {'NotebookApp': {"nbserver_extensions": {"elyra": True}}})
home_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "home"))
data_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "data"))
config_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "config"))
runtime_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "runtime"))
root_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "root_dir"))
template_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "templates"))
system_jupyter_path = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "share", "jupyter"))
env_jupyter_path = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "env", "share", "jupyter"))
system_config_path = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "etc", "jupyter"))
env_config_path = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "env", "etc", "jupyter"))


@pytest.fixture
def environ(
    monkeypatch,
    tmp_path,
    home_dir,
    data_dir,
    config_dir,
    runtime_dir,
    root_dir,
    system_jupyter_path,
    system_config_path,
    env_jupyter_path,
    env_config_path,
):
    monkeypatch.setenv("HOME", str(home_dir))
    monkeypatch.setenv("PYTHONPATH", os.pathsep.join(sys.path))
    monkeypatch.setenv("JUPYTER_NO_CONFIG", "1")
    monkeypatch.setenv("JUPYTER_CONFIG_DIR", str(config_dir))
    monkeypatch.setenv("JUPYTER_DATA_DIR", str(data_dir))
    monkeypatch.setenv("JUPYTER_RUNTIME_DIR", str(runtime_dir))
    monkeypatch.setenv("METADATA_TESTING", "1")  # enable metadata-tests namespace
    monkeypatch.setattr(jupyter_core.paths, "SYSTEM_JUPYTER_PATH", [str(system_jupyter_path)])
    monkeypatch.setattr(jupyter_core.paths, "ENV_JUPYTER_PATH", [str(env_jupyter_path)])
    monkeypatch.setattr(jupyter_core.paths, "SYSTEM_CONFIG_PATH", [str(system_config_path)])
    monkeypatch.setattr(jupyter_core.paths, "ENV_CONFIG_PATH", [str(env_config_path)])


# This method simulates the fetch pytest fixture defined in
# https://github.com/jupyter/jupyter_server/blob/master/jupyter_server/pytest_plugin.py
# It can be removed once the project transitions to using a jupyter server base.
# To convert the caller to use the jupyter_server form of fetch, remove the first
# parameter `self.request`.
def fetch(request, *parts, **kwargs):
    # Handle URL strings

    # Since base_url is already escaped, unescape it.
    path = url_escape(url_path_join(*parts), plus=False)

    # Make request.
    method = 'GET'
    if 'method' in kwargs and kwargs['method']:
        method = kwargs['method']

    body = None
    if 'body' in kwargs and kwargs['body']:
        body = kwargs['body']

    return request(method, path, data=body)
# END - Remove once transition to jupyter_server occurs


# These location fixtures will need to be revisited once we support multiple metadata storage types.
namespace_location = pytest.fixture(lambda data_dir:
                                    mkdir(data_dir, "metadata", METADATA_TEST_NAMESPACE))
bogus_location = pytest.fixture(lambda data_dir:
                                mkdir(data_dir, "metadata", "bogus"))
shared_location = pytest.fixture(lambda system_jupyter_path:
                                 mkdir(system_jupyter_path, "metadata", METADATA_TEST_NAMESPACE))
factory_location = pytest.fixture(lambda env_jupyter_path:
                                  mkdir(env_jupyter_path, "metadata", METADATA_TEST_NAMESPACE))


@pytest.fixture
def setup_hierarchy(environ, factory_location):
    # Only populate factory info
    byo_instance = byo_metadata_json
    byo_instance['display_name'] = 'factory'
    create_json_file(factory_location, 'byo_1.json', byo_instance)
    create_json_file(factory_location, 'byo_2.json', byo_instance)
    create_json_file(factory_location, 'byo_3.json', byo_instance)


@pytest.fixture
def store_manager(tests_manager):
    return tests_manager.metadata_store


@pytest.fixture(params=["elyra.metadata.storage.FileMetadataStore",
                        "elyra.metadata.tests.MockMetadataStore"])  # Add types as needed
def tests_manager(environ, namespace_location, request):
    metadata_mgr = MetadataManager(namespace=METADATA_TEST_NAMESPACE, metadata_store_class=request.param)
    store_mgr = metadata_mgr.metadata_store
    create_instance(store_mgr, namespace_location, 'valid', valid_metadata_json)
    create_instance(store_mgr, namespace_location, 'another', another_metadata_json)
    create_instance(store_mgr, namespace_location, 'invalid', invalid_metadata_json)
    create_instance(store_mgr, namespace_location, 'bad', invalid_json)
    return metadata_mgr


@pytest.fixture
def tests_hierarchy_manager(setup_hierarchy):  # Only uses FileMetadataStore for storage right now.
    return MetadataManager(namespace=METADATA_TEST_NAMESPACE)


@pytest.fixture
def schema_manager():
    schema_manager = SchemaManager.instance()
    yield schema_manager
    SchemaManager.clear_instance()


# FIXME - this is not tested.  Revisit once transition to jupyter_server occurs
@pytest.fixture
def init_elyra(configurable_serverapp, argv):
    app = configurable_serverapp(config=Config({'NotebookApp': {"nbserver_extensions": {"elyra": True}}}), argv=argv)
    yield app
    app.remove_server_info_file()
    app.remove_browser_open_file()
    app.cleanup_kernels()
