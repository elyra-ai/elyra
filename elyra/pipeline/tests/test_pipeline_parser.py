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
                     type='{{type}}',
                     classification='execute-notebook-node',
                     filename='{{filename}}',
                     runtime_image='{{runtime_image}}')


def test_valid_pipeline(valid_operation):
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert pipeline.name == '{{name}}'
    assert pipeline.runtime == '{{runtime}}'
    assert pipeline.runtime_config == '{{runtime-config}}'
    assert len(pipeline.operations) == 1
    assert pipeline.operations['{{uuid}}'] == valid_operation


def test_missing_primary():
    pipeline_definition = _read_pipeline_resource('pipeline_invalid.json')
    pipeline_definition.pop('primary_pipeline')

    with pytest.raises(ValueError):
        PipelineParser.parse(pipeline_definition)


def test_missing_pipelines():
    pipeline_definition = _read_pipeline_resource('pipeline_invalid.json')
    pipeline_definition.pop('pipelines')

    with pytest.raises(ValueError):
        PipelineParser.parse(pipeline_definition)


def test_missing_primary_id():
    pipeline_definition = _read_pipeline_resource('pipeline_invalid.json')
    # Replace pipeline id with non-matching guid so primary is not found
    pipeline_definition['pipelines'][0]['id'] = "deadbeef-dead-beef-dead-beefdeadbeef"

    with pytest.raises(ValueError):
        PipelineParser.parse(pipeline_definition)


def test_zero_nodes():
    pipeline_definition = _read_pipeline_resource('pipeline_invalid.json')
    pipeline_definition['pipelines'][0]['nodes'] = []

    with pytest.raises(ValueError):
        PipelineParser.parse(pipeline_definition)


def test_multinode_pipeline():
    pipeline_definition = _read_pipeline_resource('pipeline_3_node_sample.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert len(pipeline.operations) == 3


def test_supernode_pipelinen():
    pipeline_definition = _read_pipeline_resource('pipeline_with_supernode.json')

    with pytest.raises(ValueError):
        PipelineParser.parse(pipeline_definition)


def test_multiple_pipeline_definition():
    pipeline_definition = _read_pipeline_resource('pipeline_multiple_pipeline_definitions.json')

    with pytest.raises(ValueError):
        PipelineParser.parse(pipeline_definition)


def test_pipeline_operations_and_handle_artifact_file_details():
    pipeline_definition = _read_pipeline_resource('pipeline_3_node_sample.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert len(pipeline.operations) == 3

    for op in pipeline.operations.values():
        assert '.' not in op.name


def test_pipeline_with_dependencies():
    pipeline_definition = _read_pipeline_resource('pipeline_3_node_sample_with_dependencies.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert len(pipeline.operations['acc4527d-7cc8-4c16-b520-5aa0f50a2e34'].parent_operations) == 2


def test_pipeline_global_attributes():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert pipeline.name == '{{name}}'
    assert pipeline.runtime == '{{runtime}}'
    assert pipeline.runtime_config == '{{runtime-config}}'


def test_missing_pipeline_name_should_default_to_untitled():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definition['pipelines'][0]['app_data'].pop('name')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert pipeline.name == 'untitled'


def test_missing_pipeline_runtime():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definition['pipelines'][0]['app_data'].pop('runtime')

    with pytest.raises(ValueError) as e:
        PipelineParser.parse(pipeline_definition)

    assert "Invalid pipeline: Missing runtime." in str(e.value)


def test_missing_pipeline_runtime_configuration():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definition['pipelines'][0]['app_data'].pop('runtime-config')

    with pytest.raises(ValueError) as e:
        PipelineParser.parse(pipeline_definition)

    assert "Invalid pipeline: Missing runtime configuration" in str(e.value)


def test_missing_operation_id():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definition['pipelines'][0]['nodes'][0].pop('id')

    with pytest.raises(ValueError) as e:
        PipelineParser.parse(pipeline_definition)

    assert "Missing field 'operation id'" in str(e.value)


def test_missing_operation_type():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definition['pipelines'][0]['nodes'][0].pop('type')

    with pytest.raises(ValueError) as e:
        PipelineParser.parse(pipeline_definition)

    assert "Missing field 'operation type'" in str(e.value)


def test_missing_operation_filename():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definition['pipelines'][0]['nodes'][0]['app_data'].pop('filename')

    with pytest.raises(ValueError) as e:
        PipelineParser.parse(pipeline_definition)

    assert "Missing field 'operation filename" in str(e.value)


def test_missing_operation_image():
    pipeline_definition = _read_pipeline_resource('pipeline_valid.json')
    pipeline_definition['pipelines'][0]['nodes'][0]['app_data'].pop('runtime_image')

    with pytest.raises(ValueError) as e:
        PipelineParser.parse(pipeline_definition)

    assert "Missing field 'operation runtime image'" in str(e.value)


def _read_pipeline_resource(pipeline_filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    pipeline_path = os.path.join(root, pipeline_filename)

    with open(pipeline_path, 'r') as f:
        pipeline_json = json.load(f)

    return pipeline_json
