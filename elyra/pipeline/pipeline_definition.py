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
import json
import os
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Set
from typing import Union

from jinja2 import Environment
from jinja2 import PackageLoader

from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline_constants import COS_OBJECT_PREFIX
from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import KUBERNETES_SECRETS
from elyra.pipeline.pipeline_constants import PIPELINE_DEFAULTS
from elyra.pipeline.pipeline_constants import PIPELINE_PARAMETERS
from elyra.pipeline.pipeline_constants import RUNTIME_IMAGE
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.properties import ComponentProperty
from elyra.pipeline.properties import ElyraProperty
from elyra.pipeline.properties import ElyraPropertyList
from elyra.pipeline.runtime_type import RuntimeProcessorType


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
    def version(self) -> Union[int, float]:
        """
        The pipeline version
        :return: The version
        """
        version = self._node["app_data"].get("version")
        if isinstance(version, (int, float)):
            return version

        try:
            version = int(version)
        except ValueError:  # version is not an int; this will only ever be the case in dev versions
            version = float(version)
        return version

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
    def pipeline_default_properties(self) -> Dict[str, Any]:
        """The dictionary of pipeline default properties"""
        pipeline_defaults = self.get_property(PIPELINE_DEFAULTS, {})

        # TODO remove the block below when a pipeline migration is appropriate (after 3.13)
        cos_prefix = self._node["app_data"].get("properties", {}).pop(COS_OBJECT_PREFIX, None)
        if cos_prefix:
            if PIPELINE_DEFAULTS in self._node["app_data"]["properties"]:
                self._node["app_data"]["properties"][PIPELINE_DEFAULTS][COS_OBJECT_PREFIX] = cos_prefix
            else:
                self._node["app_data"]["properties"][PIPELINE_DEFAULTS] = {COS_OBJECT_PREFIX: cos_prefix}

        return pipeline_defaults

    @property
    def pipeline_parameters(self) -> ElyraPropertyList:
        """The list of pipeline parameters"""
        return self.get_property(PIPELINE_PARAMETERS, ElyraPropertyList([]))

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

        if value is None:
            raise ValueError("Value is required")

        self._node["app_data"]["properties"][key] = value

    def convert_elyra_owned_properties(self) -> None:
        """
        Convert select pipeline-level properties to instance of their
        corresponding class object type. No validation is performed.
        """
        # Convert pipeline node default values
        pipeline_defaults = self.pipeline_default_properties
        for prop_id, value in list(pipeline_defaults.items()):
            if not ElyraProperty.subclass_exists_for_property(prop_id):
                continue

            converted_value = ElyraProperty.create_instance(prop_id, value)
            if converted_value is None:
                pipeline_defaults.pop(prop_id)
            else:
                pipeline_defaults[prop_id] = converted_value

    def convert_pipeline_parameters(self, runtime_type_name: str) -> None:
        """
        Convert any pipeline parameters to instance of the appropriate
        runtime-specific class. No validation is performed.
        """
        if not self.pipeline_parameters:
            return None
        if not runtime_type_name:
            return None  # runtime type name is not given, pipeline cannot support parameters

        # Retrieve the pipelime parameter class associated with pipeline's runtime
        runtime_type = RuntimeProcessorType.get_instance_by_name(runtime_type_name)
        parameter_class = PipelineProcessorManager.instance().get_pipeline_parameter_class(runtime_type=runtime_type)
        if parameter_class is None:
            return None  # runtime type does not support parameters, skip

        if not ElyraProperty.subclass_exists_for_property(parameter_class.property_id):
            ElyraProperty.build_property_map()

        # Convert pipeline parameters to runtime-specific instances
        converted_value = ElyraProperty.create_instance(parameter_class.property_id, self.pipeline_parameters)
        if converted_value is not None:
            self.set_property(PIPELINE_PARAMETERS, converted_value)


