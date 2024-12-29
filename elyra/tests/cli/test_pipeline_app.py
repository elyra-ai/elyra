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
"""Tests for elyra-pipeline application"""
import json
from pathlib import Path
import shutil
from typing import List
from typing import Union

from click.testing import CliRunner
from conftest import KFP_COMPONENT_CACHE_INSTANCE
import pytest

from elyra.cli.pipeline_app import pipeline
from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import Runtimes
from elyra.pipeline.component_catalog import ComponentCache

# used to drive generic parameter handling tests
SUB_COMMANDS = ["run", "submit", "describe", "validate", "export"]


@pytest.fixture(autouse=True)
def destroy_component_cache():
    """
    This fixture clears any ComponentCache instances that
    may have been created during CLI processes so that
    those instance doesn't side-affect later tests.
    """
    yield
    ComponentCache.clear_instance()


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


# ------------------------------------------------------------------
# tests for 'describe' command
# ------------------------------------------------------------------


def test_describe_with_no_nodes():
    """
    Verify that describe yields the expected results if a pipeline without any
    nodes is is provided as input.
    """
    runner = CliRunner()
    with runner.isolated_filesystem():
        pipeline_file = "pipeline_with_zero_nodes.pipeline"
        pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / pipeline_file
        assert pipeline_file_path.is_file()

        # verify human-readable output
        result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
        assert result.exit_code == 0, result.output
        assert "Pipeline name: pipeline_with_zero_nodes" in result.output
        assert "Description: None specified" in result.output
        assert "Pipeline type: None specified" in result.output
        assert "Pipeline runtime: Generic" in result.output
        assert "Pipeline format version: 7" in result.output
        assert "Number of generic nodes: 0" in result.output
        assert "Number of generic nodes: 0" in result.output
        assert "Script dependencies: None specified" in result.output
        assert "Notebook dependencies: None specified" in result.output
        assert "Local file dependencies: None specified" in result.output
        assert "Component dependencies: None specified" in result.output
        assert "Volume dependencies: None specified" in result.output
        assert "Container image dependencies: None specified" in result.output
        assert "Kubernetes secret dependencies: None specified" in result.output

        # verify machine-readable output
        result = runner.invoke(pipeline, ["describe", str(pipeline_file_path), "--json"])
        assert result.exit_code == 0, result.output
        result_json = json.loads(result.output)
        assert result_json["name"] == "pipeline_with_zero_nodes"
        assert result_json["description"] is None
        assert result_json["pipeline_type"] is None
        assert result_json["pipeline_format_version"] == 7
        assert result_json["pipeline_runtime"] == "Generic"
        assert result_json["generic_node_count"] == 0
        assert result_json["custom_node_count"] == 0
        for property in [
            "scripts",
            "notebooks",
            "files",
            "custom_components",
            "container_images",
            "volumes",
            "kubernetes_secrets",
        ]:
            assert isinstance(result_json["dependencies"][property], list)
            assert len(result_json["dependencies"][property]) == 0


def test_describe_with_kfp_components():
    runner = CliRunner()
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"

    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert "Description: 3-node custom component pipeline" in result.output
    assert "Pipeline type: KUBEFLOW_PIPELINES" in result.output
    assert "Number of custom nodes: 3" in result.output
    assert "Number of generic nodes: 0" in result.output
    assert "Local file dependencies: None specified" in result.output
    assert (
        '- {"catalog_type": "elyra-kfp-examples-catalog", "component_ref": {"component-id": "download_data.yaml"}}'
        in result.output
    )
    assert (
        '- {"catalog_type": "elyra-kfp-examples-catalog", "component_ref": '
        '{"component-id": "filter_text_using_shell_and_grep.yaml"}}' in result.output
    )
    assert (
        '- {"catalog_type": "elyra-kfp-examples-catalog", "component_ref": {"component-id": "calculate_hash.yaml"}}'
        in result.output
    )
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
        assert "Pipeline type: KUBEFLOW_PIPELINES" in result.output
        assert "Number of custom nodes: 3" in result.output
        assert "Number of generic nodes: 0" in result.output

        assert result.exit_code == 0


