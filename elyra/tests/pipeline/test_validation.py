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

import os
from pathlib import Path
import pickle

from conftest import AIRFLOW_TEST_OPERATOR_CATALOG
from conftest import KFP_COMPONENT_CACHE_INSTANCE
import pytest

from elyra.pipeline.kfp.kfp_properties import KfpPipelineParameter
from elyra.pipeline.pipeline import PIPELINE_CURRENT_VERSION
from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import KUBERNETES_POD_ANNOTATIONS
from elyra.pipeline.pipeline_constants import KUBERNETES_SECRETS
from elyra.pipeline.pipeline_constants import KUBERNETES_SHARED_MEM_SIZE
from elyra.pipeline.pipeline_constants import KUBERNETES_TOLERATIONS
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.pipeline_constants import PIPELINE_PARAMETERS
from elyra.pipeline.pipeline_definition import Node
from elyra.pipeline.pipeline_definition import PipelineDefinition
from elyra.pipeline.properties import CustomSharedMemorySize
from elyra.pipeline.properties import ElyraPropertyList
from elyra.pipeline.properties import EnvironmentVariable
from elyra.pipeline.properties import KubernetesAnnotation
from elyra.pipeline.properties import KubernetesSecret
from elyra.pipeline.properties import KubernetesToleration
from elyra.pipeline.properties import VolumeMount
from elyra.pipeline.validation import PipelineValidationManager
from elyra.pipeline.validation import ValidationResponse
from elyra.pipeline.validation import ValidationSeverity
from elyra.tests.pipeline.util import _read_pipeline_resource


@pytest.fixture
def load_pipeline():
    def _function(pipeline_filepath):
        response = ValidationResponse()

        pipeline = _read_pipeline_resource(f"resources/validation_pipelines/{pipeline_filepath}")
        return pipeline, response

    yield _function


@pytest.fixture
def validation_manager(setup_factory_data, component_cache):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__), "resources/validation_pipelines"))
    yield PipelineValidationManager.instance(root_dir=root)
    PipelineValidationManager.clear_instance()


@pytest.fixture()
def pvm(request, component_cache, tmp_path):
    yield PipelineValidationManager.instance(root_dir=str(tmp_path))
    PipelineValidationManager.clear_instance()


@pytest.fixture()
def dummy_text_file(tmp_path) -> Path:
    """
    Create a text file in tmp_path, which contains dummy data.
    """
    dummy_file = tmp_path / "text_file.txt"
    assert not dummy_file.exists()
    with open(dummy_file, "w") as fh:
        fh.write("1,2,3,4,5\n")
        fh.write("6,7,8,9,10\n")
    yield dummy_file
    # cleanup
    dummy_file.unlink()


@pytest.fixture()
def dummy_binary_file(tmp_path) -> Path:
    """
    Create a binary file in tmp_path, which contains dummy data.
    """
    dummy_file = tmp_path / "binary_file.bin"
    assert not dummy_file.exists()
    with open(dummy_file, "wb") as fh:
        pickle.dump({"key": "value"}, fh)
    yield dummy_file
    # cleanup
    dummy_file.unlink()


