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
"""Tests for elyra-pipeline application"""
import json
from pathlib import Path
import shutil

from click.testing import CliRunner
from conftest import KFP_COMPONENT_CACHE_INSTANCE
import pytest

from elyra.cli.pipeline_app import pipeline
from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import Runtimes

# used to drive generic parameter handling tests
SUB_COMMANDS = ["run", "submit", "describe", "validate", "export"]


@pytest.fixture
def kubeflow_pipelines_runtime_instance():
    """Creates a Kubeflow Pipelines RTC and removes it after test."""
    instance_name = "valid_kfp_test_config"
    instance_config_file = Path(__file__).parent / "resources" / "runtime_configs" / f"{instance_name}.json"
    with open(instance_config_file, "r") as fd:
        instance_config = json.load(fd)

    md_mgr = MetadataManager(schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID)
    # clean possible orphaned instance...
    try:
        md_mgr.remove(instance_name)
    except Exception:
        pass
    runtime_instance = md_mgr.create(instance_name, Metadata(**instance_config))
    yield runtime_instance.name
    md_mgr.remove(runtime_instance.name)


@pytest.fixture
def airflow_runtime_instance():
    """Creates an airflow RTC and removes it after test."""
    instance_name = "valid_airflow_test_config"
    instance_config_file = Path(__file__).parent / "resources" / "runtime_configs" / f"{instance_name}.json"
    with open(instance_config_file, "r") as fd:
        instance_config = json.load(fd)

    md_mgr = MetadataManager(schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID)
    # clean possible orphaned instance...
    try:
        md_mgr.remove(instance_name)
    except Exception:
        pass
    runtime_instance = md_mgr.create(instance_name, Metadata(**instance_config))
    yield runtime_instance.name
    md_mgr.remove(runtime_instance.name)


def test_no_opts():
    """Verify that all commands are displayed in help"""
    runner = CliRunner()
    result = runner.invoke(pipeline)
    assert "run       Run a pipeline in your local environment" in result.output
    assert "submit    Submit a pipeline to be executed on the server" in result.output
    assert "describe  Display pipeline summary" in result.output
    assert "export    Export a pipeline to a runtime-specific format" in result.output
    assert "validate  Validate pipeline" in result.output

    assert result.exit_code == 0


def test_bad_subcommand():
    runner = CliRunner()
    result = runner.invoke(pipeline, ["invalid_command"])
    assert "Error: No such command 'invalid_command'" in result.output
    assert result.exit_code != 0


@pytest.mark.parametrize("subcommand", SUB_COMMANDS)
def test_subcommand_no_opts(subcommand):
    runner = CliRunner()
    result = runner.invoke(pipeline, [subcommand])
    assert result.exit_code != 0
    assert "Error: Missing argument 'PIPELINE_PATH'" in result.output


@pytest.mark.parametrize("subcommand", SUB_COMMANDS)
def test_subcommand_invalid_pipeline_path(subcommand):
    """Verify that every command only accepts a valid pipeline_path file name"""
    runner = CliRunner()

    # test: file not found
    file_name = "no-such.pipeline"
    result = runner.invoke(pipeline, [subcommand, file_name])
    assert result.exit_code != 0
    assert f"Invalid value for 'PIPELINE_PATH': '{file_name}' is not a file." in result.output

    # test: file with wrong extension
    with runner.isolated_filesystem():
        file_name = "wrong.extension"
        with open(file_name, "w") as f:
            f.write("I am not a pipeline file.")
        result = runner.invoke(pipeline, [subcommand, file_name])
        assert result.exit_code != 0
        assert f"Invalid value for 'PIPELINE_PATH': '{file_name}' is not a .pipeline file." in result.output


