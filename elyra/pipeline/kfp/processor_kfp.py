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
from datetime import datetime
from enum import Enum
from enum import unique
import hashlib
import importlib
import json
import os
from pathlib import Path
import re
import string
import sys
import tempfile
import time
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Set
from urllib.parse import urlsplit

from autopep8 import fix_code
from jinja2 import Environment
from jinja2 import PackageLoader
from kfp import Client as ArgoClient
from kfp import compiler as kfp_argo_compiler
from kfp import components as components
from kubernetes import client as k8s_client
from traitlets import default
from traitlets import Unicode

RUN_ID_PLACEHOLDER = "random-placeholder"

from elyra._version import __version__
from elyra.metadata.schemaspaces import RuntimeImages
from elyra.metadata.schemaspaces import Runtimes
from elyra.pipeline import pipeline_constants
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.kfp.kfp_authentication import AuthenticationError
from elyra.pipeline.kfp.kfp_authentication import KFPAuthenticator
from elyra.pipeline.kfp.kfp_properties import KfpPipelineParameter
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.processor import RuntimePipelineProcessor
from elyra.pipeline.processor import RuntimePipelineProcessorResponse
from elyra.pipeline.properties import CustomSharedMemorySize
from elyra.pipeline.properties import DisableNodeCaching
from elyra.pipeline.properties import ElyraProperty
from elyra.pipeline.properties import ElyraPropertyList
from elyra.pipeline.properties import KubernetesAnnotation
from elyra.pipeline.properties import KubernetesLabel
from elyra.pipeline.properties import KubernetesSecret
from elyra.pipeline.properties import KubernetesToleration
from elyra.pipeline.properties import PipelineParameter
from elyra.pipeline.properties import VolumeMount
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.util.cos import join_paths
from elyra.util.kubernetes import sanitize_label_value
from elyra.util.path import get_absolute_path

from elyra.pipeline.kfp.PipelineConf import PipelineConf


@unique
class WorkflowEngineType(Enum):
    """
    Identifies Kubeflow Pipelines workflow engines that this
    processor supports.
    """

    ARGO = "argo"
    TEKTON = "tekton"

    @staticmethod
    def get_instance_by_value(value: str) -> "WorkflowEngineType":
        """
        Produces an WorkflowEngineType enum instance if the provided value
        identifies a supported workflow engine type.
        Raises KeyError if value is not a support workflow engine type.
        """
        if value:
            for instance in WorkflowEngineType.__members__.values():
                if instance.value == value.lower():
                    return instance
        raise KeyError(f"'{value}'")


