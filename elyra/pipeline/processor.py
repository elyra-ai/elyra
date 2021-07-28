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
from abc import ABC
from abc import abstractmethod
import asyncio
import functools
import os
import time
from typing import Dict
from typing import List
from typing import Optional

import entrypoints
from jupyter_core.paths import ENV_JUPYTER_PATH
from minio.error import SignatureDoesNotMatch
from traitlets.config import Bool
from traitlets.config import LoggingConfigurable
from traitlets.config import SingletonConfigurable
from traitlets.config import Unicode
from urllib3.exceptions import MaxRetryError

from elyra.metadata.manager import MetadataManager
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentCategory
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component_registry import CachedComponentRegistry
from elyra.pipeline.component_registry import ComponentRegistry
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.util.archive import create_temp_archive
from elyra.util.cos import CosClient
from elyra.util.path import get_expanded_path

elyra_log_pipeline_info = os.getenv("ELYRA_LOG_PIPELINE_INFO", True)


class PipelineProcessorRegistry(SingletonConfigurable):
    _processors = {}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.root_dir = get_expanded_path(kwargs.get('root_dir'))
        # Register all known processors based on entrypoint configuration
        for processor in entrypoints.get_group_all('elyra.pipeline.processors'):
            try:
                # instantiate an actual instance of the processor
                processor_instance = processor.load()(self.root_dir, parent=kwargs.get('parent'))  # Load an instance
                self.log.info(f'Registering processor "{processor}" with type -> {processor_instance.type}')
                self.add_processor(processor_instance)
            except Exception as err:
                # log and ignore initialization errors
                self.log.error('Error registering processor "{}" - {}'.format(processor, err))

    def add_processor(self, processor):
        self.log.debug(f'Registering processor {processor.type}')
        self._processors[processor.type] = processor

    def get_processor(self, processor_type: str):
        if self.is_valid_processor(processor_type):
            return self._processors[processor_type]
        else:
            raise RuntimeError('Could not find pipeline processor for [{}]'.format(processor_type))

    def is_valid_processor(self, processor_type: str) -> bool:
        return processor_type in self._processors.keys()


class PipelineProcessorManager(SingletonConfigurable):
    _registry: PipelineProcessorRegistry

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.root_dir = get_expanded_path(kwargs.get('root_dir'))
        self._registry = PipelineProcessorRegistry.instance()

    def _get_processor_for_runtime(self, processor_type: str):
        processor = self._registry.get_processor(processor_type)
        return processor

    def is_supported_runtime(self, processor_type: str) -> bool:
        return self._registry.is_valid_processor(processor_type)

    async def get_components(self, processor_type):
        processor = self._get_processor_for_runtime(processor_type)

        res = await asyncio.get_event_loop().run_in_executor(None, processor.get_components)
        return res

    async def get_component(self, processor_type, component_id):
        processor = self._get_processor_for_runtime(processor_type)

        res = await asyncio.get_event_loop().\
            run_in_executor(None, functools.partial(processor.get_component, component_id=component_id))
        return res

    async def get_all_categories(self, processor_type):
        processor = self._get_processor_for_runtime(processor_type)

        res = await asyncio.get_event_loop().run_in_executor(None, processor.get_all_categories)
        return res

    async def process(self, pipeline):
        processor = self._get_processor_for_runtime(pipeline.runtime)

        res = await asyncio.get_event_loop().run_in_executor(None, processor.process, pipeline)
        return res

    async def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        processor = self._get_processor_for_runtime(pipeline.runtime)

        res = await asyncio.get_event_loop().run_in_executor(
            None, processor.export, pipeline, pipeline_export_format, pipeline_export_path, overwrite)
        return res


class PipelineProcessorResponse(ABC):

    _type = None

    def __init__(self, run_url, object_storage_url, object_storage_path):
        self._run_url = run_url
        self._object_storage_url = object_storage_url
        self._object_storage_path = object_storage_path

    @property
    @abstractmethod
    def type(self):
        raise NotImplementedError()

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
        return {"platform": self.type,
                "run_url": self.run_url,
                "object_storage_url": self.object_storage_url,
                "object_storage_path": self.object_storage_path
                }


