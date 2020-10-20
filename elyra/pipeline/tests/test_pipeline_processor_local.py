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
from elyra.pipeline import PipelineParser
from elyra.pipeline.processor_local import LocalPipelineProcessor
from .util import _read_pipeline_resource


def test_pipeline_execution_order_in_complex_pipeline():
    expected_operation_names = ['a', 'b', 'c', 'd', 'e', 'f', 'x', 'y', 'g', 'h']
    pipeline_definitions = _read_pipeline_resource('resources/sample_pipelines/pipeline_dependency_complex.json')

    pipeline = PipelineParser().parse(pipeline_definitions)
    current_ordered_operation_names = _get_operation_names(pipeline.operations.values())
    assert current_ordered_operation_names != expected_operation_names

    operations = LocalPipelineProcessor.\
        _sort_operations(operations_by_id=pipeline.operations)

    ordered_operation_names = _get_operation_names(operations)

    assert ordered_operation_names == expected_operation_names


def test_pipeline_execution_order_in_simple_pipeline():
    expected_operation_names = ['f', 'a', 'c', 'g']
    pipeline_definitions = _read_pipeline_resource('resources/sample_pipelines/pipeline_dependency_simple.json')

    pipeline = PipelineParser().parse(pipeline_definitions)
    current_ordered_operation_names = _get_operation_names(pipeline.operations.values())
    assert current_ordered_operation_names != expected_operation_names

    operations = LocalPipelineProcessor.\
        _sort_operations(operations_by_id=pipeline.operations)

    ordered_operation_names = _get_operation_names(operations)

    assert ordered_operation_names == expected_operation_names


def test_pipeline_get_envs():

    # Ensure pipeline operation env lists are properly converted to dictionaries.

    pipeline_definitions = _read_pipeline_resource('resources/sample_pipelines/pipeline_dependency_complex.json')

    pipeline = PipelineParser().parse(pipeline_definitions)

    for op in pipeline.operations.values():
        op_envs = op.env_vars_as_dict()
        assert op_envs['OP_NAME'] == op.name


def _get_operation_names(operations):
    operation_names = []
    for operation in operations:
        operation_names.append(operation.name)

    return operation_names
