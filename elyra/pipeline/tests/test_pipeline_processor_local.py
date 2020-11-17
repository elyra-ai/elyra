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

from elyra.pipeline import PipelineParser
from elyra.pipeline.processor_local import LocalPipelineProcessor
from .util import _read_pipeline_resource, NotebookNode, PythonNode, construct_pipeline


@pytest.fixture
def pipeline_dir(tmp_path):
    pipeline_path = os.path.join(tmp_path, "pipeline")
    os.makedirs(pipeline_path)
    return pipeline_path


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


def test_pipeline_execution(pipeline_dir):
    # Construct 4-node pipeline consisting of 3 notebooks and 1 python script.
    # This pipeline is "diamond shaped" with node1 feeding nodes 2 and 3, each then
    # feeding node4.
    node1 = NotebookNode("node1", num_outputs=2)
    node2 = PythonNode("node2", num_outputs=2, input_nodes=[node1])
    node3 = NotebookNode("node3", num_outputs=2, input_nodes=[node1])
    node4 = NotebookNode("node4", num_outputs=2, input_nodes=[node2, node3])
    nodes = [node1, node2, node3, node4]

    pipeline = construct_pipeline("p1", nodes=nodes, location=pipeline_dir)

    LocalPipelineProcessor(pipeline_dir).process(pipeline)

    # Confirm outputs
    for node in nodes:
        for output in node.outputs:
            assert os.path.exists(os.path.join(pipeline_dir, output))


def test_pipeline_execution_bad_notebook(pipeline_dir):
    # Construct 4-node pipeline where node 3 (nodebook) produces a failure
    node1 = NotebookNode("node1", num_outputs=2)
    node2 = PythonNode("node2", num_outputs=2, input_nodes=[node1])
    node3 = NotebookNode("node3", num_outputs=2, input_nodes=[node1], fail=True)
    node4 = NotebookNode("node4", num_outputs=2, input_nodes=[node2, node3])
    nodes = [node1, node2, node3, node4]
    processed_nodes = [node1, node2]
    unprocessed_nodes = [node3, node4]

    pipeline = construct_pipeline("p1", nodes=nodes, location=pipeline_dir)

    with pytest.raises(RuntimeError) as e:
        LocalPipelineProcessor(pipeline_dir).process(pipeline)
    assert str(e.value) == 'Error processing operation node3.'

    # Confirm outputs (and non-outputs)
    for node in processed_nodes:
        for output in node.outputs:
            assert os.path.exists(os.path.join(pipeline_dir, output))

    for node in unprocessed_nodes:
        for output in node.outputs:
            assert not os.path.exists(os.path.join(pipeline_dir, output))


def test_pipeline_execution_bad_python(pipeline_dir):
    # Construct 4-node pipeline where node 2 (python) produces a failure
    node1 = NotebookNode("node1", num_outputs=2)
    node2 = PythonNode("node2", num_outputs=2, input_nodes=[node1], fail=True)
    node3 = NotebookNode("node3", num_outputs=2, input_nodes=[node1])
    node4 = NotebookNode("node4", num_outputs=2, input_nodes=[node2, node3])
    nodes = [node1, node2, node3, node4]
    processed_nodes = [node1]
    unprocessed_nodes = [node2, node3, node4]

    pipeline = construct_pipeline("p1", nodes=nodes, location=pipeline_dir)

    with pytest.raises(RuntimeError) as e:
        LocalPipelineProcessor(pipeline_dir).process(pipeline)
    assert str(e.value) == 'Error processing operation node2.'

    # Confirm outputs (and non-outputs)
    for node in processed_nodes:
        for output in node.outputs:
            assert os.path.exists(os.path.join(pipeline_dir, output))

    for node in unprocessed_nodes:
        for output in node.outputs:
            assert not os.path.exists(os.path.join(pipeline_dir, output))


def _get_operation_names(operations):
    operation_names = []
    for operation in operations:
        operation_names.append(operation.name)

    return operation_names
