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

from elyra.pipeline.validate import PipelineValidationManager
from elyra.pipeline.validate import ValidationResponse


@pytest.fixture
def load_pipeline():
    def _function(pipeline_filepath):
        response = ValidationResponse()

        with open(f'elyra/pipeline/tests/resources/validation_pipelines/{pipeline_filepath}') as f:
            pipeline = json.loads(f.read())
            return pipeline, response

    yield _function


@pytest.fixture
def validation_manager():
    validation_pipelines_path = "elyra/pipeline/tests/resources/validation_pipelines"
    yield PipelineValidationManager.instance(root_dir=os.path.join(os.getcwd(), validation_pipelines_path))
    PipelineValidationManager.clear_instance()


def test_basic_pipeline_structure(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_basic_pipeline_only_notebook.pipeline')
    validation_manager._validate_pipeline_structure(pipeline=pipeline,
                                                    response=response)
    assert not response.has_fatal
    assert not response.to_json().get('issues')


def test_basic_pipeline_structure_with_scripts(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_basic_pipeline_with_scripts.pipeline')
    validation_manager._validate_pipeline_structure(pipeline=pipeline,
                                                    response=response)
    assert not response.has_fatal
    assert not response.to_json().get('issues')


async def test_invalid_runtime_node_kubeflow(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('kf_invalid_node_op.pipeline')
    node_id = "eace43f8-c4b1-4a25-b331-d57d4fc29426"
    await validation_manager._validate_compatibility(pipeline=pipeline,
                                                     response=response,
                                                     pipeline_runtime='kfp',
                                                     pipeline_execution='kfp')

    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeType'
    assert issues[0]['data']['nodeID'] == node_id


async def test_invalid_runtime_node_kubeflow_with_supernode(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('kf_invalid_node_op_with_supernode.pipeline')
    node_id = "98aa7270-639b-42a4-9a07-b31cd0fa3205"
    pipeline_id = "00304a2b-dec4-4a73-ab4a-6830f97d7855"
    await validation_manager._validate_compatibility(pipeline=pipeline,
                                                     response=response,
                                                     pipeline_runtime='kfp',
                                                     pipeline_execution='kfp')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeType'
    assert issues[0]['data']['pipelineID'] == pipeline_id
    assert issues[0]['data']['nodeID'] == node_id


async def test_invalid_pipeline_runtime_with_kubeflow_execution(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_basic_pipeline_with_scripts.pipeline')

    await validation_manager._validate_compatibility(pipeline=pipeline,
                                                     response=response,
                                                     pipeline_runtime='airflow',
                                                     pipeline_execution='kfp')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidRuntime'


async def test_invalid_pipeline_runtime_with_local_execution(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_basic_pipeline_with_scripts.pipeline')

    await validation_manager._validate_compatibility(pipeline=pipeline,
                                                     response=response,
                                                     pipeline_runtime='airflow',
                                                     pipeline_execution='local')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidRuntime'
    assert issues[0]['data']['pipelineRuntime'] == 'airflow'


async def test_invalid_node_op_with_airflow(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('aa_invalid_node_op.pipeline')
    node_id = "749d4641-cee8-4a50-a0ed-30c07439908f"
    await validation_manager._validate_compatibility(pipeline=pipeline,
                                                     response=response,
                                                     pipeline_runtime='airflow',
                                                     pipeline_execution='airflow')
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeType'
    assert issues[0]['data']['nodeID'] == node_id


async def test_invalid_node_property_structure(monkeypatch, load_pipeline):
    pipeline, response = load_pipeline('generic_invalid_node_property_structure.pipeline')
    node_id = '88ab83dc-d5f0-443a-8837-788ed16851b7'
    node_property = 'runtime_image'
    pvm = PipelineValidationManager.instance()

    monkeypatch.setattr(pvm, "_validate_filepath", lambda node_id, node_label,
                        property_name, filename, response: True)

    await pvm._validate_node_properties(pipeline=pipeline,
                                        response=response,
                                        pipeline_runtime='generic',
                                        pipeline_execution='kfp')

    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeProperty'
    assert issues[0]['data']['propertyName'] == node_property
    assert issues[0]['data']['nodeID'] == node_id


async def test_missing_node_property_for_kubeflow_pipeline(monkeypatch, load_pipeline):
    pipeline, response = load_pipeline('kf_invalid_node_property_in_component.pipeline')
    node_id = 'fe08b42d-bd8c-4e97-8010-0503a3185427'
    node_property = "notebook"
    pvm = PipelineValidationManager.instance()

    monkeypatch.setattr(pvm, "_validate_filepath", lambda node_id, file_dir, property_name, filename, response: True)

    await pvm._validate_node_properties(pipeline=pipeline,
                                        response=response,
                                        pipeline_runtime='kfp',
                                        pipeline_execution='')

    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeProperty'
    assert issues[0]['data']['propertyName'] == node_property
    assert issues[0]['data']['nodeID'] == node_id


def test_invalid_node_property_image_name(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_invalid_node_property_image_name.pipeline')
    node_id = '88ab83dc-d5f0-443a-8837-788ed16851b7'
    node_property = 'runtime_image'

    node = pipeline['pipelines'][0]['nodes'][0]
    node_label = node['app_data'].get('label')
    image_name = node['app_data']['component_parameters'].get('runtime_image')
    validation_manager._validate_container_image_name(node['id'], node_label, image_name, response)

    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeProperty'
    assert issues[0]['data']['propertyName'] == node_property
    assert issues[0]['data']['nodeID'] == node_id


def test_invalid_node_property_dependency_filepath_workspace(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    property_name = 'test-property'

    validation_manager._validate_filepath(node_id=node['id'], file_dir=os.getcwd(),
                                          property_name=property_name,
                                          node_label=node['app_data']['label'],
                                          filename='../invalid_filepath/to/file.ipynb',
                                          response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidFilePath'
    assert issues[0]['data']['propertyName'] == property_name
    assert issues[0]['data']['nodeID'] == node['id']


def test_invalid_node_property_dependency_filepath_non_existent(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    property_name = 'test-property'

    validation_manager._validate_filepath(node_id=node['id'], file_dir=os.getcwd(),
                                          property_name=property_name,
                                          node_label=node['app_data']['label'],
                                          filename='invalid_filepath/to/file.ipynb',
                                          response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidFilePath'
    assert issues[0]['data']['propertyName'] == property_name
    assert issues[0]['data']['nodeID'] == node['id']


def test_valid_node_property_dependency_filepath(validation_manager):
    response = ValidationResponse()
    valid_filename = 'elyra/pipeline/tests/resources/validation_pipelines/generic_single_cycle.pipeline'
    node = {"id": "test-id", "app_data": {"label": "test"}}
    property_name = 'test-property'

    validation_manager._validate_filepath(node_id=node['id'], file_dir=os.getcwd(),
                                          property_name=property_name,
                                          node_label=node['app_data']['label'],
                                          filename=valid_filename,
                                          response=response)

    assert not response.has_fatal
    assert not response.to_json().get('issues')


async def test_valid_node_property_pipeline_filepath(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_basic_filepath_check.pipeline')

    await validation_manager._validate_node_properties(pipeline=pipeline,
                                                       response=response,
                                                       pipeline_runtime='generic',
                                                       pipeline_execution='kfp')

    assert not response.has_fatal
    assert not response.to_json().get('issues')


def test_invalid_node_property_resource_value(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_invalid_node_property_hardware_resources.pipeline')
    node_id = '88ab83dc-d5f0-443a-8837-788ed16851b7'

    node = pipeline['pipelines'][0]['nodes'][0]
    validation_manager._validate_resource_value(node['id'], node['app_data']['label'],
                                                resource_name='memory',
                                                resource_value=node['app_data']['component_parameters']['memory'],
                                                response=response)

    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeProperty'
    assert issues[0]['data']['propertyName'] == 'memory'
    assert issues[0]['data']['nodeID'] == node_id


def test_invalid_node_property_env_var(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    invalid_env_var = "TEST_ENV_ONE\"test_one\""
    validation_manager._validate_environmental_variables(node_id=node['id'],
                                                         node_label=node['app_data']['label'],
                                                         env_var=invalid_env_var,
                                                         response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidEnvPair'
    assert issues[0]['data']['propertyName'] == 'env_vars'
    assert issues[0]['data']['nodeID'] == "test-id"


def test_valid_node_property_label(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id"}
    valid_label_name = "this-is-a-good-label"
    validation_manager._validate_label(node_id=node['id'],
                                       node_label=valid_label_name,
                                       response=response)
    issues = response.to_json().get('issues')
    assert len(issues) == 0


def test_invalid_node_property_label_max_length(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    invalid_label_name = "DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD_DEAD_BREAD"
    validation_manager._validate_label(node_id=node['id'],
                                       node_label=invalid_label_name,
                                       response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeLabel'
    assert issues[0]['data']['propertyName'] == 'label'
    assert issues[0]['data']['nodeID'] == "test-id"


def test_invalid_node_property_label_bad_characters(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id"}
    invalid_label_name = "bad_label_*&^&$"
    validation_manager._validate_label(node_id=node['id'],
                                       node_label=invalid_label_name,
                                       response=response)
    issues = response.to_json().get('issues')
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'invalidNodeLabel'
    assert issues[0]['data']['propertyName'] == 'label'
    assert issues[0]['data']['nodeID'] == "test-id"


def test_pipeline_graph_single_cycle(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_single_cycle.pipeline')
    cycle_ID = ['c309f6dd-b022-4b1c-b2b0-b6449bb26e8f', '8cb986cb-4fc9-4b1d-864d-0ec64b7ac13c']

    validation_manager._validate_pipeline_graph(pipeline=pipeline,
                                                response=response)
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'circularReference'
    assert issues[0]['data']['linkIDList'].sort() == cycle_ID.sort()


def test_pipeline_graph_double_cycle(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_double_cycle.pipeline')
    cycle_ID = ['597b2971-b95d-4df7-a36d-9d93b0345298', 'b63378e4-9085-4a33-9330-6f86054681f4']
    cycle_two_ID = ['c309f6dd-b022-4b1c-b2b0-b6449bb26e8f', '8cb986cb-4fc9-4b1d-864d-0ec64b7ac13c']

    validation_manager._validate_pipeline_graph(pipeline=pipeline,
                                                response=response)
    issues = response.to_json().get('issues')
    assert len(issues) == 2
    assert issues[0]['severity'] == 1
    assert issues[0]['type'] == 'circularReference'
    assert issues[0]['data']['linkIDList'].sort() == cycle_ID.sort()
    assert issues[1]['severity'] == 1
    assert issues[1]['type'] == 'circularReference'
    assert issues[1]['data']['linkIDList'].sort() == cycle_two_ID.sort()


def test_pipeline_graph_singleton(validation_manager, load_pipeline):
    pipeline, response = load_pipeline('generic_singleton.pipeline')
    node_id = '0195fefd-3ceb-4a90-a12c-3958ef0ff42e'

    validation_manager._validate_pipeline_graph(pipeline=pipeline,
                                                response=response)
    issues = response.to_json().get('issues')
    assert len(issues) == 1
    assert not response.has_fatal
    assert issues[0]['severity'] == 2
    assert issues[0]['type'] == 'singletonReference'
    assert issues[0]['data']['nodeID'] == node_id
