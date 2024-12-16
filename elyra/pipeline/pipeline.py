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
from __future__ import annotations

import os
import sys
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import PIPELINE_PARAMETERS
from elyra.pipeline.pipeline_constants import RUNTIME_IMAGE
from elyra.pipeline.properties import ElyraPropertyList
from elyra.pipeline.properties import EnvironmentVariable

# TODO: Make pipeline version available more widely
# as today is only available on the pipeline editor
PIPELINE_CURRENT_VERSION = 8
PIPELINE_CURRENT_SCHEMA = 3.0


class Operation(object):
    """
    Represents a single operation in a pipeline representing a third-party component
    """

    generic_node_types = ["execute-notebook-node", "execute-python-node", "execute-r-node"]

    @classmethod
    def create_instance(
        cls,
        id: str,
        type: str,
        name: str,
        classifier: str,
        parent_operation_ids: Optional[List[str]] = None,
        component_props: Optional[Dict[str, Any]] = None,
        elyra_props: Optional[Dict[str, Any]] = None,
    ) -> Operation:
        """Class method that creates the appropriate instance of Operation based on inputs."""

        if Operation.is_generic_operation(classifier):
            return GenericOperation(id, type, name, classifier, parent_operation_ids, component_props, elyra_props)
        return Operation(id, type, name, classifier, parent_operation_ids, component_props, elyra_props)

    def __init__(
        self,
        id: str,
        type: str,
        name: str,
        classifier: str,
        parent_operation_ids: Optional[List[str]] = None,
        component_props: Optional[Dict[str, Any]] = None,
        elyra_props: Optional[Dict[str, Any]] = None,
    ):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier, e.g. 123e4567-e89b-12d3-a456-426614174000
        :param type: The type of node e.g. execution_node
        :param classifier: indicates the operation's class
        :param name: The name of the operation
        :param parent_operation_ids: List of parent operation 'ids' required to execute prior to this operation
        :param component_props: dictionary of property key:value pairs that are used in the creation of a
            non-Generic operation instance
        :param elyra_props: dictionary of property key:value pairs that are owned by Elyra
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
        self._component_props = component_props or {}
        self._elyra_props = elyra_props or {}
        self._doc = None

        # Scrub the inputs and outputs lists
        self._component_props["inputs"] = Operation._scrub_list(component_props.get("inputs", []))
        self._component_props["outputs"] = Operation._scrub_list(component_props.get("outputs", []))

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

    @name.setter
    def name(self, value: str):
        self._name = value

    @property
    def doc(self) -> str:
        return self._doc

    @doc.setter
    def doc(self, value: str):
        self._doc = value

    @property
    def parent_operation_ids(self) -> List[str]:
        return self._parent_operation_ids

    @property
    def component_props(self) -> Optional[Dict[str, Any]]:
        return self._component_props

    @property
    def component_props_as_dict(self) -> Dict[str, Any]:
        return self._component_props or {}

    @property
    def elyra_props(self) -> Optional[Dict[str, Any]]:
        return self._elyra_props or {}

    @property
    def inputs(self) -> Optional[List[str]]:
        return self._component_props.get("inputs")

    @inputs.setter
    def inputs(self, value: List[str]):
        self._component_props["inputs"] = value

    @property
    def outputs(self) -> Optional[List[str]]:
        return self._component_props.get("outputs")

    @property
    def is_generic(self) -> bool:
        return isinstance(self, GenericOperation)

    @outputs.setter
    def outputs(self, value: List[str]):
        self._component_props["outputs"] = value

    def __eq__(self, other: Operation) -> bool:
        if isinstance(self, other.__class__):
            return (
                self.id == other.id
                and self.type == other.type
                and self.classifier == other.classifier
                and self.name == other.name
                and self.parent_operation_ids == other.parent_operation_ids
                and self.component_props == other.component_props
            )
        return False

    def __str__(self) -> str:
        props = ""
        for key, value in self.component_props_as_dict.items():
            props += f"\t{key}: {value}, \n"

        return (
            f"componentID : {self.id} \n "
            f"name : {self.name} \n "
            f"parent_operation_ids : {self.parent_operation_ids} \n "
            f"component_properties: {{\n{props}}} \n"
        )

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
    def is_generic_operation(operation_classifier) -> bool:
        return operation_classifier in Operation.generic_node_types


