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
import json
import os
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from jinja2 import Environment, Undefined
from jinja2 import PackageLoader

from elyra.pipeline.pipeline import KeyValueList
from elyra.pipeline.pipeline import KubernetesSecret
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import VolumeMount
from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import KUBERNETES_SECRETS
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.pipeline_constants import PIPELINE_DEFAULTS
from elyra.pipeline.pipeline_constants import PIPELINE_META_PROPERTIES


class AppDataBase(object):  # ABC
    """
    An abstraction for app_data based nodes
    """

    _node: Dict = None

    def __init__(self, node: Dict):
        """
        Constructor with the node json structure
        :param node: the node json
        """
        self._node = node

    @property
    def id(self) -> str:
        """
        The node id
        :return: the node unique identifier
        """
        return self._node.get("id")

    def get(self, key: str, default_value=None) -> Any:
        """
        Retrieve node values for a given key.
        These key/value pairs are stored in the app_data stanza
        :param key: The key to be retrieved
        :param default_value: a default value in case the key is not found
        :return: the value or the default_value if the key is not found
        """
        return self._node["app_data"].get(key, default_value)

    def set(self, key: str, value: Any):
        """
        Update node values for a given key.
        These key/value pairs are stored in the app_data stanza
        :param key: The key to be set
        :param value: The value to be set
        """
        if not key:
            raise ValueError("Key is required")

        if not value:
            raise ValueError("Value is required")

        self._node["app_data"][key] = value

    def to_dict(self) -> Dict:
        return self._node


class Pipeline(AppDataBase):
    _nodes: list = None

    def __init__(self, node: Dict):
        """
        The constructor with pipeline json structure
        :param node: the node pipeline
        """
        super().__init__(node)

    @property
    def version(self) -> int:
        """
        The pipeline version
        :return: The version
        """
        return int(self._node["app_data"].get("version"))

    @property
    def runtime(self) -> str:
        """The runtime processor name associated with the pipeline.

        NOTE: This value should really be derived from runtime_config.
        :return: The runtime keyword
        """
        return self._node["app_data"].get("runtime")

    @property
    def runtime_config(self) -> str:
        """The runtime configuration associated with the pipeline.

        :return: The runtime configuration key. This should be a valid key from the Runtimes metadata
        """
        return self._node["app_data"].get("runtime_config")

    @property
    def type(self):
        """The runtime type.

        NOTE: This value should really be derived from runtime_config.
        :return: The runtime_type keyword associated with the pipeline.
        """
        return self._node["app_data"].get("runtime_type")

    @property
    def name(self) -> str:
        """
        The pipeline name
        :rtype: The pipeline name or `untitled`
        """
        return self._node["app_data"].get("name", self._node["app_data"].get("properties", {}).get("name", "untitled"))

    @property
    def source(self) -> str:
        """
        The pipeline source
        :rtype: The pipeline source
        """
        return self._node["app_data"].get("source")

    @property
    def nodes(self) -> list:
        """
        The list of nodes for the pipeline
        :rtype: object
        """
        if "nodes" not in self._node:
            raise ValueError("Pipeline is missing 'nodes' field.")

        if self._nodes is None:
            nodes: list = list()
            for node in self._node["nodes"]:
                nodes.append(Node(node))

            self._nodes = nodes

        return self._nodes

    @property
    def comments(self) -> list:
        """
        The list of user comments in the pipeline
        :rtype: list of comments
        """
        return self._node["app_data"]["ui_data"].get("comments", [])

    @property
    def pipeline_parameters(self) -> Dict[str, Any]:
        """
        Retrieve pipeline parameters, which are defined as all
        key/value pairs in the 'properties' stanza that are not
        either pipeline meta-properties (e.g. name, description,
        and runtime) or the pipeline defaults dictionary
        """
        all_properties = self._node["app_data"].get("properties", {})
        excluded_properties = PIPELINE_META_PROPERTIES + [PIPELINE_DEFAULTS]

        pipeline_parameters = {}
        for property_name, value in all_properties.items():
            if property_name not in excluded_properties:
                pipeline_parameters[property_name] = value

        return pipeline_parameters

    def get_property(self, key: str, default_value=None) -> Any:
        """
        Retrieve pipeline values for a given key.
        :param key: the key to be retrieved
        :param default_value: a default value in case the key is not found
        :return: the value or the default_value if the key is not found
        """
        return_value = default_value
        if "properties" in self._node["app_data"]:
            return_value = self._node["app_data"]["properties"].get(key, default_value)

        return return_value

    def set_property(self, key: str, value: Any):
        """
        Update pipeline values for a given key.
        :param key: the key to be set
        :param value: the value to be set
        """
        if not key:
            raise ValueError("Key is required")

        if not value:
            raise ValueError("Value is required")

        self._node["app_data"]["properties"][key] = value

    def convert_kv_properties(self, kv_properties: List[str]):
        """
        Convert pipeline defaults-level list properties that have been identified
        as sets of key-value pairs from a plain list type to the KeyValueList type.
        """
        pipeline_defaults = self.get_property(PIPELINE_DEFAULTS, {})
        for property_name, value in pipeline_defaults.items():
            if property_name not in kv_properties:
                continue

            # Replace plain list with KeyValueList
            pipeline_defaults[property_name] = KeyValueList(value)

        if pipeline_defaults:
            self.set_property(PIPELINE_DEFAULTS, pipeline_defaults)


