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
from typing import Any
from typing import Dict
from typing import List
from typing import Optional


class AppDataBase:  # ABC
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
        return self._node.get('id')

    def get(self, key: str, default_value=None) -> Any:
        """
        Retrieve node values for a given key.
        These key/value pairs are stored in the app_data stanza
        :param key: The key to be retrieved
        :param default_value: a default value in case the key is not found
        :return: the value or the default_value if the key is not found
        """
        return self._node['app_data'].get(key, default_value)

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

        self._node['app_data'][key] = value

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
        The pipelive version
        :return: The version
        """
        return int(self._node['app_data'].get('version'))

    @property
    def runtime(self) -> str:
        """
        The runtime associated with the pipeline
        :return: The runtime keyword
        """
        return self._node['app_data'].get('runtime')

    @property
    def runtime_config(self) -> str:
        """
        The runtime configuration associated with the pipeline
        :return: The runtime configuration key. This should be a valid key from the Runtimes metadata
        """
        return self._node['app_data'].get('runtime-config')

    @property
    def type(self):
        """
        The pipeline type
        :return: The runtime keyword associated with the pipeline or `generic`
        """
        type_description_to_type = {'Kubeflow Pipelines': 'kfp',
                                    'Apache Airflow': 'airflow',
                                    'Generic': 'generic'}

        if 'properties' in self._node['app_data']:
            pipeline_type_description = self._node['app_data']['properties'].get('runtime', 'Generic')
            if pipeline_type_description not in type_description_to_type.keys():
                raise ValueError(f'Unsupported pipeline runtime: {pipeline_type_description}')
            return type_description_to_type[pipeline_type_description]
        else:
            return type_description_to_type['Generic']

    @property
    def name(self) -> str:
        """
        The pipeline name
        :rtype: The pipeline name or `untitled`
        """
        return self._node['app_data'].get('name', self._node['app_data'].get('properties', {}).get('name', 'untitled'))

    @property
    def source(self) -> str:
        """
        The pipeline source
        :rtype: The pipeline source
        """
        return self._node['app_data'].get('source')

    @property
    def nodes(self) -> list:
        """
        The list of nodes for the pipeline
        :rtype: object
        """
        if 'nodes' not in self._node:
            raise ValueError("Pipeline is missing 'nodes' field.")

        if self._nodes is None:
            nodes: list = list()
            for node in self._node['nodes']:
                nodes.append(Node(node))

            self._nodes = nodes

        return self._nodes

    def get_property(self, key: str, default_value=None) -> Any:
        """
        Retrieve pipeline values for a given key.
        :param key: the key to be retrieved
        :param default_value: a default value in case the key is not found
        :return: the value or the default_value if the key is not found
        """
        return_value = default_value
        if 'properties' in self._node['app_data']:
            return_value = self._node['app_data']['properties'].get(key, default_value)

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

        self._node['app_data']['properties'][key] = value


class Node(AppDataBase):
    def __init__(self, node: Dict):
        super().__init__(node)

    @property
    def type(self) -> str:
        """
        The node type
        :return: type (e.g. execution_node, super_node)
        """
        return self._node.get('type')

    @property
    def op(self) -> str:
        """
        The node op, which identify the operation to be executed
        :return: op (e.g. execute-notebook-node)
        """
        return self._node.get('op')

    @property
    def label(self) -> str:
        """
        The node label
        :return:  node label
        """
        return self._node['app_data']['ui_data'].get('label', self._node['app_data'].get('label', None))

    @property
    def subflow_pipeline_id(self) -> Pipeline:
        """
        The Super Node pipeline reference. Only available when type is a super node.
        :return:
        """
        if self._node['type'] != 'super_node':
            raise ValueError("Node must be a super_node in order to retrieve a subflow pipeline id")

        if 'subflow_ref' in self._node:
            return self._node['subflow_ref'].get('pipeline_id_ref')
        else:
            return None

    @property
    def component_links(self) -> List:
        """
        Retrieve component links to other components.
        :return: the list of links associated with this node or an empty list if none are found
        """
        if self.type in ['execution_node', 'super_node']:
            return self._node['inputs'][0].get('links', [])
        else:
            #  binding nodes do not contain links
            return []

    def get_component_parameter(self, key: str, default_value=None) -> Any:
        """
        Retrieve component parameter values.
        These key/value pairs are stored in app_data.component_parameters
        :param key: the parameter key to be retrieved
        :param default_value: a default value in case the key is not found
        :return: the value or the default value if the key is not found
        """
        return self._node['app_data']['component_parameters'].get(key, default_value)

    def set_component_parameter(self, key: str, value: Any):
        """
        Update component parameter values for a given key.
        These key/value pairs are stored in app_data.component_parameters
        :param key: The parameter key to be retrieved
        :param value: the value to be set
        """
        if not key:
            raise ValueError("Key is required")

        if not value:
            raise ValueError("Value is required")

        self._node['app_data']['component_parameters'][key] = value


class PipelineDefinition(object):
    """
    Represents a helper class to manipulate pipeline json structure
    """
    _pipelines: list = None
    _primary_pipeline: Pipeline = None
    _validated: bool = False
    _validation_issues: list = None

    def __init__(self, pipeline_path: Optional[str] = None,
                 pipeline_definition: Optional[Dict] = None,
                 validate: bool = False):
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

    @property
    def id(self) -> str:
        """
        The pipeline definition id
        :return: the unid
        """
        return self._pipeline_definition.get('id')

    @property
    def schema_version(self) -> str:
        """
        The schema used by the Pipeline definition
        :return: the version
        """
        return self._pipeline_definition.get('version')

    @property
    def pipelines(self) -> list:
        """
        The list of pipelines defined in the pipeline definition
        :return: the list of pipelines
        """
        if not self._pipelines:
            if 'pipelines' not in self._pipeline_definition:
                raise ValueError("Pipeline is missing 'pipelines' field.")
            elif len(self._pipeline_definition['pipelines']) == 0:
                raise ValueError("Pipeline has zero length 'pipelines' field.")

            pipelines: list = list()
            for pipeline in self._pipeline_definition['pipelines']:
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
            elif len(self._pipeline_definition['pipelines']) == 0:
                raise ValueError("Pipeline has zero length 'pipelines' field.")

            # Find primary pipeline
            self._primary_pipeline = self.get_pipeline_definition(self._pipeline_definition.get('primary_pipeline'))

            assert self._primary_pipeline is not None, "No primary pipeline was found"

        return self._primary_pipeline

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
        validation_issues = list()
        # Validate pipeline schema version
        if 'version' not in self._pipeline_definition:
            validation_issues.append("Pipeline schema version field is missing.")
        elif not isinstance(self._pipeline_definition['version'], str):
            validation_issues.append("Pipeline schema version field should be a string.")

        # Validate pipelines
        if 'pipelines' not in self._pipeline_definition:
            validation_issues.append("Pipeline is missing 'pipelines' field.")
        elif not isinstance(self._pipeline_definition["pipelines"], list):
            validation_issues.append("Field 'pipelines' should be a list.")
        elif len(self._pipeline_definition['pipelines']) == 0:
            validation_issues.append("Pipeline has zero length 'pipelines' field.")

        # Validate primary pipeline
        if 'primary_pipeline' not in self._pipeline_definition:
            validation_issues.append("Could not determine the primary pipeline.")
        elif not isinstance(self._pipeline_definition["primary_pipeline"], str):
            validation_issues.append("Field 'primary_pipeline' should be a string.")

        primary_pipeline = self.get_pipeline_definition(self._pipeline_definition.get('primary_pipeline'))
        if not primary_pipeline:
            validation_issues.append("No primary pipeline was found")
        else:
            primary_pipeline = primary_pipeline.to_dict()
            # Validate primary pipeline structure
            if 'app_data' not in primary_pipeline:
                validation_issues.append("Primary pipeline is missing the 'app_data' field.")
            else:
                if 'version' not in primary_pipeline['app_data']:
                    validation_issues.append("Primary pipeline is missing the 'version' field.")
                if 'properties' not in primary_pipeline['app_data']:
                    validation_issues.append("Node is missing 'properties' field.")
                elif len(primary_pipeline['app_data']['properties']) == 0:
                    validation_issues.append("Pipeline has zero length 'properties' field.")

            if 'nodes' not in primary_pipeline or len(primary_pipeline['nodes']) == 0:
                validation_issues.append("At least one node must exist in the primary pipeline.")
            else:
                for node in primary_pipeline['nodes']:
                    if "component_parameters" not in node['app_data']:
                        validation_issues.append("Node is missing 'component_parameters' field")

        return validation_issues

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
        if 'pipelines' in self._pipeline_definition:
            for pipeline in self._pipeline_definition["pipelines"]:
                if pipeline['id'] == pipeline_id:
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