@pytest.mark.parametrize("subcommand", SUB_COMMANDS)
def test_subcommand_with_no_pipelines_field(subcommand, kubeflow_pipelines_runtime_instance):
    """Verify that every command properly detects pipeline issues"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        pipeline_file = "pipeline_without_pipelines_field.pipeline"
        pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / pipeline_file
        assert pipeline_file_path.is_file()

        # every CLI command invocation requires these parameters
        invoke_parameters = [subcommand, str(pipeline_file_path)]
        if subcommand in ["submit", "export"]:
            # these commands also require a runtime configuration
            invoke_parameters.extend(["--runtime-config", kubeflow_pipelines_runtime_instance])

        result = runner.invoke(pipeline, invoke_parameters)
        assert result.exit_code != 0
        assert "Pipeline is missing 'pipelines' field." in result.output


@pytest.mark.parametrize("subcommand", SUB_COMMANDS)
def test_subcommand_with_zero_length_pipelines_field(subcommand, kubeflow_pipelines_runtime_instance):
    """Verify that every command properly detects pipeline issues"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        pipeline_file = "pipeline_with_zero_length_pipelines_field.pipeline"
        pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / pipeline_file
        assert pipeline_file_path.is_file()

        # every CLI command invocation requires these parameters
        invoke_parameters = [subcommand, str(pipeline_file_path)]
        if subcommand in ["submit", "export"]:
            # these commands also require a runtime configuration
            invoke_parameters.extend(["--runtime-config", kubeflow_pipelines_runtime_instance])

        result = runner.invoke(pipeline, invoke_parameters)
        assert result.exit_code != 0
        assert "Pipeline has zero length 'pipelines' field." in result.output


@pytest.mark.parametrize("subcommand", SUB_COMMANDS)
def test_subcommand_with_no_nodes(subcommand, kubeflow_pipelines_runtime_instance):
    """Verify that every command properly detects pipeline issues"""

    # don't run this test for the `describe` command
    # (see test_describe_with_no_nodes)
    if subcommand == "describe":
        return

    runner = CliRunner()
    with runner.isolated_filesystem():
        pipeline_file = "pipeline_with_zero_nodes.pipeline"
        pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / pipeline_file
        assert pipeline_file_path.is_file()

        # every CLI command invocation requires these parameters
        invoke_parameters = [subcommand, str(pipeline_file_path)]
        if subcommand in ["submit", "export"]:
            # these commands also require a runtime configuration
            invoke_parameters.extend(["--runtime-config", kubeflow_pipelines_runtime_instance])

        result = runner.invoke(pipeline, invoke_parameters)
        assert result.exit_code != 0


def test_describe_with_no_nodes():
    runner = CliRunner()
    with runner.isolated_filesystem():
        pipeline_file = "pipeline_with_zero_nodes.pipeline"
        pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / pipeline_file
        assert pipeline_file_path.is_file()

        result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
        assert result.exit_code == 0, result.output
        assert "Description: None" in result.output
        assert "Type: KUBEFLOW_PIPELINES" in result.output
        assert "Nodes: 0" in result.output
        assert "File Dependencies:\n    None Listed" in result.output
        assert "Component Dependencies:\n    None Listed" in result.output


def test_describe_with_kfp_components():
    runner = CliRunner()
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"

    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert "Description: 3-node custom component pipeline" in result.output
    assert "Type: KUBEFLOW_PIPELINES" in result.output
    assert "Nodes: 3" in result.output
    assert "File Dependencies:\n    None Listed" in result.output
    assert (
        "- https://raw.githubusercontent.com/kubeflow/pipelines/1.6.0/components/"
        "basics/Calculate_hash/component.yaml" in result.output
    )
    assert (
        "- /opt/anaconda3/envs/elyra-dev/share/jupyter/components/"
        "kfp/filter_text_using_shell_and_grep.yaml" in result.output
    )
    assert (
        "- https://raw.githubusercontent.com/kubeflow/pipelines/1.6.0/components/"
        "web/Download/component.yaml" in result.output
    )
    assert result.exit_code == 0


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
def test_validate_with_kfp_components(jp_environ, kubeflow_pipelines_runtime_instance, catalog_instance):
    runner = CliRunner()
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(
        pipeline, ["validate", str(pipeline_file_path), "--runtime-config", kubeflow_pipelines_runtime_instance]
    )
    assert "Validating pipeline..." in result.output
    assert result.exit_code == 0


def test_describe_with_missing_kfp_component():
    runner = CliRunner()
    with runner.isolated_filesystem():
        valid_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
        pipeline_file_path = Path.cwd() / "foo.pipeline"
        with open(pipeline_file_path, "w") as pipeline_file:
            with open(valid_file_path) as valid_file:
                valid_data = json.load(valid_file)
                # Update known component name to trigger a missing component
                valid_data["pipelines"][0]["nodes"][0]["op"] = valid_data["pipelines"][0]["nodes"][0]["op"] + "Missing"
                pipeline_file.write(json.dumps(valid_data))

        result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
        assert "Description: 3-node custom component pipeline" in result.output
        assert "Type: KUBEFLOW_PIPELINES" in result.output
        assert "Nodes: 3" in result.output
        assert result.exit_code == 0