def test_describe_notebooks_scripts_report():
    """
    Test human-readable output for notebooks/scripts property when none, one or many instances are present
    """
    runner = CliRunner()

    #
    # Pipeline references no notebooks/no scripts:
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only script nodes
    # - Pipeline contains only notebook nodes
    # - Pipeline contains only custom components

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Notebook dependencies: None specified" in result.output

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Script dependencies: None specified" in result.output

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Notebook dependencies: None specified" in result.output
    assert "Script dependencies: None specified" in result.output

    #
    # Pipeline references multiple notebooks:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Notebook dependencies:\n" in result.output
    assert "notebooks/notebook_1.ipynb" in result.output
    assert "notebooks/notebook_2.ipynb" in result.output
    # Ensure no entries for scripts
    assert "Script dependencies: None specified" in result.output
    assert "Number of generic nodes: 2" in result.output
    assert "Number of custom nodes: 0" in result.output

    #
    # Pipeline references multiple scripts:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Script dependencies:\n" in result.output
    assert "scripts/script_1.py" in result.output
    assert "scripts/script_2.py" in result.output
    assert "scripts/script_3.py" in result.output
    # Ensure no entries for notebooks
    assert "Notebook dependencies: None specified" in result.output
    assert "Number of generic nodes: 3" in result.output
    assert "Number of custom nodes: 0" in result.output

    #
    # Pipeline references multiple notebooks and scripts:
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Notebook dependencies:\n" in result.output
    assert "notebooks/notebook_1.ipynb" in result.output
    assert "notebooks/notebook_2.ipynb" in result.output
    assert "Script dependencies:\n" in result.output
    assert "scripts/script_1.py" in result.output
    assert "scripts/script_2.py" in result.output
    assert "scripts/script_3.py" in result.output
    assert "Number of generic nodes: 5" in result.output
    assert "Number of custom nodes: 0" in result.output


def test_describe_notebooks_scripts_json():
    """
    Test machine-readable output for notebooks/scripts property when none, one or many instances are present
    """
    runner = CliRunner()

    #
    # Pipeline references no notebooks/no scripts:
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only script nodes
    # - Pipeline contains only notebook nodes
    # - Pipeline contains only custom components

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 3
    assert result_json["custom_node_count"] == 0
    dependencies = result_json.get("dependencies")
    assert isinstance(dependencies.get("notebooks"), list)
    assert len(dependencies.get("notebooks")) == 0

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 2
    assert result_json["custom_node_count"] == 0
    dependencies = result_json.get("dependencies")
    assert isinstance(dependencies.get("scripts"), list)
    assert len(dependencies.get("scripts")) == 0

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 0
    assert result_json["custom_node_count"] == 3
    dependencies = result_json.get("dependencies")
    assert isinstance(dependencies.get("notebooks"), list)
    assert len(dependencies.get("notebooks")) == 0
    assert isinstance(dependencies.get("scripts"), list)
    assert len(dependencies.get("scripts")) == 0

    #
    # Pipeline references multiple notebooks:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 2
    assert result_json["custom_node_count"] == 0
    dependencies = result_json.get("dependencies")
    assert isinstance(dependencies.get("notebooks"), list)
    assert any(x.endswith("notebooks/notebook_1.ipynb") for x in dependencies["notebooks"]), dependencies["notebooks"]
    assert any(x.endswith("notebooks/notebook_2.ipynb") for x in dependencies["notebooks"]), dependencies["notebooks"]
    # Ensure no entries for scripts
    assert isinstance(dependencies.get("scripts"), list)
    assert len(dependencies.get("scripts")) == 0

    #
    # Pipeline references multiple scripts:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 3
    assert result_json["custom_node_count"] == 0
    dependencies = result_json.get("dependencies")
    assert isinstance(dependencies.get("scripts"), list)
    assert len(dependencies.get("scripts")) == 3
    assert any(x.endswith("scripts/script_1.py") for x in dependencies["scripts"]), dependencies["scripts"]
    assert any(x.endswith("scripts/script_2.py") for x in dependencies["scripts"]), dependencies["scripts"]
    assert any(x.endswith("scripts/script_3.py") for x in dependencies["scripts"]), dependencies["scripts"]

    # Ensure no entries for notebooks
    assert isinstance(dependencies.get("notebooks"), list)
    assert len(dependencies.get("notebooks")) == 0

    #
    # Pipeline references multiple notebooks and scripts:
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 5
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json.get("dependencies")
    assert isinstance(dependencies.get("scripts"), list)
    assert len(dependencies.get("scripts")) == 3
    assert any(x.endswith("scripts/script_1.py") for x in dependencies["scripts"]), dependencies["scripts"]
    assert any(x.endswith("scripts/script_2.py") for x in dependencies["scripts"]), dependencies["scripts"]
    assert any(x.endswith("scripts/script_3.py") for x in dependencies["scripts"]), dependencies["scripts"]
    assert isinstance(dependencies.get("notebooks"), list)
    assert len(dependencies.get("notebooks")) == 2
    assert any(x.endswith("notebooks/notebook_1.ipynb") for x in dependencies["notebooks"]), dependencies["notebooks"]
    assert any(x.endswith("notebooks/notebook_2.ipynb") for x in dependencies["notebooks"]), dependencies["notebooks"]


