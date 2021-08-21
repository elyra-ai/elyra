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
from typing import Optional


class NodeBase():
    _pipeline_definition: Dict = None
    _node: Dict = None

    def __init__(self, pipeline_definition: Dict, node: Dict):
        self._pipeline_definition = pipeline_definition
        self._node = node

    @property
    def id(self) -> str:
        return self._node.get('id')

    @property
    def pipeline(self) -> Dict:
        return self._pipeline_definition

    def get(self, key: str, default_value=None) -> Any:
        return self._node['app_data'].get(key, default_value)

    def set(self, key: str, value: Any):
        if not key:
            raise ValueError("Key is required")

        if not value:
            raise ValueError("Value is required")

        self._node['app_data'][key] = value

    def validate(self) -> list:
        pass

    def is_valid(self) -> bool:
        return len(self.validate()) == 0

    def to_dict(self) -> Dict:
        return self._node


class Pipeline(NodeBase):
    _nodes: list = None

    def __init__(self, pipeline_definition: Dict, node: Dict):
        super().__init__(pipeline_definition, node)

    @property
    def version(self) -> int:
        return int(self._node['app_data'].get('version'))

    @property
    def runtime(self) -> str:
        return self._node['app_data'].get('runtime')

    @property
    def runtime_config(self) -> str:
        return self._node['app_data'].get('runtime-config')

    @property
    def type(self):
        type_description_to_type = {'Kubeflow Pipelines': 'kfp',
                                    'Apache Airflow': 'airflow',
                                    'Generic': 'generic'}

        pipeline_type_description = self._node['app_data']['properties'].get('runtime')
        if pipeline_type_description not in type_description_to_type.keys():
            raise ValueError(f'Unsupported pipeline runtime: {pipeline_type_description}')
        return type_description_to_type[pipeline_type_description]

    @property
    def name(self):
        return self._node['app_data'].get('name') or 'untitled'

    @property
    def source(self):
        return self._node['app_data'].get('source')

    @property
    def nodes(self) -> list:
        if not self._nodes:
            if 'nodes' not in self._node:
                raise ValueError("Pipeline is missing 'nodes' field.")
            # elif len(self._node['nodes']) == 0:
            #     raise ValueError("Pipeline has zero length 'nodes' field.")

            nodes: list = list()
            for node in self._node['nodes']:
                nodes.append(Node(self._pipeline_definition, node))

            self._nodes = nodes

        return self._nodes

    def get_property(self, key: str, default_value=None) -> Any:
        self._validate()
        return self._node['app_data']['properties'].get(key, default_value)

    def set_property(self, key: str, value: Any):
        if not key:
            raise ValueError("Key is required")

        if not value:
            raise ValueError("Value is required")

        self._node['app_data']['properties'][key] = value

    def validate(self) -> list:
        validation_issues = list()
        if 'properties' not in self._node['app_data']:
            validation_issues.append("Node is missing 'properties' field.")
        elif len(self._node['app_data']['properties']) == 0:
            validation_issues.append("Pipeline has zero length 'properties' field.")

        return validation_issues


class Node(NodeBase):
    def __init__(self, pipeline_definition: Dict, node: Dict):
        super().__init__(pipeline_definition, node)

    @property
    def type(self) -> str:
        return self._node.get('type')

    @property
    def op(self) -> str:
        return self._node.get('op')

    @property
    def label(self) -> str:
        return self._node['app_data']['ui_data'].get('label', self._node['app_data']['label'])

    def get_component_parameter(self, key: str, default_value=None) -> Any:
        return self._node['app_data']['component_parameters'].get(key, default_value)

    def set_component_parameter(self, key: str, value: Any):
        if not key:
            raise ValueError("Key is required")

        if not value:
            raise ValueError("Value is required")

        self._node['app_data']['component_parameters'][key] = value

    def validate(self) -> list:
        validation_issues = list()
        if "component_parameters" not in self._node['app_data']:
            validation_issues.append("Node is missing 'component_parameters' field")

        return validation_issues


class PipelineDefinition(object):
    """
    Represents a helper class to manipulate pipeline json structure
    """
    _pipelines: list = None
    _primary_pipeline = None

    def __init__(self, pipeline_path: Optional[str] = None, pipeline_definition: Optional[Dict] = None):
        """
        The constructor enables either passing a pipeline path or the content of the pipeline definition.

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

    @property
    def id(self) -> str:
        return self._pipeline_definition.get('id')

    @property
    def schema_version(self) -> str:
        return self._pipeline_definition.get('version')

    @property
    def pipelines(self) -> list:
        if not self._pipelines:
            if 'pipelines' not in self._pipeline_definition:
                raise ValueError("Pipeline is missing 'pipelines' field.")
            elif len(self._pipeline_definition['pipelines']) == 0:
                raise ValueError("Pipeline has zero length 'pipelines' field.")

            pipelines: list = list()
            for pipeline in self._pipeline_definition['pipelines']:
                pipelines.append(Pipeline(self._pipeline_definition, pipeline))

            self._pipelines = pipelines

        return self._pipelines

    @property
    def primary_pipeline(self) -> Pipeline:
        if not self._primary_pipeline:
            if "pipelines" not in self._pipeline_definition:
                raise ValueError("Pipeline is missing 'pipelines' field.")
            elif len(self._pipeline_definition['pipelines']) == 0:
                raise ValueError("Pipeline has zero length 'pipelines' field.")

            # Find primary pipeline
            self._primary_pipeline = self._get_pipeline_definition(self._pipeline_definition.get('primary_pipeline'))

            assert self._primary_pipeline is not None, "No primary pipeline was found"

        return Pipeline(self._pipeline_definition, self._primary_pipeline)

    def validate(self) -> list:
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

        primary_pipeline = self._get_pipeline_definition(self._pipeline_definition.get('primary_pipeline'))
        if not primary_pipeline:
            validation_issues.append("No primary pipeline was found")
        else:
            # Validate primary pipeline structure
            if 'nodes' not in primary_pipeline or len(primary_pipeline['nodes']) == 0:
                validation_issues.append("At least one node must exist in the primary pipeline.")
            if 'app_data' not in primary_pipeline:
                validation_issues.append("Primary pipeline is missing the 'app_data' field.")
            elif 'version' not in primary_pipeline['app_data']:
                validation_issues.append("Primary pipeline is missing the 'version' field.")

        return validation_issues

    def is_valid(self) -> bool:
        return len(self.validate()) == 0

    def to_dict(self) -> Dict:
        return self._pipeline_definition

    def _get_pipeline_definition(self, pipeline_id):
        if 'pipelines' in self._pipeline_definition:
            for pipeline in self._pipeline_definition["pipelines"]:
                if pipeline['id'] == pipeline_id:
                    return pipeline

        return None
