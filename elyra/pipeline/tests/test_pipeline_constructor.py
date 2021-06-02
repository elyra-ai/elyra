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
import sys
from elyra.pipeline import Operation, Pipeline


@pytest.fixture
def good_operation():
    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
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
    assert test_operation.name == 'test'
    assert test_operation.filename == 'elyra/pipeline/tests/resources/archive/test.ipynb'
    assert test_operation.runtime_image == 'tensorflow/tensorflow:latest'
    assert test_operation.name == 'test'


def test_create_operation_with_dependencies():
    dependencies = ['elyra/pipline/tests/resources', 'elyra/pipline/tests/resources/archive']

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               dependencies=dependencies,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.dependencies == dependencies


def test_create_operation_include_subdirectories():
    include_subdirectories = True

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               include_subdirectories=include_subdirectories,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.include_subdirectories == include_subdirectories


def test_create_operation_with_environmental_variables():
    env_variables = ['FOO="Bar"', 'BAR="Foo']

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               env_vars=env_variables,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.env_vars == env_variables


def test_create_operation_with_inputs():
    inputs = ["input1.txt", "input2.txt"]

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               inputs=inputs,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.inputs == inputs


def test_create_operation_with_outputs():
    outputs = ["output1.txt", "output2.txt"]

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               outputs=outputs,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.outputs == outputs


def test_create_operation_with_parent_operations():
    parent_operation_ids = ['id-123123-123123-123123', 'id-456456-456456-456456']

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               parent_operations=parent_operation_ids,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.parent_operations == parent_operation_ids


def test_create_operation_correct_naming():
    label = 'test.ipynb'
    filename = 'elyra/pipeline/tests/resources/archive/' + label

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execute-notebook-node',
                               name=label,
                               filename=filename,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.name == label.split('.')[0]


def test_fail_create_operation_missing_id():
    with pytest.raises(TypeError):
        Operation(type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_create_operation_missing_type():
    with pytest.raises(TypeError):
        Operation(id='test-id',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_create_operation_missing_classifier():
    with pytest.raises(TypeError):
        Operation(id='test-id',
                  type='test',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_create_operation_missing_runtime_image():
    with pytest.raises(TypeError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb')


def test_fail_create_operation_missing_name():
    with pytest.raises(TypeError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_operations_are_equal(good_operation):
    parent_operation_ids = ['id-123123-123123-123123', 'id-456456-456456-456456']
    compare_operation = Operation(id='test-id',
                                  type='test',
                                  classifier='execution-node',
                                  name='test',
                                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                                  parent_operations=parent_operation_ids,
                                  runtime_image='tensorflow/tensorflow:latest')
    with pytest.raises(AssertionError):
        assert compare_operation == good_operation


def test_operations_are_equal(good_operation):
    compare_operation = Operation(id='test-id',
                                  type='test',
                                  classifier='execution-node',
                                  name='test',
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


def test_env_list_to_dict_function():
    env_variables = ['KEY=value', None, '', '  =empty_key', '=no_key', 'EMPTY_VALUE=  ',
                     'NO_VALUE=', 'KEY2=value2', 'TWO_EQUALS=KEY=value', '==']
    env_variables_dict = {"KEY": "value", "KEY2": "value2", "EMPTY_VALUE": "  ", "TWO_EQUALS": "KEY=value"}

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               env_vars=env_variables,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.env_vars_as_dict() == env_variables_dict


def test_validate_resource_values():

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               cpu='4',
                               gpu='6',
                               memory='10',
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.cpu == '4'
    assert test_operation.gpu == '6'
    assert test_operation.memory == '10'


def test_validate_resource_values_as_none():

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.cpu is None
    assert test_operation.gpu is None
    assert test_operation.memory is None


def test_validate_gpu_accepts_zero_as_value():

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               cpu='4',
                               gpu='0',
                               memory='10',
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.gpu == '0'


def test_validate_max_resource_value():
    system_max_size = str(sys.maxsize - 1)

    test_operation = Operation(id='test-id',
                               type='test',
                               classifier='execution-node',
                               name='test',
                               filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                               memory=system_max_size,
                               runtime_image='tensorflow/tensorflow:latest')

    assert test_operation.memory == system_max_size


def test_fail_validate_max_resource_value_exceeded():
    system_max_size = str(sys.maxsize)

    with pytest.raises(ValueError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  memory=system_max_size,
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_creating_operation_with_negative_gpu_resources():
    with pytest.raises(ValueError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  gpu='-1',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_creating_operation_with_0_cpu_resources():
    with pytest.raises(ValueError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  cpu='0',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_creating_operation_with_negative_cpu_resources():
    with pytest.raises(ValueError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  cpu='-1',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_creating_operation_with_0_memory_resources():
    with pytest.raises(ValueError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  memory='0',
                  runtime_image='tensorflow/tensorflow:latest')


def test_fail_creating_operation_with_negative_memory_resources():
    with pytest.raises(ValueError):
        Operation(id='test-id',
                  type='test',
                  classifier='execution-node',
                  name='test',
                  filename='elyra/pipeline/tests/resources/archive/test.ipynb',
                  memory='-1',
                  runtime_image='tensorflow/tensorflow:latest')
