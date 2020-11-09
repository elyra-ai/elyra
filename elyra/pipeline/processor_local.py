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
import papermill
import time

from abc import ABC, abstractmethod
from elyra.pipeline import PipelineProcessor, PipelineProcessorResponse, Operation
from elyra.util.path import get_absolute_path
from notebook.gateway.managers import GatewayClient
from subprocess import run
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

    def __init__(self, root_dir, **kwargs):
        super(LocalPipelineProcessor, self).__init__(root_dir, **kwargs)
        notebook_op_processor = NotebookOperationProcessor(self.root_dir)
        python_op_processor = PythonScriptOperationProcessor(self.root_dir)
        self._operation_processor_registry = {
            notebook_op_processor.operation_name: notebook_op_processor,
            python_op_processor.operation_name: python_op_processor
        }

    @property
    def type(self):
        return self._type

    def process(self, pipeline):
        """
        Process a pipeline locally.
        The pipeline execution consists on properly ordering the operations
        based on it's dependency graph and than delegating the execution
        to proper executor (e.g. papermill to notebooks)
        """

        self.log_pipeline_info(pipeline.name, "processing pipeline")
        t0_all = time.time()

        # Sort operations based on dependency graph (topological order)
        operations = LocalPipelineProcessor._sort_operations(pipeline.operations)
        for operation in operations:
            try:
                t0 = time.time()
                operation_processor = self._operation_processor_registry[operation.classifier]
                operation_processor.process(operation)
                self.log_pipeline_info(pipeline.name, f"completed {operation.filename}",
                                       operation_name=operation.name,
                                       duration=(time.time() - t0))
            except Exception as ex:
                raise RuntimeError(f'Error processing operation {operation.name}.') from ex

        self.log_pipeline_info(pipeline.name, "pipeline processed", duration=(time.time() - t0_all))

        return PipelineProcessorResponse('', '', '')

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError('Local pipelines does not support export functionality')

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

    _operation_name: str = None

    def __init__(self):
        self.log = log.get_logger()

    @property
    def operation_name(self) -> str:
        return self._operation_name

    @abstractmethod
    def process(self, operation: Operation):
        raise NotImplementedError


class FileOperationProcessor(OperationProcessor):

    def __init__(self, root_dir: str):
        super(FileOperationProcessor, self).__init__()
        self._root_dir = root_dir

    @property
    def operation_name(self) -> str:
        return self._operation_name

    @abstractmethod
    def process(self, operation: Operation):
        raise NotImplementedError

    def get_valid_filepath(self, op_filename):
        filepath = get_absolute_path(self._root_dir, op_filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f'Could not find {filepath}')
        if not os.path.isfile(filepath):
            raise ValueError(f'Not a file: {filepath}')
        return filepath


class NotebookOperationProcessor(FileOperationProcessor):
    _operation_name = 'execute-notebook-node'

    def __init__(self, root_dir: str):
        super(NotebookOperationProcessor, self).__init__(root_dir)

    def process(self, operation: Operation):
        filepath = self.get_valid_filepath(operation.filename)

        file_dir = os.path.dirname(filepath)
        file_name = os.path.basename(filepath)

        self.log.debug(f'Processing notebook: {filepath}')

        # We'll always use the ElyraEngine.  This engine is essentially the default Papermill engine
        # but allows for environment variables to be passed to the kernel process (via 'kernel_env').
        # If the current notebook server is running with Enterprise Gateway configured, we will also
        # point the 'kernel_manager_class' to our HTTPKernelManager so that notebooks run as they
        # would outside of Elyra.  Current working directory (cwd) is specified both for where papermill
        # runs the notebook (cwd) and where the directory of the kernel process (kernel_cwd).  The latter
        # of which is important when EG is configured.
        additional_kwargs = dict()
        additional_kwargs['engine_name'] = "ElyraEngine"
        additional_kwargs['cwd'] = file_dir  # For local operations, papermill runs from this dir
        additional_kwargs['kernel_cwd'] = file_dir
        additional_kwargs['kernel_env'] = operation.env_vars_as_dict()
        if GatewayClient.instance().gateway_enabled:
            additional_kwargs['kernel_manager_class'] = 'elyra.pipeline.http_kernel_manager.HTTPKernelManager'

        t0 = time.time()
        try:
            papermill.execute_notebook(
                filepath,
                filepath,
                **additional_kwargs
            )
        except Exception as ex:
            raise RuntimeError(f'Internal error executing {filepath}: {ex}') from ex

        t1 = time.time()
        duration = (t1 - t0)
        self.log.debug(f'Execution of {file_name} took {duration:.3f} secs.')


class PythonScriptOperationProcessor(FileOperationProcessor):
    _operation_name = 'execute-python-node'

    def __init__(self, root_dir):
        super(PythonScriptOperationProcessor, self).__init__(root_dir)

    def process(self, operation: Operation):
        filepath = self.get_valid_filepath(operation.filename)

        file_dir = os.path.dirname(filepath)
        file_name = os.path.basename(filepath)

        self.log.debug(f'Processing python script: {filepath}')

        argv = ['python3', filepath, '--PYTHONHOME', file_dir]

        envs = os.environ  # Make sure this process's env is "available" in subprocess
        envs.update(operation.env_vars_as_dict())
        t0 = time.time()
        try:
            run(argv, cwd=file_dir, env=envs, check=True)
        except Exception as ex:
            raise RuntimeError(f'Internal error executing {filepath}: {ex}') from ex

        t1 = time.time()
        duration = (t1 - t0)
        self.log.debug(f'Execution of {file_name} took {duration:.3f} secs.')
