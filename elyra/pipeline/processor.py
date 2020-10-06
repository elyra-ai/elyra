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
import asyncio
import entrypoints
import os

from abc import abstractmethod
from elyra.util.path import get_expanded_path
from traitlets.config import SingletonConfigurable, LoggingConfigurable, Unicode, Bool

elyra_log_pipeline_info = os.getenv("ELYRA_LOG_PIPELINE_INFO", True)


class PipelineProcessorRegistry(SingletonConfigurable):
    _processors = {}

    def __init__(self):
        super(PipelineProcessorRegistry, self).__init__()

    def add_processor(self, processor):
        self.log.debug('Registering processor {}'.format(processor.type))
        self._processors[processor.type] = processor

    def get_processor(self, processor_type):
        if processor_type in self._processors.keys():
            return self._processors[processor_type]
        else:
            return None


class PipelineProcessorManager(SingletonConfigurable):
    _registry: PipelineProcessorRegistry

    def __init__(self, **kwargs):
        super(PipelineProcessorManager, self).__init__(**kwargs)
        self.root_dir = get_expanded_path(kwargs.get('root_dir'))

        self._registry = PipelineProcessorRegistry.instance()
        # Register all known processors based on entrypoint configuration
        for processor in entrypoints.get_group_all('elyra.pipeline.processors'):
            try:
                # instantiate an actual instance of the processor
                processor_instance = processor.load()(self.root_dir, parent=self)  # Load an instance
                self.log.info('Registering processor "{}" with type -> {}'.format(processor, processor_instance.type))
                self._registry.add_processor(processor_instance)
            except Exception as err:
                # log and ignore initialization errors
                self.log.error('Error registering processor "{}" - {}'.format(processor, err))

    async def process(self, pipeline):
        processor_type = pipeline.runtime
        processor = self._registry.get_processor(processor_type)

        if not processor:
            raise RuntimeError('Could not find pipeline processor for [{}]'.format(pipeline.runtime))

        res = await asyncio.get_event_loop().run_in_executor(None, processor.process, pipeline)
        return res

    async def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        processor_type = pipeline.runtime
        processor = self._registry.get_processor(processor_type)

        if not processor:
            raise RuntimeError('Could not find pipeline processor for [{}]'.format(pipeline.runtime))

        res = await asyncio.get_event_loop().run_in_executor(
            None, processor.export, pipeline, pipeline_export_format, pipeline_export_path, overwrite)
        return res


class PipelineProcessorResponse(object):
    def __init__(self, run_url='', object_storage_url='', object_storage_path=''):
        self._run_url = run_url
        self._object_storage_url = object_storage_url
        self._object_storage_path = object_storage_path

    @property
    def run_url(self):
        """
        :return: The runtime URL to access the pipeline experiment
        """
        return self._run_url

    @property
    def object_storage_url(self):
        """
        :return: The object storage URL to access the pipeline outputs
                 and processed notebooks
        """
        return self._object_storage_url

    @property
    def object_storage_path(self):
        """
        :return: The object storage working directory path where the pipeline outputs
                 and processed notebooks are located
        """
        return self._object_storage_path

    def to_json(self):
        return {"run_url": self.run_url,
                "object_storage_url": self.object_storage_url,
                "object_storage_path": self.object_storage_path
                }


class PipelineProcessor(LoggingConfigurable):  # ABC

    _type = None

    root_dir = Unicode(allow_none=True)

    enable_pipeline_info = Bool(config=True,
                                default_value=(os.getenv('ELYRA_ENABLE_PIPELINE_INFO', 'true').lower() == 'true'),
                                help="""Produces formatted logging of informational messages with durations
                                (default=True). (ELYRA_ENABLE_PIPELINE_INFO env var)""")

    def __init__(self, root_dir, **kwargs):
        super(PipelineProcessor, self).__init__(**kwargs)
        self.root_dir = root_dir

    @property
    @abstractmethod
    def type(self):
        raise NotImplementedError()

    @abstractmethod
    def process(self, pipeline) -> PipelineProcessorResponse:
        raise NotImplementedError()

    @abstractmethod
    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError()

    def log_pipeline_info(self, pipeline_name: str, action_clause: str, **kwargs):
        """Produces a formatted log INFO message used entirely for support purposes.

        This method is intended to be called for any entries that should be captured across aggregated
        log files to identify steps within a given pipeline and each of its operations.  As a result,
        calls to this method should produce single-line entries in the log (no embedded newlines).
        Each entry is prefixed with the pipeline name.  This functionality can be disabled by setting
        PipelineProcessor.enable_pipeline_info = False (or via env ELYRA_ENABLE_PIPELINE_INFO).

        General logging should NOT use this method but use logger.<level>() statements directly.

        :param pipeline_name: str representing the name of the pipeline that is being executed
        :param action_clause: str representing the action that is being logged
        :param **kwargs: dict representing the keyword arguments.  Recognized keywords include:
               operation_name: str representing the name of the operation applicable for this entry
               duration: float value representing the duration of the action being logged
        """
        if self.enable_pipeline_info:
            duration = kwargs.get('duration')
            duration_clause = f"({duration:.3f} secs)" if duration else ""

            operation_name = kwargs.get('operation_name')
            op_clause = f":'{operation_name}'" if operation_name else ""

            self.log.info(f"{self._type} '{pipeline_name}'{op_clause} - {action_clause} {duration_clause}")
