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
                     title='{{title}}',
                     artifact='{{artifact}}',
                     image='{{image}}')


def read_pipeline_resource(pipeline_filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    pipeline_path = os.path.join(root, pipeline_filename)

    with open(pipeline_path, 'r') as f:
        pipeline_json = json.load(f)

    return pipeline_json


def test_valid_pipeline(valid_operation):
    pipeline_definition = read_pipeline_resource('pipeline_valid.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert pipeline.title == '{{title}}'
    assert len(pipeline.operations) == 1
    assert pipeline.operations['{{uuid}}'] == valid_operation


def test_missing_artifact():
    pipeline_definition = read_pipeline_resource('pipeline_invalid.json')

    with pytest.raises(SyntaxError) as e:
        PipelineParser.parse(pipeline_definition)

    assert "Missing field 'artifact'" in str(e.value)


def test_missing_primary():
    pipeline_definition = read_pipeline_resource('pipeline_invalid.json')
    pipeline_definition.pop('primary_pipeline')

    with pytest.raises(SyntaxError):
        PipelineParser.parse(pipeline_definition)


def test_missing_pipelines():
    pipeline_definition = read_pipeline_resource('pipeline_invalid.json')
    pipeline_definition.pop('pipelines')

    with pytest.raises(SyntaxError):
        PipelineParser.parse(pipeline_definition)


def test_missing_primary_id():
    pipeline_definition = read_pipeline_resource('pipeline_invalid.json')
    # Replace pipeline id with non-matching guid so primary is not found
    pipeline_definition['pipelines'][0]['id'] = "deadbeef-dead-beef-dead-beefdeadbeef"

    with pytest.raises(SyntaxError):
        PipelineParser.parse(pipeline_definition)


def test_zero_nodes():
    pipeline_definition = read_pipeline_resource('pipeline_invalid.json')
    pipeline_definition['pipelines'][0]['nodes'] = []

    with pytest.raises(SyntaxError):
        PipelineParser.parse(pipeline_definition)


def test_multinode_pipeline():
    pipeline_definition = read_pipeline_resource('pipeline_3_node_sample.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert len(pipeline.operations) == 3


def test_pipeline_operations_and_handle_artifact_file_details():
    pipeline_definition = read_pipeline_resource('pipeline_3_node_sample.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert len(pipeline.operations) == 3

    for op in pipeline.operations.values():
        assert '/' not in op.artifact_filename
        assert '.' not in op.artifact_name


def test_pipeline_with_dependencies():
    pipeline_definition = read_pipeline_resource('pipeline_3_node_sample_with_dependencies.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert len(pipeline.operations['acc4527d-7cc8-4c16-b520-5aa0f50a2e34'].dependencies) == 2


def test_pipeline_global_attributes():
    pipeline_definition = read_pipeline_resource('pipeline_valid.json')

    pipeline = PipelineParser.parse(pipeline_definition)

    assert pipeline.title == '{{title}}'
    assert pipeline.runtime == '{{runtime}}'
    assert pipeline.runtime_config == '{{runtime-config}}'
