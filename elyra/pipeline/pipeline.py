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


class Operation:

    def __init__(self, id, type, title, artifact, image, vars=None, file_dependencies=None,
                 recursive_dependencies=False, outputs=None, inputs=None, dependencies=None):
        self._id = id
        self._type = type
        self._title = title
        self._artifact = artifact
        self._image = image
        self._vars = self.__initialize_empty_array_if_none(vars)
        self._file_dependencies = self.__initialize_empty_array_if_none(file_dependencies)
        self._recursive_dependencies = recursive_dependencies
        self._outputs = self.__initialize_empty_array_if_none(outputs)
        self._inputs = self.__initialize_empty_array_if_none(inputs)
        self._dependencies = self.__initialize_empty_array_if_none(dependencies)

    @property
    def id(self):
        return self._id

    @property
    def type(self):
        return self._type

    @property
    def title(self):
        return self._title

    @property
    def artifact(self):
        return self._artifact

    @property
    def artifact_filename(self):
        return os.path.basename(self._artifact)

    @property
    def artifact_name(self):
        return os.path.basename(self._artifact).split(".")[0]

    @property
    def image(self):
        return self._image

    @property
    def vars(self):
        return self._vars

    @property
    def file_dependencies(self):
        return self._file_dependencies

    @property
    def recursive_dependencies(self):
        return self._recursive_dependencies

    @property
    def outputs(self):
        return self._outputs

    @property
    def inputs(self):
        return self._inputs

    @inputs.setter
    def inputs(self, value):
        self._inputs = value

    @property
    def dependencies(self):
        return self._dependencies

    def __eq__(self, other: object) -> bool:
        if isinstance(self, other.__class__):
            return self.id == other.id and \
                self.type == other.type and \
                self.title == other.title and \
                self.artifact == other.artifact and \
                self.image == other.image and \
                self.vars == other.vars and \
                self.file_dependencies == other.file_dependencies and \
                self.recursive_dependencies == other.recursive_dependencies and \
                self.outputs == other.outputs and \
                self.inputs == other.inputs and \
                self.dependencies == other.dependencies

    @staticmethod
    def __initialize_empty_array_if_none(value):
        if value:
            return value
        else:
            return []


class Pipeline:

    def __init__(self, id, title, runtime, runtime_config):
        self._id = id
        self._title = title
        self._runtime = runtime
        self._runtime_config = runtime_config
        self._operations = {}

    @property
    def id(self):
        return self._id

    @property
    def title(self):
        return self._title

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
            return self.title == other.title and \
                self.runtime_type == other.runtime_type and \
                self.runtime_config == other.runtime_config and \
                self.operations == other.operations
