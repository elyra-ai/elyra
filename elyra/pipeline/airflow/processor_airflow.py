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
from collections import OrderedDict
from datetime import datetime
import json
import os
import re
import string
import tempfile
import time
from typing import Dict
from typing import List
from typing import Optional
from typing import Union

import autopep8
from jinja2 import Environment
from jinja2 import PackageLoader
from traitlets import CUnicode
from traitlets import List as ListTrait

from elyra._version import __version__
from elyra.airflow.operator import BootscriptBuilder
from elyra.metadata.schemaspaces import RuntimeImages
from elyra.metadata.schemaspaces import Runtimes
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.pipeline_constants import COS_OBJECT_PREFIX
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.processor import PipelineProcessorResponse
from elyra.pipeline.processor import RuntimePipelineProcessor
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.util.cos import join_paths
from elyra.util.github import GithubClient

try:
    from elyra.util.gitlab import GitLabClient
except ImportError:
    pass  # Gitlab package is not installed, ignore and use only GitHub

from elyra.util.gitutil import SupportedGitTypes  # noqa:I202
from elyra.util.path import get_absolute_path


class AirflowPipelineProcessor(RuntimePipelineProcessor):
    _type = RuntimeProcessorType.APACHE_AIRFLOW
    _name = "airflow"

    # Provide users with the ability to identify a writable directory in the
    # running container where the notebook | script is executed. The location
    # must exist and be known before the container is started.
    # Defaults to `/tmp`
    WCD = os.getenv("ELYRA_WRITABLE_CONTAINER_DIR", "/tmp").strip().rstrip("/")

    # This specifies the default airflow operators included with Elyra.  Any Airflow-based
    # custom connectors should create/extend the elyra configuration file to include
    # those fully-qualified operator/class names.
    available_airflow_operators = ListTrait(
        CUnicode(),
        [
            "airflow.operators.slack_operator.SlackAPIPostOperator",
            "airflow.operators.bash_operator.BashOperator",
            "airflow.operators.email_operator.EmailOperator",
            "airflow.operators.http_operator.SimpleHttpOperator",
            "airflow.contrib.operators.spark_sql_operator.SparkSqlOperator",
            "airflow.contrib.operators.spark_submit_operator.SparkSubmitOperator",
        ],
        help="""List of available Apache Airflow operator names.

Operators available for use within Apache Airflow pipelines.  These operators must
be fully qualified (i.e., prefixed with their package names).
       """,
    ).tag(config=True)

    # Contains mappings from class to import statement for each available Airflow operator
    class_import_map = {}

    def __init__(self, root_dir, **kwargs):
        super().__init__(root_dir, **kwargs)
        if not self.class_import_map:  # Only need to load once
            for package in self.available_airflow_operators:
                parts = package.rsplit(".", 1)
                self.class_import_map[parts[1]] = f"from {parts[0]} import {parts[1]}"
        self.log.debug(f"class_package_map = {self.class_import_map}")

    def process(self, pipeline: Pipeline) -> None:
        """
        Submit the pipeline for execution on Apache Airflow.
        """
        t0_all = time.time()
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        # Create an instance id that will be used to store
        # the pipelines' dependencies, if applicable
        pipeline_instance_id = f"{pipeline.name}-{timestamp}"

        runtime_configuration = self._get_metadata_configuration(
            schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID, name=pipeline.runtime_config
        )
        api_endpoint = runtime_configuration.metadata.get("api_endpoint")
        cos_endpoint = runtime_configuration.metadata.get("cos_endpoint")
        cos_bucket = runtime_configuration.metadata.get("cos_bucket")

        git_type = SupportedGitTypes.get_instance_by_name(
            runtime_configuration.metadata.get("git_type", SupportedGitTypes.GITHUB.name)
        )
        if git_type == SupportedGitTypes.GITLAB and SupportedGitTypes.is_enabled(SupportedGitTypes.GITLAB) is False:
            raise ValueError(
                "Python package `python-gitlab` is not installed. "
                "Please install using `elyra[gitlab]` to use GitLab as DAG repository."
            )

        github_api_endpoint = runtime_configuration.metadata.get("github_api_endpoint")
        github_repo_token = runtime_configuration.metadata.get("github_repo_token")
        github_repo = runtime_configuration.metadata.get("github_repo")
        github_branch = runtime_configuration.metadata.get("github_branch")

        self.log_pipeline_info(pipeline.name, "Submitting pipeline")
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_export_path = os.path.join(temp_dir, f"{pipeline.name}.py")

            self.log.debug(f"Creating temp directory '{temp_dir}'")

            pipeline_filepath = self.create_pipeline_file(
                pipeline=pipeline,
                pipeline_export_format="py",
                pipeline_export_path=pipeline_export_path,
                pipeline_name=pipeline.name,
                pipeline_instance_id=pipeline_instance_id,
            )

            self.log.debug(f"Uploading pipeline file '{pipeline_filepath}'")

            try:
                if git_type == SupportedGitTypes.GITHUB:
                    git_client = GithubClient(
                        server_url=github_api_endpoint, token=github_repo_token, repo=github_repo, branch=github_branch
                    )
                else:
                    git_client = GitLabClient(
                        server_url=github_api_endpoint,
                        token=github_repo_token,
                        project=github_repo,
                        branch=github_branch,
                    )

            except BaseException as be:
                raise RuntimeError(f"Unable to create a connection to {github_api_endpoint}: {str(be)}") from be

            git_client.upload_dag(pipeline_filepath, pipeline_instance_id)

            self.log.info("Waiting for Airflow Scheduler to process and start the pipeline")

            download_url = git_client.get_git_url(
                api_url=github_api_endpoint, repository_name=github_repo, repository_branch=github_branch
            )

            self.log_pipeline_info(
                pipeline.name, f"pipeline pushed to git: {download_url}", duration=(time.time() - t0_all)
            )

            if pipeline.contains_generic_operations():
                object_storage_url = f"{cos_endpoint}"
                os_path = join_paths(pipeline.pipeline_parameters.get(COS_OBJECT_PREFIX), pipeline_instance_id)
                object_storage_path = f"/{cos_bucket}/{os_path}"
            else:
                object_storage_url = None
                object_storage_path = None

            return AirflowPipelineProcessorResponse(
                git_url=f"{download_url}",
                run_url=f"{api_endpoint}",
                object_storage_url=object_storage_url,
                object_storage_path=object_storage_path,
            )

    def export(
        self, pipeline: Pipeline, pipeline_export_format: str, pipeline_export_path: str, overwrite: bool
    ) -> str:
        """
        Export pipeline as Airflow DAG
        """
        # Verify that the AirflowPipelineProcessor supports the given export format
        self._verify_export_format(pipeline_export_format)

        timestamp = datetime.now().strftime("%m%d%H%M%S")
        # Create an instance id that will be used to store
        # the pipelines' dependencies, if applicable
        pipeline_instance_id = f"{pipeline.name}-{timestamp}"

        absolute_pipeline_export_path = get_absolute_path(self.root_dir, pipeline_export_path)

        if os.path.exists(absolute_pipeline_export_path) and not overwrite:
            raise ValueError(f"File '{absolute_pipeline_export_path}' already exists.")

        self.log_pipeline_info(pipeline.name, f"exporting pipeline as a .{pipeline_export_format} file")

        new_pipeline_file_path = self.create_pipeline_file(
            pipeline=pipeline,
            pipeline_export_format="py",
            pipeline_export_path=absolute_pipeline_export_path,
            pipeline_name=pipeline.name,
            pipeline_instance_id=pipeline_instance_id,
        )

        return new_pipeline_file_path

    def _cc_pipeline(self, pipeline: Pipeline, pipeline_name: str, pipeline_instance_id: str) -> OrderedDict:
        """
        Compile the pipeline in preparation for DAG generation
        """

        runtime_configuration = self._get_metadata_configuration(
            schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID, name=pipeline.runtime_config
        )
        image_namespace = self._get_metadata_configuration(
            schemaspace=RuntimeImages.RUNTIME_IMAGES_SCHEMASPACE_ID, name=None
        )

        cos_endpoint = runtime_configuration.metadata.get("cos_endpoint")
        cos_username = runtime_configuration.metadata.get("cos_username")
        cos_password = runtime_configuration.metadata.get("cos_password")
        cos_secret = runtime_configuration.metadata.get("cos_secret")
        cos_bucket = runtime_configuration.metadata.get("cos_bucket")

        pipeline_instance_id = pipeline_instance_id or pipeline_name
        artifact_object_prefix = join_paths(pipeline.pipeline_parameters.get(COS_OBJECT_PREFIX), pipeline_instance_id)

        self.log_pipeline_info(
            pipeline_name,
            f"processing pipeline dependencies for upload to '{cos_endpoint}' "
            f"bucket '{cos_bucket}' folder '{artifact_object_prefix}'",
        )

        # Create dictionary that maps component Id to its ContainerOp instance
        target_ops = []

        t0_all = time.time()

        # Sort operations based on dependency graph (topological order)
        sorted_operations = PipelineProcessor._sort_operations(pipeline.operations)

        # Determine whether access to cloud storage is required and check connectivity
        for operation in sorted_operations:
            if isinstance(operation, GenericOperation):
                self._verify_cos_connectivity(runtime_configuration)
                break

        # All previous operation outputs should be propagated throughout the pipeline.
        # In order to process this recursively, the current operation's inputs should be combined
        # from its parent's inputs (which, themselves are derived from the outputs of their parent)
        # and its parent's outputs.

        PipelineProcessor._propagate_operation_inputs_outputs(pipeline, sorted_operations)

        # Scrub all node labels of invalid characters
        scrubbed_operations = self._scrub_invalid_characters_from_list(sorted_operations)
        # Generate unique names for all operations
        unique_operations = self._create_unique_node_names(scrubbed_operations)

        for operation in unique_operations:

            if isinstance(operation, GenericOperation):
                operation_artifact_archive = self._get_dependency_archive_name(operation)

                self.log.debug(f"Creating pipeline component:\n {operation} archive : {operation_artifact_archive}")

                # Collect env variables
                pipeline_envs = self._collect_envs(
                    operation, cos_secret=cos_secret, cos_username=cos_username, cos_password=cos_password
                )

                # Generate unique ELYRA_RUN_NAME value and expose it as an
                # environment variable in the container.
                # Notebook | script nodes are implemented using the kubernetes_pod_operator
                # (https://airflow.apache.org/docs/apache-airflow/1.10.12/_api/airflow/contrib/operators/kubernetes_pod_operator/index.html)
                # Environment variables that are passed to this operator are
                # pre-processed by Airflow at runtime and placeholder values (expressed as '{{ xyz }}'
                #  - see https://airflow.apache.org/docs/apache-airflow/1.10.12/macros-ref#default-variables)
                # replaced.
                if pipeline_envs is None:
                    pipeline_envs = {}
                pipeline_envs["ELYRA_RUN_NAME"] = f"{pipeline_name}-{{{{ ts_nodash }}}}"

                image_pull_policy = None
                runtime_image_pull_secret = None
                for image_instance in image_namespace:
                    if image_instance.metadata["image_name"] == operation.runtime_image:
                        if image_instance.metadata.get("pull_policy"):
                            image_pull_policy = image_instance.metadata["pull_policy"]
                        if image_instance.metadata.get("pull_secret"):
                            runtime_image_pull_secret = image_instance.metadata["pull_secret"]
                        break

                bootscript = BootscriptBuilder(
                    filename=operation.filename,
                    pipeline_name=pipeline_name,
                    cos_endpoint=cos_endpoint,
                    cos_bucket=cos_bucket,
                    cos_directory=artifact_object_prefix,
                    cos_dependencies_archive=operation_artifact_archive,
                    inputs=operation.inputs,
                    outputs=operation.outputs,
                )

                volume_mounts = self._get_volume_mounts(operation=operation)

                target_op = {
                    "notebook": operation.name,
                    "id": operation.id,
                    "argument_list": bootscript.container_cmd,
                    "runtime_image": operation.runtime_image,
                    "pipeline_envs": pipeline_envs,
                    "parent_operation_ids": operation.parent_operation_ids,
                    "image_pull_policy": image_pull_policy,
                    "cpu_request": operation.cpu,
                    "mem_request": operation.memory,
                    "gpu_limit": operation.gpu,
                    "operator_source": operation.component_params["filename"],
                    "is_generic_operator": True,
                    "doc": operation.doc,
                    "volume_mounts": volume_mounts,
                }

                if runtime_image_pull_secret is not None:
                    target_op["runtime_image_pull_secret"] = runtime_image_pull_secret

                target_ops.append(target_op)

                self.log_pipeline_info(
                    pipeline_name,
                    f"processing operation dependencies for id '{operation.id}'",
                    operation_name=operation.name,
                )

                self._upload_dependencies_to_object_store(
                    runtime_configuration, pipeline_name, operation, prefix=artifact_object_prefix
                )

            else:
                # Retrieve component from cache
                component = ComponentCache.instance().get_component(self._type, operation.classifier)

                # Convert the user-entered value of certain properties according to their type
                for component_property in component.properties:
                    # Skip properties for which no value was given
                    if component_property.ref not in operation.component_params.keys():
                        continue

                    # Get corresponding property's value from parsed pipeline
                    property_value_dict = operation.component_params.get(component_property.ref)

                    # The type and value of this property can vary depending on what the user chooses
                    # in the pipeline editor. So we get the current active parameter (e.g. StringControl)
                    # from the activeControl value
                    active_property_name = property_value_dict["activeControl"]

                    # One we have the value (e.g. StringControl) we use can retrieve the value
                    # assigned to it
                    property_value = property_value_dict.get(active_property_name, None)

                    # If the value is not found, assign it the default value assigned in parser
                    if property_value is None:
                        property_value = component_property.value

                    self.log.debug(f"Active property name : {active_property_name}, value : {property_value}")
                    self.log.debug(
                        f"Processing component parameter '{component_property.name}' "
                        f"of type '{component_property.data_type}'"
                    )

                    if (
                        property_value
                        and str(property_value)[0] == "{"
                        and str(property_value)[-1] == "}"
                        and isinstance(json.loads(json.dumps(property_value)), dict)
                        and set(json.loads(json.dumps(property_value)).keys()) == {"value", "option"}
                    ):
                        parent_node_name = self._get_node_name(
                            target_ops, json.loads(json.dumps(property_value))["value"]
                        )
                        processed_value = "\"{{ ti.xcom_pull(task_ids='" + parent_node_name + "') }}\""
                        operation.component_params[component_property.ref] = processed_value
                    elif component_property.data_type == "boolean":
                        operation.component_params[component_property.ref] = property_value
                    elif component_property.data_type == "string":
                        # Add surrounding quotation marks to string value for correct rendering
                        # in jinja DAG template
                        operation.component_params[component_property.ref] = json.dumps(property_value)
                    elif component_property.data_type == "dictionary":
                        processed_value = self._process_dictionary_value(property_value)
                        operation.component_params[component_property.ref] = processed_value
                    elif component_property.data_type == "list":
                        processed_value = self._process_list_value(property_value)
                        operation.component_params[component_property.ref] = processed_value

                # Remove inputs and outputs from params dict until support for data exchange is provided
                operation.component_params_as_dict.pop("inputs")
                operation.component_params_as_dict.pop("outputs")

                # Locate the import statement. If not found raise...
                import_stmts = []
                # Check for import statement on Component object, otherwise get from class_import_map
                import_stmt = component.import_statement or self.class_import_map.get(component.name)
                if import_stmt:
                    import_stmts.append(import_stmt)
                else:
                    # If we didn't find a mapping to the import statement, let's check if the component
                    # name includes a package prefix.  If it does, log a warning, but proceed, otherwise
                    # raise an exception.
                    if len(component.name.split(".")) > 1:  # We (presumably) have a package prefix
                        self.log.warning(
                            f"Operator '{component.name}' of node '{operation.name}' is not configured "
                            f"in the list of available Airflow operators but appears to include a "
                            f"package prefix and processing will proceed."
                        )
                    else:
                        raise ValueError(
                            f"Operator '{component.name}' of node '{operation.name}' is not configured "
                            f"in the list of available operators.  Please add the fully-qualified "
                            f"package name for '{component.name}' to the "
                            f"AirflowPipelineProcessor.available_airflow_operators configuration."
                        )

                target_op = {
                    "notebook": operation.name,
                    "id": operation.id,
                    "imports": import_stmts,
                    "class_name": component.name,
                    "parent_operation_ids": operation.parent_operation_ids,
                    "component_params": operation.component_params_as_dict,
                    "operator_source": component.component_source,
                    "is_generic_operator": False,
                    "doc": operation.doc,
                }

                target_ops.append(target_op)

        ordered_target_ops = OrderedDict()

        while target_ops:
            for i in range(len(target_ops)):
                target_op = target_ops.pop(0)
                if not target_op["parent_operation_ids"]:
                    ordered_target_ops[target_op["id"]] = target_op
                    self.log.debug(f"Added root node {ordered_target_ops[target_op['id']]}")
                elif all(deps in ordered_target_ops.keys() for deps in target_op["parent_operation_ids"]):
                    ordered_target_ops[target_op["id"]] = target_op
                    self.log.debug(f"Added dependent node {ordered_target_ops[target_op['id']]}")
                else:
                    target_ops.append(target_op)

        self.log_pipeline_info(pipeline_name, "pipeline dependencies processed", duration=(time.time() - t0_all))

        return ordered_target_ops

    def create_pipeline_file(
        self,
        pipeline: Pipeline,
        pipeline_export_format: str,
        pipeline_export_path: str,
        pipeline_name: str,
        pipeline_instance_id: str,
    ) -> str:
        """
        Convert the pipeline to an Airflow DAG and store it in pipeline_export_path.
        """

        self.log.info(f"Creating pipeline definition as a .{pipeline_export_format} file")
        if pipeline_export_format == "json":
            with open(pipeline_export_path, "w", encoding="utf-8") as file:
                json.dump(pipeline_export_path, file, ensure_ascii=False, indent=4)
        else:
            # Load template from installed elyra package
            loader = PackageLoader("elyra", "templates/airflow")
            template_env = Environment(loader=loader)

            template_env.filters["regex_replace"] = lambda string: self._scrub_invalid_characters(string)

            template = template_env.get_template("airflow_template.jinja2")

            target_ops = self._cc_pipeline(pipeline, pipeline_name, pipeline_instance_id)
            runtime_configuration = self._get_metadata_configuration(
                schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID, name=pipeline.runtime_config
            )
            user_namespace = runtime_configuration.metadata.get("user_namespace", "default")
            cos_secret = runtime_configuration.metadata.get("cos_secret")

            pipeline_description = pipeline.description
            if pipeline_description is None:
                pipeline_description = f"Created with Elyra {__version__} pipeline editor using `{pipeline.source}`."

            python_output = template.render(
                operations_list=target_ops,
                pipeline_name=pipeline_instance_id,
                namespace=user_namespace,
                cos_secret=cos_secret,
                kube_config_path=None,
                is_paused_upon_creation="False",
                in_cluster="True",
                pipeline_description=pipeline_description,
            )

            # Write to python file and fix formatting
            with open(pipeline_export_path, "w") as fh:
                # Defer the import to postpone logger messages: https://github.com/psf/black/issues/2058
                import black

                autopep_output = autopep8.fix_code(python_output)
                output_to_file = black.format_str(autopep_output, mode=black.FileMode())

                fh.write(output_to_file)

        return pipeline_export_path

    def _create_unique_node_names(self, operation_list: List[Operation]) -> List[Operation]:
        unique_names = {}
        for operation in operation_list:
            # Ensure operation name is unique
            new_name = operation.name
            while new_name in unique_names:
                new_name = f"{operation.name}_{unique_names[operation.name]}"
                unique_names[operation.name] += 1
            operation.name = new_name

            unique_names[operation.name] = 1

        return operation_list

    def _scrub_invalid_characters_from_list(self, operation_list: List[Operation]) -> List[Operation]:
        for operation in operation_list:
            operation.name = self._scrub_invalid_characters(operation.name)

        return operation_list

    def _scrub_invalid_characters(self, name: str) -> str:
        chars = re.escape(string.punctuation)
        clean_name = re.sub(r"[" + chars + "\\s]", "_", name)  # noqa E226
        return clean_name

    def _process_dictionary_value(self, value: str) -> Union[Dict, str]:
        """
        For component parameters of type dictionary, if a string value is returned from the superclass
        method, it must be converted to include surrounding quotation marks for correct rendering
        in jinja DAG template.
        """
        converted_value = super()._process_dictionary_value(value)
        if isinstance(converted_value, str):
            converted_value = json.dumps(converted_value)
        return converted_value

    def _process_list_value(self, value: str) -> Union[List, str]:
        """
        For component parameters of type list, if a string value is returned from the superclass
        method, it must be converted to include surrounding quotation marks for correct rendering
        in jinja DAG template.
        """
        converted_value = super()._process_list_value(value)
        if isinstance(converted_value, str):
            converted_value = json.dumps(converted_value)
        return converted_value

    def _get_node_name(self, operations_list: list, node_id: str) -> Optional[str]:
        for operation in operations_list:
            if operation["id"] == node_id:
                return operation["notebook"]
        return None


class AirflowPipelineProcessorResponse(PipelineProcessorResponse):

    _type = RuntimeProcessorType.APACHE_AIRFLOW
    _name = "airflow"

    def __init__(self, git_url, run_url, object_storage_url, object_storage_path):
        super().__init__(run_url, object_storage_url, object_storage_path)
        self.git_url = git_url

    def to_json(self):
        response = super().to_json()
        response["git_url"] = self.git_url
        return response
