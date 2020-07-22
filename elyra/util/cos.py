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
from minio import Minio
from minio.error import ResponseError, BucketAlreadyOwnedByYou, BucketAlreadyExists
from urllib.parse import urlparse
from traitlets.config import LoggingConfigurable


class CosClient(LoggingConfigurable):
    client = None

    def __init__(self, config=None, endpoint=None, access_key=None, secret_key=None, bucket=None):
        super().__init__()
        if config:
            self.endpoint = urlparse(config.metadata['cos_endpoint'])
            self.access_key = config.metadata['cos_username']
            self.secret_key = config.metadata['cos_password']
            self.bucket = config.metadata['cos_bucket']
        else:
            self.endpoint = urlparse(endpoint)
            self.access_key = access_key
            self.secret_key = secret_key
            self.bucket = bucket
        # Infer secure from the endpoint's scheme.
        self.secure = self.endpoint.scheme == 'https'

        self.client = self.__initialize_object_store()

    def __initialize_object_store(self):

        # Initialize minioClient with an endpoint and access/secret keys.
        self.client = Minio(endpoint=self.endpoint.netloc,
                            access_key=self.access_key,
                            secret_key=self.secret_key,
                            secure=self.secure)

        # Make a bucket with the make_bucket API call.
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except BucketAlreadyOwnedByYou as ex:
            self.log.warning("Object Storage bucket already owned by you", exc_info=True)
            raise ex from ex
        except BucketAlreadyExists as ex:
            self.log.warning("Object Storage bucket already exists", exc_info=True)
            raise ex from ex
        except ResponseError as ex:
            self.log.error("Object Storage error", exc_info=True)
            raise ex from ex

        return self.client

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
        :param: dir: the directory where the file should be uploaded to
        :param file_name: Name of the file object in object storage
        :param file_path: Path on the local filesystem from which object data will be read.
        :return:
        """
        self.upload_file(os.path.join(dir, file_name), file_path)

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
