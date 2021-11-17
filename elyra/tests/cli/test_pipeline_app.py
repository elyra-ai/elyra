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
"""Tests for elyra-pipeline application"""
import json
import os

from click.testing import CliRunner
from conftest import KFP_COMPONENT_CACHE_INSTANCE
import pytest

from elyra.cli.pipeline_app import pipeline
from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import Runtimes

SUB_COMMANDS = ['run', 'submit', 'describe', 'validate']

PIPELINE_SOURCE_WITH_ZERO_LENGTH_PIPELINES_FIELD = \
    '{"doc_type":"pipeline","version":"3.0","id":"0","primary_pipeline":"1","pipelines":[],"schemas":[]}'

PIPELINE_SOURCE_WITHOUT_PIPELINES_FIELD = \
    '{"doc_type":"pipeline","version":"3.0","id":"0","primary_pipeline":"1","schemas":[]}'

PIPELINE_SOURCE_WITH_ZERO_NODES = \
    '{"doc_type":"pipeline","version":"3.0","id":"0","primary_pipeline":"1","pipelines":[{"id":"1","nodes":[],"app_data":{"runtime":"","version": 5, "runtime_type": "KUBEFLOW_PIPELINES", "properties": {"name": "generic"}}, "schemas":[]}]}'  # noqa

KFP_RUNTIME_INSTANCE = {
    "display_name": "PipelineApp KFP runtime instance",
    "metadata": {
        "api_endpoint": "http://acme.com:32470/pipeline",
        "cos_endpoint": "http://acme.com:30205",
        "cos_username": "minio",
        "cos_password": "miniosecret",
        "cos_bucket": "my-bucket",
        "tags": [],
        "engine": "Argo",
        "user_namespace": "kubeflow-user-example-com",
        "api_username": "user@example.com",
        "api_password": "12341234",
        "runtime_type": "KUBEFLOW_PIPELINES",
        "auth_type": "DEX_LEGACY"
    },
    "schema_name": "kfp"
}


@pytest.fixture
def kfp_runtime_instance():
    """Creates an instance of a kfp scehma and removes after test. """
    instance_name = "pipeline_app_test"
    md_mgr = MetadataManager(schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID)
    # clean possible orphaned instance...
    try:
        md_mgr.remove(instance_name)
    except Exception:
        pass
    runtime_instance = md_mgr.create(instance_name, Metadata(**KFP_RUNTIME_INSTANCE))
    yield runtime_instance.name
    md_mgr.remove(runtime_instance.name)


def test_no_opts():
    runner = CliRunner()
    result = runner.invoke(pipeline)
    assert 'run       Run a pipeline in your local environment' in result.output
    assert 'submit    Submit a pipeline to be executed on the server' in result.output
    assert 'describe  Display pipeline summary' in result.output
    assert result.exit_code == 0


def test_bad_subcommand():
    runner = CliRunner()
    result = runner.invoke(pipeline, ['invalid_command'])
    assert "Error: No such command 'invalid_command'" in result.output
    assert result.exit_code != 0


def test_subcommand_no_opts():
    runner = CliRunner()
    for command in SUB_COMMANDS:
        result = runner.invoke(pipeline, [command])
        assert "Error: Missing argument 'PIPELINE_PATH'" in result.output
        assert result.exit_code != 0


def test_run_with_invalid_pipeline():
    runner = CliRunner()

    result = runner.invoke(pipeline, ['run', 'foo.pipeline'])
    assert "Pipeline file not found:" in result.output
    assert "foo.pipeline" in result.output
    assert result.exit_code != 0


def test_submit_with_invalid_pipeline(kfp_runtime_instance):
    runner = CliRunner()

    result = runner.invoke(pipeline, ['submit', 'foo.pipeline',
                                      '--runtime-config', kfp_runtime_instance])
    assert "Pipeline file not found:" in result.output
    assert "foo.pipeline" in result.output
    assert result.exit_code != 0


