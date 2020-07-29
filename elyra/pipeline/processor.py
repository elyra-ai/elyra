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
from traitlets.config import SingletonConfigurable, LoggingConfigurable


class PipelineProcessorRegistry(SingletonConfigurable):
    __processors = {}

    def __init__(self):
        super(PipelineProcessorRegistry, self).__init__()

        # Register all known processors based on entrypoint configuration
        for processor in entrypoints.get_group_all('elyra.pipeline.processors'):
            try:
                # instantiate an actual instance of the processor
                processor_instance = processor.load()()  # Load an instance
                processor_type = processor_instance.type
                self.log.info('Registering processor "{}" with type -> {}'.format(processor, processor_type))
                self.__processors[processor_type] = processor_instance
            except Exception:
                # log and ignore initialization errors
                self.log.error('Error registering processor "{}"'.format(processor))

    def add_processor(self, processor):
        self.log.debug('Registering processor {}'.format(processor.type))
        self.__processors[processor.type] = processor

    def get_processor(self, processor_type):
        if processor_type in self.__processors.keys():
            return self.__processors[processor_type]
        else:
            return None


class PipelineProcessorManager(SingletonConfigurable):

    def __init__(self, **kwargs):
        super(PipelineProcessorManager, self).__init__()
        # Since root_dir may contain '~' for user home, use expanduser()
        self.root_dir = os.path.expanduser(kwargs.get('root_dir', os.getcwd()))

    async def process(self, pipeline):
        registry = PipelineProcessorRegistry()

        processor_type = pipeline.runtime
        processor = registry.get_processor(processor_type)

        if not processor:
            raise RuntimeError('Could not find pipeline processor for [{}]'.format(pipeline.runtime))

        processor.root_dir = self.root_dir
        res = await asyncio.get_event_loop().run_in_executor(None, processor.process, pipeline)
        return res

    async def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        registry = PipelineProcessorRegistry()

        processor_type = pipeline.runtime
        processor = registry.get_processor(processor_type)

        if not processor:
            raise RuntimeError('Could not find pipeline processor for [{}]'.format(pipeline.runtime))

        processor.root_dir = self.root_dir
        res = await asyncio.get_event_loop().run_in_executor(
            None, processor.export, pipeline, pipeline_export_format, pipeline_export_path, overwrite)
        return res


class PipelineProcessorResponse(object):
    def __init__(self, run_url, object_storage_url, object_storage_path):
        # validate that the response has all required properties
        if not run_url:
            raise ValueError("Invalid Processor Response: Missing field 'run_url'.")
        if not object_storage_url:
            raise ValueError("Invalid Processor Response: Missing field 'object_storage_url'.")
        if not object_storage_path:
            raise ValueError("Invalid Processor Response: Missing field 'object_storage_path'.")

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

    @property
    def root_dir(self):
        return self._root_dir

    @root_dir.setter
    def root_dir(self, value):
        self._root_dir = value

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

    def get_absolute_path(self, path):
        """Checks if path is absolute or not.  If not absolute, `path` is appended to `root_dir`. """

        absolute_path = path
        if not os.path.isabs(path):
            absolute_path = os.path.join(self.root_dir, path)

        return absolute_path
