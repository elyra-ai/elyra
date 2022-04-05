#
# Copyright 2018-2022 Elyra Authors
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
import string

from kfp.dsl import RUN_ID_PLACEHOLDER
import pytest

from elyra.kfp.operator import ExecuteFileOp


def test_fail_without_cos_endpoint():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_fail_without_cos_bucket():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_fail_without_cos_directory():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_fail_without_cos_dependencies_archive():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            image="test/image:dev",
        )


def test_fail_without_runtime_image():
    with pytest.raises(ValueError) as error_info:
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
        )
    assert "You need to provide an image." == str(error_info.value)


def test_fail_without_notebook():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_fail_without_name():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_fail_with_empty_string_as_name():
    with pytest.raises(ValueError):
        ExecuteFileOp(
            name="",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_fail_with_empty_string_as_notebook():
    with pytest.raises(ValueError) as error_info:
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )
    assert "You need to provide a notebook." == str(error_info.value)


def test_fail_without_pipeline_name():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            name="test",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_fail_without_experiment_name():
    with pytest.raises(TypeError):
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            image="test/image:dev",
        )


def test_properly_set_notebook_name_when_in_subdirectory():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="foo/test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        image="test/image:dev",
    )
    assert "test_notebook.ipynb" == notebook_op.notebook_name


def test_properly_set_python_script_name_when_in_subdirectory():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="foo/test.py",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        image="test/image:dev",
    )
    assert "test.py" == notebook_op.notebook_name


def test_user_crio_volume_creation():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        image="test/image:dev",
        emptydir_volume_size="20Gi",
    )
    assert notebook_op.emptydir_volume_size == "20Gi"
    assert notebook_op.container_work_dir_root_path == "/opt/app-root/src/"
    assert notebook_op.container.volume_mounts.__len__() == 1
    # Environment variables: PYTHONPATH, ELYRA_RUN_NAME
    assert notebook_op.container.env.__len__() == 2, notebook_op.container.env


def test_override_bootstrap_url():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        bootstrap_script_url="https://test.server.com/bootscript.py",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        image="test/image:dev",
    )
    assert notebook_op.bootstrap_script_url == "https://test.server.com/bootscript.py"


def test_override_requirements_url():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        requirements_url="https://test.server.com/requirements.py",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        image="test/image:dev",
    )
    assert notebook_op.requirements_url == "https://test.server.com/requirements.py"


def test_construct_with_both_pipeline_inputs_and_outputs():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        pipeline_inputs=["test_input1.txt", "test_input2.txt"],
        pipeline_outputs=["test_output1.txt", "test_output2.txt"],
        image="test/image:dev",
    )
    assert notebook_op.pipeline_inputs == ["test_input1.txt", "test_input2.txt"]
    assert notebook_op.pipeline_outputs == ["test_output1.txt", "test_output2.txt"]

    assert '--inputs "test_input1.txt;test_input2.txt"' in notebook_op.container.args[0]
    assert '--outputs "test_output1.txt;test_output2.txt"' in notebook_op.container.args[0]


def test_construct_wildcard_outputs():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        pipeline_inputs=["test_input1.txt", "test_input2.txt"],
        pipeline_outputs=["test_out*", "foo.tar"],
        image="test/image:dev",
    )
    assert notebook_op.pipeline_inputs == ["test_input1.txt", "test_input2.txt"]
    assert notebook_op.pipeline_outputs == ["test_out*", "foo.tar"]

    assert '--inputs "test_input1.txt;test_input2.txt"' in notebook_op.container.args[0]
    assert '--outputs "test_out*;foo.tar"' in notebook_op.container.args[0]


def test_construct_with_only_pipeline_inputs():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        pipeline_inputs=["test_input1.txt", "test,input2.txt"],
        pipeline_outputs=[],
        image="test/image:dev",
    )
    assert notebook_op.pipeline_inputs == ["test_input1.txt", "test,input2.txt"]
    assert '--inputs "test_input1.txt;test,input2.txt"' in notebook_op.container.args[0]


def test_construct_with_bad_pipeline_inputs():
    with pytest.raises(ValueError) as error_info:
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            pipeline_inputs=["test_input1.txt", "test;input2.txt"],
            pipeline_outputs=[],
            image="test/image:dev",
        )
    assert "Illegal character (;) found in filename 'test;input2.txt'." == str(error_info.value)


def test_construct_with_only_pipeline_outputs():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        pipeline_outputs=["test_output1.txt", "test,output2.txt"],
        pipeline_envs={},
        image="test/image:dev",
    )
    assert notebook_op.pipeline_outputs == ["test_output1.txt", "test,output2.txt"]
    assert '--outputs "test_output1.txt;test,output2.txt"' in notebook_op.container.args[0]


