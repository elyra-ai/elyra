#
# Copyright 2018-2025 Elyra Authors
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
import json
import logging
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryFile
import time
from typing import Any
from typing import Dict
from typing import Optional
from typing import Type
from typing import TypeVar
from urllib.parse import urljoin
from urllib.parse import urlparse
from urllib.parse import urlunparse

from packaging import version


# Inputs and Outputs separator character.  If updated,
# same-named variable in _notebook_op.py must be updated!
INOUT_SEPARATOR = ";"

# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
F = TypeVar("F", bound="FileOpBase")

logger = logging.getLogger("elyra")
enable_pipeline_info = os.getenv("ELYRA_ENABLE_PIPELINE_INFO", "true").lower() == "true"
# not only log File Operations output of NotebookFileOp, RFileOp, PythonFileOp to stdout so it appears
# in runtime / container logs and also Airflow and KFP GUI logs, but also put output to S3 storage
enable_generic_node_script_output_to_s3 = (
    os.getenv("ELYRA_GENERIC_NODES_ENABLE_SCRIPT_OUTPUT_TO_S3", "true").lower() == "true"
)
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
        filepath = kwargs["filepath"]
        if ".ipynb" in filepath:
            return NotebookFileOp(**kwargs)
        elif ".py" in filepath:
            return PythonFileOp(**kwargs)
        elif ".r" in filepath:
            return RFileOp(**kwargs)
        else:
            raise ValueError(f"Unsupported file type: {filepath}")

    def __init__(self, **kwargs: Any) -> None:
        """Initializes the FileOpBase instance"""
        import minio
        from minio.credentials import providers

        self.filepath = kwargs["filepath"]
        self.input_params = kwargs or {}
        self.cos_endpoint = urlparse(self.input_params.get("cos-endpoint"))
        self.cos_bucket = self.input_params.get("cos-bucket")

        self.parameter_pass_method = self.input_params.get("parameter_pass_method")
        self.pipeline_param_dict = self.convert_param_str_to_dict(self.input_params.get("pipeline_parameters"))

        # Infer secure from the endpoint's scheme.
        self.secure = self.cos_endpoint.scheme == "https"

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
        self.cos_client = minio.Minio(self.cos_endpoint.netloc, secure=self.secure, credentials=cred_provider)

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
        OpUtil.log_operation_info("processing dependencies")
        t0 = time.time()
        archive_file = self.input_params.get("cos-dependencies-archive")

        self.get_file_from_object_storage(archive_file)

        inputs = self.input_params.get("inputs")
        if inputs:
            input_list = inputs.split(INOUT_SEPARATOR)
            for file in input_list:
                self.get_file_from_object_storage(file.strip())

        subprocess.call(["tar", "-zxvf", archive_file])
        duration = time.time() - t0
        OpUtil.log_operation_info("dependencies processed", duration)

    def process_outputs(self) -> None:
        """Process outputs

        If outputs have been specified, it will upload the appropriate files to object storage

        This method can be overridden by subclasses, although overrides should first
        call the superclass method.
        """
        OpUtil.log_operation_info("processing outputs")
        t0 = time.time()
        outputs = self.input_params.get("outputs")
        if outputs:
            output_list = outputs.split(INOUT_SEPARATOR)
            for file in output_list:
                self.process_output_file(file.strip())
        duration = time.time() - t0
        OpUtil.log_operation_info("outputs processed", duration)

    def process_metrics_and_metadata(self) -> None:
        """Process metrics and metadata

        This method exposes metrics/metadata that the processed
        notebook | script produces in the KFP UI.

        This method should not be overridden by subclasses.
        """

        OpUtil.log_operation_info("processing metrics and metadata")
        t0 = time.time()

        # Location where the KFP specific output files will be stored
        # in the environment where the bootsrapper is running.
        # Defaults to '/tmp' if not specified.
        output_path = Path(os.getenv("ELYRA_WRITABLE_CONTAINER_DIR", "/tmp"))

        # verify that output_path exists, is a directory
        # and writable by creating a temporary file in that location
        try:
            with TemporaryFile(mode="w", dir=output_path) as t:
                t.write("can write")
        except Exception:
            # output_path doesn't meet the requirements
            # treat this as a non-fatal error and log a warning
            logger.warning(f'Cannot create files in "{output_path}".')
            OpUtil.log_operation_info("Aborted metrics and metadata processing", time.time() - t0)
            return

        # Name of the proprietary KFP UI metadata file.
        # Notebooks | scripts might (but don't have to) produce this file
        # as documented in
        # https://www.kubeflow.org/docs/pipelines/sdk/output-viewer/
        # Each ExecuteFileOp must declare this as an output file or
        # the KFP UI won't pick up the information.
        kfp_ui_metadata_filename = "mlpipeline-ui-metadata.json"

        # Name of the proprietary KFP metadata file.
        # Notebooks | scripts might (but don't have to) produce this file
        # as documented in
        # https://www.kubeflow.org/docs/pipelines/sdk/pipelines-metrics/
        # Each ExecuteFileOp must declare this as an output file or
        # the KFP UI won't pick up the information.
        kfp_metrics_filename = "mlpipeline-metrics.json"

        # If the notebook | Python script produced one of the files
        # copy it to the target location where KFP is looking for it.
        for filename in [kfp_ui_metadata_filename, kfp_metrics_filename]:
            try:
                src = Path(".") / filename
                logger.debug(f"Processing {src} ...")
                # try to load the file, if one was created by the
                # notebook or script
                with open(src, "r") as f:
                    metadata = json.load(f)

                # the file exists and contains valid JSON
                logger.debug(f"File content: {json.dumps(metadata)}")

                target = output_path / filename
                # try to save the file in the destination location
                with open(target, "w") as f:
                    json.dump(metadata, f)
            except FileNotFoundError:
                # The script | notebook didn't produce the file
                # we are looking for. This is not an error condition
                # that needs to be handled.
                logger.debug(f"{self.filepath} produced no file named {src}")
            except ValueError as ve:
                # The file content could not be parsed. Log a warning
                # and treat this as a non-fatal error.
                logger.warning(f"Ignoring incompatible {str(src)} produced by {self.filepath}: {ve} {str(ve)}")
            except Exception as ex:
                # Something is wrong with the user-generated metadata file.
                # Log a warning and treat this as a non-fatal error.
                logger.warning(f"Error processing {str(src)} produced by {self.filepath}: {ex} {str(ex)}")

        #
        # Augment kfp_ui_metadata_filename with Elyra-specific information:
        #  - link to object storage where input and output artifacts are
        #    stored
        ui_metadata_output = output_path / kfp_ui_metadata_filename
        try:
            # re-load the file
            with open(ui_metadata_output, "r") as f:
                metadata = json.load(f)
        except Exception:
            # ignore all errors
            metadata = {}

        # Assure the 'output' property exists and is of the correct type
        if metadata.get("outputs", None) is None or not isinstance(metadata["outputs"], list):
            metadata["outputs"] = []

        # Define HREF for COS bucket:
        # <COS_URL>/<BUCKET_NAME>/<COS_DIRECTORY>
        bucket_url = urljoin(
            urlunparse(self.cos_endpoint), f"{self.cos_bucket}/{self.input_params.get('cos-directory', '')}/"
        )

        # add Elyra metadata to 'outputs'
        metadata["outputs"].append(
            {
                "storage": "inline",
                "source": f"## Inputs for {self.filepath}\n"
                f"[{self.input_params['cos-dependencies-archive']}]({bucket_url})",
                "type": "markdown",
            }
        )

        # print the content of the augmented metadata file
        logger.debug(f"Output UI metadata: {json.dumps(metadata)}")

        logger.debug(f"Saving UI metadata file as {ui_metadata_output} ...")

        # Save [updated] KFP UI metadata file
        with open(ui_metadata_output, "w") as f:
            json.dump(metadata, f)

        duration = time.time() - t0
        OpUtil.log_operation_info("metrics and metadata processed", duration)

    def get_object_storage_filename(self, filename: str) -> str:
        """Function to pre-pend cloud storage working dir to file name

        :param filename: the local file
        :return: the full path of the object storage file
        """
        return os.path.join(self.input_params.get("cos-directory", ""), filename)

    def get_file_from_object_storage(self, file_to_get: str) -> None:
        """Utility function to get files from an object storage

        :param file_to_get: filename
        """

        object_to_get = self.get_object_storage_filename(file_to_get)
        t0 = time.time()
        self.cos_client.fget_object(bucket_name=self.cos_bucket, object_name=object_to_get, file_path=file_to_get)
        duration = time.time() - t0
        OpUtil.log_operation_info(
            f"downloaded {file_to_get} from bucket: {self.cos_bucket}, object: {object_to_get}", duration
        )

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
        self.cos_client.fput_object(bucket_name=self.cos_bucket, object_name=object_to_upload, file_path=file_to_upload)
        duration = time.time() - t0
        OpUtil.log_operation_info(
            f"uploaded {file_to_upload} to bucket: {self.cos_bucket} object: {object_to_upload}", duration
        )

    def has_wildcard(self, filename):
        wildcards = ["*", "?"]
        return bool(any(c in filename for c in wildcards))

    def process_output_file(self, output_file):
        """Puts the file to object storage.  Handles wildcards and directories."""

        matched_files = [output_file]
        if self.has_wildcard(output_file):  # explode the wildcarded file
            matched_files = glob.glob(output_file)

        for matched_file in matched_files:
            if os.path.isdir(matched_file):
                for file in os.listdir(matched_file):
                    self.process_output_file(os.path.join(matched_file, file))
            else:
                self.put_file_to_object_storage(matched_file)

    def convert_param_str_to_dict(self, pipeline_parameters: Optional[str] = None) -> Dict[str, Any]:
        """Convert INOUT-separated string of pipeline parameters into a dictionary."""
        parameter_dict = {}
        if pipeline_parameters:
            parameter_list = pipeline_parameters.split(INOUT_SEPARATOR)
            for parameter in parameter_list:
                param_name, value = parameter.split("=", 1)
                if self.parameter_pass_method == "env" and (not value or not isinstance(value, str)):
                    continue  # env vars must be non-empty strings
                parameter_dict[param_name] = value
        return parameter_dict

    def set_parameters_in_env(self) -> None:
        """Make pipeline parameters available as environment variables."""
        for name, value in self.pipeline_param_dict.items():
            if name in os.environ:
                continue  # avoid overwriting env vars with the same name
            os.environ[name] = value


