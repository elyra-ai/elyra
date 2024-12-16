#
# Copyright 2018-2025 Elyra Authors
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

from elyra.metadata.manager import MetadataManager
from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE
from elyra.metadata.schema import SchemaManager
from elyra.tests.metadata.test_utils import another_metadata_json
from elyra.tests.metadata.test_utils import byo_metadata_json
from elyra.tests.metadata.test_utils import create_instance
from elyra.tests.metadata.test_utils import create_json_file
from elyra.tests.metadata.test_utils import invalid_json
from elyra.tests.metadata.test_utils import invalid_metadata_json
from elyra.tests.metadata.test_utils import invalid_schema_name_json
from elyra.tests.metadata.test_utils import valid_metadata_json


def mkdir(tmp_path, *parts):
    path = tmp_path.joinpath(*parts)
    if not path.exists():
        path.mkdir(parents=True)
    return path


# These location fixtures will need to be revisited once we support multiple metadata storage types.
schemaspace_location = pytest.fixture(lambda jp_data_dir: mkdir(jp_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
bogus_location = pytest.fixture(lambda jp_data_dir: mkdir(jp_data_dir, "metadata", "bogus"))
shared_location = pytest.fixture(
    lambda jp_system_jupyter_path: mkdir(jp_system_jupyter_path, "metadata", METADATA_TEST_SCHEMASPACE)
)
factory_location = pytest.fixture(
    lambda jp_env_jupyter_path: mkdir(jp_env_jupyter_path, "metadata", METADATA_TEST_SCHEMASPACE)
)


@pytest.fixture
def setup_data(schemaspace_location):
    create_json_file(schemaspace_location, "valid.json", valid_metadata_json)
    create_json_file(schemaspace_location, "another.json", another_metadata_json)
    create_json_file(schemaspace_location, "invalid.json", invalid_metadata_json)


@pytest.fixture
def setup_hierarchy(jp_environ, factory_location):
    # Only populate factory info
    byo_instance = byo_metadata_json
    byo_instance["display_name"] = "factory"
    create_json_file(factory_location, "byo_1.json", byo_instance)
    create_json_file(factory_location, "byo_2.json", byo_instance)
    create_json_file(factory_location, "byo_3.json", byo_instance)


@pytest.fixture
def store_manager(tests_manager):
    return tests_manager.metadata_store


@pytest.fixture(
    params=["elyra.metadata.storage.FileMetadataStore", "elyra.tests.metadata.test_utils.MockMetadataStore"]
)  # Add types as needed
def tests_manager(jp_environ, schemaspace_location, request):
    metadata_mgr = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE, metadata_store_class=request.param)
    store_mgr = metadata_mgr.metadata_store
    create_instance(store_mgr, schemaspace_location, "valid", valid_metadata_json)
    create_instance(store_mgr, schemaspace_location, "another", another_metadata_json)
    create_instance(store_mgr, schemaspace_location, "invalid", invalid_metadata_json)
    create_instance(store_mgr, schemaspace_location, "bad", invalid_json)
    create_instance(store_mgr, schemaspace_location, "invalid_schema_name", invalid_schema_name_json)
    return metadata_mgr


@pytest.fixture
def tests_hierarchy_manager(setup_hierarchy):  # Only uses FileMetadataStore for storage right now.
    return MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)


@pytest.fixture
def schema_manager():
    schema_manager = SchemaManager.instance()
    yield schema_manager
    SchemaManager.clear_instance()


# Set Elyra server extension as enabled (overriding server_config fixture from jupyter_server)
@pytest.fixture
def jp_server_config():
    return {"ServerApp": {"jpserver_extensions": {"elyra": True}}}