def test_describe_container_images_report():
    """
    Test report output for container_images property when none, one or many instances are present
    """
    runner = CliRunner()

    #
    # Pipeline references no container images
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only custom components

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Container image dependencies: None specified" in result.output

    #
    # Pipeline references multiple container images through notebook nodes:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Container image dependencies:\n" in result.output
    assert "- tensorflow/tensorflow:2.8.0" in result.output, result.output

    #
    # Pipeline references multiple container images through script nodes
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Container image dependencies:\n" in result.output, result.output
    assert "- tensorflow/tensorflow:2.8.0-gpu" in result.output, result.output
    assert "- tensorflow/tensorflow:2.8.0" in result.output, result.output

    #
    # Pipeline references multiple notebooks and scripts:
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Container image dependencies:\n" in result.output
    assert "- tensorflow/tensorflow:2.8.0-gpu" in result.output, result.output
    assert "- tensorflow/tensorflow:2.8.0" in result.output, result.output
    assert "- amancevice/pandas:1.4.1" in result.output, result.output


def test_describe_container_images_json():
    """
    Test JSON output for runtime_images property when none, one or many instances are present
    """
    runner = CliRunner()

    #
    # Pipeline references no container images
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only custom components

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 0
    assert result_json["custom_node_count"] == 3
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["container_images"], list)
    assert len(dependencies["container_images"]) == 0

    #
    # Pipeline references multiple container images through notebook nodes:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 2
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["container_images"], list)
    assert len(dependencies["container_images"]) == 1
    assert "tensorflow/tensorflow:2.8.0" in dependencies["container_images"], dependencies["container_images"]

    #
    # Pipeline references multiple container images through script nodes
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 3
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["container_images"], list)
    assert len(dependencies["container_images"]) == 2
    assert "tensorflow/tensorflow:2.8.0" in dependencies["container_images"], dependencies["container_images"]
    assert "tensorflow/tensorflow:2.8.0-gpu" in dependencies["container_images"], dependencies["container_images"]

    #
    # Pipeline references multiple notebooks and scripts:
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 5
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["container_images"], list)
    assert len(dependencies["container_images"]) == 3
    assert "tensorflow/tensorflow:2.8.0" in dependencies["container_images"], dependencies["container_images"]
    assert "tensorflow/tensorflow:2.8.0-gpu" in dependencies["container_images"], dependencies["container_images"]
    assert "amancevice/pandas:1.4.1" in dependencies["container_images"], dependencies["container_images"]


def test_describe_volumes_report():
    """
    Test report format output for volumes property when none, one or many volume mounts are present
    """
    runner = CliRunner()

    #
    # Pipeline references no volumes
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only custom components
    # - No generic nodes mount a volume

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Volume dependencies: None specified" in result.output

    #
    # Pipeline references multiple volumes through notebook nodes:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Volume dependencies:\n" in result.output
    assert "- pvc-claim-1" in result.output, result.output

    #
    # Pipeline references multiple volumes through script nodes
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Volume dependencies:\n" in result.output, result.output
    assert "- pvc-claim-2" in result.output, result.output
    assert "- pvc-claim-3" in result.output, result.output

    #
    # Pipeline references multiple volumes through notebook and script nodes:
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Volume dependencies:\n" in result.output, result.output
    assert "- pvc-claim-1" in result.output, result.output
    assert "- pvc-claim-2" in result.output, result.output
    assert "- pvc-claim-3" in result.output, result.output


