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


class PipelineParser(LoggingConfigurable):

    @staticmethod
    def parse(pipeline) -> Pipeline:

        # The pipeline blueprint enables defining multiple pipelines
        # in one pipeline json file. For now we only support processing
        # one (primary) pipeline.
        primary_pipeline_id = pipeline['primary_pipeline']
        for p in pipeline['pipelines']:
            pipeline_id = p['id']
            if pipeline_id == primary_pipeline_id:
                pipeline = p

        if not pipeline:
            raise RuntimeError('Primary pipeline not found.')

        pipeline_object = Pipeline(pipeline['id'],
                                   __class__._read_pipeline_title(pipeline),
                                   __class__._read_pipeline_runtime(pipeline),
                                   __class__._read_pipeline_runtime_config(pipeline))

        for node in pipeline['nodes']:
            # parse links as dependencies
            links = __class__._read_pipeline_operation_dependencies(node)

            try:
                # parse each node as a pipeline operation
                operation = Operation(
                    id=node['id'],
                    type=node['type'],
                    title=node['app_data']['ui_data']['label'],
                    artifact=node['app_data']['artifact'],
                    image=node['app_data']['image'],
                    vars=node['app_data'].get('vars') or [],
                    file_dependencies=node['app_data'].get('dependencies') or [],
                    recursive_dependencies=node['app_data'].get('recursive_dependencies') or False,
                    outputs=node['app_data'].get('outputs') or [],
                    dependencies=links
                )
                pipeline_object.operations[operation.id] = operation
            except BaseException as e:
                raise AttributeError('Invalid pipeline format: Missing field {}'.format(e))

        return pipeline_object

    @property
    def logger(self):
        if self.__logger is None:
            self.__logger = logging.getLogger(self.__module__)
        return self.__logger

    @staticmethod
    def _read_pipeline_title(pipeline) -> str:
        title = 'untitled'
        if 'app_data' in pipeline.keys():
            if 'title' in pipeline['app_data'].keys():
                title = pipeline['app_data']['title']

        return title

    @staticmethod
    def _read_pipeline_runtime(pipeline) -> str:
        # default runtime type
        runtime = 'kfp'
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
    def _read_pipeline_operation_dependencies(node) -> str:
        dependencies = []
        if 'inputs' in node.keys():
            if 'links' in node['inputs'][0].keys():
                links = node['inputs'][0]['links']
                for link in links:
                    if 'port_id_ref' in link.keys() and link['port_id_ref'] == 'outPort':
                        if 'node_id_ref' in link:
                            dependencies.append(link['node_id_ref'])

        return dependencies
