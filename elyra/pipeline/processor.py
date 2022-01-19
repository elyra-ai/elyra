#
# Copyright 2018-2022 Elyra Authors
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
import ast
import asyncio
import functools
import os
import time
from typing import Dict
from typing import List
from typing import Optional
from typing import Set
from typing import Union

import entrypoints
from minio.error import S3Error
from traitlets.config import Bool
from traitlets.config import LoggingConfigurable
from traitlets.config import SingletonConfigurable
from traitlets.config import Unicode
from urllib3.exceptions import MaxRetryError

from elyra.metadata.manager import MetadataManager
from elyra.pipeline.component import Component
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Operation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.pipeline.runtime_type import RuntimeTypeResources
from elyra.util.archive import create_temp_archive
from elyra.util.cos import CosClient
from elyra.util.path import get_expanded_path

elyra_log_pipeline_info = os.getenv("ELYRA_LOG_PIPELINE_INFO", True)


class PipelineProcessorRegistry(SingletonConfigurable):
    _processors: Dict[str, 'PipelineProcessor'] = {}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.root_dir = get_expanded_path(kwargs.get('root_dir'))
        # Register all known processors based on entrypoint configuration
        for processor in entrypoints.get_group_all('elyra.pipeline.processors'):
            try:
                # instantiate an actual instance of the processor
                processor_instance = processor.load()(self.root_dir, parent=kwargs.get('parent'))  # Load an instance
                self.log.info(f'Registering {processor.name} processor '
                              f'"{processor.module_name}.{processor.object_name}"...')
                self.add_processor(processor_instance)
            except Exception as err:
                # log and ignore initialization errors
                self.log.error(f'Error registering {processor.name} processor '
                               f'"{processor.module_name}.{processor.object_name}" - {err}')

    def add_processor(self, processor):
        self.log.debug(f"Registering {processor.type.value} runtime processor '{processor.name}'")
        self._processors[processor.name] = processor

    def get_processor(self, processor_name: str):
        if self.is_valid_processor(processor_name):
            return self._processors[processor_name]
        else:
            raise RuntimeError(f"Could not find pipeline processor '{processor_name}'")

    def is_valid_processor(self, processor_name: str) -> bool:
        return processor_name in self._processors.keys()

    def get_runtime_types_resources(self) -> List[RuntimeTypeResources]:
        """Returns the set of resource instances for each active runtime type"""

        # Build set of active runtime types, then build list of resources instances
        runtime_types: Set[RuntimeProcessorType] = set()
        for name, processor in self._processors.items():
            runtime_types.add(processor.type)

        resources: List[RuntimeTypeResources] = list()
        for runtime_type in runtime_types:
            resources.append(RuntimeTypeResources.get_instance_by_type(runtime_type))

        return resources


