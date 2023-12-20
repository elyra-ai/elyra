#
# Copyright 2018-2023 Elyra Authors
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
import json
from pathlib import Path
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Union

import pytest

from elyra.metadata.error import MetadataNotFoundError
from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import RuntimeImages
from elyra.metadata.schemaspaces import Runtimes
from elyra.metadata.storage import FileMetadataStore
from elyra.pipeline.kfp.processor_kfp import WorkflowEngineType
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.pipeline_constants import COS_OBJECT_PREFIX


@pytest.fixture()
def metadata_managers(jp_environ, jp_data_dir):
    """
    This fixture creates an elyra.metadata.manager.MetadataManager instance for the
    Runtimes.RUNTIMES_IMAGES_SCHEMASPACE_NAME and an elyra.metadata.manager.MetadataManager instance for the
    Runtimes.RUNTIMES_SCHEMASPACE_NAME.
    The fixture yields a dictionary:
        {
            RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME: MetadataManager,
            Runtimes.RUNTIMES_SCHEMASPACE_NAME: MetadataManager
        }
    """
    # Set up the required directory structure
    metadata_dir = Path(jp_data_dir) / "metadata"
    metadata_dir.mkdir(parents=False)
    (metadata_dir / Runtimes.RUNTIMES_SCHEMASPACE_NAME).mkdir()
    (metadata_dir / RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME).mkdir()

    # Create MM for Runtimes.RUNTIMES_SCHEMASPACE_NAME
    r_metadata_mgr = MetadataManager(
        schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_NAME, metadata_store_class=FileMetadataStore
    )
    # Create MM for RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME
    rti_metadata_mgr = MetadataManager(
        schemaspace=RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME, metadata_store_class=FileMetadataStore
    )

    yield {
        RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME: rti_metadata_mgr,
        Runtimes.RUNTIMES_SCHEMASPACE_NAME: r_metadata_mgr,
    }


@pytest.fixture()
def rti_mmanager(metadata_managers):
    """
    This fixture creates an elyra.metadata.manager.MetadataManager instance for the
    Runtimes.RUNTIMES_IMAGES_SCHEMASPACE_NAME.
    """
    yield metadata_managers.get(RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME)


@pytest.fixture()
def rt_mmanager(metadata_managers):
    """
    This fixture creates an elyra.metadata.manager.MetadataManager instance for the
    Runtimes.RUNTIMES_SCHEMASPACE_NAME.
    """
    yield metadata_managers.get(Runtimes.RUNTIMES_SCHEMASPACE_NAME)


@pytest.fixture()
def runtime_config(rt_mmanager, request):
    """
    Create a persisted Kubeflow Pipelines runtime configuration.
    Optional inputs:
        - "config_name": str (defaults to "test-config")
        - "workflow_engine": WorkflowEngineType.XXX (defaults to WorkflowEngineType.ARGO)
        - "use_cos_credentials_secret": bool,  # (defaults to False)
    The fixture yields the following:
        - elyra.metadata.metadata.Metadata instance
    }
    """
    # Invoke helper method to create a persisted runtime configuration
    yield create_runtime_config(metadata_managers[Runtimes.RUNTIMES_SCHEMASPACE_NAME], request.param)


@pytest.fixture()
def runtime_image_config(rti_mmanager, request):
    """
    Create a persisted runtime image configuration.
    Optional inputs:
        - "image_name": str (defaults to "mocked-container-image")
        - "require_pull_secret": bool (default: False)
    The fixture yields the following:
        - elyra.metadata.metadata.Metadata instance
    """
    image_name = request.param.pop("image_name", "mocked-container-image")
    customization_options = request.param
    # Invoke helper method to create a persisted runtime image configuration
    yield create_runtime_image_config(
        rti_mmanager,
        image_name,
        customization_options,
    )


