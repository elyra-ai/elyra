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

from datetime import datetime

from elyra.metadata import MetadataManager
from elyra.metadata.runtime import Runtime
from elyra.pipeline import PipelineProcessor
from elyra.util.archive import create_temp_archive
from elyra.util.cos import CosClient
from kubernetes.client.models import V1EnvVar
from notebook.pipeline import NotebookOp


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
        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        cos_directory = pipeline_name
        bucket_name = runtime_configuration.metadata['cos_bucket']

        def cc_pipeline():

            # Create dictionary that maps component Id to its ContainerOp instance
            notebook_ops = {}

            # Preprocess the output/input artifacts
            for pipeline_child_operation in pipeline.operations.values():
                for dependency in pipeline_child_operation.dependencies:
                    pipeline_parent_operation = pipeline.operations[dependency]
                    if pipeline_parent_operation.outputs:
                        pipeline_child_operation.inputs = \
                            pipeline_child_operation.inputs + pipeline_parent_operation.outputs

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

                self.log.info("NotebookOp Created for Component %s \n", operation.id)

                # upload operation dependencies to object store
                try:
                    dependency_archive_path = self._generate_dependency_archive(operation)
                    cos_client = CosClient(config=runtime_configuration)
                    cos_client.upload_file_to_dir(dir=cos_directory,
                                                  file_name=operation_artifact_archive,
                                                  file_path=dependency_archive_path)
                except BaseException:
                    self.log.error("Error uploading artifacts to object storage.", exc_info=True)
                    raise

                self.log.info("Pipeline dependencies have been uploaded to object store")

            # Process dependencies after all the operations have been created
            for pipeline_operation in pipeline.operations.values():
                op = notebook_ops[pipeline_operation.id]
                for dependency in pipeline_operation.dependencies:
                    dependency_op = notebook_ops[dependency]  # Parent Operation
                    op.after(dependency_op)

        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_path = temp_dir + '/' + pipeline_name + '.tar.gz'

            self.log.info("Pipeline : %s", pipeline_name)
            self.log.debug("Creating temp directory %s", temp_dir)

            # Compile the new pipeline
            try:
                kfp.compiler.Compiler().compile(cc_pipeline, pipeline_path)
            except Exception as ex:
                raise RuntimeError('Error compiling pipeline {} at {}'.format(pipeline_name, pipeline_path), repr(ex))

            self.log.info("Kubeflow Pipeline successfully compiled.")
            self.log.debug("Kubeflow Pipeline available at %s", pipeline_path)

            # Upload the compiled pipeline and create an experiment and run
            client = kfp.Client(host=api_endpoint)
            kfp_pipeline = client.upload_pipeline(pipeline_path, pipeline_name)

            self.log.info("Kubeflow Pipeline successfully uploaded to : %s", api_endpoint)

            run = client.run_pipeline(experiment_id=client.create_experiment(pipeline_name).id,
                                      job_name=timestamp,
                                      pipeline_id=kfp_pipeline.id)

            self.log.info("Starting Kubeflow Pipeline Run...")
            return "{}/#/runs/details/{}".format(api_endpoint, run.id)

        return None

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
            runtime_configuration = MetadataManager(namespace=Runtime.namespace).get(name)
            return runtime_configuration
        except BaseException as err:
            self.log.error('Error retrieving runtime configuration for {}'.format(name),
                           exc_info=True)
            raise RuntimeError('Error retrieving runtime configuration for {}', err)