class NotebookFileOp(FileOpBase):
    """Perform Notebook File Operation"""

    def execute(self) -> None:
        """Execute the Notebook and upload results to object storage"""
        notebook = os.path.basename(self.filepath)
        notebook_name = notebook.replace(".ipynb", "")
        notebook_output = f"{notebook_name}-output.ipynb"
        notebook_html = f"{notebook_name}.html"

        try:
            OpUtil.log_operation_info(f"executing notebook using 'papermill {notebook} {notebook_output}'")
            t0 = time.time()
            # Include kernel selection in execution time
            kernel_name = NotebookFileOp.find_best_kernel(notebook)

            kwargs = {}
            if self.parameter_pass_method == "env":
                self.set_parameters_in_env()

            import papermill

            logger.info("Processing file: %s", notebook)
            papermill.execute_notebook(
                notebook,
                notebook_output,
                kernel_name=kernel_name,
                log_output=True,
                stdout_file=sys.stdout,
                stderr_file=sys.stderr,
                **kwargs,
            )
            duration = time.time() - t0
            OpUtil.log_operation_info("notebook execution completed", duration)

            NotebookFileOp.convert_notebook_to_html(notebook_output, notebook_html)
            if enable_generic_node_script_output_to_s3:
                self.put_file_to_object_storage(notebook_output, notebook)
                self.put_file_to_object_storage(notebook_html)
            self.process_outputs()
        except Exception as ex:
            # log in case of errors
            logger.error(f"Unexpected error: {sys.exc_info()[0]}")

            NotebookFileOp.convert_notebook_to_html(notebook_output, notebook_html)
            if enable_generic_node_script_output_to_s3:
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

    @staticmethod
    def find_best_kernel(notebook_file: str) -> str:
        """Determines the best kernel to use via the following algorithm:

        1. Loads notebook and gets kernel_name and kernel_language from NB metadata.
        2. Gets the list of configured kernels using KernelSpecManager.
        3. If notebook kernel_name is in list, use that, else
        4. If not found, load each configured kernel.json file and find a language match.
        5. On first match, log info message regarding the switch and use that kernel.
        6. If no language match is found, revert to notebook kernel and log warning message.
        """
        from jupyter_client.kernelspec import KernelSpecManager
        import nbformat

        nb = nbformat.read(notebook_file, 4)

        nb_kspec = nb.metadata.kernelspec
        nb_kernel_name = nb_kspec.get("name")
        nb_kernel_lang = nb_kspec.get("language")

        kernel_specs = KernelSpecManager().find_kernel_specs()

        # see if we have a direct match...
        if nb_kernel_name in kernel_specs.keys():
            return nb_kernel_name

        # no match found for kernel, try matching language...
        for name, file in kernel_specs.items():
            # load file (JSON) and pick out language, if match, use first found
            with open(os.path.join(file, "kernel.json")) as f:
                kspec = json.load(f)
                if kspec.get("language").lower() == nb_kernel_lang.lower():
                    matched_kernel = os.path.basename(file)
                    logger.info(
                        f"Matched kernel by language ({nb_kernel_lang}), using kernel "
                        f"'{matched_kernel}' instead of the missing kernel '{nb_kernel_name}'."
                    )
                    return matched_kernel

        # no match found for language, return notebook kernel and let execution fail
        logger.warning(
            f"Reverting back to missing notebook kernel '{nb_kernel_name}' since no "
            f"language match ({nb_kernel_lang}) was found in current kernel specifications."
        )
        return nb_kernel_name


