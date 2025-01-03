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
from datetime import datetime
import hashlib
import os
from pathlib import Path
import re
from typing import Any
from typing import Dict

import pytest
import yaml

from elyra.pipeline.catalog_connector import FilesystemComponentCatalogConnector
from elyra.pipeline.component import Component
from elyra.pipeline.kfp.kfp_processor import KfpPipelineProcessor
from elyra.pipeline.kfp.kfp_processor import RUN_ID_PLACEHOLDER
from elyra.pipeline.kfp.kfp_processor import WorkflowEngineType
from elyra.pipeline.kfp.kfp_properties import KfpPipelineParameter
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.pipeline_constants import KUBERNETES_SHARED_MEM_SIZE
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.properties import ComponentProperty
from elyra.pipeline.properties import CustomSharedMemorySize
from elyra.pipeline.properties import DisableNodeCaching
from elyra.pipeline.properties import ElyraPropertyList
from elyra.pipeline.properties import KubernetesAnnotation
from elyra.pipeline.properties import KubernetesLabel
from elyra.pipeline.properties import KubernetesSecret
from elyra.pipeline.properties import KubernetesToleration
from elyra.pipeline.properties import VolumeMount
from elyra.util.kubernetes import sanitize_label_value

PIPELINE_FILE_COMPLEX = str((Path("resources") / "sample_pipelines" / "pipeline_dependency_complex.json").as_posix())


@pytest.fixture
def processor() -> KfpPipelineProcessor:
    """
    Instantiate a Kubeflow Pipelines processor.
    """
    root_dir = str((Path(__file__).parent / "..").resolve())
    processor = KfpPipelineProcessor(root_dir=root_dir)
    return processor


@pytest.fixture
def processor_with_factory_data(setup_factory_data) -> KfpPipelineProcessor:
    """
    Instantiate a Kubeflow Pipelines processor and create
    system-owned runtime image configurations. This simulates the behavior
    of installing and running Elyra.
    """
    root_dir = str((Path(__file__).parent / "..").resolve())
    processor = KfpPipelineProcessor(root_dir=root_dir)
    return processor


# ---------------------------------------------------
# Tests for class WorkflowEngineType
# ---------------------------------------------------


def test_WorkflowEngineType_get_instance_by_value():
    """
    Validate that static method 'WorkflowEngineType.get_instance_by_value' yields the expected results for
    valid and invalid input.
    """
    # test valid inputs (the provided value is evalutaed in a case insensitive manner)
    assert WorkflowEngineType.get_instance_by_value("argo") == WorkflowEngineType.ARGO
    assert WorkflowEngineType.get_instance_by_value("ARGO") == WorkflowEngineType.ARGO
    assert WorkflowEngineType.get_instance_by_value("aRGo") == WorkflowEngineType.ARGO
    assert WorkflowEngineType.get_instance_by_value("Argo") == WorkflowEngineType.ARGO
    assert WorkflowEngineType.get_instance_by_value("tekton") == WorkflowEngineType.TEKTON
    assert WorkflowEngineType.get_instance_by_value("TEKTON") == WorkflowEngineType.TEKTON
    assert WorkflowEngineType.get_instance_by_value("tEKtOn") == WorkflowEngineType.TEKTON
    assert WorkflowEngineType.get_instance_by_value("Tekton") == WorkflowEngineType.TEKTON
    # test invalid inputs
    with pytest.raises(KeyError):
        WorkflowEngineType.get_instance_by_value(None)  # there is no default
    with pytest.raises(KeyError):
        WorkflowEngineType.get_instance_by_value("")  # there is no default
    with pytest.raises(KeyError):
        WorkflowEngineType.get_instance_by_value(" argo ")  # whitespaces are not trimmed
    with pytest.raises(KeyError):
        WorkflowEngineType.get_instance_by_value("bitcoin")
    with pytest.raises(KeyError):
        WorkflowEngineType.get_instance_by_value("ether")


# ---------------------------------------------------
# Test method KfpPipelineProcessor._compose_container_command_args
# ---------------------------------------------------


def test_compose_container_command_args(processor: KfpPipelineProcessor):
    """
    Verify that _compose_container_command_args yields the expected output for valid input
    """

    pipeline_name = "test pipeline"
    cos_endpoint = "https://minio:9000"
    cos_bucket = "test_bucket"
    cos_directory = "a_dir"
    cos_dependencies_archive = "dummy-notebook-0815.tar.gz"
    filename = "dummy-notebook.ipynb"

    command_args = processor._compose_container_command_args(
        pipeline_name=pipeline_name,
        cos_endpoint=cos_endpoint,
        cos_bucket=cos_bucket,
        cos_directory=cos_directory,
        cos_dependencies_archive=cos_dependencies_archive,
        filename=filename,
    )
    command_args = "".join(command_args)
    assert f"--pipeline-name '{pipeline_name}'" in command_args
    assert f"--cos-endpoint '{cos_endpoint}'" in command_args
    assert f"--cos-bucket '{cos_bucket}'" in command_args
    assert f"--cos-directory '{cos_directory}'" in command_args
    assert f"--cos-dependencies-archive '{cos_dependencies_archive}'" in command_args
    assert f"--file '{filename}'" in command_args

    assert "--inputs" not in command_args
    assert "--outputs" not in command_args

    # verify correct handling of file dependencies and file outputs
    for file_dependency in [[], ["input_file.txt"], ["input_file.txt", "input_file_2.txt"]]:
        for file_output in [[], ["output.csv"], ["output_1.csv", "output_2.pdf"]]:
            command_args = processor._compose_container_command_args(
                pipeline_name=pipeline_name,
                cos_endpoint=cos_endpoint,
                cos_bucket=cos_bucket,
                cos_directory=cos_directory,
                cos_dependencies_archive=cos_dependencies_archive,
                filename=filename,
                cos_inputs=file_dependency,
                cos_outputs=file_output,
            )
            command_args = "".join(command_args)

            if len(file_dependency) < 1:
                assert "--inputs" not in command_args
            else:
                assert f"--inputs '{';'.join(file_dependency)}'" in command_args

            if len(file_output) < 1:
                assert "--outputs" not in command_args
            else:
                assert f"--outputs '{';'.join(file_output)}'" in command_args


def test_compose_container_command_args_invalid_dependency_filename(processor: KfpPipelineProcessor):
    """
    Verify that _compose_container_command_args fails if one or more of the
    specified input file dependencies contains the reserved separator character
    """

    pipeline_name = "test pipeline"
    cos_endpoint = "https://minio:9000"
    cos_bucket = "test_bucket"
    cos_directory = "a_dir"
    cos_dependencies_archive = "dummy-notebook-0815.tar.gz"
    filename = "dummy-notebook.ipynb"

    reserved_separator_char = ";"

    for file_dependency in [
        [f"input_file{reserved_separator_char}txt"],
        ["input_file.txt", f"input{reserved_separator_char}_file_2.txt"],
    ]:
        # identify invalid file dependency name
        invalid_file_name = [file for file in file_dependency if reserved_separator_char in file][0]
        for file_output in [[], ["output.csv"], ["output_1.csv", "output_2.pdf"]]:
            with pytest.raises(
                ValueError,
                match=re.escape(
                    f"Illegal character ({reserved_separator_char}) found in list item '{invalid_file_name}'."
                ),
            ):
                command_args = processor._compose_container_command_args(
                    pipeline_name=pipeline_name,
                    cos_endpoint=cos_endpoint,
                    cos_bucket=cos_bucket,
                    cos_directory=cos_directory,
                    cos_dependencies_archive=cos_dependencies_archive,
                    filename=filename,
                    cos_inputs=file_dependency,
                    cos_outputs=file_output,
                )
                assert command_args is None


