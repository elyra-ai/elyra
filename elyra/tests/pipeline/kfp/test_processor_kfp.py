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
import os
from pathlib import Path
import tarfile
from unittest import mock

from kfp import compiler as kfp_argo_compiler
import pytest
import yaml

from elyra.metadata.metadata import Metadata
from elyra.pipeline.catalog_connector import FilesystemComponentCatalogConnector
from elyra.pipeline.catalog_connector import UrlComponentCatalogConnector
from elyra.pipeline.component import Component
from elyra.pipeline.kfp.processor_kfp import KfpPipelineProcessor
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.tests.pipeline.test_pipeline_parser import _read_pipeline_resource


@pytest.fixture
def processor(setup_factory_data):
    processor = KfpPipelineProcessor(os.getcwd())
    return processor


@pytest.fixture
def pipeline():
    pipeline_resource = _read_pipeline_resource("resources/sample_pipelines/pipeline_3_node_sample.json")
    return PipelineParser.parse(pipeline_resource)


@pytest.fixture
def sample_metadata():
    return {
        "api_endpoint": "http://examples.com:31737",
        "cos_endpoint": "http://examples.com:31671",
        "cos_username": "example",
        "cos_password": "example123",
        "cos_bucket": "test",
        "engine": "Argo",
        "tags": [],
    }


def test_fail_get_metadata_configuration_invalid_namespace(processor):
    with pytest.raises(RuntimeError):
        processor._get_metadata_configuration(schemaspace="non_existent_namespace", name="non_existent_metadata")


def test_generate_dependency_archive(processor):
    pipelines_test_file = processor.root_dir + "/elyra/tests/pipeline/resources/archive/test.ipynb"
    pipeline_dependencies = ["airflow.json"]
    correct_filelist = ["test.ipynb", "airflow.json"]
    component_parameters = {
        "filename": pipelines_test_file,
        "dependencies": pipeline_dependencies,
        "runtime_image": "tensorflow/tensorflow:latest",
    }
    test_operation = GenericOperation(
        id="123e4567-e89b-12d3-a456-426614174000",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_params=component_parameters,
    )

    archive_location = processor._generate_dependency_archive(test_operation)

    tar_content = []
    with tarfile.open(archive_location, "r:gz") as tar:
        for tarinfo in tar:
            if tarinfo.isreg():
                print(tarinfo.name)
                tar_content.append(tarinfo.name)

    assert sorted(correct_filelist) == sorted(tar_content)


def test_fail_generate_dependency_archive(processor):
    pipelines_test_file = processor.root_dir + "/elyra/pipeline/tests/resources/archive/test.ipynb"
    pipeline_dependencies = ["non_existent_file.json"]
    component_parameters = {
        "filename": pipelines_test_file,
        "dependencies": pipeline_dependencies,
        "runtime_image": "tensorflow/tensorflow:latest",
    }
    test_operation = GenericOperation(
        id="123e4567-e89b-12d3-a456-426614174000",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_params=component_parameters,
    )

    with pytest.raises(Exception):
        processor._generate_dependency_archive(test_operation)


def test_get_dependency_source_dir(processor):
    pipelines_test_file = "elyra/pipeline/tests/resources/archive/test.ipynb"
    processor.root_dir = "/this/is/an/abs/path/"
    correct_filepath = "/this/is/an/abs/path/elyra/pipeline/tests/resources/archive"
    component_parameters = {"filename": pipelines_test_file, "runtime_image": "tensorflow/tensorflow:latest"}
    test_operation = GenericOperation(
        id="123e4567-e89b-12d3-a456-426614174000",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_params=component_parameters,
    )

    filepath = processor._get_dependency_source_dir(test_operation)

    assert filepath == correct_filepath


def test_get_dependency_archive_name(processor):
    pipelines_test_file = "elyra/pipeline/tests/resources/archive/test.ipynb"
    correct_filename = "test-this-is-a-test-id.tar.gz"
    component_parameters = {"filename": pipelines_test_file, "runtime_image": "tensorflow/tensorflow:latest"}
    test_operation = GenericOperation(
        id="this-is-a-test-id",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_params=component_parameters,
    )

    filename = processor._get_dependency_archive_name(test_operation)

    assert filename == correct_filename