class PythonFileOp(FileOpBase):
    """Perform Python File Operation"""

    def execute(self) -> None:
        """Execute the Python script and upload results to object storage"""
        python_script = os.path.basename(self.filepath)
        python_script_name = python_script.replace(".py", "")
        python_script_output = f"{python_script_name}.log"

        try:
            OpUtil.log_operation_info(
                f"executing python script using 'python3 {python_script}' to '{python_script_output}'"
            )
            t0 = time.time()

            run_args = ["python3", python_script]
            if self.parameter_pass_method == "env":
                self.set_parameters_in_env()

            logger.info("Processing file: %s", python_script)
            try:
                result = subprocess.run(run_args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=True)
                output = result.stdout.decode("utf-8")
                if enable_generic_node_script_output_to_s3:
                    with open(python_script_output, "w") as log_file:
                        log_file.write(output)
                logger.info("Output: %s", output)
                logger.info("Return code: %s", result.returncode)
            except subprocess.CalledProcessError as e:
                logger.error("Output: %s", e.output.decode("utf-8"))
                logger.error("Return code: %s", e.returncode)
                raise subprocess.CalledProcessError(e.returncode, run_args)

            duration = time.time() - t0
            OpUtil.log_operation_info("python script execution completed", duration)

            if enable_generic_node_script_output_to_s3:
                self.put_file_to_object_storage(python_script_output, python_script_output)
            self.process_outputs()
        except Exception as ex:
            # log in case of errors
            logger.error(f"Unexpected error: {sys.exc_info()[0]}")
            logger.error(f"Error details: {ex}")

            if enable_generic_node_script_output_to_s3:
                self.put_file_to_object_storage(python_script_output, python_script_output)
            raise ex


