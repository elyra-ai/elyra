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
from pathlib import Path
import tarfile

import pytest

from elyra.pipeline.kfp.kfp_processor import KfpPipelineProcessor
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.properties import ElyraProperty
from elyra.pipeline.registry import PipelineProcessorRegistry


# ---------------------------------------------------
# Fixtures
# ---------------------------------------------------


@pytest.fixture
def processor() -> KfpPipelineProcessor:
    """
    Instantiate a Kubeflow Pipelines processor.
    """
    root_dir = str((Path(__file__).parent / "..").resolve())
    processor = KfpPipelineProcessor(root_dir=root_dir)
    return processor


# ---------------------------------------------------
# Tests for  RuntimePipelineProcessor._get_metadata_configuration
# ---------------------------------------------------


def test_fail_get_metadata_configuration_invalid_namespace(processor: KfpPipelineProcessor):
    with pytest.raises(RuntimeError):
        processor._get_metadata_configuration(schemaspace="non_existent_namespace", name="non_existent_metadata")


# ---------------------------------------------------
# Tests for  RuntimePipelineProcessor._generate_dependency_archive
# ---------------------------------------------------


def test_generate_dependency_archive(processor: KfpPipelineProcessor):
    pipelines_test_file = str((Path(__file__).parent / "resources" / "archive" / "test.ipynb").resolve())
    pipeline_dependencies = ["airflow.json"]
    correct_filelist = ["test.ipynb", "airflow.json"]
    component_properties = {
        "filename": pipelines_test_file,
        "dependencies": pipeline_dependencies,
        "runtime_image": "tensorflow/tensorflow:latest",
    }
    test_operation = GenericOperation(
        id="123e4567-e89b-12d3-a456-426614174000",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_props=component_properties,
    )

    archive_location = processor._generate_dependency_archive(test_operation)

    tar_content = []
    with tarfile.open(archive_location, "r:gz") as tar:
        for tarinfo in tar:
            if tarinfo.isreg():
                tar_content.append(tarinfo.name)

    assert sorted(correct_filelist) == sorted(tar_content)


def test_fail_generate_dependency_archive(processor: KfpPipelineProcessor):
    pipelines_test_file = "this/is/a/rel/path/test.ipynb"
    pipeline_dependencies = ["non_existent_file.json"]
    component_properties = {
        "filename": pipelines_test_file,
        "dependencies": pipeline_dependencies,
        "runtime_image": "tensorflow/tensorflow:latest",
    }
    test_operation = GenericOperation(
        id="123e4567-e89b-12d3-a456-426614174000",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_props=component_properties,
    )

    with pytest.raises(Exception):
        processor._generate_dependency_archive(test_operation)


# ---------------------------------------------------
# Tests for  RuntimePipelineProcessor._get_dependency_source_dir
# ---------------------------------------------------


def test_get_dependency_source_dir(processor: KfpPipelineProcessor):
    pipelines_test_file = "this/is/a/rel/path/test.ipynb"
    processor.root_dir = "/this/is/an/abs/path/"
    correct_filepath = "/this/is/an/abs/path/this/is/a/rel/path"
    component_properties = {"filename": pipelines_test_file, "runtime_image": "tensorflow/tensorflow:latest"}
    test_operation = GenericOperation(
        id="123e4567-e89b-12d3-a456-426614174000",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_props=component_properties,
    )

    filepath = processor._get_dependency_source_dir(test_operation)

    assert filepath == correct_filepath


# ---------------------------------------------------
# Tests for  RuntimePipelineProcessor._get_dependency_archive_name
# ---------------------------------------------------


def test_get_dependency_archive_name(processor: KfpPipelineProcessor):
    pipelines_test_file = "this/is/a/rel/path/test.ipynb"
    correct_filename = "test-this-is-a-test-id.tar.gz"
    component_properties = {"filename": pipelines_test_file, "runtime_image": "tensorflow/tensorflow:latest"}
    test_operation = GenericOperation(
        id="this-is-a-test-id",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_props=component_properties,
    )

    filename = processor._get_dependency_archive_name(test_operation)

    assert filename == correct_filename


# ---------------------------------------------------
# Tests for  RuntimePipelineProcessor._collect_envs
# ---------------------------------------------------


