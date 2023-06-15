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
import os
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import minio
from minio.credentials import providers
from minio.error import S3Error
from traitlets.config import LoggingConfigurable


class CosClient(LoggingConfigurable):
    """
    MinIO-based Object Storage client, enabling Elyra to upload and download
    files.This client is configurable via traitlets.
    """

    client = None

    def __init__(self, config=None, endpoint=None, access_key=None, secret_key=None, bucket=None, **kwargs):
        super().__init__(**kwargs)

        cred_provider = None
        if config is None:
            # The client was invoked by an entity that does not utilize
            # runtime configurations.
            if access_key is None or secret_key is None:
                # use env variables for authentication
                if (
                    len(os.environ.get("AWS_ACCESS_KEY_ID", "").strip()) == 0
                    or len(os.environ.get("AWS_SECRET_ACCESS_KEY", "").strip()) == 0
                ):
                    raise RuntimeError(
                        "Cannot connect to object storage. No credentials "
                        " were provided and environment variables "
                        " AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not "
                        " properly defined."
                    )
                else:
                    cred_provider = providers.EnvAWSProvider()
            else:
                # use provided username and password for authentication
                cred_provider = providers.StaticProvider(
                    access_key=access_key,
                    secret_key=secret_key,
                )
            self.endpoint = endpoint
            self.bucket = bucket
        else:
            auth_type = config.metadata["cos_auth_type"]
            self.endpoint = urlparse(config.metadata["cos_endpoint"])
            self.bucket = config.metadata["cos_bucket"]
            if auth_type in ["USER_CREDENTIALS", "KUBERNETES_SECRET"]:
                cred_provider = providers.StaticProvider(
                    access_key=config.metadata["cos_username"],
                    secret_key=config.metadata["cos_password"],
                )
            elif auth_type == "AWS_IAM_ROLES_FOR_SERVICE_ACCOUNTS":
                if os.environ.get("AWS_ROLE_ARN") is None or os.environ.get("AWS_WEB_IDENTITY_TOKEN_FILE") is None:
                    raise RuntimeError(
                        "Cannot connect to object storage. "
                        f"Authentication provider '{auth_type}' requires "
                        "environment variables AWS_ROLE_ARN and AWS_WEB_IDENTITY_TOKEN_FILE."
                    )
                # Verify that AWS_WEB_IDENTITY_TOKEN_FILE exists
                if Path(os.environ["AWS_WEB_IDENTITY_TOKEN_FILE"]).is_file() is False:
                    raise RuntimeError(
                        "Cannot connect to object storage. The value of environment "
                        "variable AWS_WEB_IDENTITY_TOKEN_FILE references "
                        f"'{os.environ['AWS_WEB_IDENTITY_TOKEN_FILE']}', which is not a valid file."
                    )
                cred_provider = providers.IamAwsProvider()
            else:
                raise RuntimeError(
                    "Cannot connect to object storage. " f"Authentication provider '{auth_type}' is not supported."
                )

        # Infer secure from the endpoint's scheme.
        self.secure = self.endpoint.scheme == "https"

        # get minio client
        self.client = minio.Minio(self.endpoint.netloc, secure=self.secure, credentials=cred_provider)

        # Make a bucket with the make_bucket API call.
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as ex:
            # unpack the S3Error based off error codes
            # https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html
            if ex.code == "BucketAlreadyOwnedByYou":
                self.log.warning("Object Storage bucket already owned by you", exc_info=True)
            elif ex.code == "BucketAlreadyExists":
                self.log.warning("Object Storage bucket already exists", exc_info=True)
            elif ex.code == "SignatureDoesNotMatch":
                self.log.error("Incorrect Object Storage password supplied")
            elif ex.code == "InvalidAccessKeyId":
                self.log.error("Incorrect Object Storage username supplied")
            else:
                self.log.error(f"Object Storage error: {ex.code}", exc_info=True)

            raise ex from ex

        except ValueError as ex:
            # providers.IamAwsProvider raises this if something bad happened
            if isinstance(cred_provider, providers.IamAwsProvider):
                raise RuntimeError(
                    f"Cannot connect to object storage: {ex}. Verify that "
                    f"environment variable AWS_WEB_IDENTITY_TOKEN_FILE contains a valid value."
                )
            else:
                raise ex

    def upload_file(self, local_file_path: str, object_name: str, object_prefix: str = "") -> str:
        """
        Uploads contents from a file, located on the local filesystem at `local_file_path`,
        as `object_name` in object storage.
        :param local_file_path: Path on the local filesystem from which object data will be read.
        :param object_name: Name of the file object in object storage
        :param prefix: optional prefix to be applied to object_name
        :return: fully qualified object name, if upload was successful
        """

        fq_object_name = join_paths(object_prefix, object_name)

        try:
            # upload local_file_path as object_name
            self.client.fput_object(bucket_name=self.bucket, object_name=fq_object_name, file_path=local_file_path)
        except BaseException as ex:
            self.log.error(
                f"Error uploading file '{local_file_path}' to bucket '{self.bucket}' as '{fq_object_name}'",
                exc_info=True,
            )
            raise ex from ex

        return fq_object_name

    def download_file(self, object_name: str, local_file_path: str) -> None:
        """
        Downloads and saves the object as a file in the local filesystem.
        :param object_name: Name of the file object in object storage
        :param local_file_path: Path on the local filesystem to which the object data will be written.
        :return:
        """
        # sanitize object name; S3 does not accept leading /
        fq_object_name = join_paths(object_name)
        try:
            self.client.fget_object(bucket_name=self.bucket, object_name=fq_object_name, file_path=local_file_path)
        except BaseException as ex:
            self.log.error(
                f"Error downloading '{fq_object_name}' from bucket '{self.bucket}' to '{local_file_path}'",
                exc_info=True,
            )
            raise ex from ex


def join_paths(path1: Optional[str] = "", path2: Optional[str] = "") -> str:
    """
    Joins path1 and path2, returning a valid object storage path string.
    Example: "/p1/p2" + "p3" -> "p1/p2/p3"
    """
    path1 = path1 or ""
    path2 = path2 or ""
    # combine paths and ensure the resulting path does not start with "/" char and
    path = f"{path1.rstrip('/')}/{path2}".lstrip("/")
    if len(path) > 0:
        # convert to Posix
        return Path(path).as_posix()
    return path
