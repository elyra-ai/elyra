#
# Copyright 2018-2020 IBM Corporation
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

import kfp
import os
import tempfile
import autopep8

from datetime import datetime

from elyra.metadata import MetadataManager
from elyra.pipeline import PipelineProcessor
from elyra.util.archive import create_temp_archive
from elyra.util.cos import CosClient
from kubernetes.client.models import V1EnvVar
from notebook.pipeline import NotebookOp
from urllib3.exceptions import MaxRetryError
from jinja2 import Environment, PackageLoader


class KfpPipelineProcessor(PipelineProcessor):
    _type = 'kfp'

    @property
    def type(self):
        return self._type

    def process(self, pipeline):
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = (pipeline.title if pipeline.title else 'pipeline') + '-' + timestamp

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint']

        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_path = temp_dir + '/' + pipeline_name + '.tar.gz'

            self.log.info("Pipeline : %s", pipeline_name)
            self.log.debug("Creating temp directory %s", temp_dir)

            # Compile the new pipeline
            try:
                pipeline_function = lambda: self._cc_pipeline(pipeline, pipeline_name)  # nopep8
                kfp.compiler.Compiler().compile(pipeline_function, pipeline_path)
            except Exception as ex:
                raise RuntimeError('Error compiling pipeline {} at {}'.
                                   format(pipeline_name, pipeline_path), str(ex))

            self.log.info("Kubeflow Pipeline successfully compiled.")
            self.log.debug("Kubeflow Pipeline was created in %s", pipeline_path)

            # Upload the compiled pipeline and create an experiment and run
            client = kfp.Client(host=api_endpoint)
            try:
                kfp_pipeline = client.upload_pipeline(pipeline_path, pipeline_name)
            except MaxRetryError:
                raise RuntimeError('Error connecting to pipeline server {}'.format(api_endpoint))

            self.log.info("Kubeflow Pipeline successfully uploaded to : %s", api_endpoint)

            run = client.run_pipeline(experiment_id=client.create_experiment(pipeline_name).id,
                                      job_name=timestamp,
                                      pipeline_id=kfp_pipeline.id)

            self.log.info("Starting Kubeflow Pipeline Run...")
            return "{}/#/runs/details/{}".format(api_endpoint, run.id)

        return None

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        if pipeline_export_format not in ["yaml", "py"]:
            raise ValueError("Pipeline export format {} not recognized.".format(pipeline_export_format))

        pipeline_name = (pipeline.title if pipeline.title else 'pipeline')

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint']

        if os.path.exists(pipeline_export_path) and not overwrite:
            raise ValueError("File " + pipeline_export_path + " already exists.")

        self.log.info('Creating pipeline definition as a .' + pipeline_export_format + ' file')
        if pipeline_export_format != "py":
            try:
                pipeline_function = lambda: self._cc_pipeline(pipeline, pipeline_name)  # nopep8
                kfp.compiler.Compiler().compile(pipeline_function, pipeline_export_path)
            except Exception as ex:
                raise RuntimeError('Error compiling pipeline {} for export at {}'.
                                   format(pipeline_name, pipeline_export_path), str(ex))
        else:
            # Load template from installed elyra package
            loader = PackageLoader('elyra', 'templates')
            template_env = Environment(loader=loader)

            template = template_env.get_template('kfp_template.jinja2')

            defined_pipeline = self._cc_pipeline(pipeline, pipeline_name)

            python_output = template.render(operations_list=defined_pipeline,
                                            pipeline_name=pipeline_name,
                                            api_endpoint=api_endpoint,
                                            pipeline_description="Elyra Pipeline")

            # Write to python file and fix formatting
            with open(pipeline_export_path, "w") as fh:
                fh.write(autopep8.fix_code(python_output))

        return pipeline_export_path

    def _cc_pipeline(self, pipeline, pipeline_name):

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)

        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        cos_directory = pipeline_name
        bucket_name = runtime_configuration.metadata['cos_bucket']

        # Create dictionary that maps component Id to its ContainerOp instance
        notebook_ops = {}

        # All previous operation outputs should be propagated throughout the pipeline.
        # In order to process this recursively, the current operation's inputs should be combined
        # from its parent's inputs (which, themselves are derived from the outputs of their parent)
        # and its parent's outputs.
        for pipeline_operation in pipeline.operations.values():
            parent_inputs_and_outputs = []
            for dependency_operation_id in pipeline_operation.dependencies:
                parent_operation = pipeline.operations[dependency_operation_id]
                if parent_operation.inputs:
                    parent_inputs_and_outputs.extend(parent_operation.inputs)
                if parent_operation.outputs:
                    parent_inputs_and_outputs.extend(parent_operation.outputs)

                if parent_inputs_and_outputs:
                    pipeline_operation.inputs = parent_inputs_and_outputs

        for operation in pipeline.operations.values():
            operation_artifact_archive = self._get_dependency_archive_name(operation)

            self.log.debug("Creating pipeline component :\n "
                           "componentID : %s \n "
                           "name : %s \n "
                           "dependencies : %s \n "
                           "file dependencies : %s \n "
                           "dependencies include subdirectories : %s \n "
                           "path of workspace : %s \n "
                           "artifact archive : %s \n "
                           "inputs : %s \n "
                           "outputs : %s \n "
                           "docker image : %s \n ",
                           operation.id,
                           operation.title,
                           operation.dependencies,
                           operation.file_dependencies,
                           operation.recursive_dependencies,
                           operation.artifact,
                           operation_artifact_archive,
                           operation.inputs,
                           operation.outputs,
                           operation.image)

            # create pipeline operation
            notebook_op = NotebookOp(name=operation.title,
                                     notebook=operation.artifact_name,
                                     cos_endpoint=cos_endpoint,
                                     cos_bucket=bucket_name,
                                     cos_directory=cos_directory,
                                     cos_pull_archive=operation_artifact_archive,
                                     pipeline_outputs=self._artifact_list_to_str(operation.outputs),
                                     pipeline_inputs=self._artifact_list_to_str(operation.inputs),
                                     image=operation.image)

            notebook_op.container.add_env_variable(V1EnvVar(name='AWS_ACCESS_KEY_ID', value=cos_username))
            notebook_op.container.add_env_variable(V1EnvVar(name='AWS_SECRET_ACCESS_KEY', value=cos_password))

            # Set ENV variables
            if operation.vars:
                for env_var in operation.vars:
                    # Strip any of these special characters from both key and value
                    # Splits on the first occurrence of '='
                    result = [x.strip(' \'\"') for x in env_var.split('=', 1)]
                    # Should be non empty key with a value
                    if len(result) == 2 and result[0] != '':
                        notebook_op.container.add_env_variable(V1EnvVar(name=result[0], value=result[1]))

            notebook_ops[operation.id] = notebook_op

            self.log.info("NotebookOp Created for Component '%s' (%s) \n", operation.title, operation.id)

            # upload operation dependencies to object storage
            try:
                dependency_archive_path = self._generate_dependency_archive(operation)
                cos_client = CosClient(config=runtime_configuration)
                cos_client.upload_file_to_dir(dir=cos_directory,
                                              file_name=operation_artifact_archive,
                                              file_path=dependency_archive_path)
            except BaseException:
                self.log.error("Error uploading artifacts to object storage.", exc_info=True)
                raise

            self.log.info("Pipeline dependencies have been uploaded to object storage")

        # Process dependencies after all the operations have been created
        for pipeline_operation in pipeline.operations.values():
            op = notebook_ops[pipeline_operation.id]
            for dependency_operation_id in pipeline_operation.dependencies:
                dependency_op = notebook_ops[dependency_operation_id]  # Parent Operation
                op.after(dependency_op)

        return notebook_ops

    def _artifact_list_to_str(self, pipeline_array):
        if not pipeline_array:
            return "None"
        else:
            return ','.join(pipeline_array)

    def _get_dependency_archive_name(self, operation):
        artifact_name = os.path.basename(operation.artifact)
        (name, ext) = os.path.splitext(artifact_name)
        return name + '-' + operation.id + ".tar.gz"

    def _get_dependency_source_dir(self, operation):
        return os.path.join(os.getcwd(), os.path.dirname(operation.artifact))

    def _generate_dependency_archive(self, operation):
        archive_artifact_name = self._get_dependency_archive_name(operation)
        archive_source_dir = self._get_dependency_source_dir(operation)

        files = [os.path.basename(operation.artifact)]
        files.extend(operation.file_dependencies)

        archive_artifact = create_temp_archive(archive_name=archive_artifact_name,
                                               source_dir=archive_source_dir,
                                               files=files,
                                               recursive=operation.recursive_dependencies)

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
            raise RuntimeError('Error retrieving runtime configuration for {}', err)
