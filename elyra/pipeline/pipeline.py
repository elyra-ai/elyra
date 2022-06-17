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
import os
import sys
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import KUBERNETES_SECRETS
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.pipeline_constants import RUNTIME_IMAGE
from elyra.pipeline.pipeline_definition import Node
from elyra.pipeline.pipeline_utilities import KeyValueList
from elyra.pipeline.pipeline_utilities import KubernetesSecret
from elyra.pipeline.pipeline_utilities import VolumeMount

# TODO: Make pipeline version available more widely
# as today is only available on the pipeline editor
PIPELINE_CURRENT_VERSION = 7
PIPELINE_CURRENT_SCHEMA = 3.0


class Operation(object):
    """
    Represents a single operation in a pipeline representing a third-party component
    """

    generic_node_types = ["execute-notebook-node", "execute-python-node", "execute-r-node"]

    @classmethod
    def create_instance(cls, node: Node, super_node: Node = None) -> "Operation":
        """Class method that creates the appropriate instance of Operation based on inputs."""

        if Operation.is_generic_operation(node.op):
            return GenericOperation(node, super_node)
        return Operation(node, super_node)

    def __init__(self, node: Node, super_node: Node = None):
        """
        :param node: Node object to be parsed to create corresponding Operation object
        :param super_node: Node object used to build the list of dependencies (parent operations)

        The Node object is used to generate an Operation object with the following attributes:

        id: The generated UUID, 128 bit number used as a unique identifier, taken from node.id,
            e.g. 123e4567-e89b-12d3-a456-426614174000
        type: The type of node, taken from node.type, e.g. execution_node
        classifier: indicates the operation's class; taken from node.op
        name: The name of the operation as given in node.label
        parent_operation_ids: List of parent operation 'ids' required to execute prior to this operation
        component_params: dictionary of parameter key:value pairs that are used in the creation of
            a non-standard operation instance
        mounted_volumes: volumes to be mounted in this node
        """
        self._id = node.id
        self._type = node.type
        self._classifier = node.op
        self._name = node.label

        # Validate that the operation has all required properties
        if not self._id:
            raise ValueError("Invalid pipeline operation: Missing field 'operation id'.")
        if not self._type:
            raise ValueError("Invalid pipeline operation: Missing field 'operation type'.")
        if not self._classifier:
            raise ValueError("Invalid pipeline operation: Missing field 'operation classifier'.")
        if not self._name:
            raise ValueError("Invalid pipeline operation: Missing field 'operation name'.")

        self._parent_operation_ids = Operation._get_parent_operation_links(node.to_dict())  # parse link dependencies
        if super_node:  # gather parent-links tied to embedded nodes inputs
            self._parent_operation_ids.extend(Operation._get_parent_operation_links(super_node.to_dict(), node.id))

        node_params = node.get("component_parameters", {})
        self._component_params = node_params
        self._doc = None

        # Scrub the inputs and outputs lists
        self._component_params["inputs"] = Operation._scrub_list(node_params.get("inputs", []))
        self._component_params["outputs"] = Operation._scrub_list(node_params.get("outputs", []))

        # Mounted volumes exist in the app_data dict for custom components
        self._mounted_volumes = Operation._scrub_list(node.get(MOUNTED_VOLUMES, []))

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
    def component_params(self) -> Optional[Dict[str, Any]]:
        return self._component_params

    @property
    def component_params_as_dict(self) -> Dict[str, Any]:
        return self._component_params or {}

    @property
    def mounted_volumes(self) -> List[VolumeMount]:
        return self._mounted_volumes

    @property
    def inputs(self) -> Optional[List[str]]:
        return self._component_params.get("inputs")

    @inputs.setter
    def inputs(self, value: List[str]):
        self._component_params["inputs"] = value

    @property
    def outputs(self) -> Optional[List[str]]:
        return self._component_params.get("outputs")

    @outputs.setter
    def outputs(self, value: List[str]):
        self._component_params["outputs"] = value

    @property
    def is_generic(self) -> bool:
        return isinstance(self, GenericOperation)

    def __eq__(self, other: "Operation") -> bool:
        if isinstance(self, other.__class__):
            return (
                self.id == other.id
                and self.type == other.type
                and self.classifier == other.classifier
                and self.name == other.name
                and self.parent_operation_ids == other.parent_operation_ids
                and self.component_params == other.component_params
            )
        return False

    def __str__(self) -> str:
        params = ""
        for key, value in self.component_params_as_dict.items():
            params += f"\t{key}: {value}, \n"

        return (
            f"componentID : {self.id} \n "
            f"name : {self.name} \n "
            f"parent_operation_ids : {self.parent_operation_ids} \n "
            f"component_parameters: {{\n{params}}} \n"
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

    @staticmethod
    def _get_port_node_id(link: Dict) -> [None, str]:
        """
        Gets the id of the node corresponding to the linked out port.
        If the link is on a super_node the appropriate node_id is actually
        embedded in the port_id_ref value.
        """
        node_id = None
        if "port_id_ref" in link:
            if link["port_id_ref"] == "outPort":  # Regular execution node
                if "node_id_ref" in link:
                    node_id = link["node_id_ref"]
            elif link["port_id_ref"].endswith("_outPort"):  # Super node
                # node_id_ref is the super-node, but the prefix of port_id_ref, is the actual node-id
                node_id = link["port_id_ref"].split("_")[0]
        return node_id

    @staticmethod
    def _get_input_node_ids(node_input: Dict) -> List[str]:
        """
        Gets a list of node_ids corresponding to the linked out ports on the input node.
        """
        input_node_ids = []
        if "links" in node_input:
            for link in node_input["links"]:
                node_id = Operation._get_port_node_id(link)
                if node_id:
                    input_node_ids.append(node_id)
        return input_node_ids

    @staticmethod
    def _get_parent_operation_links(node: Dict, embedded_node_id: Optional[str] = None) -> List[str]:
        """
        Gets a list nodes_ids corresponding to parent nodes (outputs directed to this node).
        For super_nodes, the node to use has an id of the embedded_node_id suffixed with '_inPort'.
        """
        links = []
        if "inputs" in node:
            for node_input in node["inputs"]:
                if embedded_node_id:  # node is a super_node, handle matches to {embedded_node_id}_inPort
                    input_id = node_input.get("id")
                    if input_id == embedded_node_id + "_inPort":
                        links.extend(Operation._get_input_node_ids(node_input))
                else:
                    links.extend(Operation._get_input_node_ids(node_input))
        return links


class GenericOperation(Operation):
    """
    Represents a single operation in a pipeline representing a generic (built-in) component
    """

    def __init__(self, node: Node, super_node: Node = None):
        """
        :param node: Node object to be parsed to create corresponding Operation object
        :param super_node: Node object used to build the list of dependencies (parent operations)

        The Node object is used to generate an Operation object with the following attributes:

        id: The generated UUID, 128 bit number used as a unique identifier, taken from node.id,
            e.g. 123e4567-e89b-12d3-a456-426614174000
        type: The type of node, taken from node.type, e.g. execution_node
        classifier: indicates the operation's class; taken from node.op
        name: The name of the operation as given in node.label
        parent_operation_ids: List of parent operation 'ids' required to execute prior to this operation
        component_params: dictionary of parameter key:value pairs that are used in the creation of
            a non-standard operation instance

        Component_params for "generic components" (i.e., those with one of the following classifier values:
        ["execute-notebook-node", "execute-python-node", "execute-r-node"]) can expect to have the following
        entries.
                filename: The relative path to the source file in the users local environment
                         to be executed e.g. path/to/file.ext
                runtime_image: The DockerHub image to be used for the operation
                               e.g. user/docker_image_name:tag
                dependencies: List of local files/directories needed for the operation to run
                             and packaged into each operation's dependency archive
                include_subdirectories: Include or Exclude subdirectories when packaging our 'dependencies'
                env_vars: List of Environmental variables to set in the container image
                         e.g. FOO="BAR"
                inputs: List of files to be consumed by this operation, produced by parent operation(s)
                outputs: List of files produced by this operation to be included in a child operation(s)
                cpu: number of cpus requested to run the operation
                memory: amount of memory requested to run the operation (in Gi)
                gpu: number of gpus requested to run the operation
                mounted_volumes: volumes to be mounted in this node
                kubernetes_secrets: Kubernetes secrets to make available as env vars to this node
        Entries for other (non-built-in) component types are a function of the respective component.
        """

        super().__init__(node, super_node)

        if not self.filename:
            raise ValueError("Invalid pipeline operation: Missing field 'operation filename'.")
        if not self.runtime_image:
            raise ValueError("Invalid pipeline operation: Missing field 'operation runtime image'.")
        if self.cpu and not self._validate_range(self.cpu, min_value=1):
            raise ValueError("Invalid pipeline operation: CPU must be a positive value or None")
        if self.gpu and not self._validate_range(self.gpu, min_value=0):
            raise ValueError("Invalid pipeline operation: GPU must be a positive value or None")
        if self.memory and not self._validate_range(self.memory, min_value=1):
            raise ValueError("Invalid pipeline operation: Memory must be a positive value or None")

        # Re-build certain values to include defaults
        self._component_params["dependencies"] = Operation._scrub_list(self.dependencies)
        self._component_params["include_subdirectories"] = self.include_subdirectories or False
        self._component_params[ENV_VARIABLES] = KeyValueList(Operation._scrub_list(self.env_vars))
        self._component_params[KUBERNETES_SECRETS] = self.kubernetes_secrets or []

        # Mounted volumes exist in the component_params dict for generic components
        self._component_params[MOUNTED_VOLUMES] = self.mounted_volumes or []

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
        return self._component_params.get("filename")

    @property
    def runtime_image(self) -> str:
        return self._component_params.get(RUNTIME_IMAGE)

    @property
    def dependencies(self) -> Optional[List[str]]:
        return self._component_params.get("dependencies")

    @property
    def include_subdirectories(self) -> Optional[bool]:
        return self._component_params.get("include_subdirectories")

    @property
    def env_vars(self) -> Optional[KeyValueList]:
        return self._component_params.get(ENV_VARIABLES)

    @property
    def cpu(self) -> Optional[str]:
        return self._component_params.get("cpu")

    @property
    def memory(self) -> Optional[str]:
        return self._component_params.get("memory")

    @property
    def gpu(self) -> Optional[str]:
        return self._component_params.get("gpu")

    @property
    def mounted_volumes(self) -> List[VolumeMount]:
        return self._component_params.get(MOUNTED_VOLUMES)

    @property
    def kubernetes_secrets(self) -> List[KubernetesSecret]:
        return self._component_params.get(KUBERNETES_SECRETS)

    def __eq__(self, other: "GenericOperation") -> bool:
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
        runtime_config: str,
        source: Optional[str] = None,
        description: Optional[str] = None,
        pipeline_parameters: Optional[Dict[str, Any]] = None,
    ):
        """
        :param id: Generated UUID, 128 bit number used as a unique identifier
            e.g. 123e4567-e89b-12d3-a456-426614174000
        :param name: Pipeline name, e.g. test-pipeline-123456
        :param runtime: Type of runtime we want to use to execute our pipeline, e.g. kfp OR airflow
        :param runtime_config: Runtime configuration that should be used to submit the pipeline to execution
        :param source: The pipeline source, e.g. a pipeline file or a notebook.
        :param description: Pipeline description
        :param pipeline_parameters: Key/value pairs representing the parameters of this pipeline
        """

        if not name:
            raise ValueError("Invalid pipeline: Missing pipeline name.")
        if not runtime:
            raise ValueError("Invalid pipeline: Missing runtime.")
        if not runtime_config:
            raise ValueError("Invalid pipeline: Missing runtime configuration.")

        self._id = id
        self._name = name
        self._description = description
        self._source = source
        self._runtime = runtime
        self._runtime_config = runtime_config
        self._pipeline_parameters = pipeline_parameters or {}
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
    def pipeline_parameters(self) -> Dict[str, Any]:
        """
        The dictionary of global parameters associated with each node of the pipeline
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
        if isinstance(self, other.__class__):
            return (
                self.id == other.id
                and self.name == other.name
                and self.source == other.source
                and self.description == other.description
                and self.runtime == other.runtime
                and self.runtime_config == other.runtime_config
                and self.operations == other.operations
            )
