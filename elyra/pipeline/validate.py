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
from enum import IntEnum
from glob import glob
import json
import os
import re
from typing import Dict
from typing import List
from typing import Optional

import networkx as nx
from traitlets.config import SingletonConfigurable

from elyra.pipeline.component import Component
from elyra.pipeline.component_registry import ComponentRegistry
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.util.path import get_expanded_path


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

        try:
            pipeline_json = json.loads(json.dumps(pipeline))
        except (ValueError, json.JSONDecodeError):
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidJSON",
                                 message="Invalid JSON detected, unable to continue.")
            return response

        pipeline_execution = pipeline_json['pipelines'][0]['app_data'].get('runtime')  # local, kfp, airflow
        pipeline_runtime = self._get_runtime_schema(pipeline, response)

        self._validate_pipeline_structure(pipeline=pipeline, response=response)
        await self._validate_compatibility(pipeline=pipeline, response=response, pipeline_runtime=pipeline_runtime,
                                           pipeline_execution=pipeline_execution)
        await self._validate_node_properties(pipeline=pipeline, response=response, pipeline_runtime=pipeline_runtime,
                                             pipeline_execution=pipeline_execution)
        self._validate_pipeline_graph(pipeline=pipeline, response=response)

        return response

    def _validate_pipeline_structure(self, pipeline: dict, response: ValidationResponse) -> None:
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

    async def _validate_compatibility(self, pipeline: dict, pipeline_runtime: str,
                                      pipeline_execution: str, response: ValidationResponse) -> None:
        """
        Checks that the pipeline payload is compatible with this version of elyra (ISSUE #938)
        as well as verifying all nodes in the pipeline are supported by the runtime
        :param pipeline: the pipeline definition to be validated
        :param pipeline_runtime: name of the pipeline runtime being used e.g. kfp, airflow, generic
        :param pipeline_execution: name of the pipeline runtime for execution  e.g. kfp, airflow, local
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
            component_list = await PipelineProcessorManager.instance().get_components(pipeline_runtime)
            for component in component_list:
                supported_ops.append(component.op)

            # Checks pipeline node types are compatible with the runtime selected
            for single_pipeline in pipeline_json['pipelines']:
                pipeline_id = single_pipeline['id']
                node_list = single_pipeline['nodes']
                for node in node_list:
                    if node['type'] == "execution_node" and node['op'] not in supported_ops:
                        node_label = node['app_data']['ui_data'].get('label', node['app_data']['label'])
                        response.add_message(severity=ValidationSeverity.Error,
                                             message_type="invalidNodeType",
                                             message="Unsupported node type found in this pipeline",
                                             data={"nodeID": node['id'],
                                                   "nodeOpName": node['op'],
                                                   "nodeName": node_label,
                                                   "pipelineID": pipeline_id})
        else:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidRuntime",
                                 message="Unsupported pipeline runtime selected in this pipeline",
                                 data={"pipelineRuntime": pipeline_runtime,
                                       "pipelineID": pipeline_id})

    async def _validate_node_properties(self, pipeline: dict, pipeline_runtime: str,
                                        pipeline_execution: str, response: ValidationResponse) -> None:
        """
        Validates each of the node's structure for required fields/properties as well as
        their values
        :param pipeline: the pipeline definition to be validated
        :param pipeline_runtime: name of the pipeline runtime being used e.g. kfp, airflow, generic
        :param pipeline_execution: name of the pipeline runtime for execution  e.g. kfp, airflow, local
        :param response: ValidationResponse containing the issue list to be updated
        """
        pipeline_json = json.loads(json.dumps(pipeline))

        for single_pipeline in pipeline_json['pipelines']:
            node_list = single_pipeline['nodes']
            pipeline_runtime = 'local' if pipeline_runtime == 'generic' else pipeline_runtime
            component_list = await PipelineProcessorManager.instance().get_components(pipeline_runtime)
            categories: list = await PipelineProcessorManager.instance().get_all_categories(pipeline_runtime)
            components = ComponentRegistry.to_canvas_palette(component_list, categories)
            for node in node_list:
                if node['type'] == 'execution_node':
                    # Get Node Label
                    if node['app_data'].get('ui_data'):  # If present, always the source of truth
                        node_label = node['app_data']['ui_data'].get('label')
                    else:
                        node_label = node['app_data'].get('label')
                    # Get Node Data
                    node_data = node['app_data'].get('component_parameters') or node['app_data']

                    if Operation.is_generic_operation(node['op']):
                        resource_name_list = ['cpu', 'gpu', 'memory']
                        image_name = node_data.get('runtime_image')
                        filename = node_data.get("filename")
                        dependencies = node_data.get("dependencies")
                        env_vars = node_data.get("env_vars")

                        self._validate_filepath(node_id=node['id'], node_label=node_label, property_name='filename',
                                                filename=filename, response=response)

                        # If not running locally, we check resource and image name
                        if pipeline_execution != 'local':
                            self._validate_container_image_name(node['id'], node_label, image_name, response=response)
                            for resource_name in resource_name_list:
                                if resource_name in node_data.keys() and node_data.get(resource_name):
                                    self._validate_resource_value(node['id'], node_label, resource_name=resource_name,
                                                                  resource_value=node_data[resource_name],
                                                                  response=response)

                        # Check label against kfp naming standards
                        if pipeline_runtime == 'kfp' and node_label and filename != node_label:
                            self._validate_label(node_id=node['id'], node_label=node_label, response=response)
                        if dependencies:
                            notebook_root_relative_path = os.path.dirname(filename)
                            for dependency in dependencies:
                                self._validate_filepath(node_id=node['id'], node_label=node_label,
                                                        file_dir=os.path.join(self.root_dir,
                                                                              notebook_root_relative_path),
                                                        property_name='dependencies',
                                                        filename=dependency, response=response)
                        if env_vars:
                            for env_var in env_vars:
                                self._validate_environmental_variables(node['id'], node_label, env_var=env_var,
                                                                       response=response)

                    # Validate runtime components against specific node properties in component registry
                    else:
                        # This is the full dict of properties for the operation e.g. current params, optionals etc
                        property_dict = await self._get_component_properties(pipeline_runtime, components, node['op'])
                        cleaned_property_list = list(map(lambda x: str(x).replace('elyra_', ''),
                                                         property_dict['current_parameters'].keys()))

                        # Remove the non component_parameter jinja templated values we do not check against
                        cleaned_property_list.remove('component_source')
                        cleaned_property_list.remove('label')

                        for node_property in cleaned_property_list:
                            if node_property not in list(node_data.keys()):
                                if self._is_required_property(property_dict, f"elyra_{node_property}"):
                                    response.add_message(severity=ValidationSeverity.Error,
                                                         message_type="invalidNodeProperty",
                                                         message="Node is missing required property",
                                                         data={"nodeID": node['id'],
                                                               "nodeName": node_label,
                                                               "propertyName": node_property})
                            elif not isinstance(node_data[node_property],
                                                type(property_dict['current_parameters']['elyra_' + node_property])):
                                response.add_message(severity=ValidationSeverity.Error,
                                                     message_type="invalidNodeProperty",
                                                     message="Node property is incorrect type",
                                                     data={"nodeID": node['id'],
                                                           "nodeName": node_label,
                                                           "propertyName": node_property})

    def _validate_container_image_name(self, node_id: str, node_label: str, image_name: str,
                                       response: ValidationResponse) -> None:
        """
        Validates the image name exists and is proper in syntax
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param response: ValidationResponse containing the issue list to be updated
        """
        if not image_name:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodeProperty",
                                 message="Node is missing image name",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": 'runtime_image'})

    def _validate_resource_value(self, node_id: str, node_label: str, resource_name: str,
                                 resource_value: str, response: ValidationResponse) -> None:
        """
        Validates the value for hardware resources requested
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param response: ValidationResponse containing the issue list to be updated
        :param resource_name: the name of the resource e.g. cpu, gpu. memory
        :param resource_value: the value of the resource
        """
        try:
            if int(resource_value) <= 0:
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidNodeProperty",
                                     message="Property must be greater than zero",
                                     data={"nodeID": node_id,
                                           "nodeName": node_label,
                                           "propertyName": resource_name})
        except (ValueError, TypeError):
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodeProperty",
                                 message="Property has a non-parsable value",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": resource_name})

    def _validate_filepath(self, node_id: str, node_label: str, property_name: str,
                           filename: str, response: ValidationResponse, file_dir: Optional[str] = "") -> None:
        """
        Checks the file structure, paths and existence of pipeline dependencies.
        Note that this does not cross reference with file path references within the notebook or script itself.
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param property_name: name of the node property being validated
        :param file_dir: the dir path of the where the pipeline file resides in the elyra workspace
        :param filename: the name of the file or directory to verify
        :param response: ValidationResponse containing the issue list to be updated
        """
        file_dir = file_dir or self.root_dir

        if filename == os.path.abspath(filename):
            normalized_path = os.path.normpath(filename)
        elif filename.startswith(file_dir):
            normalized_path = os.path.normpath(filename)
        else:
            normalized_path = os.path.normpath(f"{file_dir}/{filename}")

        if not os.path.commonpath([normalized_path, self.root_dir]) == self.root_dir:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidFilePath",
                                 message="Property has an invalid reference to a file/dir outside the root workspace",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": property_name,
                                       "value": normalized_path})
        elif '*' in normalized_path:
            if len(glob(normalized_path)) == 0:
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidFilePath",
                                     message="Property(wildcard) has an invalid path to a file/dir"
                                             " or the file/dir does not exist",
                                     data={"nodeID": node_id,
                                           "nodeName": node_label,
                                           "propertyName": property_name,
                                           "value": normalized_path})
        elif not os.path.exists(normalized_path):
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidFilePath",
                                 message="Property has an invalid path to a file/dir or the file/dir does not exist",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": property_name,
                                       "value": normalized_path})

    def _validate_environmental_variables(self, node_id: str, node_label: str,
                                          env_var: str, response: ValidationResponse) -> None:
        """
        Checks the format of the env var to ensure its in the correct form
        e.g. FOO = 'BAR'
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param env_var: the env_var key value pair to check
        :param response: ValidationResponse containing the issue list to be updated
        """
        result = [x.strip(' \'\"') for x in env_var.split('=', 1)]
        if len(result) != 2:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidEnvPair",
                                 message="Property has an improperly formatted env variable key value pair",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": 'env_vars',
                                       "value": env_var})

    def _validate_label(self, node_id: str, node_label: str, response: ValidationResponse) -> None:
        """
        KFP specific check for the label name when constructing the node operation using dsl
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param response: ValidationResponse containing the issue list to be updated
        """
        label_name_max_length = 63
        label_regex = re.compile('^[a-z0-9]([-a-z0-9]{0,62}[a-z0-9])?')
        matched = label_regex.search(node_label)

        if len(node_label) > label_name_max_length:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodeLabel",
                                 message="Property string value has exceeded the max length allowed ",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": 'label',
                                       "value": node_label})

        elif matched.group(0) != node_label:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodeLabel",
                                 message="Property string must start contain only lower alphanumeric and dashes",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": 'label',
                                       "value": node_label})

    def _validate_pipeline_graph(self, pipeline: dict, response: ValidationResponse) -> None:
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
                    if node.get('inputs'):
                        if 'links' in node['inputs'][0]:
                            for link in node['inputs'][0]['links']:
                                graph.add_edge(link['node_id_ref'], node['id'])

        for isolate in nx.isolates(graph):
            if graph.number_of_nodes() > 1:
                response.add_message(severity=ValidationSeverity.Warning,
                                     message_type="singletonReference",
                                     message="This node is not connected to any part of the pipeline",
                                     data={"nodeID": isolate,
                                           "nodeNames": self._get_node_names(pipeline=pipeline, node_id_list=[isolate]),
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
                                       "nodeNames": self._get_node_names(pipeline=pipeline,
                                                                         node_id_list=cycle_link_list),
                                       "linkIDList": cycle_link_list})

    def _get_link_id(self, pipeline: dict, u_edge: str, v_edge: str) -> str:
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

    def _get_pipeline_id(self, pipeline: dict, node_id: str) -> str:
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

    async def _get_component_properties(self, pipeline_runtime: str, components: dict, node_op: str) -> Dict:
        """
        Retrieve the full dict of properties associated with the node_op
        :param components: list of components associated with the pipeline runtime being used e.g. kfp, airflow
        :param node_op: the node operation e.g. execute-notebook-node
        :return: a list of property names associated with the node op
        """

        if node_op == "execute-notebook-node":
            node_op = "notebooks"
        elif node_op == "execute-r-node":
            node_op = "r-script"
        elif node_op == "execute-python-node":
            node_op = "python-script"
        for category in components['categories']:
            for node_type in category['node_types']:
                if node_op == node_type['op']:
                    component: Component = \
                        await PipelineProcessorManager.instance().get_component(pipeline_runtime, node_op)
                    component_properties = ComponentRegistry.to_canvas_properties(component)
                    return component_properties

        return {}

    def _get_runtime_schema(self, pipeline: dict, response: ValidationResponse) -> str:
        pipeline_json = json.loads(json.dumps(pipeline))
        if not self._is_legacy_pipeline(pipeline):
            runtime = pipeline_json['pipelines'][0]['app_data']['properties'].get('runtime')
        else:
            # Assume Generic since properties field doesnt exist = older version of pipeline schema
            runtime = "Generic"

        if runtime == "Kubeflow Pipelines":
            return "kfp"
        elif runtime == "Apache Airflow":
            return "airflow"
        elif runtime == "Generic":
            return "generic"
        else:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidRuntime",
                                 message="Unsupported pipeline runtime selected in this pipeline",
                                 data={"pipelineRuntime": runtime})

    def _get_node_names(self, pipeline: dict, node_id_list: list) -> List:
        """
        Given a node_id_list, will return the node's name for each node_id in the list, respectively
        :param pipeline: pipeline definition where the node is located
        :param node_id_list: a list of UUIDs defined in the pipeline file
        :return: a string representing the name of the node
        """
        node_name_list = []
        pipeline_json = json.loads(json.dumps(pipeline))
        for node_id in node_id_list:
            for single_pipeline in pipeline_json['pipelines']:
                nodes = single_pipeline['nodes']
                for node in nodes:
                    if node['id'] == node_id:
                        node_name_list.append(node['app_data'].get('label'))

        return node_name_list

    def _is_legacy_pipeline(self, pipeline: dict) -> bool:
        """
        Checks the pipeline to determine if the pipeline is an older legacy schema
        :param pipeline: the pipeline dict
        :return:
        """
        return pipeline['pipelines'][0]['app_data'].get('properties') is None

    def _is_required_property(self, property_dict: dict, node_property: str) -> bool:
        """
        Determine whether or not a component parameter is required to function correctly
        :param property_dict: the dictionary for the component
        :param node_property: the component property to check
        :return:
        """
        node_op_parameter_list = property_dict['uihints']['parameter_info']
        for parameter in node_op_parameter_list:
            if parameter['parameter_ref'] == node_property:
                return parameter['data']['required']
        return False
