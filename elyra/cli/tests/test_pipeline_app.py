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

PIPELINE_SOURCE_WITH_CIRCULAR_REFERENCE = """
{
  "doc_type": "pipeline",
  "version": "3.0",
  "id": "0",
  "primary_pipeline": "1",
  "pipelines": [
    {
      "id": "1",
      "nodes": [
        {
          "id": "a",
          "type": "execution_node",
          "op": "execute-notebook-node",
          "app_data": {
            "filename": "x.ipynb",
            "runtime_image": "x",
            "ui_data": {
              "label": "x.ipynb"
            }
          },
          "inputs": [
            {
              "id": "inPort",
              "links": [
                {
                  "id": "ba",
                  "node_id_ref": "b",
                  "port_id_ref": "outPort"
                }
              ]
            }
          ],
          "outputs": [
            {
              "id": "outPort"
            }
          ]
        },
        {
          "id": "b",
          "type": "execution_node",
          "op": "execute-notebook-node",
          "app_data": {
            "filename": "x.ipynb",
            "runtime_image": "x",
            "ui_data": {
              "label": "x.ipynb"
            }
          },
          "inputs": [
            {
              "id": "inPort",
              "links": [
                {
                  "id": "ab",
                  "node_id_ref": "a",
                  "port_id_ref": "outPort"
                }
              ]
            }
          ],
          "outputs": [
            {
              "id": "outPort"
            }
          ]
        }
      ],
      "app_data": {
        "version": 3
      }
    }
  ],
  "schemas": []
}
"""


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
        err = \
            "The connection between nodes 'x.ipynb' and 'x.ipynb' is part of a circular reference."
        assert err in result.output
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
