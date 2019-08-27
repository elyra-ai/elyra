import logging

from .pipeline import Pipeline, Operation
from traitlets.config import LoggingConfigurable


class PipelineParser(LoggingConfigurable):

    @staticmethod
    def parse(pipeline):

        pipeline_object = Pipeline(pipeline['id'], __class__._read_pipeline_title(pipeline))
        for node in pipeline['nodes']:
            # parse links as dependencies
            links = __class__._read_pipeline_operation_dependencies(node)

            try:
                # parse each node as a pipeline operation
                operation = Operation(
                    id=node['id'],
                    type=node['type'],
                    title=node['app_data']['ui_data']['label'],
                    platform=node['app_data']['platform'],
                    artifact=node['app_data']['artifact'],
                    image=node['app_data']['image'],
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
    def _read_pipeline_title(pipeline):
        title = 'untitled'
        if 'app_data' in pipeline.keys():
            if 'ui_data' in pipeline['app_data'].keys():
                if 'title' in pipeline['app_data']['ui_data'].keys():
                    title = pipeline['app_data']['ui_data']['title']

        return title

    @staticmethod
    def _read_pipeline_operation_dependencies(node):
        dependencies = []
        if 'inputs' in node.keys():
            if 'links' in node['inputs'][0].keys():
                links = node['inputs'][0]['links']
                for link in links:
                    if 'port_id_ref' in link.keys() and link['port_id_ref'] == 'outPort':
                        if 'node_id_ref' in link:
                            dependencies.append(link['node_id_ref'])

        return dependencies
