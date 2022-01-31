#
# Copyright 2018-2022 Elyra Authors
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
from urllib.parse import urlparse

import minio
from minio.credentials import providers
from minio.error import S3Error
from traitlets.config import LoggingConfigurable


class CosClient(LoggingConfigurable):
    client = None

    def __init__(self, config=None, endpoint=None, access_key=None, secret_key=None, bucket=None, **kwargs):
        super().__init__(**kwargs)

        cred_provider = None
        if config is None:
            # The client was invoked by an entity that does not utilize
            # runtime configurations.
            if access_key is None or secret_key is None:
                # use env variables for authentication
                if len(os.environ.get('AWS_ACCESS_KEY_ID', '').strip()) == 0 or\
                   len(os.environ.get('AWS_SECRET_ACCESS_KEY', '').strip()) == 0:
                    raise RuntimeError('Cannot connect to object storage. No credentials '
                                       ' were provided and environment variables '
                                       ' AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not '
                                       ' properly defined.')
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
            auth_type = config.metadata['cos_auth_type']
            self.endpoint = urlparse(config.metadata['cos_endpoint'])
            self.bucket = config.metadata['cos_bucket']
            if auth_type in ['USER_CREDENTIALS', 'KUBERNETES_SECRET']:
                cred_provider = providers.StaticProvider(
                    access_key=config.metadata['cos_username'],
                    secret_key=config.metadata['cos_password'],
                )
            elif auth_type == 'AWS_IAM_ROLES_FOR_SERVICE_ACCOUNTS':
                if os.environ.get('AWS_ROLE_ARN') is None or\
                   os.environ.get('AWS_WEB_IDENTITY_TOKEN_FILE') is None:
                    raise RuntimeError('Cannot connect to object storage. '
                                       f'Authentication provider \'{auth_type}\' requires '
                                       'environment variables AWS_ROLE_ARN and AWS_IAM_ROLES_FOR_SERVICE_ACCOUNTS.')
                # Verify that AWS_WEB_IDENTITY_TOKEN_FILE exists
                if Path(os.environ['AWS_WEB_IDENTITY_TOKEN_FILE']).is_file() is False:
                    raise RuntimeError('Cannot connect to object storage. The value of environment '
                                       'variable AWS_IAM_ROLES_FOR_SERVICE_ACCOUNTS references '
                                       f"'{os.environ['AWS_WEB_IDENTITY_TOKEN_FILE']}', which is not a valid file.")
                cred_provider = providers.IamAwsProvider()
            else:
                raise RuntimeError('Cannot connect to object storage. '
                                   f'Authentication provider \'{auth_type}\' is not supported.')

        # Infer secure from the endpoint's scheme.
        self.secure = self.endpoint.scheme == 'https'

        # get minio client
        self.client = minio.Minio(
            self.endpoint.netloc,
            secure=self.secure,
            credentials=cred_provider
        )

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
                raise RuntimeError(f'Cannot connect to object storage: {ex}. Verify that '
                                   f'environment variable AWS_WEB_IDENTITY_TOKEN_FILE contains a valid value.')
            else:
                raise ex

    def upload_file(self, file_name, file_path):
        """
        Uploads contents from a file, located on the local filesystem at `file_path`,
        as `file_name` in object storage.
        :param file_name: Name of the file object in object storage
        :param file_path: Path on the local filesystem from which object data will be read.
        :return:
        """

        try:
            self.client.fput_object(bucket_name=self.bucket,
                                    object_name=file_name,
                                    file_path=file_path)
        except BaseException as ex:
            self.log.error('Error uploading file {} to bucket {}'.format(file_path, self.bucket), exc_info=True)
            raise ex from ex

    def upload_file_to_dir(self, dir, file_name, file_path):
        """
        Uploads contents from a file, located on the local filesystem at `file_path`,
        as `file_name` in object storage.
        :param dir: the directory where the file should be uploaded to
        :param file_name: Name of the file object in object storage
        :param file_path: Path on the local filesystem from which object data will be read.
        :return:
        """
        # elyra-320 -> always use posix path as this is targeting COS filesystem
        location = Path(os.path.join(dir, file_name))
        self.upload_file(location.as_posix(), file_path)

    def download_file(self, file_name, file_path):
        """
        Downloads and saves the object as a file in the local filesystem.
        :param file_name: Name of the file object in object storage
        :param file_path: Path on the local filesystem to which the object data will be written.
        :return:
        """
        try:
            self.client.fget_object(bucket_name=self.bucket,
                                    object_name=file_name,
                                    file_path=file_path)
        except BaseException as ex:
            self.log.error('Error reading file {} from bucket {}'.format(file_name, self.bucket), exc_info=True)
            raise ex from ex

    def download_file_from_dir(self, dir, file_name, file_path):
        """
        Downloads and saves the object as a file in the local filesystem.
        :param dir: the directory where the file is located
        :param file_name: Name of the file object in object storage
        :param file_path: Path on the local filesystem to which the object data will be written.
        :return:
        """

        self.download_file(os.path.join(dir, file_name), file_path)
