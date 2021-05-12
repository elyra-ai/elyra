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
import json
import os

import networkx as nx

from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.component_registry import ComponentRegistry
from elyra.util.path import get_expanded_path
from enum import IntEnum
from json.decoder import JSONDecodeError

from traitlets.config import SingletonConfigurable
from typing import Dict, Optional


class ValidationSeverity(IntEnum):
    Error = 1
    Warning = 2
    Information = 3
    Hint = 4


class ValidationResponse(object):
    def __init__(self):
        self._response = {"title": "Elyra Pipeline Diagnostics",
                          "description": "Issues discovered when parsing the pipeline",
                          "issues": []
                          }
        self._has_fatal = False

    @property
    def response(self) -> Dict:
        """
        :return: The dict of validation errors and warnings found in the pipeline
        """
        return self._response

    @property
    def has_fatal(self):
        return self._has_fatal

    def add_message(self,
                    message: str,
                    message_type: Optional[str] = "",
                    data: Optional[Dict] = "",
                    severity: ValidationSeverity = ValidationSeverity.Warning):
        """
        Helper function to add a diagnostic message to the response to be sent back
        :param message: A simple message describing the issue
        :param message_type: The type of message to send back e.g. invalidNodeType, invalidPipeline
        :param data: a Dict with granular details regarding the error e.g. the nodeID, pipelineID, linkID etc.
        :param severity: the severity level of the issue
        :return:
        """
        valid_severity_levels = [ValidationSeverity.Error, ValidationSeverity.Warning,
                                 ValidationSeverity.Information, ValidationSeverity.Hint]

        if severity in valid_severity_levels:
            diagnostic = {"severity": severity.value,
                          "source": "Elyra Pipeline Validation Service",
                          "type": message_type,
                          "message": message,
                          "data": data
                          }
            self._response['issues'].append(diagnostic)

        if severity is ValidationSeverity.Error:
            self._has_fatal = True

    def to_json(self):
        return self._response