# ---------------------------------------------------
# Tests for methods
#  - KfpPipelineProcessor._add_disable_node_caching
#  - KfpPipelineProcessor._add_custom_shared_memory_size
#  - KfpPipelineProcessor._add_kubernetes_secret
#  - KfpPipelineProcessor._add_mounted_volume
#  - KfpPipelineProcessor._add_kubernetes_pod_annotation
#  - KfpPipelineProcessor._add_kubernetes_pod_label
#  - KfpPipelineProcessor._add_kubernetes_toleration
# ---------------------------------------------------


def test_add_disable_node_caching(processor: KfpPipelineProcessor):
    """
    Verify that add_disable_node_caching updates the execution object as expected
    """
    execution_object = {}
    for instance in [
        DisableNodeCaching("True"),
        DisableNodeCaching("False"),
    ]:
        processor.add_disable_node_caching(instance=instance, execution_object=execution_object)
        assert execution_object.get("disable_node_caching") is instance.selection
    assert len(execution_object.keys()) == 1


def test_add_custom_shared_memory_size(processor):
    """
    Verify that add_custom_shared_memory_size updates the execution object as expected
    """
    execution_object = {}
    for instance in [CustomSharedMemorySize(None, None), CustomSharedMemorySize("", None)]:
        processor.add_custom_shared_memory_size(instance=instance, execution_object=execution_object)
        assert execution_object.get("kubernetes_shared_mem_size") is None

    for instance in [
        CustomSharedMemorySize("0.5", None),
        CustomSharedMemorySize("3.14", "G"),
        CustomSharedMemorySize("256", "M"),
    ]:
        processor.add_custom_shared_memory_size(instance=instance, execution_object=execution_object)
        assert execution_object["kubernetes_shared_mem_size"]["size"] == instance.size
        assert execution_object["kubernetes_shared_mem_size"]["units"] == instance.units


def test_add_kubernetes_secret(processor: KfpPipelineProcessor):
    """
    Verify that add_kubernetes_secret updates the execution object as expected
    """
    execution_object = {}
    for instance in [
        KubernetesSecret("var", "secret_name", "secret_key"),
        KubernetesSecret("var2", "secret_name", "secret_key"),
        KubernetesSecret("var", "secret_name_2", "secret_key_2"),
    ]:
        processor.add_kubernetes_secret(instance=instance, execution_object=execution_object)
        assert execution_object["kubernetes_secrets"][instance.env_var]["name"] == instance.name
        assert execution_object["kubernetes_secrets"][instance.env_var]["key"] == instance.key

    # given above instances, there should be two entries in the modified execution_object
    assert len(execution_object["kubernetes_secrets"].keys()) == 2


def test_add_mounted_volume(processor: KfpPipelineProcessor):
    """
    Verify that add_mounted_volume updates the execution object as expected
    """
    execution_object = {}
    for instance in [
        VolumeMount("/mount/path", "test-pvc", None, None),
        VolumeMount("/mount/path2", "test-pvc-2", None, True),
        VolumeMount("/mount/path3", "test-pvc-3", None, False),
        VolumeMount("/mount/path4", "test-pvc-4", "sub/path", True),
        VolumeMount("/mount/path", "test-pvc", None, True),
    ]:
        processor.add_mounted_volume(instance=instance, execution_object=execution_object)
        assert execution_object["kubernetes_volumes"][instance.path]["pvc_name"] == instance.pvc_name
        assert execution_object["kubernetes_volumes"][instance.path]["sub_path"] == instance.sub_path
        assert execution_object["kubernetes_volumes"][instance.path]["read_only"] == instance.read_only

    # given above instances, there should be four entries in the modified execution_object
    assert len(execution_object["kubernetes_volumes"].keys()) == 4


def test_add_kubernetes_pod_annotation(processor: KfpPipelineProcessor):
    """
    Verify that add_kubernetes_pod_annotation updates the execution object as expected
    """
    execution_object = {}
    for instance in [
        KubernetesAnnotation("annotation-key", None),
        KubernetesAnnotation("prefix/annotation-key-2", ""),
        KubernetesAnnotation("annotation-key-3", "annotation value"),
        KubernetesAnnotation("annotation-key-3", "another annotation value"),
    ]:
        processor.add_kubernetes_pod_annotation(instance=instance, execution_object=execution_object)
        if instance.value is not None:
            assert execution_object["pod_annotations"][instance.key] == instance.value
        else:
            assert execution_object["pod_annotations"][instance.key] == ""

    # given above instances, there should be three entries in the modified execution_object
    assert len(execution_object["pod_annotations"].keys()) == 3


def test_add_kubernetes_pod_label(processor: KfpPipelineProcessor):
    """
    Verify that add_kubernetes_pod_label updates the execution object as expected
    """
    execution_object = {}
    for instance in [
        KubernetesLabel("label-key", None),
        KubernetesLabel("label-key-2", ""),
        KubernetesLabel("label-key-3", "label-value"),
        KubernetesLabel("label-key-2", "a-different-label-value"),
    ]:
        processor.add_kubernetes_pod_label(instance=instance, execution_object=execution_object)
        if instance.value is not None:
            assert execution_object["pod_labels"][instance.key] == instance.value
        else:
            assert execution_object["pod_labels"][instance.key] == ""

    # given above instances, there should be three entries in the modified execution_object
    assert len(execution_object["pod_labels"].keys()) == 3


def test_add_kubernetes_toleration(processor: KfpPipelineProcessor):
    """
    Verify that add_kubernetes_toleration updates the execution object as expected
    """
    execution_object = {}
    expected_unique_execution_object_entries = []
    for instance in [
        KubernetesToleration("toleration-key", "Exists", None, "NoExecute"),
        KubernetesToleration("toleration-key", "Equals", 42, ""),
    ]:
        processor.add_kubernetes_toleration(instance=instance, execution_object=execution_object)
        toleration_hash = hashlib.sha256(
            f"{instance.key}::{instance.operator}::{instance.value}::{instance.effect}".encode()
        ).hexdigest()
        if toleration_hash not in expected_unique_execution_object_entries:
            expected_unique_execution_object_entries.append(toleration_hash)
        assert execution_object["kubernetes_tolerations"][toleration_hash]["key"] == instance.key
        assert execution_object["kubernetes_tolerations"][toleration_hash]["value"] == instance.value
        assert execution_object["kubernetes_tolerations"][toleration_hash]["operator"] == instance.operator
        assert execution_object["kubernetes_tolerations"][toleration_hash]["effect"] == instance.effect
    assert len(expected_unique_execution_object_entries) == len(execution_object["kubernetes_tolerations"].keys())


# ---------------------------------------------------
# Tests for methods
#  - KfpPipelineProcessor._generate_pipeline_dsl
#  - KfpPipelineProcessor._compile_pipeline_dsl
# ---------------------------------------------------


