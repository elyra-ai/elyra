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
import string
from typing import Dict
from typing import List
from typing import Optional

from kfp.dsl import ContainerOp
from kubernetes.client.models import V1EmptyDirVolumeSource
from kubernetes.client.models import V1EnvVar
from kubernetes.client.models import V1EnvVarSource
from kubernetes.client.models import V1ObjectFieldSelector
from kubernetes.client.models import V1Volume
from kubernetes.client.models import V1VolumeMount

from elyra._version import __version__

"""
The ExecuteFileOp uses a python script to bootstrap the user supplied image with the required dependencies.
In order for the script run properly, the image used, must at a minimum, have the 'curl' utility available
and have python3
"""

# Inputs and Outputs separator character.  If updated,
# same-named variable in bootstrapper.py must be updated!
INOUT_SEPARATOR = ';'

ELYRA_GITHUB_ORG = os.getenv("ELYRA_GITHUB_ORG", "elyra-ai")
ELYRA_GITHUB_BRANCH = os.getenv("ELYRA_GITHUB_BRANCH", "master" if 'dev' in __version__ else "v" + __version__)
ELYRA_PIP_CONFIG_URL = os.getenv('ELYRA_PIP_CONFIG_URL', 'https://raw.githubusercontent.com/{org}/elyra/'
                                                         '{branch}/etc/kfp/pip.conf'.
                                                         format(org=ELYRA_GITHUB_ORG, branch=ELYRA_GITHUB_BRANCH))
ELYRA_BOOTSTRAP_SCRIPT_URL = os.getenv('ELYRA_BOOTSTRAP_SCRIPT_URL', 'https://raw.githubusercontent.com/{org}/'
                                                                     'elyra/{branch}/elyra/kfp/bootstrapper.py'.
                                                                     format(org=ELYRA_GITHUB_ORG,
                                                                            branch=ELYRA_GITHUB_BRANCH))
ELYRA_REQUIREMENTS_URL = os.getenv('ELYRA_REQUIREMENTS_URL', 'https://raw.githubusercontent.com/{org}/'
                                                             'elyra/{branch}/etc/generic/requirements-elyra.txt'.
                                                             format(org=ELYRA_GITHUB_ORG,
                                                                    branch=ELYRA_GITHUB_BRANCH))