def test_collect_envs(processor):
    pipelines_test_file = "elyra/pipeline/tests/resources/archive/test.ipynb"

    # add system-owned envs with bogus values to ensure they get set to system-derived values,
    # and include some user-provided edge cases
    operation_envs = [
        'ELYRA_RUNTIME_ENV="bogus_runtime"',
        'ELYRA_ENABLE_PIPELINE_INFO="bogus_pipeline"',
        "ELYRA_WRITABLE_CONTAINER_DIR=",  # simulate operation reference in pipeline
        'AWS_ACCESS_KEY_ID="bogus_key"',
        'AWS_SECRET_ACCESS_KEY="bogus_secret"',
        "USER_EMPTY_VALUE=  ",
        "USER_TWO_EQUALS=KEY=value",
        "USER_NO_VALUE=",
    ]

    component_parameters = {
        "filename": pipelines_test_file,
        "env_vars": operation_envs,
        "runtime_image": "tensorflow/tensorflow:latest",
    }
    test_operation = GenericOperation(
        id="this-is-a-test-id",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_params=component_parameters,
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


def test_process_list_value_function(processor):
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


def test_process_dictionary_value_function(processor):
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


def test_processing_url_runtime_specific_component(monkeypatch, processor, component_cache, sample_metadata, tmpdir):
    # Define the appropriate reader for a URL-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = UrlComponentCatalogConnector(kfp_supported_file_types)

    # Assign test resource location
    url = (
        "https://raw.githubusercontent.com/elyra-ai/elyra/master/"
        "elyra/tests/pipeline/resources/components/filter_text.yaml"
    )

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    entry_data = reader.get_entry_data({"url": url}, {})
    component_definition = entry_data.definition

    # Instantiate a url-based component
    component_id = "test_component"
    component = Component(
        id=component_id,
        name="Filter text",
        description="",
        op="filter-text",
        catalog_type="url-catalog",
        component_reference={"url": url},
        definition=component_definition,
        categories=[],
        properties=[],
    )

    # Fabricate the component cache to include single filename-based component for testing
    component_cache._component_cache[processor._type.name] = {
        "spoofed_catalog": {"components": {component_id: component}}
    }

    # Construct hypothetical operation for component
    operation_name = "Filter text test"
    operation_params = {"text": "path/to/text.txt", "pattern": "hello"}
    operation = Operation(
        id="filter-text-id",
        type="execution_node",
        classifier=component_id,
        name=operation_name,
        parent_operation_ids=[],
        component_params=operation_params,
    )

    # Build a mock runtime config for use in _cc_pipeline
    mocked_runtime = Metadata(name="test-metadata", display_name="test", schema_name="kfp", metadata=sample_metadata)

    mocked_func = mock.Mock(return_value="default", side_effect=[mocked_runtime, sample_metadata])
    monkeypatch.setattr(processor, "_get_metadata_configuration", mocked_func)

    # Construct single-operation pipeline
    pipeline = Pipeline(
        id="pipeline-id", name="kfp_test", runtime="kfp", runtime_config="test", source="filter_text.pipeline"
    )
    pipeline.operations[operation.id] = operation

    # Establish path and function to construct pipeline
    pipeline_path = os.path.join(tmpdir, "kfp_test.yaml")
    constructed_pipeline_function = lambda: processor._cc_pipeline(pipeline=pipeline, pipeline_name="test_pipeline")

    # TODO Check against both argo and tekton compilations
    # Compile pipeline and save into pipeline_path
    kfp_argo_compiler.Compiler().compile(constructed_pipeline_function, pipeline_path)

    # Read contents of pipeline YAML
    with open(pipeline_path) as f:
        pipeline_yaml = yaml.safe_load(f.read())

    # Check the pipeline file contents for correctness
    pipeline_template = pipeline_yaml["spec"]["templates"][0]
    assert pipeline_template["metadata"]["annotations"]["pipelines.kubeflow.org/task_display_name"] == operation_name
    assert pipeline_template["inputs"]["artifacts"][0]["raw"]["data"] == operation_params["text"]


def test_processing_filename_runtime_specific_component(
    monkeypatch, processor, component_cache, sample_metadata, tmpdir
):
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    # Assign test resource location
    absolute_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "resources", "components", "download_data.yaml")
    )

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    entry_data = reader.get_entry_data({"path": absolute_path}, {})
    component_definition = entry_data.definition

    # Instantiate a file-based component
    component_id = "test-component"
    component = Component(
        id=component_id,
        name="Download data",
        description="",
        op="download-data",
        catalog_type="elyra-kfp-examples-catalog",
        component_reference={"path": absolute_path},
        definition=component_definition,
        properties=[],
        categories=[],
    )

    # Fabricate the component cache to include single filename-based component for testing
    component_cache._component_cache[processor._type.name] = {
        "spoofed_catalog": {"components": {component_id: component}}
    }

    # Construct hypothetical operation for component
    operation_name = "Download data test"
    operation_params = {
        "url": "https://raw.githubusercontent.com/elyra-ai/elyra/master/tests/assets/helloworld.ipynb",
        "curl_options": "--location",
    }
    operation = Operation(
        id="download-data-id",
        type="execution_node",
        classifier=component_id,
        name=operation_name,
        parent_operation_ids=[],
        component_params=operation_params,
    )

    # Build a mock runtime config for use in _cc_pipeline
    mocked_runtime = Metadata(name="test-metadata", display_name="test", schema_name="kfp", metadata=sample_metadata)

    mocked_func = mock.Mock(return_value="default", side_effect=[mocked_runtime, sample_metadata])
    monkeypatch.setattr(processor, "_get_metadata_configuration", mocked_func)

    # Construct single-operation pipeline
    pipeline = Pipeline(
        id="pipeline-id", name="kfp_test", runtime="kfp", runtime_config="test", source="download_data.pipeline"
    )
    pipeline.operations[operation.id] = operation

    # Establish path and function to construct pipeline
    pipeline_path = os.path.join(tmpdir, "kfp_test.yaml")
    constructed_pipeline_function = lambda: processor._cc_pipeline(pipeline=pipeline, pipeline_name="test_pipeline")

    # TODO Check against both argo and tekton compilations
    # Compile pipeline and save into pipeline_path
    kfp_argo_compiler.Compiler().compile(constructed_pipeline_function, pipeline_path)

    # Read contents of pipeline YAML
    with open(pipeline_path) as f:
        pipeline_yaml = yaml.safe_load(f.read())

    # Check the pipeline file contents for correctness
    pipeline_template = pipeline_yaml["spec"]["templates"][0]
    assert pipeline_template["metadata"]["annotations"]["pipelines.kubeflow.org/task_display_name"] == operation_name
    assert pipeline_template["container"]["command"][3] == operation_params["url"]