def test_generate_pipeline_dsl_compile_pipeline_dsl_custom_component_pipeline(
    processor: KfpPipelineProcessor, component_cache, tmpdir
):
    """
    Verify that _generate_pipeline_dsl and _compile_pipeline_dsl yield
    the expected output for pipeline the includes a custom component
    """

    # load test component definition
    component_def_path = Path(__file__).parent / ".." / "resources" / "components" / "download_data.yaml"

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    reader = FilesystemComponentCatalogConnector([".yaml"])
    entry_data = reader.get_entry_data({"path": str(component_def_path.absolute())}, {})
    component_definition = entry_data.definition

    properties = [
        ComponentProperty(
            id="url",
            name="Url",
            json_data_type="string",
            value="",
            description="",
            allowed_input_types=["file", "inputpath", "inputvalue"],
        ),
        ComponentProperty(
            id="curl_options",
            name="Curl Options",
            json_data_type="string",
            value="--location",
            description="Additional options given to the curl program",
            allowed_input_types=["file", "inputpath", "inputvalue"],
        ),
    ]

    # Instantiate a file-based component
    component_id = "test-component"
    component = Component(
        id=component_id,
        name="Download data",
        description="download data from web",
        op="download-data",
        catalog_type="elyra-kfp-examples-catalog",
        component_reference={"path": component_def_path.as_posix()},
        definition=component_definition,
        properties=properties,
        categories=[],
    )

    # Fabricate the component cache to include single filename-based component for testing
    component_cache._component_cache[processor._type.name] = {
        "spoofed_catalog": {"components": {component_id: component}}
    }

    # Construct operation for component
    operation_name = "Download data test"
    operation_params = {
        "url": {
            "widget": "string",
            "value": "https://raw.githubusercontent.com/elyra-ai/examples/"
            "main/pipelines/run-pipelines-on-kubeflow-pipelines/data/data.csv",
        },
        "curl_options": {"widget": "string", "value": "--location"},
    }
    operation = Operation(
        id="download-data-id",
        type="execution_node",
        classifier=component_id,
        name=operation_name,
        parent_operation_ids=[],
        component_props=operation_params,
    )

    # Construct single-operation pipeline
    pipeline = Pipeline(
        id="pipeline-id",
        name="code-gen-test-custom-components",
        description="Test code generation for custom components",
        runtime="kfp",
        runtime_config="test",
        source="download_data.pipeline",
    )
    pipeline.operations[operation.id] = operation

    # generate Python DSL for the Argo workflow engine
    generated_argo_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline, pipeline_name=pipeline.name, workflow_engine=WorkflowEngineType.ARGO
    )

    assert generated_argo_dsl is not None
    # Generated DSL includes workflow engine specific code in the _main_ function
    assert "kfp.compiler.Compiler().compile(" in generated_argo_dsl

    compiled_argo_output_file = Path(tmpdir) / "compiled_kfp_test_argo.yaml"

    # make sure the output file does not exist (3.8+ use unlink("missing_ok=True"))
    if compiled_argo_output_file.is_file():
        compiled_argo_output_file.unlink()

    # if the compiler discovers an issue with the generated DSL this call fails
    processor._compile_pipeline_dsl(
        dsl=generated_argo_dsl,
        workflow_engine=WorkflowEngineType.ARGO,
        output_file=compiled_argo_output_file.as_posix(),
        pipeline_conf=None,
    )

    # verify that the output file exists
    assert compiled_argo_output_file.is_file()

    # verify the file content
    with open(compiled_argo_output_file) as fh:
        argo_spec = yaml.safe_load(fh.read())

    assert argo_spec["pipelineInfo"]["name"] == pipeline.name
    assert argo_spec["pipelineInfo"]["description"] == pipeline.description


@pytest.mark.parametrize(
    "metadata_dependencies",
    [
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
        },
    ],
    indirect=True,
)
def test_generate_pipeline_dsl_compile_pipeline_dsl_workflow_engine_test(
    monkeypatch, processor: KfpPipelineProcessor, metadata_dependencies: Dict[str, Any], tmpdir
):
    """
    This test validates the following:
     - _generate_pipeline_dsl generates Python code for the supported workflow engines
     - _compile_pipeline_dsl compiles the generated code using the workflow engine's compiler

    This test does not validate that the output artifacts correctly reflect the test pipeline.
    Other tests do that.
    """

    # Obtain artifacts from metadata_dependencies fixture
    test_pipeline_file = metadata_dependencies["pipeline_file"]
    pipeline = metadata_dependencies["pipeline_object"]
    assert pipeline is not None
    runtime_config = metadata_dependencies["runtime_config"]
    assert runtime_config is not None
    assert runtime_config.name == pipeline.runtime_config

    workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_config.metadata["engine"])

    # Mock calls that require access to object storage, because their side effects
    # have no bearing on the outcome of this test.
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda w, x, y, prefix: True)
    monkeypatch.setattr(processor, "_verify_cos_connectivity", lambda x: True)

    compiled_output_file = Path(tmpdir) / test_pipeline_file.with_suffix(".yaml").name
    compiled_output_file_name = str(compiled_output_file.absolute())

    # generate Python DSL for the specified workflow engine
    pipeline_version = f"{pipeline.name}-test-0"
    pipeline_instance_id = f"{pipeline.name}-{datetime.now().strftime('%m%d%H%M%S')}"
    experiment_name = f"{pipeline.name}-test-0"
    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline,
        pipeline_name=pipeline.name,
        workflow_engine=workflow_engine,
        pipeline_version=pipeline_version,
        pipeline_instance_id=pipeline_instance_id,
        experiment_name=experiment_name,
    )

    # Check the workflow engine specific code in the generated DSL
    if workflow_engine == WorkflowEngineType.TEKTON:
        assert "from kfp_tekton import compiler" in generated_dsl, f"engine: {workflow_engine}\ndsl: {generated_dsl}"
        assert "compiler.TektonCompiler().compile(" in generated_dsl
        assert "kfp.compiler.Compiler().compile(" not in generated_dsl
    else:
        assert "from kfp_tekton import compiler" not in generated_dsl
        assert "compiler.TektonCompiler().compile(" not in generated_dsl
        assert "kfp.compiler.Compiler().compile(" in generated_dsl

    # Compile the generated Python DSL
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=workflow_engine,
        output_file=compiled_output_file_name,
        pipeline_conf=None,
    )

    # Load compiled workflow
    with open(compiled_output_file_name) as f:
        workflow_spec_docs = list(yaml.safe_load_all(f.read()))

    assert len(workflow_spec_docs) == 2
    assert "components" in workflow_spec_docs[0]
    assert "platforms" in workflow_spec_docs[1]


