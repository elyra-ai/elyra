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
import json
import pytest


from elyra.pipeline import PipelineParser, Operation


@pytest.fixture
def valid_operation():
    return Operation(id='{{uuid}}',
                     type='execution_node',
                     classifier='execute-notebook-node',
                     filename='{{filename}}',
                     runtime_image='{{runtime_image}}',
                     env_vars=["var1=var1", "var2=var2"],
                     dependencies=["a.txt", "b.txt", "c.txt"],
                     outputs=["d.txt", "e.txt", "f.txt"],
                     )


def test_valid_pipeline(valid_operation):
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')

    pipeline = PipelineParser().parse(pipeline_definitions)

    assert pipeline.name == '{{name}}'
    assert pipeline.runtime == '{{runtime}}'
    assert pipeline.runtime_config == '{{runtime-config}}'
    assert len(pipeline.operations) == 1
    assert pipeline.operations['{{uuid}}'] == valid_operation


def test_missing_primary():
    pipeline_definitions = _read_pipeline_resource('pipeline_invalid.json')
    pipeline_definitions.pop('primary_pipeline')

    with pytest.raises(ValueError):
        PipelineParser().parse(pipeline_definitions)


def test_missing_pipelines():
    pipeline_definitions = _read_pipeline_resource('pipeline_invalid.json')
    pipeline_definitions.pop('pipelines')

    with pytest.raises(ValueError):
        PipelineParser().parse(pipeline_definitions)


def test_missing_primary_id():
    pipeline_definitions = _read_pipeline_resource('pipeline_invalid.json')
    # Replace pipeline id with non-matching guid so primary is not found
    pipeline_definitions['pipelines'][0]['id'] = "deadbeef-dead-beef-dead-beefdeadbeef"

    with pytest.raises(ValueError):
        PipelineParser().parse(pipeline_definitions)


def test_zero_nodes():
    pipeline_definitions = _read_pipeline_resource('pipeline_invalid.json')
    pipeline_definitions['pipelines'][0]['nodes'] = []

    with pytest.raises(ValueError):
        PipelineParser().parse(pipeline_definitions)


def test_multinode_pipeline():
    pipeline_definitions = _read_pipeline_resource('pipeline_3_node_sample.json')

    pipeline = PipelineParser().parse(pipeline_definitions)

    assert len(pipeline.operations) == 3


def test_supernode_pipeline():
    pipeline_definitions = _read_pipeline_resource('pipeline_with_supernode.json')

    pipeline = PipelineParser().parse(pipeline_definitions)

    assert len(pipeline.operations) == 4


def test_multiple_pipeline_definition():
    pipeline_definitions = _read_pipeline_resource('pipeline_multiple_pipeline_definitions.json')

    with pytest.raises(ValueError):
        PipelineParser().parse(pipeline_definitions)


def test_pipeline_operations_and_handle_artifact_file_details():
    pipeline_definitions = _read_pipeline_resource('pipeline_3_node_sample.json')

    pipeline = PipelineParser().parse(pipeline_definitions)

    assert len(pipeline.operations) == 3

    for op in pipeline.operations.values():
        assert '.' not in op.name


def test_pipeline_with_dependencies():
    pipeline_definitions = _read_pipeline_resource('pipeline_3_node_sample_with_dependencies.json')

    pipeline = PipelineParser().parse(pipeline_definitions)

    assert len(pipeline.operations['acc4527d-7cc8-4c16-b520-5aa0f50a2e34'].parent_operations) == 2


def test_pipeline_global_attributes():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')

    pipeline = PipelineParser().parse(pipeline_definitions)

    assert pipeline.name == '{{name}}'
    assert pipeline.runtime == '{{runtime}}'
    assert pipeline.runtime_config == '{{runtime-config}}'


def test_missing_pipeline_name_should_default_to_untitled():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['app_data'].pop('name')

    pipeline = PipelineParser().parse(pipeline_definitions)

    assert pipeline.name == 'untitled'


def test_missing_pipeline_runtime():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['app_data'].pop('runtime')

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_definitions)

    assert "Invalid pipeline: Missing runtime." in str(e.value)


def test_missing_pipeline_runtime_configuration():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['app_data'].pop('runtime-config')

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_definitions)

    assert "Invalid pipeline: Missing runtime configuration" in str(e.value)


def test_missing_operation_id():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['nodes'][0].pop('id')

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_definitions)

    assert "Missing field 'operation id'" in str(e.value)


def test_missing_operation_type():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['nodes'][0].pop('type')

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_definitions)

    assert "Node type 'None' is not supported!" in str(e.value)


def test_invalid_node_type():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['nodes'][0]['type'] = 'foo'

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_definitions)

    assert "Node type 'foo' is not supported!" in str(e.value)


def test_missing_operation_filename():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['nodes'][0]['app_data'].pop('filename')

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_definitions)

    assert "Missing field 'operation filename" in str(e.value)


def test_missing_operation_image():
    pipeline_definitions = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definitions['pipelines'][0]['nodes'][0]['app_data'].pop('runtime_image')

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_definitions)

    assert "Missing field 'operation runtime image'" in str(e.value)


def _read_pipeline_resource(pipeline_filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    pipeline_path = os.path.join(root, pipeline_filename)

    with open(pipeline_path, 'r') as f:
        pipeline_json = json.load(f)

    return pipeline_json