class PipelineProcessor(LoggingConfigurable):  # ABC

    _type: str = None

    _component_registry: ComponentRegistry = None

    root_dir = Unicode(allow_none=True)

    enable_pipeline_info = Bool(config=True,
                                default_value=(os.getenv('ELYRA_ENABLE_PIPELINE_INFO', 'true').lower() == 'true'),
                                help="""Produces formatted logging of informational messages with durations
                                (default=True). (ELYRA_ENABLE_PIPELINE_INFO env var)""")

    def __init__(self, root_dir, **kwargs):
        super().__init__(**kwargs)
        self.root_dir = root_dir

    @property
    @abstractmethod
    def type(self) -> str:
        raise NotImplementedError()

    def get_components(self) -> List[Component]:
        """
        Retrieve components common to all runtimes
        """
        components: List[Component] = ComponentRegistry.get_generic_components()

        # Retrieve runtime-specific components
        if self._component_registry:
            components.extend(self._component_registry.get_all_components())

        return components

    def get_component(self, component_id: str) -> Optional[Component]:
        """
        Retrieve runtime-specific component details if component_id is not one of the generic set
        """

        if component_id not in ('notebook', 'python-script', 'r-script'):
            return self._component_registry.get_component(component_id=component_id)

        return ComponentRegistry.get_generic_component(component_id)

    def get_all_categories(self) -> List[ComponentCategory]:
        categories: List[ComponentCategory] = [ComponentRegistry.get_generic_category()]

        if self._component_registry:
            categories.extend(self._component_registry.get_all_categories())

        return categories

    @abstractmethod
    def process(self, pipeline) -> PipelineProcessorResponse:
        raise NotImplementedError()

    @abstractmethod
    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError()

    def log_pipeline_info(self, pipeline_name: str, action_clause: str, **kwargs):
        """
        Produces a formatted log INFO message used entirely for support purposes.

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

    @staticmethod
    def _propagate_operation_inputs_outputs(pipeline: Pipeline, sorted_operations: List[Operation]) -> None:
        """
        All previous operation outputs should be propagated throughout the pipeline.
        In order to process this recursively, the current operation's inputs should be combined
        from its parent's inputs (which, themselves are derived from the outputs of their parent)
        and its parent's outputs.
        """
        for operation in sorted_operations:
            parent_io = set()  # gathers inputs & outputs relative to parent
            for parent_operation_id in operation.parent_operation_ids:
                parent_operation = pipeline.operations[parent_operation_id]
                if parent_operation.inputs:
                    parent_io.update(parent_operation.inputs)
                if parent_operation.outputs:
                    parent_io.update(parent_operation.outputs)

            if parent_io:
                parent_io.update(operation.inputs)
                operation.inputs = list(parent_io)

    @staticmethod
    def _sort_operations(operations_by_id: dict) -> List[Operation]:
        """
        Sort the list of operations based on its dependency graph
        """
        ordered_operations = []

        for operation in operations_by_id.values():
            PipelineProcessor._sort_operation_dependencies(operations_by_id,
                                                           ordered_operations,
                                                           operation)

        return ordered_operations

    @staticmethod
    def _sort_operation_dependencies(operations_by_id: dict, ordered_operations: list, operation: Operation) -> None:
        """
        Helper method to the main sort operation function
        """
        # Optimization: check if already processed
        if operation not in ordered_operations:
            # process each of the dependencies that needs to be executed first
            for parent_operation_id in operation.parent_operation_ids:
                parent_operation = operations_by_id[parent_operation_id]
                if parent_operation not in ordered_operations:
                    PipelineProcessor._sort_operation_dependencies(operations_by_id,
                                                                   ordered_operations,
                                                                   parent_operation)
            ordered_operations.append(operation)


class RuntimePipelineProcessor(PipelineProcessor):

    @property
    def registry_location(self) -> str:
        return self._component_registry_location

    @property
    def component_parser(self) -> ComponentParser:
        return self._component_parser

    def __init__(self, root_dir: str, component_parser: ComponentParser, **kwargs):
        super().__init__(root_dir, **kwargs)

        # then sys.prefix, where installed files will reside (factory data)
        self._component_registry_location = \
            os.path.join(ENV_JUPYTER_PATH[0], 'components', f"{self._type}_component_catalog.json")

        if not os.path.exists(self._component_registry_location):
            raise FileNotFoundError(f'Invalid component registry location: {self._component_registry_location}'
                                    f' for "{self._type}" processor')

        self._component_parser = component_parser
        self._component_registry = CachedComponentRegistry(self.registry_location, component_parser)

    def _get_dependency_archive_name(self, operation):
        artifact_name = os.path.basename(operation.filename)
        (name, ext) = os.path.splitext(artifact_name)
        return name + '-' + operation.id + ".tar.gz"

    def _get_dependency_source_dir(self, operation):
        return os.path.join(self.root_dir, os.path.dirname(operation.filename))

    def _generate_dependency_archive(self, operation):
        archive_artifact_name = self._get_dependency_archive_name(operation)
        archive_source_dir = self._get_dependency_source_dir(operation)

        dependencies = [os.path.basename(operation.filename)]
        dependencies.extend(operation.dependencies)

        archive_artifact = create_temp_archive(archive_name=archive_artifact_name,
                                               source_dir=archive_source_dir,
                                               filenames=dependencies,
                                               recursive=operation.include_subdirectories,
                                               require_complete=True)

        return archive_artifact

    def _upload_dependencies_to_object_store(self, runtime_configuration, pipeline_name, operation):
        operation_artifact_archive = self._get_dependency_archive_name(operation)
        cos_directory = pipeline_name
        # upload operation dependencies to object store
        try:
            t0 = time.time()
            dependency_archive_path = self._generate_dependency_archive(operation)
            self.log_pipeline_info(pipeline_name,
                                   f"generated dependency archive: {dependency_archive_path}",
                                   operation_name=operation.name,
                                   duration=(time.time() - t0))

            cos_client = CosClient(config=runtime_configuration)

            t0 = time.time()
            cos_client.upload_file_to_dir(dir=cos_directory,
                                          file_name=operation_artifact_archive,
                                          file_path=dependency_archive_path)
            self.log_pipeline_info(pipeline_name,
                                   f"uploaded dependency archive to: {cos_directory}/{operation_artifact_archive}",
                                   operation_name=operation.name,
                                   duration=(time.time() - t0))

        except FileNotFoundError as ex:
            self.log.error("Dependencies were not found building archive for operation: {}".
                           format(operation.name), exc_info=True)
            raise FileNotFoundError("Node '{}' referenced dependencies that were not found: {}".
                                    format(operation.name, ex)) from ex
        except MaxRetryError as ex:
            cos_endpoint = runtime_configuration.metadata.get('cos_endpoint')
            self.log.error("Connection was refused when attempting to connect to : {}".
                           format(cos_endpoint), exc_info=True)
            raise RuntimeError("Connection was refused when attempting to upload artifacts to : '{}'. Please "
                               "check your object storage settings. ".format(cos_endpoint)) from ex
        except SignatureDoesNotMatch as ex:
            raise RuntimeError("Connection was refused due to incorrect Object Storage credentials. " +
                               "Please validate your runtime configuration details and retry.") from ex
        except BaseException as ex:
            self.log.error("Error uploading artifacts to object storage for operation: {}".
                           format(operation.name), exc_info=True)
            raise ex from ex

    def _get_metadata_configuration(self, namespace, name=None):
        """
        Retrieve associated metadata configuration based on namespace provided and optional instance name
        :return: metadata in json format
        """
        try:
            if not name:
                return MetadataManager(namespace=namespace).get_all()
            else:
                return MetadataManager(namespace=namespace).get(name)
        except BaseException as err:
            self.log.error('Error retrieving metadata configuration for {}'.format(name), exc_info=True)
            raise RuntimeError('Error retrieving metadata configuration for {}', err) from err

    def _collect_envs(self, operation: GenericOperation, **kwargs) -> Dict:
        """
        Collect the envs stored on the Operation and set the system-defined ELYRA_RUNTIME_ENV

        Note: subclasses should call their superclass (this) method first.
        :return: dictionary containing environment name/value pairs
        """

        envs: Dict = operation.env_vars_as_dict(logger=self.log)
        envs['ELYRA_RUNTIME_ENV'] = self.type

        if 'cos_secret' not in kwargs or not kwargs['cos_secret']:
            envs['AWS_ACCESS_KEY_ID'] = kwargs['cos_username']
            envs['AWS_SECRET_ACCESS_KEY'] = kwargs['cos_password']
        else:  # ensure the "access-key" envs are NOT present...
            envs.pop('AWS_ACCESS_KEY_ID', None)
            envs.pop('AWS_SECRET_ACCESS_KEY', None)

        # Convey pipeline logging enablement to operation
        envs['ELYRA_ENABLE_PIPELINE_INFO'] = str(self.enable_pipeline_info)
        return envs
