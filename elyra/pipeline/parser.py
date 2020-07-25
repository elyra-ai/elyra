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
from traitlets.config import LoggingConfigurable
from typing import Any, Dict, List, Optional

from .pipeline import Pipeline, Operation

DEFAULT_FILETYPE = "tar.gz"


class PipelineParser(LoggingConfigurable):

    def parse(self, pipeline_definitions: Dict) -> Pipeline:
        """
        The pipeline definitions allow for defining multiple pipelines  in one json file.
        When super_nodes are used, their node actually references another pipeline in the
        set of pipeline definitions - which is "flattened" into the overall pipeline object's
        list of operations.
        """

        # Check for required values.  We require a primary_pipeline, a set of pipelines, and
        # nodes within the primary pipeline (checked below).
        if 'primary_pipeline' not in pipeline_definitions:
            raise ValueError("Invalid pipeline: Could not determine the primary pipeline.")
        if 'pipelines' not in pipeline_definitions:
            raise ValueError("Invalid pipeline: Pipeline definition not found.")

        primary_pipeline_id = pipeline_definitions['primary_pipeline']
        primary_pipeline = PipelineParser._get_pipeline_definition(pipeline_definitions, primary_pipeline_id)
        if not primary_pipeline:
            raise ValueError("Invalid pipeline: Primary pipeline '{}' not found.".format(primary_pipeline_id))

        # runtime info is only present on primary pipeline...
        runtime = PipelineParser._get_app_data_field(primary_pipeline, 'runtime')
        if not runtime:
            raise ValueError("Invalid pipeline: Missing runtime.")
        runtime_config = PipelineParser._get_app_data_field(primary_pipeline, 'runtime-config')
        if not runtime_config:
            raise ValueError("Invalid pipeline: Missing runtime configuration.")

        if 'nodes' not in primary_pipeline or len(primary_pipeline['nodes']) == 0:
            raise ValueError("Invalid pipeline: At least one node must exist in the primary pipeline.")

        pipeline_object = Pipeline(id=id,
                                   name=PipelineParser._get_app_data_field(primary_pipeline, 'name', 'untitled'),
                                   runtime=runtime,
                                   runtime_config=runtime_config)
        self._nodes_to_operations(pipeline_definitions, pipeline_object, primary_pipeline['nodes'])
        return pipeline_object

    def _nodes_to_operations(self,
                             pipeline_definitions: Dict,
                             pipeline_object: Pipeline,
                             nodes: List[Dict],
                             super_node: Optional[Dict] = None) -> None:
        """Converts each execution_node of the pipeline to its corresponding operation.

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
            node_type = node.get('type')
            if node_type == "super_node":
                self._super_node_to_operations(pipeline_definitions, pipeline_object, node)
                continue  # skip to next node
            elif node_type == "binding":  # We can ignore binding nodes since we're able to determine links w/o
                continue
            elif node_type == "model_node":
                raise NotImplementedError("Node type '{}' is currently not supported!".format(node_type))
            elif node_type != "execution_node":
                raise ValueError("Node type '{}' is invalid!".format(node_type))

            # parse each node as a pipeline operation
            operation = PipelineParser._create_pipeline_operation(node, super_node)
            self.log.debug("Adding operation for '{}' to pipeline: {}".format(operation.filename, pipeline_object.name))
            pipeline_object.operations[operation.id] = operation

    def _super_node_to_operations(self,
                                  pipeline_definitions: Dict,
                                  pipeline_object: Pipeline,
                                  super_node: Dict) -> None:
        """Converts nodes within a super_node to operations. """

        # get pipeline corresponding to super_node
        pipeline_id = PipelineParser._get_child_field(super_node, 'subflow_ref', 'pipeline_id_ref')
        pipeline = PipelineParser._get_pipeline_definition(pipeline_definitions, pipeline_id)
        # recurse to process nodes of super-node
        return self._nodes_to_operations(pipeline_definitions, pipeline_object, pipeline['nodes'], super_node)

    @staticmethod
    def _get_pipeline_definition(pipeline_definitions: Dict, pipeline_id: str) -> [Dict, None]:
        """Locates the pipeline corresponding to pipeline_id in the definitions and returns that definition.
           If the pipeline cannot be located, None is returned.
        """
        for p in pipeline_definitions['pipelines']:
            if p['id'] == pipeline_id:
                return p
        return None

    @staticmethod
    def _create_pipeline_operation(node: Dict, super_node: Optional[Dict] = None):
        """Creates a pipeline operation instance from the given node.
           The node and super_node are used to build the list of parent_operations (links) to
           the node (operation dependencies).
        """
        node_id = node.get('id')
        parent_operations = PipelineParser._get_parent_operation_links(node)  # parse links as dependencies
        if super_node:  # gather parent-links tied to embedded nodes inputs
            parent_operations.extend(PipelineParser._get_parent_operation_links(super_node, node_id))

        return Operation(
            id=node_id,
            type=node.get('type'),
            classifier=node.get('op'),
            filename=PipelineParser._get_app_data_field(node, 'filename'),
            runtime_image=PipelineParser._get_app_data_field(node, 'runtime_image'),
            dependencies=PipelineParser._get_app_data_field(node, 'dependencies', []),
            include_subdirectories=PipelineParser._get_app_data_field(node, 'include_subdirectories', False),
            env_vars=PipelineParser._get_app_data_field(node, 'env_vars', []),
            outputs=PipelineParser._get_app_data_field(node, 'outputs', []),
            parent_operations=parent_operations)

    @staticmethod
    def _get_child_field(obj: Dict, child: str, field_name: str, default_value: Any = None) -> Any:
        """Returns the field's value from the child dictionary of object obj or the default
          if any portion (child, field) is not present.
        """
        return_value = default_value
        if child in obj.keys():
            return_value = obj[child].get(field_name, default_value)
        return return_value

    @staticmethod
    def _get_app_data_field(obj: Dict, field_name: str, default_value: Any = None) -> Any:
        """Helper method to pull the field's value from the app_data child of object obj."""
        return PipelineParser._get_child_field(obj, 'app_data', field_name, default_value=default_value)

    @staticmethod
    def _get_port_node_id(link: Dict) -> [None, str]:
        """Gets the id of the node corresponding to the linked out port.
           If the link is on a super_node the appropriate node_id is actually
           embedded in the port_id_ref value.
        """
        node_id = None
        if 'port_id_ref' in link:
            if link['port_id_ref'] == 'outPort':  # Regular execution node
                if 'node_id_ref' in link:
                    node_id = link['node_id_ref']
            elif link['port_id_ref'].endswith('_outPort'):  # Super node
                # node_id_ref is the super-node, but the prefix of port_id_ref, is the actual node-id
                node_id = link['port_id_ref'].split('_')[0]
        return node_id

    @staticmethod
    def _get_input_node_ids(node_input: Dict) -> List[str]:
        """Gets a list of node_ids corresponding to the linked out ports on the input node."""
        input_node_ids = []
        if 'links' in node_input:
            for link in node_input['links']:
                node_id = PipelineParser._get_port_node_id(link)
                if node_id:
                    input_node_ids.append(node_id)
        return input_node_ids

    @staticmethod
    def _get_parent_operation_links(node: Dict, embedded_node_id: Optional[str] = None) -> List[str]:
        """Gets a list nodes_ids corresponding to parent nodes (outputs directed to this node).
           For super_nodes, the node to use has an id of the embedded_node_id suffixed with '_inPort'.
        """
        links = []
        if 'inputs' in node:
            for node_input in node['inputs']:
                if embedded_node_id:  # node is a super_node, handle matches to {embedded_node_id}_inPort
                    input_id = node_input.get('id')
                    if input_id == embedded_node_id + '_inPort':
                        links.extend(PipelineParser._get_input_node_ids(node_input))
                else:
                    links.extend(PipelineParser._get_input_node_ids(node_input))
        return links
