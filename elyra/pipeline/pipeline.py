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
from logging import Logger
import os
import sys
from typing import Any
from typing import Dict
from typing import List
from typing import Optional


class Operation(object):
    """
    Represents a single operation in a pipeline representing a third-party component
    """

    generic_node_types = ["execute-notebook-node", "execute-python-node", "execute-r-node"]

    @classmethod
    def create_instance(cls, id: str, type: str, name: str, classifier: str,
                        parent_operation_ids: Optional[List[str]] = None,
                        component_params: Optional[Dict[str, Any]] = None) -> 'Operation':
        """Class method that creates the appropriate instance of Operation based on inputs. """

        if classifier in Operation.generic_node_types:
            return GenericOperation(id, type, name, classifier,
                                    parent_operation_ids=parent_operation_ids, component_params=component_params)
        return Operation(id, type, name, classifier,
                         parent_operation_ids=parent_operation_ids, component_params=component_params)

    def __init__(self, id: str, type: str, name: str, classifier: str,
                 parent_operation_ids: Optional[List[str]] = None,
                 component_params: Optional[Dict[str, Any]] = None):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
                   e.g. 123e4567-e89b-12d3-a456-426614174000
        :param type: The type of node e.g. execution_node
        :param classifier: indicates the operation's class
        :param name: The name of the operation
        :param parent_operation_ids: List of parent operation 'ids' required to execute prior to this operation
        :param component_params: dictionary of parameter key:value pairs that are used in the creation of a
                                 a non-standard operation instance
        """

        # Validate that the operation has all required properties
        if not id:
            raise ValueError("Invalid pipeline operation: Missing field 'operation id'.")
        if not type:
            raise ValueError("Invalid pipeline operation: Missing field 'operation type'.")
        if not classifier:
            raise ValueError("Invalid pipeline operation: Missing field 'operation classifier'.")
        if not name:
            raise ValueError("Invalid pipeline operation: Missing field 'operation name'.")

        self._id = id
        self._type = type
        self._classifier = classifier
        self._name = name
        self._parent_operation_ids = parent_operation_ids or []
        self._component_params = component_params

        # Scrub the inputs and outputs lists
        self._component_params["inputs"] = Operation._scrub_list(component_params.get('inputs', []))
        self._component_params["outputs"] = Operation._scrub_list(component_params.get('outputs', []))

    @property
    def id(self) -> str:
        return self._id

    @property
    def type(self) -> str:
        return self._type

    @property
    def classifier(self) -> str:
        return self._classifier

    @property
    def name(self) -> str:
        return self._name

    @property
    def parent_operation_ids(self) -> List[str]:
        return self._parent_operation_ids

    @property
    def component_params(self) -> Optional[Dict[str, Any]]:
        return self._component_params

    @property
    def component_params_as_dict(self) -> Dict[str, Any]:
        return self._component_params or {}

    @property
    def inputs(self) -> Optional[List[str]]:
        return self._component_params.get('inputs')

    @inputs.setter
    def inputs(self, value: List[str]):
        self._component_params['inputs'] = value

    @property
    def outputs(self) -> Optional[List[str]]:
        return self._component_params.get('outputs')

    @outputs.setter
    def outputs(self, value: List[str]):
        self._component_params['outputs'] = value

    def __eq__(self, other: 'Operation') -> bool:
        if isinstance(self, other.__class__):
            return self.id == other.id and \
                self.type == other.type and \
                self.classifier == other.classifier and \
                self.name == other.name and \
                self.parent_operation_ids == other.parent_operation_ids and \
                self.component_params == other.component_params
        return False

    def __str__(self) -> str:
        params = ""
        for key, value in self.component_params_as_dict.items():
            params += f"\t{key}: {value}, \n"

        return f"componentID : {self.id} \n " \
            f"name : {self.name} \n " \
            f"parent_operation_ids : {self.parent_operation_ids} \n " \
            f"component_parameters: {{\n{params}}} \n"

    @staticmethod
    def _log_info(msg: str, logger: Optional[Logger] = None):
        if logger:
            logger.info(msg)
        else:
            print(msg)

    @staticmethod
    def _log_warning(msg: str, logger: Optional[Logger] = None):
        if logger:
            logger.warning(msg)
        else:
            print(f"WARNING: {msg}")

    @staticmethod
    def _scrub_list(dirty: Optional[List[Optional[str]]]) -> List[str]:
        """
        Clean an existing list by filtering out None and empty string values
        :param dirty: a List of values
        :return: a clean list without None or empty string values
        """
        if not dirty:
            return []
        return [clean for clean in dirty if clean]

    @staticmethod
    def is_generic_operation(operation_type) -> bool:
        return True if operation_type in Operation.generic_node_types else False


class GenericOperation(Operation):
    """
    Represents a single operation in a pipeline representing a generic (built-in) component
    """

    def __init__(self, id: str, type: str, name: str, classifier: str,
                 parent_operation_ids: Optional[List[str]] = None,
                 component_params: Optional[Dict[str, Any]] = None):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
                   e.g. 123e4567-e89b-12d3-a456-426614174000
        :param type: The type of node e.g. execution_node
        :param classifier: indicates the operation's class
        :param name: The name of the operation
        :param parent_operation_ids: List of parent operation 'ids' required to execute prior to this operation
        :param component_params: dictionary of parameter key:value pairs that are used in the creation of a
                                 a non-standard operation instance

        Component_params for "generic components" (i.e., those with one of the following classifier values:
        ["execute-notebook-node", "execute-python-node", "exeucute-r-node"]) can expect to have the following
        entries.
                filename: The relative path to the source file in the users local environment
                         to be executed e.g. path/to/file.ext
                runtime_image: The DockerHub image to be used for the operation
                               e.g. user/docker_image_name:tag
                dependencies: List of local files/directories needed for the operation to run
                             and packaged into each operation's dependency archive
                include_subdirectories: Include or Exclude subdirectories when packaging our 'dependencies'
                env_vars: List of Environmental variables to set in the docker image
                         e.g. FOO="BAR"
                inputs: List of files to be consumed by this operation, produced by parent operation(s)
                outputs: List of files produced by this operation to be included in a child operation(s)
                cpu: number of cpus requested to run the operation
                memory: amount of memory requested to run the operation (in Gi)
                gpu: number of gpus requested to run the operation
        Entries for other (non-built-in) component types are a function of the respective component.
        """

        super().__init__(id, type, name, classifier,
                         parent_operation_ids=parent_operation_ids, component_params=component_params)

        if not component_params.get('filename'):
            raise ValueError("Invalid pipeline operation: Missing field 'operation filename'.")
        if not component_params.get('runtime_image'):
            raise ValueError("Invalid pipeline operation: Missing field 'operation runtime image'.")
        if component_params.get('cpu') and not self._validate_range(component_params.get('cpu'), min_value=1):
            raise ValueError("Invalid pipeline operation: CPU must be a positive value or None")
        if component_params.get('gpu') and not self._validate_range(component_params.get('gpu'), min_value=0):
            raise ValueError("Invalid pipeline operation: GPU must be a positive value or None")
        if component_params.get('memory') and not self._validate_range(component_params.get('memory'), min_value=1):
            raise ValueError("Invalid pipeline operation: Memory must be a positive value or None")

        # Re-build object to include default values
        self._component_params["filename"] = component_params.get('filename')
        self._component_params["runtime_image"] = component_params.get('runtime_image')
        self._component_params["dependencies"] = Operation._scrub_list(component_params.get('dependencies', []))
        self._component_params["include_subdirectories"] = component_params.get('include_subdirectories', False)
        self._component_params["env_vars"] = Operation._scrub_list(component_params.get('env_vars', []))
        self._component_params["cpu"] = component_params.get('cpu')
        self._component_params["gpu"] = component_params.get('gpu')
        self._component_params["memory"] = component_params.get('memory')

    @property
    def name(self) -> str:
        if self._name == os.path.basename(self.filename):
            self._name = os.path.basename(self._name).split(".")[0]
        return self._name

    @property
    def filename(self) -> str:
        return self._component_params.get('filename')

    @property
    def runtime_image(self) -> str:
        return self._component_params.get('runtime_image')

    @property
    def dependencies(self) -> Optional[List[str]]:
        return self._component_params.get('dependencies')

    @property
    def include_subdirectories(self) -> Optional[bool]:
        return self._component_params.get('include_subdirectories')

    @property
    def env_vars(self) -> Optional[List[str]]:
        return self._component_params.get('env_vars')

    @property
    def cpu(self) -> Optional[str]:
        return self._component_params.get('cpu')

    @property
    def memory(self) -> Optional[str]:
        return self._component_params.get('memory')

    @property
    def gpu(self) -> Optional[str]:
        return self._component_params.get('gpu')

    def __eq__(self, other: 'GenericOperation') -> bool:
        if isinstance(self, other.__class__):
            return super().__eq__(other)
        return False

    def _validate_range(self, value: str, min_value: int = 0, max_value: int = sys.maxsize) -> bool:
        return int(value) in range(min_value, max_value)

    def env_vars_as_dict(self, logger: Optional[Logger] = None) -> Dict[str, str]:
        """
        Operation stores environment variables in a list of name=value pairs, while
        subprocess.run() requires a dictionary - so we must convert.  If no envs are
        configured on the Operation, an empty dictionary is returned, otherwise envs
        configured on the Operation are converted to dictionary entries and returned.
        """
        envs = {}
        for nv in self.env_vars:
            if nv:
                nv_pair = nv.split("=", 1)
                if len(nv_pair) == 2 and nv_pair[0].strip():
                    if len(nv_pair[1]) > 0:
                        envs[nv_pair[0]] = nv_pair[1]
                    else:
                        Operation._log_info(f"Skipping inclusion of environment variable: "
                                            f"`{nv_pair[0]}` has no value...",
                                            logger=logger)
                else:
                    Operation._log_warning(f"Could not process environment variable entry `{nv}`, skipping...",
                                           logger=logger)
        return envs


