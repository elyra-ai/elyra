#
# Copyright 2018-2025 Elyra Authors
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
from datetime import datetime
import os
from subprocess import CalledProcessError
from subprocess import PIPE
from subprocess import run
import sys
import time
from typing import Dict
from typing import List
from typing import Optional

from jupyter_server.gateway.managers import GatewayClient
import papermill
from traitlets import log

from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.processor import PipelineProcessorResponse
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.util.path import get_absolute_path


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

    _operation_processor_catalog: Dict
    _type = RuntimeProcessorType.LOCAL
    _name = "local"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        notebook_op_processor = NotebookOperationProcessor(self.root_dir)
        python_op_processor = PythonScriptOperationProcessor(self.root_dir)
        r_op_processor = RScriptOperationProcessor(self.root_dir)
        self._operation_processor_catalog = {
            notebook_op_processor.operation_name: notebook_op_processor,
            python_op_processor.operation_name: python_op_processor,
            r_op_processor.operation_name: r_op_processor,
        }

    def get_components(self):
        return ComponentCache.get_generic_components()

    def process(self, pipeline):
        """
        Process a pipeline locally.
        The pipeline execution consists on properly ordering the operations
        based on it's dependency graph and than delegating the execution
        to proper executor (e.g. papermill to notebooks)
        """

        self.log_pipeline_info(pipeline.name, "processing pipeline")
        t0_all = time.time()

        # This unique run identifier is made available to all
        # notebooks | scripts in environment variable ELYRA_RUN_NAME
        # during pipeline execution. The id itself is not persisted
        # after the run completes.
        # The motivation is that notebooks | scripts might want to generate
        # artifact names that are unique for each run to avoid overwriting.
        # For example, a saved model file might be named
        # `my-trained-model-{ELYRA_RUN_NAME}.ext`.
        elyra_run_name = f'{pipeline.name}-{datetime.now().strftime("%m%d%H%M%S")}'

        # Sort operations based on dependency graph (topological order)
        operations = PipelineProcessor._sort_operations(pipeline.operations)
        for operation in operations:
            assert isinstance(operation, GenericOperation)
            try:
                t0 = time.time()
                operation_processor = self._operation_processor_catalog[operation.classifier]
                operation_processor.process(operation, elyra_run_name)
                self.log_pipeline_info(
                    pipeline.name,
                    f"completed {operation.filename}",
                    operation_name=operation.name,
                    duration=(time.time() - t0),
                )
            except Exception as ex:
                raise RuntimeError(f"Error processing operation {operation.name} {str(ex)}") from ex

        self.log_pipeline_info(pipeline.name, "pipeline processed", duration=(time.time() - t0_all))

        return LocalPipelineProcessorResponse()

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError("Local pipelines does not support export functionality")


class LocalPipelineProcessorResponse(PipelineProcessorResponse):
    _type = RuntimeProcessorType.LOCAL
    _name = "local"


class OperationProcessor(ABC):
    _operation_name: str = None

    def __init__(self):
        self.log = log.get_logger()

    @property
    def operation_name(self) -> str:
        return self._operation_name

    @abstractmethod
    def process(self, operation: GenericOperation, elyra_run_name: str):
        raise NotImplementedError

    @staticmethod
    def _collect_envs(operation: GenericOperation, elyra_run_name: str) -> Dict:
        envs = os.environ.copy()  # Make sure this process's env is "available" in the kernel subprocess
        envs.update(operation.env_vars.to_dict())
        envs["ELYRA_RUNTIME_ENV"] = "local"  # Special case
        envs["ELYRA_RUN_NAME"] = elyra_run_name
        return envs