class Node(AppDataBase):
    def __init__(self, node: Dict):
        super().__init__(node)

    @property
    def type(self) -> str:
        """
        The node type
        :return: type (e.g. execution_node, super_node)
        """
        return self._node.get("type")

    @property
    def op(self) -> str:
        """
        The node op, which identify the operation to be executed
        :return: op (e.g. execute-notebook-node)
        """
        return self._node.get("op")

    @property
    def label(self) -> str:
        """
        The node label
        :return:  node label
        """
        return self._node["app_data"]["ui_data"].get("label", self._node["app_data"].get("label", None))

    @property
    def subflow_pipeline_id(self) -> Pipeline:
        """
        The Super Node pipeline reference. Only available when type is a super node.
        :return:
        """
        if self._node["type"] != "super_node":
            raise ValueError("Node must be a super_node in order to retrieve a subflow pipeline id")

        if "subflow_ref" in self._node:
            return self._node["subflow_ref"].get("pipeline_id_ref")
        else:
            return None

    @property
    def component_links(self) -> List:
        """
        Retrieve component links to other components.
        :return: the list of links associated with this node or an empty list if none are found
        """
        if self.type in ["execution_node", "super_node"]:
            return self._node["inputs"][0].get("links", [])
        else:
            #  binding nodes do not contain links
            return []

    @property
    def component_source(self) -> Optional[str]:
        """
        Retrieve the component source path.
        :return: None, if the node is a generic component, the component path otherwise.
        """
        if self.type == "execution_node":
            return self._node["app_data"].get("component_source", None)
        return None

    def get_component_parameter(self, key: str, default_value=None) -> Any:
        """
        Retrieve component parameter values.
        These key/value pairs are stored in app_data.component_parameters
        :param key: the parameter key to be retrieved
        :param default_value: a default value in case the key is not found
        :return: the value or the default value if the key is not found
        """
        value = self._node["app_data"]["component_parameters"].get(key, default_value)
        return None if value == "None" else value

    def set_component_parameter(self, key: str, value: Any):
        """
        Update component parameter values for a given key.
        These key/value pairs are stored in app_data.component_parameters
        :param key: The parameter key to be retrieved
        :param value: the value to be set
        """
        if not key:
            raise ValueError("Key is required")

        if value is None:
            raise ValueError("Value is required")

        self._node["app_data"]["component_parameters"][key] = value

    def get_all_component_parameters(self) -> Dict[str, Any]:
        """
        Retrieve all component parameter key-value pairs.
        """
        return self._node["app_data"]["component_parameters"]

    def convert_kv_properties(self, kv_properties: List[str]):
        """
        Convert node-level list properties that have been identified as sets of
        key-value pairs from a plain list type to the KeyValueList type. If any
        k-v property has already been converted to a KeyValueList, all k-v
        properties are assumed to have already been converted.
        """
        for kv_property in kv_properties:
            value = self.get_component_parameter(kv_property)
            if not value:
                continue

            if isinstance(value, KeyValueList) or not isinstance(value[0], str):
                # A KeyValueList instance implies all relevant properties have already been converted
                # Similarly, if KeyValueList items aren't strings, this implies they have already been
                # converted to the appropriate data class objects
                return

            # Convert plain list to KeyValueList
            self.set_component_parameter(kv_property, KeyValueList(value))

    def remove_env_vars_with_matching_secrets(self):
        """
        In the case of a matching key between env vars and kubernetes secrets,
        prefer the Kubernetes Secret and remove the matching env var.
        """
        env_vars = self.get_component_parameter(ENV_VARIABLES)
        secrets = self.get_component_parameter(KUBERNETES_SECRETS)
        if isinstance(env_vars, KeyValueList) and isinstance(secrets, KeyValueList):
            new_list = KeyValueList.difference(minuend=env_vars, subtrahend=secrets)
            self.set_component_parameter(ENV_VARIABLES, new_list)

    def convert_data_class_properties(self):
        """
        Convert select node-level list properties to their corresponding dataclass
        object type. No validation is performed.
        """
        volume_mounts = self.get_component_parameter(MOUNTED_VOLUMES)
        if volume_mounts and isinstance(volume_mounts, KeyValueList):
            volume_objects = []
            for mount_path, pvc_name in volume_mounts.to_dict().items():
                formatted_mount_path = f"/{mount_path.strip('/')}"

                # Create a VolumeMount class instance and add to list
                volume_objects.append(VolumeMount(formatted_mount_path, pvc_name))

            self.set_component_parameter(MOUNTED_VOLUMES, volume_objects)

        secrets = self.get_component_parameter(KUBERNETES_SECRETS)
        if secrets and isinstance(secrets, KeyValueList):
            secret_objects = []
            for env_var_name, secret in secrets.to_dict().items():
                secret_name, *optional_key = secret.split(":", 1)

                secret_key = ""
                if optional_key:
                    secret_key = optional_key[0].strip()

                # Create a KubernetesSecret class instance and add to list
                secret_objects.append(KubernetesSecret(env_var_name, secret_name.strip(), secret_key))

            self.set_component_parameter(KUBERNETES_SECRETS, secret_objects)