class PipelineProcessorManager(SingletonConfigurable):
    _registry: PipelineProcessorRegistry

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.root_dir = get_expanded_path(kwargs.get('root_dir'))
        self._registry = PipelineProcessorRegistry.instance()

    def _get_processor_for_runtime(self, runtime_name: str):
        processor = self._registry.get_processor(runtime_name)
        return processor

    def is_supported_runtime(self, runtime_name: str) -> bool:
        return self._registry.is_valid_processor(runtime_name)

    def get_runtime_type(self, runtime_name: str) -> RuntimeProcessorType:
        processor = self._get_processor_for_runtime(runtime_name)
        return processor.type

    async def get_components(self, runtime_name):
        processor = self._get_processor_for_runtime(runtime_name)

        res = await asyncio.get_event_loop().run_in_executor(None, processor.get_components)
        return res

    async def get_component(self, runtime_name, component_id):
        processor = self._get_processor_for_runtime(runtime_name)

        res = await asyncio.get_event_loop().\
            run_in_executor(None, functools.partial(processor.get_component, component_id=component_id))
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

    _type: RuntimeProcessorType = None
    _name: str = None

    def __init__(self, run_url, object_storage_url, object_storage_path):
        self._run_url = run_url
        self._object_storage_url = object_storage_url
        self._object_storage_path = object_storage_path

    @property
    def type(self) -> str:  # Return the string value of the name so that JSON serialization works
        if self._type is None:
            raise NotImplementedError("_type must have a value!")
        return self._type.name

    @property
    def name(self) -> str:
        if self._name is None:
            raise NotImplementedError("_name must have a value!")
        return self._name

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

    _type: RuntimeProcessorType = None
    _name: str = None

    root_dir = Unicode(allow_none=True)

    enable_pipeline_info = Bool(config=True,
                                default_value=(os.getenv('ELYRA_ENABLE_PIPELINE_INFO', 'true').lower() == 'true'),
                                help="""Produces formatted logging of informational messages with durations
                                (default=True). (ELYRA_ENABLE_PIPELINE_INFO env var)""")

    def __init__(self, root_dir, **kwargs):
        super().__init__(**kwargs)
        self.root_dir = root_dir

    @property
    def type(self):
        if self._type is None:
            raise NotImplementedError("_type must have a value!")
        return self._type

    @property
    def name(self):
        if self._name is None:
            raise NotImplementedError("_name must have a value!")
        return self._name

    def get_components(self) -> List[Component]:
        """
        Retrieve components common to all runtimes
        """
        components: List[Component] = ComponentCache.get_generic_components()

        # Retrieve runtime-specific components
        components.extend(ComponentCache.instance().get_all_components(platform=self._type))

        return components

    def get_component(self, component_id: str) -> Optional[Component]:
        """
        Retrieve runtime-specific component details if component_id is not one of the generic set
        """

        if component_id not in ('notebook', 'python-script', 'r-script'):
            return ComponentCache.instance().get_component(platform=self._type, component_id=component_id)

        return ComponentCache.get_generic_component(component_id)

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

            self.log.info(f"{self._name} '{pipeline_name}'{op_clause} - {action_clause} {duration_clause}")

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

    def __init__(self, root_dir: str, **kwargs):
        super().__init__(root_dir, **kwargs)

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
        except S3Error as ex:
            msg_prefix = f'Error connecting to object storage: {ex.code}.'
            if ex.code == "SignatureDoesNotMatch":
                # likely cause: incorrect password
                raise RuntimeError(f"{msg_prefix} Verify the password "
                                   f"in runtime configuration '{runtime_configuration.display_name}' "
                                   "and try again.") from ex
            elif ex.code == 'InvalidAccessKeyId':
                # likely cause: incorrect user id
                raise RuntimeError(f"{msg_prefix} Verify the username "
                                   f"in runtime configuration '{runtime_configuration.display_name}' "
                                   "and try again.") from ex
            else:
                raise RuntimeError(f"{msg_prefix} Verify "
                                   f"runtime configuration '{runtime_configuration.display_name}' "
                                   "and try again.") from ex
        except BaseException as ex:
            self.log.error("Error uploading artifacts to object storage for operation: {}".
                           format(operation.name), exc_info=True)
            raise ex from ex

    def _verify_cos_connectivity(self, runtime_configuration) -> None:
        self.log.debug('Verifying cloud storage connectivity using runtime configuration '
                       f"'{runtime_configuration.display_name}'.")
        try:
            CosClient(runtime_configuration)
        except Exception as ex:
            raise RuntimeError(f'Error connecting to cloud storage: {ex}. Update runtime configuration '
                               f'\'{runtime_configuration.display_name}\' and try again.')

    def _get_metadata_configuration(self, schemaspace, name=None):
        """
        Retrieve associated metadata configuration based on schemaspace provided and optional instance name
        :return: metadata in json format
        """
        try:
            if not name:
                return MetadataManager(schemaspace=schemaspace).get_all()
            else:
                return MetadataManager(schemaspace=schemaspace).get(name)
        except BaseException as err:
            self.log.error(f'Error retrieving metadata configuration for {name}', exc_info=True)
            raise RuntimeError(f'Error retrieving metadata configuration for {name}', err) from err

    def _verify_export_format(self, pipeline_export_format: str) -> None:
        """
        Check that the given pipeline_export_format is supported by the runtime type;
        otherwise, raise a ValueError
        """
        export_extensions = RuntimeTypeResources.get_instance_by_type(self._type).get_export_extensions()
        if pipeline_export_format not in export_extensions:
            raise ValueError(f"Pipeline export format '{pipeline_export_format}' not recognized.")

    def _collect_envs(self, operation: GenericOperation, **kwargs) -> Dict:
        """
        Collect the envs stored on the Operation and set the system-defined ELYRA_RUNTIME_ENV

        Note: subclasses should call their superclass (this) method first.
        :return: dictionary containing environment name/value pairs
        """

        envs: Dict = operation.env_vars_as_dict(logger=self.log)
        envs["ELYRA_RUNTIME_ENV"] = self.name

        # set environment variables for Minio/S3 access, in the following order of precedence:
        #  1. use `cos_secret`
        #  2. use `cos_username` and `cos_password`
        if "cos_secret" in kwargs and kwargs["cos_secret"]:
            # ensure the AWS_ACCESS_* envs are NOT set
            envs.pop("AWS_ACCESS_KEY_ID", None)
            envs.pop("AWS_SECRET_ACCESS_KEY", None)
        else:
            # set AWS_ACCESS_KEY_ID, if defined
            if "cos_username" in kwargs and kwargs["cos_username"]:
                envs["AWS_ACCESS_KEY_ID"] = kwargs["cos_username"]
            else:
                envs.pop("AWS_ACCESS_KEY_ID", None)

            # set AWS_SECRET_ACCESS_KEY, if defined
            if "cos_password" in kwargs and kwargs["cos_password"]:
                envs["AWS_SECRET_ACCESS_KEY"] = kwargs["cos_password"]
            else:
                envs.pop("AWS_SECRET_ACCESS_KEY", None)

        # Convey pipeline logging enablement to operation
        envs["ELYRA_ENABLE_PIPELINE_INFO"] = str(self.enable_pipeline_info)

        return envs

    def _process_dictionary_value(self, value: str) -> Union[Dict, str]:
        """
        For component parameters of type dictionary, the user-entered string value given in the pipeline
        JSON should be converted to the appropriate Dict format, if possible. If a Dict cannot be formed,
        log and return stripped string value.
        """
        if not value:
            return {}

        value = value.strip()
        if value == "None":
            return {}

        converted_dict = None
        if value.startswith('{') and value.endswith('}'):
            try:
                converted_dict = ast.literal_eval(value)
            except Exception:
                pass

        # Value could not be successfully converted to dictionary
        if not isinstance(converted_dict, dict):
            self.log.debug(f"Could not convert entered parameter value `{value}` to dictionary")
            return value

        return converted_dict

    def _process_list_value(self, value: str) -> Union[List, str]:
        """
        For component parameters of type list, the user-entered string value given in the pipeline JSON
        should be converted to the appropriate List format, if possible. If a List cannot be formed,
        log and return stripped string value.
        """
        if not value:
            return []

        value = value.strip()
        if value == "None":
            return []

        converted_list = None
        if value.startswith('[') and value.endswith(']'):
            try:
                converted_list = ast.literal_eval(value)
            except Exception:
                pass

        # Value could not be successfully converted to list
        if not isinstance(converted_list, list):
            self.log.debug(f"Could not convert entered parameter value `{value}` to list")
            return value

        return converted_list