@pytest.mark.parametrize(
    "metadata_dependencies",
    [
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
        },
    ],
    indirect=True,
)
def test_generate_pipeline_dsl_compile_pipeline_dsl_one_generic_node_pipeline_test_1(
    monkeypatch, processor: KfpPipelineProcessor, metadata_dependencies: Dict[str, Any], tmpdir
):
    """
    This test validates that the output of _generate_pipeline_dsl and _compile_pipeline_dsl
    yields the expected results for a generic node that has only the required inputs defined.

    This test covers:
     - the Argo workflow engine
     - runtime configurations that use cloud storage authentication types KUBERNETES_SECRET
       and USER_CREDENTIALS (the generated code varies depending on the selected type)

    Other tests cover the scenarios where the user defined optional properties,
    such as environment variables, Kubernetes labels, or data volumes.
    """

    # Obtain artifacts from metadata_dependencies fixture
    test_pipeline_file = metadata_dependencies["pipeline_file"]
    pipeline = metadata_dependencies["pipeline_object"]
    assert pipeline is not None
    runtime_config = metadata_dependencies["runtime_config"]
    assert runtime_config is not None
    assert runtime_config.name == pipeline.runtime_config

    workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_config.metadata["engine"])

    # Make sure this is a one generic node pipeline
    assert len(pipeline.operations.keys()) == 1
    assert isinstance(list(pipeline.operations.values())[0], GenericOperation)
    # Use 'op' variable to access the operation
    op = list(pipeline.operations.values())[0]

    # Mock calls that require access to object storage, because their side effects
    # have no bearing on the outcome of this test.
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda w, x, y, prefix: True)
    monkeypatch.setattr(processor, "_verify_cos_connectivity", lambda x: True)

    # Mock pipeline to not include any parameters
    monkeypatch.setattr(pipeline, "_pipeline_parameters", ElyraPropertyList([]))

    compiled_argo_output_file = Path(tmpdir) / test_pipeline_file.with_suffix(".yaml").name
    compiled_argo_output_file_name = str(compiled_argo_output_file.absolute())

    # generate Python DSL for the Argo workflow engine
    pipeline_version = f"{pipeline.name}-0815"
    pipeline_instance_id = f"{pipeline.name}-{datetime.now().strftime('%m%d%H%M%S')}"
    experiment_name = f"{pipeline.name}-0815"
    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline,
        pipeline_name=pipeline.name,
        workflow_engine=workflow_engine,
        pipeline_version=pipeline_version,
        pipeline_instance_id=pipeline_instance_id,
        experiment_name=experiment_name,
    )

    # if the compiler discovers an issue with the generated DSL this call fails
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=workflow_engine,
        output_file=compiled_argo_output_file_name,
        pipeline_conf=None,
    )

    # Load generated workflow
    with open(compiled_argo_output_file_name) as f:
        spec_docs = list(yaml.safe_load_all(f.read()))

    assert len(spec_docs) == 2
    components, platforms = spec_docs[0], spec_docs[1]["platforms"]

    assert components["pipelineInfo"]["name"] == pipeline.name
    assert components["pipelineInfo"]["description"] == pipeline.description

    # There should be two templates, one for the DAG and one for the generic node.
    # Locate the one for the generic node and inspect its properties.
    assert components["root"]["dag"]
    assert len(components["components"]) == 1
    executors = components["deploymentSpec"]["executors"]
    assert len(executors) == 1

    node_template = components["deploymentSpec"]["executors"]["exec-run-a-file"]

    # Verify component definition information (see generic_component_definition_template.jinja2)
    #  - property 'implementation.container.command'
    assert node_template["container"]["command"] == ["sh", "-c"]
    #  - property 'implementation.container.args'
    #    This is a CLOB, which we need to spot check.
    assert isinstance(node_template["container"]["args"], list) and len(node_template["container"]["args"]) == 1
    #    Check for things that must be in this CLOB:
    #    - the pipeline name
    assert f"--pipeline-name '{pipeline.name}'" in node_template["container"]["args"][0]
    #    - the object storage endpoint that this node uses for file I/O
    assert f"--cos-endpoint '{runtime_config.metadata['cos_endpoint']}'" in node_template["container"]["args"][0]
    #    - the object storage bucket name that this node uses for file I/O
    assert f"--cos-bucket '{runtime_config.metadata['cos_bucket']}'" in node_template["container"]["args"][0]
    #    - the directory within that object storage bucket
    assert f"--cos-directory '{pipeline_instance_id}" in node_template["container"]["args"][0]
    #  - the name of the archive in that directory
    expected_archive_name = processor._get_dependency_archive_name(op)
    assert f"--cos-dependencies-archive '{expected_archive_name}' " in node_template["container"]["args"][0]
    #  - the name of the file that this node processes, which is included in that archive
    assert f"--file '{op.filename}'" in node_template["container"]["args"][0]

    # Check for things that should not be in this CLOB:
    #  - Since it's a one-node pipeline, the component cannot have any "--inputs",
    #    which are declared object storage output files from upstream components.
    assert "--inputs" not in node_template["container"]["args"]
    #  - The component does not declare "--outputs",
    #    which are output files that need to be stored on object storage.
    assert "--outputs" not in node_template["container"]["args"]

    #  - property 'implementation.container.image'
    assert node_template["container"]["image"] == op.runtime_image

    pod_metadata = platforms["kubernetes"]["deploymentSpec"]["executors"]["exec-run-a-file"]["podMetadata"]
    assert pod_metadata

    # Verify Kubernetes labels and annotations that Elyra attaches to pods that
    # execute generic nodes or custom nodes
    if op.doc:
        # only set if a comment is attached to the node
        assert pod_metadata["annotations"]["elyra/node-user-doc"] == op.doc

    # Verify Kubernetes labels and annotations that Elyra attaches to pods that
    # execute generic nodes
    assert pod_metadata["annotations"]["elyra/node-file-name"] == op.filename
    if pipeline.source:
        assert pod_metadata["annotations"]["elyra/pipeline-source"] == pipeline.source
    assert pod_metadata["labels"]["elyra/node-name"] == sanitize_label_value(op.name)
    assert pod_metadata["labels"]["elyra/node-type"] == sanitize_label_value("notebook-script")
    assert pod_metadata["labels"]["elyra/pipeline-name"] == sanitize_label_value(pipeline.name)
    assert pod_metadata["labels"]["elyra/pipeline-version"] == sanitize_label_value(pipeline_version)
    assert pod_metadata["labels"]["elyra/experiment-name"] == sanitize_label_value(experiment_name)

    # Verify environment variables that Elyra attaches to pods that
    # execute generic nodes. All values are hard-coded in the template, with the
    # exception of "AWS_ACCESS_KEY_ID" and "AWS_SECRET_ACCESS_KEY",
    # which are derived from a Kubernetes secret, if the runtime configuration
    # is configured to use one.
    use_secret_for_cos_authentication = runtime_config.metadata["cos_auth_type"] == "KUBERNETES_SECRET"

    assert node_template["container"].get("env") is not None, node_template["container"]
    for env_var in node_template["container"]["env"]:
        if env_var["name"] == "ELYRA_RUNTIME_ENV":
            assert env_var["value"] == "kfp"
        elif env_var["name"] == "ELYRA_ENABLE_PIPELINE_INFO":
            assert env_var["value"] == "True"
        elif env_var["name"] == "ELYRA_WRITABLE_CONTAINER_DIR":
            assert env_var["value"] == KfpPipelineProcessor.WCD
        elif env_var["name"] == "ELYRA_RUN_NAME":
            assert env_var["value"] == RUN_ID_PLACEHOLDER
        elif env_var["name"] == "AWS_ACCESS_KEY_ID":
            if use_secret_for_cos_authentication:
                assert env_var["valueFrom"]["secretKeyRef"]["key"] == "AWS_ACCESS_KEY_ID"
                assert env_var["valueFrom"]["secretKeyRef"]["name"] == runtime_config.metadata["cos_secret"]
            else:
                assert env_var["value"] == runtime_config.metadata["cos_username"]
        elif env_var["name"] == "AWS_SECRET_ACCESS_KEY":
            if use_secret_for_cos_authentication:
                assert env_var["valueFrom"]["secretKeyRef"]["key"] == "AWS_SECRET_ACCESS_KEY"
                assert env_var["valueFrom"]["secretKeyRef"]["name"] == runtime_config.metadata["cos_secret"]
            else:
                assert env_var["value"] == runtime_config.metadata["cos_password"]


