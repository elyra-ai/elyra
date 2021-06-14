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
import pytest
import tarfile
from elyra.pipeline.processor_kfp import KfpPipelineProcessor
from elyra.pipeline.pipeline import Operation as Op
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.tests.test_pipeline_parser import _read_pipeline_resource


@pytest.fixture
def processor():
    processor = KfpPipelineProcessor(os.getcwd())
    return processor


@pytest.fixture
def pipeline():
    pipeline_resource = _read_pipeline_resource('resources/sample_pipelines/pipeline_3_node_sample.json')
    return PipelineParser.parse(pipeline_resource)


def test_fail_get_metadata_configuration_invalid_namespace(processor):
    with pytest.raises(RuntimeError):
        processor._get_metadata_configuration(namespace="non_existent_namespace",
                                              name='non_existent_metadata')


def test_generate_dependency_archive(processor):
    pipelines_test_file = processor.root_dir + '/elyra/pipeline/tests/resources/archive/test.ipynb'
    pipeline_dependencies = ['airflow.json']
    correct_filelist = ['test.ipynb', 'airflow.json']
    test_operation = Op(id='123e4567-e89b-12d3-a456-426614174000',
                        type='execution-node',
                        classifier='kfp',
                        name='test',
                        filename=pipelines_test_file,
                        dependencies=pipeline_dependencies,
                        runtime_image='tensorflow/tensorflow:latest')

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

    test_operation = Op(id='123e4567-e89b-12d3-a456-426614174000',
                        type='execution-node',
                        classifier='kfp',
                        name='test',
                        filename=pipelines_test_file,
                        dependencies=pipeline_dependencies,
                        runtime_image='tensorflow/tensorflow:latest')

    with pytest.raises(Exception):
        processor._generate_dependency_archive(test_operation)


def test_get_dependency_source_dir(processor):
    pipelines_test_file = 'elyra/pipeline/tests/resources/archive/test.ipynb'
    processor.root_dir = '/this/is/an/abs/path/'
    correct_filepath = '/this/is/an/abs/path/elyra/pipeline/tests/resources/archive'

    test_operation = Op(id='123e4567-e89b-12d3-a456-426614174000',
                        type='execution-node',
                        classifier='kfp',
                        name='test',
                        filename=pipelines_test_file,
                        runtime_image='tensorflow/tensorflow:latest')

    filepath = processor._get_dependency_source_dir(test_operation)

    assert filepath == correct_filepath


def test_get_dependency_archive_name(processor):
    pipelines_test_file = 'elyra/pipeline/tests/resources/archive/test.ipynb'
    correct_filename = 'test-this-is-a-test-id.tar.gz'

    test_operation = Op(id='this-is-a-test-id',
                        type='execution-node',
                        classifier='kfp',
                        name='test',
                        filename=pipelines_test_file,
                        runtime_image='tensorflow/tensorflow:latest')

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

    test_operation = Op(id='this-is-a-test-id',
                        type='execution-node',
                        classifier='kfp',
                        name='test',
                        filename=pipelines_test_file,
                        env_vars=operation_envs,
                        runtime_image='tensorflow/tensorflow:latest')

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
