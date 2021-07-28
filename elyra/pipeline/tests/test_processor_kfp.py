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
import os
import tarfile
from unittest import mock

from kfp import compiler as kfp_argo_compiler
from kfp.components.structures import TaskSpec
import pytest

from elyra.metadata.metadata import Metadata
from elyra.pipeline.component import Component
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.processor_kfp import KfpPipelineProcessor
from elyra.pipeline.tests.test_pipeline_parser import _read_pipeline_resource


@pytest.fixture
def processor():
    processor = KfpPipelineProcessor(os.getcwd())
    return processor


@pytest.fixture
def pipeline():
    pipeline_resource = _read_pipeline_resource('resources/sample_pipelines/pipeline_3_node_sample.json')
    return PipelineParser.parse(pipeline_resource)


@pytest.fixture
def sample_metadata():
    return {"api_endpoint": "http://examples.com:31737",
            "cos_endpoint": "http://examples.com:31671",
            "cos_username": "example",
            "cos_password": "example123",
            "cos_bucket": "test",
            "engine": "Argo",
            "tags": []}


def test_fail_get_metadata_configuration_invalid_namespace(processor):
    with pytest.raises(RuntimeError):
        processor._get_metadata_configuration(namespace="non_existent_namespace",
                                              name='non_existent_metadata')


def test_generate_dependency_archive(processor):
    pipelines_test_file = processor.root_dir + '/elyra/pipeline/tests/resources/archive/test.ipynb'
    pipeline_dependencies = ['airflow.json']
    correct_filelist = ['test.ipynb', 'airflow.json']
    component_parameters = {
        'filename': pipelines_test_file,
        'dependencies': pipeline_dependencies,
        'runtime_image': 'tensorflow/tensorflow:latest'
    }
    test_operation = GenericOperation(id='123e4567-e89b-12d3-a456-426614174000',
                                      type='execution-node',
                                      classifier='execute-notebook-node',
                                      name='test',
                                      component_params=component_parameters)

    archive_location = processor._generate_dependency_archive(test_operation)

    tar_content = []
    with tarfile.open(archive_location, "r:gz") as tar:
        for tarinfo in tar:
            if tarinfo.isreg():
                print(tarinfo.name)
                tar_content.append(tarinfo.name)

    assert sorted(correct_filelist) == sorted(tar_content)


def test_fail_generate_dependency_archive(processor):
    pipelines_test_file = processor.root_dir + '/elyra/pipeline/tests/resources/archive/test.ipynb'
    pipeline_dependencies = ['non_existent_file.json']
    component_parameters = {
        'filename': pipelines_test_file,
        'dependencies': pipeline_dependencies,
        'runtime_image': 'tensorflow/tensorflow:latest'
    }
    test_operation = GenericOperation(id='123e4567-e89b-12d3-a456-426614174000',
                                      type='execution-node',
                                      classifier='execute-notebook-node',
                                      name='test',
                                      component_params=component_parameters)

    with pytest.raises(Exception):
        processor._generate_dependency_archive(test_operation)


def test_get_dependency_source_dir(processor):
    pipelines_test_file = 'elyra/pipeline/tests/resources/archive/test.ipynb'
    processor.root_dir = '/this/is/an/abs/path/'
    correct_filepath = '/this/is/an/abs/path/elyra/pipeline/tests/resources/archive'
    component_parameters = {
        'filename': pipelines_test_file,
        'runtime_image': 'tensorflow/tensorflow:latest'
    }
    test_operation = GenericOperation(id='123e4567-e89b-12d3-a456-426614174000',
                                      type='execution-node',
                                      classifier='execute-notebook-node',
                                      name='test',
                                      component_params=component_parameters)

    filepath = processor._get_dependency_source_dir(test_operation)

    assert filepath == correct_filepath