def test_construct_with_bad_pipeline_outputs():
    with pytest.raises(ValueError) as error_info:
        ExecuteFileOp(
            name="test",
            pipeline_name="test-pipeline",
            experiment_name="experiment-name",
            notebook="test_notebook.ipynb",
            cos_endpoint="http://testserver:32525",
            cos_bucket="test_bucket",
            cos_directory="test_directory",
            cos_dependencies_archive="test_archive.tgz",
            pipeline_outputs=["test_output1.txt", "test;output2.txt"],
            image="test/image:dev",
        )
    assert "Illegal character (;) found in filename 'test;output2.txt'." == str(error_info.value)


def test_construct_with_env_variables_argo():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        pipeline_envs={"ENV_VAR_ONE": "1", "ENV_VAR_TWO": "2", "ENV_VAR_THREE": "3"},
        image="test/image:dev",
    )

    confirmation_names = ["ENV_VAR_ONE", "ENV_VAR_TWO", "ENV_VAR_THREE", "ELYRA_RUN_NAME"]
    confirmation_values = ["1", "2", "3", RUN_ID_PLACEHOLDER]
    for env_val in notebook_op.container.env:
        assert env_val.name in confirmation_names
        assert env_val.value in confirmation_values
        confirmation_names.remove(env_val.name)
        confirmation_values.remove(env_val.value)

    # Verify confirmation values have been drained.
    assert len(confirmation_names) == 0
    assert len(confirmation_values) == 0

    # same as before but explicitly specify the workflow engine type
    # as Argo
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        pipeline_envs={"ENV_VAR_ONE": "1", "ENV_VAR_TWO": "2", "ENV_VAR_THREE": "3"},
        image="test/image:dev",
        workflow_engine="Argo",
    )

    confirmation_names = ["ENV_VAR_ONE", "ENV_VAR_TWO", "ENV_VAR_THREE", "ELYRA_RUN_NAME"]
    confirmation_values = ["1", "2", "3", RUN_ID_PLACEHOLDER]
    for env_val in notebook_op.container.env:
        assert env_val.name in confirmation_names
        assert env_val.value in confirmation_values
        confirmation_names.remove(env_val.name)
        confirmation_values.remove(env_val.value)

    # Verify confirmation values have been drained.
    assert len(confirmation_names) == 0
    assert len(confirmation_values) == 0


def test_construct_with_env_variables_tekton():
    notebook_op = ExecuteFileOp(
        name="test",
        pipeline_name="test-pipeline",
        experiment_name="experiment-name",
        notebook="test_notebook.ipynb",
        cos_endpoint="http://testserver:32525",
        cos_bucket="test_bucket",
        cos_directory="test_directory",
        cos_dependencies_archive="test_archive.tgz",
        pipeline_envs={"ENV_VAR_ONE": "1", "ENV_VAR_TWO": "2", "ENV_VAR_THREE": "3"},
        image="test/image:dev",
        workflow_engine="Tekton",
    )

    confirmation_names = ["ENV_VAR_ONE", "ENV_VAR_TWO", "ENV_VAR_THREE", "ELYRA_RUN_NAME"]
    confirmation_values = ["1", "2", "3"]
    field_path = "metadata.annotations['pipelines.kubeflow.org/run_name']"
    for env_val in notebook_op.container.env:
        assert env_val.name in confirmation_names
        confirmation_names.remove(env_val.name)
        if env_val.name == "ELYRA_RUN_NAME":
            assert env_val.value_from.field_ref.field_path == field_path, env_val.value_from.field_ref
        else:
            assert env_val.value in confirmation_values
            confirmation_values.remove(env_val.value)

    # Verify confirmation values have been drained.
    assert len(confirmation_names) == 0
    assert len(confirmation_values) == 0


