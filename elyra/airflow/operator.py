#
# Copyright 2018-2021 Elyra Authors
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
INOUT_SEPARATOR = ';'

ELYRA_GITHUB_ORG = os.getenv("ELYRA_GITHUB_ORG", "elyra-ai")
ELYRA_GITHUB_BRANCH = os.getenv("ELYRA_GITHUB_BRANCH", "master" if 'dev' in __version__ else "v" + __version__)

ELYRA_BOOTSCRIPT_URL = os.getenv('ELYRA_BOOTSTRAP_SCRIPT_URL',
                                 'https://raw.githubusercontent.com/{org}/elyra/{branch}/elyra/airflow/bootstrapper.py'.
                                 format(org=ELYRA_GITHUB_ORG,
                                        branch=ELYRA_GITHUB_BRANCH))

ELYRA_REQUIREMENTS_URL = os.getenv('ELYRA_REQUIREMENTS_URL',
                                   'https://raw.githubusercontent.com/{org}/'
                                   'elyra/{branch}/etc/generic/requirements-elyra.txt'.
                                   format(org=ELYRA_GITHUB_ORG,
                                          branch=ELYRA_GITHUB_BRANCH))


class BootscriptBuilder(object):

    def __init__(self,
                 filename: str,
                 cos_endpoint: str,
                 cos_bucket: str,
                 cos_directory: str,
                 cos_dependencies_archive: str,
                 inputs: Optional[List[str]] = None,
                 outputs: Optional[List[str]] = None):
        """
        This helper builder constructs the bootstrapping arguments to be used as the driver for
        elyra's generic components in Apache Airflow
        :param filename: name of the file to execute
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
        self.outputs = outputs
        self.inputs = inputs
        self.container_work_dir_root_path = "./"
        self.container_work_dir_name = "jupyter-work-dir/"
        self.container_work_dir = self.container_work_dir_root_path + self.container_work_dir_name

        if not filename:
            raise ValueError("You need to provide a filename for the operation.")

    @property
    def container_cmd(self):
        self.arguments = [f"mkdir -p {self.container_work_dir} && cd {self.container_work_dir} && "
                          f"curl -H 'Cache-Control: no-cache' -L {ELYRA_BOOTSCRIPT_URL} --output bootstrapper.py && "
                          f"curl -H 'Cache-Control: no-cache' -L {ELYRA_REQUIREMENTS_URL} "
                          f"--output requirements-elyra.txt && "
                          "python3 -m pip install packaging && "
                          "python3 -m pip freeze > requirements-current.txt && "
                          "python3 bootstrapper.py "
                          f"--cos-endpoint {self.cos_endpoint} "
                          f"--cos-bucket {self.cos_bucket} "
                          f"--cos-directory '{self.cos_directory}' "
                          f"--cos-dependencies-archive '{self.cos_dependencies_archive}' "
                          f"--file '{self.filename}' "]

        if self.inputs:
            inputs_str = self._artifact_list_to_str(self.inputs)
            self.arguments.append("--inputs '{}' ".format(inputs_str))

        if self.outputs:
            outputs_str = self._artifact_list_to_str(self.outputs)
            self.arguments.append("--outputs '{}' ".format(outputs_str))

        argument_string = ''.join(self.arguments)

        return argument_string

    def _artifact_list_to_str(self, pipeline_array):
        trimmed_artifact_list = []
        for artifact_name in pipeline_array:
            if INOUT_SEPARATOR in artifact_name:  # if INOUT_SEPARATOR is in name, throw since this is our separator
                raise \
                    ValueError("Illegal character ({}) found in filename '{}'.".format(INOUT_SEPARATOR, artifact_name))
            trimmed_artifact_list.append(artifact_name.strip())
        return INOUT_SEPARATOR.join(trimmed_artifact_list)
