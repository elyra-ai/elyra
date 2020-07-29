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
import autopep8
import kfp
import os
import tempfile
import time

from datetime import datetime

from elyra.metadata import MetadataManager
from elyra.pipeline import PipelineProcessor, PipelineProcessorResponse
from elyra.util.archive import create_temp_archive
from elyra.util.cos import CosClient
from kfp_notebook.pipeline import NotebookOp
from urllib3.exceptions import MaxRetryError
from jinja2 import Environment, PackageLoader


class KfpPipelineProcessor(PipelineProcessor):
    _type = 'kfp'

    @property
    def type(self):
        return self._type

    def process(self, pipeline):
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = f'{pipeline.name}-{timestamp}'

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint']
        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_bucket = runtime_configuration.metadata['cos_bucket']

        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_path = os.path.join(temp_dir, f'{pipeline_name}.tar.gz')

            self.log.info("Pipeline : %s", pipeline_name)
            self.log.debug("Creating temp directory %s", temp_dir)

            # Compile the new pipeline
            try:
                pipeline_function = lambda: self._cc_pipeline(pipeline, pipeline_name)  # nopep8 E731
                t0 = time.time()
                kfp.compiler.Compiler().compile(pipeline_function, pipeline_path)
                t1 = time.time()
                self.log.debug("Compilation of pipeline '{name}' took {duration:.3f} secs.".
                               format(name=pipeline_name, duration=(t1 - t0)))
            except Exception as ex:
                raise RuntimeError('Error compiling pipeline {} at {}'.
                                   format(pipeline_name, pipeline_path), str(ex)) from ex

            self.log.info("Kubeflow Pipeline successfully compiled.")
            self.log.debug("Kubeflow Pipeline was created in %s", pipeline_path)

            # Upload the compiled pipeline and create an experiment and run
            client = kfp.Client(host=api_endpoint)
            try:
                t0 = time.time()
                kfp_pipeline = client.upload_pipeline(pipeline_path, pipeline_name)
                t1 = time.time()
                self.log.debug("Upload of pipeline '{name}' took {duration:.3f} secs.".
                               format(name=pipeline_name, duration=(t1 - t0)))
            except MaxRetryError as ex:
                raise RuntimeError('Error connecting to pipeline server {}'.format(api_endpoint)) from ex

            self.log.info("Kubeflow Pipeline successfully uploaded to : %s", api_endpoint)

            run = client.run_pipeline(experiment_id=client.create_experiment(pipeline_name).id,
                                      job_name=timestamp,
                                      pipeline_id=kfp_pipeline.id)

            self.log.info("Starting Kubeflow Pipeline Run...")

            return PipelineProcessorResponse(
                run_url="{}/#/runs/details/{}".format(api_endpoint, run.id),
                object_storage_url="{}".format(cos_endpoint),
                object_storage_path="/{}/{}".format(cos_bucket, pipeline_name),
            )

        return None

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        if pipeline_export_format not in ["yaml", "py"]:
            raise ValueError("Pipeline export format {} not recognized.".format(pipeline_export_format))

        pipeline_name = pipeline.name

        # Since pipeline_export_path may be relative to the notebook directory, ensure
        # we're using its absolute form.
        absolute_pipeline_export_path = self.get_absolute_path(pipeline_export_path)

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata['api_endpoint']

        if os.path.exists(absolute_pipeline_export_path) and not overwrite:
            raise ValueError("File " + absolute_pipeline_export_path + " already exists.")

        self.log.info('Creating pipeline definition as a .' + pipeline_export_format + ' file')
        if pipeline_export_format != "py":
            try:
                pipeline_function = lambda: self._cc_pipeline(pipeline, pipeline_name)  # nopep8
                t0 = time.time()
                kfp.compiler.Compiler().compile(pipeline_function, absolute_pipeline_export_path)
                t1 = time.time()
                self.log.debug("Compilation of pipeline '{name}' took {duration:.3f} secs.".
                               format(name=pipeline_name, duration=(t1 - t0)))
            except Exception as ex:
                raise RuntimeError('Error compiling pipeline {} for export at {}'.
                                   format(pipeline_name, absolute_pipeline_export_path), str(ex)) from ex
        else:
            # Load template from installed elyra package
            loader = PackageLoader('elyra', 'templates')
            template_env = Environment(loader=loader)

            template = template_env.get_template('kfp_template.jinja2')

            defined_pipeline = self._cc_pipeline(pipeline, pipeline_name)

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
                                            api_endpoint=api_endpoint,
                                            pipeline_description="Elyra Pipeline")

            # Write to python file and fix formatting
            with open(absolute_pipeline_export_path, "w") as fh:
                fh.write(autopep8.fix_code(python_output))

        return pipeline_export_path  # Return the input value, not its absolute form

    def _cc_pipeline(self, pipeline, pipeline_name):

        runtime_configuration = self._get_runtime_configuration(pipeline.runtime_config)

        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        cos_directory = pipeline_name
        cos_bucket = runtime_configuration.metadata['cos_bucket']

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

            # Collect env variables
            pipeline_envs = dict()
            pipeline_envs['AWS_ACCESS_KEY_ID'] = cos_username
            pipeline_envs['AWS_SECRET_ACCESS_KEY'] = cos_password

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
                                                    image=operation.runtime_image)

            self.log.info("NotebookOp Created for Component '%s' (%s)", operation.name, operation.id)

            # upload operation dependencies to object storage
            try:
                t0 = time.time()
                dependency_archive_path = self._generate_dependency_archive(operation)
                t1 = time.time()
                self.log.debug("Generation of dependency archive for operation '{name}' took {duration:.3f} secs.".
                               format(name=operation.name, duration=(t1 - t0)))

                cos_client = CosClient(config=runtime_configuration)
                t0 = time.time()
                cos_client.upload_file_to_dir(dir=cos_directory,
                                              file_name=operation_artifact_archive,
                                              file_path=dependency_archive_path)
                t1 = time.time()
                self.log.debug("Upload of dependency archive for operation '{name}' took {duration:.3f} secs.".
                               format(name=operation.name, duration=(t1 - t0)))

            except FileNotFoundError as ex:
                self.log.error("Dependencies were not found building archive for operation: {}".
                               format(operation.name), exc_info=True)
                raise FileNotFoundError("Node '{}' referenced dependencies that were not found: {}".
                                        format(operation.name, ex))

            except BaseException as ex:
                self.log.error("Error uploading artifacts to object storage for operation: {}".
                               format(operation.name), exc_info=True)
                raise ex from ex

            self.log.info("Pipeline dependencies have been uploaded to object storage")

        # Process dependencies after all the operations have been created
        for operation in pipeline.operations.values():
            op = notebook_ops[operation.id]
            for parent_operation_id in operation.parent_operations:
                parent_op = notebook_ops[parent_operation_id]  # Parent Operation
                op.after(parent_op)

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
