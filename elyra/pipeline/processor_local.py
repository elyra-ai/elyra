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

from elyra.pipeline import PipelineProcessor, PipelineProcessorResponse, Operation


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
    _type = 'local'

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

        self.log.info(f'Processing Pipeline : {pipeline.name}')

        # Sort operations based on dependency graph (topological order)
        operations = LocalPipelineProcessor._sort_operations(pipeline.operations)
        for operation in operations:
            absolute_filename = self.get_absolute_path(operation.filename)
            self._execute_file(absolute_filename)

        return PipelineProcessorResponse('', '', '')

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError('Local pipelines does not support export functionality')

    def _execute_file(self, filepath):
        if not os.path.isfile(filepath):
            raise FileNotFoundError(f'Could not find {filepath}')

        notebook_dir = os.path.dirname(filepath)
        notebook_name = os.path.basename(filepath)

        self.log.debug(f'Processing: {filepath}')

        t0 = time.time()
        try:
            # Try executing with configured python kernel
            papermill.execute_notebook(
                input_path=filepath,
                output_path=filepath,
                cwd=notebook_dir
            )
        except KeyError:
            try:
                # force default python kernel
                papermill.execute_notebook(
                    input_path=filepath,
                    output_path=filepath,
                    cwd=notebook_dir,
                    kernel_name="python3"
                )
            except Exception as ex:
                self.log.error(f'Internal error executing {filepath} with [python3] kernel')
                raise RuntimeError(f'Internal error executing {filepath} with [python3] kernel') from ex
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
            if operation not in ordered_operations:
                # operation is a root node
                if not operation.parent_operations:
                    ordered_operations.append(operation)
                else:
                    LocalPipelineProcessor.\
                        _visit_operation(operations_by_id, ordered_operations, operation)

        return ordered_operations

    @staticmethod
    def _visit_operation(operations_by_id: dict, ordered_operations: list, operation: Operation) -> None:
        """
        Helper method to the main sort operation function
        """
        for parent_operation_id in operation.parent_operations:
            parent_operation = operations_by_id[parent_operation_id]
            if parent_operation not in ordered_operations:
                LocalPipelineProcessor.\
                    _visit_operation(operations_by_id, ordered_operations, parent_operation)
        ordered_operations.append(operation)
