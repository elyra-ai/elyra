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
from kubernetes.client.models import V1EnvVar
from notebook.base.handlers import IPythonHandler
from notebook.pipeline import NotebookOp
from minio import Minio
from minio.error import ResponseError, BucketAlreadyOwnedByYou, BucketAlreadyExists
from urllib.parse import urlparse

from ai_workspace.metadata import Metadata, MetadataManager, FileMetadataStore
from ai_workspace.pipeline import Pipeline, Operation, PipelineParser


class SchedulerHandler(IPythonHandler):
    metadata_manager = MetadataManager(namespace="runtime",
                                       store=FileMetadataStore(namespace='runtime'))

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

        # retrieve associated runtime metadata
        runtime_type = pipeline.platform
        runtime_configuration = self.metadata_manager.get(runtime_type)

        if not runtime_configuration:
            raise RuntimeError("Runtime metadata not available.")

        api_endpoint = runtime_configuration.metadata['api_endpoint']
        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        bucket_name = runtime_configuration.metadata['cos_bucket']

        self.log.info('Runtime configuration: \n {} \n {} \n {} \n {}'
                      .format(api_endpoint, cos_endpoint, cos_username, bucket_name))


        def cc_pipeline():

            # Create dictionary that maps component Id to its ContainerOp instance
            notebook_ops = {}
            tars_to_upload = {}

            for operation in pipeline.operations.values():
                operation_work_dir = os.path.dirname(operation.artifact)
                operation_artifact_archive = operation_work_dir + '-' + timestamp + ".tar.gz"

                # Create one tar archive for each notebook work directory.
                # When multiple operations use notebooks from same work directory,
                # just reuse the tar archive since the notebook will be in the archive
                if operation_work_dir not in tars_to_upload:
                    tars_to_upload[operation_work_dir] = operation_artifact_archive

                self.log.debug("Creating pipeline component :\n "
                               "componentID : %s \n "
                               "name : %s \n "
                               "dependencies : %s \n "
                               "path of workspace : %s \n "
                               "artifact archive : %s \n "
                               "docker image : %s \n ",
                               operation.id,
                               operation.title,
                               operation.dependencies,
                               operation.artifact,
                               operation_artifact_archive,
                               operation.image)

                # create pipeline operation
                notebook_op = NotebookOp(name=operation.title,
                                         notebook=operation.artifact_name,
                                         cos_endpoint=cos_endpoint,
                                         cos_bucket=bucket_name,
                                         cos_pull_archive=operation_artifact_archive,
                                         image=operation.image)

                notebook_op.container.add_env_variable(V1EnvVar(name='AWS_ACCESS_KEY_ID', value=cos_username))
                notebook_op.container.add_env_variable(V1EnvVar(name='AWS_SECRET_ACCESS_KEY', value=cos_password))

                notebook_ops[operation.id] = notebook_op

                self.log.info("NotebookOp Created for Component %s \n", operation.id)

            # upload operation related artifacts to object store
            try:
                for artifact_path, artifact_filename in tars_to_upload.items():
                    self.__upload_artifacts_to_object_store(runtime_configuration, artifact_path, artifact_filename)
            except ResponseError:
                self.log.error("Error uploading artifacts to object storage", exc_info=True)

            # Process dependencies after all the operations have been created
            for pipeline_operation in pipeline.operations.values():
                op = notebook_ops[pipeline_operation.id]
                for dependency in pipeline_operation.dependencies:
                    dependency_op = notebook_ops[dependency]
                    op.after(dependency_op)

            self.log.info("Pipeline dependencies are set")

        pipeline_name = pipeline.title + '-' + timestamp

        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_path = temp_dir+'/'+pipeline_name+'.tar.gz'

            self.log.info("Pipeline : %s", pipeline_name)
            self.log.debug("Creating temp directory %s", temp_dir)

            # Compile the new pipeline
            kfp.compiler.Compiler().compile(cc_pipeline,pipeline_path)

            self.log.info("Kubeflow Pipeline successfully compiled!")
            self.log.debug("Kubeflow Pipeline compiled pipeline placed into %s", pipeline_path)

            # Upload the compiled pipeline and create an experiment and run
            client = kfp.Client(host=api_endpoint)
            kfp_pipeline = client.upload_pipeline(pipeline_path, pipeline_name)

            self.log.info("Kubeflow Pipeline successfully uploaded to : %s", api_endpoint)

        client.run_pipeline(experiment_id=client.create_experiment(pipeline_name).id,
                            job_name=timestamp,
                            pipeline_id=kfp_pipeline.id)

        self.log.info("Starting Kubeflow Pipeline Run...")

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

    def __upload_artifacts_to_object_store(self, config, artifact, archive_artifact):
        client = self.__initialize_object_store(config)

        full_artifact_path = os.path.join(os.getcwd(), artifact)

        self.log.debug("Creating TAR archive %s with contents from %s", archive_artifact, full_artifact_path)

        with tempfile.TemporaryDirectory() as archive_temp_dir:
            with tarfile.open(archive_temp_dir + archive_artifact, "w:gz") as tar:
                tar.add(full_artifact_path, arcname="")

            self.log.debug("Creating temp directory for archive TAR : %s", archive_temp_dir)
            self.log.info("TAR archive %s created", archive_artifact)

            client.fput_object(bucket_name=config.metadata['cos_bucket'],
                                     object_name=archive_artifact,
                                     file_path=archive_temp_dir + archive_artifact)

            self.log.debug("TAR archive %s pushed to bucket : %s ", archive_artifact, config.metadata['cos_bucket'])
