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


class Operation(object):

    def __init__(self, id, type, filename, runtime_image, env_vars=None, dependencies=None,
                 include_subdirectories=False, outputs=None, inputs=None, parent_operations=None):

        # validate that the operation has all required properties
        if not id:
            raise ValueError("Invalid pipeline: Missing field 'operation id'.")
        if not type:
            raise ValueError("Invalid pipeline: Missing field 'operation type'.")
        if not filename:
            raise ValueError("Invalid pipeline: Missing field 'operation filename'.")
        if not runtime_image:
            raise ValueError("Invalid pipeline: Missing field 'operation runtime image'.")

        self._id = id
        self._type = type
        self._filename = filename
        self._runtime_image = runtime_image
        self._env_vars = self.__initialize_empty_array_if_none(env_vars)
        self._dependencies = self.__initialize_empty_array_if_none(dependencies)
        self._include_subdirectories = include_subdirectories
        self._outputs = self.__initialize_empty_array_if_none(outputs)
        self._inputs = self.__initialize_empty_array_if_none(inputs)
        self._parent_operations = self.__initialize_empty_array_if_none(parent_operations)

    @property
    def id(self):
        return self._id

    @property
    def type(self):
        return self._type

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
    def env_vars(self):
        return self._env_vars

    @property
    def dependencies(self):
        return self._dependencies

    @property
    def include_subdirectories(self):
        return self._include_subdirectories

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
    def parent_operations(self):
        return self._parent_operations

    def __eq__(self, other: object) -> bool:
        if isinstance(self, other.__class__):
            return self.id == other.id and \
                self.type == other.type and \
                self.filename == other.filename and \
                self.runtime_image == other.runtime_image and \
                self.env_vars == other.env_vars and \
                self.dependencies == other.dependencies and \
                self.include_subdirectories == other.include_subdirectories and \
                self.outputs == other.outputs and \
                self.inputs == other.inputs and \
                self.parent_operations == other.parent_operations

    @staticmethod
    def __initialize_empty_array_if_none(value):
        if value:
            return value
        else:
            return []


class Pipeline(object):

    def __init__(self, id, name, runtime, runtime_config):

        if not name:
            raise ValueError('Invalid pipeline: Missing name.')
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
            return self.name == other.name and \
                self.runtime_type == other.runtime_type and \
                self.runtime_config == other.runtime_config and \
                self.operations == other.operations