def test_describe_with_invalid_pipeline():
    runner = CliRunner()

    result = runner.invoke(pipeline, ['describe', 'foo.pipeline'])
    assert "Pipeline file not found:" in result.output
    assert "foo.pipeline" in result.output
    assert result.exit_code != 0


def test_validate_with_invalid_pipeline():
    runner = CliRunner()

    result = runner.invoke(pipeline, ['validate', 'foo.pipeline'])
    assert "Pipeline file not found:" in result.output
    assert "foo.pipeline" in result.output
    assert result.exit_code != 0


def test_run_with_unsupported_file_type():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.ipynb', 'w') as f:
            f.write('{ "nbformat": 4, "cells": [] }')

        result = runner.invoke(pipeline, ['run', 'foo.ipynb'])
        assert "Pipeline file should be a [.pipeline] file" in result.output
        assert result.exit_code != 0


def test_submit_with_unsupported_file_type(kfp_runtime_instance):
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.ipynb', 'w') as f:
            f.write('{ "nbformat": 4, "cells": [] }')

        result = runner.invoke(pipeline, ['submit', 'foo.ipynb',
                                          '--runtime-config', kfp_runtime_instance])
        assert "Pipeline file should be a [.pipeline] file" in result.output
        assert result.exit_code != 0


def test_describe_with_unsupported_file_type():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.ipynb', 'w') as f:
            f.write('{ "nbformat": 4, "cells": [] }')

        result = runner.invoke(pipeline, ['describe', 'foo.ipynb'])
        assert "Pipeline file should be a [.pipeline] file" in result.output
        assert result.exit_code != 0


def test_validate_with_unsupported_file_type():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.ipynb', 'w') as f:
            f.write('{ "nbformat": 4, "cells": [] }')

        result = runner.invoke(pipeline, ['validate', 'foo.ipynb'])
        assert "Pipeline file should be a [.pipeline] file" in result.output
        assert result.exit_code != 0


def test_run_with_no_pipelines_field():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITHOUT_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['run', pipeline_file_path])
        assert "Pipeline is missing 'pipelines' field." in result.output
        assert result.exit_code != 0


def test_submit_with_no_pipelines_field(kfp_runtime_instance):
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITHOUT_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['submit', pipeline_file_path,
                                          '--runtime-config', kfp_runtime_instance])
        assert "Pipeline is missing 'pipelines' field." in result.output
        assert result.exit_code != 0


def test_describe_with_no_pipelines_field():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITHOUT_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['describe', pipeline_file_path])
        assert "Pipeline is missing 'pipelines' field." in result.output
        assert result.exit_code != 0


def test_validate_with_no_pipelines_field():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITHOUT_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['validate', pipeline_file_path])
        assert "Pipeline is missing 'pipelines' field." in result.output
        assert result.exit_code != 0


def test_run_with_zero_length_pipelines_field():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_ZERO_LENGTH_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['run', pipeline_file_path])
        assert "Pipeline has zero length 'pipelines' field." in result.output
        assert result.exit_code != 0


def test_submit_with_zero_length_pipelines_field(kfp_runtime_instance):
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_ZERO_LENGTH_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['submit', pipeline_file_path,
                                          '--runtime-config', kfp_runtime_instance])
        assert "Pipeline has zero length 'pipelines' field." in result.output
        assert result.exit_code != 0


def test_describe_with_zero_length_pipelines_field():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_ZERO_LENGTH_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['describe', pipeline_file_path])
        assert "Pipeline has zero length 'pipelines' field." in result.output
        assert result.exit_code != 0


def test_run_pipeline_with_no_nodes():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_ZERO_NODES)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['run', pipeline_file_path])
        assert "At least one node must exist in the primary pipeline." in result.output
        assert result.exit_code != 0


def test_submit_pipeline_with_no_nodes(kfp_runtime_instance):
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_ZERO_NODES)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['submit', pipeline_file_path, '--runtime-config', kfp_runtime_instance])
        assert "At least one node must exist in the primary pipeline." in result.output
        assert result.exit_code != 0