@pytest.fixture()
def runtime_image_configs(rti_mmanager, request) -> List[Metadata]:
    """
    Create persisted runtime image configurations for the specified pipeline file.
    Required inputs:
     - "pipeline_file": existing pipeline filename
    Optional inputs:
        - "require_pull_secret": bool (default: False)
    The fixture yields the following:
        - "runtime_image_configs": array of elyra.metadata.metadata.Metadata instances
    """
    # check required parameters
    assert request.param.get("pipeline_file") is not None, "A pipeline filename is required."

    # Load pipeline
    # Create runtime image configurations
    customization_options = {
        "require_pull_secret": request.param.get("require_pull_secret"),
    }
    # Invoke helper method to create persisted runtime image configurations
    yield create_runtime_image_configs(
        rti_metadata_manager=metadata_managers[RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME],
        pipeline_file=request.param.get("pipeline_file"),
        customization_options=customization_options,
    )


@pytest.fixture()
def metadata_dependencies(metadata_managers, request):
    """
    Create Elyra metadata repository artifacts that are required by the specified
    pipeline: a runtime configuration and zero or more runtime image configurations.
    Required inputs:
     - "pipeline_file": existing pipeline filename
    Optional inputs:
        - "with_cos_object_prefix": bool (default: False)
        - "workflow_engine": WorkflowEngineType.ARGO or WorkflowEngineType.TEKTON
        - "use_cos_credentials_secret": bool (default: False)
        - "require_pull_secret": bool (default: False)
    The fixture yields a dictionary with the following keys:
     - "pipeline_file": the pipeline file name, as specified as input
     - "pipeline_object": elyra.pipeline.pipeline.Pipeline instance
     - "runtime_config": elyra.metadata.metadata.Metadata instance
     - "runtime_image_configs": array of elyra.metadata.metadata.Metadata instances
     - "metadata_managers": dictionary [str, elyra.metadata.manager.MetadataManager]
       (keys are RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME and
       Runtimes.RUNTIMES_SCHEMASPACE_NAME)
     - "fixture_parameters": dictionary containing the fixture's inputs
    """
    # check required parameters
    assert request.param.get("pipeline_file") is not None, "A pipeline filename is required."

    # Create a Pipeline object from the pipeline file, applying the customization
    # options
    customization_options = {}
    for supported_option in [
        "with_cos_object_prefix",
        "resources_cpu",
        "resources_cpu_limit",
        "resources_gpu",
        "resources_memory",
        "resources_memory_limit",
    ]:
        customization_options[supported_option] = request.param.get(supported_option)
    pipeline_object = get_pipeline_object(
        pipeline_filename=request.param["pipeline_file"],
        customization_options=customization_options,
    )

    # Create runtime configuration
    runtime_config_options = {
        "config_name": pipeline_object.runtime_config,
        "workflow_engine": request.param.get("workflow_engine"),
        "use_cos_credentials_secret": request.param.get("use_cos_credentials_secret"),
    }
    runtime_config = create_runtime_config(
        metadata_managers[Runtimes.RUNTIMES_SCHEMASPACE_NAME], runtime_config_options
    )

    # Create runtime image configurations
    runtime_image_options = {"require_pull_secret": request.param.get("require_pull_secret")}
    runtime_image_configs = create_runtime_image_configs(
        metadata_managers[RuntimeImages.RUNTIMES_IMAGES_SCHEMASPACE_NAME],
        pipeline_file=request.param["pipeline_file"],
        pipeline_object=pipeline_object,
        customization_options=runtime_image_options,
    )

    yield {
        "pipeline_file": request.param["pipeline_file"],
        "pipeline_object": pipeline_object,
        "runtime_config": runtime_config,
        "runtime_image_configs": runtime_image_configs,
        "metadata_managers": metadata_managers,
        "fixture_parameters": request.param,
    }


# ------------------------------
# Supporting functions
# ------------------------------