class RFileOp(FileOpBase):
    """Perform R File Operation"""

    def execute(self) -> None:
        """Execute the R script and upload results to object storage"""
        r_script = os.path.basename(self.filepath)
        r_script_name = r_script.replace(".r", "")
        r_script_output = f"{r_script_name}.log"

        try:
            OpUtil.log_operation_info(f"executing R script using 'Rscript {r_script}' to '{r_script_output}'")
            t0 = time.time()

            run_args = ["Rscript", r_script]
            if self.parameter_pass_method == "env":
                self.set_parameters_in_env()

            logger.info("Processing file: %s", r_script)
            try:
                result = subprocess.run(run_args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=True)
                output = result.stdout.decode("utf-8")
                if enable_generic_node_script_output_to_s3:
                    with open(r_script_output, "w") as log_file:
                        log_file.write(output)
                logger.info("Output: %s", output)
                logger.info("Return code: %s", result.returncode)
            except subprocess.CalledProcessError as e:
                logger.error("Output: %s", e.output.decode("utf-8"))
                logger.error("Return code: %s", e.returncode)
                raise subprocess.CalledProcessError(e.returncode, run_args)

            duration = time.time() - t0
            OpUtil.log_operation_info("R script execution completed", duration)

            if enable_generic_node_script_output_to_s3:
                self.put_file_to_object_storage(r_script_output, r_script_output)
            self.process_outputs()
        except Exception as ex:
            # log in case of errors
            logger.error(f"Unexpected error: {sys.exc_info()[0]}")
            logger.error(f"Error details: {ex}")

            if enable_generic_node_script_output_to_s3:
                self.put_file_to_object_storage(r_script_output, r_script_output)
            raise ex