def test_describe_volumes_json():
    """
    Test JSON output for volumes property when none, one or many volume mounts are present
    """
    runner = CliRunner()

    #
    # Pipeline references no volumes
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only custom components
    # - No generic nodes mount a volume

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 0
    assert result_json["custom_node_count"] == 3
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["volumes"], list)
    assert len(dependencies["volumes"]) == 0

    #
    # Pipeline references multiple volumes through notebook nodes:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 2
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert len(dependencies["volumes"]) == 1
    assert "pvc-claim-1" in dependencies["volumes"], dependencies["volumes"]

    #
    # Pipeline references multiple volumes through script nodes
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 3
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert len(dependencies["volumes"]) == 2
    assert "pvc-claim-2" in dependencies["volumes"], dependencies["volumes"]
    assert "pvc-claim-3" in dependencies["volumes"], dependencies["volumes"]

    #
    # Pipeline references multiple volumes through notebook and script nodes:
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 5
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert len(dependencies["volumes"]) == 3
    assert "pvc-claim-1" in dependencies["volumes"], dependencies["volumes"]
    assert "pvc-claim-2" in dependencies["volumes"], dependencies["volumes"]
    assert "pvc-claim-3" in dependencies["volumes"], dependencies["volumes"]


def test_describe_kubernetes_secrets_report():
    """
    Test report format output for the 'kubernetes_secrets' dependency property
    """
    runner = CliRunner()

    #
    # Pipeline references no Kubernetes secrets
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only custom components

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Kubernetes secret dependencies: None specified" in result.output

    #
    # Pipeline references multiple Kubernetes secrets through notebook nodes:
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Kubernetes secret dependencies:\n" in result.output
    assert "- secret-1" in result.output, result.output

    #
    # Pipeline references multiple Kubernetes secrets through script nodes
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Kubernetes secret dependencies:\n" in result.output
    assert "- secret-2" in result.output, result.output

    #
    # Pipeline references multiple multiple Kubernetes secrets
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", str(pipeline_file_path)])
    assert result.exit_code == 0
    assert "Kubernetes secret dependencies:\n" in result.output
    assert "- secret-1" in result.output, result.output
    assert "- secret-2" in result.output, result.output
    assert "- secret-3" in result.output, result.output


def test_describe_kubernetes_secrets_json():
    """
    Test JSON output for the 'kubernetes_secrets' dependency property
    """
    runner = CliRunner()

    #
    # Pipeline references no Kubernetes secrets
    # - Pipeline does not contain nodes -> test_describe_with_no_nodes
    # - Pipeline contains only custom components

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 0
    assert result_json["custom_node_count"] == 3
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["kubernetes_secrets"], list)
    assert len(dependencies["kubernetes_secrets"]) == 0

    #
    # Pipeline references one Kubernetes secret through notebook nodes
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 2
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["kubernetes_secrets"], list)
    assert len(dependencies["kubernetes_secrets"]) == 1
    assert "secret-1" in dependencies["kubernetes_secrets"], dependencies["kubernetes_secrets"]

    #
    # Pipeline references one Kubernetes secret through script nodes
    #
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_scripts.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 3
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["kubernetes_secrets"], list)
    assert len(dependencies["kubernetes_secrets"]) == 1
    assert "secret-2" in dependencies["kubernetes_secrets"], dependencies["kubernetes_secrets"]

    #
    # Pipeline references multiple Kubernetes secrets
    #
    pipeline_file_path = (
        Path(__file__).parent / "resources" / "pipelines" / "pipeline_with_notebooks_and_scripts.pipeline"
    )
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 5
    assert result_json["custom_node_count"] == 0
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["kubernetes_secrets"], list)
    assert len(dependencies["kubernetes_secrets"]) == 3
    assert "secret-1" in dependencies["kubernetes_secrets"], dependencies["kubernetes_secrets"]
    assert "secret-2" in dependencies["kubernetes_secrets"], dependencies["kubernetes_secrets"]
    assert "secret-3" in dependencies["kubernetes_secrets"], dependencies["kubernetes_secrets"]