class PipelineValidationManager(SingletonConfigurable):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.root_dir = get_expanded_path(kwargs.get('root_dir'))

    async def validate(self, pipeline: Dict) -> ValidationResponse:
        """
        Validates the pipeline JSON payload
        :param pipeline: the pipeline definition to be validated
        :return: ValidationResponse containing any and all issues discovered during the validation
        """
        response = ValidationResponse()
        root_dir = self.root_dir

        try:
            pipeline_json = json.loads(json.dumps(pipeline))
        except (ValueError, JSONDecodeError):
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidJSON",
                                 message="Invalid JSON detected, unable to continue.")
            return response

        pipeline_execution = pipeline_json['pipelines'][0]['app_data'].get('runtime')  # local, kfp, airflow

        if not pipeline_json['pipelines'][0]['app_data']['ui_data'].get('runtime'):  # null, kfp, airflow
            pipeline_runtime = 'generic'  # null/generic pipeline
        else:
            pipeline_runtime = pipeline_json['pipelines'][0]['app_data']['ui_data']['runtime'].get('name')

        self._validate_pipeline_structure(pipeline=pipeline, response=response)
        await self._validate_compatibility(pipeline=pipeline, response=response,
                                           pipeline_runtime=pipeline_runtime, pipeline_execution=pipeline_execution)
        await self._validate_node_properties(root_dir=root_dir, pipeline=pipeline,
                                             response=response, pipeline_runtime=pipeline_runtime,
                                             pipeline_execution=pipeline_execution)
        self._validate_pipeline_graph(pipeline=pipeline, response=response)

        return response

    def _validate_pipeline_structure(self, pipeline: Dict, response: ValidationResponse) -> None:
        """
        Validates the pipeline (only pipeline scope) structure for required fields and types
        :param pipeline: the pipeline definition to be validated
        :param response: ValidationResponse containing the issue list to be updated
        """

        current_pipeline_schema_version = 3.0
        pipeline_json = json.loads(json.dumps(pipeline))

        # Check for required values.  We require a primary_pipeline, a set of pipelines, and
        # nodes within the primary pipeline (checked below).
        if 'primary_pipeline' not in pipeline_json:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Could not determine the primary pipeline.")
        if not isinstance(pipeline_json["primary_pipeline"], str):
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Field 'primary_pipeline' should be a string.")
        if 'pipelines' not in pipeline_json:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Pipeline definition not found.")
        if not isinstance(pipeline_json["pipelines"], list):
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Field 'pipelines' should be a list.")

        primary_pipeline_id = pipeline_json['primary_pipeline']
        primary_pipeline = PipelineParser._get_pipeline_definition(pipeline_json, primary_pipeline_id)
        if not primary_pipeline:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Primary pipeline '{}' not found.".format(primary_pipeline_id))

        if 'nodes' not in primary_pipeline or len(primary_pipeline['nodes']) == 0:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="At least one node must exist in the primary pipeline.")
        if 'app_data' not in primary_pipeline:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Pipeline 'app_data' is missing from primary pipeline")
        elif 'version' not in primary_pipeline['app_data']:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Pipeline app_data 'version' is missing from primary pipeline")
        elif not int(primary_pipeline['app_data']['version']) > 0:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Primary pipeline version field has an invalid value")

        if 'version' not in pipeline_json:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Primary pipeline version field is missing")
        if not isinstance(pipeline_json['version'], str):
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Primary pipeline version field should be a string.")
        if float(pipeline_json['version']) < current_pipeline_schema_version:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Incompatible pipeline schema version detected")

    async def _validate_compatibility(self, pipeline: Dict, pipeline_runtime: str,
                                      pipeline_execution: str, response: ValidationResponse) -> None:
        """
        Checks that the pipeline payload is compatible with this version of elyra (ISSUE #938)
        as well as verifying all nodes in the pipeline are supported by the runtime
        :param pipeline: the pipeline definition to be validated
        :param pipeline_runtime: name of the pipeline runtime being used e.g. kfp, airflow, generic
        :param response: ValidationResponse containing the issue list to be updated
        """
        pipeline_json = json.loads(json.dumps(pipeline))
        pipeline_id = pipeline_json['pipelines'][0]['id']
        supported_ops = []

        if pipeline_execution:
            if pipeline_execution != pipeline_runtime and pipeline_runtime != 'generic':
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidRuntime",
                                     message="Unable to run selected pipeline on selected runtime",
                                     data={"pipelineRuntime": pipeline_runtime,
                                           "pipelineID": pipeline_id})
            elif pipeline_runtime == 'generic':
                pipeline_runtime = 'local'  # Update to local since they both support the same set of ops

        if PipelineProcessorManager.instance().is_supported_runtime(pipeline_runtime):
            components = await PipelineProcessorManager.instance().get_components(pipeline_runtime)
            for category in components['categories']:
                supported_ops.append(category['node_types'][0]['op'])

            # Checks pipeline node types are compatible with the runtime selected
            for single_pipeline in pipeline_json['pipelines']:
                pipeline_id = single_pipeline['id']
                node_list = single_pipeline['nodes']
                for node in node_list:
                    if node['type'] == "execution_node" and node['op'] not in supported_ops:
                        response.add_message(severity=ValidationSeverity.Error,
                                             message_type="invalidNodeType",
                                             message="Unsupported node type found in this pipeline",
                                             data={"nodeID": node['id'],
                                                   "pipelineID": pipeline_id})
        else:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidRuntime",
                                 message="Unsupported pipeline runtime selected in this pipeline",
                                 data={"pipelineRuntime": pipeline_runtime,
                                       "pipelineID": pipeline_id})

    async def _validate_node_properties(self, root_dir: str, pipeline: Dict, pipeline_runtime: str,
                                        pipeline_execution: str, response: ValidationResponse) -> None:
        """
        Validates each of the node's structure for required fields/properties as well as
        their values
        :param root_dir: the absolute base path of the current elyra workspace
        :param pipeline: the pipeline definition to be validated
        :param pipeline_runtime: name of the pipeline runtime being used e.g. kfp, airflow, generic
        :param response: ValidationResponse containing the issue list to be updated
        """
        pipeline_json = json.loads(json.dumps(pipeline))

        for single_pipeline in pipeline_json['pipelines']:
            node_list = single_pipeline['nodes']
            pipeline_runtime = 'local' if pipeline_runtime == 'generic' else pipeline_runtime
            components = await PipelineProcessorManager.instance().get_components(pipeline_runtime)
            for node in node_list:
                if node['type'] == 'execution_node':
                    node_data = node['app_data']
                    if node['op'] in ['execute-r-node', 'execute-python-node', 'execute-notebook-node']:
                        # Validate actual node property values
                        self._validate_filepath(node_id=node['id'], root_dir=root_dir, property_name='filename',
                                                filename=node_data['filename'], response=response)

                        # If the running locally, we can skip the resource and image name checks
                        if pipeline_execution != 'local':
                            self._validate_container_image_name(node, response=response)
                            self._validate_resource_value(node, resource_name='cpu', response=response)
                            self._validate_resource_value(node, resource_name='gpu', response=response)
                            self._validate_resource_value(node, resource_name='memory', response=response)
                        if pipeline_runtime == 'kfp' and node_data['filename'] != node_data['ui_data']['label']:
                            self._validate_ui_data_label(node_id=node['id'], label_name=node_data['ui_data']['label'],
                                                         response=response)
                        if node_data.get('dependencies'):
                            for dependency in node_data['dependencies']:
                                self._validate_filepath(node_id=node['id'], root_dir=root_dir,
                                                        property_name='dependencies',
                                                        filename=dependency, response=response)
                        for env_var in node_data['env_vars']:
                            self._validate_environmental_variables(node_id=node['id'], env_var=env_var,
                                                                   response=response)

                    # Validate against more specific node properties in component registry
                    node_data.pop('ui_data')  # remove unwanted/unneeded key
                    property_list = self._get_component_properties(pipeline_runtime, components, node['op'])
                    for node_property in list(property_list.keys()):
                        if node_property not in list(node_data.keys()):
                            response.add_message(severity=ValidationSeverity.Error,
                                                 message_type="invalidNodeProperty",
                                                 message="Node is missing field",
                                                 data={"nodeID": node['id'],
                                                       "propertyName": node_property})
                        elif not isinstance(node_data[node_property], type(property_list[node_property])):
                            response.add_message(severity=ValidationSeverity.Error,
                                                 message_type="invalidNodeProperty",
                                                 message="Node field is incorrect type",
                                                 data={"nodeID": node['id'],
                                                       "propertyName": node_property})

    def _validate_container_image_name(self, node, response: ValidationResponse) -> None:
        """
        Validates the image name exists and is proper in syntax
        :param node: the node definition to be validated
        :param response: ValidationResponse containing the issue list to be updated
        """
        image_name = node['app_data'].get('runtime_image', '')
        if not image_name:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodePropertyValue",
                                 message="Node is missing image name",
                                 data={"nodeID": node['id'],
                                       "propertyName": 'runtime_image'})

    def _validate_resource_value(self, node, resource_name: str, response: ValidationResponse) -> None:
        """
        Validates the value for hardware resources requested
        :param node: the node definition to be validated
        :param response: ValidationResponse containing the issue list to be updated
        :param resource_name: the name of the resource e.g. CPU, GPU, Memory
        :return:
        """
        if node['app_data'].get(resource_name):
            try:
                if int(node['app_data'][resource_name]) <= 0:
                    response.add_message(severity=ValidationSeverity.Error,
                                         message_type="invalidNodePropertyValue",
                                         message="Property must be greater than zero",
                                         data={"nodeID": node['id'],
                                               "propertyName": resource_name})
            except (ValueError, TypeError):
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidNodePropertyValue",
                                     message="Property has a non-parsable value",
                                     data={"nodeID": node['id'],
                                           "propertyName": resource_name})

    def _validate_filepath(self, property_name: str, node_id: str, root_dir: str, filename: str,
                           response: ValidationResponse) -> None:
        """
        Checks the file structure, paths and existence of pipeline dependencies.
        Note that this does not cross reference with file path references within the notebook or script itself.
        :param node_id: the node ID of the node the path is located in
        :param property_name: name of the node property being validated
        :param root_dir: the absolute base path of the current elyra workspace
        :param filename: the name of the file or directory to verify
        :param response: ValidationResponse containing the issue list to be updated
        """
        if filename.split('/')[0] in ['.', ".."]:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidFilePath",
                                 message="Property has an invalid reference to a file/dir outside the root workspace",
                                 data={"nodeID": node_id,
                                       "propertyName": property_name,
                                       "value": filename})

        elif not os.path.exists(root_dir + "/" + filename):
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidFilePath",
                                 message="Property has an invalid path to a file/dir or the file/dir does not exist",
                                 data={"nodeID": node_id,
                                       "propertyName": property_name,
                                       "value": filename})

    def _validate_environmental_variables(self, node_id: str, env_var: str, response: ValidationResponse) -> None:
        """
        Checks the format of the env var to ensure its in the correct form
        e.g. FOO = 'BAR'
        :param node_id: the node ID of the node the path is located in
        :param response: ValidationResponse containing the issue list to be updated
        :param env_var: the env_var key value pair to check
        """
        result = [x.strip(' \'\"') for x in env_var.split('=', 1)]
        if len(result) != 2:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidEnvPair",
                                 message="Property has an improperly formatted env variable key value pair",
                                 data={"nodeID": node_id,
                                       "propertyName": 'env_vars',
                                       "value": env_var})

    def _validate_ui_data_label(self, node_id: str, label_name: str, response: ValidationResponse) -> None:
        """
        KFP specific check for the label name when constructing the node operation using dsl
        :param node_id: the node ID of the node the path is located in
        :param label_name: the label name string
        :param response: ValidationResponse containing the issue list to be updated
        """
        label_name_max_length = 63

        if len(label_name) > label_name_max_length:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodeLabel",
                                 message="Property string value has exceeded the max length allowed ",
                                 data={"nodeID": node_id,
                                       "propertyName": 'label',
                                       "value": label_name})

        # TODO: run regex check on label

    def _validate_pipeline_graph(self, pipeline: Dict, response: ValidationResponse) -> None:
        """
        Validates that the pipeline is an acyclic graph, meaning no circular references
        Converts the pipeline definition into a series of tuple node edges(arrows) that represent the connections
        from one node to another via a networkX DiGraph.
        Example:
                 NodeC
                   ^
                   |
        NodeA -> NodeB -> NodeD
                   ^         |
                   |         |    (Invalid Circular Reference)
                   <---------

        The resulting list of edges (arrows) would then be:
        [(NodeA, NodeB), (NodeB, NodeC), (NodeB, NodeD), (NodeD, NodeB)]

        the list of nodes added would be:
        [NodeA, NodeB, NodeC, NodeD]

        This function will add an error message for each cycle found and provide a list of LinkID(s)
        representing the cycle, in the example above, we would return a single error message with the LinkIDs
        for (NodeB, NodeD) and (NodeD, NodeB)
        :param response: ValidationResponse containing the issue list to be updated
        :param pipeline: A dictionary describing the pipeline
        """
        pipeline_json = json.loads(json.dumps(pipeline))

        graph = nx.DiGraph()

        for single_pipeline in pipeline_json['pipelines']:
            node_list = single_pipeline['nodes']

            for node in node_list:
                if node['type'] == "execution_node":
                    graph.add_node(node['id'])
                    if 'links' in node['inputs'][0]:
                        for link in node['inputs'][0]['links']:
                            graph.add_edge(link['node_id_ref'], node['id'])

        for isolate in nx.isolates(graph):
            if graph.number_of_nodes() > 1:
                response.add_message(severity=ValidationSeverity.Warning,
                                     message_type="singletonReference",
                                     message="This node is not connected to any part of the pipeline",
                                     data={"nodeID": isolate,
                                           "pipelineID": self._get_pipeline_id(pipeline, node_id=isolate)})

        cycles_detected = nx.simple_cycles(graph)

        link_dict_table = {}
        cycle_counter = 1
        for cycle in cycles_detected:
            size_of_cycle = len(cycle)
            if cycle_counter not in link_dict_table:
                link_dict_table[cycle_counter] = []
            for i in range(0, size_of_cycle):
                if i == size_of_cycle - 1:
                    link_dict_table[cycle_counter].append(self._get_link_id(pipeline, cycle[i], cycle[0]))
                else:
                    link_dict_table[cycle_counter].append(self._get_link_id(pipeline, cycle[i], cycle[i + 1]))
            cycle_counter += 1

        for cycle_number, cycle_link_list in link_dict_table.items():
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="circularReference",
                                 message="A cycle was found within this pipeline",
                                 data={"cycleNumber": cycle_number,
                                       "linkIDList": cycle_link_list})

    def _get_link_id(self, pipeline, u_edge: str, v_edge: str) -> str:
        """
        Retrieves the LinkID associated with the connecting edge from u_edge to v_edge
        :param pipeline: pipeline definition where the link is located
        :param u_edge: the starting node_id edge
        :param v_edge: the ending node_id_edge
        :return: a string Link ID representing the edge connecting one node to another
        """
        pipeline_json = json.loads(json.dumps(pipeline))

        for single_pipeline in pipeline_json['pipelines']:
            node_list = single_pipeline['nodes']

            for node in node_list:
                if node['type'] == "execution_node":
                    for link in node['inputs'][0].get('links', []):
                        if u_edge == link['node_id_ref'] and v_edge == node['id']:
                            return link['id']

    def _get_pipeline_id(self, pipeline, node_id: str) -> str:
        """
        Given a node ID, returns the pipeline ID of where the node is currently connected to
        :param pipeline: pipeline definition where the link is located
        :param node_id: the node ID of the node
        :return: the pipeline ID of where the node is located
        """
        pipeline_json = json.loads(json.dumps(pipeline))
        for single_pipeline in pipeline_json['pipelines']:
            node_list = single_pipeline['nodes']
            for node in node_list:
                if node['id'] == node_id:
                    return single_pipeline['id']

    def _get_component_properties(self, pipeline_runtime: str, components: dict, node_op: str) -> Dict:
        """
        Retrieve the list of properties associated with the node_op
        :param components: list of components associated with the pipeline runtime being used e.g. kfp, airflow
        :param node_op: the node operation e.g. execute-notebook-node
        :return: a list of property names associated with the node op
        """
        for category in components['categories']:
            if node_op == category['node_types'][0]['op']:
                properties = ComponentRegistry().get_properties(pipeline_runtime, category['id'])
                return properties['current_parameters']
        return {}