# Externalize these constants to make them available to the code gen tests
CRIO_VOL_DEF_NAME = "workspace"
CRIO_VOL_DEF_SIZE = "20Gi"
CRIO_VOL_DEF_MEDIUM = ""
CRIO_VOL_MOUNT_PATH = "/opt/app-root/src"
CRIO_VOL_WORKDIR_PATH = f"{CRIO_VOL_MOUNT_PATH}/jupyter-work-dir"
CRIO_VOL_PYTHON_PATH = f"{CRIO_VOL_WORKDIR_PATH}/python3"
class KfpPipelineProcessor(RuntimePipelineProcessor):
    _type = RuntimeProcessorType.KUBEFLOW_PIPELINES
    _name = "kfp"

    # Provide users with the ability to identify a writable directory in the
    # running container where the notebook | script is executed. The location
    # must exist and be known before the container is started.
    # Defaults to `/tmp`
    WCD = os.getenv("ELYRA_WRITABLE_CONTAINER_DIR", "/tmp").strip().rstrip("/")

    # Set the method for passing parameters to notebook and scripts
    # Only one value is currently supported ("env", which passes
    # parameters as environment variables)
    parameter_pass_default = "env"
    parameter_pass_method_env = "ELYRA_PARAMETER_PASS_METHOD"
    parameter_pass_method = Unicode(
        parameter_pass_default,
        help="""Sets the method to be used to pass pipeline parameters
                     to notebooks and scripts. Can be one of: ["env"].
                     (default=env). (ELYRA_PARAMETER_PASS_METHOD env var)""",
    ).tag(config=True)

    @default("parameter_pass_method")
    def parameter_pass_method_default(self):
        parameter_pass_default = KfpPipelineProcessor.parameter_pass_default
        try:
            parameter_pass_default = os.getenv(self.parameter_pass_method_env, parameter_pass_default)
        except ValueError:
            self.log.info(
                f"Unable to parse environmental variable {self.parameter_pass_method_env}, "
                f"using the default value of {self.parameter_pass_default}"
            )
        return parameter_pass_default

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
        workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_configuration.metadata.get("engine", "argo"))

        # unpack Cloud Object Storage configs
        cos_endpoint = runtime_configuration.metadata["cos_endpoint"]
        cos_public_endpoint = runtime_configuration.metadata.get("public_cos_endpoint", cos_endpoint)
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
            pipeline_path = os.path.join(temp_dir, f"{pipeline_name}.yaml")

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

                # Generate Python DSL from workflow
                pipeline_dsl = self._generate_pipeline_dsl(
                    pipeline=pipeline,
                    pipeline_name=pipeline_name,
                    pipeline_instance_id=pipeline_instance_id,
                    workflow_engine=workflow_engine,
                )

                # Collect pipeline configuration information
                pipeline_conf = self._generate_pipeline_conf(pipeline=pipeline)

                # Compile the Python DSL, producing the input for the upload to
                # Kubeflow Pipelines
                self._compile_pipeline_dsl(pipeline_dsl, workflow_engine, pipeline_path, pipeline_conf)

            except RuntimeError:
                raise
            except Exception as ex:
                raise RuntimeError(
                    f"Error compiling pipeline '{pipeline_name}' with engine '{workflow_engine.value}'."
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
                    pipeline_id = kfp_pipeline.pipeline_id

                    # the initial "pipeline version" has the same id as the pipeline itself
                    version_details = client.list_pipeline_versions(pipeline_id=pipeline_id)
                    version_list = version_details.pipeline_versions
                    if isinstance(version_list, list):
                        version_id = version_list[0].pipeline_version_id
                    else:
                        version_id = None
                # CASE 2: pipeline already exists
                else:
                    # upload the "pipeline version"
                    kfp_pipeline = client.upload_pipeline_version(
                        pipeline_package_path=pipeline_path,
                        pipeline_version_name=pipeline_version_name,
                        pipeline_id=pipeline_id,
                    )

                    # extract the id of the "pipeline version" that was created
                    version_id = kfp_pipeline.pipeline_version_id

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
                    experiment_id=experiment.experiment_id, job_name=job_name, pipeline_id=pipeline_id, version_id=version_id
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
                f"pipeline submitted: {public_api_endpoint}/#/runs/details/{run.run_id}",
                duration=time.time() - t0,
            )

        if pipeline.contains_generic_operations():
            object_storage_url = f"{cos_public_endpoint}"
            os_path = join_paths(
                pipeline.pipeline_properties.get(pipeline_constants.COS_OBJECT_PREFIX), pipeline_instance_id
            )
            object_storage_path = f"/{cos_bucket}/{os_path}"
        else:
            object_storage_url = None
            object_storage_path = None

        return KfpPipelineProcessorResponse(
            run_id=run.run_id,
            run_url=f"{public_api_endpoint}/#/runs/details/{run.run_id}",
            object_storage_url=object_storage_url,
            object_storage_path=object_storage_path,
        )

    def export(
        self, pipeline: Pipeline, pipeline_export_format: str, pipeline_export_path: str, overwrite: bool
    ) -> str:
        """
        Export pipeline to the specified format and store the output
        in the specified file.

        :param pipeline: The pipeline to be exported
        :type pipeline: Pipeline
        :param pipeline_export_format: "py" for KFP Python DSL or "yaml" for YAML
        :type pipeline_export_format: str
        :param pipeline_export_path: name and location of exported file
        :type pipeline_export_path: str
        :param overwrite: If false, export raises an error if the output file exists.
        :type overwrite: bool
        :raises ValueError: raised if a parameter is invalid
        :raises RuntimeError: an error occurred during export
        :return: location of the exported file
        :rtype: str
        """
        # Verify that the processor supports the given export format
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

        workflow_engine = WorkflowEngineType.get_instance_by_value(runtime_configuration.metadata.get("engine", "argo"))

        if Path(absolute_pipeline_export_path).exists() and not overwrite:
            raise ValueError("File " + absolute_pipeline_export_path + " already exists.")

        self.log_pipeline_info(pipeline_name, f"Exporting pipeline as a .{pipeline_export_format} file")
        try:
            # Generate Python DSL
            pipeline_dsl = self._generate_pipeline_dsl(
                pipeline=pipeline,
                pipeline_name=pipeline_name,
                pipeline_instance_id=pipeline_instance_id,
                workflow_engine=workflow_engine,
            )

            if pipeline_export_format == "py":
                # Write Python DSL to file
                with open(absolute_pipeline_export_path, "w") as dsl_output:
                    dsl_output.write(pipeline_dsl)
            else:
                # Generate pipeline configuration
                pipeline_conf = self._generate_pipeline_conf(pipeline=pipeline)
                #
                # Export pipeline as static configuration file (YAML formatted)
                # by invoking the compiler for the selected engine
                self._compile_pipeline_dsl(pipeline_dsl, workflow_engine, absolute_pipeline_export_path, pipeline_conf)
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

    def _generate_pipeline_dsl(
        self,
        pipeline: Pipeline,
        pipeline_name: str,
        workflow_engine: WorkflowEngineType,
        pipeline_version: str = "",
        experiment_name: str = "",
        pipeline_instance_id: str = None,
        code_generation_options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate Python DSL for Kubeflow Pipelines v1
        """
        if not code_generation_options:
            code_generation_options = {}

        # Load Kubeflow Pipelines Python DSL template
        loader = PackageLoader("elyra", "templates/kubeflow/v2")
        template_env = Environment(loader=loader)
        # Add filter that produces a Python-safe variable name
        template_env.filters["python_safe"] = lambda x: re.sub(r"[" + re.escape(string.punctuation) + "\\s]", "_", x)
        # Add filter that escapes the " character in strings
        template_env.filters["string_delimiter_safe"] = lambda string: re.sub('"', '\\"', string)
        # Add filter that converts a value to a python variable value (e.g. puts quotes around strings)
        template_env.filters["param_val_to_python_var"] = lambda p: (
            "None" if p.value is None else (f'"{p.value}"' if p.input_type.base_type == "String" else p.value)
        )
        template = template_env.get_template("python_dsl_template.jinja2")

        # Convert pipeline into workflow tasks
        workflow_tasks = self._generate_workflow_tasks(
            pipeline,
            pipeline_name,
            workflow_engine,
            pipeline_instance_id=pipeline_instance_id,
            pipeline_version=pipeline_version,
            experiment_name=experiment_name,
        )

        # Gather unique component definitions from workflow task list.
        unique_component_definitions = {}
        for key, operation in workflow_tasks.items():
            unique_component_definitions[operation["component_definition_hash"]] = operation["component_definition"]

        pipeline_parameters: List[PipelineParameter] = pipeline.parameters
        if code_generation_options.get("render_all_parameters") is not True:
            # Gather the list of parameter names referenced by the pipeline's tasks
            referenced_parameter_names: Set[str] = set()
            for task in workflow_tasks.values():
                for task_details in task["task_inputs"].values():
                    parameter_reference = task_details.get("pipeline_parameter_reference")
                    if parameter_reference:
                        referenced_parameter_names.add(parameter_reference)

            # Reduce set of pipeline parameters to those referenced by pipeline tasks
            for parameter in pipeline.parameters:
                if parameter.name not in referenced_parameter_names:
                    pipeline_parameters.remove(parameter)

        # render the Kubeflow Pipelines Python DSL template
        pipeline_dsl = template.render(
            elyra_version=__version__,
            pipeline_name=pipeline_name,
            pipeline_description=pipeline.description,
            pipeline_parameters=pipeline_parameters,
            workflow_tasks=workflow_tasks,
            component_definitions=unique_component_definitions,
            workflow_engine=workflow_engine.value,
        )

        # Prettify generated Python DSL
        # Defer the import to postpone logger messages: https://github.com/psf/black/issues/2058
        import black

        try:
            pipeline_dsl = black.format_str(fix_code(pipeline_dsl), mode=black.FileMode())
        except Exception:
            # if an error was encountered log the generated DSL for troubleshooting
            self.log.error("Error post-processing generated Python DSL:")
            self.log.error(pipeline_dsl)
            raise

        return pipeline_dsl

    def _compile_pipeline_dsl(
        self, dsl: str, workflow_engine: WorkflowEngineType, output_file: str, pipeline_conf: PipelineConf
    ) -> None:
        """
        Compile Python DSL using the compiler for the specified workflow_engine.

        :param dsl: the Python DSL to be compiled
        :type dsl: str
        :param workflow_engine: Compiler to be used
        :type workflow_engine: str
        :param output_file: output file name
        :type output_file: str
        :param pipeline_conf: Pipeline configuration to apply
        :type pipeline_conf: PipelineConf
        :raises RuntimeError: raised when a fatal error is encountered
        """

        with tempfile.TemporaryDirectory() as temp_dir:
            module_name = "generated_dsl"
            try:
                # Add temporary directory to Python module search path.
                sys.path.insert(0, temp_dir)
                # Save DSL in temporary file so we can import it as a module.
                dsl_file = Path(temp_dir) / f"{module_name}.py"
                with open(dsl_file, "w") as dsl_output:
                    dsl_output.write(dsl)
                # Load DSL by importing the "generated_dsl" module.
                mod = importlib.import_module(module_name)
                # If this module was previously imported it won't reflect
                # changes that might be in the DSL we are about to compile.
                # Force a module re-load to pick up any changes.
                mod = importlib.reload(mod)
                # Obtain handle to pipeline function, which is named
                # in the generated Python DSL "generated_pipeline"
                pipeline_function = getattr(mod, "generated_pipeline")
                # compile the DSL
                kfp_argo_compiler.Compiler().compile(pipeline_function, output_file)
            except Exception as ex:
                raise RuntimeError(
                    f"Failed to compile pipeline with workflow_engine '{workflow_engine.value}' to '{output_file}'"
                ) from ex
            finally:
                # remove temporary directory from Python module search path
                del sys.path[0]
                # remove module entry; it's no longer needed now that it was
                # processed by the Kubeflow Pipelines compiler
                sys.modules.pop(module_name, None)

    def _generate_workflow_tasks(
        self,
        pipeline: Pipeline,
        pipeline_name: str,
        workflow_engine: WorkflowEngineType,
        pipeline_version: str = "",
        experiment_name: str = "",
        pipeline_instance_id: str = None,
        export: bool = False,
    ) -> Dict[str, Dict]:
        """
        Produce the workflow tasks that implement the pipeline nodes. The output is
        a dictionary containing task ids as keys and task definitions as values.
        """

        pipeline_instance_id = pipeline_instance_id or pipeline_name

        self.log_pipeline_info(
            pipeline_name,
            "Processing pipeline",
        )
        t0_all = time.time()

        # Sort operations based on dependency graph (topological order)
        sorted_operations = PipelineProcessor._sort_operations(pipeline.operations)

        if any(operation.is_generic for operation in sorted_operations):
            # The pipeline contains atleast one node that is implemented
            # using a generic component: collect and verify relevant information
            runtime_configuration = self._get_metadata_configuration(
                schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID, name=pipeline.runtime_config
            )
            # - verify that cloud storage can be accessed
            self._verify_cos_connectivity(runtime_configuration)
            # - collect runtime configuration information
            cos_username = runtime_configuration.metadata.get("cos_username")
            cos_password = runtime_configuration.metadata.get("cos_password")
            cos_secret = runtime_configuration.metadata.get("cos_secret")
            cos_endpoint = runtime_configuration.metadata["cos_endpoint"]
            cos_bucket = runtime_configuration.metadata.get("cos_bucket")
            artifact_object_prefix = join_paths(
                pipeline.pipeline_properties.get(pipeline_constants.COS_OBJECT_PREFIX), pipeline_instance_id
            )
            # - load the generic component definition template
            template_env = Environment(loader=PackageLoader("elyra", "templates/kubeflow/v2"))
            generic_component_template = template_env.get_template("generic_component_definition_template.jinja2")
            # Add filter that escapes the " character in strings
            template_env.filters["string_delimiter_safe"] = lambda string: re.sub('"', '\\\\\\\\"', string)
            # Determine whether we are executing in a CRI-O runtime environment
            is_crio_runtime = os.getenv("CRIO_RUNTIME", "False").lower() == "true"

        # All previous operation outputs should be propagated throughout the pipeline.
        # In order to process this recursively, the current operation's inputs should be combined
        # from its parent's inputs (which, themselves are derived from the outputs of their parent)
        # and its parent's outputs.

        PipelineProcessor._propagate_operation_inputs_outputs(pipeline, sorted_operations)

        # Scrub all node labels of invalid characters
        for operation in sorted_operations:
            operation.name = re.sub("-+", "-", re.sub("[^-_0-9A-Za-z ]+", "-", operation.name)).lstrip("-").rstrip("-")

        # Generate unique names for all operations
        unique_names = {}
        for operation in sorted_operations:
            # Ensure operation name is unique
            new_name = operation.name
            while new_name in unique_names:
                new_name = f"{operation.name}_{unique_names[operation.name]}"
                unique_names[operation.name] += 1
            operation.name = new_name
            unique_names[operation.name] = 1

        # Create workflow task list that is used as input for the DSL code generator
        # from the sorted list of pipeline.pipeline.Operations
        workflow_tasks = {}
        for operation in sorted_operations:
            # Create workflow task, which Jinja2 uses to generate the task specific
            # source code.
            workflow_task = {
                "id": operation.id,
                "escaped_task_id": re.sub(r"[" + re.escape(string.punctuation) + "\\s]", "_", operation.id),
                "name": operation.name,
                "doc": operation.doc,
                "upstream_workflow_task_ids": operation.parent_operation_ids or [],
                "task_inputs": {},  # as defined in the component specification
                "task_outputs": {},  # as defined in the component specification
                "task_modifiers": {},  # attached volumes, resources, env variables, metadata, etc
            }

            # Add Elyra-owned properties (data volume mounts, kubernetes labels, etc)
            # to the task_modifiers property.
            for value in operation.elyra_props.values():
                if isinstance(value, (ElyraProperty, ElyraPropertyList)):
                    value.add_to_execution_object(
                        runtime_processor=self, execution_object=workflow_task["task_modifiers"]
                    )

            if operation.is_generic:
                # The task is implemented using a generic component
                workflow_task["uses_custom_component"] = False

                # Set parameters specified for this task and add each as a task input
                task_parameters = [param for param in pipeline.parameters if param.name in operation.parameters]
                workflow_task["task_inputs"] = {
                    param.name: {"pipeline_parameter_reference": param.name} for param in task_parameters
                }

                component_definition = generic_component_template.render(
                    container_image=operation.runtime_image,
                    task_parameters=task_parameters,
                    command_args=self._compose_container_command_args(
                        pipeline_name=pipeline_name,
                        cos_endpoint=cos_endpoint,
                        cos_bucket=cos_bucket,
                        cos_directory=artifact_object_prefix,
                        cos_dependencies_archive=self._get_dependency_archive_name(operation),
                        filename=operation.filename,
                        cos_inputs=operation.inputs,
                        cos_outputs=operation.outputs,
                        task_parameters=task_parameters,
                        is_crio_runtime=is_crio_runtime,
                    ),
                )
                workflow_task["component_definition"] = component_definition
                workflow_task["component_definition_hash"] = hashlib.sha256(component_definition.encode()).hexdigest()

                # attach environment variables
                workflow_task["task_modifiers"]["env_variables"] = self._collect_envs(
                    operation, cos_secret=cos_secret, cos_username=cos_username, cos_password=cos_password
                )

                # hack only: since we don't use the ContainerOp constructor anymore
                # we cannot use the file_outputs parameter to provide the information
                # https://www.kubeflow.org/docs/components/pipelines/v1/sdk/output-viewer/
                workflow_task["task_modifiers"]["special_output_files"] = {
                    "mlpipeline_ui_metadata": (Path(self.WCD) / "mlpipeline-ui-metadata.json").as_posix(),
                    "mlpipeline_metrics": (Path(self.WCD) / "mlpipeline-metrics.json").as_posix(),
                }

                # apply object storage Kubernetes secret, if one was provided
                if cos_secret and not export:
                    workflow_task["task_modifiers"]["object_storage_secret"] = cos_secret

                # apply container image pull policy, if one was specified
                for image_instance in self._get_metadata_configuration(RuntimeImages.RUNTIME_IMAGES_SCHEMASPACE_ID):
                    if image_instance.metadata["image_name"] == operation.runtime_image and image_instance.metadata.get(
                        "pull_policy"
                    ):
                        workflow_task["task_modifiers"]["image_pull_policy"] = image_instance.metadata["pull_policy"]
                        break

                # set resource constraints
                workflow_task["task_modifiers"]["cpu_request"] = operation.cpu
                workflow_task["task_modifiers"]["mem_request"] = {
                    "size": operation.memory,
                    "units": "G",
                }
                workflow_task["task_modifiers"]["cpu_limit"] = operation.cpu_limit
                workflow_task["task_modifiers"]["memory_limit"] = {
                    "size": operation.memory_limit,
                    "units": "G",
                }
                gpu_vendor = "nvidia.com/gpu"
                if operation.gpu_vendor:
                    gpu_vendor = operation.gpu_vendor
                workflow_task["task_modifiers"]["gpu_limit"] = {"size": operation.gpu, "vendor": gpu_vendor}

                if is_crio_runtime:
                    # Attach empty dir volume
                    workflow_task["task_modifiers"]["crio_runtime"] = {
                        "emptydir_volume_name": CRIO_VOL_DEF_NAME,
                        "emptydir_volume_size": CRIO_VOL_DEF_SIZE,
                        "emptydir_volume_medium": CRIO_VOL_DEF_MEDIUM,
                        "emptydir_mount_path": CRIO_VOL_MOUNT_PATH,
                    }
                    # Set Python module search path
                    workflow_task["task_modifiers"]["env_variables"]["PYTHONPATH"] = CRIO_VOL_PYTHON_PATH

                # Attach identifying metadata
                if workflow_task["task_modifiers"].get("pod_labels") is None:
                    workflow_task["task_modifiers"]["pod_labels"] = {}
                # Node type (a static type for this op)
                workflow_task["task_modifiers"]["pod_labels"]["elyra/node-type"] = sanitize_label_value(
                    "notebook-script"
                )
                # Pipeline name
                workflow_task["task_modifiers"]["pod_labels"]["elyra/pipeline-name"] = sanitize_label_value(
                    pipeline_name
                )
                # Pipeline version
                workflow_task["task_modifiers"]["pod_labels"]["elyra/pipeline-version"] = sanitize_label_value(
                    pipeline_version
                )
                # Experiment name
                workflow_task["task_modifiers"]["pod_labels"]["elyra/experiment-name"] = sanitize_label_value(
                    experiment_name
                )
                # Pipeline node name
                workflow_task["task_modifiers"]["pod_labels"]["elyra/node-name"] = sanitize_label_value(operation.name)

                # Add non-identifying metadata
                if workflow_task["task_modifiers"].get("pod_annotations") is None:
                    workflow_task["task_modifiers"]["pod_annotations"] = {}
                # Pipeline node file
                workflow_task["task_modifiers"]["pod_annotations"]["elyra/node-file-name"] = operation.filename

                # Identify the pipeline source, which can be a pipeline file (mypipeline.pipeline), a Python
                # script or notebook that was submitted
                if pipeline.source is not None:
                    workflow_task["task_modifiers"]["pod_annotations"]["elyra/pipeline-source"] = pipeline.source

                # Generate unique ELYRA_RUN_NAME value, which gets exposed as an environment
                # variable
                if workflow_engine == WorkflowEngineType.TEKTON:
                    # Value is derived from an existing annotation; use dummy value
                    workflow_task["task_modifiers"]["set_run_name"] = "dummy value"
                else:
                    # Use Kubeflow Pipelines provided RUN_ID_PLACEHOLDER as run name
                    workflow_task["task_modifiers"]["set_run_name"] = RUN_ID_PLACEHOLDER

                # Upload dependencies to cloud storage
                self._upload_dependencies_to_object_store(
                    runtime_configuration, pipeline_name, operation, prefix=artifact_object_prefix
                )

            else:
                # ----------------------------------------
                # The task is implemented using a custom component
                workflow_task["uses_custom_component"] = True

                # Retrieve component from cache
                component = ComponentCache.instance().get_component(self._type, operation.classifier)

                workflow_task["component_definition"] = component.definition
                workflow_task["component_definition_hash"] = hashlib.sha256(component.definition.encode()).hexdigest()

                # Identify task inputs and outputs using the component spec
                # If no data type was specified, string is assumed
                factory_function = components.load_component_from_text(component.definition)
                for input in factory_function.component_spec.inputs or []:
                    sanitized_input_name = self._sanitize_param_name(input.name)
                    workflow_task["task_inputs"][sanitized_input_name] = {
                        "value": None,
                        "task_output_reference": None,
                        "pipeline_parameter_reference": None,
                        "data_type": (input.type or "string").lower(),
                    }
                    # Determine whether the value needs to be rendered in quotes
                    # in the generated DSL code. For example "my name" (string), and 34 (integer).
                    workflow_task["task_inputs"][sanitized_input_name]["requires_quoted_rendering"] = workflow_task[
                        "task_inputs"
                    ][sanitized_input_name]["data_type"] not in [
                        "integer",
                        "float",
                        "bool",
                    ]

                for output in factory_function.component_spec.outputs or []:
                    workflow_task["task_outputs"][self._sanitize_param_name(output.name)] = {
                        "data_type": output.type,
                    }

                # Iterate over component properties and assign values to
                # task inputs and task add-ons
                for component_property in component.properties:
                    self.log.debug(
                        f"Processing component property '{component_property.name}' "
                        f"of type '{component_property.json_data_type}'"
                    )

                    if component_property.allowed_input_types == [None]:
                        # The property does not support inputs. Ignore
                        continue

                    sanitized_component_property_id = self._sanitize_param_name(component_property.ref)
                    if sanitized_component_property_id in workflow_task["task_inputs"]:
                        reference = workflow_task["task_inputs"][sanitized_component_property_id]
                    else:
                        workflow_task["task_modifiers"][sanitized_component_property_id] = {}
                        reference = workflow_task["task_modifiers"][sanitized_component_property_id]

                    # Get corresponding property's value from parsed pipeline
                    property_value_dict = operation.component_props.get(component_property.ref)
                    data_entry_type = property_value_dict.get("widget", None)  # one of: inputpath, file, raw data type
                    property_value = property_value_dict.get("value", None)
                    if data_entry_type == "inputpath":
                        # task input is the output of an upstream task
                        output_node_id = property_value["value"]  # parent node id
                        output_node_property_key = property_value["option"].replace("output_", "")  # parent property
                        reference["task_output_reference"] = {
                            "task_id": re.sub(r"[" + re.escape(string.punctuation) + "\\s]", "_", output_node_id),
                            "output_id": self._sanitize_param_name(output_node_property_key),
                        }
                    elif data_entry_type == "parameter":
                        # task input is the name of a pipeline parameter
                        param_name = property_value
                        if param_name is None or param_name not in pipeline.parameters.to_dict():
                            # Parameter name not found in list, fall back to using the raw default value
                            reference["value"] = component_property.value
                        else:
                            # Set pipeline parameter reference for this task
                            reference["pipeline_parameter_reference"] = param_name

                    else:
                        # task input is a raw value, either from file contents or entered manually
                        if data_entry_type == "file" and property_value:
                            # Read value from the specified file
                            absolute_path = get_absolute_path(self.root_dir, property_value)
                            with open(absolute_path, "r") as f:
                                property_value = f.read() if os.path.getsize(absolute_path) else None

                        # If the value is not found, assign it the default value assigned in parser
                        if property_value is None:
                            property_value = component_property.value

                        # Process the value according to its type, if necessary
                        if component_property.json_data_type == "object":
                            reference["value"] = self._process_dictionary_value(property_value)
                        elif component_property.json_data_type == "array":
                            reference["value"] = self._process_list_value(property_value)
                        else:
                            reference["value"] = property_value

            self.log.debug(f"Completed processing of task '{workflow_task['name']}':")
            self.log.debug(json.dumps(workflow_task, sort_keys=False, indent=4))

            # append task to task list
            workflow_tasks[workflow_task["id"]] = workflow_task

        # end of processing
        self.log_pipeline_info(pipeline_name, "Pipeline processed", duration=(time.time() - t0_all))
        return workflow_tasks

    def _generate_pipeline_conf(self, pipeline: Pipeline) -> PipelineConf:
        """
        Returns a KFP pipeline configuration for this pipeline, which can be empty.

        :return: https://kubeflow-pipelines.readthedocs.io/en/latest/source/kfp.dsl.html#kfp.dsl.PipelineConf
        :rtype: kfp.dsl import PipelineConf
        """

        self.log.debug("Generating pipeline configuration ...")
        pipeline_conf = PipelineConf()

        #
        # Gather input for container image pull secrets in support of private container image registries
        # https://kubeflow-pipelines.readthedocs.io/en/latest/source/kfp.dsl.html#kfp.dsl.PipelineConf.set_image_pull_secrets
        #
        # Retrieve all runtime image configurations
        runtime_image_configurations = self._get_metadata_configuration(RuntimeImages.RUNTIME_IMAGES_SCHEMASPACE_ID)
        # For each generic pipeline operation determine wether its runtime image
        # is protected by a pull secret
        container_image_pull_secret_names = []
        for operation in pipeline.operations.values():
            if operation.is_generic:
                for image_instance in runtime_image_configurations:
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

    def _compose_container_command_args(
        self,
        pipeline_name: str,
        cos_endpoint: str,
        cos_bucket: str,
        cos_directory: str,
        cos_dependencies_archive: str,
        filename: str,
        cos_inputs: Optional[List[str]] = [],
        cos_outputs: Optional[List[str]] = [],
        task_parameters: Optional[List[PipelineParameter]] = None,
        is_crio_runtime: bool = False,
    ) -> List[str]:
        """
        Compose the container command arguments for a generic component, taking into
        account whether the container will run in a CRI-O environment.
        """
        elyra_github_org = os.getenv("ELYRA_GITHUB_ORG", "elyra-ai")
        elyra_github_branch = os.getenv("ELYRA_GITHUB_BRANCH", "main" if "dev" in __version__ else "v" + __version__)
        elyra_bootstrap_script_url = os.getenv(
            "ELYRA_BOOTSTRAP_SCRIPT_URL",
            f"https://raw.githubusercontent.com/{elyra_github_org}/elyra/{elyra_github_branch}/elyra/kfp/bootstrapper.py",  # noqa E501
        )
        elyra_requirements_url = os.getenv(
            "ELYRA_REQUIREMENTS_URL",
            f"https://raw.githubusercontent.com/{elyra_github_org}/"
            f"elyra/{elyra_github_branch}/etc/generic/requirements-elyra.txt",
        )

        if is_crio_runtime:
            container_work_dir = CRIO_VOL_WORKDIR_PATH
            container_python_path = CRIO_VOL_PYTHON_PATH
            python_pip_config_url = os.getenv(
                "ELYRA_PIP_CONFIG_URL",
                f"https://raw.githubusercontent.com/{elyra_github_org}/elyra/{elyra_github_branch}/etc/kfp/pip.conf",
            )
            python_user_lib_path_target = f"--target={CRIO_VOL_PYTHON_PATH}"
        else:
            container_work_dir = "./jupyter-work-dir"
            python_user_lib_path_target = ""

        common_curl_options = "--fail -H 'Cache-Control: no-cache'"

        command_args = [
            f"mkdir -p {container_work_dir} && cd {container_work_dir}",
            f"echo 'Downloading {elyra_bootstrap_script_url}' && "
            f"curl {common_curl_options} -L {elyra_bootstrap_script_url} --output bootstrapper.py",
            f"echo 'Downloading {elyra_requirements_url}' && "
            f"curl {common_curl_options} -L {elyra_requirements_url} --output requirements-elyra.txt",
        ]

        if is_crio_runtime:
            command_args.append(
                f"mkdir {container_python_path} && cd {container_python_path} && "
                f"echo 'Downloading {python_pip_config_url}' && "
                f"curl {common_curl_options} -L {python_pip_config_url} --output pip.conf && cd .. && "
            )

        bootstrapper_command = [
            f"python3 -m pip install {python_user_lib_path_target} packaging && "
            "python3 -m pip freeze > requirements-current.txt && "
            "python3 bootstrapper.py "
            f"--pipeline-name '{pipeline_name}' "
            f"--cos-endpoint '{cos_endpoint}' "
            f"--cos-bucket '{cos_bucket}' "
            f"--cos-directory '{cos_directory}' "
            f"--cos-dependencies-archive '{cos_dependencies_archive}' "
            f"--file '{filename}' "
        ]

        def list_to_string(item_list: List[str]) -> str:
            """
            Utility function that converts a list of strings to a string
            """
            # Inputs and Outputs separator character.  If updated,
            # same-named variable in bootstrapper.py must be updated!
            INOUT_SEPARATOR = ";"
            for item in item_list:
                if INOUT_SEPARATOR in item:
                    raise ValueError(f"Illegal character ({INOUT_SEPARATOR}) found in list item '{item}'.")
            return INOUT_SEPARATOR.join(item_list)

        # If upstream nodes declared file outputs they need to
        # be downloaded from object storage by the bootstrapper
        if len(cos_inputs) > 0:
            inputs_str = list_to_string(cos_inputs)
            bootstrapper_command.append(f"--inputs '{inputs_str}' ")

        # If this node produces file outputs they need to be uploaded
        # to object storage by the bootstrapper
        if len(cos_outputs) > 0:
            outputs_str = list_to_string(cos_outputs)
            bootstrapper_command.append(f"--outputs '{outputs_str}' ")

        if is_crio_runtime:
            bootstrapper_command.append(f"--user-volume-path '{CRIO_VOL_PYTHON_PATH}' ")

        # Set parameters as env vars; this must be done here rather than adding an
        # env var to the task object because the parameter must be customizable
        if task_parameters:
            parameter_str = list_to_string([f"{param.name}=${param.name}" for param in task_parameters])
            bootstrapper_command.append(
                f"--pipeline-parameters '{parameter_str}' --parameter-pass-method '{self.parameter_pass_method}' "
            )

        command_args.append("".join(bootstrapper_command))

        return command_args

    @staticmethod
    def _sanitize_param_name(name: str) -> str:
        """
        Sanitize a component property or pipeline parameter name.

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

    def add_disable_node_caching(self, instance: DisableNodeCaching, execution_object: Any, **kwargs) -> None:
        """Add DisableNodeCaching info to the execution object"""
        # Force re-execution of the operation by setting staleness to zero days
        # https://www.kubeflow.org/docs/components/pipelines/overview/caching/#managing-caching-staleness
        if instance.selection:
            execution_object["disable_node_caching"] = True
        else:
            execution_object["disable_node_caching"] = False

    def add_custom_shared_memory_size(self, instance: CustomSharedMemorySize, execution_object: Any, **kwargs) -> None:
        """Add CustomSharedMemorySize info to the execution object"""
        if not instance.size:
            # no custom size was specified; ignore
            return
        execution_object["kubernetes_shared_mem_size"] = {"size": instance.size, "units": instance.units}

    def add_kubernetes_secret(self, instance: KubernetesSecret, execution_object: Any, **kwargs) -> None:
        """Add KubernetesSecret instance to the execution object"""
        if "kubernetes_secrets" not in execution_object:
            execution_object["kubernetes_secrets"] = {}
        execution_object["kubernetes_secrets"][instance.env_var] = {"name": instance.name, "key": instance.key}

    def add_mounted_volume(self, instance: VolumeMount, execution_object: Any, **kwargs) -> None:
        """Add VolumeMount instance to the execution object"""
        if "kubernetes_volumes" not in execution_object:
            execution_object["kubernetes_volumes"] = {}
        execution_object["kubernetes_volumes"][instance.path] = {
            "pvc_name": instance.pvc_name,
            "sub_path": instance.sub_path,
            "read_only": instance.read_only,
        }

    def add_kubernetes_pod_annotation(self, instance: KubernetesAnnotation, execution_object: Any, **kwargs) -> None:
        """Add KubernetesAnnotation instance to the execution object"""
        if "pod_annotations" not in execution_object:
            execution_object["pod_annotations"] = {}
        execution_object["pod_annotations"][instance.key] = instance.value or ""

    def add_kubernetes_pod_label(self, instance: KubernetesLabel, execution_object: Any, **kwargs) -> None:
        """Add KubernetesLabel instance to the execution object"""
        if "pod_labels" not in execution_object:
            execution_object["pod_labels"] = {}
        execution_object["pod_labels"][instance.key] = instance.value or ""

    def add_kubernetes_toleration(self, instance: KubernetesToleration, execution_object: Any, **kwargs) -> None:
        """Add KubernetesToleration instance to the execution object"""
        if "kubernetes_tolerations" not in execution_object:
            execution_object["kubernetes_tolerations"] = {}
        toleration_hash = hashlib.sha256(
            f"{instance.key}::{instance.operator}::{instance.value}::{instance.effect}".encode()
        ).hexdigest()
        execution_object["kubernetes_tolerations"][toleration_hash] = {
            "key": instance.key,
            "operator": instance.operator,
            "value": instance.value,
            "effect": instance.effect,
        }

    @property
    def supported_properties(self) -> Set[str]:
        """A list of Elyra-owned properties supported by this runtime processor."""
        return {
            pipeline_constants.ENV_VARIABLES,
            pipeline_constants.KUBERNETES_SECRETS,
            pipeline_constants.MOUNTED_VOLUMES,
            pipeline_constants.KUBERNETES_POD_ANNOTATIONS,
            pipeline_constants.KUBERNETES_POD_LABELS,
            pipeline_constants.KUBERNETES_TOLERATIONS,
            pipeline_constants.DISABLE_NODE_CACHING,
            pipeline_constants.KUBERNETES_SHARED_MEM_SIZE,
        }

    @property
    def pipeline_parameter_class(self) -> Optional[type]:
        """KfpPipelineProcessor supports KfpPipelineParameter objects."""
        return KfpPipelineParameter


class KfpPipelineProcessorResponse(RuntimePipelineProcessorResponse):
    _type = RuntimeProcessorType.KUBEFLOW_PIPELINES
    _name = "kfp"

    def __init__(self, run_id, run_url, object_storage_url, object_storage_path):
        super().__init__(run_url, object_storage_url, object_storage_path)
        self.run_id = run_id

    def to_json(self):
        response = super().to_json()
        response["run_id"] = self.run_id
        return response
