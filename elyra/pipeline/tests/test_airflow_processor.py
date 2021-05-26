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
import github
import os
import pytest
import tempfile

from elyra.pipeline.processor_airflow import AirflowPipelineProcessor
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.tests.test_pipeline_parser import _read_pipeline_resource
from elyra.metadata.metadata import Metadata
from elyra.util import git
from pathlib import Path
from unittest import mock

PIPELINE_FILE = 'resources/sample_pipelines/pipeline_dependency_complex.json'


@pytest.fixture
def processor():
    processor = AirflowPipelineProcessor(os.getcwd())
    return processor


@pytest.fixture
def parsed_pipeline():
    pipeline_resource = _read_pipeline_resource(PIPELINE_FILE)
    return PipelineParser().parse(pipeline_definitions=pipeline_resource)


@pytest.fixture
def sample_metadata():
    return {"github_api_endpoint": "https://api.github.com",
            "github_repo": "examples/test-repo",
            "github_repo_token": "c564d8dfgdsfgdfgdsfgdsfgdfsgdfsgdsfgdsfg",
            "github_branch": "main",
            "user_namespace": "default",
            "api_endpoint": "http://examples.com:31737",
            "cos_endpoint": "http://examples.com:31671",
            "cos_username": "example",
            "cos_password": "example123456",
            "cos_bucket": "test",
            "tags": []
            }


@pytest.fixture
def sample_image_metadata():
    image_one = {"image_name": 'tensorflow/tensorflow:2.0.0-py3',
                 "pull_policy": 'IfNotPresent',
                 "tags": []
                 }
    image_two = {"image_name": 'elyra/examples:1.0.0-py3',
                 "pull_policy": 'Always',
                 "tags": []
                 }

    mocked_runtime_images = [Metadata(name="test-image-metadata",
                                      display_name="test-image",
                                      schema_name="airflow",
                                      metadata=image_one
                                      ),
                             Metadata(name="test-image-metadata",
                                      display_name="test-image",
                                      schema_name="airflow",
                                      metadata=image_two
                                      )
                             ]

    return mocked_runtime_images


@pytest.fixture
def parsed_ordered_dict(monkeypatch, processor, parsed_pipeline,
                        sample_metadata, sample_image_metadata):

    mocked_runtime = Metadata(name="test-metadata",
                              display_name="test",
                              schema_name="airflow",
                              metadata=sample_metadata
                              )

    mocked_func = mock.Mock(return_value="default", side_effect=[mocked_runtime, sample_image_metadata])

    monkeypatch.setattr(processor, "_get_metadata_configuration", mocked_func)
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda x, y, z: True)
    monkeypatch.setattr(processor, "_get_dependency_archive_name", lambda x: True)

    return processor._cc_pipeline(parsed_pipeline, pipeline_name="some-name")


def read_key_pair(key_pair, sep='='):
    return {'key': key_pair.split(sep)[0].strip('" '),
            'value': key_pair.split(sep)[1].rstrip(',').strip('" ')}


def string_to_list(stringed_list):
    return stringed_list.replace(" ", "").replace("\"", "").strip('[]').split(',')


def test_processor_type(processor):
    assert processor.type == "airflow"


def test_fail_processor_type(processor):
    with pytest.raises(Exception):
        assert processor.type == "kfp"


def test_pipeline_process(monkeypatch, processor, parsed_pipeline, sample_metadata):

    mocked_runtime = Metadata(name="test-metadata",
                              display_name="test",
                              schema_name="airflow",
                              metadata=sample_metadata
                              )
    mocked_path = "/some-placeholder"

    monkeypatch.setattr(processor, "_get_metadata_configuration", lambda namespace, name: mocked_runtime)
    monkeypatch.setattr(processor, "create_pipeline_file",
                        lambda pipeline, pipeline_export_format, pipeline_export_path, pipeline_name: mocked_path)

    monkeypatch.setattr(github.Github, "get_repo", lambda x, y: True)
    monkeypatch.setattr(git.GithubClient, "upload_dag", lambda x, y, z: True)

    response = processor.process(pipeline=parsed_pipeline)

    assert response.run_url == sample_metadata['api_endpoint']
    assert response.object_storage_url == sample_metadata['cos_endpoint']
    # Verifies that only this substring is in the storage path since a timestamp is injected into the name
    assert "/" + sample_metadata['cos_bucket'] + "/" + "untitled" in response.object_storage_path