def test_collect_envs(processor: KfpPipelineProcessor):
    pipelines_test_file = "this/is/a/rel/path/test.ipynb"

    # add system-owned envs with bogus values to ensure they get set to system-derived values,
    # and include some user-provided edge cases
    operation_envs = [
        {"env_var": "ELYRA_RUNTIME_ENV", "value": '"bogus_runtime"'},
        {"env_var": "ELYRA_ENABLE_PIPELINE_INFO", "value": '"bogus_pipeline"'},
        {"env_var": "ELYRA_WRITABLE_CONTAINER_DIR", "value": ""},  # simulate operation reference in pipeline
        {"env_var": "AWS_ACCESS_KEY_ID", "value": '"bogus_key"'},
        {"env_var": "AWS_SECRET_ACCESS_KEY", "value": '"bogus_secret"'},
        {"env_var": "USER_EMPTY_VALUE", "value": "  "},
        {"env_var": "USER_TWO_EQUALS", "value": "KEY=value"},
        {"env_var": "USER_NO_VALUE", "value": ""},
    ]
    converted_envs = ElyraProperty.create_instance("env_vars", operation_envs)

    test_operation = GenericOperation(
        id="this-is-a-test-id",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_props={"filename": pipelines_test_file, "runtime_image": "tensorflow/tensorflow:latest"},
        elyra_props={"env_vars": converted_envs},
    )

    envs = processor._collect_envs(test_operation, cos_secret=None, cos_username="Alice", cos_password="secret")

    assert envs["ELYRA_RUNTIME_ENV"] == "kfp"
    assert envs["AWS_ACCESS_KEY_ID"] == "Alice"
    assert envs["AWS_SECRET_ACCESS_KEY"] == "secret"
    assert envs["ELYRA_ENABLE_PIPELINE_INFO"] == "True"
    assert envs["ELYRA_WRITABLE_CONTAINER_DIR"] == "/tmp"
    assert "USER_EMPTY_VALUE" not in envs
    assert envs["USER_TWO_EQUALS"] == "KEY=value"
    assert "USER_NO_VALUE" not in envs

    # Repeat with non-None secret - ensure user and password envs are not present, but others are
    envs = processor._collect_envs(test_operation, cos_secret="secret", cos_username="Alice", cos_password="secret")

    assert envs["ELYRA_RUNTIME_ENV"] == "kfp"
    assert "AWS_ACCESS_KEY_ID" not in envs
    assert "AWS_SECRET_ACCESS_KEY" not in envs
    assert envs["ELYRA_ENABLE_PIPELINE_INFO"] == "True"
    assert envs["ELYRA_WRITABLE_CONTAINER_DIR"] == "/tmp"
    assert "USER_EMPTY_VALUE" not in envs
    assert envs["USER_TWO_EQUALS"] == "KEY=value"
    assert "USER_NO_VALUE" not in envs


# ---------------------------------------------------
# Tests for  RuntimePipelineProcessor._process_list_value_function
# ---------------------------------------------------


def test_process_list_value_function(processor: KfpPipelineProcessor):
    # Test values that will be successfully converted to list
    assert processor._process_list_value("") == []
    assert processor._process_list_value(None) == []
    assert processor._process_list_value("[]") == []
    assert processor._process_list_value("None") == []
    assert processor._process_list_value("['elem1']") == ["elem1"]
    assert processor._process_list_value("['elem1', 'elem2', 'elem3']") == ["elem1", "elem2", "elem3"]
    assert processor._process_list_value("  ['elem1',   'elem2' , 'elem3']  ") == ["elem1", "elem2", "elem3"]
    assert processor._process_list_value("[1, 2]") == [1, 2]
    assert processor._process_list_value("[True, False, True]") == [True, False, True]
    assert processor._process_list_value("[{'obj': 'val', 'obj2': 'val2'}, {}]") == [{"obj": "val", "obj2": "val2"}, {}]

    # Test values that will not be successfully converted to list
    assert processor._process_list_value("[[]") == "[[]"
    assert processor._process_list_value("[elem1, elem2]") == "[elem1, elem2]"
    assert processor._process_list_value("elem1, elem2") == "elem1, elem2"
    assert processor._process_list_value("  elem1, elem2  ") == "elem1, elem2"
    assert processor._process_list_value("'elem1', 'elem2'") == "'elem1', 'elem2'"