@pytest.mark.parametrize(
    "metadata_dependencies",
    [
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
        },
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
            "resources_cpu": 1,
            "resources_gpu": 2,
            "resources_memory": 3,
        },
    ],
    indirect=True,
)
def test_generate_pipeline_dsl_compile_pipeline_dsl_one_generic_node_pipeline_test_2(
    monkeypatch, processor: KfpPipelineProcessor, metadata_dependencies: Dict[str, Any], tmpdir
):
    """
    This test validates that the output of _generate_pipeline_dsl and _compile_pipeline_dsl
    yields the expected results for a generic node that has the following properties defined:
        - Resources: CPU
        - Resources: GPU
        - Resources: memory

    this test only covers the Argo workflow engine.
    """

    # Obtain artifacts from metadata_dependencies fixture
    test_pipeline_file = metadata_dependencies["pipeline_file"]
    pipeline = metadata_dependencies["pipeline_object"]
    assert pipeline is not None
    runtime_config = metadata_dependencies["runtime_config"]
    assert runtime_config is not None
    assert runtime_config.name == pipeline.runtime_config

    workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_config.metadata["engine"])

    # Make sure this is a one generic node pipeline
    assert pipeline.contains_generic_operations()
    assert len(pipeline.operations.keys()) == 1

    # Mock calls that require access to object storage, because their side effects
    # have no bearing on the outcome of this test.
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda w, x, y, prefix: True)
    monkeypatch.setattr(processor, "_verify_cos_connectivity", lambda x: True)

    compiled_argo_output_file = Path(tmpdir) / test_pipeline_file.with_suffix(".yaml").name
    compiled_argo_output_file_name = str(compiled_argo_output_file.absolute())

    # generate Python DSL for the Argo workflow engine
    pipeline_version = f"{pipeline.name}-0815"
    pipeline_instance_id = f"{pipeline.name}-{datetime.now().strftime('%m%d%H%M%S')}"
    experiment_name = f"{pipeline.name}-0815"
    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline,
        pipeline_name=pipeline.name,
        workflow_engine=workflow_engine,
        pipeline_version=pipeline_version,
        pipeline_instance_id=pipeline_instance_id,
        experiment_name=experiment_name,
    )

    # if the compiler discovers an issue with the generated DSL this call fails
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=workflow_engine,
        output_file=compiled_argo_output_file_name,
        pipeline_conf=None,
    )

    # Load generated Argo workflow
    with open(compiled_argo_output_file_name) as f:
        spec_docs = list(yaml.safe_load_all(f.read()))

    assert len(spec_docs) == 2
    components = spec_docs[0]

    assert components["pipelineInfo"]["name"] == pipeline.name
    assert components["pipelineInfo"]["description"] == pipeline.description

    # There should be two templates, one for the DAG and one for the generic node.
    # Locate the one for the generic node and inspect its properties.
    assert components["root"]["dag"]
    assert len(components["components"]) == 1
    executors = components["deploymentSpec"]["executors"]
    assert len(executors) == 1

    op = list(pipeline.operations.values())[0]

    node_template = components["deploymentSpec"]["executors"]["exec-run-a-file"]

    if op.gpu or op.cpu or op.memory or op.cpu_limit or op.memory_limit:
        assert node_template["container"]["resources"]
        if op.gpu:
            assert node_template["container"]["resources"]["accelerator"]["type"] == "nvidia.com/gpu"
            assert node_template["container"]["resources"]["accelerator"]["count"] == str(op.gpu)
        if op.cpu:
            assert node_template["container"]["resources"]["cpuRequest"] == op.cpu
        if op.memory:
            assert node_template["container"]["resources"]["memoryRequest"] == op.memory


@pytest.fixture(autouse=False)
def enable_and_disable_crio(request):
    """
    Set and unset the CRIO_RUNTIME environment variable, if requested
    """
    # Define variable prior to the test
    if request.param:
        os.environ["CRIO_RUNTIME"] = "True"

    yield request.param

    # Remove variable after the test
    if request.param:
        del os.environ["CRIO_RUNTIME"]