def test_validate_with_missing_kfp_component(jp_environ, kubeflow_pipelines_runtime_instance):
    runner = CliRunner()
    with runner.isolated_filesystem():
        valid_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
        pipeline_file_path = Path.cwd() / "foo.pipeline"
        with open(pipeline_file_path, "w") as pipeline_file:
            with open(valid_file_path) as valid_file:
                valid_data = json.load(valid_file)
                # Update known component name to trigger a missing component
                valid_data["pipelines"][0]["nodes"][0]["op"] = valid_data["pipelines"][0]["nodes"][0]["op"] + "Missing"
                pipeline_file.write(json.dumps(valid_data))

        result = runner.invoke(
            pipeline, ["validate", str(pipeline_file_path), "--runtime-config", kubeflow_pipelines_runtime_instance]
        )
        assert "Validating pipeline..." in result.output
        assert "[Error][Calculate data hash] - This component was not found in the catalog." in result.output
        assert result.exit_code != 0


def test_validate_with_no_runtime_config():
    runner = CliRunner()
    with runner.isolated_filesystem():
        pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
        result = runner.invoke(pipeline, ["validate", str(pipeline_file_path)])

        assert "Validating pipeline..." in result.output
        assert (
            "[Error] - This pipeline contains at least one runtime-specific component, "
            "but pipeline runtime is 'local'" in result.output
        )
        assert result.exit_code != 0


# ------------------------------------------------------------------
# tests for 'submit' command
# ------------------------------------------------------------------


