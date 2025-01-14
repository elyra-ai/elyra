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
import os
from typing import List
from typing import Optional

from elyra._version import __version__

"""
This helper builder constructs the bootstrapping arguments to be used as the driver for elyra's generic components
in Apache Airflow
"""

# Inputs and Outputs separator character.  If updated,
# same-named variable in bootstrapper.py must be updated!
INOUT_SEPARATOR = ";"

ELYRA_GITHUB_ORG = os.getenv("ELYRA_GITHUB_ORG", "elyra-ai")
ELYRA_GITHUB_REPO = os.getenv("ELYRA_GITHUB_REPO", "elyra")
ELYRA_GITHUB_BRANCH = os.getenv("ELYRA_GITHUB_BRANCH", "main" if "dev" in __version__ else "v" + __version__)

ELYRA_BOOTSCRIPT_URL = os.getenv(
    "ELYRA_BOOTSTRAP_SCRIPT_URL",
    f"https://raw.githubusercontent.com/{ELYRA_GITHUB_ORG}/"
    f"{ELYRA_GITHUB_REPO}/{ELYRA_GITHUB_BRANCH}/elyra/airflow/bootstrapper.py",
)

ELYRA_REQUIREMENTS_URL = os.getenv(
    "ELYRA_REQUIREMENTS_URL",
    f"https://raw.githubusercontent.com/{ELYRA_GITHUB_ORG}/"
    f"{ELYRA_GITHUB_REPO}/{ELYRA_GITHUB_BRANCH}/etc/generic/requirements-elyra.txt",
)


class BootscriptBuilder(object):
    def __init__(
        self,
        filename: str,
        pipeline_name: str,
        cos_endpoint: str,
        cos_bucket: str,
        cos_directory: str,
        cos_dependencies_archive: str,
        inputs: Optional[List[str]] = None,
        outputs: Optional[List[str]] = None,
    ):
        """
        This helper builder constructs the bootstrapping arguments to be used as the driver for
        elyra's generic components in Apache Airflow
        :param filename: name of the file to execute
        :param pipeline_name: name of the pipeline
        :param :cos_endpoint: object storage endpoint e.g weaikish1.fyre.ibm.com:30442
        :param :cos_bucket: bucket to retrieve archive from
        :param :cos_directory: name of the directory in the object storage bucket to pull
        :param :cos_dependencies_archive: archive file name to get from object storage bucket e.g archive1.tar.gz
        :param inputs: comma delimited list of files to be consumed/are required by the filename
        :param outputs: comma delimited list of files produced by the filename
        """
        self.arguments = []
        self.cos_endpoint = cos_endpoint
        self.cos_bucket = cos_bucket
        self.cos_directory = cos_directory
        self.cos_dependencies_archive = cos_dependencies_archive
        self.filename = filename
        self.pipeline_name = pipeline_name
        self.outputs = outputs
        self.inputs = inputs
        self.container_work_dir_root_path = "./"
        self.container_work_dir_name = "jupyter-work-dir/"
        self.container_work_dir = self.container_work_dir_root_path + self.container_work_dir_name

        if not filename:
            raise ValueError("You need to provide a filename for the operation.")

    @property
    def container_cmd(self):
        common_curl_options = "--fail -H 'Cache-Control: no-cache'"

        self.arguments = [
            f"mkdir -p {self.container_work_dir} && cd {self.container_work_dir} && "
            f"echo 'Downloading {ELYRA_BOOTSCRIPT_URL}' && "
            f"curl {common_curl_options} -L {ELYRA_BOOTSCRIPT_URL} --output bootstrapper.py && "
            f"echo 'Downloading {ELYRA_REQUIREMENTS_URL}' && "
            f"curl {common_curl_options} -L {ELYRA_REQUIREMENTS_URL} "
            f"--output requirements-elyra.txt && "
            "python3 -m pip install packaging && "
            "python3 -m pip freeze > requirements-current.txt && "
            "python3 bootstrapper.py "
            f"--pipeline-name '{self.pipeline_name}' "
            f"--cos-endpoint {self.cos_endpoint} "
            f"--cos-bucket {self.cos_bucket} "
            f"--cos-directory '{self.cos_directory}' "
            f"--cos-dependencies-archive '{self.cos_dependencies_archive}' "
            f"--file '{self.filename}' "
        ]

        if self.inputs:
            inputs_str = self._artifact_list_to_str(self.inputs)
            self.arguments.append(f"--inputs '{inputs_str}' ")

        if self.outputs:
            outputs_str = self._artifact_list_to_str(self.outputs)
            self.arguments.append(f"--outputs '{outputs_str}' ")

        argument_string = "".join(self.arguments)

        return argument_string

    def _artifact_list_to_str(self, pipeline_array):
        trimmed_artifact_list = []
        for artifact_name in pipeline_array:
            if INOUT_SEPARATOR in artifact_name:  # if INOUT_SEPARATOR is in name, throw since this is our separator
                raise ValueError(f"Illegal character ({INOUT_SEPARATOR}) found in filename '{artifact_name}'.")
            trimmed_artifact_list.append(artifact_name.strip())
        return INOUT_SEPARATOR.join(trimmed_artifact_list)