def test_describe_with_empty_pipeline():
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_ZERO_NODES)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['describe', pipeline_file_path])
        assert "Description: None" in result.output
        assert "Type: KUBEFLOW_PIPELINES" in result.output
        assert "Nodes: 0" in result.output
        assert "File Dependencies:\n    None Listed" in result.output
        assert "Component Dependencies:\n    None Listed" in result.output


def test_describe_with_kfp_components():
    runner = CliRunner()
    pipeline_file_path = os.path.join(os.path.dirname(__file__), 'resources', 'kfp_3_node_custom.pipeline')

    result = runner.invoke(pipeline, ['describe', pipeline_file_path])
    assert "Description: 3-node custom component pipeline" in result.output
    assert "Type: KUBEFLOW_PIPELINES" in result.output
    assert "Nodes: 3" in result.output
    assert "File Dependencies:\n    None Listed" in result.output
    assert "- https://raw.githubusercontent.com/kubeflow/pipelines/1.6.0/components/" \
           "basics/Calculate_hash/component.yaml" in result.output
    assert "- /opt/anaconda3/envs/elyra-dev/share/jupyter/components/" \
           "kfp/filter_text_using_shell_and_grep.yaml" in result.output
    assert "- https://raw.githubusercontent.com/kubeflow/pipelines/1.6.0/components/" \
           "web/Download/component.yaml" in result.output
    assert result.exit_code == 0


@pytest.mark.parametrize('component_cache_instance', [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
def test_validate_with_kfp_components(kfp_runtime_instance, component_cache_instance):
    runner = CliRunner()
    pipeline_file_path = os.path.join(os.path.dirname(__file__), 'resources', 'kfp_3_node_custom.pipeline')

    result = runner.invoke(pipeline, ['validate', pipeline_file_path, '--runtime-config', kfp_runtime_instance])

    assert "Validating pipeline..." in result.output
    assert result.exit_code == 0


def test_describe_with_missing_kfp_component():
    runner = CliRunner()
    with runner.isolated_filesystem():
        valid_file_path = os.path.join(os.path.dirname(__file__), 'resources', 'kfp_3_node_custom.pipeline')
        pipeline_file_path = os.path.join(os.getcwd(), 'foo.pipeline')
        with open(pipeline_file_path, 'w') as pipeline_file:
            with open(valid_file_path) as valid_file:
                valid_data = json.load(valid_file)
                # Update known component name to trigger a missing component
                valid_data['pipelines'][0]['nodes'][0]['op'] = valid_data['pipelines'][0]['nodes'][0]['op'] + 'Missing'
                pipeline_file.write(json.dumps(valid_data))

        result = runner.invoke(pipeline, ['describe', pipeline_file_path])
        assert "Description: 3-node custom component pipeline" in result.output
        assert "Type: KUBEFLOW_PIPELINES" in result.output
        assert "Nodes: 3" in result.output
        assert result.exit_code == 0


def test_validate_with_missing_kfp_component(kfp_runtime_instance):
    runner = CliRunner()
    with runner.isolated_filesystem():
        valid_file_path = os.path.join(os.path.dirname(__file__), 'resources', 'kfp_3_node_custom.pipeline')
        pipeline_file_path = os.path.join(os.getcwd(), 'foo.pipeline')
        with open(pipeline_file_path, 'w') as pipeline_file:
            with open(valid_file_path) as valid_file:
                valid_data = json.load(valid_file)
                # Update known component name to trigger a missing component
                valid_data['pipelines'][0]['nodes'][0]['op'] = valid_data['pipelines'][0]['nodes'][0]['op'] + 'Missing'
                pipeline_file.write(json.dumps(valid_data))

        result = runner.invoke(pipeline, ['validate', pipeline_file_path, '--runtime-config', kfp_runtime_instance])
        assert "Validating pipeline..." in result.output
        assert "[Error][Calculate data hash] - This component was not found in the catalog." in result.output
        assert result.exit_code != 0
