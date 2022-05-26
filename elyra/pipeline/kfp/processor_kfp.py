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
from datetime import datetime
import os
import re
import tempfile
import time
from typing import Dict
from urllib.parse import urlsplit

from kfp import Client as ArgoClient
from kfp import compiler as kfp_argo_compiler
from kfp import components as components
from kfp.dsl import PipelineConf
from kfp.aws import use_aws_secret  # noqa H306
from kubernetes import client as k8s_client

try:
    from kfp_tekton import compiler as kfp_tekton_compiler
    from kfp_tekton import TektonClient
except ImportError:
    # We may not have kfp-tekton available and that's okay!
    kfp_tekton_compiler = None
    TektonClient = None

from elyra._version import __version__
from elyra.kfp.operator import ExecuteFileOp
from elyra.metadata.schemaspaces import RuntimeImages
from elyra.metadata.schemaspaces import Runtimes
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.kfp.kfp_authentication import AuthenticationError
from elyra.pipeline.kfp.kfp_authentication import KFPAuthenticator
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.pipeline_constants import COS_OBJECT_PREFIX
from elyra.pipeline.pipeline_constants import KUBERNETES_SECRETS
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.processor import PipelineProcessorResponse
from elyra.pipeline.processor import RuntimePipelineProcessor
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.util.cos import join_paths
from elyra.util.path import get_absolute_path


