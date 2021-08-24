#
# Copyright 2018-2021 Elyra Authors
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
import ast
from datetime import datetime
import json
import logging
import os
import re
import tempfile
import time
from typing import Dict

import autopep8
from black import FileMode
from black import format_str
from jinja2 import Environment
from jinja2 import PackageLoader
from jupyter_core.paths import ENV_JUPYTER_PATH
from kfp import Client as ArgoClient
from kfp import compiler as kfp_argo_compiler
from kfp import components as components
from kfp.aws import use_aws_secret  # noqa H306
from kfp_server_api.exceptions import ApiException
from kfp_tekton import compiler as kfp_tekton_compiler
from kfp_tekton import TektonClient
import requests
from urllib3.exceptions import LocationValueError
from urllib3.exceptions import MaxRetryError

from elyra._version import __version__
from elyra.kfp.operator import ExecuteFileOp
from elyra.metadata.manager import MetadataManager
from elyra.pipeline.component_parser_kfp import KfpComponentParser
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.processor import PipelineProcessorResponse
from elyra.pipeline.processor import RuntimePipelineProcessor
from elyra.util.path import get_absolute_path
from elyra.util.path import get_expanded_path


class KfpPipelineProcessor(RuntimePipelineProcessor):
    _type = 'kfp'

    # Provide users with the ability to identify a writable directory in the
    # running container where the notebook | script is executed. The location
    # must exist and be known before the container is started.
    # Defaults to `/tmp`
    WCD = os.getenv('ELYRA_WRITABLE_CONTAINER_DIR', '/tmp').strip().rstrip('/')

    @property
    def type(self):
        return self._type

    def __init__(self, root_dir, **kwargs):
        super().__init__(root_dir, component_parser=KfpComponentParser(), **kwargs)

    def process(self, pipeline):
        """Runs a pipeline on Kubeflow Pipelines

        Each time a pipeline is processed, a new version
        is uploaded and run under the same experiment name.
        """

        t0_all = time.time()
        timestamp = datetime.now().strftime("%m%d%H%M%S")

        runtime_configuration = self._get_metadata_configuration(namespace=MetadataManager.NAMESPACE_RUNTIMES,
                                                                 name=pipeline.runtime_config)

        api_endpoint = runtime_configuration.metadata['api_endpoint'].rstrip('/')
        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_bucket = runtime_configuration.metadata['cos_bucket']

        user_namespace = runtime_configuration.metadata.get('user_namespace')

        # TODO: try to encapsulate the info below
        api_username = runtime_configuration.metadata.get('api_username')
        api_password = runtime_configuration.metadata.get('api_password')

        engine = runtime_configuration.metadata.get('engine')

        pipeline_name = pipeline.name
        try:
            # Connect to the Kubeflow server, determine whether it is secured,
            # and if it is try to authenticate with the user-provided credentials
            # (if any were defined in the runtime configuration)

            endpoint = api_endpoint.replace('/pipeline', '')
            auth_info = \
                KfpPipelineProcessor._get_user_auth_session_cookie(endpoint,
                                                                   api_username,
                                                                   api_password)

            self.log.debug(f"Kubeflow authentication info: {auth_info}")

            if auth_info['endpoint_secured'] and \
               auth_info['authservice_session_cookie'] is None:
                # Kubeflow is secured but our attempt to authenticate did
                # not yield the expected results. Log the collected authentication
                # information and abort processing.
                self.log.warning(f"Kubeflow authentication info: {auth_info}")
                raise RuntimeError(f"Error connecting to Kubeflow at '{endpoint}'"
                                   f": Authentication request failed. Check the "
                                   f"Kubeflow Pipelines credentials in runtime "
                                   f"configuration '{pipeline.runtime_config}'.")

            # Create a KFP client
            if 'Tekton' == engine:
                client = TektonClient(host=api_endpoint,
                                      cookies=auth_info['authservice_session_cookie'])
            else:
                client = ArgoClient(host=api_endpoint,
                                    cookies=auth_info['authservice_session_cookie'])

            # Determine whether a pipeline with the provided
            # name already exists
            pipeline_id = client.get_pipeline_id(pipeline_name)
            if pipeline_id is None:
                # The KFP default version name is the pipeline
                # name
                pipeline_version_name = pipeline_name
            else:
                # Append timestamp to generate unique version name
                pipeline_version_name = f'{pipeline_name}-{timestamp}'
            # Establish a 1:1 relationship with an experiment
            # work around https://github.com/kubeflow/pipelines/issues/5172
            experiment_name = pipeline_name.lower()
            # Unique identifier for the pipeline run
            job_name = f'{pipeline_name}-{timestamp}'
            # Unique location on COS where the pipeline run artifacts
            # will be stored
            cos_directory = f'{pipeline_name}-{timestamp}'

        except (requests.exceptions.ConnectionError, MaxRetryError) as ce:
            raise RuntimeError(f"Error connecting to pipeline server {api_endpoint}.  Check the "
                               f"Kubeflow Pipelines connection information in runtime "
                               f"configuration '{pipeline.runtime_config}'.") from ce
        except LocationValueError as lve:
            if api_username:
                raise ValueError(f"Failure occurred uploading pipeline. Check the "
                                 f"Kubeflow Pipelines credentials in runtime "
                                 f"configuration '{pipeline.runtime_config}'.") from lve
            else:
                raise lve

        # Verify that user-entered namespace is valid
        try:
            client.list_experiments(namespace=user_namespace,
                                    page_size=0)
        except ApiException as ae:
            error_msg = f"{ae.reason} ({ae.status})"
            if ae.body:
                error_body = json.loads(ae.body)
                error_msg += f": {error_body['error']}"
            if error_msg[-1] not in ['.', '?', '!']:
                error_msg += '.'

            namespace = "namespace" if not user_namespace else f"namespace {user_namespace}"

            self.log.error(f"Error validating {namespace}: {error_msg}")
            raise RuntimeError(f"Error validating {namespace}: {error_msg} " +
                               "Please validate your runtime configuration details and retry.") from ae

        self.log_pipeline_info(pipeline_name, "submitting pipeline")
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_path = os.path.join(temp_dir, f'{pipeline_name}.tar.gz')

            self.log.debug("Creating temp directory %s", temp_dir)

            # Compile the new pipeline
            try:
                pipeline_function = lambda: self._cc_pipeline(pipeline,  # nopep8 E731
                                                              pipeline_name=pipeline_name,
                                                              pipeline_version=pipeline_version_name,
                                                              experiment_name=experiment_name,
                                                              cos_directory=cos_directory)
                if 'Tekton' == engine:
                    kfp_tekton_compiler.TektonCompiler().compile(pipeline_function, pipeline_path)
                else:
                    kfp_argo_compiler.Compiler().compile(pipeline_function, pipeline_path)
            except Exception as ex:
                if ex.__cause__:
                    raise RuntimeError(str(ex)) from ex
                raise RuntimeError('Error pre-processing pipeline {} for engine {} at {}'.
                                   format(pipeline_name, engine, pipeline_path), str(ex)) from ex

            self.log.debug("Kubeflow Pipeline was created in %s", pipeline_path)

            # Upload the compiled pipeline, create an experiment and run

            try:
                description = f"Created with Elyra {__version__} pipeline editor using '{pipeline.source}'."
                t0 = time.time()

                if pipeline_id is None:
                    # Upload new pipeline. The call returns
                    # a unique pipeline id.
                    kfp_pipeline = \
                        client.upload_pipeline(pipeline_path,
                                               pipeline_name,
                                               description)
                    pipeline_id = kfp_pipeline.id
                    version_id = None
                else:
                    # Upload a pipeline version. The call returns
                    # a unique version id.
                    kfp_pipeline = \
                        client.upload_pipeline_version(pipeline_path,
                                                       pipeline_version_name,
                                                       pipeline_id=pipeline_id)
                    version_id = kfp_pipeline.id

                self.log_pipeline_info(pipeline_name, 'pipeline uploaded', duration=(time.time() - t0))
            except MaxRetryError as ex:
                raise RuntimeError('Error connecting to pipeline server {}'.format(api_endpoint)) from ex

            except LocationValueError as lve:
                if api_username:
                    raise ValueError("Failure occurred uploading pipeline, check your credentials") from lve
                else:
                    raise lve

            # Create a new experiment. If it already exists this is
            # a no-op.
            experiment = client.create_experiment(name=experiment_name,
                                                  namespace=user_namespace)
            self.log_pipeline_info(pipeline_name,
                                   f'Created experiment {experiment_name}',
                                   duration=(time.time() - t0_all))

            # Run the pipeline (or specified pipeline version)
            run = client.run_pipeline(experiment_id=experiment.id,
                                      job_name=job_name,
                                      pipeline_id=pipeline_id,
                                      version_id=version_id)

            self.log_pipeline_info(pipeline_name,
                                   f"pipeline submitted: {api_endpoint}/#/runs/details/{run.id}",
                                   duration=(time.time() - t0_all))

            return KfpPipelineProcessorResponse(
                run_url=f'{api_endpoint}/#/runs/details/{run.id}',
                object_storage_url=f'{cos_endpoint}',
                object_storage_path=f'/{cos_bucket}/{cos_directory}',
            )

        return None

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        if pipeline_export_format not in ["yaml", "py"]:
            raise ValueError("Pipeline export format {} not recognized.".format(pipeline_export_format))

        t0_all = time.time()
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = pipeline.name
        pipeline_version_name = f'{pipeline_name}-{timestamp}'
        # work around https://github.com/kubeflow/pipelines/issues/5172
        experiment_name = pipeline_name.lower()
        # Unique identifier for the pipeline run
        job_name = f'{pipeline_name}-{timestamp}'
        # Unique location on COS where the pipeline run artifacts
        # will be stored
        cos_directory = f'{pipeline_name}-{timestamp}'

        # Since pipeline_export_path may be relative to the notebook directory, ensure
        # we're using its absolute form.
        absolute_pipeline_export_path = get_absolute_path(self.root_dir, pipeline_export_path)

        runtime_configuration = self._get_metadata_configuration(namespace=MetadataManager.NAMESPACE_RUNTIMES,
                                                                 name=pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint'].rstrip('/')
        namespace = runtime_configuration.metadata.get('user_namespace')
        engine = runtime_configuration.metadata.get('engine')
        cos_secret = runtime_configuration.metadata.get('cos_secret')
        kf_secured = runtime_configuration.metadata.get('api_username') is not None and \
            runtime_configuration.metadata.get('api_password') is not None

        if os.path.exists(absolute_pipeline_export_path) and not overwrite:
            raise ValueError("File " + absolute_pipeline_export_path + " already exists.")

        self.log_pipeline_info(pipeline_name, f"exporting pipeline as a .{pipeline_export_format} file")
        if pipeline_export_format != "py":
            # Export pipeline as static configuration file (YAML formatted)
            try:
                # Exported pipeline is not associated with an experiment
                # or a version. The association is established when the
                # pipeline is imported into KFP by the user.
                pipeline_function = lambda: self._cc_pipeline(pipeline,
                                                              pipeline_name,
                                                              cos_directory=cos_directory)  # nopep8
                if 'Tekton' == engine:
                    self.log.info("Compiling pipeline for Tekton engine")
                    kfp_tekton_compiler.TektonCompiler().compile(pipeline_function, absolute_pipeline_export_path)
                else:
                    self.log.info("Compiling pipeline for Argo engine")
                    kfp_argo_compiler.Compiler().compile(pipeline_function, absolute_pipeline_export_path)
            except Exception as ex:
                if ex.__cause__:
                    raise RuntimeError(str(ex)) from ex
                raise RuntimeError('Error pre-processing pipeline {} for export at {}'.
                                   format(pipeline_name, absolute_pipeline_export_path), str(ex)) from ex
        else:
            # Export pipeline as Python DSL
            # Load template from installed elyra package

            loader = PackageLoader('elyra', 'templates/kfp')
            template_env = Environment(loader=loader, trim_blocks=True)

            template_env.filters['to_basename'] = lambda path: os.path.basename(path)

            template = template_env.get_template('kfp_template.jinja2')

            defined_pipeline = self._cc_pipeline(pipeline,
                                                 pipeline_name,
                                                 pipeline_version=pipeline_version_name,
                                                 experiment_name=experiment_name,
                                                 cos_directory=cos_directory,
                                                 export=True)

            description = f'Created with Elyra {__version__} pipeline editor using {pipeline.source}.'

            if self.log.isEnabledFor(logging.DEBUG):
                self.log.debug(f"Exporting pipeline {pipeline_name} with components: \n")
                for key, operation in defined_pipeline.items():
                    self.log.debug("component:\n "
                                   f"operation name : {operation.name} \n "
                                   f"inputs : {operation.inputs} \n "
                                   f"outputs : {operation.outputs} \n ")

            # The exported pipeline is by default associated with
            # an experiment.
            # The user can manually customize the generated code
            # and change the associations as desired.

            python_output = template.render(operations_list=defined_pipeline,
                                            pipeline_name=pipeline_name,
                                            pipeline_version=pipeline_version_name,
                                            experiment_name=experiment_name,
                                            run_name=job_name,
                                            engine=engine,
                                            cos_secret=cos_secret,
                                            namespace=namespace,
                                            api_endpoint=api_endpoint,
                                            pipeline_description=description,
                                            writable_container_dir=self.WCD,
                                            kf_secured=kf_secured)

            # Write to Python file and fix formatting
            with open(absolute_pipeline_export_path, "w") as fh:
                autopep_output = autopep8.fix_code(python_output)
                output_to_file = format_str(autopep_output, mode=FileMode())
                fh.write(output_to_file)

            self.log_pipeline_info(pipeline_name, "pipeline rendered", duration=(time.time() - t0_all))

        self.log_pipeline_info(pipeline_name,
                               f"pipeline exported: {pipeline_export_path}",
                               duration=(time.time() - t0_all))

        return pipeline_export_path  # Return the input value, not its absolute form

    def _collect_envs(self, operation: Operation, **kwargs) -> Dict:
        """
        Amends envs collected from superclass with those pertaining to this subclass

        :return: dictionary containing environment name/value pairs
        """
        envs = super()._collect_envs(operation, **kwargs)
        # Only Unix-style path spec is supported.
        envs['ELYRA_WRITABLE_CONTAINER_DIR'] = self.WCD
        return envs

    def _cc_pipeline(self,
                     pipeline,
                     pipeline_name,
                     pipeline_version='',
                     experiment_name='',
                     cos_directory=None,
                     export=False):

        runtime_configuration = self._get_metadata_configuration(namespace=MetadataManager.NAMESPACE_RUNTIMES,
                                                                 name=pipeline.runtime_config)

        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        cos_secret = runtime_configuration.metadata.get('cos_secret')
        engine = runtime_configuration.metadata['engine']

        if cos_directory is None:
            cos_directory = pipeline_name
        cos_bucket = runtime_configuration.metadata['cos_bucket']

        self.log_pipeline_info(pipeline_name,
                               f"processing pipeline dependencies to: {cos_endpoint} "
                               f"bucket: {cos_bucket} folder: {cos_directory}")
        t0_all = time.time()

        emptydir_volume_size = ''
        container_runtime = bool(os.getenv('CRIO_RUNTIME', 'False').lower() == 'true')

        # Create dictionary that maps component Id to its ContainerOp instance
        target_ops = {}

        # Sort operations based on dependency graph (topological order)
        sorted_operations = PipelineProcessor._sort_operations(pipeline.operations)

        # All previous operation outputs should be propagated throughout the pipeline.
        # In order to process this recursively, the current operation's inputs should be combined
        # from its parent's inputs (which, themselves are derived from the outputs of their parent)
        # and its parent's outputs.

        PipelineProcessor._propagate_operation_inputs_outputs(pipeline, sorted_operations)

        for operation in sorted_operations:

            if container_runtime:
                # Volume size to create when using CRI-o, NOTE: IBM Cloud minimum is 20Gi
                emptydir_volume_size = '20Gi'

            sanitized_operation_name = self._sanitize_operation_name(operation.name)

            # Create pipeline operation
            # If operation is one of the "generic" set of NBs or scripts, construct custom ExecuteFileOp
            if isinstance(operation, GenericOperation):

                # Collect env variables
                pipeline_envs = self._collect_envs(operation,
                                                   cos_secret=cos_secret,
                                                   cos_username=cos_username,
                                                   cos_password=cos_password)

                operation_artifact_archive = self._get_dependency_archive_name(operation)

                self.log.debug("Creating pipeline component:\n {op} archive : {archive}".format(
                               op=operation, archive=operation_artifact_archive))

                target_ops[operation.id] = ExecuteFileOp(name=sanitized_operation_name,
                                                         pipeline_name=pipeline_name,
                                                         experiment_name=experiment_name,
                                                         notebook=operation.filename,
                                                         cos_endpoint=cos_endpoint,
                                                         cos_bucket=cos_bucket,
                                                         cos_directory=cos_directory,
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
                                                             'mlpipeline-metrics':
                                                                 '{}/mlpipeline-metrics.json'
                                                                 .format(pipeline_envs['ELYRA_WRITABLE_CONTAINER_DIR']),  # noqa
                                                             'mlpipeline-ui-metadata':
                                                                 '{}/mlpipeline-ui-metadata.json'
                                                                 .format(pipeline_envs['ELYRA_WRITABLE_CONTAINER_DIR'])  # noqa
                                                         })

                # TODO Can we move all of this to apply to non-standard components as well? Test when servers are up
                if cos_secret and not export:
                    target_ops[operation.id].apply(use_aws_secret(cos_secret))

                image_namespace = self._get_metadata_configuration(namespace=MetadataManager.NAMESPACE_RUNTIME_IMAGES)
                for image_instance in image_namespace:
                    if image_instance.metadata['image_name'] == operation.runtime_image and \
                            image_instance.metadata.get('pull_policy'):
                        target_ops[operation.id].container. \
                            set_image_pull_policy(image_instance.metadata['pull_policy'])

                self.log_pipeline_info(pipeline_name,
                                       f"processing operation dependencies for id: {operation.id}",
                                       operation_name=operation.name)

                self._upload_dependencies_to_object_store(runtime_configuration,
                                                          cos_directory,
                                                          operation)

            # If operation is a "non-standard" component, load it's spec and create operation with factory function
            else:
                # Retrieve component from cache
                component = self._component_registry.get_component(operation.classifier)

                # Change value of variables according to their type. Path variables should include
                # the contents of the specified file and dictionary values must be converted from strings.
                for component_property in component.properties:
                    if component_property.type == "file":
                        # Get corresponding property value from parsed pipeline and convert
                        op_property = operation.component_params.get(component_property.ref)
                        filename = get_absolute_path(get_expanded_path(self.root_dir), op_property)
                        try:
                            with open(filename) as f:
                                operation.component_params[component_property.ref] = f.read()
                        except Exception:
                            # If file can't be found locally, assume a remote file location was entered.
                            # This may cause the pipeline run to fail; the user must debug in this case.
                            pass
                    elif component_property.type in ['dictionary', 'list']:
                        # Get corresponding property value from parsed pipeline and convert
                        op_property = operation.component_params.get(component_property.ref)
                        operation.component_params[component_property.ref] = ast.literal_eval(op_property)

                # Get absolute path of component source
                component_path = component.source
                if component.source_type == "filename":
                    component_path = os.path.join(ENV_JUPYTER_PATH[0], 'components', component_path)

                component_source = {}
                component_source[component.source_type] = component_path

                # Build component task factory
                try:
                    factory_function = components.load_component(**component_source)
                except Exception as e:
                    # TODO Fix error messaging and break exceptions down into categories
                    self.log.error(f"Error loading component spec for {operation.name}: {str(e)}")
                    raise RuntimeError(f"Error loading component spec for {operation.name}.")

                # Add factory function, which returns a ContainerOp task instance, to pipeline operation dict
                try:
                    # Remove inputs and outputs from params dict until support for data exchange is provided
                    operation.component_params_as_dict.pop("inputs")
                    operation.component_params_as_dict.pop("outputs")

                    # Create ContainerOp instance and assign appropriate user-provided name
                    container_op = factory_function(**operation.component_params_as_dict)
                    container_op.set_display_name(operation.name)

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

    @staticmethod
    def _sanitize_operation_name(name: str) -> str:
        """
        In KFP, only letters, numbers, spaces, "_", and "-" are allowed in name.
        :param name: name of the operation
        """
        return re.sub('-+', '-', re.sub('[^-_0-9A-Za-z ]+', '-', name)).lstrip('-').rstrip('-')

    @staticmethod
    def _get_user_auth_session_cookie(url, username=None, password=None) -> dict:
        """
        Determine whether the specified URL is secured by Dex and, if username
        and password were provided, try to obtain a session cookie. Other forms
        of authentication are not supported.

        :param url: Kubeflow server URL, including protocol
        :type url: str
        :param username: Kubeflow user name, defaults to None
        :type username: str, optional
        :param password: Kubeflow user's password, defaults to None
        :type password: str, optional
        :return: authentication information
        :rtype: dict
        """

        # Return data structure
        auth_info = {
            'endpoint': url,                    # KF endpoint URL
            'endpoint_response_url': None,      # KF redirect URL, if applicable
            'endpoint_secured': False,          # True if KF is secured [by dex]
            'authservice_session_cookie': None  # Set if KF is secured & user authenticated
        }

        # Obtain redirect URL
        get_response = requests.get(url)

        auth_info['endpoint_response_url'] = get_response.url

        # If KF redirected to '/dex/auth/local?req=REQ_VALUE'
        # try to authenticate using the provided credentials
        if 'dex/auth' in get_response.url:
            auth_info['endpoint_secured'] = True  # KF is secured

            # Try to authenticate user by sending a request to the
            # Dex redirect URL
            session = requests.Session()
            session.post(get_response.url,
                         data={'login': username,
                               'password': password})
            # Capture authservice_session cookie, if one was returned
            # in the response
            cookie_auth_key = 'authservice_session'
            cookie_auth_value = session.cookies.get(cookie_auth_key)

            if cookie_auth_value:
                auth_info['authservice_session_cookie'] = \
                    f"{cookie_auth_key}={cookie_auth_value}"

        return auth_info


class KfpPipelineProcessorResponse(PipelineProcessorResponse):

    _type = 'kfp'

    def __init__(self, run_url, object_storage_url, object_storage_path):
        super().__init__(run_url, object_storage_url, object_storage_path)

    @property
    def type(self):
        return self._type