def create_runtime_config(rt_metadata_manager: MetadataManager, customization_options: Dict[str, Any] = {}) -> Metadata:
    """
    Create a persisted Kubeflow Pipelines runtime configuration. The generated
    runtime configuration is customizable using these options properties:
        - "config_name": "custom-config-name",  # default is "test-config"
        - "workflow_engine": WorkflowEngineType.XXX,  # Enum value, ARGO is default
        - "use_cos_credentials_secret": True,  # or False (default)
    """
    kfp_runtime_config = {
        "display_name": "Test runtime configuration",
        "schema_name": "kfp",
        "metadata": {
            "display_name": "Test runtime configuration",
            "runtime_type": "KUBEFLOW_PIPELINES",
            "api_endpoint": "http://examples.com:31737",
            "user_namespace": "kubeflow-user-example-com",
            "auth_type": "DEX_STATIC_PASSWORDS",
            "api_username": "user@example.com",
            "api_password": "12341234",
            "cos_endpoint": "http://examples.com:31671",
            "cos_bucket": "test",
            "tags": ["test"],
        },
    }

    if customization_options.get("workflow_engine") == WorkflowEngineType.TEKTON:
        kfp_runtime_config["metadata"]["engine"] = "Tekton"
    else:
        kfp_runtime_config["metadata"]["engine"] = "Argo"

    if customization_options.get("use_cos_credentials_secret"):
        kfp_runtime_config["metadata"]["cos_auth_type"] = "KUBERNETES_SECRET"
        kfp_runtime_config["metadata"]["cos_username"] = "my_name"
        kfp_runtime_config["metadata"]["cos_password"] = "my_password"
        kfp_runtime_config["metadata"]["cos_secret"] = "secret-name"
    else:
        kfp_runtime_config["metadata"]["cos_auth_type"] = "USER_CREDENTIALS"
        kfp_runtime_config["metadata"]["cos_username"] = "my_name"
        kfp_runtime_config["metadata"]["cos_password"] = "my_password"

    metadata = Metadata(
        name=customization_options.get("config_name", "test-config"),
        display_name=kfp_runtime_config["display_name"],
        schema_name=kfp_runtime_config["schema_name"],
        metadata=kfp_runtime_config["metadata"],
    )
    # persist and return runtime configuration
    return rt_metadata_manager.create(metadata.name, metadata)


def create_runtime_image_config(
    rti_metadata_manager: MetadataManager,
    image_name: str = "mocked-container-image",
    customization_options: Dict[str, Any] = {},
) -> Metadata:
    """
    Create a persisted runtime image configuration for the specified container
    image. The generated runtime image is customizable using these options:
        - "require_pull_secret": True/False,  # default is False
    """
    if not image_name:
        image_name = "mocked-container-image"

    # Generate a metadata filename using the provided container image name as input.
    config_name = sanitize_container_image_name(image_name)

    update_required = True
    try:
        rti_metadata_manager.get(config_name)
    except MetadataNotFoundError:
        update_required = False

    m = {
        "image_name": image_name,
        "pull_policy": "IfNotPresent",
    }

    if customization_options.get("require_pull_secret"):
        m["pull_secret"] = f"{sanitize_container_image_name(image_name)}-secret"

    rti_metadata = Metadata(
        name=config_name,
        display_name=f"Container image {image_name}",
        schema_name="runtime-image",
        metadata=m,
    )
    # persist runtime image configuration
    if update_required:
        persisted_metadata = rti_metadata_manager.update(rti_metadata.name, rti_metadata)
    else:
        persisted_metadata = rti_metadata_manager.create(rti_metadata.name, rti_metadata)

    # return persisted runtime image configuration
    return persisted_metadata


def create_runtime_image_configs(
    rti_metadata_manager: MetadataManager,
    pipeline_file: Union[Path, str],
    pipeline_object: Pipeline = None,
    customization_options: Dict[str, Any] = {},
) -> List[Metadata]:
    """
    Create persisted runtime image configurations for the specified pipeline_file
    or pipeline_object, applying the specified customization options:
      - "require_pull_secret" (True/False [default])
    """
    assert rti_metadata_manager is not None

    # Create pipeline object, if one wasn't provided
    if pipeline_object is None:
        pipeline_object = get_pipeline_object(
            pipeline_filename=pipeline_file, customization_options=customization_options
        )
    # For each generic node identify its runtime image
    images = {}
    for op in pipeline_object.operations.values():
        if op.is_generic:
            images[op.runtime_image] = {}
            if customization_options.get("require_pull_secret"):
                images[op.runtime_image]["require_pull_secret"] = True
    # Generate runtime image configurations for each unique image,
    # applying the provided customization_options
    runtime_image_configs = []
    for image_name, config_options in images.items():
        runtime_image_configs.append(
            create_runtime_image_config(
                rti_metadata_manager=rti_metadata_manager, image_name=image_name, customization_options=config_options
            )
        )
    return runtime_image_configs