class GenericOperation(Operation):
    """
    Represents a single operation in a pipeline representing a generic (built-in) component
    """

    def __init__(
        self,
        id: str,
        type: str,
        name: str,
        classifier: str,
        parent_operation_ids: Optional[List[str]] = None,
        component_props: Optional[Dict[str, Any]] = None,
        elyra_props: Optional[Dict[str, Any]] = None,
    ):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
                   e.g. 123e4567-e89b-12d3-a456-426614174000
        :param type: The type of node e.g. execution_node
        :param classifier: indicates the operation's class
        :param name: The name of the operation
        :param parent_operation_ids: List of parent operation 'ids' required to execute prior to this operation
        :param component_props: dictionary of property key:value pairs that are used in the creation of a
                                 a non-standard operation instance

        component_props for "generic components" (i.e., those with one of the following classifier values:
        ["execute-notebook-node", "execute-python-node", "execute-r-node"]) can expect to have the following
        entries.
                filename: The relative path to the source file in the users local environment
                         to be executed e.g. path/to/file.ext
                runtime_image: The DockerHub image to be used for the operation
                               e.g. user/docker_image_name:tag
                dependencies: List of local files/directories needed for the operation to run
                             and packaged into each operation's dependency archive
                include_subdirectories: Include or Exclude subdirectories when packaging our 'dependencies'
                env_vars: List of Environmental variables to set in the container image, e.g. FOO="BAR"
                inputs: List of files to be consumed by this operation, produced by parent operation(s)
                outputs: List of files produced by this operation to be included in a child operation(s)
                cpu: number of cpus requested to run the operation
                memory: amount of memory requested to run the operation (in Gi)
                cpu_limit: limit of number of cpus to run the operation
                memory_limit: limit of amount of memory to run the operation (in Gi)
                gpu: number of gpus requested to run the operation
                parameters: a list of names of pipeline parameters that should be passed to this operation
                gpu_vendor: gpu resource type, eg. nvidia.com/gpu, amd.com/gpu etc.
        Entries for other (non-built-in) component types are a function of the respective component.

        :param elyra_props: dictionary of property key:value pairs that are owned by Elyra
        """

        super().__init__(id, type, name, classifier, parent_operation_ids, component_props, elyra_props)

        if not component_props.get("filename"):
            raise ValueError("Invalid pipeline operation: Missing field 'operation filename'.")
        if not component_props.get("runtime_image"):
            raise ValueError("Invalid pipeline operation: Missing field 'operation runtime image'.")
        if component_props.get("cpu") and not self._validate_range(component_props.get("cpu"), min_value=1):
            raise ValueError("Invalid pipeline operation: CPU request must be a positive value or None")
        if component_props.get("cpu_limit") and not self._validate_range(component_props.get("cpu_limit"), min_value=1):
            raise ValueError("Invalid pipeline operation: CPU limit must be a positive value or None")
        if component_props.get("gpu") and not self._validate_range(component_props.get("gpu"), min_value=0):
            raise ValueError("Invalid pipeline operation: GPU must be a positive value or None")
        if component_props.get("memory") and not self._validate_range(component_props.get("memory"), min_value=1):
            raise ValueError("Invalid pipeline operation: Memory request must be a positive value or None")
        if component_props.get("memory_limit") and not self._validate_range(
            component_props.get("memory_limit"), min_value=1
        ):
            raise ValueError("Invalid pipeline operation: Memory limit must be a positive value or None")
        if (
            component_props.get("memory_limit")
            and component_props.get("memory")
            and component_props.get("memory_limit") < component_props.get("memory")
        ):
            raise ValueError("Invalid pipeline operation: Memory limit must be equal or larger than memory request")
        if (
            component_props.get("cpu_limit")
            and component_props.get("cpu")
            and component_props.get("cpu_limit") < component_props.get("cpu")
        ):
            raise ValueError("Invalid pipeline operation: CPU limit must be equal or larger than CPU request")

        # Re-build object to include default values
        self._component_props["filename"] = component_props.get("filename")
        self._component_props["runtime_image"] = component_props.get("runtime_image")
        self._component_props["dependencies"] = Operation._scrub_list(component_props.get("dependencies", []))
        self._component_props["include_subdirectories"] = component_props.get("include_subdirectories", False)
        self._component_props["cpu"] = component_props.get("cpu")
        self._component_props["cpu_limit"] = component_props.get("cpu_limit")
        self._component_props["memory"] = component_props.get("memory")
        self._component_props["memory_limit"] = component_props.get("memory_limit")
        self._component_props["gpu"] = component_props.get("gpu")
        self._component_props["gpu_vendor"] = component_props.get("gpu_vendor")
        self._component_props["parameters"] = component_props.get(PIPELINE_PARAMETERS, [])

        if not elyra_props:
            elyra_props = {}
        self._elyra_props["env_vars"] = ElyraPropertyList(elyra_props.get(ENV_VARIABLES, []))

    @property
    def name(self) -> str:
        if self._name == os.path.basename(self.filename):
            self._name = os.path.basename(self._name).split(".")[0]
        return self._name

    @name.setter
    def name(self, value):
        self._name = value

    @property
    def filename(self) -> str:
        return self._component_props.get("filename")

    @property
    def runtime_image(self) -> str:
        return self._component_props.get(RUNTIME_IMAGE)

    @property
    def dependencies(self) -> Optional[List[str]]:
        return self._component_props.get("dependencies")

    @property
    def include_subdirectories(self) -> Optional[bool]:
        return self._component_props.get("include_subdirectories")

    @property
    def env_vars(self) -> ElyraPropertyList[EnvironmentVariable]:
        return self._elyra_props.get(ENV_VARIABLES)

    @property
    def cpu(self) -> Optional[str]:
        return self._component_props.get("cpu")

    @property
    def cpu_limit(self) -> Optional[str]:
        return self._component_props.get("cpu_limit")

    @property
    def memory(self) -> Optional[str]:
        return self._component_props.get("memory")

    @property
    def memory_limit(self) -> Optional[str]:
        return self._component_props.get("memory_limit")

    @property
    def gpu(self) -> Optional[str]:
        return self._component_props.get("gpu")

    @property
    def parameters(self) -> Optional[List[str]]:
        return self._component_props.get("parameters")

    @property
    def gpu_vendor(self) -> Optional[str]:
        return self._component_props.get("gpu_vendor")

    def __eq__(self, other: GenericOperation) -> bool:
        if isinstance(self, other.__class__):
            return super().__eq__(other)
        return False

    def _validate_range(self, value: str, min_value: int = 0, max_value: int = sys.maxsize) -> bool:
        return int(value) in range(min_value, max_value)


class Pipeline(object):
    """
    Represents a single pipeline constructed in the pipeline editor
    """

    def __init__(
        self,
        id: str,
        name: str,
        runtime: str,
        runtime_config: Optional[str] = None,
        source: Optional[str] = None,
        description: Optional[str] = None,
        pipeline_properties: Optional[Dict[str, Any]] = None,
        pipeline_parameters: ElyraPropertyList = None,
    ):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
            e.g. 123e4567-e89b-12d3-a456-426614174000
        :param name: Pipeline name, e.g. test-pipeline-123456
        :param runtime: Type of runtime we want to use to execute our pipeline, e.g. kfp OR airflow
        :param runtime_config: Runtime configuration that should be used to submit the pipeline to execution
        :param source: The pipeline source, e.g. a pipeline file or a notebook.
        :param description: Pipeline description
        :param pipeline_properties: Key/value pairs representing the properties of this pipeline
        :param pipeline_parameters: an ElyraPropertyList of pipeline parameters
        """

        if not name:
            raise ValueError("Invalid pipeline: Missing pipeline name.")
        if not runtime:
            raise ValueError("Invalid pipeline: Missing runtime.")

        self._id = id
        self._name = name
        self._description = description
        self._source = source
        self._runtime = runtime
        self._runtime_config = runtime_config
        self._pipeline_properties = pipeline_properties or {}
        self._pipeline_parameters = pipeline_parameters or ElyraPropertyList([])
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
        The runtime processor name that will execute the pipeline
        """
        return self._runtime

    @property
    def runtime_config(self) -> str:
        """
        The runtime configuration that should be used to submit the pipeline for execution
        """
        return self._runtime_config

    @property
    def pipeline_properties(self) -> Dict[str, Any]:
        """
        The dictionary of global properties associated with this pipeline
        """
        return self._pipeline_properties

    @property
    def parameters(self) -> ElyraPropertyList:
        """
        The list of parameters associated with this pipeline
        """
        return self._pipeline_parameters

    @property
    def operations(self) -> Dict[str, Operation]:
        return self._operations

    @property
    def description(self) -> Optional[str]:
        """
        Pipeline description
        """
        return self._description

    def contains_generic_operations(self) -> bool:
        """
        Returns a truthy value indicating whether the pipeline contains
        one or more generic operations.
        """
        for op_id, op in self._operations.items():
            if isinstance(op, GenericOperation):
                return True
        return False

    def __eq__(self, other: "Pipeline") -> bool:
        if isinstance(other, Pipeline):
            return (
                self.id == other.id
                and self.name == other.name
                and self.source == other.source
                and self.description == other.description
                and self.runtime == other.runtime
                and self.operations == other.operations
            )
        return False
