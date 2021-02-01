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

from elyra.metadata import MetadataManager, SchemaManager, METADATA_TEST_NAMESPACE  # noqa: F401

from .test_utils import valid_metadata_json, invalid_metadata_json, another_metadata_json, byo_metadata_json, \
    invalid_json, invalid_schema_name_json, create_json_file, create_instance


def mkdir(tmp_path, *parts):
    path = tmp_path.joinpath(*parts)
    if not path.exists():
        path.mkdir(parents=True)
    return path


# These location fixtures will need to be revisited once we support multiple metadata storage types.
namespace_location = pytest.fixture(lambda jp_data_dir:
                                    mkdir(jp_data_dir, "metadata", METADATA_TEST_NAMESPACE))
bogus_location = pytest.fixture(lambda jp_data_dir:
                                mkdir(jp_data_dir, "metadata", "bogus"))
shared_location = pytest.fixture(lambda jp_system_jupyter_path:
                                 mkdir(jp_system_jupyter_path, "metadata", METADATA_TEST_NAMESPACE))
factory_location = pytest.fixture(lambda jp_env_jupyter_path:
                                  mkdir(jp_env_jupyter_path, "metadata", METADATA_TEST_NAMESPACE))


@pytest.fixture
def setup_data(namespace_location):
    create_json_file(namespace_location, 'valid.json', valid_metadata_json)
    create_json_file(namespace_location, 'another.json', another_metadata_json)
    create_json_file(namespace_location, 'invalid.json', invalid_metadata_json)


@pytest.fixture
def setup_hierarchy(jp_environ, factory_location):
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
def tests_manager(jp_environ, namespace_location, request):
    metadata_mgr = MetadataManager(namespace=METADATA_TEST_NAMESPACE, metadata_store_class=request.param)
    store_mgr = metadata_mgr.metadata_store
    create_instance(store_mgr, namespace_location, 'valid', valid_metadata_json)
    create_instance(store_mgr, namespace_location, 'another', another_metadata_json)
    create_instance(store_mgr, namespace_location, 'invalid', invalid_metadata_json)
    create_instance(store_mgr, namespace_location, 'bad', invalid_json)
    create_instance(store_mgr, namespace_location, 'invalid_schema_name', invalid_schema_name_json)
    return metadata_mgr


@pytest.fixture
def tests_hierarchy_manager(setup_hierarchy):  # Only uses FileMetadataStore for storage right now.
    return MetadataManager(namespace=METADATA_TEST_NAMESPACE)


@pytest.fixture
def schema_manager():
    schema_manager = SchemaManager.instance()
    yield schema_manager
    SchemaManager.clear_instance()


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
