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
from abc import ABC
from abc import abstractmethod
import glob
import logging
import os
import subprocess
import sys
import time
from typing import Any
from typing import Optional
from typing import Type
from typing import TypeVar
from urllib.parse import urlparse

from packaging import version

# Inputs and Outputs separator character.  If updated,
# same-named variable in _notebook_op.py must be updated!
INOUT_SEPARATOR = ';'

# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
F = TypeVar('F', bound='FileOpBase')

logger = logging.getLogger('elyra')
enable_pipeline_info = os.getenv('ELYRA_ENABLE_PIPELINE_INFO', 'true').lower() == 'true'
pipeline_name = None  # global used in formatted logging
operation_name = None  # global used in formatted logging


class FileOpBase(ABC):
    """Abstract base class for file-based operations"""
    filepath = None
    cos_client = None
    cos_bucket = None

    @classmethod
    def get_instance(cls: Type[F], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the extension of the filepath (-f) argument"""
        filepath = kwargs['filepath']
        if '.ipynb' in filepath:
            return NotebookFileOp(**kwargs)
        elif '.py' in filepath:
            return PythonFileOp(**kwargs)
        elif '.r' in filepath:
            return RFileOp(**kwargs)
        else:
            raise ValueError('Unsupported file type: {}'.format(filepath))

    def __init__(self, **kwargs: Any) -> None:
        """Initializes the FileOpBase instance"""
        import minio
        from minio.credentials import providers

        self.filepath = kwargs['filepath']
        self.input_params = kwargs or []
        self.cos_endpoint = urlparse(self.input_params.get('cos-endpoint'))
        self.cos_bucket = self.input_params.get('cos-bucket')

        # Infer secure from the endpoint's scheme.
        self.secure = self.cos_endpoint.scheme == 'https'

        # get minio credentials provider
        if "cos-user" in self.input_params and "cos-password" in self.input_params:
            cred_provider = providers.StaticProvider(
                access_key=self.input_params.get("cos-user"),
                secret_key=self.input_params.get("cos-password"),
            )
        elif "AWS_ACCESS_KEY_ID" in os.environ and "AWS_SECRET_ACCESS_KEY" in os.environ:
            cred_provider = providers.EnvAWSProvider()
        elif "AWS_ROLE_ARN" in os.environ and "AWS_WEB_IDENTITY_TOKEN_FILE" in os.environ:
            cred_provider = providers.IamAwsProvider()
        else:
            raise RuntimeError(
                "No minio credentials provider can be initialised for current configs. "
                "Please validate your runtime configuration details and retry."
            )

        # get minio client
        self.cos_client = minio.Minio(
            self.cos_endpoint.netloc,
            secure=self.secure,
            credentials=cred_provider
        )

    @abstractmethod
    def execute(self) -> None:
        """Execute the operation relative to derived class"""
        raise NotImplementedError("Method 'execute()' must be implemented by subclasses!")

    def process_dependencies(self) -> None:
        """Process dependencies

        If a dependency archive is present, it will be downloaded from object storage
        and expanded into the local directory.

        This method can be overridden by subclasses, although overrides should first
        call the superclass method.
        """
        OpUtil.log_operation_info('processing dependencies')
        t0 = time.time()
        archive_file = self.input_params.get('cos-dependencies-archive')

        self.get_file_from_object_storage(archive_file)

        inputs = self.input_params.get('inputs')
        if inputs:
            input_list = inputs.split(INOUT_SEPARATOR)
            for file in input_list:
                self.get_file_from_object_storage(file.strip())

        subprocess.call(['tar', '-zxvf', archive_file])
        duration = time.time() - t0
        OpUtil.log_operation_info("dependencies processed", duration)

    def process_outputs(self) -> None:
        """Process outputs

        If outputs have been specified, it will upload the appropriate files to object storage

        This method can be overridden by subclasses, although overrides should first
        call the superclass method.
        """
        OpUtil.log_operation_info('processing outputs')
        t0 = time.time()
        outputs = self.input_params.get('outputs')
        if outputs:
            output_list = outputs.split(INOUT_SEPARATOR)
            for file in output_list:
                self.process_output_file(file.strip())
            duration = time.time() - t0
            OpUtil.log_operation_info('outputs processed', duration)
        else:
            OpUtil.log_operation_info('No outputs found in this operation')

    def get_object_storage_filename(self, filename: str) -> str:
        """Function to pre-pend cloud storage working dir to file name

        :param filename: the local file
        :return: the full path of the object storage file
        """
        return os.path.join(self.input_params.get('cos-directory', ''), filename)

    def get_file_from_object_storage(self, file_to_get: str) -> None:
        """Utility function to get files from an object storage

        :param file_to_get: filename
        """

        object_to_get = self.get_object_storage_filename(file_to_get)
        t0 = time.time()
        self.cos_client.fget_object(bucket_name=self.cos_bucket,
                                    object_name=object_to_get,
                                    file_path=file_to_get)
        duration = time.time() - t0
        OpUtil.log_operation_info(f"downloaded {file_to_get} from bucket: {self.cos_bucket}, object: {object_to_get}",
                                  duration)

    def put_file_to_object_storage(self, file_to_upload: str, object_name: Optional[str] = None) -> None:
        """Utility function to put files into an object storage

        :param file_to_upload: filename
        :param object_name: remote filename (used to rename)
        """

        object_to_upload = object_name
        if not object_to_upload:
            object_to_upload = file_to_upload

        object_to_upload = self.get_object_storage_filename(object_to_upload)
        t0 = time.time()
        self.cos_client.fput_object(bucket_name=self.cos_bucket,
                                    object_name=object_to_upload,
                                    file_path=file_to_upload)
        duration = time.time() - t0
        OpUtil.log_operation_info(f"uploaded {file_to_upload} to bucket: {self.cos_bucket} object: {object_to_upload}",
                                  duration)

    def has_wildcard(self, filename):
        wildcards = ['*', '?']
        return bool(any(c in filename for c in wildcards))

    def process_output_file(self, output_file):
        """Puts the file to object storage.  Handles wildcards and directories. """

        matched_files = [output_file]
        if self.has_wildcard(output_file):  # explode the wildcarded file
            matched_files = glob.glob(output_file)

        for matched_file in matched_files:
            if os.path.isdir(matched_file):
                for file in os.listdir(matched_file):
                    self.process_output_file(os.path.join(matched_file, file))
            else:
                self.put_file_to_object_storage(matched_file)


class NotebookFileOp(FileOpBase):
    """Perform Notebook File Operation"""

    def execute(self) -> None:
        """Execute the Notebook and upload results to object storage"""
        notebook = os.path.basename(self.filepath)
        notebook_name = notebook.replace('.ipynb', '')
        notebook_output = notebook_name + '-output.ipynb'
        notebook_html = notebook_name + '.html'

        try:
            OpUtil.log_operation_info(f"executing notebook using 'papermill {notebook} {notebook_output}'")
            t0 = time.time()
            # Really hate to do this but have to invoke Papermill via library as workaround
            import papermill
            papermill.execute_notebook(notebook, notebook_output)
            duration = time.time() - t0
            OpUtil.log_operation_info("notebook execution completed", duration)

            NotebookFileOp.convert_notebook_to_html(notebook_output, notebook_html)
            self.put_file_to_object_storage(notebook_output, notebook)
            self.put_file_to_object_storage(notebook_html)
            self.process_outputs()
        except Exception as ex:
            # log in case of errors
            logger.error("Unexpected error: {}".format(sys.exc_info()[0]))

            NotebookFileOp.convert_notebook_to_html(notebook_output, notebook_html)
            self.put_file_to_object_storage(notebook_output, notebook)
            self.put_file_to_object_storage(notebook_html)
            raise ex

    @staticmethod
    def convert_notebook_to_html(notebook_file: str, html_file: str) -> str:
        """Function to convert a Jupyter notebook file (.ipynb) into an html file

        :param notebook_file: object storage client
        :param html_file: name of what the html output file should be
        :return: html_file: the converted notebook in html format
        """
        import nbconvert
        import nbformat

        OpUtil.log_operation_info(f"converting from {notebook_file} to {html_file}")
        t0 = time.time()
        nb = nbformat.read(notebook_file, as_version=4)
        html_exporter = nbconvert.HTMLExporter()
        data, resources = html_exporter.from_notebook_node(nb)
        with open(html_file, "w") as f:
            f.write(data)
            f.close()

        duration = time.time() - t0
        OpUtil.log_operation_info(f"{notebook_file} converted to {html_file}", duration)
        return html_file


class PythonFileOp(FileOpBase):
    """Perform Python File Operation"""

    def execute(self) -> None:
        """Execute the Python script and upload results to object storage"""
        python_script = os.path.basename(self.filepath)
        python_script_name = python_script.replace('.py', '')
        python_script_output = python_script_name + '.log'

        try:
            OpUtil.log_operation_info(f"executing python script using "
                                      f"'python3 {python_script}' to '{python_script_output}'")
            t0 = time.time()
            with open(python_script_output, "w") as log_file:
                subprocess.run(['python3', python_script], stdout=log_file, stderr=subprocess.STDOUT, check=True)

            duration = time.time() - t0
            OpUtil.log_operation_info("python script execution completed", duration)

            self.put_file_to_object_storage(python_script_output, python_script_output)
            self.process_outputs()
        except Exception as ex:
            # log in case of errors
            logger.error("Unexpected error: {}".format(sys.exc_info()[0]))
            logger.error("Error details: {}".format(ex))

            self.put_file_to_object_storage(python_script_output, python_script_output)
            raise ex


class RFileOp(FileOpBase):
    """Perform R File Operation"""

    def execute(self) -> None:
        """Execute the R script and upload results to object storage"""
        r_script = os.path.basename(self.filepath)
        r_script_name = r_script.replace('.r', '')
        r_script_output = r_script_name + '.log'

        try:
            OpUtil.log_operation_info(f"executing R script using "
                                      f"'Rscript {r_script}' to '{r_script_output}'")
            t0 = time.time()
            with open(r_script_output, "w") as log_file:
                subprocess.run(['Rscript', r_script], stdout=log_file, stderr=subprocess.STDOUT, check=True)

            duration = time.time() - t0
            OpUtil.log_operation_info("R script execution completed", duration)

            self.put_file_to_object_storage(r_script_output, r_script_output)
            self.process_outputs()
        except Exception as ex:
            # log in case of errors
            logger.error("Unexpected error: {}".format(sys.exc_info()[0]))
            logger.error("Error details: {}".format(ex))

            self.put_file_to_object_storage(r_script_output, r_script_output)
            raise ex


class OpUtil(object):
    """Utility functions for preparing file execution."""
    @classmethod
    def package_install(cls) -> None:
        OpUtil.log_operation_info("Installing packages")
        t0 = time.time()
        elyra_packages = cls.package_list_to_dict("requirements-elyra.txt")
        current_packages = cls.package_list_to_dict("requirements-current.txt")
        to_install_list = []

        for package, ver in elyra_packages.items():
            if package in current_packages:
                if "git+" in current_packages[package]:
                    logger.warning(f"WARNING: Source package {package} found already installed from "
                                   f"{current_packages[package]}. This may conflict with the required "
                                   f"version: {ver} . Skipping...")
                elif isinstance(version.parse(current_packages[package]), version.LegacyVersion):
                    logger.warning(f"WARNING: Package {package} found with unsupported Legacy version "
                                   f"scheme {current_packages[package]} already installed. Skipping...")
                elif version.parse(ver) > version.parse(current_packages[package]):
                    logger.info(f"Updating {package} package from version {current_packages[package]} to {ver}...")
                    to_install_list.append(package + '==' + ver)
                elif version.parse(ver) < version.parse(current_packages[package]):
                    logger.info(f"Newer {package} package with version {current_packages[package]} "
                                f"already installed. Skipping...")
            else:
                logger.info(f"Package not found. Installing {package} package with version {ver}...")
                to_install_list.append(package + '==' + ver)

        if to_install_list:
            subprocess.run([sys.executable, '-m', 'pip', 'install'] + to_install_list, check=True)

        subprocess.run([sys.executable, '-m', 'pip', 'freeze'])
        duration = time.time() - t0
        OpUtil.log_operation_info("Packages installed", duration)

    @classmethod
    def package_list_to_dict(cls, filename: str) -> dict:
        package_dict = {}
        with open(filename) as fh:
            for line in fh:
                if line[0] != '#':
                    if " @ " in line:
                        package_name, package_version = line.strip('\n').split(sep=" @ ")
                    elif "===" in line:
                        package_name, package_version = line.strip('\n').split(sep="===")
                    else:
                        package_name, package_version = line.strip('\n').split(sep="==")

                    package_dict[package_name] = package_version

        return package_dict

    @classmethod
    def parse_arguments(cls, args) -> dict:
        import argparse
        global pipeline_name, operation_name

        logger.debug("Parsing Arguments.....")
        parser = argparse.ArgumentParser()
        parser.add_argument('-e', '--cos-endpoint', dest="cos-endpoint", help='Cloud object storage endpoint',
                            required=True)
        parser.add_argument('-b', '--cos-bucket', dest="cos-bucket", help='Cloud object storage bucket to use',
                            required=True)
        parser.add_argument('-d', '--cos-directory', dest="cos-directory",
                            help='Working directory in cloud object storage bucket to use', required=True)
        parser.add_argument('-t', '--cos-dependencies-archive', dest="cos-dependencies-archive",
                            help='Archive containing notebook and dependency artifacts', required=True)
        parser.add_argument('-f', '--file', dest="filepath", help='File to execute', required=True)
        parser.add_argument('-o', '--outputs', dest="outputs", help='Files to output to object store', required=False)
        parser.add_argument('-i', '--inputs', dest="inputs", help='Files to pull in from parent node', required=False)
        parsed_args = vars(parser.parse_args(args))

        # cos-directory is the pipeline name, set as global
        pipeline_name = parsed_args.get('cos-directory')
        # operation/node name is the basename of the non-suffixed filepath, set as global
        operation_name = os.path.basename(os.path.splitext(parsed_args.get('filepath'))[0])

        return parsed_args

    @classmethod
    def log_operation_info(cls, action_clause: str, duration_secs: Optional[float] = None) -> None:
        """Produces a formatted log INFO message used entirely for support purposes.

        This method is intended to be called for any entries that should be captured across aggregated
        log files to identify steps within a given pipeline and each of its operations.  As a result,
        calls to this method should produce single-line entries in the log (no embedded newlines).
        Each entry is prefixed with the pipeline name.

        General logging should NOT use this method but use logger.<level>() statements directly.

        :param action_clause: str representing the action that is being logged
        :param duration_secs: optional float value representing the duration of the action being logged
        """
        global pipeline_name, operation_name
        if enable_pipeline_info:
            duration_clause = f"({duration_secs:.3f} secs)" if duration_secs else ""
            logger.info(f"'{pipeline_name}':'{operation_name}' - {action_clause} {duration_clause}")


def main():
    # Configure logger format, level
    logging.basicConfig(format='[%(levelname)1.1s %(asctime)s.%(msecs).03d] %(message)s',
                        datefmt='%H:%M:%S',
                        level=logging.INFO)
    # Setup packages and gather arguments
    input_params = OpUtil.parse_arguments(sys.argv[1:])
    OpUtil.log_operation_info("starting operation")
    t0 = time.time()
    OpUtil.package_install()

    # Create the appropriate instance, process dependencies and execute the operation
    file_op = FileOpBase.get_instance(**input_params)

    file_op.process_dependencies()

    file_op.execute()

    duration = time.time() - t0
    OpUtil.log_operation_info("operation completed", duration)


if __name__ == '__main__':
    main()
