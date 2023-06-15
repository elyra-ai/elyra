#
# Copyright 2018-2023 Elyra Authors
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
from typing import Dict
from typing import List
from typing import Optional

from traitlets.config import LoggingConfigurable

from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.pipeline_definition import Node
from elyra.pipeline.pipeline_definition import PipelineDefinition


class PipelineParser(LoggingConfigurable):
    def __init__(self, root_dir="", **kwargs):
        super().__init__(**kwargs)
        self.root_dir = root_dir

    def parse(self, pipeline_json: Dict) -> Pipeline:
        """
        The pipeline definitions allow for defining multiple pipelines  in one json file.
        When super_nodes are used, their node actually references another pipeline in the
        set of pipeline definitions - which is "flattened" into the overall pipeline object's
        list of operations.
        """

        try:
            pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)
            primary_pipeline = pipeline_definition.primary_pipeline
        except Exception as e:
            raise ValueError(f"Invalid Pipeline: {e}")

        # runtime info is only present on primary pipeline...
        runtime = primary_pipeline.runtime
        if not runtime:
            raise ValueError("Invalid pipeline: Missing runtime.")
        runtime_config = primary_pipeline.runtime_config

        source = primary_pipeline.source

        description = primary_pipeline.get_property("description")

        pipeline_object = Pipeline(
            id=primary_pipeline.id,
            name=primary_pipeline.name,
            runtime=runtime,
            runtime_config=runtime_config,
            source=source,
            description=description,
            pipeline_properties=primary_pipeline.pipeline_default_properties,
            pipeline_parameters=primary_pipeline.pipeline_parameters,
        )

        nodes = primary_pipeline.nodes
        for pipeline in pipeline_definition.pipelines:
            if pipeline.id == primary_pipeline.id:
                nodes = pipeline.nodes
        self._nodes_to_operations(pipeline_definition, pipeline_object, nodes)
        return pipeline_object

    def _nodes_to_operations(
        self,
        pipeline_definition: PipelineDefinition,
        pipeline_object: Pipeline,
        nodes: List[Node],
        super_node: Optional[Node] = None,
    ) -> None:
        """
        Converts each execution_node of the pipeline to its corresponding operation.

        If a super_node is encountered recursion is used to process its embedded nodes.
        If the super_node has binding nodes, those "nodes" are ignored since we handle
        their "functionality" by parsing the port_id_ref field to determine the node_id
        of the embedded node.

        If any node types other than execution_node, super_node or binding are encountered,
        a ValueError is raised indicating the unknown node type.

        Since the pipeline_object's operations list is updated, this method does not return a value.
        """
        for node in nodes:
            # Super_nodes trigger recursion
            if node.type == "super_node":
                self._super_node_to_operations(pipeline_definition, node, pipeline_object, node)
                continue  # skip to next node
            elif node.type == "binding":  # We can ignore binding nodes since we're able to determine links w/o
                continue
            elif node.type == "model_node":
                raise NotImplementedError(f"Node type '{node.type}' is currently not supported!")
            elif node.type != "execution_node":
                raise ValueError(f"Node type '{node.type}' is invalid!")
            # parse each node as a pipeline operation

            operation = self._create_pipeline_operation(node, super_node)

            # assoicate user comment as docs to operations
            comment = pipeline_definition.get_node_comments(node.id)
            if comment:
                operation.doc = comment

            self.log.debug(f"Adding operation for '{operation.name}' to pipeline: {pipeline_object.name}")
            pipeline_object.operations[operation.id] = operation

    def _super_node_to_operations(
        self, pipeline_definition: PipelineDefinition, node: Node, pipeline_object: Pipeline, super_node: Node
    ) -> None:
        """Converts nodes within a super_node to operations."""

        # get pipeline corresponding to super_node
        pipeline_id = node.subflow_pipeline_id
        pipeline = pipeline_definition.get_pipeline_definition(pipeline_id)
        # recurse to process nodes of super-node
        return self._nodes_to_operations(pipeline_definition, pipeline_object, pipeline.nodes, super_node)

    def _create_pipeline_operation(self, node: Node, super_node: Node = None) -> Operation:
        """
        Creates a pipeline operation instance from the given node.
        The node and super_node are used to build the list of parent_operation_ids (links) to
        the node (operation dependencies).
        """
        parent_operations = PipelineParser._get_parent_operation_links(node.to_dict())  # parse links as dependencies
        if super_node:  # gather parent-links tied to embedded nodes inputs
            parent_operations.extend(PipelineParser._get_parent_operation_links(super_node.to_dict(), node.id))

        # Split properties into component- and Elyra-owned
        component_props, elyra_props = node.get("component_parameters", {}), {}
        for prop_id in list(component_props.keys()):
            if prop_id in node.elyra_owned_properties:
                elyra_props[prop_id] = node.pop_component_parameter(prop_id)

        return Operation.create_instance(
            id=node.id,
            type=node.type,
            classifier=node.op,
            name=node.label,
            parent_operation_ids=parent_operations,
            component_props=component_props,
            elyra_props=elyra_props,
        )

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
                node_id = PipelineParser._get_port_node_id(link)
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
                        links.extend(PipelineParser._get_input_node_ids(node_input))
                else:
                    links.extend(PipelineParser._get_input_node_ids(node_input))
        return links
