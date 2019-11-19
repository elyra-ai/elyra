#
# Copyright 2018-2019 IBM Corporation
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
import kfp
import os
import tarfile
import tempfile

from datetime import datetime
from jsonschema import ValidationError
from kubernetes.client.models import V1EnvVar
from notebook.base.handlers import APIHandler
from notebook.pipeline import NotebookOp
from minio import Minio
from minio.error import ResponseError, BucketAlreadyOwnedByYou, BucketAlreadyExists
from tornado import web
from urllib.parse import urlparse
from ai_workspace.metadata import MetadataManager
from ai_workspace.pipeline import PipelineParser


class SchedulerHandler(APIHandler):

    """REST-ish method calls to execute pipelines as batch jobs"""
    def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    def post(self, *args, **kwargs):
        self.log.debug("Pipeline SchedulerHandler now executing post request")

        # parse submitted pipeline definition
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_definition = self.get_json_body()

        self.log.debug("JSON payload: %s", pipeline_definition)

        pipeline = PipelineParser.parse(pipeline_definition)

        pipeline_name = (pipeline.title if pipeline.title else 'pipeline') + '-' + timestamp

        # retrieve associated runtime metadata
        runtime_type = pipeline.platform
        try:
            runtime_configuration = MetadataManager.instance(namespace="runtime").get(runtime_type)
        except (ValidationError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        api_endpoint = runtime_configuration.metadata['api_endpoint']
        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        bucket_name = runtime_configuration.metadata['cos_bucket']

        self.log.info('Runtime configuration: \n {} \n {} \n {} \n {}'
                      .format(api_endpoint, cos_endpoint, cos_username, bucket_name))

        def get_artifact_archive(operation):
            artifact_name = os.path.basename(operation.artifact)
            (name, ext) = os.path.splitext(artifact_name)
            return name + '-' + operation.id + ".tar.gz"

        def cc_pipeline():

            # Create dictionary that maps component Id to its ContainerOp instance
            notebook_ops = {}

            # Preprocess the output/input artifacts
            for pipeline_child_operation in pipeline.operations.values():
                for dependency in pipeline_child_operation.dependencies:
                    pipeline_parent_operation = pipeline.operations[dependency]
                    if pipeline_parent_operation.outputs:
                        pipeline_child_operation.inputs = pipeline_child_operation.inputs + pipeline_parent_operation.outputs

            for operation in pipeline.operations.values():
                operation_artifact_archive = get_artifact_archive(operation)

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
                                         cos_directory=pipeline_name,
                                         cos_pull_archive=operation_artifact_archive,
                                         pipeline_outputs=self.__artifact_list_to_str(operation.outputs),
                                         pipeline_inputs=self.__artifact_list_to_str(operation.inputs),
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
                        if len(result) is 2 and result[0] is not '':
                            notebook_op.container.add_env_variable(V1EnvVar(name=result[0], value=result[1]))

                notebook_ops[operation.id] = notebook_op

                self.log.info("NotebookOp Created for Component %s \n", operation.id)

            # upload operation related artifacts to object store
            try:
                for operation in pipeline.operations.values():
                    archive_artifact = get_artifact_archive(operation)
                    self.__upload_artifacts_to_object_store(runtime_configuration, operation, archive_artifact, pipeline_name)
            except ResponseError:
                self.log.error("Error uploading artifacts to object storage", exc_info=True)
                raise

            # Process dependencies after all the operations have been created
            for pipeline_operation in pipeline.operations.values():
                op = notebook_ops[pipeline_operation.id]
                for dependency in pipeline_operation.dependencies:
                    dependency_op = notebook_ops[dependency]  # Parent Operation
                    op.after(dependency_op)

            self.log.info("Pipeline dependencies are set")

        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_path = temp_dir+'/'+pipeline_name+'.tar.gz'

            self.log.info("Pipeline : %s", pipeline_name)
            self.log.debug("Creating temp directory %s", temp_dir)

            # Compile the new pipeline
            try:
                kfp.compiler.Compiler().compile(cc_pipeline, pipeline_path)
            except Exception as ex:
                raise web.HTTPError(500, repr(ex))


            self.log.info("Kubeflow Pipeline successfully compiled!")
            self.log.debug("Kubeflow Pipeline compiled pipeline placed into %s", pipeline_path)

            # Upload the compiled pipeline and create an experiment and run
            client = kfp.Client(host=api_endpoint)
            kfp_pipeline = client.upload_pipeline(pipeline_path, pipeline_name)

            self.log.info("Kubeflow Pipeline successfully uploaded to : %s", api_endpoint)

        run = client.run_pipeline(experiment_id=client.create_experiment(pipeline_name).id,
                            job_name=timestamp,
                            pipeline_id=kfp_pipeline.id)

        self.log.info("Starting Kubeflow Pipeline Run...")
        self.send_success_message("pipeline successfully submitted", api_endpoint + "/#/runs/details/" + run.id)

    def send_message(self, message):
        self.write(message)
        self.flush()

    def send_success_message(self, message, job_url):
        self.set_status(200)
        msg = json.dumps({"status": "ok",
                          "message": message,
                          "url": job_url})
        self.send_message(msg)

    def send_error_message(self, status_code, error_message):
        self.set_status(status_code)
        msg = json.dumps({"status": "error",
                          "message": error_message})
        self.send_message(msg)

    def __artifact_list_to_str(self, pipeline_array):
        if not pipeline_array:
            return "None"
        else:
            return ','.join(pipeline_array)

    def __initialize_object_store(self, config):

        cos_endpoint = urlparse(config.metadata['cos_endpoint'])
        cos_username = config.metadata['cos_username']
        cos_password = config.metadata['cos_password']
        bucket_name = config.metadata['cos_bucket']

        # Initialize minioClient with an endpoint and access/secret keys.
        minio_client = Minio(endpoint=cos_endpoint.netloc,
                             access_key=cos_username,
                             secret_key=cos_password,
                             secure=False)

        # Make a bucket with the make_bucket API call.
        try:
            if not minio_client.bucket_exists(bucket_name):
                minio_client.make_bucket(bucket_name)
        except BucketAlreadyOwnedByYou:
            self.log.warning("Minio bucket already owned by you", exc_info=True)
            pass
        except BucketAlreadyExists:
            self.log.warning("Minio bucket already exists", exc_info=True)
            pass
        except ResponseError:
            self.log.error("Minio error", exc_info=True)
            raise

        return minio_client

    def __upload_artifacts_to_object_store(self, config, operation, archive_artifact, pipeline_name):

        def tar_filter(tarinfo):
            """Filter files from the generated archive"""
            if tarinfo.type == tarfile.DIRTYPE:
                # ignore hidden directories (e.g. ipynb checkpoints and/or trash contents)
                if any(dir.startswith('.') for dir in tarinfo.name.split('/')):
                    return None
                # always return the base directory (empty string) otherwise tar will be empty
                elif not tarinfo.name:
                    return tarinfo
                # only include subdirectories if enabled in common properties
                elif operation.recursive_dependencies:
                    return tarinfo
                else:
                    return None

            if '*' in operation.file_dependencies:
                self.log.debug(tarinfo.name + " added to " + archive_artifact)
                return tarinfo

            if tarinfo.name == os.path.basename(operation.artifact):
                self.log.debug(tarinfo.name + " added to " + archive_artifact)
                return tarinfo

            for dependency in operation.file_dependencies:
                if dependency.startswith('*'):
                    # handle check for extension wildcard
                    if tarinfo.name.endswith(dependency.replace('*.', '.')):
                        self.log.debug(tarinfo.name + " added to " + archive_artifact)
                        return tarinfo
                else:
                    # handle check for specific file
                    if tarinfo.name == dependency:
                        self.log.debug(tarinfo.name + " added to " + archive_artifact)
                        return tarinfo

            return None

        aiw_max_upload_size_mb = 100  # max archive size allowed before warning messages start to appear

        client = self.__initialize_object_store(config)

        full_artifact_path = os.path.join(os.getcwd(), os.path.dirname(operation.artifact))

        self.log.debug("Creating TAR archive %s with contents from %s", archive_artifact, full_artifact_path)

        with tempfile.TemporaryDirectory() as archive_temp_dir:
            with tarfile.open(archive_temp_dir + archive_artifact, "w:gz") as tar:
                tar.add(full_artifact_path, arcname="", filter=tar_filter)

            self.log.debug("Creating temp directory for archive TAR : %s", archive_temp_dir)
            self.log.info("TAR archive %s created", archive_artifact)

            if os.path.getsize(archive_temp_dir + archive_artifact) > aiw_max_upload_size_mb * 1024.0**2:
                self.log.warn("The tar archive %s is over %s MB and may take additional time to upload",
                              archive_artifact + ".tar.gz", aiw_max_upload_size_mb)

            client.fput_object(bucket_name=config.metadata['cos_bucket'],
                                     object_name=pipeline_name + '/' + archive_artifact,
                                     file_path=archive_temp_dir + archive_artifact)

            self.log.debug("TAR archive %s pushed to bucket : %s ", archive_artifact, config.metadata['cos_bucket'])