async def test_invalid_lower_pipeline_version(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_pipeline_only_notebook.pipeline")
    pipeline_version = PIPELINE_CURRENT_VERSION - 1
    pipeline["pipelines"][0]["app_data"]["version"] = pipeline_version

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    validation_manager._validate_pipeline_structure(pipeline_definition=pipeline_definition, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidPipeline"
    assert (
        issues[0]["message"] == f"Pipeline version {pipeline_version} is out of date "
        "and needs to be migrated using the Elyra pipeline editor."
    )


def test_invalid_upper_pipeline_version(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_pipeline_only_notebook.pipeline")
    pipeline_version = PIPELINE_CURRENT_VERSION + 1
    pipeline["pipelines"][0]["app_data"]["version"] = pipeline_version

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    validation_manager._validate_pipeline_structure(pipeline_definition=pipeline_definition, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidPipeline"
    assert (
        issues[0]["message"] == "Pipeline was last edited in a newer version of Elyra. "
        "Update Elyra to use this pipeline."
    )


def test_invalid_pipeline_version_that_needs_migration(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_pipeline_only_notebook.pipeline")
    pipeline["pipelines"][0]["app_data"]["version"] = 3

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    validation_manager._validate_pipeline_structure(pipeline_definition=pipeline_definition, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidPipeline"
    assert "needs to be migrated" in issues[0]["message"]


def test_basic_pipeline_structure(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_pipeline_only_notebook.pipeline")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    validation_manager._validate_pipeline_structure(pipeline_definition=pipeline_definition, response=response)
    assert not response.has_fatal
    assert not response.to_json().get("issues")


def test_basic_pipeline_structure_with_scripts(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_pipeline_with_scripts.pipeline")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    validation_manager._validate_pipeline_structure(pipeline_definition=pipeline_definition, response=response)
    assert not response.has_fatal
    assert not response.to_json().get("issues")


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_invalid_runtime_node_kubeflow(validation_manager, load_pipeline, catalog_instance):
    pipeline, response = load_pipeline("kf_invalid_node_op.pipeline")
    node_id = "eace43f8-c4b1-4a25-b331-d57d4fc29426"

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_compatibility(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="KUBEFLOW_PIPELINES",
        pipeline_runtime="kfp",
    )

    issues = response.to_json().get("issues")
    print(issues)
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeType"
    assert issues[0]["data"]["nodeID"] == node_id


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_invalid_runtime_node_kubeflow_with_supernode(validation_manager, load_pipeline, catalog_instance):
    pipeline, response = load_pipeline("kf_invalid_node_op_with_supernode.pipeline")
    node_id = "98aa7270-639b-42a4-9a07-b31cd0fa3205"
    pipeline_id = "00304a2b-dec4-4a73-ab4a-6830f97d7855"

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_compatibility(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="KUBEFLOW_PIPELINES",
        pipeline_runtime="kfp",
    )
    issues = response.to_json().get("issues")
    print(issues)
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeType"
    assert issues[0]["data"]["pipelineId"] == pipeline_id
    assert issues[0]["data"]["nodeID"] == node_id


async def test_invalid_pipeline_runtime_with_kubeflow_execution(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_pipeline_with_scripts.pipeline")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_compatibility(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="APACHE_AIRFLOW",
        pipeline_runtime="kfp",
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidRuntime"


async def test_invalid_pipeline_runtime_with_local_execution(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_pipeline_with_scripts.pipeline")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_compatibility(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="APACHE_AIRFLOW",
        pipeline_runtime="local",
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidRuntime"
    assert issues[0]["data"]["pipelineType"] == "APACHE_AIRFLOW"


async def test_invalid_node_op_with_airflow(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("aa_invalid_node_op.pipeline")
    node_id = "749d4641-cee8-4a50-a0ed-30c07439908f"

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_compatibility(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="APACHE_AIRFLOW",
        pipeline_runtime="airflow",
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeType"
    assert issues[0]["data"]["nodeID"] == node_id


async def test_invalid_node_property_structure(validation_manager, monkeypatch, load_pipeline):
    pipeline, response = load_pipeline("generic_invalid_node_property_structure.pipeline")
    node_id = "88ab83dc-d5f0-443a-8837-788ed16851b7"
    node_property = "runtime_image"
    pvm = validation_manager

    monkeypatch.setattr(pvm, "_validate_filepath", lambda node_id, node_label, property_name, filename, response: True)

    monkeypatch.setattr(pvm, "_validate_label", lambda node_id, node_label, response: True)

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await pvm._validate_node_properties(
        pipeline_definition=pipeline_definition, response=response, pipeline_type="GENERIC", pipeline_runtime="kfp"
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert issues[0]["data"]["propertyName"] == node_property
    assert issues[0]["data"]["nodeID"] == node_id


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_missing_node_property_for_kubeflow_pipeline(
    validation_manager, monkeypatch, load_pipeline, catalog_instance
):
    pipeline, response = load_pipeline("kf_invalid_node_property_in_component.pipeline")
    node_id = "fe08b42d-bd8c-4e97-8010-0503a3185427"
    node_property = "notebook"
    pvm = validation_manager

    monkeypatch.setattr(pvm, "_validate_filepath", lambda node_id, file_dir, property_name, filename, response: True)

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await pvm._validate_node_properties(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="KUBEFLOW_PIPELINES",
        pipeline_runtime="kfp",
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert issues[0]["data"]["propertyName"] == node_property
    assert issues[0]["data"]["nodeID"] == node_id


def test_invalid_node_property_image_name(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_invalid_node_property_image_name.pipeline")
    node_ids = ["88ab83dc-d5f0-443a-8837-788ed16851b7", "7ae74ba6-d49f-48ea-9e4f-e44d13594b2f"]
    node_property = "runtime_image"

    for i, node_id in enumerate(node_ids):
        node = pipeline["pipelines"][0]["nodes"][i]
        node_label = node["app_data"].get("label")
        image_name = node["app_data"]["component_parameters"].get("runtime_image")
        validation_manager._validate_container_image_name(node["id"], node_label, image_name, response)

    issues = response.to_json().get("issues")
    assert len(issues) == 2
    # Test missing runtime image in node 0
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert issues[0]["data"]["propertyName"] == node_property
    assert issues[0]["data"]["nodeID"] == node_ids[0]
    assert issues[0]["message"] == "Required property value is missing."

    # Test invalid format for runtime image in node 1
    assert issues[1]["severity"] == 1
    assert issues[1]["type"] == "invalidNodeProperty"
    assert issues[1]["data"]["propertyName"] == node_property
    assert issues[1]["data"]["nodeID"] == node_ids[1]
    assert (
        issues[1]["message"] == "Node contains an invalid runtime image. Runtime image "
        "must conform to the format [registry/]owner/image:tag"
    )


def test_invalid_node_property_image_name_list(validation_manager):
    response = ValidationResponse()
    node_label = "test_label"
    node_id = "test-id"
    failing_image_names = [
        "12345566:one-two-three",
        "someregistry.io/some_org/some_tag/something/",
        "docker.io//missing_org_name:test",
    ]

    for image_name in failing_image_names:
        validation_manager._validate_container_image_name(node_id, node_label, image_name, response)

    issues = response.to_json().get("issues")
    assert len(issues) == len(failing_image_names)


def test_invalid_node_property_dependency_filepath_workspace(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    property_name = "test-property"

    validation_manager._validate_filepath(
        node_id=node["id"],
        file_dir=os.getcwd(),
        property_name=property_name,
        node_label=node["app_data"]["label"],
        filename="../invalid_filepath/to/file.ipynb",
        response=response,
    )
    issues = response.to_json().get("issues")
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidFilePath"
    assert issues[0]["data"]["propertyName"] == property_name
    assert issues[0]["data"]["nodeID"] == node["id"]


def test_invalid_node_property_dependency_filepath_non_existent(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    property_name = "test-property"

    validation_manager._validate_filepath(
        node_id=node["id"],
        file_dir=os.getcwd(),
        property_name=property_name,
        node_label=node["app_data"]["label"],
        filename="invalid_filepath/to/file.ipynb",
        response=response,
    )
    issues = response.to_json().get("issues")
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidFilePath"
    assert issues[0]["data"]["propertyName"] == property_name
    assert issues[0]["data"]["nodeID"] == node["id"]


def test_validate_filepath(pvm, dummy_text_file: Path, dummy_binary_file: Path):
    """
    Test function: PipelineValidationManager._validate_filepath
    Scope: validate binary_file_ok function parameter
    """
    response = ValidationResponse()

    node = {"id": "test-id", "app_data": {"label": "test"}}
    property_name = "test-property"

    # Test scenario 1: text files and binary files are valid dependencies
    # for generic components ('binary_file_ok' is explicitly set to True)
    for file_dependency in [dummy_text_file, dummy_binary_file]:
        pvm._validate_filepath(
            node_id=node["id"],
            file_dir=str(file_dependency.parent),
            property_name=property_name,
            node_label=node["app_data"]["label"],
            filename=str(file_dependency),
            response=response,
            binary_file_ok=True,
        )

        assert not response.has_fatal, response.to_json()
        assert not response.to_json().get("issues")

    # Test scenario 2: text files and binary files are valid dependencies
    # for generic components (use default for 'binary_file_ok' )
    for file_dependency in [dummy_text_file, dummy_binary_file]:
        pvm._validate_filepath(
            node_id=node["id"],
            file_dir=str(file_dependency.parent),
            property_name=property_name,
            node_label=node["app_data"]["label"],
            filename=str(file_dependency),
            response=response,
        )

        assert not response.has_fatal, response.to_json()
        assert not response.to_json().get("issues")

    # Test scenario 3: text files are valid input for 'file' widgets
    # for custom components ('binary_file_ok' is explicitly set to False)
    pvm._validate_filepath(
        node_id=node["id"],
        file_dir=str(dummy_text_file.parent),
        property_name=property_name,
        node_label=node["app_data"]["label"],
        filename=str(dummy_text_file),
        response=response,
        binary_file_ok=False,
    )

    assert not response.has_fatal, response.to_json()
    assert not response.to_json().get("issues")

    # Test scenario 4: binary files are invalid input for 'file' widgets
    # for custom components
    pvm._validate_filepath(
        node_id=node["id"],
        file_dir=str(dummy_binary_file.parent),
        property_name=property_name,
        node_label=node["app_data"]["label"],
        filename=str(dummy_binary_file),
        response=response,
        binary_file_ok=False,
    )

    response_json = response.to_json()
    assert response.has_fatal, response_json
    assert response_json["issues"][0]["severity"] == ValidationSeverity.Error
    assert response_json["issues"][0]["type"] == "invalidFileType"
    assert "Property was assigned a file that is not unicode encoded." in response_json["issues"][0]["message"]
    assert str(dummy_binary_file) in response_json["issues"][0]["data"]["value"]


async def test_valid_node_property_pipeline_filepath(monkeypatch, validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_basic_filepath_check.pipeline")

    monkeypatch.setattr(validation_manager, "_validate_label", lambda node_id, node_label, response: True)

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_node_properties(
        pipeline_definition=pipeline_definition, response=response, pipeline_type="GENERIC", pipeline_runtime="kfp"
    )

    assert not response.has_fatal
    assert not response.to_json().get("issues")


def test_invalid_node_property_resource_value(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_invalid_node_property_hardware_resources.pipeline")
    node_id = "88ab83dc-d5f0-443a-8837-788ed16851b7"

    node = pipeline["pipelines"][0]["nodes"][0]
    validation_manager._validate_resource_value(
        node["id"],
        node["app_data"]["label"],
        resource_name="memory",
        resource_value=node["app_data"]["component_parameters"]["memory"],
        response=response,
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert issues[0]["data"]["propertyName"] == "memory"
    assert issues[0]["data"]["nodeID"] == node_id


def test_invalid_node_property_env_var(validation_manager):
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}

    invalid_env_vars = ElyraPropertyList(
        [
            EnvironmentVariable(env_var="TEST_ENV SPACE", value="value"),
            EnvironmentVariable(env_var="", value="no key"),
        ]
    )
    node_dict["app_data"]["component_parameters"][ENV_VARIABLES] = invalid_env_vars

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=ENV_VARIABLES, response=response
    )
    issues = response.to_json().get("issues")
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidEnvironmentVariable"
    assert issues[0]["data"]["propertyName"] == "env_vars"
    assert issues[0]["data"]["nodeID"] == "test-id"
    assert issues[0]["message"] == "Environment variable 'TEST_ENV SPACE' includes invalid space character(s)."

    assert issues[0]["severity"] == 1
    assert issues[1]["type"] == "invalidEnvironmentVariable"
    assert issues[1]["data"]["propertyName"] == "env_vars"
    assert issues[1]["data"]["nodeID"] == "test-id"
    assert issues[1]["message"] == "Required environment variable was not specified."


def test_valid_node_property_volumes(validation_manager):
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}

    volumes = ElyraPropertyList(
        [
            VolumeMount(path="/mount/test", pvc_name="rwx-test-claim", sub_path=None, read_only=False),
            VolumeMount(path="/mount/test", pvc_name="rwx-test-claim", sub_path="", read_only=False),
            VolumeMount(path="/mount/test", pvc_name="rwx-test-claim", sub_path="relative/path", read_only=False),
            VolumeMount(path="/mount/test_two", pvc_name="second-claim", sub_path="", read_only=True),
            VolumeMount(path="/mount/test_two", pvc_name="second-claim", sub_path="path", read_only=True),
            VolumeMount(path="/mount/test_two", pvc_name="second-claim", sub_path="path/", read_only=True),
            VolumeMount(path="/mount/test_two", pvc_name="second-claim", sub_path="path/in/volume", read_only=None),
        ]
    )
    node_dict["app_data"]["component_parameters"][MOUNTED_VOLUMES] = volumes

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=MOUNTED_VOLUMES, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 0


def test_invalid_node_property_volumes(validation_manager):
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}

    volumes = ElyraPropertyList(
        [
            VolumeMount(path="", pvc_name="", sub_path="", read_only=True),  # missing mount path and pvc name
            VolumeMount(path=None, pvc_name=None, sub_path=None, read_only=True),  # missing mount path and pvc name
            VolumeMount(path="", pvc_name="pvc", sub_path="", read_only=True),  # missing mount path
            VolumeMount(path=None, pvc_name="pvc", sub_path=None, read_only=True),  # missing mount path
            VolumeMount(path="/path", pvc_name="", sub_path="", read_only=True),  # missing pvc name
            VolumeMount(path="/path/", pvc_name=None, sub_path=None, read_only=False),  # missing pvc name
            VolumeMount(
                path="/mount/test_four", pvc_name="second#claim", sub_path=None, read_only=False
            ),  # invalid pvc name
            VolumeMount(
                path="/path", pvc_name="pvc", sub_path="/absolute/path", read_only=False
            ),  # sub_path must be relative
        ]
    )
    node_dict["app_data"]["component_parameters"][MOUNTED_VOLUMES] = volumes

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=MOUNTED_VOLUMES, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 10, issues
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidVolumeMount"
    assert issues[0]["data"]["propertyName"] == MOUNTED_VOLUMES
    assert issues[0]["data"]["nodeID"] == "test-id"
    assert "Required mount path was not specified." in issues[0]["message"]
    assert "Required persistent volume claim name was not specified." in issues[1]["message"]
    assert "Required mount path was not specified." in issues[2]["message"]
    assert "Required persistent volume claim name was not specified." in issues[3]["message"]
    assert "Required mount path was not specified." in issues[4]["message"]
    assert "Required mount path was not specified." in issues[5]["message"]
    assert "Required persistent volume claim name was not specified." in issues[6]["message"]
    assert "Required persistent volume claim name was not specified." in issues[7]["message"]
    assert "PVC name 'second#claim' is not a valid Kubernetes resource name." in issues[8]["message"]
    assert "Sub-path '/absolute/path' must be a relative path." in issues[9]["message"]


def test_valid_node_property_kubernetes_toleration(validation_manager):
    """
    Validate that valid kubernetes toleration definitions are not flagged as invalid.
    Constraints are documented in
    https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.23/#toleration-v1-core
    """
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}
    tolerations = ElyraPropertyList(
        [
            KubernetesToleration(key="", operator="Exists", value="", effect="NoExecute"),
            KubernetesToleration(key="key0", operator="Exists", value="", effect=""),
            KubernetesToleration(key="key1", operator="Exists", value="", effect="NoSchedule"),
            KubernetesToleration(key="key2", operator="Equal", value="value2", effect="NoExecute"),
            KubernetesToleration(key="key3", operator="Equal", value="value3", effect="PreferNoSchedule"),
        ]
    )
    node_dict["app_data"]["component_parameters"][KUBERNETES_TOLERATIONS] = tolerations

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=KUBERNETES_TOLERATIONS, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 0, response.to_json()


def test_valid_node_property_kubernetes_pod_annotation(validation_manager):
    """
    Validate that valid kubernetes pod annotation definitions are not flagged as invalid.
    Constraints are documented in
    https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#syntax-and-character-set
    """
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}
    annotations = ElyraPropertyList(
        [
            KubernetesAnnotation(key="key", value=""),
            KubernetesAnnotation(key="key", value=None),
            KubernetesAnnotation(key="key", value="value"),
            KubernetesAnnotation(key="n-a-m-e", value="value"),
            KubernetesAnnotation(key="n.a.m.e", value="value"),
            KubernetesAnnotation(key="n_a_m_e", value="value"),
            KubernetesAnnotation(key="n-a.m_e", value="value"),
            KubernetesAnnotation(key="prefix/name", value="value"),
            KubernetesAnnotation(key="abc.def/name", value="value"),
            KubernetesAnnotation(key="abc.def.ghi/n-a-m-e", value="value"),
            KubernetesAnnotation(key="abc.def.ghi.jkl/n.a.m.e", value="value"),
            KubernetesAnnotation(key="abc.def.ghi.jkl.mno/n_a_m_e", value="value"),
            KubernetesAnnotation(key="abc.def.ghijklmno.pqr/n-a.m_e", value="value"),
        ]
    )
    node_dict["app_data"]["component_parameters"][KUBERNETES_POD_ANNOTATIONS] = annotations

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=KUBERNETES_POD_ANNOTATIONS, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 0, response.to_json()


def test_invalid_node_property_kubernetes_toleration(validation_manager):
    """
    Validate that invalid kubernetes toleration definitions are properly detected.
    Constraints are documented in
    https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.23/#toleration-v1-core
    """
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}
    invalid_tolerations = ElyraPropertyList(
        [
            KubernetesToleration(key="", operator="", value="", effect=""),  # cannot be all empty
            # invalid values for 'operator'
            KubernetesToleration(key="", operator="Equal", value="value", effect=""),  # empty key requires 'Exists'
            KubernetesToleration(key="key0", operator="exists", value="", effect=""),  # wrong case
            KubernetesToleration(key="key1", operator="Exist", value="", effect=""),  # wrong keyword
            KubernetesToleration(
                key="key2", operator="", value="", effect=""
            ),  # wrong keyword (technically valid but enforced)  # noqa
            # invalid values for 'value'
            KubernetesToleration(key="key3", operator="Exists", value="value3", effect=""),  # 'Exists' -> no value
            # invalid values for 'effect'
            KubernetesToleration(key="key4", operator="Exists", value="", effect="noschedule"),  # wrong case
            KubernetesToleration(key="key5", operator="Exists", value="", effect="no-such-effect"),  # wrong keyword
        ]
    )
    expected_error_messages = [
        "'' is not a valid operator: the value must be one of 'Exists' or 'Equal'.",
        "'Equal' is not a valid operator: operator must be 'Exists' if no key is specified.",
        "'exists' is not a valid operator: the value must be one of 'Exists' or 'Equal'.",
        "'Exist' is not a valid operator: the value must be one of 'Exists' or 'Equal'.",
        "'' is not a valid operator: the value must be one of 'Exists' or 'Equal'.",
        "'value3' is not a valid value: value should be empty if operator is 'Exists'.",
        "'noschedule' is not a valid effect: effect must be one of 'NoExecute', 'NoSchedule', or 'PreferNoSchedule'.",
        "'no-such-effect' is not a valid effect: effect must be one of 'NoExecute', "
        "'NoSchedule', or 'PreferNoSchedule'.",
    ]

    # verify that the number of tolerations in this test matches the number of error messages
    assert len(invalid_tolerations) == len(expected_error_messages), "Test setup error. "
    node_dict["app_data"]["component_parameters"][KUBERNETES_TOLERATIONS] = invalid_tolerations

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=KUBERNETES_TOLERATIONS, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == len(invalid_tolerations), response.to_json()
    index = 0
    for issue in issues:
        assert issue["type"] == "invalidKubernetesToleration"
        assert issue["data"]["propertyName"] == KUBERNETES_TOLERATIONS
        assert issue["data"]["nodeID"] == "test-id"
        assert issue["message"] == expected_error_messages[index], f"Index is {index}"
        index = index + 1


def test_invalid_node_property_kubernetes_pod_annotation(validation_manager):
    """
    Validate that invalid kubernetes pod annotation definitions are flagged as invalid.
    Constraints are documented in
    https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#syntax-and-character-set
    """
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}
    TOO_SHORT_LENGTH = 0
    MAX_PREFIX_LENGTH = 253
    MAX_NAME_LENGTH = 63
    TOO_LONG_LENGTH = MAX_PREFIX_LENGTH + 1 + MAX_NAME_LENGTH + 1  # prefix + '/' + name

    # The following annotations are invalid
    invalid_annotations = ElyraPropertyList(
        [
            # test length violations (key name and prefix)
            KubernetesAnnotation(key="a" * TOO_SHORT_LENGTH, value="val"),  # empty key (min 1)
            KubernetesAnnotation(key=None, value="val"),  # empty key (min 1)
            KubernetesAnnotation(key="a" * TOO_LONG_LENGTH, value="val"),  # key too long
            KubernetesAnnotation(key=f"{'a' * (MAX_PREFIX_LENGTH + 1)}/b", value="val"),  # key prefix too long
            KubernetesAnnotation(key=f"{'a' * (MAX_NAME_LENGTH + 1)}", value="val"),  # key name too long
            KubernetesAnnotation(key=f"prefix/{'a' * (MAX_NAME_LENGTH + 1)}", value="val"),  # key name too long
            KubernetesAnnotation(key=f"{'a' * (MAX_PREFIX_LENGTH + 1)}/name", value="val"),  # key prefix too long
            # test character violations (key name)
            KubernetesAnnotation(key="-", value="val"),  # name must start and end with alphanum
            KubernetesAnnotation(key="-a", value="val"),  # name must start with alphanum
            KubernetesAnnotation(key="a-", value="val"),  # name must start with alphanum
            KubernetesAnnotation(key="prefix/-b", value="val"),  # name start with alphanum
            KubernetesAnnotation(key="prefix/b-", value="val"),  # name must end with alphanum
            # test character violations (key prefix)
            KubernetesAnnotation(key="PREFIX/name", value="val"),  # prefix must be lowercase
            KubernetesAnnotation(key="pref!x/name", value="val"),  # prefix must contain alnum, '-' or '.'
            KubernetesAnnotation(key="pre.fx./name", value="val"),  # prefix must contain alnum, '-' or '.'
            KubernetesAnnotation(key="-pre.fx.com/name", value="val"),  # prefix must contain alnum, '-' or '.'
            KubernetesAnnotation(key="pre.fx-./name", value="val"),  # prefix must contain alnum, '-' or '.'
            KubernetesAnnotation(key="a/b/c", value="val"),  # only one separator char
        ]
    )
    expected_error_messages = [
        "Required annotation key was not specified.",
        "Required annotation key was not specified.",
        f"'{'a' * TOO_LONG_LENGTH}' is not a valid Kubernetes annotation key.",
        f"'{'a' * (MAX_PREFIX_LENGTH + 1)}/b' is not a valid Kubernetes annotation key.",
        f"'{'a' * (MAX_NAME_LENGTH + 1)}' is not a valid Kubernetes annotation key.",
        f"'prefix/{'a' * (MAX_NAME_LENGTH + 1)}' is not a valid Kubernetes annotation key.",
        f"'{'a' * (MAX_PREFIX_LENGTH + 1)}/name' is not a valid Kubernetes annotation key.",
        "'-' is not a valid Kubernetes annotation key.",
        "'-a' is not a valid Kubernetes annotation key.",
        "'a-' is not a valid Kubernetes annotation key.",
        "'prefix/-b' is not a valid Kubernetes annotation key.",
        "'prefix/b-' is not a valid Kubernetes annotation key.",
        "'PREFIX/name' is not a valid Kubernetes annotation key.",
        "'pref!x/name' is not a valid Kubernetes annotation key.",
        "'pre.fx./name' is not a valid Kubernetes annotation key.",
        "'-pre.fx.com/name' is not a valid Kubernetes annotation key.",
        "'pre.fx-./name' is not a valid Kubernetes annotation key.",
        "'a/b/c' is not a valid Kubernetes annotation key.",
    ]

    # verify that the number of annotations in this test matches the number of error messages
    assert len(invalid_annotations) == len(expected_error_messages), "Test implementation error. "
    node_dict["app_data"]["component_parameters"][KUBERNETES_POD_ANNOTATIONS] = invalid_annotations

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=KUBERNETES_POD_ANNOTATIONS, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == len(
        invalid_annotations
    ), f"validation returned unexpected results: {response.to_json()['issues']}"
    index = 0
    for issue in issues:
        assert issue["type"] == "invalidKubernetesAnnotation"
        assert issue["data"]["propertyName"] == KUBERNETES_POD_ANNOTATIONS
        assert issue["data"]["nodeID"] == "test-id"
        assert issue["message"] == expected_error_messages[index], f"Index is {index}"
        index = index + 1


def test_valid_node_property_secrets(validation_manager):
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}
    secrets = ElyraPropertyList(
        [
            KubernetesSecret(env_var="ENV_VAR1", name="test-secret", key="test-key1"),  # valid
            KubernetesSecret(env_var="ENV_VAR2", name="test-secret", key="test-key2"),  # valid
        ]
    )
    node_dict["app_data"]["component_parameters"][KUBERNETES_SECRETS] = secrets

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=KUBERNETES_SECRETS, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 0, issues


def test_invalid_node_property_secrets(validation_manager):
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}
    secrets = ElyraPropertyList(
        [
            KubernetesSecret(env_var="", name="test-secret", key="test-key1"),  # missing env var name
            KubernetesSecret(env_var=None, name="test-secret", key="test-key1"),  # missing env var name
            KubernetesSecret(env_var="ENV_VAR1", name="", key="key"),  # missing secret name
            KubernetesSecret(env_var="ENV_VAR2", name=None, key="key"),  # missing secret name
            KubernetesSecret(env_var="ENV_VAR3", name="test-secret", key=""),  # missing secret key
            KubernetesSecret(env_var="ENV_VAR4", name="test-secret", key=None),  # missing secret key
            KubernetesSecret(env_var="ENV_VAR5", name="test%secret", key="test-key"),  # invalid k8s resource name
            KubernetesSecret(env_var="ENV_VAR6", name="test-secret", key="test$key2"),  # invalid k8s secret key
            KubernetesSecret(env_var="", name="", key=""),  # invalid - all required information is missing
            KubernetesSecret(env_var=None, name=None, key=None),  # invalid - all required information is missing
        ]
    )
    node_dict["app_data"]["component_parameters"][KUBERNETES_SECRETS] = secrets

    node = Node(node_dict)
    validation_manager._validate_elyra_owned_property(
        node_id=node.id, node_label=node.label, node=node, property_name=KUBERNETES_SECRETS, response=response
    )
    issues = response.to_json().get("issues")
    assert len(issues) == 14, issues
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidKubernetesSecret"
    assert issues[0]["data"]["propertyName"] == KUBERNETES_SECRETS
    assert issues[0]["data"]["nodeID"] == "test-id"

    # triggered by KubernetesSecret(env_var="", name="test-secret", key="test-key1")
    assert "Required environment variable was not specified." in issues[0]["message"]
    # triggered by KubernetesSecret(env_var=None, name="test-secret", key="test-key1")
    assert "Required environment variable was not specified." in issues[1]["message"]
    # triggered by KubernetesSecret(env_var="ENV_VAR1", name="", key="key")
    assert "Required secret name was not specified." in issues[2]["message"]
    # triggered by KubernetesSecret(env_var="ENV_VAR2", name=None, key="key")
    assert "Required secret name was not specified." in issues[3]["message"]
    # triggered by KubernetesSecret(env_var="ENV_VAR3", name="test-secret", key="")
    assert "Required secret key was not specified." in issues[4]["message"]
    # triggered by KubernetesSecret(env_var="ENV_VAR4", name="test-secret", key=None)
    assert "Required secret key was not specified." in issues[5]["message"]
    # triggered by KubernetesSecret(env_var="ENV_VAR5", name="test%secret", key="test-key")
    assert "Secret name 'test%secret' is not a valid Kubernetes resource name." in issues[6]["message"]
    # triggered by KubernetesSecret(env_var="ENV_VAR6", name="test-secret", key="test$key2")
    assert "Key 'test$key2' is not a valid Kubernetes secret key." in issues[7]["message"]
    # triggered by KubernetesSecret(env_var="", name="", key="")
    assert "Required environment variable was not specified." in issues[8]["message"]
    assert "Required secret name was not specified." in issues[9]["message"]
    assert "Required secret key was not specified." in issues[10]["message"]
    assert "Required environment variable was not specified." in issues[11]["message"]
    assert "Required secret name was not specified." in issues[12]["message"]
    assert "Required secret key was not specified." in issues[13]["message"]


def test_valid_node_property_shared_mem_size(validation_manager):
    """
    Verify that valid shared memory definitions pass validation
    """
    response = ValidationResponse()
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}

    # test size
    for size in [None, 0, 3.1415, 64]:
        shared_mem_size = CustomSharedMemorySize(size=size, units="G")
        node_dict["app_data"]["component_parameters"][KUBERNETES_SHARED_MEM_SIZE] = shared_mem_size

        node = Node(node_dict)
        validation_manager._validate_elyra_owned_property(
            node_id=node.id,
            node_label=node.label,
            node=node,
            property_name=KUBERNETES_SHARED_MEM_SIZE,
            response=response,
        )
        issues = response.to_json().get("issues")
        assert len(issues) == 0, issues

    # test units
    for unit in ["G", None, ""]:
        shared_mem_size = CustomSharedMemorySize(size=0, units=unit)
        node_dict["app_data"]["component_parameters"][KUBERNETES_SHARED_MEM_SIZE] = shared_mem_size

        node = Node(node_dict)
        validation_manager._validate_elyra_owned_property(
            node_id=node.id,
            node_label=node.label,
            node=node,
            property_name=KUBERNETES_SHARED_MEM_SIZE,
            response=response,
        )
        issues = response.to_json().get("issues")
        assert len(issues) == 0, issues


def test_invalid_node_property_shared_mem_size(validation_manager):
    """
    Verify that invalid shared memory definitions are flagged by validation
    """
    node_dict = {"id": "test-id", "app_data": {"label": "test", "ui_data": {}, "component_parameters": {}}}

    # test invalid size; note that 0 and None are considered valid
    for size in [-1, "not-a-number"]:
        shared_mem_size = CustomSharedMemorySize(size=size, units="G")
        node_dict["app_data"]["component_parameters"][KUBERNETES_SHARED_MEM_SIZE] = shared_mem_size
        node = Node(node_dict)
        response = ValidationResponse()
        validation_manager._validate_elyra_owned_property(
            node_id=node.id,
            node_label=node.label,
            node=node,
            property_name=KUBERNETES_SHARED_MEM_SIZE,
            response=response,
        )
        issues = response.to_json().get("issues")
        assert len(issues) == 1, issues
        assert issues[0]["message"] == f"Shared memory size '{size}' must be a positive number."
        assert issues[0]["data"]["value"]["size"] == size
        assert issues[0]["data"]["value"]["units"] == "G"

    # test invalid units
    for unit in ["K", "Ki", "m", "mi", "g", "gi"]:
        shared_mem_size = CustomSharedMemorySize(size=1, units=unit)
        node_dict["app_data"]["component_parameters"][KUBERNETES_SHARED_MEM_SIZE] = shared_mem_size
        node = Node(node_dict)
        response = ValidationResponse()
        validation_manager._validate_elyra_owned_property(
            node_id=node.id,
            node_label=node.label,
            node=node,
            property_name=KUBERNETES_SHARED_MEM_SIZE,
            response=response,
        )
        issues = response.to_json().get("issues")
        assert len(issues) == 1, issues
        assert issues[0]["message"] == f"Shared memory size units '{unit}' must be 'G'."
        assert issues[0]["data"]["value"]["size"] == 1
        assert issues[0]["data"]["value"]["units"] == unit


def test_valid_node_property_label(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id"}
    valid_label_name = "dead-bread-dead-bread-dead-bread-dead-bread-dead-bread-dead-bre"
    validation_manager._validate_label(node_id=node["id"], node_label=valid_label_name, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 0


def test_valid_node_property_label_min_length(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    valid_label_name = "d"
    validation_manager._validate_label(node_id=node["id"], node_label=valid_label_name, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 0


def test_invalid_node_property_label_filename_exceeds_max_length(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    valid_label_name = "deadbread-deadbread-deadbread-deadbread-deadbread-deadbread-de.py"
    validation_manager._validate_label(node_id=node["id"], node_label=valid_label_name, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 2


def test_invalid_node_property_label_max_length(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    invalid_label_name = "dead-bread-dead-bread-dead-bread-dead-bread-dead-bread-dead-bred"
    validation_manager._validate_label(node_id=node["id"], node_label=invalid_label_name, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 2
    assert issues[0]["type"] == "invalidNodeLabel"
    assert issues[0]["data"]["propertyName"] == "label"
    assert issues[0]["data"]["nodeID"] == "test-id"


def test_valid_node_property_label_filename_has_relative_path(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id", "app_data": {"label": "test"}}
    valid_label_name = "deadbread.py"
    validation_manager._validate_label(node_id=node["id"], node_label=valid_label_name, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 0


def test_invalid_node_property_label_bad_characters(validation_manager):
    response = ValidationResponse()
    node = {"id": "test-id"}
    invalid_label_name = "bad_label_*&^&$"
    validation_manager._validate_label(node_id=node["id"], node_label=invalid_label_name, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 2
    assert issues[0]["type"] == "invalidNodeLabel"
    assert issues[0]["data"]["propertyName"] == "label"
    assert issues[0]["data"]["nodeID"] == "test-id"


def test_pipeline_graph_single_cycle(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_single_cycle.pipeline")
    # cycle_ID = ['c309f6dd-b022-4b1c-b2b0-b6449bb26e8f', '8cb986cb-4fc9-4b1d-864d-0ec64b7ac13c']

    validation_manager._validate_pipeline_graph(pipeline=pipeline, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "circularReference"
    # assert issues[0]['data']['linkIDList'].sort() == cycle_ID.sort()


def test_pipeline_graph_double_cycle(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_double_cycle.pipeline")
    # cycle_ID = ['597b2971-b95d-4df7-a36d-9d93b0345298', 'b63378e4-9085-4a33-9330-6f86054681f4']
    # cycle_two_ID = ['c309f6dd-b022-4b1c-b2b0-b6449bb26e8f', '8cb986cb-4fc9-4b1d-864d-0ec64b7ac13c']

    validation_manager._validate_pipeline_graph(pipeline=pipeline, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "circularReference"
    # assert issues[0]['data']['linkIDList'].sort() == cycle_ID.sort()
    # assert issues[1]['severity'] == 1
    # assert issues[1]['type'] == 'circularReference'
    # assert issues[1]['data']['linkIDList'].sort() == cycle_two_ID.sort()


def test_pipeline_graph_singleton(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("generic_singleton.pipeline")
    node_id = "0195fefd-3ceb-4a90-a12c-3958ef0ff42e"

    validation_manager._validate_pipeline_graph(pipeline=pipeline, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert not response.has_fatal
    assert issues[0]["severity"] == 2
    assert issues[0]["type"] == "singletonReference"
    assert issues[0]["data"]["nodeID"] == node_id


def test_pipeline_valid_kfp_with_supernode(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("kf_supernode_valid.pipeline")

    validation_manager._validate_pipeline_graph(pipeline=pipeline, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 0
    assert not response.has_fatal


def test_pipeline_invalid_single_cycle_kfp_with_supernode(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("kf_supernode_invalid_single_cycle.pipeline")

    validation_manager._validate_pipeline_graph(pipeline=pipeline, response=response)
    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert response.has_fatal
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "circularReference"


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_pipeline_kfp_inputpath_parameter(validation_manager, load_pipeline, catalog_instance, component_cache):
    pipeline, response = load_pipeline("kf_inputpath_parameter.pipeline")
    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_node_properties(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="KUBEFLOW_PIPELINES",
        pipeline_runtime="kfp",
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 0


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_pipeline_invalid_kfp_inputpath_parameter(
    validation_manager, load_pipeline, catalog_instance, component_cache
):
    invalid_key_node_id = "089a12df-fe2f-4fcb-ae37-a1f8a6259ca1"
    missing_param_node_id = "e8820c55-dc79-46d1-b32e-924fa5d70d2a"
    pipeline, response = load_pipeline("kf_invalid_inputpath_parameter.pipeline")
    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_node_properties(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="KUBEFLOW_PIPELINES",
        pipeline_runtime="kfp",
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 2
    assert response.has_fatal
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert issues[0]["data"]["nodeID"] == invalid_key_node_id
    assert issues[1]["severity"] == 1
    assert issues[1]["type"] == "invalidNodeProperty"
    assert issues[1]["data"]["nodeID"] == missing_param_node_id


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_pipeline_invalid_kfp_inputpath_missing_connection(
    validation_manager, load_pipeline, catalog_instance, component_cache
):
    invalid_node_id = "5b78ea0a-e5fc-4022-94d4-7b9dc170d794"
    pipeline, response = load_pipeline("kf_invalid_inputpath_missing_connection.pipeline")
    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_node_properties(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="KUBEFLOW_PIPELINES",
        pipeline_runtime="kfp",
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert response.has_fatal
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert issues[0]["data"]["nodeID"] == invalid_node_id


@pytest.mark.parametrize("catalog_instance", [AIRFLOW_TEST_OPERATOR_CATALOG], indirect=True)
async def test_pipeline_aa_parent_node_missing_xcom_push(
    validation_manager, load_pipeline, catalog_instance, component_cache
):
    invalid_node_id = "b863d458-21b5-4a46-8420-5a814b7bd525"
    invalid_parent_id = "f16f95e0-192c-4b1c-b42d-310da7a6c0e9"

    pipeline, response = load_pipeline("aa_parent_node_missing_xcom.pipeline")
    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_node_properties(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="APACHE_AIRFLOW",
        pipeline_runtime="airflow",
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 1
    assert response.has_fatal
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert issues[0]["data"]["nodeID"] == invalid_node_id
    assert issues[0]["data"]["parentNodeID"] == invalid_parent_id


async def test_invalid_pipeline_parameter_duplicates(validation_manager, load_pipeline):
    pipeline, response = load_pipeline("kf_with_parameters.pipeline")
    duplicate_parameters = ElyraPropertyList(
        [
            KfpPipelineParameter(name="param1", description="dup", value="value1", default_value={}, required=True),
            KfpPipelineParameter(name="param1", description="dup", value="value2", default_value={}, required=True),
        ]
    )

    referenced_params = ["param1"]
    pipeline["pipelines"][0]["nodes"][0]["app_data"]["component_parameters"]["pipeline_parameters"] = referenced_params

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    pipeline_definition.primary_pipeline.set_property(PIPELINE_PARAMETERS, duplicate_parameters)
    await validation_manager._validate_pipeline_parameters(
        pipeline_definition=pipeline_definition,
        pipeline_runtime="kfp",
        response=response,
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 1, issues

    # Validate duplicate parameters
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidPipelineParameter"
    assert (
        "One or more nodes reference pipeline parameter with name 'param1', "
        "but multiple parameters with this name are defined." in issues[0]["message"]
    )


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_invalid_pipeline_parameter(validation_manager, load_pipeline, catalog_instance):
    pipeline, response = load_pipeline("kf_with_parameters.pipeline")
    referenced_params = [None, "", "2param", "class", "param1", "param4"]
    invalid_parameter_instances = [
        KfpPipelineParameter(name=None, description="", value="", default_value={}, required=False),
        KfpPipelineParameter(name="", description="", value="", default_value={}, required=False),
        KfpPipelineParameter(name="2param", description="", value="", default_value={}, required=False),
        KfpPipelineParameter(name="class", description="", value="", default_value={}, required=False),
        KfpPipelineParameter(name="param1", description="", value=None, default_value={}, required=True),
        KfpPipelineParameter(name="param4", description="", value="", default_value={}, required=True),
    ]

    valid_parameter_instances = [
        KfpPipelineParameter(name="param2", description="dup", value="value1", default_value={}, required=True),
        KfpPipelineParameter(name="param2", description="dup", value="value2", default_value={}, required=True),
        KfpPipelineParameter(name="param3", description="unref", value="value2", default_value={}, required=True),
    ]

    pipeline_parameters = invalid_parameter_instances + valid_parameter_instances
    pipeline["pipelines"][0]["app_data"]["properties"][PIPELINE_PARAMETERS] = pipeline_parameters
    pipeline["pipelines"][0]["nodes"][0]["app_data"]["component_parameters"]["pipeline_parameters"] = referenced_params

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_pipeline_parameters(
        pipeline_definition=pipeline_definition,
        pipeline_runtime="kfp",
        response=response,
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 6, issues

    # Validate specific (referenced) parameter instances
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidPipelineParameter"
    assert "Required parameter name was not specified." in issues[0]["message"]
    assert issues[0]["data"]["value"].get("name") == ""
    assert "'2param' is not a valid parameter name: name must be a Python variable name." in issues[1]["message"]
    assert "'class' is not a valid parameter name: name cannot be a Python keyword." in issues[2]["message"]
    assert "Parameter is marked as required but no value has been assigned." in issues[3]["message"]
    assert "Parameter is marked as required but no value has been assigned." in issues[4]["message"]

    # Validate unreferenced parameter
    assert issues[5]["severity"] == 2
    assert issues[5]["type"] == "invalidPipelineParameter"
    assert "Pipeline defines parameter 'param3', but it is not referenced by any node." in issues[5]["message"]


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_valid_pipeline_parameter(validation_manager, load_pipeline, catalog_instance):
    pipeline, response = load_pipeline("kf_with_parameters.pipeline")
    referenced_params = ["param1", "param2", "param3", "param4", "param5"]
    valid_pipeline_parameters = [
        KfpPipelineParameter(name="param1", description="", value="value1", default_value={}, required=True),
        KfpPipelineParameter(
            name="param2", description="", value=2, default_value={"type": "Integer", "value": 1}, required=True
        ),
        KfpPipelineParameter(name="param3", description="", value=False, default_value={"type": "Bool"}, required=True),
        KfpPipelineParameter(
            name="param4", description="", value=1.5, default_value={"type": "Float", "value": 0.5}, required=True
        ),
        KfpPipelineParameter(
            name="param5",
            description="",
            value=1.5,
            default_value={"type": "String", "value": "default"},
            required=True,
        ),
    ]

    pipeline["pipelines"][0]["app_data"]["properties"][PIPELINE_PARAMETERS] = valid_pipeline_parameters
    pipeline["pipelines"][0]["nodes"][0]["app_data"]["component_parameters"]["pipeline_parameters"] = referenced_params

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
    await validation_manager._validate_pipeline_parameters(
        pipeline_definition=pipeline_definition,
        pipeline_runtime="kfp",
        response=response,
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 0, issues


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
async def test_invalid_node_property_pipeline_parameter(
    validation_manager, load_pipeline, catalog_instance, monkeypatch
):
    pipeline, response = load_pipeline("kf_with_parameters.pipeline")
    valid_pipeline_parameters = [
        KfpPipelineParameter(
            name="param1", description="", value=2, default_value={"type": "Integer", "value": 1}, required=True
        ),
    ]

    pipeline["pipelines"][0]["app_data"]["properties"][PIPELINE_PARAMETERS] = valid_pipeline_parameters
    pipeline["pipelines"][0]["nodes"][0]["app_data"]["component_parameters"]["pipeline_parameters"] = ["p2", "p3"]

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)

    monkeypatch.setattr(
        validation_manager, "_validate_filepath", lambda node_id, node_label, property_name, filename, response: True
    )
    await validation_manager._validate_node_properties(
        pipeline_definition=pipeline_definition,
        response=response,
        pipeline_type="KUBEFLOW_PIPELINES",
        pipeline_runtime="kfp",
    )

    issues = response.to_json().get("issues")
    assert len(issues) == 5, issues

    # Validate pipeline_parameters generic node property: referenced parameter doesn't exist
    assert issues[0]["severity"] == 1
    assert issues[0]["type"] == "invalidNodeProperty"
    assert "Node depends on a pipeline parameter that is not defined." in issues[0]["message"]
    assert issues[0]["data"]["value"] == "p2"
    assert "Node depends on a pipeline parameter that is not defined." in issues[1]["message"]
    assert issues[1]["data"]["value"] == "p3"

    # Validate pipeline_parameters custom node property: referenced parameter doesn't exist
    assert issues[3]["severity"] == 1
    assert issues[3]["type"] == "invalidNodeProperty"
    assert "Node depends on a pipeline parameter that is not defined." in issues[3]["message"]
    assert issues[3]["data"]["value"] == "param2"
    assert issues[3]["data"]["propertyName"] == "curl_options"

    # Validate pipeline_parameters custom node property: referenced parameter type doesn't match property input type
    assert issues[4]["severity"] == 2
    assert issues[4]["type"] == "invalidNodeProperty"
    assert "the type of the selected parameter does not match the type given" in issues[4]["message"]
    assert issues[4]["data"]["propertyName"] == "curl_options"
