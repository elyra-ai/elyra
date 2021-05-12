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

import json
import os
import pytest

from ..validate import PipelineValidationManager, ValidationResponse


@pytest.fixture
def load_pipeline():
    def _function(pipeline_filepath):
        response = ValidationResponse()

        with open(f'elyra/pipeline/tests/resources/validation_pipelines/{pipeline_filepath}') as f:
            pipeline = json.loads(f.read())
            return pipeline, response

    yield _function


def test_basic_pipeline_structure(load_pipeline):
    pipeline, response = load_pipeline('basic_pipeline_only_notebook.pipeline')
    PipelineValidationManager()._validate_pipeline_structure(pipeline=pipeline,
                                                             response=response)
    assert not response.has_fatal
    assert not response.to_json().get('issues')


def test_basic_pipeline_structure_with_scripts(load_pipeline):
    pipeline, response = load_pipeline('basic_pipeline_with_scripts.pipeline')
    PipelineValidationManager()._validate_pipeline_structure(pipeline=pipeline,
                                                             response=response)
    assert not response.has_fatal
    assert not response.to_json().get('issues')


async def test_invalid_runtime_node_kubeflow(load_pipeline):
    pipeline, response = load_pipeline('invalid_node_op_in_kubeflow.pipeline')
    node_id = "42a9a4b5-7ed8-43bf-aabb-a5943f95d3ac"
    await PipelineValidationManager()._validate_compatibility(pipeline=pipeline,
                                                              response=response,
                                                              pipeline_runtime='kfp',
                                                              pipeline_execution='kfp')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeType'
    assert issues[0]['data']['nodeID'] == node_id


async def test_invalid_runtime_node_kubeflow_with_supernode(load_pipeline):
    pipeline, response = load_pipeline('invalid_node_op_with_supernode_kubeflow.pipeline')
    node_id = "42a9a4b5-7ed8-43bf-aabb-a5943f95d3ac"
    pipeline_id = "0080b042-395a-4006-a8f9-8fadde7dbf7d"
    await PipelineValidationManager()._validate_compatibility(pipeline=pipeline,
                                                              response=response,
                                                              pipeline_runtime='kfp',
                                                              pipeline_execution='kfp')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeType'
    assert issues[0]['data']['pipelineID'] == pipeline_id
    assert issues[0]['data']['nodeID'] == node_id


async def test_invalid_pipeline_runtime_with_kubeflow_execution(load_pipeline):
    pipeline, response = load_pipeline('basic_pipeline_with_scripts.pipeline')

    await PipelineValidationManager()._validate_compatibility(pipeline=pipeline,
                                                              response=response,
                                                              pipeline_runtime='airflow',
                                                              pipeline_execution='kfp')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidRuntime'


async def test_invalid_pipeline_runtime_with_local_execution(load_pipeline):
    pipeline, response = load_pipeline('basic_pipeline_with_scripts.pipeline')

    await PipelineValidationManager()._validate_compatibility(pipeline=pipeline,
                                                              response=response,
                                                              pipeline_runtime='airflow',
                                                              pipeline_execution='local')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidRuntime'
    assert issues[0]['data']['pipelineRuntime'] == 'airflow'


async def test_invalid_node_op_with_airflow(load_pipeline):
    pipeline, response = load_pipeline('invalid_node_op_with_airflow.pipeline')
    node_id = "f7eb6300-9263-4a47-be91-8dbad7c44a83"
    await PipelineValidationManager()._validate_compatibility(pipeline=pipeline,
                                                              response=response,
                                                              pipeline_runtime='airflow',
                                                              pipeline_execution='')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeType'
    assert issues[0]['data']['nodeID'] == node_id


async def test_invalid_node_property_structure(monkeypatch, load_pipeline):
    pipeline, response = load_pipeline('invalid_node_property_structure.pipeline')
    node_id = 'cc35500d-31c9-454f-8c6c-94acd3e24b5c'
    node_property = 'runtime_image'
    pvm = PipelineValidationManager()

    monkeypatch.setattr(pvm, "_validate_filepath", lambda node_id, root_dir, property_name, filename, response: True)

    await pvm._validate_node_properties(root_dir='',
                                        pipeline=pipeline,
                                        response=response,
                                        pipeline_runtime='generic',
                                        pipeline_execution='local')

    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeProperty'
    assert issues[0]['data']['propertyName'] == node_property
    assert issues[0]['data']['nodeID'] == node_id


async def test_missing_node_property_for_kubeflow_pipeline(monkeypatch, load_pipeline):
    pipeline, response = load_pipeline('invalid_node_property_in_kubeflow.pipeline')
    node_id = '0934a7bc-0f32-4c8a-9d92-e1a5adecc247'
    node_property = 'model_uid'
    pvm = PipelineValidationManager()

    monkeypatch.setattr(pvm, "_validate_filepath", lambda node_id, root_dir, property_name, filename, response: True)

    await pvm._validate_node_properties(root_dir='',
                                        pipeline=pipeline,
                                        response=response,
                                        pipeline_runtime='kfp',
                                        pipeline_execution='')

    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeProperty'
    assert issues[0]['data']['propertyName'] == node_property
    assert issues[0]['data']['nodeID'] == node_id


