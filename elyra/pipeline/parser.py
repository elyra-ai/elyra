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
            id = PipelineParser._read_app_data_field(p, 'id'),
            if not id:
                raise ValueError("Invalid pipeline: Missing field 'id'.")

            pipeline_id = p['id']
            if pipeline_id == primary_pipeline_id:
                pipeline = p
                break

        if not pipeline:
            raise ValueError("Invalid pipeline: Primary pipeline '{}' not found.".format(primary_pipeline_id))

        if 'nodes' not in pipeline or len(pipeline['nodes']) == 0:
            raise ValueError("Invalid pipeline: At least one node must exist in primary pipeline.")

        runtime = PipelineParser._read_app_data_field(pipeline, 'runtime')
        if not runtime:
            raise ValueError("Invalid pipeline: Missing runtime.")
        runtime_config = PipelineParser._read_app_data_field(pipeline, 'runtime-config')
        if not runtime_config:
            raise ValueError("Invalid pipeline: Missing runtime configuration.")

        pipeline_object = Pipeline(id=id,
                                   name=PipelineParser._read_app_data_field(pipeline, 'name', 'untitled'),
                                   runtime=runtime,
                                   runtime_config=runtime_config)

        for node in pipeline['nodes']:
            # Supernodes are not supported
            node_type = PipelineParser._read_field(node, 'type')
            if node_type:
                if node['type'] == "super_node":
                    raise ValueError('Invalid pipeline: Supernode feature is not supported.')

            # parse links as dependencies
            links = PipelineParser._read_pipeline_parent_operation_dependencies(node)

            # parse each node as a pipeline operation
            operation = Operation(
                id=PipelineParser._read_field(node, 'id'),
                type=PipelineParser._read_field(node, 'type'),
                classifier=PipelineParser._read_field(node, 'op'),
                filename=PipelineParser._read_app_data_field(node, 'filename'),
                runtime_image=PipelineParser._read_app_data_field(node, 'runtime_image'),
                dependencies=PipelineParser._read_app_data_field(node, 'dependencies', []),  # or []
                include_subdirectories=PipelineParser._read_app_data_field(node, 'include_subdirectories', False),
                # or False
                env_vars=PipelineParser._read_app_data_field(node, 'env_vars', []),  # or []
                outputs=PipelineParser._read_app_data_field(node, 'outputs', []),  # or []
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
    def _read_field(node, field_name, defaultValue=None):
        return_value = node.get(field_name, defaultValue)
        return return_value

    @staticmethod
    def _read_app_data_field(node, field_name, default_value=None):
        if 'app_data' in node.keys():
            return_value = node['app_data'].get(field_name, default_value)
            return return_value
        else:
            return default_value

    @staticmethod
    def _read_pipeline_parent_operation_dependencies(node) -> list:
        dependencies = []
        if 'inputs' in node.keys():
            if 'links' in node['inputs'][0].keys():
                links = node['inputs'][0]['links']
                for link in links:
                    if 'port_id_ref' in link.keys() and link['port_id_ref'] == 'outPort':
                        if 'node_id_ref' in link:
                            dependencies.append(link['node_id_ref'])

        return dependencies