class Node(AppDataBase):
    def __init__(self, node: Dict):
        super().__init__(node)
        self._elyra_owned_properties = set()

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

    @property
    def is_generic(self) -> True:
        """A property that denotes whether this node is a generic component"""
        if Operation.is_generic_operation(self.op):
            return True
        return False

    @property
    def elyra_owned_properties(self) -> Set[str]:
        """
        Elyra-defined node properties. In the case of a collision of ids
        between Elyra-defined properties and properties parsed from the
        component definition, the Elyra-defined property will be excluded.
        """
        return self._elyra_owned_properties

    @elyra_owned_properties.setter
    def elyra_owned_properties(self, value: Set) -> None:
        self._elyra_owned_properties = value

    def set_elyra_owned_properties(self, runtime_type_name: Optional[str]) -> None:
        """
        Determine which Elyra-defined node-level properties apply on the basis that their
        id does not collide with a property defined in the component definition for this
        Node. Then, set the Elyra-owned node properties accordingly.
        """
        component = ComponentCache.get_generic_component_from_op(self.op)
        if runtime_type_name and component is None:
            runtime_type = RuntimeProcessorType.get_instance_by_name(runtime_type_name)
            component = ComponentCache.instance().get_component(runtime_type, self.op)

        if component:
            # Properties that have the same ref (id) as Elyra-owned node properties
            # should be skipped during property propagation and conversion
            self.elyra_owned_properties = {prop.property_id for prop in component.get_elyra_properties()}

    @property
    def propagated_properties(self) -> Set[str]:
        """
        The set of properties for which a pipeline default value should be propagated to this node
        in the applicable scenario. This may not be the same as the set of Elyra-owned properties
        (ie, properties with a corresponding ElyraProperty class) in all cases. That distinction
        is made here as needed.
        """
        propagated_props = {*self.elyra_owned_properties}  # all Elyra-owned props should be propagated
        if self.is_generic:
            propagated_props.add(RUNTIME_IMAGE)  # generic nodes should also have runtime_image propagated
        return propagated_props

    def get_component_parameter(self, key: str, default_value=None) -> Any:
        """
        Retrieve component parameter values.
        These key/value pairs are stored in app_data.component_parameters
        :param key: the parameter key to be retrieved
        :param default_value: a default value in case the key is not found
        :return: the value or the default value if the key is not found
        """
        value = self._node["app_data"].get("component_parameters", {}).get(key, default_value)
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

    def pop_component_parameter(self, key: str, default: Optional[Any] = None) -> Any:
        """
        Pop component parameter values for a given key
        :param key: The parameter key to be retrieved
        :param default: the value to be set if not found
        """
        if not key:
            raise ValueError("Key is required")
        return self._node["app_data"]["component_parameters"].pop(key, default)

    def get_all_component_parameters(self) -> Dict[str, Any]:
        """Retrieve all component parameter key-value pairs."""
        return self._node["app_data"]["component_parameters"]

    def remove_env_vars_with_matching_secrets(self):
        """
        In the case of a matching key between env vars and kubernetes secrets,
        prefer the Kubernetes Secret and remove the matching env var.
        """
        env_vars = self.get_component_parameter(ENV_VARIABLES)
        secrets = self.get_component_parameter(KUBERNETES_SECRETS)
        if isinstance(env_vars, ElyraPropertyList) and isinstance(secrets, ElyraPropertyList):
            new_list = ElyraPropertyList.difference(minuend=env_vars, subtrahend=secrets)
            self.set_component_parameter(ENV_VARIABLES, new_list)

    def convert_elyra_owned_properties(self) -> None:
        """
        Convert select node-level list properties to their corresponding dataclass
        object type. No validation is performed.
        """
        for prop_id in self.elyra_owned_properties:
            if not ElyraProperty.subclass_exists_for_property(prop_id):
                continue

            converted_value = ElyraProperty.create_instance(prop_id, value=self.get_component_parameter(prop_id))
            if converted_value is None:
                self.pop_component_parameter(prop_id)
            else:
                self.set_component_parameter(prop_id, converted_value)


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
        self.primary_pipeline.convert_elyra_owned_properties()
        self.primary_pipeline.convert_pipeline_parameters(runtime_type_name=self.primary_pipeline.type)

        for node in self.pipeline_nodes:
            # Determine which Elyra-owned properties will require dataclass conversion, then convert
            node.set_elyra_owned_properties(self.primary_pipeline.type)
            node.convert_elyra_owned_properties()

            for property_name, pipeline_value in self.primary_pipeline.pipeline_default_properties.items():
                if not pipeline_value or property_name not in node.propagated_properties:
                    continue

                node_value = node.get_component_parameter(property_name)
                if property_name == "ENV_VARIABLES":
                    print(node_value)
                if not node_value:
                    node.set_component_parameter(property_name, pipeline_value)
                    continue

                if all(isinstance(value, ElyraPropertyList) for value in [pipeline_value, node_value]):
                    merged_list = ElyraPropertyList.merge(node_value, pipeline_value)
                    node.set_component_parameter(property_name, merged_list)

            if self.primary_pipeline.runtime_config != "local":
                node.remove_env_vars_with_matching_secrets()

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
    def get_pipeline_properties(runtime_type: RuntimeProcessorType) -> Dict[str, Any]:
        """Retrieves the dict representation of the canvas-formatted pipeline properties."""
        loader = PackageLoader("elyra", "templates/pipeline")

        params_custom = ElyraProperty.get_classes_for_component_type("custom", runtime_type)
        params_generic = ElyraProperty.get_classes_for_component_type("generic", runtime_type)

        # Get intersection of parameter sets
        params_both = params_custom & params_generic

        template_vars = {
            "elyra_owned_custom_properties": params_both ^ params_custom,
            "elyra_owned_generic_properties": params_generic ^ params_both,
            "elyra_owned_properties": params_both,
            "render_property_details": ComponentProperty.render_property_details,
        }
        template_env = Environment(loader=loader)
        template_env.policies["json.dumps_kwargs"] = {"sort_keys": False}  # prevent automatic key sort on 'tojson'
        template = template_env.get_template("pipeline_properties_template.jinja2")
        template.globals.update(template_vars)

        output = template.render()
        return json.loads(output)
