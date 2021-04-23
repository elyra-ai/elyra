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
import os
import elyra.cli.pipeline_app as pipeline_app
from elyra.cli.pipeline_app import pipeline
from click.testing import CliRunner

SUB_COMMANDS = ['run', 'submit']

PIPELINE_SOURCE_WITH_ZERO_LENGTH_PIPELINES_FIELD = \
    '{"doc_type":"pipeline","version":"3.0","id":"0","primary_pipeline":"1","pipelines":[],"schemas":[]}'

PIPELINE_SOURCE_WITHOUT_PIPELINES_FIELD = \
    '{"doc_type":"pipeline","version":"3.0","id":"0","primary_pipeline":"1","schemas":[]}'

PIPELINE_SOURCE_WITH_CIRCULAR_REFERENCE = \
    '{"doc_type":"pipeline","version":"3.0","json_schema":"http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json","id":"8f80e2e5-cc20-4e4a-902f-43da7b89bfc1","primary_pipeline":"1a623718-7d8e-49da-b593-d57c0ed66665","pipelines":[{"id":"1a623718-7d8e-49da-b593-d57c0ed66665","nodes":[{"id":"b1dc8229-7184-4b03-9fec-8fdf65b35af0","type":"execution_node","op":"execute-notebook-node","app_data":{"filename":"hello.ipynb","runtime_image":"","dependencies":[],"include_subdirectories":false,"env_vars":[],"outputs":[],"ui_data":{"label":"hello.ipynb","image":"data:image/svg+xml;utf8,%3Csvg%20opacity%3D%220.8%22%20version%3D%222.0%22%20viewBox%3D%220%200%20300%20300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Afigma%3D%22http%3A%2F%2Fwww.figma.com%2Ffigma%2Fns%22%3E%3Ctitle%3Elogo.svg%3C%2Ftitle%3E%3Cdesc%3ECreated%20using%20Figma%200.90%3C%2Fdesc%3E%3Cg%20id%3D%22Canvas%22%20transform%3D%22translate(-1638%2C-1844)%22%20figma%3Atype%3D%22canvas%22%3E%3Cg%20id%3D%22logo%22%20style%3D%22mix-blend-mode%3Anormal%22%20figma%3Atype%3D%22group%22%3E%3Cpath%20d%3D%22m1788%201886a108.02%20108.02%200%200%200%20-104.92%2082.828%20114.07%2064.249%200%200%201%20104.92%20-39.053%20114.07%2064.249%200%200%201%20104.96%2039.261%20108.02%20108.02%200%200%200%20-104.96%20-83.037zm-104.96%20133.01a108.02%20108.02%200%200%200%20104.96%2083.037%20108.02%20108.02%200%200%200%20104.92%20-82.828%20114.07%2064.249%200%200%201%20-104.92%2039.053%20114.07%2064.249%200%200%201%20-104.96%20-39.261z%22%20style%3D%22fill%3A%23f57c00%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221699.5%22%20cy%3D%222110.8%22%20r%3D%2222.627%22%20style%3D%22fill%3A%239e9e9e%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221684.3%22%20cy%3D%221892.6%22%20r%3D%2216.617%22%20style%3D%22fill%3A%23616161%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221879.8%22%20cy%3D%221877.4%22%20r%3D%2221.213%22%20style%3D%22fill%3A%23757575%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E%0D%0A","x_pos":367,"y_pos":272,"description":"Notebook file"}},"inputs":[{"id":"inPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Input Port"}},"links":[{"id":"Bbj3VUvQ3IF6pFE3PMH49","node_id_ref":"b2fe7008-4434-4d94-8983-1e0dd5bbc293","port_id_ref":"outPort","app_data":{"ui_data":{"class_name":"d3-data-link-error"}}}]}],"outputs":[{"id":"outPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Output Port"}}}]},{"id":"b2fe7008-4434-4d94-8983-1e0dd5bbc293","type":"execution_node","op":"execute-notebook-node","app_data":{"filename":"hello.ipynb","runtime_image":null,"dependencies":[],"include_subdirectories":false,"env_vars":[],"outputs":[],"ui_data":{"label":"hello.ipynb","image":"data:image/svg+xml;utf8,%3Csvg%20opacity%3D%220.8%22%20version%3D%222.0%22%20viewBox%3D%220%200%20300%20300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Afigma%3D%22http%3A%2F%2Fwww.figma.com%2Ffigma%2Fns%22%3E%3Ctitle%3Elogo.svg%3C%2Ftitle%3E%3Cdesc%3ECreated%20using%20Figma%200.90%3C%2Fdesc%3E%3Cg%20id%3D%22Canvas%22%20transform%3D%22translate(-1638%2C-1844)%22%20figma%3Atype%3D%22canvas%22%3E%3Cg%20id%3D%22logo%22%20style%3D%22mix-blend-mode%3Anormal%22%20figma%3Atype%3D%22group%22%3E%3Cpath%20d%3D%22m1788%201886a108.02%20108.02%200%200%200%20-104.92%2082.828%20114.07%2064.249%200%200%201%20104.92%20-39.053%20114.07%2064.249%200%200%201%20104.96%2039.261%20108.02%20108.02%200%200%200%20-104.96%20-83.037zm-104.96%20133.01a108.02%20108.02%200%200%200%20104.96%2083.037%20108.02%20108.02%200%200%200%20104.92%20-82.828%20114.07%2064.249%200%200%201%20-104.92%2039.053%20114.07%2064.249%200%200%201%20-104.96%20-39.261z%22%20style%3D%22fill%3A%23f57c00%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221699.5%22%20cy%3D%222110.8%22%20r%3D%2222.627%22%20style%3D%22fill%3A%239e9e9e%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221684.3%22%20cy%3D%221892.6%22%20r%3D%2216.617%22%20style%3D%22fill%3A%23616161%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221879.8%22%20cy%3D%221877.4%22%20r%3D%2221.213%22%20style%3D%22fill%3A%23757575%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E%0D%0A","x_pos":596,"y_pos":144,"description":"Notebook file"}},"inputs":[{"id":"inPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Input Port"}},"links":[{"id":"86d43ab5-a1f2-4a2e-aa8c-bfa035d46ac8","node_id_ref":"b1dc8229-7184-4b03-9fec-8fdf65b35af0","port_id_ref":"outPort"}]}],"outputs":[{"id":"outPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Output Port"}}}]}],"app_data":{"ui_data":{"comments":[]},"version":3},"runtime_ref":""}],"schemas":[]}'

