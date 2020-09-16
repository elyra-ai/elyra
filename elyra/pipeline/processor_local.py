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
import os
import subprocess
import time

from abc import ABC, abstractmethod
from elyra.pipeline import PipelineProcessor, PipelineProcessorResponse, Operation
from traitlets import log
from typing import Dict


class LocalPipelineProcessor(PipelineProcessor):
    """
    Local pipeline processor runs a pipeline locally. The scope of this runtime is
    simply to automate the execution of multiple notebooks from a pipeline as if they
    were being executed manually. Any additional support is out of the scope of this
    processor. If a notebook doesn't run using `run all` it will fail in the
    same way when processed by this processor. Also, any relationship or specific capabilities
    associated with a particular runtime is not supported by local mode and any additional properties
    other then the specific file to be executed is ignored by the local processor.

    Note: Execution happens in-place and a ledger of runs will be available at $TMPFILE/elyra/pipeline-name-<timestamp>
    """
    _operation_processor_registry: Dict
    _type = 'local'

    def __init__(self):
        notebook_op_processor = NotebookOperationProcessor()
        python_op_processor = PythonScriptOperationProcessor()
        self._operation_processor_registry = {
            notebook_op_processor.operation_name: notebook_op_processor,
            python_op_processor.operation_name: python_op_processor
        }

    @property
    def type(self):
        return self._type

    async def process(self, pipeline):
        """
        Process a pipeline locally.
        The pipeline execution consists on properly ordering the operations
        based on it's dependency graph and than delegating the execution
        to proper executor (e.g. papermill to notebooks)
        """

        self.log.info(f'Processing Pipeline : {pipeline.name}')

        # Sort operations based on dependency graph (topological order)
        operations = LocalPipelineProcessor._sort_operations(pipeline.operations)
        for operation in operations:
            filepath = self.get_absolute_path(operation.filename)

            try:
                operation_processor = self._operation_processor_registry[operation.classifier]
                await operation_processor.process(operation, filepath)
            except Exception as ex:
                raise RuntimeError(f'Error processing operation {operation.name} at {filepath}.') from ex

        return PipelineProcessorResponse('', '', '')

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError('Local pipelines does not support export functionality')

    def _execute_operation(self, operation: Operation) -> None:
        filepath = self.get_absolute_path(operation.filename)
        if not os.path.isfile(filepath):
            raise FileNotFoundError(f'Could not find {filepath}')

        notebook_dir = os.path.dirname(filepath)
        notebook_name = os.path.basename(filepath)

        self.log.debug(f'Processing: {filepath}')

        argv = ['papermill', filepath, filepath, '--cwd', notebook_dir]
        envs = self._get_envs(operation)
        t0 = time.time()
        try:
            subprocess.run(argv, env=envs, check=True)
        except Exception as ex:
            self.log.error(f'Internal error executing {filepath}')
            raise RuntimeError(f'Internal error executing {filepath}') from ex

        t1 = time.time()
        duration = (t1 - t0)
        self.log.debug(f'Execution of {notebook_name} took {duration:.3f} secs.')

    @staticmethod
    def _sort_operations(operations_by_id: dict) -> list:
        """
        Sort the list of operations based on its dependency graph
        """
        ordered_operations = []

        for operation in operations_by_id.values():
            LocalPipelineProcessor._sort_operation_dependencies(operations_by_id,
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
            for parent_operation_id in operation.parent_operations:
                parent_operation = operations_by_id[parent_operation_id]
                if parent_operation not in ordered_operations:
                    LocalPipelineProcessor._sort_operation_dependencies(operations_by_id,
                                                                        ordered_operations,
                                                                        parent_operation)
            ordered_operations.append(operation)


class OperationProcessor(ABC):

    def __init__(self):
        self.log = log.get_logger()

    @abstractmethod
    def operation_name(self) -> str:
        pass

    @abstractmethod
    async def process(self, operation: Operation, filepath: str):
        pass


class FileOperationProcessor(OperationProcessor):

    @abstractmethod
    def _create_execute_command(self, filepath: str, cdw: str) -> list:
        pass

    async def process(self, operation: Operation, filepath: str):
        if not os.path.isfile(filepath):
            raise ValueError(f'Not a file: {filepath}')
        if not os.path.exists(filepath):
            raise FileNotFoundError(f'Could not find {filepath}')

        file_dir = os.path.dirname(filepath)
        file_name = os.path.basename(filepath)

        self.log.debug(f'Processing: {filepath}')

        argv = self._create_execute_command(filepath, file_dir)
        envs = operation.env_vars_as_dict
        t0 = time.time()
        try:
            subprocess.run(argv, env=envs, check=True)
        except Exception as ex:
            self.log.error(f'Internal error executing {filepath}')
            raise RuntimeError(f'Internal error executing {filepath}') from ex

        t1 = time.time()
        duration = (t1 - t0)
        self.log.debug(f'Execution of {file_name} took {duration:.3f} secs.')


class NotebookOperationProcessor(FileOperationProcessor):
    _operation_name = 'execute-notebook-node'

    @property
    def operation_name(self) -> str:
        return self._operation_name

    def _create_execute_command(self, filepath: str, cdw: str) -> list:
        return ['papermill', filepath, filepath, '--cwd', cdw]


class PythonScriptOperationProcessor(FileOperationProcessor):
    __operation_name = 'execute-python-node'

    def operation_name(self) -> str:
        return self.__operation_name

    def _create_execute_command(self, filepath: str, cwd: str) -> list:
        return ['python', filepath, '--PYTHONHOME', cwd]
