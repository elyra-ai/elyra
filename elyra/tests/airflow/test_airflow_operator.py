#
# Copyright 2018-2025 Elyra Authors
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
import pytest

from elyra.airflow.operator import BootscriptBuilder


def test_fail_without_cos_endpoint():
    with pytest.raises(TypeError):
        BootscriptBuilder(
            filename="test_notebook.ipynb",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
        )


def test_fail_without_cos_bucket():
    with pytest.raises(TypeError):
        BootscriptBuilder(
            filename="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
        )


def test_fail_without_cos_directory():
    with pytest.raises(TypeError):
        BootscriptBuilder(
            filename="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_dependencies_archive="test_archive.tgz",
        )


def test_fail_without_cos_dependencies_archive():
    with pytest.raises(TypeError):
        BootscriptBuilder(
            filename="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
        )


def test_fail_without_filename():
    with pytest.raises(TypeError):
        BootscriptBuilder(
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
        )


def test_fail_with_empty_string_as_filename():
    with pytest.raises(ValueError) as error_info:
        BootscriptBuilder(
            filename="",
            pipeline_name="test-pipeline",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
        )
    assert "You need to provide a filename for the operation." == str(error_info.value)


def test_build_cmd_with_inputs_and_outputs():
    pipeline_inputs = ["test.txt", "test2.txt"]
    pipeline_outputs = ["test3.txt", "test4.txt"]

    boot_build = BootscriptBuilder(
        filename="test_notebook.ipynb",
        pipeline_name="test-pipeline",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        inputs=pipeline_inputs,
        outputs=pipeline_outputs,
    )

    assert boot_build.inputs == pipeline_inputs
    assert boot_build.outputs == pipeline_outputs

    boot_arg_list = boot_build.container_cmd.split("--")
    for arg in boot_arg_list:
        arg_value = arg.split(" ")[1]
        if "outputs" in arg:
            assert arg_value == f"'{';'.join(pipeline_outputs)}'"
        if "inputs" in arg:
            assert arg_value == f"'{';'.join(pipeline_inputs)}'"