# ---------------------------------------------------
# Tests for  RuntimePipelineProcessor._process_dictionary_value
# ---------------------------------------------------


def test_process_dictionary_value_function(processor: KfpPipelineProcessor):
    # Test values that will be successfully converted to dictionary
    assert processor._process_dictionary_value("") == {}
    assert processor._process_dictionary_value(None) == {}
    assert processor._process_dictionary_value("{}") == {}
    assert processor._process_dictionary_value("None") == {}
    assert processor._process_dictionary_value("{'key': 'value'}") == {"key": "value"}

    dict_as_str = "{'key1': 'value', 'key2': 'value'}"
    assert processor._process_dictionary_value(dict_as_str) == {"key1": "value", "key2": "value"}

    dict_as_str = "  {  'key1': 'value'  , 'key2'  : 'value'}  "
    assert processor._process_dictionary_value(dict_as_str) == {"key1": "value", "key2": "value"}

    dict_as_str = "{'key1': [1, 2, 3], 'key2': ['elem1', 'elem2']}"
    assert processor._process_dictionary_value(dict_as_str) == {"key1": [1, 2, 3], "key2": ["elem1", "elem2"]}

    dict_as_str = "{'key1': 2, 'key2': 'value', 'key3': True, 'key4': None, 'key5': [1, 2, 3]}"
    expected_value = {"key1": 2, "key2": "value", "key3": True, "key4": None, "key5": [1, 2, 3]}
    assert processor._process_dictionary_value(dict_as_str) == expected_value

    dict_as_str = "{'key1': {'key2': 2, 'key3': 3, 'key4': 4}, 'key5': {}}"
    expected_value = {
        "key1": {
            "key2": 2,
            "key3": 3,
            "key4": 4,
        },
        "key5": {},
    }
    assert processor._process_dictionary_value(dict_as_str) == expected_value

    # Test values that will not be successfully converted to dictionary
    assert processor._process_dictionary_value("{{}") == "{{}"
    assert processor._process_dictionary_value("{key1: value, key2: value}") == "{key1: value, key2: value}"
    assert processor._process_dictionary_value("  { key1: value, key2: value }  ") == "{ key1: value, key2: value }"
    assert processor._process_dictionary_value("key1: value, key2: value") == "key1: value, key2: value"
    assert processor._process_dictionary_value("{'key1': true}") == "{'key1': true}"
    assert processor._process_dictionary_value("{'key': null}") == "{'key': null}"

    dict_as_str = "{'key1': [elem1, elem2, elem3], 'key2': ['elem1', 'elem2']}"
    assert processor._process_dictionary_value(dict_as_str) == dict_as_str

    dict_as_str = "{'key1': {key2: 2}, 'key3': ['elem1', 'elem2']}"
    assert processor._process_dictionary_value(dict_as_str) == dict_as_str

    dict_as_str = "{'key1': {key2: 2}, 'key3': ['elem1', 'elem2']}"
    assert processor._process_dictionary_value(dict_as_str) == dict_as_str


@pytest.fixture
def processor_registry(monkeypatch, expected_runtimes) -> PipelineProcessorRegistry:
    PipelineProcessorRegistry.clear_instance()
    if expected_runtimes:
        monkeypatch.setenv("ELYRA_PROCESSOR_RUNTIMES", ",".join(expected_runtimes))
    ppr = PipelineProcessorRegistry.instance()
    yield ppr
    PipelineProcessorRegistry.clear_instance()


@pytest.mark.parametrize(
    "expected_runtimes",
    [
        ["local"],
        ["airflow", "kfp"],
        ["local", "airflow"],
        None,
    ],
)
def test_processor_registry_filtering(expected_runtimes, processor_registry):
    if expected_runtimes is None:
        expected_runtimes = ["local", "kfp", "airflow"]
    runtimes = processor_registry.get_all_processors()
    assert len(runtimes) == len(expected_runtimes)
    for runtime in runtimes:
        assert runtime.name in expected_runtimes