def get_pipeline_object(
    pipeline_filename: Union[Path, str], customization_options: Optional[Dict[str, Any]]
) -> Pipeline:
    """
    Creates a KFP Pipeline instance from pipeline_filename, taking into account the
    following optional customization options:
      - "with_cos_object_prefix" (True/False)
      - "resources_cpu" (number, applied to all generic nodes)
      - "resources_gpu" (number, applied to all generic nodes)
      - "resources_memory" (number, applied to all generic nodes)
      - "resources_cpu_limit" (number, applied to all generic nodes)
      - "resources_memory_limit" (number, applied to all generic nodes)
    """
    assert pipeline_filename is not None, "A pipeline filename is required."

    if not isinstance(pipeline_filename, Path):
        pipeline_filename = Path(pipeline_filename)

    assert pipeline_filename.is_file(), f"Pipeline '{pipeline_filename}' does not exist."

    # Load pipeline file content
    with open(pipeline_filename, "r") as fh:
        pipeline_json = json.loads(fh.read())

    # This rudimentary implementation assumes that the provided file is a valid
    # pipeline file, which contains a primary pipeline.
    if len(pipeline_json["pipelines"]) > 0:
        primary_pipeline = pipeline_json["pipelines"][0]
        app_data = primary_pipeline["app_data"]
        # Add runtime information
        if app_data.get("runtime", None) is None:
            app_data["runtime"] = "Kubeflow Pipelines"
        if app_data.get("runtime_type", None) is None:
            app_data["runtime_type"] = "KUBEFLOW_PIPELINES"
        # Add the filename as pipeline source information
        if app_data.get("source", None) is None:
            app_data["source"] = pipeline_filename.name
        # Add runtime configuration name
        if app_data.get("runtime_config", None) is None:
            app_data["runtime_config"] = "test-config"

        if customization_options.get("with_cos_object_prefix"):
            # Define a dummy COS prefix, if none is defined
            if app_data["properties"].get("pipeline_defaults") is None:
                app_data["properties"]["pipeline_defaults"] = {}
            if app_data["properties"]["pipeline_defaults"].get(COS_OBJECT_PREFIX) is None:
                app_data["properties"]["pipeline_defaults"][COS_OBJECT_PREFIX] = "test/project"
        else:
            # Remove the prefix, if one is already defined
            if app_data["properties"].get("pipeline_defaults") is not None:
                app_data["properties"]["pipeline_defaults"].pop(COS_OBJECT_PREFIX, None)

        #
        # Add resource customizations to every generic node
        for node in primary_pipeline["nodes"]:
            if node["op"] == "execute-notebook-node":
                if customization_options.get("resources_cpu") is not None:
                    node["app_data"]["component_parameters"]["cpu"] = customization_options["resources_cpu"]
                else:
                    node["app_data"]["component_parameters"].pop("cpu", None)
                if customization_options.get("resources_cpu_limit") is not None:
                    node["app_data"]["component_parameters"]["cpu_limit"] = customization_options["resources_cpu_limit"]
                else:
                    node["app_data"]["component_parameters"].pop("cpu_limit", None)
                if customization_options.get("resources_gpu") is not None:
                    node["app_data"]["component_parameters"]["gpu"] = customization_options["resources_gpu"]
                else:
                    node["app_data"]["component_parameters"].pop("gpu", None)
                if customization_options.get("resources_memory") is not None:
                    node["app_data"]["component_parameters"]["memory"] = customization_options["resources_memory"]
                else:
                    node["app_data"]["component_parameters"].pop("memory", None)
                if customization_options.get("resources_memory_limit") is not None:
                    node["app_data"]["component_parameters"]["memory_limit"] = customization_options[
                        "resources_memory_limit"
                    ]
                else:
                    node["app_data"]["component_parameters"].pop("memory_limit", None)

    # Parse JSON and return Pipeline instance
    return PipelineParser().parse(pipeline_json=pipeline_json)


def sanitize_container_image_name(name: str) -> str:
    """
    This helper function sanitizes the provided container image name (e.g.
    'quay.io/myorg/my-image:my-tag') by replacing the following characters
    to a dash ('-'): space, colon, forward slash, and dot.
    """
    safe_char = "-"
    return name.lower().replace(" ", safe_char).replace(":", safe_char).replace("/", safe_char).replace(".", safe_char)