def test_normalize_label_value():
    valid_middle_chars = "-_."

    # test min length
    assert ExecuteFileOp._normalize_label_value(None) == ""
    assert ExecuteFileOp._normalize_label_value("") == ""
    # test max length (63)
    assert ExecuteFileOp._normalize_label_value("a" * 63) == "a" * 63
    assert ExecuteFileOp._normalize_label_value("a" * 64) == "a" * 63  # truncated
    # test first and last char
    assert ExecuteFileOp._normalize_label_value("1") == "1"
    assert ExecuteFileOp._normalize_label_value("22") == "22"
    assert ExecuteFileOp._normalize_label_value("3_3") == "3_3"
    assert ExecuteFileOp._normalize_label_value("4u4") == "4u4"
    assert ExecuteFileOp._normalize_label_value("5$5") == "5_5"

    # test first char
    for c in string.printable:
        if c in string.ascii_letters + string.digits:
            # first char is valid
            # no length violation
            assert ExecuteFileOp._normalize_label_value(c) == c
            assert ExecuteFileOp._normalize_label_value(c + "B") == c + "B"
            # max length
            assert ExecuteFileOp._normalize_label_value(c + "B" * 62) == (c + "B" * 62)
            # max length exceeded
            assert ExecuteFileOp._normalize_label_value(c + "B" * 63) == (c + "B" * 62)  # truncated
        else:
            # first char is invalid, e.g. '#a', and becomes the
            # second char, which might require replacement
            rv = c
            if c not in valid_middle_chars:
                rv = "_"
            # no length violation
            assert ExecuteFileOp._normalize_label_value(c) == "a" + rv + "a"
            assert ExecuteFileOp._normalize_label_value(c + "B") == "a" + rv + "B"
            # max length
            assert ExecuteFileOp._normalize_label_value(c + "B" * 62) == ("a" + rv + "B" * 61)  # truncated
            # max length exceeded
            assert ExecuteFileOp._normalize_label_value(c + "B" * 63) == ("a" + rv + "B" * 61)  # truncated

    # test last char
    for c in string.printable:
        if c in string.ascii_letters + string.digits:
            # no length violation
            assert ExecuteFileOp._normalize_label_value("b" + c) == "b" + c
            # max length
            assert ExecuteFileOp._normalize_label_value("b" * 62 + c) == ("b" * 62 + c)
            # max length exceeded
            assert ExecuteFileOp._normalize_label_value("b" * 63 + c) == ("b" * 63)
        else:
            # last char is invalid, e.g. 'a#', and requires
            # patching
            rv = c
            if c not in valid_middle_chars:
                rv = "_"
            # no length violation (char is appended)
            assert ExecuteFileOp._normalize_label_value("b" + c) == "b" + rv + "a"
            # max length (char is replaced)
            assert ExecuteFileOp._normalize_label_value("b" * 62 + c) == ("b" * 62 + "a")
            # max length exceeded (no action required)
            assert ExecuteFileOp._normalize_label_value("b" * 63 + c) == ("b" * 63)

    # test first and last char
    for c in string.printable:
        if c in string.ascii_letters + string.digits:
            # no length violation
            assert ExecuteFileOp._normalize_label_value(c + "b" + c) == c + "b" + c  # nothing is modified
            # max length
            assert ExecuteFileOp._normalize_label_value(c + "b" * 61 + c) == (c + "b" * 61 + c)  # nothing is modified
            # max length exceeded
            assert ExecuteFileOp._normalize_label_value(c + "b" * 62 + c) == c + "b" * 62  # truncate only
        else:
            # first and last characters are invalid, e.g. '#a#'
            rv = c
            if c not in valid_middle_chars:
                rv = "_"
            # no length violation
            assert ExecuteFileOp._normalize_label_value(c + "b" + c) == "a" + rv + "b" + rv + "a"
            # max length
            assert ExecuteFileOp._normalize_label_value(c + "b" * 59 + c) == ("a" + rv + "b" * 59 + rv + "a")
            # max length exceeded after processing, scenario 1
            # resolved by adding char before first, replace last
            assert ExecuteFileOp._normalize_label_value(c + "b" * 60 + c) == ("a" + rv + "b" * 60 + "a")
            # max length exceeded after processing, scenario 2
            # resolved by adding char before first, appending after last
            assert ExecuteFileOp._normalize_label_value(c + "b" * 59 + c) == ("a" + rv + "b" * 59 + rv + "a")
            # max length exceeded before processing, scenario 1
            # resolved by adding char before first, truncating last
            assert ExecuteFileOp._normalize_label_value(c + "b" * 62 + c) == ("a" + rv + "b" * 61)
            # max length exceeded before processing, scenario 2
            # resolved by adding char before first, replacing last
            assert ExecuteFileOp._normalize_label_value(c + "b" * 60 + c * 3) == ("a" + rv + "b" * 60 + "a")

    # test char in a position other than first and last
    # if invalid, the char is replaced with '_'
    for c in string.printable:
        if c in string.ascii_letters + string.digits + "-_.":
            assert ExecuteFileOp._normalize_label_value("A" + c + "Z") == "A" + c + "Z"
        else:
            assert ExecuteFileOp._normalize_label_value("A" + c + "Z") == "A_Z"

    # encore
    assert ExecuteFileOp._normalize_label_value(r"¯\_(ツ)_/¯") == "a_________a"
