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
import autopep8
import kfp
import kfp_tekton
import os
import tempfile
import time
import requests

from datetime import datetime
from elyra._version import __version__
from elyra.metadata import MetadataManager
from elyra.pipeline import PipelineProcessor, PipelineProcessorResponse
from elyra.util.archive import create_temp_archive
from elyra.util.path import get_absolute_path
from elyra.util.cos import CosClient
from jinja2 import Environment, PackageLoader
from kfp_notebook.pipeline import NotebookOp
from urllib3.exceptions import LocationValueError
from urllib3.exceptions import MaxRetryError


class KfpPipelineProcessor(PipelineProcessor):
    _type = 'kfp'

    # Provide users with the ability to identify a writable directory in the
    # running container where the notebook | script is executed. The location
    # must exist and be known before the container is started.
    # Defaults to `/tmp`
    WCD = os.getenv('ELYRA_WRITABLE_CONTAINER_DIR', '/tmp').strip().rstrip('/')

    @property
    def type(self):
        return self._type

    def process(self, pipeline):
        t0_all = time.time()
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = f'{pipeline.name}-{timestamp}'

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint']
        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_bucket = runtime_configuration.metadata['cos_bucket']

        user_namespace = runtime_configuration.metadata.get('user_namespace')

        # TODO: try to encapsulate the info below
        api_username = runtime_configuration.metadata.get('api_username')
        api_password = runtime_configuration.metadata.get('api_password')

        self.log_pipeline_info(pipeline_name, "submitting pipeline")
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_path = os.path.join(temp_dir, f'{pipeline_name}.tar.gz')

            self.log.debug("Creating temp directory %s", temp_dir)

            engine = runtime_configuration.metadata.get('engine')
            # Compile the new pipeline
            try:
                pipeline_function = lambda: self._cc_pipeline(pipeline, pipeline_name)  # nopep8 E731
                if 'Tekton' == engine:
                    kfp_tekton.compiler.TektonCompiler().compile(pipeline_function, pipeline_path)
                else:
                    kfp.compiler.Compiler().compile(pipeline_function, pipeline_path)
            except Exception as ex:
                raise RuntimeError('Error compiling pipeline {} for engine {} at {}'.
                                   format(pipeline_name, engine, pipeline_path), str(ex)) from ex

            self.log.debug("Kubeflow Pipeline was created in %s", pipeline_path)

            # Upload the compiled pipeline, create an experiment and run

            session_cookie = None

            if api_username and api_password:
                endpoint = api_endpoint.replace('/pipeline', '')
                session_cookie = self._get_user_auth_session_cookie(endpoint,
                                                                    api_username,
                                                                    api_password)

            client = kfp_tekton.TektonClient(host=api_endpoint, cookies=session_cookie)

            try:
                description = f"Created with Elyra {__version__} pipeline editor using '{pipeline.name}.pipeline'."
                t0 = time.time()
                kfp_pipeline = \
                    client.upload_pipeline(pipeline_path,
                                           pipeline_name,
                                           description)
                self.log_pipeline_info(pipeline_name, 'pipeline uploaded', duration=(time.time() - t0))
            except MaxRetryError as ex:
                raise RuntimeError('Error connecting to pipeline server {}'.format(api_endpoint)) from ex

            except LocationValueError as lve:
                if api_username:
                    raise ValueError("Failure occurred uploading pipeline, check your credentials") from lve
                else:
                    raise lve

            experiment = client.create_experiment(name=pipeline_name,
                                                  namespace=user_namespace)

            run = client.run_pipeline(experiment_id=experiment.id,
                                      job_name=timestamp,
                                      pipeline_id=kfp_pipeline.id)

            self.log_pipeline_info(pipeline_name,
                                   f"pipeline submitted: {api_endpoint}/#/runs/details/{run.id}",
                                   duration=(time.time() - t0_all))

            return PipelineProcessorResponse(
                run_url=f'{api_endpoint}/#/runs/details/{run.id}',
                object_storage_url=f'{cos_endpoint}',
                object_storage_path=f'/{cos_bucket}/{pipeline_name}',
            )

        return None

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        if pipeline_export_format not in ["yaml", "py"]:
            raise ValueError("Pipeline export format {} not recognized.".format(pipeline_export_format))

        t0_all = time.time()
        pipeline_name = pipeline.name

        # Since pipeline_export_path may be relative to the notebook directory, ensure
        # we're using its absolute form.
        absolute_pipeline_export_path = get_absolute_path(self.root_dir, pipeline_export_path)

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint']
        engine = runtime_configuration.metadata.get('engine')

        if os.path.exists(absolute_pipeline_export_path) and not overwrite:
            raise ValueError("File " + absolute_pipeline_export_path + " already exists.")

        self.log_pipeline_info(pipeline_name, f"exporting pipeline as a .{pipeline_export_format} file")
        if pipeline_export_format != "py":
            try:
                pipeline_function = lambda: self._cc_pipeline(pipeline, pipeline_name)  # nopep8

                if 'Tekton' == engine:
                    self.log.info("Compiling pipeline for Tekton engine")
                    kfp_tekton.compiler.TektonCompiler().compile(pipeline_function, absolute_pipeline_export_path)
                else:
                    self.log.info("Compiling pipeline for Argo engine")
                    kfp.compiler.Compiler().compile(pipeline_function, absolute_pipeline_export_path)
            except Exception as ex:
                raise RuntimeError('Error compiling pipeline {} for export at {}'.
                                   format(pipeline_name, absolute_pipeline_export_path), str(ex)) from ex
        else:
            # Load template from installed elyra package
            t0 = time.time()
            loader = PackageLoader('elyra', 'templates')
            template_env = Environment(loader=loader, trim_blocks=True)

            template_env.filters['to_basename'] = lambda path: os.path.basename(path)

            template = template_env.get_template('kfp_template.jinja2')

            defined_pipeline = self._cc_pipeline(pipeline, pipeline_name)

            description = f'Created with Elyra {__version__} pipeline editor using {pipeline.name}.pipeline.'

            for key, operation in defined_pipeline.items():
                self.log.debug("component :\n "
                               "container op name : %s \n "
                               "inputs : %s \n "
                               "outputs : %s \n ",
                               operation.name,
                               operation.inputs,
                               operation.outputs)

            python_output = template.render(operations_list=defined_pipeline,
                                            pipeline_name=pipeline_name,
                                            engine=engine,
                                            api_endpoint=api_endpoint,
                                            pipeline_description=description,
                                            writable_container_dir=self.WCD)

            # Write to python file and fix formatting
            with open(absolute_pipeline_export_path, "w") as fh:
                fh.write(autopep8.fix_code(python_output))

            self.log_pipeline_info(pipeline_name, "pipeline rendered", duration=(time.time() - t0))

        self.log_pipeline_info(pipeline_name,
                               f"pipeline exported: {pipeline_export_path}",
                               duration=(time.time() - t0_all))

        return pipeline_export_path  # Return the input value, not its absolute form

    def _cc_pipeline(self, pipeline, pipeline_name):

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)

        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        cos_directory = pipeline_name
        cos_bucket = runtime_configuration.metadata['cos_bucket']

        self.log_pipeline_info(pipeline_name,
                               f"processing pipeline dependencies to: {cos_endpoint} "
                               f"bucket: {cos_bucket} folder: {pipeline_name}")
        t0_all = time.time()

        emptydir_volume_size = ''
        container_runtime = bool(os.getenv('CRIO_RUNTIME', 'False').lower() == 'true')

        # Create dictionary that maps component Id to its ContainerOp instance
        notebook_ops = {}

        # All previous operation outputs should be propagated throughout the pipeline.
        # In order to process this recursively, the current operation's inputs should be combined
        # from its parent's inputs (which, themselves are derived from the outputs of their parent)
        # and its parent's outputs.
        for operation in pipeline.operations.values():
            parent_io = []  # gathers inputs & outputs relative to parent
            for parent_operation_id in operation.parent_operations:
                parent_operation = pipeline.operations[parent_operation_id]
                if parent_operation.inputs:
                    parent_io.extend(parent_operation.inputs)
                if parent_operation.outputs:
                    parent_io.extend(parent_operation.outputs)

                if parent_io:
                    operation.inputs = parent_io

        for operation in pipeline.operations.values():

            operation_artifact_archive = self._get_dependency_archive_name(operation)

            self.log.debug("Creating pipeline component :\n {op} archive : {archive}".format(
                           op=operation, archive=operation_artifact_archive))

            if container_runtime:
                # Volume size to create when using CRI-o, NOTE: IBM Cloud minimum is 20Gi
                emptydir_volume_size = '20Gi'

            # Collect env variables
            pipeline_envs = dict()
            pipeline_envs['AWS_ACCESS_KEY_ID'] = cos_username
            pipeline_envs['AWS_SECRET_ACCESS_KEY'] = cos_password
            # Convey pipeline logging enablement to operation
            pipeline_envs['ELYRA_ENABLE_PIPELINE_INFO'] = str(self.enable_pipeline_info)
            # Setting identifies a writable directory in the container image.
            # Only Unix-style path spec is supported.
            pipeline_envs['ELYRA_WRITABLE_CONTAINER_DIR'] = self.WCD

            if operation.env_vars:
                for env_var in operation.env_vars:
                    # Strip any of these special characters from both key and value
                    # Splits on the first occurrence of '='
                    result = [x.strip(' \'\"') for x in env_var.split('=', 1)]
                    # Should be non empty key with a value
                    if len(result) == 2 and result[0] != '':
                        pipeline_envs[result[0]] = result[1]

            # create pipeline operation
            notebook_ops[operation.id] = NotebookOp(name=operation.name,
                                                    notebook=operation.filename,
                                                    cos_endpoint=cos_endpoint,
                                                    cos_bucket=cos_bucket,
                                                    cos_directory=cos_directory,
                                                    cos_dependencies_archive=operation_artifact_archive,
                                                    pipeline_inputs=operation.inputs,
                                                    pipeline_outputs=operation.outputs,
                                                    pipeline_envs=pipeline_envs,
                                                    emptydir_volume_size=emptydir_volume_size,
                                                    cpu_request=operation.cpu,
                                                    mem_request=operation.memory,
                                                    gpu_limit=operation.gpu,
                                                    image=operation.runtime_image,
                                                    file_outputs={
                                                        'mlpipeline-metrics':
                                                            '{}/mlpipeline-metrics.json'
                                                            .format(pipeline_envs['ELYRA_WRITABLE_CONTAINER_DIR']),
                                                        'mlpipeline-ui-metadata':
                                                            '{}/mlpipeline-ui-metadata.json'
                                                            .format(pipeline_envs['ELYRA_WRITABLE_CONTAINER_DIR'])
                                                    })

            self.log_pipeline_info(pipeline_name,
                                   f"processing operation dependencies for id: {operation.id}",
                                   operation_name=operation.name)

            # upload operation dependencies to object storage
            try:
                t0 = time.time()
                dependency_archive_path = self._generate_dependency_archive(operation)
                self.log_pipeline_info(pipeline_name,
                                       f"generated dependency archive: {dependency_archive_path}",
                                       operation_name=operation.name,
                                       duration=(time.time() - t0))

                cos_client = CosClient(config=runtime_configuration)
                t0 = time.time()
                cos_client.upload_file_to_dir(dir=cos_directory,
                                              file_name=operation_artifact_archive,
                                              file_path=dependency_archive_path)
                self.log_pipeline_info(pipeline_name,
                                       f"uploaded dependency archive to: {cos_directory}/{operation_artifact_archive}",
                                       operation_name=operation.name,
                                       duration=(time.time() - t0))

            except FileNotFoundError as ex:
                self.log.error("Dependencies were not found building archive for operation: {}".
                               format(operation.name), exc_info=True)
                raise FileNotFoundError("Node '{}' referenced dependencies that were not found: {}".
                                        format(operation.name, ex))

            except BaseException as ex:
                self.log.error("Error uploading artifacts to object storage for operation: {}".
                               format(operation.name), exc_info=True)
                raise ex from ex

        # Process dependencies after all the operations have been created
        for operation in pipeline.operations.values():
            op = notebook_ops[operation.id]
            for parent_operation_id in operation.parent_operations:
                parent_op = notebook_ops[parent_operation_id]  # Parent Operation
                op.after(parent_op)

        self.log_pipeline_info(pipeline_name, "pipeline dependencies processed", duration=(time.time() - t0_all))

        return notebook_ops

    def _get_dependency_archive_name(self, operation):
        archive_name = os.path.basename(operation.filename)
        (name, ext) = os.path.splitext(archive_name)
        return name + '-' + operation.id + ".tar.gz"

    def _get_dependency_source_dir(self, operation):
        return os.path.join(self.root_dir, os.path.dirname(operation.filename))

    def _generate_dependency_archive(self, operation):
        archive_artifact_name = self._get_dependency_archive_name(operation)
        archive_source_dir = self._get_dependency_source_dir(operation)

        dependencies = [os.path.basename(operation.filename)]
        dependencies.extend(operation.dependencies)

        archive_artifact = create_temp_archive(archive_name=archive_artifact_name,
                                               source_dir=archive_source_dir,
                                               filenames=dependencies,
                                               recursive=operation.include_subdirectories,
                                               require_complete=True)

        return archive_artifact

    def _get_runtime_configuration(self, name):
        """
        Retrieve associated runtime configuration based on processor type
        :return: metadata in json format
        """
        try:
            runtime_configuration = MetadataManager(namespace=MetadataManager.NAMESPACE_RUNTIMES).get(name)
            return runtime_configuration
        except BaseException as err:
            self.log.error('Error retrieving runtime configuration for {}'.format(name), exc_info=True)
            raise RuntimeError('Error retrieving runtime configuration for {}', err) from err

    def _get_user_auth_session_cookie(self, url, username, password):
        get_response = requests.get(url)

        # auth request to kfp server with istio dex look like '/dex/auth/local?req=REQ_VALUE'
        if 'auth' in get_response.url:
            credentials = {'login': username, 'password': password}

            # Authenticate user
            session = requests.Session()
            session.post(get_response.url, data=credentials)
            cookie_auth_key = 'authservice_session'
            cookie_auth_value = session.cookies.get(cookie_auth_key)

            if cookie_auth_value:
                return cookie_auth_key + '=' + cookie_auth_value