class FileOperationProcessor(OperationProcessor):
    MAX_ERROR_LEN: int = 80

    def __init__(self, root_dir: str):
        super().__init__()
        self._root_dir = root_dir

    @property
    def operation_name(self) -> str:
        return self._operation_name

    @abstractmethod
    def process(self, operation: GenericOperation, elyra_run_name: str):
        raise NotImplementedError

    def get_valid_filepath(self, op_filename: str) -> str:
        filepath = get_absolute_path(self._root_dir, op_filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Could not find {filepath}")
        if not os.path.isfile(filepath):
            raise ValueError(f"Not a file: {filepath}")
        return filepath

    def log_and_raise(self, file_name: str, ex: Exception, data_capture_msg: Optional[str] = None) -> None:
        """Log and raise the exception that occurs when processing file_name.

        If the exception's message is longer than MAX_ERROR_LEN, it will be
        truncated with an ellipses (...) when raised.  The complete message
        will be logged.
        """
        self.log.error(f"Error executing {file_name}: {str(ex)}")
        if data_capture_msg:
            self.log.info(data_capture_msg)
        truncated_msg = FileOperationProcessor._truncate_msg(str(ex))
        raise RuntimeError(f"({file_name}): {truncated_msg}") from ex

    @staticmethod
    def _truncate_msg(msg: str) -> str:
        """Truncates the msg string to be less that MAX_ERROR_LEN.

        If msg is longer than MAX_ERROR_LEN, the first space is found from the right,
        then ellipses (...) are appended to that location so that they don't appear
        in the middle of a word.  As a result, the truncation could result in lengths
        less than the max+2.
        """
        if len(msg) < FileOperationProcessor.MAX_ERROR_LEN:
            return msg
        # locate the first whitespace from the 80th character and truncate from there
        last_space = msg.rfind(" ", 0, FileOperationProcessor.MAX_ERROR_LEN)
        if last_space >= 0:
            return msg[:last_space] + "..."
        return msg[: FileOperationProcessor.MAX_ERROR_LEN]


class NotebookOperationProcessor(FileOperationProcessor):
    _operation_name = "execute-notebook-node"

    def process(self, operation: GenericOperation, elyra_run_name: str):
        filepath = self.get_valid_filepath(operation.filename)

        file_dir = os.path.dirname(filepath)
        file_name = os.path.basename(filepath)

        self.log.debug(f"Processing notebook: {filepath}")

        # We'll always use the ElyraEngine.  This engine is essentially the default Papermill engine
        # but allows for environment variables to be passed to the kernel process (via 'kernel_env').
        # If the current notebook server is running with Enterprise Gateway configured, we will also
        # point the 'kernel_manager_class' to GatewayKernelManager so that notebooks run as they
        # would outside of Elyra.  Current working directory (cwd) is specified both for where papermill
        # runs the notebook (cwd) and where the directory of the kernel process (kernel_cwd).  The latter
        # of which is important when EG is configured.
        additional_kwargs = dict()
        additional_kwargs["engine_name"] = "ElyraEngine"
        additional_kwargs["cwd"] = file_dir  # For local operations, papermill runs from this dir
        additional_kwargs["kernel_cwd"] = file_dir
        additional_kwargs["kernel_env"] = OperationProcessor._collect_envs(operation, elyra_run_name)
        if GatewayClient.instance().gateway_enabled:
            additional_kwargs["kernel_manager_class"] = "jupyter_server.gateway.managers.GatewayKernelManager"

        t0 = time.time()
        try:
            papermill.execute_notebook(filepath, filepath, **additional_kwargs)
        except papermill.PapermillExecutionError as pmee:
            self.log.error(
                f"Error executing {file_name} in cell {pmee.exec_count}: " + f"{str(pmee.ename)} {str(pmee.evalue)}"
            )
            raise RuntimeError(
                f"({file_name}) in cell {pmee.exec_count}: " + f"{str(pmee.ename)} {str(pmee.evalue)}"
            ) from pmee
        except Exception as ex:
            self.log_and_raise(file_name, ex)

        t1 = time.time()
        duration = t1 - t0
        self.log.debug(f"Execution of {file_name} took {duration:.3f} secs.")


class ScriptOperationProcessor(FileOperationProcessor):
    _script_type: str = None

    def get_argv(self, filepath) -> List[str]:
        raise NotImplementedError

    def process(self, operation: GenericOperation, elyra_run_name: str):
        filepath = self.get_valid_filepath(operation.filename)

        file_dir = os.path.dirname(filepath)
        file_name = os.path.basename(filepath)

        self.log.debug(f"Processing {self._script_type} script: {filepath}")

        argv = self.get_argv(filepath)
        envs = OperationProcessor._collect_envs(operation, elyra_run_name)
        data_capture_msg = (
            f"Data capture for previous error:\n"
            f" command: {' '.join(argv)}\n"
            f" working directory: {file_dir}\n"
            f" environment variables: {envs}"
        )
        t0 = time.time()
        try:
            run(argv, cwd=file_dir, env=envs, check=True, stderr=PIPE)
        except CalledProcessError as cpe:
            error_msg = str(cpe.stderr.decode())
            self.log.error(f"Error executing {file_name}: {error_msg}")
            # Log process information to aid with troubleshooting
            self.log.info(data_capture_msg)

            error_trim_index = error_msg.rfind("\n", 0, error_msg.rfind("Error"))
            if error_trim_index != -1:
                raise RuntimeError(f"({file_name}): {error_msg[error_trim_index:].strip()}") from cpe
            else:
                raise RuntimeError(f"({file_name})") from cpe
        except Exception as ex:
            self.log_and_raise(file_name, ex, data_capture_msg)

        t1 = time.time()
        duration = t1 - t0
        self.log.debug(f"Execution of {file_name} took {duration:.3f} secs.")


class PythonScriptOperationProcessor(ScriptOperationProcessor):
    _operation_name = "execute-python-node"
    _script_type = "Python"

    def get_argv(self, file_path) -> List[str]:
        return [f"{sys.executable}", file_path]


class RScriptOperationProcessor(ScriptOperationProcessor):
    _operation_name = "execute-r-node"
    _script_type = "R"

    def get_argv(self, file_path) -> List[str]:
        return ["Rscript", file_path]
