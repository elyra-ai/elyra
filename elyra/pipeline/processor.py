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
import asyncio
import entrypoints
import os

from abc import abstractmethod
from elyra.metadata import MetadataManager
from elyra.util.path import get_expanded_path
from traitlets.config import SingletonConfigurable, LoggingConfigurable, Unicode, Bool
from typing import Optional

from .pipeline import Pipeline

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
        super(PipelineProcessorManager, self).__init__()
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


class RuntimePipelineProcessor(PipelineProcessor):  # ABC
    """Base class from which all runtime-based pipeline processors are derived. """

    def __init__(self, root_dir, **kwargs):
        super().__init__(root_dir, **kwargs)
        self._gateway_config = None

    @abstractmethod
    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError()

    def _get_gateway_config(self, pipeline: Pipeline, enabled_override: Optional[bool] = None) -> dict:
        """Gathers necessary configuration relative to communicating with an Enterprise Gateway.

        Gateway configuration is obtained from the runtime metadata instance's gateway_config
        object.  If present, it will be used to seed a dictionary of corresponding env variables
        that are then set into the environment of the operation instance during the runtime.
        """
        # Just gather and convert to env names once per pipeline
        if not self._gateway_config:
            self._gateway_config = {}

            runtime_metadata = self._get_runtime_configuration(pipeline.runtime_config)
            gateway_config = runtime_metadata.metadata.get("gateway_config")
            if gateway_config:    # Transfer runtime config to env-based values
                # Operation-based overrides are handled by caller AFTER this function..
                self._gateway_config['ELYRA_GATEWAY_ENABLED'] = str(gateway_config.get("enabled") or "false").lower()
                self._gateway_config['ELYRA_GATEWAY_URL'] = gateway_config.get("url")
                self._gateway_config['ELYRA_GATEWAY_KERNELS_ENDPOINT'] = gateway_config.get("kernels_endpoint")
                self._gateway_config['ELYRA_GATEWAY_KERNELSPECS_ENDPOINT'] = \
                    gateway_config.get("kernelspecs_endpoint")
                self._gateway_config['ELYRA_GATEWAY_REQUEST_TIMEOUT'] = str(gateway_config.get("request_timeout"))
                self._gateway_config['ELYRA_GATEWAY_CONNECT_TIMEOUT'] = str(gateway_config.get("connect_timeout"))
                self._gateway_config['ELYRA_GATEWAY_HEADERS'] = gateway_config.get("headers")
                self._gateway_config['ELYRA_GATEWAY_VALIDATE_CERT'] = str(gateway_config.get("validate_cert"))

                # Optional values that have None as a default, so only set if defined.
                if 'ws_url' in gateway_config:
                    self._gateway_config['ELYRA_GATEWAY_WS_URL'] = gateway_config.get("ws_url")
                if 'auth_token' in gateway_config:
                    self._gateway_config['ELYRA_GATEWAY_AUTH_TOKEN'] = gateway_config.get("auth_token")
                if 'client_cert' in gateway_config:
                    self._gateway_config['ELYRA_GATEWAY_CLIENT_CERT'] = gateway_config.get("client_cert")
                if 'client_key' in gateway_config:
                    self._gateway_config['ELYRA_GATEWAY_CLIENT_KEY'] = gateway_config.get("client_key")
                if 'ca_certs' in gateway_config:
                    self._gateway_config['ELYRA_GATEWAY_CA_CERTS'] = gateway_config.get("ca_certs")
                if 'http_user' in gateway_config:
                    self._gateway_config['ELYRA_GATEWAY_HTTP_USER'] = gateway_config.get("http_user")
                if 'http_pwd' in gateway_config:
                    self._gateway_config['ELYRA_GATEWAY_HTTP_PWD'] = gateway_config.get("http_pwd")

        # if user wants to use a gateway, ensure url has a value.
        if enabled_override or self._gateway_config.get("ELYRA_GATEWAY_ENABLED") == "true":
            if not self._gateway_config.get("ELYRA_GATEWAY_URL"):  # Require URL
                raise ValueError("Gateway URL is required when gateway is enabled.")

        return self._gateway_config

    def _get_runtime_configuration(self, name):
        """
        Retrieve associated runtime configuration based on processor type
        :return: metadata in json format
        """
        try:
            runtime_configuration = MetadataManager(namespace=MetadataManager.NAMESPACE_RUNTIMES).get(name)
            return runtime_configuration
        except BaseException as err:
            self.log.error('Error retrieving runtime configuration for {}'.format(name), exc_info=True)
            raise RuntimeError('Error retrieving runtime configuration for {}', err) from err