def test_submit_invalid_monitor_interval_option(kubeflow_pipelines_runtime_instance):
    """Verify that the '--monitor-timeout' option works as expected"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        # dummy pipeline - it's not used
        pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
        assert pipeline_file_path.is_file()

        # this should fail: '--monitor-timeout' must be an integer
        invalid_option_value = "abc"
        result = runner.invoke(
            pipeline,
            [
                "submit",
                str(pipeline_file_path),
                "--runtime-config",
                kubeflow_pipelines_runtime_instance,
                "--monitor-timeout",
                invalid_option_value,
            ],
        )
        assert result.exit_code != 0
        assert (
            f"Invalid value for '--monitor-timeout': '{invalid_option_value}' is not "
            "a valid integer" in result.output
        )

        # this should fail: '--monitor-timeout' must be a positive integer
        invalid_option_value = 0
        result = runner.invoke(
            pipeline,
            [
                "submit",
                str(pipeline_file_path),
                "--runtime-config",
                kubeflow_pipelines_runtime_instance,
                "--monitor-timeout",
                invalid_option_value,
            ],
        )
        assert result.exit_code != 0
        assert (
            f"Invalid value for '--monitor-timeout': '{invalid_option_value}' is not "
            "a positive integer" in result.output
        )


# ------------------------------------------------------------------
# end tests for 'submit' command
# ------------------------------------------------------------------
# tests for 'export' command
# ------------------------------------------------------------------


def do_mock_export(output_path: str, dir_only=False):
    # simulate export result
    p = Path(output_path)
    # create parent directories, if required
    if not p.parent.is_dir():
        p.parent.mkdir(parents=True, exist_ok=True)
    if dir_only:
        return
    # create a mock export file
    with open(output_path, "w") as output:
        output.write("dummy export output")


def prepare_export_work_dir(work_dir: str, source_dir: str):
    """Copies the files in source_dir to work_dir"""
    for file in Path(source_dir).glob("*"):
        shutil.copy(str(file), work_dir)
    # print for debug purposes; this is only displayed if an assert fails
    print(f"Work directory content: {list(Path(work_dir).glob('*'))}")


def test_export_invalid_runtime_config():
    """Test user error scenarios: the specified runtime configuration is 'invalid'"""
    runner = CliRunner()

    # test pipeline; it's not used in this test
    pipeline_file = "kubeflow_pipelines.pipeline"
    p = Path(__file__).parent / "resources" / "pipelines" / f"{pipeline_file}"
    assert p.is_file()

    # no runtime configuration was specified
    result = runner.invoke(pipeline, ["export", str(p)])
    assert result.exit_code != 0, result.output
    assert "Error: Missing option '--runtime-config'." in result.output, result.output

    # runtime configuration does not exist
    config_name = "no-such-config"
    result = runner.invoke(pipeline, ["export", str(p), "--runtime-config", config_name])
    assert result.exit_code != 0, result.output
    assert f"Error: Invalid runtime configuration: {config_name}" in result.output
    assert f"No such instance named '{config_name}' was found in the runtimes schemaspace." in result.output


def test_export_incompatible_runtime_config(kubeflow_pipelines_runtime_instance, airflow_runtime_instance):
    """
    Test user error scenarios: the specified runtime configuration is not compatible
    with the pipeline type, e.g. KFP pipeline with Airflow runtime config
    """
    runner = CliRunner()

    # try exporting a KFP pipeline using an Airflow runtime configuration
    pipeline_file = "kubeflow_pipelines.pipeline"
    p = Path(__file__).parent / "resources" / "pipelines" / f"{pipeline_file}"
    assert p.is_file()

    # try export using Airflow runtime configuration
    result = runner.invoke(pipeline, ["export", str(p), "--runtime-config", airflow_runtime_instance])

    assert result.exit_code != 0, result.output
    assert (
        "The runtime configuration type 'APACHE_AIRFLOW' does not "
        "match the pipeline's runtime type 'KUBEFLOW_PIPELINES'." in result.output
    )

    # try exporting an Airflow pipeline using a Kubeflow Pipelines runtime configuration
    pipeline_file = "airflow.pipeline"
    p = Path(__file__).parent / "resources" / "pipelines" / f"{pipeline_file}"
    assert p.is_file()

    # try export using KFP runtime configuration
    result = runner.invoke(pipeline, ["export", str(p), "--runtime-config", kubeflow_pipelines_runtime_instance])

    assert result.exit_code != 0, result.output
    assert (
        "The runtime configuration type 'KUBEFLOW_PIPELINES' does not "
        "match the pipeline's runtime type 'APACHE_AIRFLOW'." in result.output
    )


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
def test_export_kubeflow_output_option(jp_environ, kubeflow_pipelines_runtime_instance, catalog_instance):
    """Verify that the '--output' option works as expected for Kubeflow Pipelines"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        cwd = Path.cwd().resolve()
        # copy pipeline file and depencencies
        prepare_export_work_dir(str(cwd), Path(__file__).parent / "resources" / "pipelines")
        pipeline_file = "kfp_3_node_custom.pipeline"
        pipeline_file_path = cwd / pipeline_file
        # make sure the pipeline file exists
        assert pipeline_file_path.is_file() is True
        print(f"Pipeline file: {pipeline_file_path}")

        # Test: '--output' not specified; exported file is created
        # in current directory and named like the pipeline file with
        # a '.yaml' suffix
        expected_output_file = pipeline_file_path.with_suffix(".yaml")

        # this should succeed
        result = runner.invoke(
            pipeline, ["export", str(pipeline_file_path), "--runtime-config", kubeflow_pipelines_runtime_instance]
        )

        assert result.exit_code == 0, result.output
        assert f"was exported to '{str(expected_output_file)}" in result.output, result.output

        # Test: '--output' specified and ends with '.yaml'
        expected_output_file = cwd / "test-dir" / "output.yaml"

        # this should succeed
        result = runner.invoke(
            pipeline,
            [
                "export",
                str(pipeline_file_path),
                "--runtime-config",
                kubeflow_pipelines_runtime_instance,
                "--output",
                str(expected_output_file),
            ],
        )

        assert result.exit_code == 0, result.output
        assert f"was exported to '{str(expected_output_file)}" in result.output, result.output

        # Test: '--output' specified and ends with '.yml'
        expected_output_file = cwd / "test-dir-2" / "output.yml"

        # this should succeed
        result = runner.invoke(
            pipeline,
            [
                "export",
                str(pipeline_file_path),
                "--runtime-config",
                kubeflow_pipelines_runtime_instance,
                "--output",
                str(expected_output_file),
            ],
        )

        assert result.exit_code == 0, result.output
        assert f"was exported to '{str(expected_output_file)}" in result.output, result.output