class OpUtil(object):
    """Utility functions for preparing file execution."""

    @classmethod
    def package_install(cls, user_volume_path) -> None:
        OpUtil.log_operation_info("Installing packages")
        t0 = time.time()
        requirements_file = cls.determine_elyra_requirements()
        elyra_packages = cls.package_list_to_dict(requirements_file)
        current_packages = cls.package_list_to_dict("requirements-current.txt")
        to_install_list = []

        for package, ver in elyra_packages.items():
            if package in current_packages:
                if current_packages[package] is None:
                    logger.warning(
                        f"WARNING: Source package '{package}' found already installed as an "
                        "editable package. This may conflict with the required version: "
                        f"{ver} . Skipping..."
                    )
                    continue
                try:
                    version.Version(current_packages[package])
                except version.InvalidVersion:  # current version is not PEP-440 compliant
                    logger.warning(
                        f"WARNING: Source package '{package}' found already installed from "
                        f"{current_packages[package]}. This may conflict with the required "
                        f"version: {ver} . Skipping..."
                    )
                    continue
                if version.Version(ver) > version.Version(current_packages[package]):
                    logger.info(f"Updating {package} package from version {current_packages[package]} to {ver}...")
                    to_install_list.append(f"{package}=={ver}")
                elif version.Version(ver) < version.Version(current_packages[package]):
                    logger.info(
                        f"Newer {package} package with version {current_packages[package]} "
                        f"already installed. Skipping..."
                    )
            else:
                logger.info(f"Package not found. Installing {package} package with version {ver}...")
                to_install_list.append(f"{package}=={ver}")

        if to_install_list:
            if user_volume_path:
                to_install_list.insert(0, f"--target={user_volume_path}")
                to_install_list.append("--no-cache-dir")

            subprocess.run([sys.executable, "-m", "pip", "install"] + to_install_list, check=True)

        if user_volume_path:
            os.environ["PIP_CONFIG_FILE"] = f"{user_volume_path}/pip.conf"

        subprocess.run([sys.executable, "-m", "pip", "freeze"])
        duration = time.time() - t0
        OpUtil.log_operation_info("Packages installed", duration)

    @classmethod
    def determine_elyra_requirements(cls) -> Any:
        if sys.version_info.major == 3:
            if sys.version_info.minor in [9, 10, 11]:
                return "requirements-elyra.txt"
        logger.error(
            f"This version of Python '{sys.version_info.major}.{sys.version_info.minor}' "
            f"is not supported for Elyra generic components"
        )
        return None

    @classmethod
    def package_list_to_dict(cls, filename: str) -> dict:
        package_dict = {}
        with open(filename) as fh:
            for line in fh:
                if line[0] != "#":
                    if " @ " in line:
                        package_name, package_version = line.strip("\n").split(sep=" @ ")
                    elif "===" in line:
                        package_name, package_version = line.strip("\n").split(sep="===")
                    elif "==" in line:
                        package_name, package_version = line.strip("\n").split(sep="==")
                    elif line.startswith("-e ") or line.startswith("--editable "):
                        package_name = line.strip("\n").replace("-e ", "").replace("--editable ", "")
                        if "#egg=" in package_name:  # editable package from version control system
                            package_name = package_name.split("=")[-1]
                        elif "/" in package_name:  # editable package from local directory
                            package_name = os.path.basename(package_name)
                        package_version = None
                    else:
                        # Tolerate other formats but do not add to package list
                        continue

                    package_dict[package_name] = package_version

        return package_dict

    @classmethod
    def parse_arguments(cls, args) -> dict:
        import argparse

        global pipeline_name, operation_name

        logger.debug("Parsing Arguments.....")
        parser = argparse.ArgumentParser()
        parser.add_argument(
            "-e", "--cos-endpoint", dest="cos-endpoint", help="Cloud object storage endpoint", required=True
        )
        parser.add_argument(
            "-b", "--cos-bucket", dest="cos-bucket", help="Cloud object storage bucket to use", required=True
        )
        parser.add_argument(
            "-d",
            "--cos-directory",
            dest="cos-directory",
            help="Working directory in cloud object storage bucket to use",
            required=True,
        )
        parser.add_argument(
            "-t",
            "--cos-dependencies-archive",
            dest="cos-dependencies-archive",
            help="Archive containing notebook and dependency artifacts",
            required=True,
        )
        parser.add_argument("-f", "--file", dest="filepath", help="File to execute", required=True)
        parser.add_argument("-o", "--outputs", dest="outputs", help="Files to output to object store", required=False)
        parser.add_argument("-i", "--inputs", dest="inputs", help="Files to pull in from parent node", required=False)
        parser.add_argument(
            "-p",
            "--user-volume-path",
            dest="user-volume-path",
            help="Directory in Volume to install python libraries into",
            required=False,
        )
        parser.add_argument(
            "-n",
            "--pipeline-name",
            dest="pipeline-name",
            help="Pipeline name",
            required=True,
        )
        parser.add_argument(
            "-r",
            "--pipeline-parameters",
            dest="pipeline_parameters",
            help="Pipeline parameters that apply to this node",
            required=False,
        )
        parser.add_argument(
            "-m",
            "--parameter-pass-method",
            dest="parameter_pass_method",
            choices=["env"],
            help="The method by which pipeline parameters should be applied to this node.",
            required=False,
        )
        parsed_args = vars(parser.parse_args(args))

        # set pipeline name as global
        pipeline_name = parsed_args.get("pipeline-name")
        # operation/node name is the basename of the non-suffixed filepath, set as global
        operation_name = os.path.basename(os.path.splitext(parsed_args.get("filepath"))[0])

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
    logging.basicConfig(
        format="[%(levelname)1.1s %(asctime)s.%(msecs).03d] %(message)s", datefmt="%H:%M:%S", level=logging.DEBUG
    )
    # Setup packages and gather arguments
    input_params = OpUtil.parse_arguments(sys.argv[1:])
    OpUtil.log_operation_info("starting operation")
    t0 = time.time()
    # must be commented out in airgapped images if packages from
    # https://github.com/elyra-ai/elyra/blob/main/etc/generic/requirements-elyra.txt
    # already installed via central pip env during container build
    OpUtil.package_install(user_volume_path=input_params.get("user-volume-path"))

    # Create the appropriate instance, process dependencies and execute the operation
    file_op = FileOpBase.get_instance(**input_params)

    file_op.process_dependencies()

    file_op.execute()

    # Process notebook | script metrics and KFP UI metadata
    file_op.process_metrics_and_metadata()

    duration = time.time() - t0
    OpUtil.log_operation_info("operation completed", duration)


if __name__ == "__main__":
    main()