@pytest.mark.parametrize(
    "metadata_dependencies",
    [
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic-elyra-properties.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
        },
    ],
    indirect=True,
)
@pytest.mark.skip(
    reason="This test is not compatible with KFP v2 as the generated YAML is ignoring \
            attributes from the source pipeline file"
)
def test_generate_pipeline_dsl_compile_pipeline_dsl_optional_elyra_properties(
    monkeypatch, processor: KfpPipelineProcessor, metadata_dependencies: Dict[str, Any], tmpdir
):
    """
    This test validates that the output of _generate_pipeline_dsl and _compile_pipeline_dsl
    yields the expected results for a generic node that has optional user-provided properties
    defined:
     - data volumes
     - shared memory size
     - Kubernetes secrets
     - Kubernetes labels
     - Kubernetes annotations
     - Kubernetes tolerations
    """

    # Obtain artifacts from metadata_dependencies fixture
    test_pipeline_file = metadata_dependencies["pipeline_file"]
    pipeline = metadata_dependencies["pipeline_object"]
    assert pipeline is not None
    runtime_config = metadata_dependencies["runtime_config"]
    assert runtime_config is not None

    workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_config.metadata["engine"])

    # Make sure this is a one generic node pipeline
    assert len(pipeline.operations.keys()) == 1
    assert isinstance(list(pipeline.operations.values())[0], GenericOperation)
    # Use 'op' variable to access the operation
    op = list(pipeline.operations.values())[0]

    # Mock calls that require access to object storage, because their side effects
    # have no bearing on the outcome of this test.
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda w, x, y, prefix: True)
    monkeypatch.setattr(processor, "_verify_cos_connectivity", lambda x: True)

    # Test begins here

    compiled_output_file = Path(tmpdir) / test_pipeline_file.with_suffix(".yaml").name
    compiled_output_file_name = str(compiled_output_file.absolute())

    # generate Python DSL
    pipeline_version = f"{pipeline.name}-0815"
    pipeline_instance_id = f"{pipeline.name}-{datetime.now().strftime('%m%d%H%M%S')}"
    experiment_name = f"{pipeline.name}-0815"
    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline,
        pipeline_name=pipeline.name,
        workflow_engine=workflow_engine,
        pipeline_version=pipeline_version,
        pipeline_instance_id=pipeline_instance_id,
        experiment_name=experiment_name,
    )

    # if the compiler discovers an issue with the generated DSL this call fails
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=workflow_engine,
        output_file=compiled_output_file_name,
        pipeline_conf=None,
    )

    # Load compiled output
    with open(compiled_output_file_name) as fh:
        spec_docs = list(yaml.safe_load_all(fh.read()))

    assert len(spec_docs) == 2
    assert "components" in spec_docs[0]
    assert "platforms" in spec_docs[1]

    #
    # validate data volumes, if applicable
    expected_volume_mounts = op.elyra_props.get(MOUNTED_VOLUMES)
    if len(expected_volume_mounts) > 0:
        # There must be one or more 'volumeMounts' entry and one or more 'volumes' entry
        assert (
            spec_docs[1]["platforms"]["kubernetes"]["deploymentSpec"]["executors"]["exec-run-a-file"].get("pvcMount")
            is not None
        ), spec_docs[1]["platforms"]["kubernetes"]
        pvc_mounts = spec_docs[1]["platforms"]["kubernetes"]["deploymentSpec"]["executors"]["exec-run-a-file"][
            "pvcMount"
        ]

        assert len(pvc_mounts) >= len(expected_volume_mounts)
        for volume_mount in expected_volume_mounts:
            for volumemount_entry in pvc_mounts:
                entry_found = False
                if volumemount_entry["mountPath"] == volume_mount.path:
                    assert volumemount_entry["constant"] == volume_mount.pvc_name
                    # the following attributes are currently ignored in KFP v2.
                    # Once they are implemented, the code below needs to be updated accordingly.
                    # Reference: https://github.com/kubeflow/pipelines/blob/master/
                    #            kubernetes_platform/proto/kubernetes_executor_config.proto#L84
                    #
                    # assert volumemount_entry.get("subPath", None) == volume_mount.sub_path
                    # assert volumemount_entry.get("readOnly", False) == volume_mount.read_only
                    entry_found = True
                    break
            assert entry_found, f"Cannot find volume mount entry '{volume_mount.path}' in {pvc_mounts}"

    #
    # validate custom shared memory size, if applicable
    custom_shared_mem_size = op.elyra_props.get(KUBERNETES_SHARED_MEM_SIZE)
    if custom_shared_mem_size:
        # There must be one 'volumeMounts' entry and one 'volumes' entry
        assert (
            spec_docs[1]["platforms"]["kubernetes"]["deploymentSpec"]["executors"]["exec-run-a-file"].get("pvcMount")
            is not None
        ), spec_docs[1]["platforms"]["kubernetes"]
        pvc_mounts = spec_docs[1]["platforms"]["kubernetes"]["deploymentSpec"]["executors"]["exec-run-a-file"][
            "pvcMount"
        ]

        for volumemount_entry in pvc_mounts:
            entry_found = False
            if volumemount_entry["mountPath"] == "/dev/shm":
                assert volumemount_entry["name"] == "shm"
                entry_found = True
                break
        assert entry_found, "Missing volume mount entry for shared memory size in {pvc_mounts}"

    """
    IMPORTANT: TODO: The following code needs to be updated to the KFP v2 once the feature is implemented.

    #
    # validate Kubernetes secrets, if applicable
    expected_kubernetes_secrets = op.elyra_props.get(KUBERNETES_SECRETS)
    if len(expected_kubernetes_secrets) > 0:
        # There must be one or more 'env' entries
        assert node_template["container"].get("env") is not None, node_template["container"]
        for secret in expected_kubernetes_secrets:
            for env_entry in node_template["container"]["env"]:
                entry_found = False
                if env_entry["name"] == secret.env_var:
                    assert env_entry["valueFrom"]["secretKeyRef"]["key"] == secret.key
                    assert env_entry["valueFrom"]["secretKeyRef"]["name"] == secret.name
                    entry_found = True
                    break
            assert entry_found, f"Missing entry for secret '{secret.env_var}' in {node_template['container']['env']}"

    # Validate custom Kubernetes annotations
    expected_kubernetes_annotations = op.elyra_props.get(KUBERNETES_POD_ANNOTATIONS)
    if len(expected_kubernetes_annotations) > 0:
        # There must be one or more 'metadata.annotations' entries
        assert node_template["metadata"].get("annotations") is not None, node_template["metadata"]
        for expected_annotation in expected_kubernetes_annotations:
            assert expected_annotation.key in node_template["metadata"]["annotations"]
            assert node_template["metadata"]["annotations"][expected_annotation.key] == (
                expected_annotation.value or ""
            )

    #
    # Validate custom Kubernetes labels
    expected_kubernetes_labels = op.elyra_props.get(KUBERNETES_POD_LABELS)
    if len(expected_kubernetes_labels) > 0:
        # There must be one or more 'metadata.labels' entries
        assert node_template["metadata"].get("labels") is not None, node_template["metadata"]
        for expected_label in expected_kubernetes_labels:
            assert expected_label.key in node_template["metadata"]["labels"]
            assert node_template["metadata"]["labels"][expected_label.key] == (expected_label.value or "")

    #
    # Validate Kubernetes tolerations
    #
    # Validate custom Kubernetes tolerations
    expected_kubernetes_tolerations = op.elyra_props.get(KUBERNETES_TOLERATIONS)
    if len(expected_kubernetes_tolerations) > 0:
        # There must be one or more 'tolerations' entries, e.g.
        # {effect: NoExecute, key: kt1, operator: Equal, value: '3'}
        assert node_template.get("tolerations") is not None, node_template
        for expected_toleration in expected_kubernetes_tolerations:
            entry_found = False
            for toleration_entry in node_template["tolerations"]:
                if (
                    toleration_entry.get("key") == expected_toleration.key
                    and toleration_entry.get("operator") == expected_toleration.operator
                    and toleration_entry.get("value") == expected_toleration.value
                    and toleration_entry.get("effect") == expected_toleration.effect
                ):
                    entry_found = True
                    break
            not_found_msg = (
                "Missing toleration entry for '"
                f"{expected_toleration.key}::{expected_toleration.operator}::"
                f"{expected_toleration.value}::{expected_toleration.effect}'"
                f"in {node_template['tolerations']}"
            )
            assert entry_found, not_found_msg
            """