def test_cc_pipeline_component_no_input(monkeypatch, processor, component_cache, sample_metadata, tmpdir):
    """
    Verifies that cc_pipeline can handle KFP component definitions that don't
    include any inputs
    """
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    # Assign test resource location
    cpath = (Path(__file__).parent / ".." / "resources" / "components" / "kfp_test_operator_no_inputs.yaml").resolve()
    assert cpath.is_file()
    cpath = str(cpath)

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    entry_data = reader.get_entry_data({"path": cpath}, {})
    component_definition = entry_data.definition

    # Instantiate a file-based component
    component_id = "test-component"
    component = Component(
        id=component_id,
        name="No input data",
        description="",
        op="no-input-data",
        catalog_type="elyra-kfp-examples-catalog",
        component_reference={"path": cpath},
        definition=component_definition,
        properties=[],
        categories=[],
    )

    # Fabricate the component cache to include single filename-based component for testing
    component_cache._component_cache[processor._type.name] = {
        "spoofed_catalog": {"components": {component_id: component}}
    }

    # Construct hypothetical operation for component
    operation_name = "no-input-test"
    operation_params = {}
    operation = Operation(
        id="no-input-id",
        type="execution_node",
        classifier=component_id,
        name=operation_name,
        parent_operation_ids=[],
        component_params=operation_params,
    )

    # Build a mock runtime config for use in _cc_pipeline
    mocked_runtime = Metadata(name="test-metadata", display_name="test", schema_name="kfp", metadata=sample_metadata)

    mocked_func = mock.Mock(return_value="default", side_effect=[mocked_runtime, sample_metadata])
    monkeypatch.setattr(processor, "_get_metadata_configuration", mocked_func)

    # Construct single-operation pipeline
    pipeline = Pipeline(
        id="pipeline-id", name="kfp_test", runtime="kfp", runtime_config="test", source="no_input.pipeline"
    )
    pipeline.operations[operation.id] = operation

    constructed_pipeline_function = lambda: processor._cc_pipeline(pipeline=pipeline, pipeline_name="test_pipeline")
    pipeline_path = str(Path(tmpdir) / "no_inputs_test.yaml")

    # Compile pipeline and save into pipeline_path
    kfp_argo_compiler.Compiler().compile(constructed_pipeline_function, pipeline_path)