class PipelineDefinition(object):
    """
    Represents a helper class to manipulate pipeline json structure
    """

    _pipelines: list = None
    _primary_pipeline: Pipeline = None
    _validated: bool = False
    _validation_issues: list = None

    def __init__(
        self,
        pipeline_path: Optional[str] = None,
        pipeline_definition: Optional[Dict] = None,
        validate: bool = False,
    ):
        """
        The constructor enables either passing a pipeline path or the content of the pipeline definition.
        :param pipeline_path: this is the path to a pipeline
        :param pipeline_definition: this is the piepline json
        :param validate: flag to turn validation during pipeline initialization
        """
        if not pipeline_path and not pipeline_definition:
            # at least one parameter should be provided
            raise ValueError("At least one parameter must be provided ('pipeline_path' or 'pipeline_definition')")
        if pipeline_path and pipeline_definition:
            # only one parameter should be provided
            raise ValueError("Only one parameter should be provided ('pipeline_path' or 'pipeline_definition')")

        if pipeline_path:
            # supporting loading pipeline from file
            if not os.path.exists(pipeline_path):
                raise ValueError(f"Pipeline file not found: '{pipeline_path}'\n")

            with open(pipeline_path) as f:
                try:
                    self._pipeline_definition = json.load(f)
                except ValueError as ve:
                    raise ValueError(f"Pipeline file is invalid: \n {ve}")
        else:
            # supporting passing the pipeline definition directly
            self._pipeline_definition = pipeline_definition

        if validate:
            self.validate()

        self.propagate_pipeline_default_properties()

    @property
    def id(self) -> str:
        """
        The pipeline definition id
        :return: the unid
        """
        return self._pipeline_definition.get("id")

    @property
    def schema_version(self) -> str:
        """
        The schema used by the Pipeline definition
        :return: the version
        """
        return self._pipeline_definition.get("version")

    @property
    def pipelines(self) -> list:
        """
        The list of pipelines defined in the pipeline definition
        :return: the list of pipelines
        """
        if not self._pipelines:
            if "pipelines" not in self._pipeline_definition:
                raise ValueError("Pipeline is missing 'pipelines' field.")
            elif len(self._pipeline_definition["pipelines"]) == 0:
                raise ValueError("Pipeline has zero length 'pipelines' field.")

            pipelines: list = list()
            for pipeline in self._pipeline_definition["pipelines"]:
                pipelines.append(Pipeline(pipeline))

            self._pipelines = pipelines

        return self._pipelines

    @property
    def primary_pipeline(self) -> Pipeline:
        """
        The primary pipeline associated with this pipeline definition
        :return: the primary pipeline
        """
        if not self._primary_pipeline:
            if "pipelines" not in self._pipeline_definition:
                raise ValueError("Pipeline is missing 'pipelines' field.")
            elif len(self._pipeline_definition["pipelines"]) == 0:
                raise ValueError("Pipeline has zero length 'pipelines' field.")

            # Find primary pipeline
            self._primary_pipeline = self.get_pipeline_definition(self._pipeline_definition.get("primary_pipeline"))

            assert self._primary_pipeline is not None, "No primary pipeline was found"

        return self._primary_pipeline

    @property
    def pipeline_nodes(self) -> List[Node]:
        """
        All nodes of all pipelines associated with a pipeline definition
        """
        return [node for pipeline in self.pipelines for node in pipeline.nodes]

    def validate(self) -> list:
        """
        Validates the pipeline definition structure and semantics
        :return: the list of issues found
        """
        # If it has been validated before
        if self._validated:
            # return current list of issues
            return self._validation_issues

        # Has not been validated before
        validation_issues = []
        # Validate pipeline schema version
        if "version" not in self._pipeline_definition:
            validation_issues.append("Pipeline schema version field is missing.")
        elif not isinstance(self._pipeline_definition["version"], str):
            validation_issues.append("Pipeline schema version field should be a string.")

        # Validate pipelines
        if "pipelines" not in self._pipeline_definition:
            validation_issues.append("Pipeline is missing 'pipelines' field.")
        elif not isinstance(self._pipeline_definition["pipelines"], list):
            validation_issues.append("Field 'pipelines' should be a list.")
        elif len(self._pipeline_definition["pipelines"]) == 0:
            validation_issues.append("Pipeline has zero length 'pipelines' field.")

        # Validate primary pipeline
        if "primary_pipeline" not in self._pipeline_definition:
            validation_issues.append("Could not determine the primary pipeline.")
        elif not isinstance(self._pipeline_definition["primary_pipeline"], str):
            validation_issues.append("Field 'primary_pipeline' should be a string.")

        primary_pipeline = self.get_pipeline_definition(self._pipeline_definition.get("primary_pipeline"))
        if not primary_pipeline:
            validation_issues.append("No primary pipeline was found")
        else:
            primary_pipeline = primary_pipeline.to_dict()
            # Validate primary pipeline structure
            if "app_data" not in primary_pipeline:
                validation_issues.append("Primary pipeline is missing the 'app_data' field.")
            else:
                if "version" not in primary_pipeline["app_data"]:
                    validation_issues.append("Primary pipeline is missing the 'version' field.")
                if "properties" not in primary_pipeline["app_data"]:
                    validation_issues.append("Node is missing 'properties' field.")
                elif len(primary_pipeline["app_data"]["properties"]) == 0:
                    validation_issues.append("Pipeline has zero length 'properties' field.")

            if "nodes" not in primary_pipeline or len(primary_pipeline["nodes"]) == 0:
                validation_issues.append("At least one node must exist in the primary pipeline.")
            else:
                for node in primary_pipeline["nodes"]:
                    if "component_parameters" not in node["app_data"]:
                        validation_issues.append("Node is missing 'component_parameters' field")

        return validation_issues

    def propagate_pipeline_default_properties(self):
        """
        For any default pipeline properties set (e.g. runtime image, volume), propagate
        the values to any nodes that do not set their own value for that property.
        """
        # Convert any key-value list pipeline default properties to the KeyValueList type
        kv_properties = PipelineDefinition.get_kv_properties()
        self.primary_pipeline.convert_kv_properties(kv_properties)

        pipeline_default_properties = self.primary_pipeline.get_property(PIPELINE_DEFAULTS, {})
        for node in self.pipeline_nodes:
            if not Operation.is_generic_operation(node.op):
                continue

            # Convert any key-value list node properties to the KeyValueList type if not done already
            node.convert_kv_properties(kv_properties)

            for property_name, pipeline_default_value in pipeline_default_properties.items():
                if not pipeline_default_value:
                    continue

                node_value = node.get_component_parameter(property_name)
                if not node_value:
                    node.set_component_parameter(property_name, pipeline_default_value)
                    continue

                if isinstance(pipeline_default_value, KeyValueList) and isinstance(node_value, KeyValueList):
                    merged_list = KeyValueList.merge(node_value, pipeline_default_value)
                    node.set_component_parameter(property_name, merged_list)

            if self.primary_pipeline.runtime_config != "local":
                node.remove_env_vars_with_matching_secrets()

            node.convert_data_class_properties()

    def is_valid(self) -> bool:
        """
        Represents whether or not the pipeline structure is valid
        :return: True for a valid pipeline definition
        """
        return len(self.validate()) == 0

    def to_dict(self) -> Dict:
        """
        The raw contents of the pipeline definition json
        :rtype: object
        """
        return self._pipeline_definition

    def get_pipeline_definition(self, pipeline_id) -> Any:
        """
        Retrieve a given pipeline from the pipeline definition
        :param pipeline_id: the pipeline unique identifier
        :return: the pipeline or None
        """
        if "pipelines" in self._pipeline_definition:
            for pipeline in self._pipeline_definition["pipelines"]:
                if pipeline["id"] == pipeline_id:
                    return Pipeline(pipeline)

        return None

    def get_node(self, node_id: str):
        """
        Given a node id returns the associated node object in the pipeline
        :param node_id: the node id
        :return: the node object or None
        """
        for pipeline in self._pipelines:
            for node in pipeline.nodes:
                if node.id == node_id:
                    return node
        return None

    def get_node_comments(self, node_id: str) -> Optional[str]:
        """
        Given a node id returns the assoicated comments in the pipeline
        :param node_id: the node id
        :return: the comments or None
        """
        comments = []

        for pipeline in self.pipelines:
            comment_list = pipeline.comments
            for comment in comment_list:
                associated_node_id_list = comment.get("associated_id_refs", [])
                for ref in associated_node_id_list:
                    if ref["node_ref"] == node_id:
                        comments.append(comment.get("content", ""))

        # remove empty (or whitespace-only) comment strings
        comments = [c for c in comments if c.strip()]
        comment_str = "\n\n".join(comments)
        if not comment_str:
            return None

        return comment_str

    def get_supernodes(self) -> List[Node]:
        """
        Returns a list of all supernodes in the pipeline
        :return:
        """
        supernode_list = []
        for pipeline in self._pipelines:
            for node in pipeline.nodes:
                if node.type == "super_node":
                    supernode_list.append(node)
        return supernode_list

    @staticmethod
    def get_canvas_properties_from_template(package_name: str, template_name: str) -> Dict[str, Any]:
        """
        Retrieves the dict representation of the canvas-formatted properties
        associated with the given template and package names. Rendering does
        not require parameters as expressions are not evaluated due to the
        SilentUndefined class.
        """
        loader = PackageLoader("elyra", package_name)
        template_env = Environment(loader=loader, undefined=SilentUndefined)

        template = template_env.get_template(template_name)
        output = template.render()
        return json.loads(output)

    @staticmethod
    def get_kv_properties() -> List[str]:
        """
        Get pipeline properties in its canvas form and loop through to
        find those that should consist of key/value pairs, as given in
        the 'keyValueEntries' key.
        """
        canvas_pipeline_properties = PipelineDefinition.get_canvas_properties_from_template(
            package_name="templates/pipeline", template_name="pipeline_properties_template.jinja2"
        )

        kv_properties = []
        parameter_info = canvas_pipeline_properties.get("uihints", {}).get("parameter_info", [])
        for parameter in parameter_info:
            if parameter.get("data", {}).get("keyValueEntries", False):
                parameter_ref = parameter.get("parameter_ref", "")
                if parameter_ref.startswith("elyra_"):
                    parameter_ref = parameter_ref.replace("elyra_", "")
                kv_properties.append(parameter_ref)

        return kv_properties


class SilentUndefined(Undefined):
    """
    A subclass of the jinja2.Undefined class used to represent undefined
    values in the template. Undefined errors as a result of the evaluation
    of expressions will fail silently and render as null.
    """

    def _fail_with_undefined_error(self, *args, **kwargs):
        return None
