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
import logging

from .pipeline import Pipeline, Operation
from traitlets.config import LoggingConfigurable

DEFAULT_RUNTIME = "kfp"
DEFAULT_FILETYPE = "tar.gz"


class PipelineParser(LoggingConfigurable):

    @staticmethod
    def parse(pipeline_definition) -> Pipeline:
        """
        The pipeline definition allows for defining multiple pipelines
        in one json file. When supernodes are used, its node actually
        references another pipeline in the pipeline definition.
        For now, we are not supporting supernodes and only the
        primary pipeline is being processed.
        """

        # Check for required values.  We require a primary_pipeline, a set of pipelines, and
        # nodes within the primary pipeline (checked below).
        if 'primary_pipeline' not in pipeline_definition:
            raise ValueError("Invalid pipeline: Could not determine the primary pipeline.")
        if 'pipelines' not in pipeline_definition:
            raise ValueError("Invalid pipeline: Pipeline definition not found.")
        if len(pipeline_definition['pipelines']) > 1:
            raise ValueError("Invalid pipeline: Multiple pipelines is not supported (e.g. Supernode).")

        pipeline = None
        primary_pipeline_id = pipeline_definition['primary_pipeline']
        for p in pipeline_definition['pipelines']:
            pipeline_id = p['id']
            if pipeline_id == primary_pipeline_id:
                pipeline = p
                break

        if not pipeline:
            raise ValueError("Invalid pipeline: Primary pipeline '{}' not found.".format(primary_pipeline_id))

        if 'nodes' not in pipeline or len(pipeline['nodes']) == 0:
            raise ValueError("Invalid pipeline: At least one node must exist in primary pipeline.")

        pipeline_object = Pipeline(pipeline['id'],
                                   PipelineParser._read_pipeline_name(pipeline),
                                   PipelineParser._read_pipeline_runtime(pipeline),
                                   PipelineParser._read_pipeline_runtime_config(pipeline))

        for node in pipeline['nodes']:
            # Supernodes are not supported
            if node['type'] == "super_node":
                raise ValueError('Invalid pipeline: Supernode feature is not supported.')

            # parse links as dependencies
            links = PipelineParser._read_pipeline_operation_parent_operations(node)

            # parse each node as a pipeline operation
            operation = Operation(
                id=node['id'],
                type=node['type'],
                filename=node['app_data']['filename'],
                runtime_image=node['app_data']['runtime_image'],
                env_vars=node['app_data'].get('env_vars') or [],
                dependencies=node['app_data'].get('dependencies') or [],
                include_subdirectories=node['app_data'].get('include_subdirectories') or False,
                outputs=node['app_data'].get('outputs') or [],
                parent_operations=links
            )
            # add valid operation to list of operations
            pipeline_object.operations[operation.id] = operation

        return pipeline_object

    @property
    def logger(self):
        if self.__logger is None:
            self.__logger = logging.getLogger(self.__module__)
        return self.__logger

    @staticmethod
    def _read_pipeline_name(pipeline) -> str:
        name = 'untitled'
        if 'app_data' in pipeline.keys():
            if 'name' in pipeline['app_data'].keys():
                name = pipeline['app_data']['name']

        return name

    @staticmethod
    def _read_pipeline_runtime(pipeline) -> str:
        # default runtime type
        runtime = DEFAULT_RUNTIME
        if 'app_data' in pipeline.keys():
            if 'runtime' in pipeline['app_data'].keys():
                runtime = pipeline['app_data']['runtime']

        return runtime

    @staticmethod
    def _read_pipeline_runtime_config(pipeline) -> str:
        runtime_config = None
        if 'app_data' in pipeline.keys():
            if 'runtime-config' in pipeline['app_data'].keys():
                runtime_config = pipeline['app_data']['runtime-config']

        return runtime_config

    @staticmethod
    def _read_pipeline_operation_parent_operations(node) -> list:
        dependencies = []
        if 'inputs' in node.keys():
            if 'links' in node['inputs'][0].keys():
                links = node['inputs'][0]['links']
                for link in links:
                    if 'port_id_ref' in link.keys() and link['port_id_ref'] == 'outPort':
                        if 'node_id_ref' in link:
                            dependencies.append(link['node_id_ref'])

        return dependencies