@pytest.mark.parametrize(
    "metadata_dependencies",
    [
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-multi-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
        },
    ],
    indirect=True,
)
def test_generate_pipeline_dsl_compile_pipeline_dsl_generic_components_data_exchange(
    monkeypatch, processor: KfpPipelineProcessor, metadata_dependencies: Dict[str, Any], tmpdir
):
    """
    Validate that code gen produces the expected artifacts if the pipeline contains
    multiple generic nodes that are configured for data exchange. To achieve complete
    test coverage the pipeline must contain at least three generic nodes that are
    dependend on each other:
    producer node -> consumer/producer node -> consumer node
    (output only) -> (input and output)     -> (input only)
    """
    # Obtain artifacts from metadata_dependencies fixture
    test_pipeline_file = metadata_dependencies["pipeline_file"]
    pipeline = metadata_dependencies["pipeline_object"]
    assert pipeline is not None
    runtime_config = metadata_dependencies["runtime_config"]
    assert runtime_config is not None
    runtime_image_configs = metadata_dependencies["runtime_image_configs"]
    assert runtime_image_configs is not None

    workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_config.metadata["engine"])

    # Make sure the pipeline contains at least one generic node
    assert pipeline.contains_generic_operations()

    # Mock calls that require access to object storage, because their side effects
    # have no bearing on the outcome of this test.
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda w, x, y, prefix: True)
    monkeypatch.setattr(processor, "_verify_cos_connectivity", lambda x: True)

    # Test begins here

    compiled_output_file = Path(tmpdir) / test_pipeline_file.with_suffix(".yaml").name
    compiled_output_file_name = str(compiled_output_file.absolute())

    # generate Python DSL
    pipeline_version = f"{pipeline.name}-0815"
    pipeline_instance_id = f"{pipeline.name}-{datetime.now().strftime('%m%d%H%M%S')}"
    experiment_name = f"{pipeline.name}-0815"
    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline,
        pipeline_name=pipeline.name,
        workflow_engine=workflow_engine,
        pipeline_version=pipeline_version,
        pipeline_instance_id=pipeline_instance_id,
        experiment_name=experiment_name,
    )

    # if the compiler discovers an issue with the generated DSL this call fails
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=workflow_engine,
        output_file=compiled_output_file_name,
        pipeline_conf=None,
    )

    # Load compiled output
    with open(compiled_output_file_name) as fh:
        compiled_spec_docs = list(yaml.safe_load_all(fh.read()))

    assert len(compiled_spec_docs) == 2
    assert "components" in compiled_spec_docs[0]
    assert "platforms" in compiled_spec_docs[1]

    # There should be at least four templates, one for the DAG and three
    # for generic nodes. Each template spec for generic nodes is named
    # "run-a-file[-index]". The "-index" is added by the compiler to
    # guarantee uniqueness.
    executors = compiled_spec_docs[0]["deploymentSpec"]["executors"]
    assert len(executors) >= 3
    template_specs = {}
    for node_template_name, node_template in executors.items():
        if node_template_name == executors or not node_template_name.startswith("exec-run-a-file"):
            continue
        template_specs[node_template_name] = node_template

    # Iterate through sorted operations and verify that their inputs
    # and outputs are properly represented in their respective template
    # specifications.
    template_index = 1
    for op in PipelineProcessor._sort_operations(pipeline.operations):
        if not op.is_generic:
            # ignore custom nodes
            continue
        if template_index == 1:
            template_name = "exec-run-a-file"
        else:
            template_name = f"exec-run-a-file-{template_index}"
        template_index = template_index + 1
        # compare outputs
        if len(op.outputs) > 0:
            assert (
                f"--outputs '{';'.join(op.outputs)}'" in template_specs[template_name]["container"]["args"][0]
            ), f"missing in template {template_name}"
        # compare inputs
        if len(op.inputs) > 0:
            assert (
                f"--inputs '{';'.join(op.inputs)}'" in template_specs[template_name]["container"]["args"][0]
            ), f"missing in template {template_name}"


@pytest.mark.parametrize(
    "metadata_dependencies",
    [
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
            "require_pull_secret": True,
        },
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
            "require_pull_secret": False,
        },
    ],
    indirect=True,
)
@pytest.mark.skip(
    reason="This test is not compatible with KFP v2: There is no `imagePullSecrets` in the generated YAML to be verified."  # noqa: E501
)
def test_generate_pipeline_dsl_compile_pipeline_dsl_generic_components_pipeline_conf(
    monkeypatch, processor: KfpPipelineProcessor, metadata_dependencies: Dict[str, Any], tmpdir
):
    """
    Validate that code gen produces the expected artifacts if the pipeline contains
    generic nodes and associates runtime images are configured to require a pull secret.
    The test results are not runtime type specific.
    """
    # Obtain artifacts from metadata_dependencies fixture
    test_pipeline_file = metadata_dependencies["pipeline_file"]
    pipeline = metadata_dependencies["pipeline_object"]
    assert pipeline is not None
    runtime_config = metadata_dependencies["runtime_config"]
    assert runtime_config is not None
    runtime_image_configs = metadata_dependencies["runtime_image_configs"]
    assert runtime_image_configs is not None

    workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_config.metadata["engine"])

    # Make sure the pipeline contains at least one generic node
    assert pipeline.contains_generic_operations()

    # Mock calls that require access to object storage, because their side effects
    # have no bearing on the outcome of this test.
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda w, x, y, prefix: True)
    monkeypatch.setattr(processor, "_verify_cos_connectivity", lambda x: True)

    # Test begins here

    compiled_output_file = Path(tmpdir) / test_pipeline_file.with_suffix(".yaml").name
    compiled_output_file_name = str(compiled_output_file.absolute())

    # generate Python DSL for the specified workflow engine
    pipeline_version = f"{pipeline.name}-test-0"
    pipeline_instance_id = f"{pipeline.name}-{datetime.now().strftime('%m%d%H%M%S')}"
    experiment_name = f"{pipeline.name}-test-0"

    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline,
        pipeline_name=pipeline.name,
        workflow_engine=workflow_engine,
        pipeline_version=pipeline_version,
        pipeline_instance_id=pipeline_instance_id,
        experiment_name=experiment_name,
    )

    # Generate pipeline configuration, which includes information about
    # pull secrets that are required to download the runtime images.
    pipeline_conf = processor._generate_pipeline_conf(pipeline=pipeline)

    # Compile DSL; the output should
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=workflow_engine,
        output_file=compiled_output_file_name,
        pipeline_conf=pipeline_conf,
    )

    # Load compiled workflow
    with open(compiled_output_file_name) as f:
        compiled_spec = yaml.safe_load(f.read())

    expected_image_pull_secret_names = [
        rti_config.metadata["pull_secret"]
        for rti_config in runtime_image_configs
        if rti_config.metadata.get("pull_secret") is not None
    ]

    if len(expected_image_pull_secret_names) > 0:
        # There must be one or more spec.imagePullSecrets entries
        assert compiled_spec["spec"].get("imagePullSecrets") is not None, compiled_spec["spec"]
        # Verify that each expected secret is referenced
        for expected_secret_name in expected_image_pull_secret_names:
            entry_found = False
            for secret_entry in compiled_spec["spec"]["imagePullSecrets"]:
                if secret_entry.get("name") == expected_secret_name:
                    entry_found = True
                    break
            assert entry_found, (
                f"Missing entry for image pull secret '{expected_secret_name}' "
                f"in {compiled_spec['spec']['imagePullSecrets']}"
            )


