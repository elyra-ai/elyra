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

import os
import autopep8
import json
import tempfile
import uuid

from collections import OrderedDict

from elyra.metadata import MetadataManager
from elyra.pipeline import PipelineProcessor
from elyra.util.archive import create_temp_archive
from elyra.util.cos import CosClient
from jinja2 import Environment, PackageLoader


class AirflowPipelineProcessor(PipelineProcessor):
    _type = 'airflow'

    @property
    def type(self):
        return self._type

    def process(self, pipeline):
        unique_id = uuid.uuid4().hex[4:15]
        if not pipeline.title:
            pipeline_name = "pipeline" + '-' + unique_id
        else:
            pipeline_name = pipeline.title + '-' + unique_id

        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_export_path = temp_dir + '/' + pipeline_name + ".py"

            pipeline_filepath = self.create_pipeline_file(pipeline=pipeline,
                                                          pipeline_export_format="py",
                                                          pipeline_export_path=pipeline_export_path,
                                                          pipeline_name=pipeline_name)

            self.log.debug("Uploading pipeline file: %s", pipeline_filepath)

            config = self._get_runtime_configuration(pipeline.runtime_config)
            cos_directory = ''
            try:
                cos_client = CosClient(endpoint=config.metadata['cos_endpoint'],
                                       access_key=config.metadata['cos_username'],
                                       secret_key=config.metadata['cos_password'],
                                       bucket=config.metadata['cos_dag_bucket'])

                cos_client.upload_file_to_dir(dir=cos_directory,
                                              file_name=pipeline_name + ".py",
                                              file_path=pipeline_filepath)
            except BaseException:
                self.log.error("Error uploading DAG to object storage.", exc_info=True)
                raise

        self.log.info("Uploaded AirFlow Pipeline...waiting for Airflow Scheduler to start a run")

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        unique_id = uuid.uuid4().hex[4:15]
        if not pipeline.title:
            pipeline_name = "pipeline" + '-' + unique_id
        else:
            pipeline_name = pipeline.title + '-' + unique_id

        if pipeline_export_format not in ["json", "py"]:
            raise ValueError("Pipeline export format {} not recognized.".format(pipeline_export_format))

        if os.path.exists(pipeline_export_path) and not overwrite:
            raise ValueError("File " + pipeline_export_path + " already exists.")

        self.create_pipeline_file(pipeline=pipeline,
                                  pipeline_export_format="py",
                                  pipeline_export_path=pipeline_export_path,
                                  pipeline_name=pipeline_name)

        return pipeline_export_path

    def _cc_pipeline(self, pipeline, pipeline_name):

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)

        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        cos_directory = pipeline_name
        bucket_name = runtime_configuration.metadata['cos_bucket']

        # Create dictionary that maps component Id to its ContainerOp instance
        notebook_ops = []

        # Preprocess the output/input artifacts
        for pipeline_child_operation in pipeline.operations.values():
            for dependency in pipeline_child_operation.dependencies:
                pipeline_parent_operation = pipeline.operations[dependency]
                if pipeline_parent_operation.outputs:
                    pipeline_child_operation.inputs = pipeline_child_operation.inputs + \
                        pipeline_parent_operation.outputs

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

            env_var_dict = {'AWS_ACCESS_KEY_ID': cos_username, 'AWS_SECRET_ACCESS_KEY': cos_password}

            # Set ENV variables in each container
            if operation.vars:
                for env_var in operation.vars:
                    # Strip any of these special characters from both key and value
                    # Splits on the first occurrence of '='
                    result = [x.strip(' \'\"') for x in env_var.split('=', 1)]
                    # Should be non empty key with a value
                    if len(result) == 2 and result[0] != '':
                        env_var_dict[result[0]] = result[1]

            notebook = {'notebook': operation.artifact_name,
                        'id': operation.id,
                        'image': operation.image,
                        'cos_endpoint': cos_endpoint,
                        'cos_bucket': bucket_name,
                        'cos_directory': cos_directory,
                        'cos_pull_archive': operation_artifact_archive,
                        'pipeline_outputs': self._artifact_list_to_str(operation.outputs),
                        'pipeline_inputs': self._artifact_list_to_str(operation.inputs),
                        'env_vars': env_var_dict,
                        'dependencies': operation.dependencies
                        }
            notebook_ops.append(notebook)

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

        ordered_notebook_ops = OrderedDict()

        while notebook_ops:
            for i in range(len(notebook_ops)):
                notebook = notebook_ops.pop(0)
                if not notebook['dependencies']:
                    ordered_notebook_ops[notebook['id']] = notebook
                    self.log.debug("This is a root node added : %s", ordered_notebook_ops[notebook['id']])
                elif all(deps in ordered_notebook_ops.keys() for deps in notebook['dependencies']):
                    ordered_notebook_ops[notebook['id']] = notebook
                    self.log.debug("This is a dependent node added : %s", ordered_notebook_ops[notebook['id']])
                else:
                    notebook_ops.append(notebook)

        return ordered_notebook_ops

    def create_pipeline_file(self, pipeline, pipeline_export_format, pipeline_export_path, pipeline_name):

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint']

        self.log.info('Creating pipeline definition as a .' + pipeline_export_format + ' file')
        if pipeline_export_format == "json":
            with open(pipeline_export_path, 'w', encoding='utf-8') as file:
                json.dump(pipeline_export_path, file, ensure_ascii=False, indent=4)
        else:
            # Load template from installed elyra package
            loader = PackageLoader('elyra', 'templates/airflow')
            template_env = Environment(loader=loader)

            template = template_env.get_template('airflow_template.jinja2')

            notebook_ops = self._cc_pipeline(pipeline, pipeline_name)

            python_output = template.render(operations_list=notebook_ops,
                                            pipeline_name=pipeline_name,
                                            namespace='default',
                                            kube_config_path=None,
                                            is_paused_upon_creation='False',
                                            in_cluster='True',
                                            api_endpoint=api_endpoint,
                                            pipeline_description="Elyra Pipeline")

            # Write to python file and fix formatting
            with open(pipeline_export_path, "w") as fh:
                fh.write(autopep8.fix_code(python_output))

        return pipeline_export_path

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
            runtime_configuration = MetadataManager(namespace="runtimes").get(name)
        except BaseException as err:
            self.log.error('Error retrieving runtime configuration for {}'.format(name),
                           exc_info=True)
            raise RuntimeError('Error retrieving runtime configuration for {}', err)

        return runtime_configuration