def mock_get_runtime_type(runtime_config: str) -> str:
    return "kfp"


def test_no_opts():
    runner = CliRunner()
    result = runner.invoke(pipeline)
    assert 'run     Run a pipeline in your local environment' in result.output
    assert 'submit  Submit a pipeline to be executed on the server' in result.output
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


def test_run_with_circular_reference():
    runner = CliRunner()

    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_CIRCULAR_REFERENCE)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        result = runner.invoke(pipeline, ['run', pipeline_file_path])
        assert "The connection between nodes 'hello.ipynb' and 'hello.ipynb' is part of a circular reference." in result.output
        assert result.exit_code != 0


def test_run_with_invalid_pipeline():
    runner = CliRunner()

    result = runner.invoke(pipeline, ['run', 'foo.pipeline'])
    assert "Pipeline file not found:" in result.output
    assert "foo.pipeline" in result.output
    assert result.exit_code != 0


def test_submit_with_invalid_pipeline(monkeypatch):
    runner = CliRunner()

    monkeypatch.setattr(pipeline_app, "_get_runtime_type", mock_get_runtime_type)

    result = runner.invoke(pipeline, ['submit', 'foo.pipeline',
                                      '--runtime-config', 'foo'])
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


def test_submit_with_unsupported_file_type(monkeypatch):
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.ipynb', 'w') as f:
            f.write('{ "nbformat": 4, "cells": [] }')

        monkeypatch.setattr(pipeline_app, "_get_runtime_type", mock_get_runtime_type)

        result = runner.invoke(pipeline, ['submit', 'foo.ipynb',
                                          '--runtime-config', 'foo'])
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


def test_submit_with_no_pipelines_field(monkeypatch):
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITHOUT_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        monkeypatch.setattr(pipeline_app, "_get_runtime_type", mock_get_runtime_type)

        result = runner.invoke(pipeline, ['submit', pipeline_file_path,
                                          '--runtime-config', 'foo'])
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


def test_submit_with_zero_length_pipelines_field(monkeypatch):
    runner = CliRunner()
    with runner.isolated_filesystem():
        with open('foo.pipeline', 'w') as pipeline_file:
            pipeline_file.write(PIPELINE_SOURCE_WITH_ZERO_LENGTH_PIPELINES_FIELD)
            pipeline_file_path = os.path.join(os.getcwd(), pipeline_file.name)

        monkeypatch.setattr(pipeline_app, "_get_runtime_type", mock_get_runtime_type)

        result = runner.invoke(pipeline, ['submit', pipeline_file_path,
                                          '--runtime-config', 'foo'])
        assert "Pipeline has zero length 'pipelines' field." in result.output
        assert result.exit_code != 0