def test_describe_custom_component_dependencies_json():
    """
    Test JSON output for the 'custom_components' dependency property
    """
    runner = CliRunner()

    #
    # - Pipeline contains only custom components

    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(pipeline, ["describe", "--json", str(pipeline_file_path)])
    assert result.exit_code == 0
    result_json = json.loads(result.output)
    assert result_json["generic_node_count"] == 0
    assert result_json["custom_node_count"] == 3
    assert isinstance(result_json.get("dependencies"), dict)
    dependencies = result_json["dependencies"]
    assert isinstance(dependencies["custom_components"], list)
    assert len(dependencies["custom_components"]) == 3
    assert dependencies["custom_components"][0]["catalog_type"] == "elyra-kfp-examples-catalog"
    assert dependencies["custom_components"][1]["catalog_type"] == "elyra-kfp-examples-catalog"
    assert dependencies["custom_components"][2]["catalog_type"] == "elyra-kfp-examples-catalog"
    expected_component_ids = ["download_data.yaml", "filter_text_using_shell_and_grep.yaml", "calculate_hash.yaml"]
    assert dependencies["custom_components"][0]["component_ref"]["component-id"] in expected_component_ids
    expected_component_ids.remove(dependencies["custom_components"][0]["component_ref"]["component-id"])
    assert dependencies["custom_components"][1]["component_ref"]["component-id"] in expected_component_ids
    expected_component_ids.remove(dependencies["custom_components"][1]["component_ref"]["component-id"])
    assert dependencies["custom_components"][2]["component_ref"]["component-id"] in expected_component_ids
    expected_component_ids.remove(dependencies["custom_components"][2]["component_ref"]["component-id"])


# ------------------------------------------------------------------
# end tests for 'describe' command
# ------------------------------------------------------------------
# tests for 'validate' command
# ------------------------------------------------------------------