def test_export_airflow_output_option(airflow_runtime_instance):
    """Verify that the '--output' option works as expected for Airflow"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        cwd = Path.cwd().resolve()
        # copy pipeline file and depencencies
        prepare_export_work_dir(str(cwd), Path(__file__).parent / "resources" / "pipelines")
        pipeline_file = "airflow.pipeline"
        pipeline_file_path = cwd / pipeline_file
        # make sure the pipeline file exists
        assert pipeline_file_path.is_file() is True
        print(f"Pipeline file: {pipeline_file_path}")

        #
        # Test: '--output' not specified; exported file is created
        # in current directory and named like the pipeline file with
        # a '.py' suffix
        #
        expected_output_file = pipeline_file_path.with_suffix(".py")
        print(f"expected_output_file -> {expected_output_file}")
        do_mock_export(str(expected_output_file))

        # this should fail: default output file already exists
        result = runner.invoke(
            pipeline, ["export", str(pipeline_file_path), "--runtime-config", airflow_runtime_instance]
        )

        assert result.exit_code != 0, result.output
        assert (
            f"Error: Output file '{expected_output_file}' exists and option '--overwrite' "
            "was not specified." in result.output
        ), result.output

        #
        # Test: '--output' specified and ends with '.py' (the value is treated
        #       as a file name)
        #
        expected_output_file = cwd / "test-dir-2" / "output.py"
        do_mock_export(str(expected_output_file))

        # this should fail: specified output file already exists
        result = runner.invoke(
            pipeline,
            [
                "export",
                str(pipeline_file_path),
                "--runtime-config",
                airflow_runtime_instance,
                "--output",
                str(expected_output_file),
            ],
        )
        assert result.exit_code != 0, result.output
        assert (
            f"Error: Output file '{expected_output_file}' exists and option '--overwrite' "
            "was not specified." in result.output
        ), result.output

        #
        # Test: '--output' specified and does not end with '.py' (the value
        #       is treated as a directory)
        #
        output_dir = cwd / "test-dir-3"
        expected_output_file = output_dir / Path(pipeline_file).with_suffix(".py")
        do_mock_export(str(expected_output_file))

        # this should fail: specified output file already exists
        result = runner.invoke(
            pipeline,
            [
                "export",
                str(pipeline_file_path),
                "--runtime-config",
                airflow_runtime_instance,
                "--output",
                str(output_dir),
            ],
        )
        assert result.exit_code != 0, result.output
        assert (
            f"Error: Output file '{expected_output_file}' exists and option '--overwrite' "
            "was not specified." in result.output
        ), result.output


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
def test_export_kubeflow_overwrite_option(jp_environ, kubeflow_pipelines_runtime_instance, catalog_instance):
    """Verify that the '--overwrite' option works as expected for Kubeflow Pipelines"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        cwd = Path.cwd().resolve()
        # copy pipeline file and depencencies
        prepare_export_work_dir(str(cwd), Path(__file__).parent / "resources" / "pipelines")
        pipeline_file = "kfp_3_node_custom.pipeline"
        pipeline_file_path = cwd / pipeline_file
        # make sure the pipeline file exists
        assert pipeline_file_path.is_file() is True
        print(f"Pipeline file: {pipeline_file_path}")

        # Test: '--overwrite' not specified; exported file is created
        # in current directory and named like the pipeline file with
        # a '.yaml' suffix
        expected_output_file = pipeline_file_path.with_suffix(".yaml")

        # this should succeed
        result = runner.invoke(
            pipeline, ["export", str(pipeline_file_path), "--runtime-config", kubeflow_pipelines_runtime_instance]
        )

        assert result.exit_code == 0, result.output
        assert f"was exported to '{str(expected_output_file)}" in result.output, result.output

        # Test: '--overwrite' not specified; the output already exists
        # this should fail
        result = runner.invoke(
            pipeline, ["export", str(pipeline_file_path), "--runtime-config", kubeflow_pipelines_runtime_instance]
        )

        assert result.exit_code != 0, result.output
        assert f"Output file '{expected_output_file}' exists and option '--overwrite' was not" in result.output

        # Test: '--overwrite' specified; exported file is created
        # in current directory and named like the pipeline file with
        # a '.yaml' suffix
        # this should succeed
        result = runner.invoke(
            pipeline,
            ["export", str(pipeline_file_path), "--runtime-config", kubeflow_pipelines_runtime_instance, "--overwrite"],
        )

        assert result.exit_code == 0, result.output
        assert f"was exported to '{str(expected_output_file)}" in result.output, result.output


# ------------------------------------------------------------------
# end tests for 'export' command
# ------------------------------------------------------------------