def test_invalid_node_property_image_name(load_pipeline):
    pipeline, response = load_pipeline('invalid_node_property_image_name.pipeline')
    node_id = 'cc35500d-31c9-454f-8c6c-94acd3e24b5c'
    node_property = 'runtime_image'

    node = pipeline['pipelines'][0]['nodes'][0]

    PipelineValidationManager()._validate_container_image_name(node, response)

    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodePropertyValue'
    assert issues[0]['data']['propertyName'] == node_property
    assert issues[0]['data']['nodeID'] == node_id


def test_invalid_node_property_dependency_filepath_workspace():
    response = ValidationResponse()
    node_id = 'test-id'
    property_name = 'test-property'

    PipelineValidationManager()._validate_filepath(node_id=node_id, root_dir=os.getcwd(),
                                                   property_name=property_name,
                                                   filename='../invalid_filepath/to/file.ipynb',
                                                   response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidFilePath'
    assert issues[0]['data']['propertyName'] == property_name
    assert issues[0]['data']['nodeID'] == node_id


def test_invalid_node_property_dependency_filepath_non_existent():
    response = ValidationResponse()
    node_id = 'test-id'
    property_name = 'test-property'

    PipelineValidationManager()._validate_filepath(node_id=node_id, root_dir=os.getcwd(),
                                                   property_name=property_name,
                                                   filename='invalid_filepath/to/file.ipynb',
                                                   response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidFilePath'
    assert issues[0]['data']['propertyName'] == property_name
    assert issues[0]['data']['nodeID'] == node_id


def test_valid_node_property_dependency_filepath():
    response = ValidationResponse()
    valid_filename = 'elyra/pipeline/tests/resources/validation_pipelines/single_cycle.pipeline'
    node_id = 'test-id'
    property_name = 'test-property'

    PipelineValidationManager()._validate_filepath(node_id=node_id, root_dir=os.getcwd(),
                                                   property_name=property_name,
                                                   filename=valid_filename,
                                                   response=response)

    assert not response.has_fatal
    assert not response.to_json().get('issues')


def test_invalid_node_property_resource_value(load_pipeline):
    pipeline, response = load_pipeline('invalid_node_property_resource.pipeline')
    node_id = '94fff95c-d5b9-4350-b015-c21c070b221a'

    node = pipeline['pipelines'][0]['nodes'][0]
    PipelineValidationManager()._validate_resource_value(node, resource_name='cpu', response=response)

    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodePropertyValue'
    assert issues[0]['data']['propertyName'] == 'cpu'
    assert issues[0]['data']['nodeID'] == node_id


def test_invalid_node_property_env_var():
    response = ValidationResponse()
    invalid_env_var = "TEST_ENV_ONE\"test_one\""
    PipelineValidationManager()._validate_environmental_variables(node_id="test-id",
                                                                  env_var=invalid_env_var,
                                                                  response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidEnvPair'
    assert issues[0]['data']['propertyName'] == 'env_vars'
    assert issues[0]['data']['nodeID'] == "test-id"


def test_invalid_node_property_ui_label():
    response = ValidationResponse()
    invalid_label_name = "DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD"
    PipelineValidationManager()._validate_ui_data_label(node_id="test-id",
                                                        label_name=invalid_label_name,
                                                        response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeLabel'
    assert issues[0]['data']['propertyName'] == 'label'
    assert issues[0]['data']['nodeID'] == "test-id"


def test_pipeline_graph_single_cycle(load_pipeline):
    pipeline, response = load_pipeline('single_cycle.pipeline')
    cycle_ID = ["e9c36292-823c-4791-966a-17737530170b",
                "fda0e1df-dc61-4dbc-9a63-e59d9d117ad8"]

    PipelineValidationManager()._validate_pipeline_graph(pipeline=pipeline,
                                                         response=response)
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'circularReference'
    assert issues[0]['data']['linkIDList'].sort() == cycle_ID.sort()


def test_pipeline_graph_double_cycle(load_pipeline):
    pipeline, response = load_pipeline('double_cycle.pipeline')
    cycle_ID = ["4be73f03-c8ef-4d05-92ff-e3a8c60288c6",
                "260ff083-cdae-4164-9cb3-8acf5796d7cc",
                "897cc4e9-1390-42e1-aaff-80e144338f3e"]
    cycle_two_ID = ["e9c36292-823c-4791-966a-17737530170b",
                    "fda0e1df-dc61-4dbc-9a63-e59d9d117ad8"]

    PipelineValidationManager()._validate_pipeline_graph(pipeline=pipeline,
                                                         response=response)
    issues = response.to_json().get('issues')
    assert len(issues) == 2
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'circularReference'
    assert issues[0]['data']['linkIDList'].sort() == cycle_ID.sort()
    assert issues[1]['severity'] == 1
    assert issues[1]['type'] == 'circularReference'
    assert issues[1]['data']['linkIDList'].sort() == cycle_two_ID.sort()


def test_pipeline_graph_singleton(load_pipeline):
    pipeline, response = load_pipeline('singleton.pipeline')
    node_id = 'c0edc462-587c-4226-baad-5855dec7ae10'

    PipelineValidationManager()._validate_pipeline_graph(pipeline=pipeline,
                                                         response=response)
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert not response.has_fatal
    assert issues[0]['severity'] == 2
    assert issues[0]['type'] == 'singletonReference'
    assert issues[0]['data']['nodeID'] == node_id