def test_get_dependency_archive_name(processor):
    pipelines_test_file = 'elyra/pipeline/tests/resources/archive/test.ipynb'
    correct_filename = 'test-this-is-a-test-id.tar.gz'
    component_parameters = {
        'filename': pipelines_test_file,
        'runtime_image': 'tensorflow/tensorflow:latest'
    }
    test_operation = GenericOperation(id='this-is-a-test-id',
                                      type='execution-node',
                                      classifier='execute-notebook-node',
                                      name='test',
                                      component_params=component_parameters)

    filename = processor._get_dependency_archive_name(test_operation)

    assert filename == correct_filename


def test_collect_envs(processor):
    pipelines_test_file = 'elyra/pipeline/tests/resources/archive/test.ipynb'

    # add system-owned envs with bogus values to ensure they get set to system-derived values,
    # and include some user-provided edge cases
    operation_envs = ['ELYRA_RUNTIME_ENV="bogus_runtime"',
                      'ELYRA_ENABLE_PIPELINE_INFO="bogus_pipeline"',
                      'ELYRA_WRITABLE_CONTAINER_DIR=',  # simulate operation reference in pipeline
                      'AWS_ACCESS_KEY_ID="bogus_key"',
                      'AWS_SECRET_ACCESS_KEY="bogus_secret"',
                      'USER_EMPTY_VALUE=  ',
                      'USER_TWO_EQUALS=KEY=value',
                      'USER_NO_VALUE=']

    component_parameters = {
        'filename': pipelines_test_file,
        'env_vars': operation_envs,
        'runtime_image': 'tensorflow/tensorflow:latest'
    }
    test_operation = GenericOperation(id='this-is-a-test-id',
                                      type='execution-node',
                                      classifier='execute-notebook-node',
                                      name='test',
                                      component_params=component_parameters)

    envs = processor._collect_envs(test_operation, cos_secret=None, cos_username='Alice', cos_password='secret')

    assert envs['ELYRA_RUNTIME_ENV'] == 'kfp'
    assert envs['AWS_ACCESS_KEY_ID'] == 'Alice'
    assert envs['AWS_SECRET_ACCESS_KEY'] == 'secret'
    assert envs['ELYRA_ENABLE_PIPELINE_INFO'] == 'True'
    assert envs['ELYRA_WRITABLE_CONTAINER_DIR'] == '/tmp'
    assert envs['USER_EMPTY_VALUE'] == '  '
    assert envs['USER_TWO_EQUALS'] == 'KEY=value'
    assert 'USER_NO_VALUE' not in envs


# Repeat with non-None secret - ensure user and password envs are not present, but others are
    envs = processor._collect_envs(test_operation, cos_secret='secret', cos_username='Alice', cos_password='secret')

    assert envs['ELYRA_RUNTIME_ENV'] == 'kfp'
    assert 'AWS_ACCESS_KEY_ID' not in envs
    assert 'AWS_SECRET_ACCESS_KEY' not in envs
    assert envs['ELYRA_ENABLE_PIPELINE_INFO'] == 'True'
    assert envs['ELYRA_WRITABLE_CONTAINER_DIR'] == '/tmp'
    assert envs['USER_EMPTY_VALUE'] == '  '
    assert envs['USER_TWO_EQUALS'] == 'KEY=value'
    assert 'USER_NO_VALUE' not in envs