@pytest.mark.parametrize("catalog_instance_no_server_process", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
def test_validate_with_kfp_components(
    jp_environ, kubeflow_pipelines_runtime_instance, catalog_instance_no_server_process
):
    runner = CliRunner()
    pipeline_file_path = Path(__file__).parent / "resources" / "pipelines" / "kfp_3_node_custom.pipeline"
    result = runner.invoke(
        pipeline, ["validate", str(pipeline_file_path), "--runtime-config", kubeflow_pipelines_runtime_instance]
    )
    assert "Validating pipeline..." in result.output
    assert result.exit_code == 0, result.output


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


def test_validate_with_no_runtime_config(jp_environ):
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
    for file in Path(source_dir).glob("*pipeline"):
        shutil.copy(str(file), work_dir)
    # print for debug purposes; this is only displayed if an assert fails
    print(f"Work directory content: {list(Path(work_dir).glob('*'))}")


def copy_to_work_dir(work_dir: str, files: List[Union[str, Path]]) -> None:
    """Copies the specified files to work_dir"""
    for file in files:
        if not isinstance(file, Path):
            file = Path(file)
        shutil.copy(file.as_posix(), work_dir)


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


@pytest.mark.parametrize("catalog_instance_no_server_process", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
@pytest.mark.skip(
    reason="This test is not compatible with KFP v2: It relies on incompatible assets from elyra-examples-kfp-catalog lib. See https://github.com/elyra-ai/examples/issues/115 and https://github.com/opendatahub-io/elyra-examples/pull/1"  # noqa: E501
)
def test_export_kubeflow_output_option(
    jp_environ, kubeflow_pipelines_runtime_instance, catalog_instance_no_server_process
):
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

        #
        # Test: '--output' not specified; exported file is created
        # in current directory and named like the pipeline file with
        # a '.py' suffix
        #
        expected_output_file = pipeline_file_path.with_suffix(".py")
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


@pytest.mark.parametrize("catalog_instance_no_server_process", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
@pytest.mark.skip(
    reason="This test is not compatible with KFP v2: It relies on incompatible assets from elyra-examples-kfp-catalog lib. See https://github.com/elyra-ai/examples/issues/115 and https://github.com/opendatahub-io/elyra-examples/pull/1"  # noqa: E501
)
def test_export_kubeflow_overwrite_option(
    jp_environ, kubeflow_pipelines_runtime_instance, catalog_instance_no_server_process
):
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


def test_export_airflow_format_option(airflow_runtime_instance):
    """Verify that the '--format' option works as expected for Airflow"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        cwd = Path.cwd().resolve()
        # copy pipeline file and depencencies
        resource_dir = Path(__file__).parent / "resources" / "pipelines"
        copy_to_work_dir(str(cwd), [resource_dir / "airflow.pipeline", resource_dir / "hello.ipynb"])
        pipeline_file = "airflow.pipeline"
        pipeline_file_path = cwd / pipeline_file
        # make sure the pipeline file exists
        assert pipeline_file_path.is_file() is True

        # Try supported formats
        for supported_export_format_value in ["yaml", "py"]:
            if supported_export_format_value:
                expected_output_file = pipeline_file_path.with_suffix(f".{supported_export_format_value}")
            else:
                expected_output_file = pipeline_file_path.with_suffix(".py")

            # Make sure the output file doesn't exist yet
            if expected_output_file.is_file():
                expected_output_file.unlink()

        # Try invalid format
        for invalid_export_format_value in ["humpty", "dumpty"]:
            options = [
                "export",
                str(pipeline_file_path),
                "--runtime-config",
                airflow_runtime_instance,
                "--format",
                invalid_export_format_value,
            ]

            # this should fail
            result = runner.invoke(pipeline, options)

            assert result.exit_code == 2, result.output
            assert "Invalid value for --format: Valid export formats are ['py']." in result.output, result.output


@pytest.mark.parametrize("catalog_instance_no_server_process", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
@pytest.mark.skip(
    reason="This test is not compatible with KFP v2: It relies on incompatible assets from elyra-examples-kfp-catalog lib. See https://github.com/elyra-ai/examples/issues/115 and https://github.com/opendatahub-io/elyra-examples/pull/1"  # noqa: E501
)
def test_export_kubeflow_format_option(
    jp_environ, kubeflow_pipelines_runtime_instance, catalog_instance_no_server_process
):
    """Verify that the '--format' option works as expected for Kubeflow Pipelines"""
    runner = CliRunner()
    with runner.isolated_filesystem():
        cwd = Path.cwd().resolve()
        # copy pipeline file and depencencies
        prepare_export_work_dir(str(cwd), Path(__file__).parent / "resources" / "pipelines")
        pipeline_file = "kfp_3_node_custom.pipeline"
        pipeline_file_path = cwd / pipeline_file
        # make sure the pipeline file exists
        assert pipeline_file_path.is_file() is True

        # Try supported formats
        for supported_export_format_value in [None, "py", "yaml"]:
            if supported_export_format_value:
                expected_output_file = pipeline_file_path.with_suffix(f".{supported_export_format_value}")
            else:
                expected_output_file = pipeline_file_path.with_suffix(".yaml")

            # Make sure the output file doesn't exist yet
            if expected_output_file.is_file():
                expected_output_file.unlink()

            options = [
                "export",
                str(pipeline_file_path),
                "--runtime-config",
                kubeflow_pipelines_runtime_instance,
            ]
            if supported_export_format_value:
                options.append("--format")
                options.append(supported_export_format_value)

            # this should succeed
            result = runner.invoke(pipeline, options)

            assert result.exit_code == 0, result.output
            assert f"was exported to '{str(expected_output_file)}" in result.output, result.output

        # Try invalid format
        for invalid_export_format_value in ["humpty", "dumpty"]:
            options = [
                "export",
                str(pipeline_file_path),
                "--runtime-config",
                kubeflow_pipelines_runtime_instance,
                "--format",
                invalid_export_format_value,
            ]

            # this should fail
            result = runner.invoke(pipeline, options)

            assert result.exit_code == 2, result.output
            assert (
                "Invalid value for --format: Valid export formats are ['yaml', 'py']." in result.output
            ), result.output


# ------------------------------------------------------------------
# end tests for 'export' command
# ------------------------------------------------------------------