class KfpPipelineProcessor(RuntimePipelineProcessor):
    _type = RuntimeProcessorType.KUBEFLOW_PIPELINES
    _name = "kfp"

    # Provide users with the ability to identify a writable directory in the
    # running container where the notebook | script is executed. The location
    # must exist and be known before the container is started.
    # Defaults to `/tmp`
    WCD = os.getenv("ELYRA_WRITABLE_CONTAINER_DIR", "/tmp").strip().rstrip("/")

    def __init__(self, root_dir, **kwargs):
        super().__init__(root_dir, **kwargs)

    def process(self, pipeline):
        """
        Runs a pipeline on Kubeflow Pipelines

        Each time a pipeline is processed, a new version
        is uploaded and run under the same experiment name.
        """

        timestamp = datetime.now().strftime("%m%d%H%M%S")

        ################
        # Runtime Configs
        ################
        runtime_configuration = self._get_metadata_configuration(
            schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID, name=pipeline.runtime_config
        )

        # unpack Kubeflow Pipelines configs
        api_endpoint = runtime_configuration.metadata["api_endpoint"].rstrip("/")
        public_api_endpoint = runtime_configuration.metadata.get("public_api_endpoint", api_endpoint)
        api_username = runtime_configuration.metadata.get("api_username")
        api_password = runtime_configuration.metadata.get("api_password")
        user_namespace = runtime_configuration.metadata.get("user_namespace")
        engine = runtime_configuration.metadata.get("engine")
        if engine == "Tekton" and not TektonClient:
            raise ValueError(
                "Python package `kfp-tekton` is not installed. "
                "Please install using `elyra[kfp-tekton]` to use Tekton engine."
            )

        # unpack Cloud Object Storage configs
        cos_endpoint = runtime_configuration.metadata["cos_endpoint"]
        cos_bucket = runtime_configuration.metadata["cos_bucket"]

        # Determine which provider to use to authenticate with Kubeflow
        auth_type = runtime_configuration.metadata.get("auth_type")

        try:
            auth_info = KFPAuthenticator().authenticate(
                api_endpoint,
                auth_type_str=auth_type,
                runtime_config_name=pipeline.runtime_config,
                auth_parm_1=api_username,
                auth_parm_2=api_password,
            )
            self.log.debug(f"Authenticator returned {auth_info}")
        except AuthenticationError as ae:
            if ae.get_request_history() is not None:
                self.log.info("An authentication error was raised. Diagnostic information follows.")
                self.log.info(ae.request_history_to_string())
            raise RuntimeError(f"Kubeflow authentication failed: {ae}")

        #############
        # Create Kubeflow Client
        #############
        try:
            if engine == "Tekton":
                client = TektonClient(
                    host=api_endpoint,
                    cookies=auth_info.get("cookies", None),
                    credentials=auth_info.get("credentials", None),
                    existing_token=auth_info.get("existing_token", None),
                    namespace=user_namespace,
                )
            else:
                client = ArgoClient(
                    host=api_endpoint,
                    cookies=auth_info.get("cookies", None),
                    credentials=auth_info.get("credentials", None),
                    existing_token=auth_info.get("existing_token", None),
                    namespace=user_namespace,
                )
        except Exception as ex:
            # a common cause of these errors is forgetting to include `/pipeline` or including it with an 's'
            api_endpoint_obj = urlsplit(api_endpoint)
            if api_endpoint_obj.path != "/pipeline":
                api_endpoint_tip = api_endpoint_obj._replace(path="/pipeline").geturl()
                tip_string = (
                    f" - [TIP: did you mean to set '{api_endpoint_tip}' as the endpoint, "
                    f"take care not to include 's' at end]"
                )
            else:
                tip_string = ""

            raise RuntimeError(
                f"Failed to initialize `kfp.Client()` against: '{api_endpoint}' - "
                f"Check Kubeflow Pipelines runtime configuration: '{pipeline.runtime_config}'"
                f"{tip_string}"
            ) from ex

        #############
        # Verify Namespace
        #############
        try:
            client.list_experiments(namespace=user_namespace, page_size=1)
        except Exception as ex:
            if user_namespace:
                tip_string = f"[TIP: ensure namespace '{user_namespace}' is correct]"
            else:
                tip_string = "[TIP: you probably need to set a namespace]"

            raise RuntimeError(
                f"Failed to `kfp.Client().list_experiments()` against: '{api_endpoint}' - "
                f"Check Kubeflow Pipelines runtime configuration: '{pipeline.runtime_config}' - "
                f"{tip_string}"
            ) from ex

        #############
        # Pipeline Metadata none - inherited
        #############
        # generate a pipeline name
        pipeline_name = pipeline.name

        # generate a pipeline description
        pipeline_description = pipeline.description
        if pipeline_description is None:
            pipeline_description = f"Created with Elyra {__version__} pipeline editor using `{pipeline.source}`."

        #############
        # Submit & Run the Pipeline
        #############
        self.log_pipeline_info(pipeline_name, "submitting pipeline")

        with tempfile.TemporaryDirectory() as temp_dir:
            self.log.debug(f"Created temporary directory at: {temp_dir}")
            pipeline_path = os.path.join(temp_dir, f"{pipeline_name}.tar.gz")

            #############
            # Get Pipeline ID
            #############
            try:
                # get the kubeflow pipeline id (returns None if not found, otherwise the ID of the pipeline)
                pipeline_id = client.get_pipeline_id(pipeline_name)

                # calculate what "pipeline version" name to use
                if pipeline_id is None:
                    # the first "pipeline version" name must be the pipeline name
                    pipeline_version_name = pipeline_name
                else:
                    # generate a unique name for a new "pipeline version" by appending the current timestamp
                    pipeline_version_name = f"{pipeline_name}-{timestamp}"

            except Exception as ex:
                raise RuntimeError(
                    f"Failed to get ID of Kubeflow pipeline: '{pipeline_name}' - "
                    f"Check Kubeflow Pipelines runtime configuration: '{pipeline.runtime_config}'"
                ) from ex

            #############
            # Compile the Pipeline
            #############
            try:
                t0 = time.time()

                # generate a name for the experiment (lowercase because experiments are case intensive)
                experiment_name = pipeline_name.lower()

                # Create an instance id that will be used to store
                # the pipelines' dependencies, if applicable
                pipeline_instance_id = f"{pipeline_name}-{timestamp}"

                pipeline_function = lambda: self._cc_pipeline(  # nopep8 E731
                    pipeline,
                    pipeline_name=pipeline_name,
                    pipeline_version=pipeline_version_name,
                    experiment_name=experiment_name,
                    pipeline_instance_id=pipeline_instance_id,
                )

                # collect pipeline configuration information
                pipeline_conf = self._generate_pipeline_conf(pipeline)

                # compile the pipeline
                if engine == "Tekton":
                    kfp_tekton_compiler.TektonCompiler().compile(
                        pipeline_function, pipeline_path, pipeline_conf=pipeline_conf
                    )
                else:
                    kfp_argo_compiler.Compiler().compile(pipeline_function, pipeline_path, pipeline_conf=pipeline_conf)
            except RuntimeError:
                raise
            except Exception as ex:
                raise RuntimeError(
                    f"Failed to compile pipeline '{pipeline_name}' with engine '{engine}' to: '{pipeline_path}'"
                ) from ex

            self.log_pipeline_info(pipeline_name, "pipeline compiled", duration=time.time() - t0)

            #############
            # Upload Pipeline Version
            #############
            try:
                t0 = time.time()

                # CASE 1: pipeline needs to be created
                if pipeline_id is None:
                    # create new pipeline (and initial "pipeline version")
                    kfp_pipeline = client.upload_pipeline(
                        pipeline_package_path=pipeline_path,
                        pipeline_name=pipeline_name,
                        description=pipeline_description,
                    )

                    # extract the ID of the pipeline we created
                    pipeline_id = kfp_pipeline.id

                    # the initial "pipeline version" has the same id as the pipeline itself
                    version_id = pipeline_id

                # CASE 2: pipeline already exists
                else:
                    # upload the "pipeline version"
                    kfp_pipeline = client.upload_pipeline_version(
                        pipeline_package_path=pipeline_path,
                        pipeline_version_name=pipeline_version_name,
                        pipeline_id=pipeline_id,
                    )

                    # extract the id of the "pipeline version" that was created
                    version_id = kfp_pipeline.id

            except Exception as ex:
                # a common cause of these errors is forgetting to include `/pipeline` or including it with an 's'
                api_endpoint_obj = urlsplit(api_endpoint)
                if api_endpoint_obj.path != "/pipeline":
                    api_endpoint_tip = api_endpoint_obj._replace(path="/pipeline").geturl()
                    tip_string = (
                        f" - [TIP: did you mean to set '{api_endpoint_tip}' as the endpoint, "
                        f"take care not to include 's' at end]"
                    )
                else:
                    tip_string = ""

                raise RuntimeError(
                    f"Failed to upload Kubeflow pipeline '{pipeline_name}' - "
                    f"Check Kubeflow Pipelines runtime configuration: '{pipeline.runtime_config}'"
                    f"{tip_string}"
                ) from ex

            self.log_pipeline_info(pipeline_name, "pipeline uploaded", duration=time.time() - t0)

            #############
            # Create Experiment
            #############
            try:
                t0 = time.time()

                # create a new experiment (if already exists, this a no-op)
                experiment = client.create_experiment(name=experiment_name, namespace=user_namespace)

            except Exception as ex:
                raise RuntimeError(
                    f"Failed to create Kubeflow experiment: '{experiment_name}' - "
                    f"Check Kubeflow Pipelines runtime configuration: '{pipeline.runtime_config}'"
                ) from ex

            self.log_pipeline_info(pipeline_name, "created experiment", duration=time.time() - t0)

            #############
            # Create Pipeline Run
            #############
            try:
                t0 = time.time()

                # generate name for the pipeline run
                job_name = pipeline_instance_id

                # create pipeline run (or specified pipeline version)
                run = client.run_pipeline(
                    experiment_id=experiment.id, job_name=job_name, pipeline_id=pipeline_id, version_id=version_id
                )

            except Exception as ex:
                raise RuntimeError(
                    f"Failed to create Kubeflow pipeline run: '{job_name}' - "
                    f"Check Kubeflow Pipelines runtime configuration: '{pipeline.runtime_config}'"
                ) from ex

            if run is None:
                # client.run_pipeline seemed to have encountered an issue
                # but didn't raise an exception
                raise RuntimeError(
                    f"Failed to create Kubeflow pipeline run: '{job_name}' - "
                    f"Check Kubeflow Pipelines runtime configuration: '{pipeline.runtime_config}'"
                )

            self.log_pipeline_info(
                pipeline_name,
                f"pipeline submitted: {public_api_endpoint}/#/runs/details/{run.id}",
                duration=time.time() - t0,
            )

        if pipeline.contains_generic_operations():
            object_storage_url = f"{cos_endpoint}"
            os_path = join_paths(pipeline.pipeline_parameters.get(COS_OBJECT_PREFIX), pipeline_instance_id)
            object_storage_path = f"/{cos_bucket}/{os_path}"
        else:
            object_storage_url = None
            object_storage_path = None

        return KfpPipelineProcessorResponse(
            run_id=run.id,
            run_url=f"{public_api_endpoint}/#/runs/details/{run.id}",
            object_storage_url=object_storage_url,
            object_storage_path=object_storage_path,
        )

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        # Verify that the KfpPipelineProcessor supports the given export format
        self._verify_export_format(pipeline_export_format)

        t0_all = time.time()
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = pipeline.name
        # Create an instance id that will be used to store
        # the pipelines' dependencies, if applicable
        pipeline_instance_id = f"{pipeline_name}-{timestamp}"

        # Since pipeline_export_path may be relative to the notebook directory, ensure
        # we're using its absolute form.
        absolute_pipeline_export_path = get_absolute_path(self.root_dir, pipeline_export_path)

        runtime_configuration = self._get_metadata_configuration(
            schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID, name=pipeline.runtime_config
        )

        engine = runtime_configuration.metadata.get("engine")
        if engine == "Tekton" and not TektonClient:
            raise ValueError("kfp-tekton not installed. Please install using elyra[kfp-tekton] to use Tekton engine.")

        if os.path.exists(absolute_pipeline_export_path) and not overwrite:
            raise ValueError("File " + absolute_pipeline_export_path + " already exists.")

        self.log_pipeline_info(pipeline_name, f"Exporting pipeline as a .{pipeline_export_format} file")
        # Export pipeline as static configuration file (YAML formatted)
        try:
            # Exported pipeline is not associated with an experiment
            # or a version. The association is established when the
            # pipeline is imported into KFP by the user.
            pipeline_function = lambda: self._cc_pipeline(
                pipeline, pipeline_name, pipeline_instance_id=pipeline_instance_id
            )  # nopep8
            if engine == "Tekton":
                self.log.info("Compiling pipeline for Tekton engine")
                kfp_tekton_compiler.TektonCompiler().compile(pipeline_function, absolute_pipeline_export_path)
            else:
                self.log.info("Compiling pipeline for Argo engine")
                kfp_argo_compiler.Compiler().compile(pipeline_function, absolute_pipeline_export_path)
        except RuntimeError:
            raise
        except Exception as ex:
            if ex.__cause__:
                raise RuntimeError(str(ex)) from ex
            raise RuntimeError(
                f"Error pre-processing pipeline '{pipeline_name}' for export to '{absolute_pipeline_export_path}'",
                str(ex),
            ) from ex

        self.log_pipeline_info(
            pipeline_name, f"pipeline exported to '{pipeline_export_path}'", duration=(time.time() - t0_all)
        )

        return pipeline_export_path  # Return the input value, not its absolute form

    def _collect_envs(self, operation: Operation, **kwargs) -> Dict:
        """
        Amends envs collected from superclass with those pertaining to this subclass

        :return: dictionary containing environment name/value pairs
        """
        envs = super()._collect_envs(operation, **kwargs)
        # Only Unix-style path spec is supported.
        envs["ELYRA_WRITABLE_CONTAINER_DIR"] = self.WCD
        return envs

    def _cc_pipeline(
        self,
        pipeline: Pipeline,
        pipeline_name: str,
        pipeline_version: str = "",
        experiment_name: str = "",
        pipeline_instance_id: str = None,
        export=False,
    ):

        runtime_configuration = self._get_metadata_configuration(
            schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID, name=pipeline.runtime_config
        )

        cos_endpoint = runtime_configuration.metadata["cos_endpoint"]
        cos_username = runtime_configuration.metadata.get("cos_username")
        cos_password = runtime_configuration.metadata.get("cos_password")
        cos_secret = runtime_configuration.metadata.get("cos_secret")
        cos_bucket = runtime_configuration.metadata.get("cos_bucket")
        engine = runtime_configuration.metadata["engine"]

        pipeline_instance_id = pipeline_instance_id or pipeline_name

        artifact_object_prefix = join_paths(pipeline.pipeline_parameters.get(COS_OBJECT_PREFIX), pipeline_instance_id)

        self.log_pipeline_info(
            pipeline_name,
            f"processing pipeline dependencies for upload to '{cos_endpoint}' "
            f"bucket '{cos_bucket}' folder '{artifact_object_prefix}'",
        )
        t0_all = time.time()

        emptydir_volume_size = ""
        container_runtime = bool(os.getenv("CRIO_RUNTIME", "False").lower() == "true")

        # Create dictionary that maps component Id to its ContainerOp instance
        target_ops = {}

        # Sort operations based on dependency graph (topological order)
        sorted_operations = PipelineProcessor._sort_operations(pipeline.operations)

        # Determine whether access to cloud storage is required
        for operation in sorted_operations:
            if isinstance(operation, GenericOperation):
                self._verify_cos_connectivity(runtime_configuration)
                break

        # All previous operation outputs should be propagated throughout the pipeline.
        # In order to process this recursively, the current operation's inputs should be combined
        # from its parent's inputs (which, themselves are derived from the outputs of their parent)
        # and its parent's outputs.

        PipelineProcessor._propagate_operation_inputs_outputs(pipeline, sorted_operations)

        for operation in sorted_operations:

            if container_runtime:
                # Volume size to create when using CRI-o, NOTE: IBM Cloud minimum is 20Gi
                emptydir_volume_size = "20Gi"

            sanitized_operation_name = self._sanitize_operation_name(operation.name)

            # Create pipeline operation
            # If operation is one of the "generic" set of NBs or scripts, construct custom ExecuteFileOp
            if isinstance(operation, GenericOperation):

                # Collect env variables
                pipeline_envs = self._collect_envs(
                    operation, cos_secret=cos_secret, cos_username=cos_username, cos_password=cos_password
                )

                operation_artifact_archive = self._get_dependency_archive_name(operation)

                self.log.debug(
                    f"Creating pipeline component archive '{operation_artifact_archive}' for operation '{operation}'"
                )

                target_ops[operation.id] = ExecuteFileOp(
                    name=sanitized_operation_name,
                    pipeline_name=pipeline_name,
                    experiment_name=experiment_name,
                    notebook=operation.filename,
                    cos_endpoint=cos_endpoint,
                    cos_bucket=cos_bucket,
                    cos_directory=artifact_object_prefix,
                    cos_dependencies_archive=operation_artifact_archive,
                    pipeline_version=pipeline_version,
                    pipeline_source=pipeline.source,
                    pipeline_inputs=operation.inputs,
                    pipeline_outputs=operation.outputs,
                    pipeline_envs=pipeline_envs,
                    emptydir_volume_size=emptydir_volume_size,
                    cpu_request=operation.cpu,
                    mem_request=operation.memory,
                    gpu_limit=operation.gpu,
                    workflow_engine=engine,
                    image=operation.runtime_image,
                    file_outputs={
                        "mlpipeline-metrics": f"{pipeline_envs['ELYRA_WRITABLE_CONTAINER_DIR']}/mlpipeline-metrics.json",  # noqa
                        "mlpipeline-ui-metadata": f"{pipeline_envs['ELYRA_WRITABLE_CONTAINER_DIR']}/mlpipeline-ui-metadata.json",  # noqa
                    },
                    volume_mounts=operation.component_params.get(MOUNTED_VOLUMES, []),
                    kubernetes_secrets=operation.component_params.get(KUBERNETES_SECRETS, []),
                )

                if operation.doc:
                    target_ops[operation.id].add_pod_annotation("elyra/node-user-doc", operation.doc)

                # TODO Can we move all of this to apply to non-standard components as well? Test when servers are up
                if cos_secret and not export:
                    target_ops[operation.id].apply(use_aws_secret(cos_secret))

                image_namespace = self._get_metadata_configuration(RuntimeImages.RUNTIME_IMAGES_SCHEMASPACE_ID)
                for image_instance in image_namespace:
                    if image_instance.metadata["image_name"] == operation.runtime_image and image_instance.metadata.get(
                        "pull_policy"
                    ):
                        target_ops[operation.id].container.set_image_pull_policy(image_instance.metadata["pull_policy"])

                self.log_pipeline_info(
                    pipeline_name,
                    f"processing operation dependencies for id '{operation.id}'",
                    operation_name=operation.name,
                )

                self._upload_dependencies_to_object_store(
                    runtime_configuration, pipeline_name, operation, prefix=artifact_object_prefix
                )

            # If operation is a "non-standard" component, load it's spec and create operation with factory function
            else:
                # Retrieve component from cache
                component = ComponentCache.instance().get_component(self._type, operation.classifier)

                # Convert the user-entered value of certain properties according to their type
                for component_property in component.properties:
                    # Get corresponding property's value from parsed pipeline
                    property_value = operation.component_params.get(component_property.ref)

                    self.log.debug(
                        f"Processing component parameter '{component_property.name}' "
                        f"of type '{component_property.data_type}'"
                    )

                    if component_property.data_type == "inputpath":
                        output_node_id = property_value["value"]
                        output_node_parameter_key = property_value["option"].replace("elyra_output_", "")
                        operation.component_params[component_property.ref] = target_ops[output_node_id].outputs[
                            output_node_parameter_key
                        ]
                    elif component_property.data_type == "inputvalue":
                        active_property = property_value["activeControl"]
                        active_property_value = property_value.get(active_property, None)

                        # If the value is not found, assign it the default value assigned in parser
                        if active_property_value is None:
                            active_property_value = component_property.value

                        if isinstance(active_property_value, dict) and set(active_property_value.keys()) == {
                            "value",
                            "option",
                        }:
                            output_node_id = active_property_value["value"]
                            output_node_parameter_key = active_property_value["option"].replace("elyra_output_", "")
                            operation.component_params[component_property.ref] = target_ops[output_node_id].outputs[
                                output_node_parameter_key
                            ]
                        elif component_property.default_data_type == "dictionary":
                            processed_value = self._process_dictionary_value(active_property_value)
                            operation.component_params[component_property.ref] = processed_value
                        elif component_property.default_data_type == "list":
                            processed_value = self._process_list_value(active_property_value)
                            operation.component_params[component_property.ref] = processed_value
                        else:
                            operation.component_params[component_property.ref] = active_property_value

                # Build component task factory
                try:
                    factory_function = components.load_component_from_text(component.definition)
                except Exception as e:
                    # TODO Fix error messaging and break exceptions down into categories
                    self.log.error(f"Error loading component spec for {operation.name}: {str(e)}")
                    raise RuntimeError(f"Error loading component spec for {operation.name}.")

                # Add factory function, which returns a ContainerOp task instance, to pipeline operation dict
                try:
                    comp_spec_inputs = [
                        inputs.name.lower().replace(" ", "_") for inputs in factory_function.component_spec.inputs or []
                    ]

                    # Remove inputs and outputs from params dict
                    # TODO: need to have way to retrieve only required params
                    parameter_removal_list = ["inputs", "outputs"]
                    for component_param in operation.component_params_as_dict.keys():
                        if component_param not in comp_spec_inputs:
                            parameter_removal_list.append(component_param)

                    for parameter in parameter_removal_list:
                        operation.component_params_as_dict.pop(parameter, None)

                    # Create ContainerOp instance and assign appropriate user-provided name
                    sanitized_component_params = {
                        self._sanitize_param_name(name): value
                        for name, value in operation.component_params_as_dict.items()
                    }
                    container_op = factory_function(**sanitized_component_params)
                    container_op.set_display_name(operation.name)

                    if operation.doc:
                        container_op.add_pod_annotation("elyra/node-user-doc", operation.doc)

                    target_ops[operation.id] = container_op
                except Exception as e:
                    # TODO Fix error messaging and break exceptions down into categories
                    self.log.error(f"Error constructing component {operation.name}: {str(e)}")
                    raise RuntimeError(f"Error constructing component {operation.name}.")

        # Process dependencies after all the operations have been created
        for operation in pipeline.operations.values():
            op = target_ops[operation.id]
            for parent_operation_id in operation.parent_operation_ids:
                parent_op = target_ops[parent_operation_id]  # Parent Operation
                op.after(parent_op)

        self.log_pipeline_info(pipeline_name, "pipeline dependencies processed", duration=(time.time() - t0_all))

        return target_ops

    def _generate_pipeline_conf(self, pipeline: dict) -> PipelineConf:
        """
        Returns a KFP pipeline configuration for this pipeline, which can be empty.

        :param pipeline: pipeline dictionary
        :type pipeline: dict
        :return: https://kubeflow-pipelines.readthedocs.io/en/latest/source/kfp.dsl.html#kfp.dsl.PipelineConf
        :rtype: kfp.dsl import PipelineConf
        """

        self.log.debug("Generating pipeline configuration ...")
        pipeline_conf = PipelineConf()

        #
        # Gather input for container image pull secrets in support of private container image registries
        # https://kubeflow-pipelines.readthedocs.io/en/latest/source/kfp.dsl.html#kfp.dsl.PipelineConf.set_image_pull_secrets
        #
        image_namespace = self._get_metadata_configuration(schemaspace=RuntimeImages.RUNTIME_IMAGES_SCHEMASPACE_ID)

        # iterate through pipeline operations and create list of Kubernetes secret names
        # that are associated with generic components
        container_image_pull_secret_names = []
        for operation in pipeline.operations.values():
            if isinstance(operation, GenericOperation):
                for image_instance in image_namespace:
                    if image_instance.metadata["image_name"] == operation.runtime_image:
                        if image_instance.metadata.get("pull_secret"):
                            container_image_pull_secret_names.append(image_instance.metadata.get("pull_secret"))
                        break

        if len(container_image_pull_secret_names) > 0:
            # de-duplicate the pull secret name list, create Kubernetes resource
            # references and add them to the pipeline configuration
            container_image_pull_secrets = []
            for secret_name in list(set(container_image_pull_secret_names)):
                container_image_pull_secrets.append(k8s_client.V1ObjectReference(name=secret_name))
            pipeline_conf.set_image_pull_secrets(container_image_pull_secrets)
            self.log.debug(
                f"Added {len(container_image_pull_secrets)}" " image pull secret(s) to the pipeline configuration."
            )

        return pipeline_conf

    @staticmethod
    def _sanitize_operation_name(name: str) -> str:
        """
        In KFP, only letters, numbers, spaces, "_", and "-" are allowed in name.
        :param name: name of the operation
        """
        return re.sub("-+", "-", re.sub("[^-_0-9A-Za-z ]+", "-", name)).lstrip("-").rstrip("-")

    @staticmethod
    def _sanitize_param_name(name: str) -> str:
        """
        Sanitize a component parameter name.

        Behavior is mirrored from how Kubeflow 1.X sanitizes identifier names:
        - https://github.com/kubeflow/pipelines/blob/1.8.1/sdk/python/kfp/components/_naming.py#L32-L42
        - https://github.com/kubeflow/pipelines/blob/1.8.1/sdk/python/kfp/components/_naming.py#L49-L50
        """
        normalized_name = name.lower()

        # remove non-word characters
        normalized_name = re.sub(r"[\W_]", " ", normalized_name)

        # no double spaces, leading or trailing spaces
        normalized_name = re.sub(" +", " ", normalized_name).strip()

        # no leading digits
        if re.match(r"\d", normalized_name):
            normalized_name = "n" + normalized_name

        return normalized_name.replace(" ", "_")


class KfpPipelineProcessorResponse(PipelineProcessorResponse):
    _type = RuntimeProcessorType.KUBEFLOW_PIPELINES
    _name = "kfp"

    def __init__(self, run_id, run_url, object_storage_url, object_storage_path):
        super().__init__(run_url, object_storage_url, object_storage_path)
        self.run_id = run_id

    def to_json(self):
        response = super().to_json()
        response["run_id"] = self.run_id
        return response