class Pipeline(object):
    """
    Represents a single pipeline constructed in the pipeline editor
    """

    def __init__(self, id: str, name: str, runtime: str, runtime_config: str, source: Optional[str] = None):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
                   e.g. 123e4567-e89b-12d3-a456-426614174000
        :param name: Pipeline name
                     e.g. test-pipeline-123456
        :param runtime: Type of runtime we want to use to execute our pipeline
                        e.g. kfp OR airflow
        :param runtime_config: Runtime configuration that should be used to submit the pipeline to execution
        :param source: The pipeline source, e.g. a pipeline file or a notebook.
        """

        if not name:
            raise ValueError('Invalid pipeline: Missing pipeline name.')
        if not runtime:
            raise ValueError('Invalid pipeline: Missing runtime.')
        if not runtime_config:
            raise ValueError('Invalid pipeline: Missing runtime configuration.')

        self._id = id
        self._name = name
        self._source = source
        self._runtime = runtime
        self._runtime_config = runtime_config
        self._operations = {}

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def source(self) -> str:
        return self._source

    @property
    def runtime(self) -> str:
        """
        Describe the runtime type where the pipeline will be executed
        """
        return self._runtime

    @property
    def runtime_config(self) -> str:
        """
        Describe the runtime configuration that should be used to submit the pipeline to execution
        """
        return self._runtime_config

    @property
    def operations(self) -> Dict[str, Operation]:
        return self._operations

    def __eq__(self, other: 'Pipeline') -> bool:
        if isinstance(self, other.__class__):
            return self.id == other.id and \
                self.name == other.name and \
                self.source == other.source and \
                self.runtime == other.runtime and \
                self.runtime_config == other.runtime_config and \
                self.operations == other.operations