@pytest.mark.skip(reason="failing - need to evaluate function at kfp compiler level")
def test_processing_url_runtime_specific_component(monkeypatch, processor, sample_metadata):
    # Assign test resource location
    url = 'https://raw.githubusercontent.com/elyra-ai/elyra/master/elyra/' \
          'pipeline/resources/kfp/filter_text_using_shell_and_grep/component.yaml'

    # Instantiate a url-based component
    component = Component(id="filter-text",
                          name="Filter text",
                          description="",
                          op="filter-text",
                          source_type="url",
                          source=url,
                          properties=[],
                          catalog_entry_id="")

    # Replace cached component registry with single url-based component for testing
    processor._component_registry._cached_components = [component]

    # Construct hypothetical operation for component
    operation = Operation(id='filter-text-id',
                          type='execution_node',
                          classifier='filter-text',
                          name='Filter text',
                          parent_operation_ids=[],
                          component_params={"text": "resources/components/filter.txt", "pattern": "hello"})

    # Build a mock runtime config for use in _cc_pipeline
    mocked_runtime = Metadata(name="test-metadata",
                              display_name="test",
                              schema_name="airflow",
                              metadata=sample_metadata)

    mocked_func = mock.Mock(return_value="default", side_effect=[mocked_runtime, sample_metadata])
    monkeypatch.setattr(processor, "_get_metadata_configuration", mocked_func)

    # Construct single-operation pipeline
    pipeline = Pipeline(id='pipeline-id',
                        name='untitled',
                        runtime='kfp',
                        runtime_config='test',
                        source='filter_text.pipeline')
    pipeline.operations[operation.id] = operation

    # Process pipeline with a scaled-down version of the processor cc_pipeline function
    constructed_pipeline = processor._cc_pipeline(pipeline=pipeline, pipeline_name='test_pipeline')

    # Ensure the pipeline operation was properly processed for execution, creating a KFP TaskSpec object
    assert isinstance(constructed_pipeline[operation.id], TaskSpec)
    assert constructed_pipeline[operation.id].component_ref.url == url


@pytest.mark.skip(reason="failing - need to evaluate function at kfp compiler level")
def test_processing_filename_runtime_specific_component(monkeypatch, processor, sample_metadata, tmpdir):
    # Instantiate a file-based component
    component = Component(id="filter-text",
                          name="Filter text",
                          description="",
                          op="filter-text",
                          source_type="filename",
                          source="kfp/filter_text_using_shell_and_grep/component.yaml",
                          properties=[],
                          catalog_entry_id="")

    # Replace cached component registry with single filename-based component for testing
    processor._component_registry._cached_components = [component]

    # Construct hypothetical operation for component
    operation = Operation(id='filter-text-id',
                          type='execution_node',
                          classifier='filter-text',
                          name='Filter text',
                          parent_operation_ids=[],
                          component_params={"text": "resources/components/filter.txt", "pattern": "hello"})

    # Build a mock runtime config for use in _cc_pipeline
    mocked_runtime = Metadata(name="test-metadata",
                              display_name="test",
                              schema_name="airflow",
                              metadata=sample_metadata)

    mocked_func = mock.Mock(return_value="default", side_effect=[mocked_runtime, sample_metadata])
    monkeypatch.setattr(processor, "_get_metadata_configuration", mocked_func)

    # Construct single-operation pipeline
    pipeline = Pipeline(id='pipeline-id',
                        name='untitled',
                        runtime='kfp',
                        runtime_config='test-metadata',
                        source='filter_text.pipeline')
    pipeline.operations[operation.id] = operation

    # Process pipeline with a scaled-down version of the processor cc_pipeline function
    pipeline_path = os.path.join(tmpdir, "test_pipeline.yaml")

    # We arent able to access the container op level here since the runtime component is a taskspec
    constructed_pipeline_function = lambda: processor._cc_pipeline(pipeline=pipeline, pipeline_name='test_pipeline')

    # We can check again both argo and tekton compilations
    compiled_pipeline = kfp_argo_compiler.Compiler().compile(constructed_pipeline_function, pipeline_path)

    # we can check the pipeline file for `correctness`
    print(compiled_pipeline)

    # constructed_pipeline = processor._cc_pipeline(pipeline=pipeline, pipeline_name='test_pipeline')

    # Ensure the pipeline operation was properly processed for execution, creating a KFP TaskSpec object
    # assert isinstance(constructed_pipeline[operation.id], TaskSpec)

    # filename = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", component.source))
    # assert constructed_pipeline[operation.id].component_ref.url == filename
