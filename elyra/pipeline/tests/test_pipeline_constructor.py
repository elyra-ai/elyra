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
import pytest
from elyra.pipeline import Operation, Pipeline


@pytest.fixture
def good_operation():
    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               runtime_image='tensorflow/tensorflow:latest')
    return test_operation


@pytest.fixture
def good_pipeline():
    test_pipeline = Pipeline(id='Random-UUID-123123123123123',
                             name='test-pipeline',
                             runtime='kfp',
                             runtime_config='default_kfp')
    return test_pipeline


def test_create_operation_minimal(good_operation):
    test_operation = good_operation

    assert test_operation.id == 'test-id'
    assert test_operation.type == 'test'
    assert test_operation.classifier == 'execution-node'
    assert test_operation.filename == 'elyra/pipeline/tests/resources/archive/test.ipynb'
    assert test_operation.runtime_image == 'tensorflow/tensorflow:latest'
    assert test_operation.name == 'test'


def test_create_operation_with_dependencies():
    dependencies = ['elyra/pipline/tests/resources', 'elyra/pipline/tests/resources/archive']

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               dependencies=dependencies,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.dependencies == dependencies


def test_create_operation_include_subdirectories():
    include_subdirectories = True

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               include_subdirectories=include_subdirectories,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.include_subdirectories == include_subdirectories


def test_create_operation_with_environmental_variables():
    env_variables = ['FOO="Bar"', 'BAR="Foo']

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               env_vars=env_variables,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.env_vars == env_variables


def test_create_operation_with_inputs():
    inputs = ["input1.txt", "input2.txt"]

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               inputs=inputs,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.inputs == inputs


def test_create_operation_with_outputs():
    outputs = ["output1.txt", "output2.txt"]

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               outputs=outputs,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.outputs == outputs


def test_create_operation_with_parent_operations():
    parent_operation_ids = ['id-123123-123123-123123', 'id-456456-456456-456456']

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               parent_operations=parent_operation_ids,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.parent_operations == parent_operation_ids


def test_fail_create_operation_missing_id():
    with pytest.raises(TypeError):
        Operation(type='test',
                  classifier='execution-node',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_create_operation_missing_type():
    with pytest.raises(TypeError):
        Operation(id='test-id',
                  classifier='execution-node',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_create_operation_missing_classifier():
    with pytest.raises(TypeError):
        Operation(id='test-id',
                  type='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_create_operation_missing_runtime_image():
    with pytest.raises(TypeError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb')


def test_fail_operations_are_equal(good_operation):
    parent_operation_ids = ['id-123123-123123-123123', 'id-456456-456456-456456']
    compare_operation = Operation(id='test-id',
                                  type='test',
                                  classifier='execution-node',
                                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                                  parent_operations=parent_operation_ids,
                                  runtime_image='tensorflow/tensorflow:latest')
    with pytest.raises(AssertionError):
        assert compare_operation == good_operation


def test_operations_are_equal(good_operation):
    compare_operation = Operation(id='test-id',
                                  type='test',
                                  classifier='execution-node',
                                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                                  runtime_image='tensorflow/tensorflow:latest')

    assert compare_operation == good_operation


def test_create_pipeline_minimal(good_pipeline):
    test_pipeline = good_pipeline

    assert test_pipeline.id == 'Random-UUID-123123123123123'
    assert test_pipeline.name == 'test-pipeline'
    assert test_pipeline.runtime == 'kfp'
    assert test_pipeline.runtime_config == 'default_kfp'


def test_fail_create_pipeline_missing_id():
    with pytest.raises(TypeError):
        Pipeline(name='test-pipeline',
                 runtime='kfp',
                 runtime_config='default_kfp')


def test_fail_create_pipeline_missing_name():
    with pytest.raises(TypeError):
        Pipeline(id='Random-UUID-123123123123123',
                 runtime='kfp',
                 runtime_config='default_kfp')


def test_fail_create_pipeline_missing_runtime():
    with pytest.raises(TypeError):
        Pipeline(id='Random-UUID-123123123123123',
                 name='test-pipeline',
                 runtime_config='default_kfp')


def test_fail_create_pipeline_missing_runtime_config():
    with pytest.raises(TypeError):
        Pipeline(id='Random-UUID-123123123123123',
                 name='test-pipeline',
                 runtime='kfp')


def test_pipelines_are_equal(good_pipeline):
    compare_pipeline = Pipeline(id='Random-UUID-123123123123123',
                                name='test-pipeline',
                                runtime='kfp',
                                runtime_config='default_kfp')

    assert compare_pipeline == good_pipeline


def test_fail_pipelines_are_equal(good_pipeline):
    test_operations_dict = {'123123123': good_operation,
                            '234234234': good_operation}

    compare_pipeline = Pipeline(id='Random-UUID-123123123123123',
                                name='test-pipeline',
                                runtime='kfp',
                                runtime_config='default_kfp')

    for key, operation in test_operations_dict.items():
        compare_pipeline.operations[key] = operation

    with pytest.raises(AssertionError):
        assert compare_pipeline == good_pipeline