@pytest.mark.parametrize(
    "metadata_dependencies",
    [
        {
            "pipeline_file": Path(__file__).parent
            / ".."
            / "resources"
            / "test_pipelines"
            / "kfp"
            / "kfp-one-node-generic.pipeline",
            "workflow_engine": WorkflowEngineType.ARGO,
        }
    ],
    indirect=True,
)
def test_generate_pipeline_dsl_compile_pipeline_dsl_generic_components_with_parameters(
    monkeypatch, processor: KfpPipelineProcessor, metadata_dependencies: Dict[str, Any], tmpdir
):
    """
    Validate that code gen produces the expected artifacts if the pipeline contains
    generic nodes with pipeline parameters specified.
    The test results are KFP-specific.
    """
    # Obtain artifacts from metadata_dependencies fixture
    test_pipeline_file = metadata_dependencies["pipeline_file"]
    pipeline = metadata_dependencies["pipeline_object"]
    assert pipeline is not None
    assert isinstance(pipeline.parameters, list) and len(pipeline.parameters) == 3

    runtime_config = metadata_dependencies["runtime_config"]
    assert runtime_config is not None

    workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_config.metadata["engine"])

    # Make sure the pipeline contains at least one generic node
    assert pipeline.contains_generic_operations()

    # Mock calls that require access to object storage, because their side effects
    # have no bearing on the outcome of this test.
    monkeypatch.setattr(processor, "_upload_dependencies_to_object_store", lambda w, x, y, prefix: True)
    monkeypatch.setattr(processor, "_verify_cos_connectivity", lambda x: True)

    # Test begins here
    compiled_output_file = Path(tmpdir) / test_pipeline_file.with_suffix(".yaml").name
    compiled_output_file_name = str(compiled_output_file.absolute())

    # generate Python DSL for the specified workflow engine
    pipeline_version = f"{pipeline.name}-test-0"
    pipeline_instance_id = f"{pipeline.name}-{datetime.now().strftime('%m%d%H%M%S')}"
    experiment_name = f"{pipeline.name}-test-0"

    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline,
        pipeline_name=pipeline.name,
        workflow_engine=workflow_engine,
        pipeline_version=pipeline_version,
        pipeline_instance_id=pipeline_instance_id,
        experiment_name=experiment_name,
    )

    # Compile DSL; the output should
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=workflow_engine,
        output_file=compiled_output_file_name,
        pipeline_conf=None,
    )

    # Load compiled workflow
    with open(compiled_output_file_name) as f:
        compiled_spec_docs = list(yaml.safe_load_all(f.read()))

    assert len(compiled_spec_docs) == 2
    assert "components" in compiled_spec_docs[0]
    assert "platforms" in compiled_spec_docs[1]

    # Test parameters appear as expected
    yaml_pipeline_params = compiled_spec_docs[0]["root"]["inputDefinitions"]["parameters"]
    # Only two parameters are referenced by a node in the pipeline, so only 2 should be present in YAML
    assert len(yaml_pipeline_params) == 2
    # Assert params defined in YAML correspond to those defined by the Pipeline object
    for param_name, param_info in yaml_pipeline_params.items():
        param_value = param_info["defaultValue"]
        assert any(param.name == param_name and param.value == param_value for param in pipeline.parameters)


def test_generate_pipeline_dsl_compile_pipeline_dsl_custom_components_with_parameters(
    processor: KfpPipelineProcessor, component_cache, tmpdir
):
    """
    Validate that code gen produces the expected artifacts if the pipeline contains
    custom nodes with pipeline parameters specified.
    The test results are KFP-specific.
    """
    # load test component definition
    component_def_path = Path(__file__).parent / ".." / "resources" / "components" / "filter_text.yaml"

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    reader = FilesystemComponentCatalogConnector([".yaml"])
    entry_data = reader.get_entry_data({"path": str(component_def_path.absolute())}, {})
    component_definition = entry_data.definition

    properties = [
        ComponentProperty(
            id="text",
            name="Text",
            json_data_type="string",
            value="",
            description="",
            allowed_input_types=["file", "inputpath", "inputvalue", "parameter"],
            parsed_data_type="String",
        ),
        ComponentProperty(
            id="pattern",
            name="Pattern",
            json_data_type="string",
            value=".*",
            description="Additional options given to the curl program",
            allowed_input_types=["file", "inputpath", "inputvalue", "parameter"],
            parsed_data_type="String",
        ),
    ]

    # Instantiate a file-based component
    component_id = "test-component"
    component = Component(
        id=component_id,
        name="Filter Text",
        description="Filter input text according to the given regex pattern",
        op="filter_text",
        catalog_type="elyra-kfp-examples-catalog",
        component_reference={"path": component_def_path.as_posix()},
        definition=component_definition,
        properties=properties,
        categories=[],
    )

    # Fabricate the component cache to include single filename-based component for testing
    component_cache._component_cache[processor._type.name] = {
        "spoofed_catalog": {"components": {component_id: component}}
    }

    # Construct operation for component
    operation_name = "Filter text test"
    operation_params = {
        "text": {"widget": "inputvalue", "value": "spoofed_value"},
        "pattern": {"widget": "parameter", "value": "param1"},
    }
    operation = Operation(
        id="filter-text-id",
        type="execution_node",
        classifier=component_id,
        name=operation_name,
        parent_operation_ids=[],
        component_props=operation_params,
    )

    # Define pipeline parameters
    pipeline_parameters = ElyraPropertyList(
        [
            KfpPipelineParameter(
                name="param1", description="", value="val1", default_value={"type": "String"}, required=True
            )
        ]
    )

    # Construct single-operation pipeline
    pipeline = Pipeline(
        id="pipeline-id",
        name="code-gen-test-custom-components",
        description="Test code generation for custom components",
        runtime="kfp",
        runtime_config="test",
        source="filter_text.pipeline",
        pipeline_parameters=pipeline_parameters,
    )
    pipeline.operations[operation.id] = operation

    # generate Python DSL for the Argo workflow engine
    generated_dsl = processor._generate_pipeline_dsl(
        pipeline=pipeline, pipeline_name=pipeline.name, workflow_engine=WorkflowEngineType.ARGO
    )

    assert generated_dsl is not None
    # Generated DSL includes workflow engine specific code in the _main_ function
    assert "kfp.compiler.Compiler().compile(" in generated_dsl

    compiled_output_file = Path(tmpdir) / "compiled_kfp_test.yaml"

    # make sure the output file does not exist (3.8+ use unlink("missing_ok=True"))
    if compiled_output_file.is_file():
        compiled_output_file.unlink()

    # if the compiler discovers an issue with the generated DSL this call fails
    processor._compile_pipeline_dsl(
        dsl=generated_dsl,
        workflow_engine=WorkflowEngineType.ARGO,
        output_file=compiled_output_file.as_posix(),
        pipeline_conf=None,
    )

    # verify that the output file exists
    assert compiled_output_file.is_file()

    # verify the file content
    with open(compiled_output_file) as fh:
        compiled_spec = yaml.safe_load(fh.read())
    print(compiled_spec)

    # Test parameters appear as expected
    yaml_pipeline_params = compiled_spec["root"]["inputDefinitions"]["parameters"]
    # Only two parameters are referenced by a node in the pipeline, so only 1 should be present in YAML
    assert len(yaml_pipeline_params) == 1
    # Assert params defined in YAML correspond to those defined by the Pipeline object
    for param_from_yaml_key, param_from_yaml_value in yaml_pipeline_params.items():
        assert any(
            param.name == param_from_yaml_key and str(param.value) == param_from_yaml_value["defaultValue"]
            for param in pipeline.parameters
        )


def test_kfp_invalid_pipeline_parameter_type():
    invalid_type = "SomeCustomType"
    with pytest.raises(ValueError) as ve:
        # Try to instantiate a parameter with an invalid KFP type
        KfpPipelineParameter(
            name="inv", description="", value="", default_value={"type": invalid_type, "value": "val"}, required=False
        )
        assert f"Invalid property type '{invalid_type}': valid types are" in ve


def test_kfp_valid_pipeline_parameter_type():
    valid_types = ["String", "Bool", "Integer", "Float"]
    for valid_type in valid_types:
        parameter = KfpPipelineParameter(
            name="valid_param", description="", value=None, default_value={"type": valid_type}, required=False
        )
        assert parameter.name == "valid_param"
        assert parameter.input_type.base_type == valid_type