def test_create_file(monkeypatch, processor, parsed_pipeline, parsed_ordered_dict, sample_metadata):
    pipeline_json = _read_pipeline_resource(PIPELINE_FILE)

    export_pipeline_name = "some-name"
    export_file_type = "py"

    mocked_runtime = Metadata(name="test-metadata",
                              display_name="test",
                              schema_name="airflow",
                              metadata=sample_metadata
                              )

    monkeypatch.setattr(processor, "_get_metadata_configuration", lambda name=None, namespace=None: mocked_runtime)
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda x, y, z: True)
    monkeypatch.setattr(processor, "_cc_pipeline", lambda x, y: parsed_ordered_dict)

    with tempfile.TemporaryDirectory() as temp_dir:
        export_pipeline_output_path = os.path.join(temp_dir, f'{export_pipeline_name}.py')

        response = processor.create_pipeline_file(parsed_pipeline,
                                                  pipeline_export_format=export_file_type,
                                                  pipeline_export_path=export_pipeline_output_path,
                                                  pipeline_name=export_pipeline_name)

        assert export_pipeline_output_path == response
        assert os.path.isfile(export_pipeline_output_path)

        file_as_lines = open(response).read().splitlines()

        # Check DAG project name
        for i in range(len(file_as_lines)):
            if "args = {" == file_as_lines[i]:
                assert "project_id" == read_key_pair(file_as_lines[i + 1], sep=':')['key']
                assert export_pipeline_name == read_key_pair(file_as_lines[i + 1], sep=':')['value']

        # For every node in the original pipeline json
        for node in pipeline_json['pipelines'][0]['nodes']:
            for i in range(len(file_as_lines)):
                # Matches an op with a node ID
                if "notebook_op_" + node['id'].replace("-", "_") + " = NotebookOp(" in file_as_lines[i]:
                    sub_list_line_counter = 0
                    # Gets sub-list slice starting where the Notebook Op starts
                    for line in file_as_lines[i + 1:]:
                        if 'namespace=' in line:
                            assert sample_metadata['user_namespace'] == read_key_pair(line)['value']
                        elif 'cos_endpoint=' in line:
                            assert sample_metadata['cos_endpoint'] == read_key_pair(line)['value']
                        elif 'cos_bucket=' in line:
                            assert sample_metadata['cos_bucket'] == read_key_pair(line)['value']
                        elif 'name=' in line:
                            assert node['app_data']['ui_data']['label'] == read_key_pair(line)['value']
                        elif 'notebook=' in line:
                            assert node['app_data']['filename'] == read_key_pair(line)['value']
                        elif 'image=' in line:
                            assert node['app_data']['runtime_image'] == read_key_pair(line)['value']
                        elif 'env_vars=' in line:
                            for env in node['app_data']['env_vars']:
                                var, value = env.split("=")
                                # Gets sub-list slice starting where the env vars starts
                                for env_line in file_as_lines[i + sub_list_line_counter + 2:]:
                                    if "AWS_ACCESS_KEY_ID" in env_line:
                                        assert sample_metadata['cos_username'] == read_key_pair(env_line,
                                                                                                sep=':')['value']
                                    elif "AWS_SECRET_ACCESS_KEY" in env_line:
                                        assert sample_metadata['cos_password'] == read_key_pair(env_line,
                                                                                                sep=':')['value']
                                    elif var in env_line:
                                        assert var == read_key_pair(env_line, sep=':')['key']
                                        assert value == read_key_pair(env_line, sep=':')['value']
                                    elif env_line.strip() == '},':  # end of env vars
                                        break
                        elif 'pipeline_inputs=' in line and node['app_data'].get('inputs'):
                            for input in node['app_data']['inputs']:
                                assert input in string_to_list(read_key_pair(line)['value'])
                        elif 'pipeline_outputs=' in line and node['app_data'].get('outputs'):
                            for output in node['app_data']['outputs']:
                                assert output in string_to_list(read_key_pair(line)['value'])
                        elif line == ')':  # End of this Notebook Op
                            break
                        sub_list_line_counter += 1


def test_export_overwrite(monkeypatch, processor, parsed_pipeline):
    with tempfile.TemporaryDirectory() as temp_dir:
        mocked_path = os.path.join(temp_dir, 'some-name.py')
        Path(mocked_path).touch()
        assert os.path.isfile(mocked_path)

        monkeypatch.setattr(processor, "create_pipeline_file",
                            lambda pipeline, pipeline_export_format, pipeline_export_path, pipeline_name: mocked_path)

        returned_path = processor.export(parsed_pipeline, "py", mocked_path, True)
        assert returned_path == mocked_path


def test_fail_export_overwrite(processor, parsed_pipeline):
    with tempfile.TemporaryDirectory() as temp_dir:
        Path(f"{temp_dir}/test.py").touch()
        assert os.path.isfile(f"{temp_dir}/test.py")

        export_pipeline_output_path = os.path.join(temp_dir, 'test.py')
        with pytest.raises(ValueError):
            processor.export(parsed_pipeline, "py", export_pipeline_output_path, False)


