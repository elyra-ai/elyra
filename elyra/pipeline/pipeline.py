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
from typing import Dict, Optional


class Operation(object):
    """
    Represents a single operation in a pipeline
    """

    def __init__(self, id, type, classifier, filename, runtime_image, memory=None, cpu=None, gpu=None,
                 dependencies=None, include_subdirectories: bool = False, env_vars=None, inputs=None, outputs=None,
                 parent_operations=None):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
                   e.g. 123e4567-e89b-12d3-a456-426614174000
        :param type: The type of node e.g. execution_node
        :param classifier: classifier for processor execution e.g. Argo
        :param filename: The relative path to the source file in the users local environment
                         to be executed e.g. path/to/file.ext
        :param runtime_image: The DockerHub image to be used for the operation
                               e.g. user/docker_image_name:tag
        :param dependencies: List of local files/directories needed for the operation to run
                             and packaged into each operation's dependency archive
        :param include_subdirectories: Include or Exclude subdirectories when packaging our 'dependencies'
        :param env_vars: List of Environmental variables to set in the docker image
                         e.g. FOO="BAR"
        :param inputs: List of files to be consumed by this operation, produced by parent operation(s)
        :param outputs: List of files produced by this operation to be included in a child operation(s)
        :param parent_operations: List of parent operation 'ids' required to execute prior to this operation
        :param cpu: number of cpus requested to run the operation
        :param memory: amount of memory requested to run the operation (in Gi)
        :param gpu: number of gpus requested to run the operation
        """

        # validate that the operation has all required properties
        if not id:
            raise ValueError("Invalid pipeline operation: Missing field 'operation id'.")
        if not type:
            raise ValueError("Invalid pipeline operation: Missing field 'operation type'.")
        if not classifier:
            raise ValueError("Invalid pipeline operation: Missing field 'operation classifier'.")
        if not filename:
            raise ValueError("Invalid pipeline operation: Missing field 'operation filename'.")
        if not runtime_image:
            raise ValueError("Invalid pipeline operation: Missing field 'operation runtime image'.")

        self._id = id
        self._type = type
        self._classifier = classifier
        self._filename = filename
        self._runtime_image = runtime_image
        self._dependencies = dependencies or []
        self._include_subdirectories = include_subdirectories
        self._env_vars = env_vars or []
        self._inputs = inputs or []
        self._outputs = outputs or []
        self._parent_operations = parent_operations or []
        self._cpu = cpu
        self._gpu = gpu
        self._memory = memory

    @property
    def id(self):
        return self._id

    @property
    def type(self):
        return self._type

    @property
    def classifier(self):
        return self._classifier

    @property
    def name(self):
        return os.path.basename(self._filename).split(".")[0]

    @property
    def filename(self):
        return self._filename

    @property
    def runtime_image(self):
        return self._runtime_image

    @property
    def dependencies(self):
        return self._dependencies

    @property
    def include_subdirectories(self):
        return self._include_subdirectories

    @property
    def env_vars(self):
        return self._env_vars

    @property
    def cpu(self):
        return self._cpu

    @property
    def memory(self):
        return self._memory

    @property
    def gpu(self):
        return self._gpu

    def env_vars_as_dict(self, logger: Optional[object] = None) -> Dict:
        """Operation stores environment variables in a list of name=value pairs, while
           subprocess.run() requires a dictionary - so we must convert.  If no envs are
           configured on the Operation, the existing env is returned, otherwise envs
           configured on the Operation are overlayed on the existing env.
        """
        envs = {}
        for nv in self.env_vars:
            if nv and len(nv) > 0:
                nv_pair = nv.split("=")
                if len(nv_pair) == 2 and nv_pair[0].strip():
                    envs[nv_pair[0]] = nv_pair[1]
                else:
                    if logger:
                        logger.warning(f"Could not process environment variable entry `{nv}`, skipping...")
                    else:
                        print(f"Could not process environment variable entry `{nv}`, skipping...")
        return envs

    @property
    def inputs(self):
        return self._inputs

    @inputs.setter
    def inputs(self, value):
        self._inputs = value

    @property
    def outputs(self):
        return self._outputs

    @outputs.setter
    def outputs(self, value):
        self._outputs = value

    @property
    def parent_operations(self):
        return self._parent_operations

    def __eq__(self, other: object) -> bool:
        if isinstance(self, other.__class__):
            return self.id == other.id and \
                self.type == other.type and \
                self.classifier == other.classifier and \
                self.filename == other.filename and \
                self.runtime_image == other.runtime_image and \
                self.env_vars == other.env_vars and \
                self.dependencies == other.dependencies and \
                self.include_subdirectories == other.include_subdirectories and \
                self.outputs == other.outputs and \
                self.inputs == other.inputs and \
                self.parent_operations == other.parent_operations and \
                self.cpu == other.cpu and \
                self.gpu == other.gpu and \
                self.memory == other.memory

    def __str__(self) -> str:
        return "componentID : {id} \n " \
               "name : {name} \n " \
               "parent_operations : {parent_op} \n " \
               "dependencies : {depends} \n " \
               "dependencies include subdirectories : {inc_subdirs} \n " \
               "filename : {filename} \n " \
               "inputs : {inputs} \n " \
               "outputs : {outputs} \n " \
               "image : {image} \n " \
               "gpu: {gpu} \n " \
               "memory: {memory} \n " \
               "cpu : {cpu} \n ".format(id=self.id,
                                        name=self.name,
                                        parent_op=self.parent_operations,
                                        depends=self.dependencies,
                                        inc_subdirs=self.include_subdirectories,
                                        filename=self.filename,
                                        inputs=self.inputs,
                                        outputs=self.outputs,
                                        image=self.runtime_image,
                                        gpu=self.gpu,
                                        cpu=self.cpu,
                                        memory=self.memory)


class Pipeline(object):
    """
    Represents a single pipeline constructed in the pipeline editor
    """

    def __init__(self, id, name, runtime, runtime_config):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
                   e.g. 123e4567-e89b-12d3-a456-426614174000
        :param name: Pipeline name
                     e.g. test-pipeline-123456
        :param runtime: Type of runtime we want to use to execute our pipeline
                        e.g. kfp OR airflow
        :param runtime_config: Runtime configuration that should be used to submit the pipeline to execution
        """

        if not name:
            raise ValueError('Invalid pipeline: Missing pipeline name.')
        if not runtime:
            raise ValueError('Invalid pipeline: Missing runtime.')
        if not runtime_config:
            raise ValueError('Invalid pipeline: Missing runtime configuration.')

        self._id = id
        self._name = name
        self._runtime = runtime
        self._runtime_config = runtime_config
        self._operations = {}

    @property
    def id(self):
        return self._id

    @property
    def name(self):
        return self._name

    @property
    def runtime(self):
        """
        Describe the runtime type where the pipeline will be executed
        """
        return self._runtime

    @property
    def runtime_config(self):
        """
        Describe the runtime configuration that should be used to submit the pipeline to execution
        """
        return self._runtime_config

    @property
    def operations(self):
        return self._operations

    def __eq__(self, other: object) -> bool:
        if isinstance(self, other.__class__):
            return self.id == other.id and \
                self.name == other.name and \
                self.runtime == other.runtime and \
                self.runtime_config == other.runtime_config and \
                self.operations == other.operations
