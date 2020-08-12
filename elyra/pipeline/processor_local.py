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
import tempfile
import time

from datetime import datetime
from elyra.pipeline import PipelineProcessor, PipelineProcessorResponse
from jupyter_client.kernelspec import NoSuchKernel


class LocalPipelineProcessor(PipelineProcessor):
    """
    Local pipeline processor runs a pipeline locally. The scope of this runtime is
    simply to automate the execution of multiple notebooks from a pipeline as if they
    were being executed manually. Any additional support is out of the scope of this
    processor. If a notebook don't run from your regular `run all` it will fails on the
    same way when processed by this processor. Also, any relationship or specific capabilities
    associated with a particular runtime is not supported by local mode and any additional properties
    other then the specific file to be executed is ignored by the local processor.

    Note: Execution happens in-place and a lodger of runs are available at $TMPFILE/elyra/pipeline-name-<timestamp>
    """
    _type = 'local'

    def __init__(self, root_dir=None):
        if root_dir:
            self._root_dir = root_dir

    @property
    def type(self):
        return self._type

    def process(self, pipeline):
        timestamp = datetime.now().strftime('%m%d%H%M%S')
        pipeline_name = f'{pipeline.name}-{timestamp}'

        pipeline_work_dir = self._get_pipeline_work_dir(pipeline_name)
        self.log.info(f'Processing Pipeline : {pipeline.name} at {pipeline_work_dir}')

        # TODO: consider ordering
        for operation in pipeline.operations.values():
            notebook = self.get_absolute_path(operation.filename)
            assert os.path.isfile(notebook), "Invalid '{}'".format(notebook)

            self._execute_file(pipeline_work_dir, notebook)

        object_storage_path = f'{pipeline_work_dir}'
        return PipelineProcessorResponse(None, None, object_storage_path)

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError('Local pipelines does not support export functionality')

    def _get_pipeline_work_dir(self, pipeline_name):
        log_dir = os.path.join(tempfile.tempdir, 'elyra', pipeline_name)
        if not os.path.exists(log_dir):
            os.mkdir(log_dir)
        return log_dir

    def _execute_file(self, work_dir, filename):
        notebook_dir = os.path.dirname(filename)
        notebook_name = os.path.basename(filename)
        stdout = os.path.join(work_dir, f'{notebook_name}.out')
        stderr = os.path.join(work_dir, f'{notebook_name}.err')

        self.log.debug(f'Processing: {filename}')
        with open(stdout, 'w') as stdout_file, open(stderr, 'w') as stderr_file:
            t0 = time.time()
            try:
                # Try executing with configured python kernel
                papermill.execute_notebook(
                    input_path=filename,
                    output_path=filename,
                    stdout_file=stdout_file,
                    stderr_file=stderr_file,
                    cwd=notebook_dir
                )
            except NoSuchKernel:
                # force default python kernel
                papermill.execute_notebook(
                    input_path=filename,
                    output_path=filename,
                    stdout_file=stdout_file,
                    stderr_file=stderr_file,
                    cwd=notebook_dir,
                    kernel_name="python3"
                )
            except Exception:
                self.log(f'Internal error executing {filename}')

            t1 = time.time()
            duration = (t1 - t0)
            self.log.debug(f'Execution of {notebook_name} took {duration:.3f} secs.')