def test_pipeline_tree_creation(parsed_ordered_dict, sample_metadata, sample_image_metadata):
    pipeline_json = _read_pipeline_resource(PIPELINE_FILE)

    ordered_dict = parsed_ordered_dict

    assert len(ordered_dict.keys()) == len(pipeline_json['pipelines'][0]['nodes'])

    # Verify tree structure is correct
    assert not ordered_dict['cded6818-e601-4fd8-b6b9-c9fdf1fd1fca'].get('parent_operations')
    assert ordered_dict['bb9606ca-29ec-4133-a36a-67bd2a1f6dc3'].get(
        'parent_operations').pop() == 'cded6818-e601-4fd8-b6b9-c9fdf1fd1fca'
    assert ordered_dict['6f5c2ece-1977-48a1-847f-099b327c6ed1'].get(
        'parent_operations').pop() == 'cded6818-e601-4fd8-b6b9-c9fdf1fd1fca'
    assert ordered_dict['4ef63a48-a27c-4d1e-a0ee-2fbbdbe3be74'].get(
        'parent_operations').pop() == 'cded6818-e601-4fd8-b6b9-c9fdf1fd1fca'
    assert ordered_dict['4f7ae91b-682e-476c-8664-58412336b31f'].get(
        'parent_operations').pop() == 'bb9606ca-29ec-4133-a36a-67bd2a1f6dc3'
    assert ordered_dict['f82c4699-b392-4a3e-92b0-45d9e11126fe'].get(
        'parent_operations').pop() == 'bb9606ca-29ec-4133-a36a-67bd2a1f6dc3'
    assert ordered_dict['137d3d2f-4224-42d9-b8c6-cbee9ff2872d'].get(
        'parent_operations') == ['4ef63a48-a27c-4d1e-a0ee-2fbbdbe3be74', '0a7eff92-fe2a-411c-92a6-73d6f3810516']
    assert not ordered_dict['779c2630-64bf-47ca-8a98-9ac8a60e85f7'].get('parent_operations')
    assert ordered_dict['0a7eff92-fe2a-411c-92a6-73d6f3810516'].get(
        'parent_operations').pop() == '779c2630-64bf-47ca-8a98-9ac8a60e85f7'
    assert ordered_dict['92a7a247-1131-489c-8c3e-1e2389d4c673'].get(
        'parent_operations') == ['f82c4699-b392-4a3e-92b0-45d9e11126fe', "137d3d2f-4224-42d9-b8c6-cbee9ff2872d",
                                 '6f5c2ece-1977-48a1-847f-099b327c6ed1']

    for key in ordered_dict.keys():
        for node in pipeline_json['pipelines'][0]['nodes']:
            if node['id'] == key:
                assert ordered_dict[key]['runtime_image'] == node['app_data']['runtime_image']
                for image in sample_image_metadata:
                    if ordered_dict[key]['runtime_image'] == image.metadata['image_name']:
                        assert ordered_dict[key]['image_pull_policy'] == image.metadata['pull_policy']
                assert ordered_dict[key]['filename'] == node['app_data']['filename']
                for env in node['app_data']['env_vars']:
                    var, value = env.split("=")
                    assert ordered_dict[key]['pipeline_envs'][var] == value
                assert ordered_dict[key]['cos_endpoint'] == sample_metadata['cos_endpoint']
                assert ordered_dict[key]['cos_bucket'] == sample_metadata['cos_bucket']
                assert ordered_dict[key]['pipeline_envs']['AWS_ACCESS_KEY_ID'] == sample_metadata['cos_username']
                assert ordered_dict[key]['pipeline_envs']['AWS_SECRET_ACCESS_KEY'] == sample_metadata['cos_password']
                for arg in ["inputs", "outputs"]:
                    if node['app_data'].get(arg):
                        for file in node['app_data'][arg]:
                            assert file in ordered_dict[key]["pipeline_" + arg]


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

    test_operation = Operation(id='this-is-a-test-id',
                               type='execution-node',
                               classifier='airflow',
                               name='test',
                               filename=pipelines_test_file,
                               env_vars=operation_envs,
                               runtime_image='tensorflow/tensorflow:latest')

    envs = processor._collect_envs(test_operation, cos_secret=None, cos_username='Alice', cos_password='secret')

    assert envs['ELYRA_RUNTIME_ENV'] == 'airflow'
    assert envs['AWS_ACCESS_KEY_ID'] == 'Alice'
    assert envs['AWS_SECRET_ACCESS_KEY'] == 'secret'
    assert envs['ELYRA_ENABLE_PIPELINE_INFO'] == 'True'
    assert 'ELYRA_WRITABLE_CONTAINER_DIR' not in envs
    assert envs['USER_EMPTY_VALUE'] == '  '
    assert envs['USER_TWO_EQUALS'] == 'KEY=value'
    assert 'USER_NO_VALUE' not in envs

    # Repeat with non-None secret - ensure user and password envs are not present, but others are
    envs = processor._collect_envs(test_operation, cos_secret='secret', cos_username='Alice', cos_password='secret')

    assert envs['ELYRA_RUNTIME_ENV'] == 'airflow'
    assert 'AWS_ACCESS_KEY_ID' not in envs
    assert 'AWS_SECRET_ACCESS_KEY' not in envs
    assert envs['ELYRA_ENABLE_PIPELINE_INFO'] == 'True'
    assert 'ELYRA_WRITABLE_CONTAINER_DIR' not in envs
    assert envs['USER_EMPTY_VALUE'] == '  '
    assert envs['USER_TWO_EQUALS'] == 'KEY=value'
    assert 'USER_NO_VALUE' not in envs
