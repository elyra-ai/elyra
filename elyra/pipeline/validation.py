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
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import PIPELINE_CURRENT_SCHEMA
from elyra.pipeline.pipeline import PIPELINE_CURRENT_VERSION
from elyra.pipeline.pipeline_definition import PipelineDefinition
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

        pipeline_definition = PipelineDefinition(pipeline_definition=pipeline)
        issues = pipeline_definition.validate()
        for issue in issues:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidJSON",
                                 message=issue)

        try:
            pipeline_definition.primary_pipeline
        except ValueError:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidJSON",
                                 message="Invalid JSON detected, unable to continue.")

            return response

        pipeline_runtime = pipeline_definition.primary_pipeline.runtime  # local, kfp, airflow
        if PipelineProcessorManager.instance().is_supported_runtime(pipeline_runtime) is False:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidRuntime",
                                 message="Unsupported pipeline runtime",
                                 data={"pipelineRuntime": pipeline_runtime})

        pipeline_type = pipeline_definition.primary_pipeline.type  # generic, kfp, airflow
        if pipeline_type == 'generic' and \
                PipelineProcessorManager.instance().is_supported_runtime(pipeline_runtime) is False:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidRuntime",
                                 message="Unsupported pipeline type",
                                 data={"pipelineRuntime": pipeline_type})

        self._validate_pipeline_structure(pipeline_definition=pipeline_definition,
                                          response=response)

        await self._validate_compatibility(pipeline_definition=pipeline_definition,
                                           pipeline_type=pipeline_type,
                                           pipeline_runtime=pipeline_runtime,
                                           response=response)

        self._validate_pipeline_graph(pipeline=pipeline, response=response)

        if response.has_fatal:
            return response

        await self._validate_node_properties(pipeline_definition=pipeline_definition,
                                             pipeline_type=pipeline_type,
                                             pipeline_runtime=pipeline_runtime,
                                             response=response)

        return response

    def _validate_pipeline_structure(self, pipeline_definition: PipelineDefinition,
                                     response: ValidationResponse) -> None:
        """
        Validates the pipeline structure based on version of schema
        :param pipeline_definition: the pipeline definition to be validated
        :param response: ValidationResponse containing the issue list to be updated
        """

        # Validate pipeline schema version
        if float(pipeline_definition.schema_version) != PIPELINE_CURRENT_SCHEMA:
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Incompatible pipeline schema version detected.",
                                 data={"supported_schema_version": PIPELINE_CURRENT_SCHEMA,
                                       "detected_schema_version": float(pipeline_definition.schema_version)})

        # validate pipeline version compatibility
        pipeline_version = int(pipeline_definition.primary_pipeline.version)
        if pipeline_version not in range(PIPELINE_CURRENT_VERSION + 1):
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message="Primary pipeline version field has an invalid value.",
                                 data={"supported_version": PIPELINE_CURRENT_VERSION,
                                       "detected_version": pipeline_version})

        elif pipeline_version < PIPELINE_CURRENT_VERSION:
            # Pipeline needs to be migrated
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message=f'Pipeline version {pipeline_version} is out of date and needs to be migrated '
                                         f'using the Elyra pipeline editor.')
        elif pipeline_version > PIPELINE_CURRENT_VERSION:
            # New version of Elyra is needed
            response.add_message(severity=ValidationSeverity.Error, message_type="invalidPipeline",
                                 message='Pipeline was last edited in a newer version of Elyra. '
                                         'Update Elyra to use this pipeline.',
                                 data={"supported_version": PIPELINE_CURRENT_VERSION,
                                       "detected_version": pipeline_version})

    async def _validate_compatibility(self, pipeline_definition: PipelineDefinition,
                                      pipeline_type: str,
                                      pipeline_runtime: str,
                                      response: ValidationResponse) -> None:
        """
        Checks that the pipeline payload is compatible with this version of elyra (ISSUE #938)
        as well as verifying all nodes in the pipeline are supported by the runtime
        :param pipeline_definition: the pipeline definition to be validated
        :param pipeline_type: name of the pipeline runtime being used e.g. kfp, airflow, generic
        :param pipeline_runtime: name of the pipeline runtime for execution  e.g. kfp, airflow, local
        :param response: ValidationResponse containing the issue list to be updated
        """

        primary_pipeline_id = pipeline_definition.primary_pipeline.id
        supported_ops = []

        if pipeline_runtime:
            if pipeline_runtime != pipeline_type and pipeline_type != 'generic':
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidRuntime",
                                     message="Pipeline runtime platform is not compatible "
                                             "with selected runtime configuration.",
                                     data={"pipelineID": primary_pipeline_id,
                                           "pipelineType": pipeline_type,
                                           "pipelineRuntime": pipeline_runtime})
            elif PipelineProcessorManager.instance().is_supported_runtime(pipeline_runtime):
                component_list = await PipelineProcessorManager.instance().get_components(pipeline_runtime)
                for component in component_list:
                    supported_ops.append(component.op)

                # Checks pipeline node types are compatible with the runtime selected
                for sub_pipeline in pipeline_definition.pipelines:
                    for node in sub_pipeline.nodes:
                        if node.type == "execution_node" and node.op not in supported_ops:
                            response.add_message(severity=ValidationSeverity.Error,
                                                 message_type="invalidNodeType",
                                                 message="This component was not found in the registry. Please add it "
                                                         "to your component registry or remove this node from the "
                                                         "pipeline",
                                                 data={"nodeID": node.id,
                                                       "nodeOpName": node.op,
                                                       "nodeName": node.label,
                                                       "pipelineId": sub_pipeline.id})
            else:
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidRuntime",
                                     message="Unsupported pipeline runtime",
                                     data={"pipelineRuntime": pipeline_runtime,
                                           "pipelineType": pipeline_type,
                                           "pipelineId": primary_pipeline_id})

    async def _validate_node_properties(self, pipeline_definition: PipelineDefinition,
                                        pipeline_type: str,
                                        pipeline_runtime: str,
                                        response: ValidationResponse) -> None:
        """
        Validates each of the node's structure for required fields/properties as well as
        their values
        :param pipeline_definition: the pipeline definition to be validated
        :param pipeline_type: name of the pipeline runtime being used e.g. kfp, airflow, generic
        :param pipeline_runtime: name of the pipeline runtime for execution  e.g. kfp, airflow, local
        :param response: ValidationResponse containing the issue list to be updated
        """
        if pipeline_runtime:
            # don't check if incompatible pipeline type and runtime
            if pipeline_runtime != pipeline_type and pipeline_type != 'generic':
                return

        for pipeline in pipeline_definition.pipelines:
            component_list = await PipelineProcessorManager.instance().get_components(pipeline_runtime)
            components = ComponentRegistry.to_canvas_palette(component_list)
            for node in pipeline.nodes:
                if node.type == 'execution_node':
                    node_label = node.label
                    if Operation.is_generic_operation(node.op):
                        image_name = node.get_component_parameter('runtime_image')
                        filename = node.get_component_parameter("filename")
                        dependencies = node.get_component_parameter("dependencies")
                        env_vars = node.get_component_parameter("env_vars")

                        self._validate_filepath(node_id=node.id, node_label=node_label, property_name='filename',
                                                filename=filename, response=response)

                        # If not running locally, we check resource and image name
                        if pipeline_runtime != 'local':
                            self._validate_container_image_name(node.id, node_label, image_name, response=response)
                            for resource_name in ['cpu', 'gpu', 'memory']:
                                resource_value = node.get_component_parameter(resource_name)
                                if resource_value:
                                    self._validate_resource_value(node.id, node_label, resource_name=resource_name,
                                                                  resource_value=resource_value,
                                                                  response=response)

                        self._validate_label(node_id=node.id, node_label=node_label, response=response)
                        if dependencies:
                            notebook_root_relative_path = os.path.dirname(filename)
                            for dependency in dependencies:
                                self._validate_filepath(node_id=node.id, node_label=node_label,
                                                        file_dir=os.path.join(self.root_dir,
                                                                              notebook_root_relative_path),
                                                        property_name='dependencies',
                                                        filename=dependency, response=response)
                        if env_vars:
                            for env_var in env_vars:
                                self._validate_environmental_variables(node.id, node_label, env_var=env_var,
                                                                       response=response)

                    # Validate runtime components against specific node properties in component registry
                    else:
                        # This is the full dict of properties for the operation e.g. current params, optionals etc
                        property_dict = await self._get_component_properties(pipeline_type, components, node.op)
                        cleaned_property_list = list(map(lambda x: str(x).replace('elyra_', ''),
                                                         property_dict['current_parameters'].keys()))

                        # Remove the non component_parameter jinja templated values we do not check against
                        cleaned_property_list.remove('component_source')
                        cleaned_property_list.remove('label')

                        for node_property in cleaned_property_list:
                            if not node.get_component_parameter(node_property):
                                if self._is_required_property(property_dict, node_property):
                                    response.add_message(severity=ValidationSeverity.Error,
                                                         message_type="invalidNodeProperty",
                                                         message="Node is missing required property.",
                                                         data={"nodeID": node.id,
                                                               "nodeName": node_label,
                                                               "propertyName": node_property})
                            elif self._get_component_type(property_dict, node_property) == 'inputpath':
                                if len(node.get_component_parameter(node_property).keys()) < 2:
                                    response.add_message(severity=ValidationSeverity.Error,
                                                         message_type="invalidNodeProperty",
                                                         message="Node is missing required output property parameter",
                                                         data={"nodeID": node.id,
                                                               "nodeName": node_label})
                                else:
                                    for key in node.get_component_parameter(node_property).keys():
                                        if key not in ['value', 'option']:
                                            response.add_message(severity=ValidationSeverity.Error,
                                                                 message_type="invalidNodeProperty",
                                                                 message="Node property has invalid key.",
                                                                 data={"nodeID": node.id,
                                                                       "nodeName": node_label,
                                                                       "propertyName": node_property,
                                                                       "keyName": key})

                                node_ids = list(x.get('node_id_ref', None) for x in node.component_links)
                                parent_list = self._get_parent_id_list(pipeline_definition, node_ids, [])
                                if node.get_component_parameter(node_property)['value'] not in parent_list:
                                    response.add_message(severity=ValidationSeverity.Error,
                                                         message_type="invalidNodeProperty",
                                                         message="Node contains an invalid inputpath reference. Please "
                                                                 "check your node-to-node connections",
                                                         data={"nodeID": node.id,
                                                               "nodeName": node_label})

    def _validate_container_image_name(self, node_id: str, node_label: str, image_name: str,
                                       response: ValidationResponse) -> None:
        """
        Validates the image name exists and is proper in syntax
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param image_name: container image name to be evaluated
        :param response: ValidationResponse containing the issue list to be updated
        """
        if not image_name:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodeProperty",
                                 message="Required property value is missing.",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": 'runtime_image'})
        else:
            image_regex = re.compile(r"[^/ ]+/[^/ ]+$")
            matched = image_regex.search(image_name)
            if not matched:
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidNodeProperty",
                                     message="Node contains an invalid runtime image. Runtime image "
                                             "must conform to the format [registry/]owner/image:tag",
                                     data={"nodeID": node_id,
                                           "nodeName": node_label,
                                           "propertyName": 'runtime_image',
                                           "imageName": image_name})

    def _validate_resource_value(self, node_id: str, node_label: str, resource_name: str,
                                 resource_value: str, response: ValidationResponse) -> None:
        """
        Validates the value for hardware resources requested
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param resource_name: the name of the resource e.g. cpu, gpu. memory
        :param resource_value: the value of the resource
        :param response: ValidationResponse containing the issue list to be updated
        """
        try:
            if int(resource_value) <= 0:
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidNodeProperty",
                                     message="Property must be greater than zero.",
                                     data={"nodeID": node_id,
                                           "nodeName": node_label,
                                           "propertyName": resource_name,
                                           "value": resource_value})
        except (ValueError, TypeError):
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidNodeProperty",
                                 message="Property has a non-numeric value.",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": resource_name,
                                       "value": resource_value})

    def _validate_filepath(self, node_id: str, node_label: str, property_name: str,
                           filename: str, response: ValidationResponse, file_dir: Optional[str] = "") -> None:
        """
        Checks the file structure, paths and existence of pipeline dependencies.
        Note that this does not cross reference with file path references within the notebook or script itself.
        :param node_id: the unique ID of the node
        :param node_label: the given node name or user customized name/label of the node
        :param property_name: name of the node property being validated
        :param filename: the name of the file or directory to verify
        :param response: ValidationResponse containing the issue list to be updated
        :param file_dir: the dir path of the where the pipeline file resides in the elyra workspace
        """
        file_dir = file_dir or self.root_dir

        if filename == os.path.abspath(filename):
            normalized_path = os.path.normpath(filename)
        elif filename.startswith(file_dir):
            normalized_path = os.path.normpath(filename)
        else:
            normalized_path = os.path.normpath(f"{os.path.join(file_dir, filename)}")

        if not os.path.commonpath([normalized_path, self.root_dir]) == self.root_dir:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidFilePath",
                                 message="Property has an invalid reference to a file/dir outside the root workspace.",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": property_name,
                                       "value": normalized_path})
        elif '*' in normalized_path:
            if len(glob(normalized_path)) == 0:
                response.add_message(severity=ValidationSeverity.Error,
                                     message_type="invalidFilePath",
                                     message="Property(wildcard) has an invalid path to a file/dir"
                                             " or the file/dir does not exist.",
                                     data={"nodeID": node_id,
                                           "nodeName": node_label,
                                           "propertyName": property_name,
                                           "value": normalized_path})
        elif not os.path.exists(normalized_path):
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="invalidFilePath",
                                 message="Property has an invalid path to a file/dir or the file/dir does not exist.",
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
                                 message="Property has an improperly formatted env variable key value pair.",
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
        label_regex = re.compile('^[a-z0-9]([-_.a-z0-9]{0,62}[a-z0-9])?')
        matched = label_regex.search(node_label)

        if len(node_label) > label_name_max_length:
            response.add_message(severity=ValidationSeverity.Warning,
                                 message_type="invalidNodeLabel",
                                 message="Property value exceeds the max length allowed "
                                         "({label_name_max_length}). This value may be truncated "
                                         "by the runtime service.",
                                 data={"nodeID": node_id,
                                       "nodeName": node_label,
                                       "propertyName": 'label',
                                       "value": node_label})
        if not matched or matched.group(0) != node_label:
            response.add_message(severity=ValidationSeverity.Warning,
                                 message_type="invalidNodeLabel",
                                 message="The node label contains characters that may be replaced "
                                         "by the runtime service. Node labels should "
                                         "start with lower case alphanumeric and contain "
                                         "only lower case alphanumeric, underscores, dots, and dashes.",
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
                        if "links" in node['inputs'][0]:
                            for link in node['inputs'][0]['links']:
                                if "_outPort" in link['port_id_ref']:  # is ref to node, doesnt add links to supernodes
                                    graph.add_edge(link['port_id_ref'].strip('_outPort'), node['id'])
                                elif link['port_id_ref'] == "outPort":  # do not link to bindings
                                    graph.add_edge(link['node_id_ref'], node['id'])
                if node['type'] == "super_node":
                    for link in node['inputs'][0]['links']:
                        child_node_id = node['inputs'][0]['id'].strip("_inPort")
                        graph.add_edge(link['node_id_ref'], child_node_id)

        for isolate in nx.isolates(graph):
            if graph.number_of_nodes() > 1:
                response.add_message(severity=ValidationSeverity.Warning,
                                     message_type="singletonReference",
                                     message="Node is not connected to any other node.",
                                     data={"nodeID": isolate,
                                           "nodeName":
                                           self._get_node_names(pipeline=pipeline, node_id_list=[isolate])[0],
                                           "pipelineID": self._get_pipeline_id(pipeline, node_id=isolate)})

        cycles_detected = nx.simple_cycles(graph)

        if len(list(cycles_detected)) > 0:
            response.add_message(severity=ValidationSeverity.Error,
                                 message_type="circularReference",
                                 message="The pipeline contains a circular dependency between nodes.",
                                 data={})

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

    async def _get_component_properties(self, pipeline_type: str, components: dict, node_op: str) -> Dict:
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
                        await PipelineProcessorManager.instance().get_component(pipeline_type, node_op)
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
                                 message="Unsupported pipeline runtime selected in this pipeline.",
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
            found = False
            for single_pipeline in pipeline_json['pipelines']:
                for node in single_pipeline['nodes']:
                    if node['id'] == node_id:
                        node_name_list.append(self._get_node_label(node))
                        found = True
                        break
                if found:
                    break

        return node_name_list

    def _get_node_labels(self, pipeline: dict, link_ids: List[str]) -> List[str]:
        """
        Returns the names (labels) of the nodes that are connected by
        the specified link_ids.

        :param pipeline: the pipeline dict
        :param link_ids: list of link ids from pipeline
        :return a tuple containing two node labels that are connected
        """
        if link_ids is None:
            return None

        pipeline_json = json.loads(json.dumps(pipeline))
        node_labels = []
        for link_id in link_ids:
            for single_pipeline in pipeline_json['pipelines']:
                for node in single_pipeline['nodes']:
                    if node['type'] == "execution_node":
                        for input in node.get('inputs', []):
                            for link in input.get('links', []):
                                if link['id'] == link_id:
                                    node_labels.append(self._get_node_label(node))
        return node_labels

    def _get_node_label(self, node: dict) -> str:
        """
        Returns the label for the provided node or None if the information
        cannot be derived from the inpuit dictionary.

        :param node: a dict representing a pipeline node
        :return: the label of the node
        """

        if node is None or node.get('app_data') is None:
            return None

        node_label = node['app_data'].get('label')
        if node['type'] == 'execution_node' and node['app_data'].get('ui_data'):
            node_label = node['app_data']['ui_data'].get('label')
        return node_label

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
            if parameter['parameter_ref'] == f"elyra_{node_property}":
                return parameter['data']['required']
        return False

    def _get_component_type(self, property_dict: dict, node_property: str) -> str:
        """
        Helper function to determine the type of a node property
        :param property_dict: a dictionary containing the full list of property parameters and descriptions
        :param node_property: the property to look for
        :return: the data type associated with node_property, defaults to 'string'
        """
        for prop in property_dict['uihints']['parameter_info']:
            if prop["parameter_ref"] == f"elyra_{node_property}":
                return prop['data'].get('format', 'string')

    def _get_parent_id_list(self, pipeline_definition: PipelineDefinition,
                            node_id_list: list, parent_list: list) -> List:
        """
        Helper function to return a complete list of parent node_ids
        :param pipeline_definition: the complete pipeline definition
        :param node_id_list: list of parent node ids
        :param parent_list: the list to add additional found parent node ids
        :return:
        """
        for node_id in node_id_list:
            node = pipeline_definition.get_node(node_id)
            if node:
                if node.type in ['execution_node', 'super_node']:
                    parent_list.append(node_id)
                    node_ids = list(x.get('node_id_ref', None) for x in node.component_links)
                    for nid in node_ids:  # look-ahead to determine if node is a binding node
                        if pipeline_definition.get_node(nid).type == 'binding':
                            node_ids.remove(nid)
                            for super_node in pipeline_definition.get_supernodes():
                                if super_node['inputs'][0]['subflow_node_ref'] == nid:
                                    links = list(x.get('node_id_ref', None) for x in super_node.component_links)
                                    node_ids.append(links)
                    self._get_parent_id_list(pipeline_definition, node_ids, parent_list)
                else:  # binding node
                    pass
        return parent_list