class ExecuteFileOp(ContainerOp):

    def __init__(self,
                 pipeline_name: str,
                 experiment_name: str,
                 notebook: str,
                 cos_endpoint: str,
                 cos_bucket: str,
                 cos_directory: str,
                 cos_dependencies_archive: str,
                 pipeline_version: Optional[str] = '',
                 pipeline_source: Optional[str] = None,
                 pipeline_outputs: Optional[List[str]] = None,
                 pipeline_inputs: Optional[List[str]] = None,
                 pipeline_envs: Optional[Dict[str, str]] = None,
                 requirements_url: Optional[str] = None,
                 bootstrap_script_url: Optional[str] = None,
                 emptydir_volume_size: Optional[str] = None,
                 cpu_request: Optional[str] = None,
                 mem_request: Optional[str] = None,
                 gpu_limit: Optional[str] = None,
                 workflow_engine: Optional[str] = 'argo',
                 **kwargs):
        """Create a new instance of ContainerOp.
        Args:
          pipeline_name: pipeline that this op belongs to
          experiment_name: the experiment where pipeline_name is executed
          notebook: name of the notebook that will be executed per this operation
          cos_endpoint: object storage endpoint e.g weaikish1.fyre.ibm.com:30442
          cos_bucket: bucket to retrieve archive from
          cos_directory: name of the directory in the object storage bucket to pull
          cos_dependencies_archive: archive file name to get from object storage bucket e.g archive1.tar.gz
          pipeline_version: optional version identifier
          pipeline_source: pipeline source
          pipeline_outputs: comma delimited list of files produced by the notebook
          pipeline_inputs: comma delimited list of files to be consumed/are required by the notebook
          pipeline_envs: dictionary of environmental variables to set in the container prior to execution
          requirements_url: URL to a python requirements.txt file to be installed prior to running the notebook
          bootstrap_script_url: URL to a custom python bootstrap script to run
          emptydir_volume_size: Size(GB) of the volume to create for the workspace when using CRIO container runtime
          cpu_request: number of CPUs requested for the operation
          mem_request: memory requested for the operation (in Gi)
          gpu_limit: maximum number of GPUs allowed for the operation
          workflow_engine: Kubeflow workflow engine, defaults to 'argo'
          kwargs: additional key value pairs to pass e.g. name, image, sidecars & is_exit_handler.
                  See Kubeflow pipelines ContainerOp definition for more parameters or how to use
                  https://kubeflow-pipelines.readthedocs.io/en/latest/source/kfp.dsl.html#kfp.dsl.ContainerOp
        """

        self.pipeline_name = pipeline_name
        self.pipeline_version = pipeline_version
        self.pipeline_source = pipeline_source
        self.experiment_name = experiment_name
        self.notebook = notebook
        self.notebook_name = os.path.basename(notebook)
        self.cos_endpoint = cos_endpoint
        self.cos_bucket = cos_bucket
        self.cos_directory = cos_directory
        self.cos_dependencies_archive = cos_dependencies_archive
        self.container_work_dir_root_path = "./"
        self.container_work_dir_name = "jupyter-work-dir/"
        self.container_work_dir = self.container_work_dir_root_path + self.container_work_dir_name
        self.bootstrap_script_url = bootstrap_script_url
        self.requirements_url = requirements_url
        self.pipeline_outputs = pipeline_outputs
        self.pipeline_inputs = pipeline_inputs
        self.pipeline_envs = pipeline_envs
        self.cpu_request = cpu_request
        self.mem_request = mem_request
        self.gpu_limit = gpu_limit

        argument_list = []

        """ CRI-o support for kfp pipelines
            We need to attach an emptydir volume for each notebook that runs since CRI-o runtime does not allow
            us to write to the base image layer file system, only to volumes.
        """
        self.emptydir_volume_name = "workspace"
        self.emptydir_volume_size = emptydir_volume_size
        self.python_user_lib_path = ''
        self.python_user_lib_path_target = ''
        self.python_pip_config_url = ''

        if self.emptydir_volume_size:
            self.container_work_dir_root_path = "/opt/app-root/src/"
            self.container_python_dir_name = "python3/"
            self.container_work_dir = self.container_work_dir_root_path + self.container_work_dir_name
            self.python_user_lib_path = self.container_work_dir + self.container_python_dir_name
            self.python_user_lib_path_target = '--target=' + self.python_user_lib_path
            self.python_pip_config_url = ELYRA_PIP_CONFIG_URL

        if not self.bootstrap_script_url:
            self.bootstrap_script_url = ELYRA_BOOTSTRAP_SCRIPT_URL

        if not self.requirements_url:
            self.requirements_url = ELYRA_REQUIREMENTS_URL

        if 'name' not in kwargs:
            raise TypeError("You need to provide a name for the operation.")
        elif not kwargs.get('name'):
            raise ValueError("You need to provide a name for the operation.")

        if 'image' not in kwargs:
            raise ValueError("You need to provide an image.")

        if not notebook:
            raise ValueError("You need to provide a notebook.")

        if 'arguments' not in kwargs:
            """ If no arguments are passed, we use our own.
                If ['arguments'] are set, we assume container's ENTRYPOINT is set and dependencies are installed
                NOTE: Images being pulled must have python3 available on PATH and cURL utility
            """

            argument_list.append('mkdir -p {container_work_dir} && cd {container_work_dir} && '
                                 'curl -H "Cache-Control: no-cache" -L {bootscript_url} --output bootstrapper.py && '
                                 'curl -H "Cache-Control: no-cache" -L {reqs_url} --output requirements-elyra.txt && '
                                 .format(container_work_dir=self.container_work_dir,
                                         bootscript_url=self.bootstrap_script_url,
                                         reqs_url=self.requirements_url)
                                 )

            if self.emptydir_volume_size:
                argument_list.append('mkdir {container_python_dir} && cd {container_python_dir} && '
                                     'curl -H "Cache-Control: no-cache" -L {python_pip_config_url} '
                                     '--output pip.conf && cd .. &&'
                                     .format(python_pip_config_url=self.python_pip_config_url,
                                             container_python_dir=self.container_python_dir_name)
                                     )

            argument_list.append('python3 -m pip install {python_user_lib_path_target} packaging && '
                                 'python3 -m pip freeze > requirements-current.txt && '
                                 'python3 bootstrapper.py '
                                 '--cos-endpoint {cos_endpoint} '
                                 '--cos-bucket {cos_bucket} '
                                 '--cos-directory "{cos_directory}" '
                                 '--cos-dependencies-archive "{cos_dependencies_archive}" '
                                 '--file "{notebook}" '
                                 .format(cos_endpoint=self.cos_endpoint,
                                         cos_bucket=self.cos_bucket,
                                         cos_directory=self.cos_directory,
                                         cos_dependencies_archive=self.cos_dependencies_archive,
                                         notebook=self.notebook,
                                         python_user_lib_path_target=self.python_user_lib_path_target)
                                 )

            if self.pipeline_inputs:
                inputs_str = self._artifact_list_to_str(self.pipeline_inputs)
                argument_list.append('--inputs "{}" '.format(inputs_str))

            if self.pipeline_outputs:
                outputs_str = self._artifact_list_to_str(self.pipeline_outputs)
                argument_list.append('--outputs "{}" '.format(outputs_str))

            if self.emptydir_volume_size:
                argument_list.append('--user-volume-path "{}" '.format(self.python_user_lib_path))

            kwargs['command'] = ['sh', '-c']
            kwargs['arguments'] = "".join(argument_list)

        super().__init__(**kwargs)

        # We must deal with the envs after the superclass initialization since these amend the
        # container attribute that isn't available until now.
        if self.pipeline_envs:
            for key, value in self.pipeline_envs.items():  # Convert dict entries to format kfp needs
                self.container.add_env_variable(V1EnvVar(name=key, value=value))

        # If crio volume size is found then assume kubeflow pipelines environment is using CRI-o as
        # its container runtime
        if self.emptydir_volume_size:
            self.add_volume(V1Volume(empty_dir=V1EmptyDirVolumeSource(
                                     medium="",
                                     size_limit=self.emptydir_volume_size),
                            name=self.emptydir_volume_name))

            self.container.add_volume_mount(V1VolumeMount(mount_path=self.container_work_dir_root_path,
                                                          name=self.emptydir_volume_name))

            # Append to PYTHONPATH location of elyra dependencies in installed in Volume
            self.container.add_env_variable(V1EnvVar(name='PYTHONPATH',
                                                     value=self.python_user_lib_path))

        if self.cpu_request:
            self.container.set_cpu_request(cpu=str(cpu_request))

        if self.mem_request:
            self.container.set_memory_request(memory=str(mem_request) + "G")

        if self.gpu_limit:
            gpu_vendor = self.pipeline_envs.get('GPU_VENDOR', 'nvidia')
            self.container.set_gpu_limit(gpu=str(gpu_limit), vendor=gpu_vendor)

        # Generate unique ELYRA_RUN_NAME value and expose it as an environment
        # variable in the container
        if workflow_engine and workflow_engine.lower() == 'argo':
            run_name_placeholder = '{{workflow.annotations.pipelines.kubeflow.org/run_name}}'
            self.container.add_env_variable(V1EnvVar(name='ELYRA_RUN_NAME',
                                                     value=run_name_placeholder))
        else:
            # For Tekton derive the value from the specified pod annotation
            annotation = 'pipelines.kubeflow.org/run_name'
            field_path = f"metadata.annotations['{annotation}']"
            self.container.add_env_variable(V1EnvVar(name='ELYRA_RUN_NAME',
                                                     value_from=V1EnvVarSource(
                                                         field_ref=V1ObjectFieldSelector(field_path=field_path))))

        # Attach metadata to the pod
        # Node type (a static type for this op)
        self.add_pod_label('elyra/node-type',
                           ExecuteFileOp._normalize_label_value(
                               'notebook-script'))
        # Pipeline name
        self.add_pod_label('elyra/pipeline-name',
                           ExecuteFileOp._normalize_label_value(self.pipeline_name))
        # Pipeline version
        self.add_pod_label('elyra/pipeline-version',
                           ExecuteFileOp._normalize_label_value(self.pipeline_version))
        # Experiment name
        self.add_pod_label('elyra/experiment-name',
                           ExecuteFileOp._normalize_label_value(self.experiment_name))
        # Pipeline node name
        self.add_pod_label('elyra/node-name',
                           ExecuteFileOp._normalize_label_value(kwargs.get('name')))
        # Pipeline node file
        self.add_pod_annotation('elyra/node-file-name',
                                self.notebook)

        # Identify the pipeline source, which can be a
        # pipeline file (mypipeline.pipeline), a Python
        # script or notebook that was submitted
        if self.pipeline_source is not None:
            self.add_pod_annotation('elyra/pipeline-source',
                                    self.pipeline_source)

    def _artifact_list_to_str(self, pipeline_array):
        trimmed_artifact_list = []
        for artifact_name in pipeline_array:
            if INOUT_SEPARATOR in artifact_name:  # if INOUT_SEPARATOR is in name, throw since this is our separator
                raise \
                    ValueError("Illegal character ({}) found in filename '{}'.".format(INOUT_SEPARATOR, artifact_name))
            trimmed_artifact_list.append(artifact_name.strip())
        return INOUT_SEPARATOR.join(trimmed_artifact_list)

    @staticmethod
    def _normalize_label_value(value):

        """Produce a Kubernetes-compliant label from value

        Valid label values must be 63 characters or less and
        must be empty or begin and end with an alphanumeric
        character ([a-z0-9A-Z]) with dashes (-), underscores
        (_), dots (.), and alphanumerics between.
        """

        if value is None or len(value) == 0:
            return ''   # nothing to do

        max_length = 63
        # This char is added at the front and/or back
        # of value, if the first and/or last character
        # is invalid. For example a value of "-abc"
        # is converted to "a-abc". The specified character
        # must meet the label value constraints.
        valid_char = 'a'
        # This char is used to replace invalid characters
        # that are in the "middle" of value. For example
        # a value of "abc%def" is converted to "abc_def".
        # The specified character must meet the label value
        # constraints.
        valid_middle_char = '_'

        # must begin with [0-9a-zA-Z]
        valid_chars = string.ascii_letters + string.digits
        if value[0] not in valid_chars:
            value = valid_char + value

        value = value[:max_length]  # enforce max length

        # must end with [0-9a-zA-Z]
        if value[-1] not in valid_chars:
            if len(value) <= max_length - 1:
                # append valid character if max length
                # would not be exceeded
                value = value + valid_char
            else:
                # replace with valid character
                value = value[:-1] + valid_char

        # middle chars must be [0-9a-zA-Z\-_.]
        valid_chars = valid_chars + '-_.'

        newstr = ''
        for c in range(len(value)):
            if value[c] not in valid_chars:
                newstr = newstr + valid_middle_char
            else:
                newstr = newstr + value[c]
        value = newstr

        return value
