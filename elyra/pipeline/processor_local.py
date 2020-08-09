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


class LocalPipelineProcessor(PipelineProcessor):
    _type = 'local'

    def __init__(self, root_dir=None):
        if root_dir:
            self._root_dir = root_dir

    @property
    def type(self):
        return self._type

    def process(self, pipeline):
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = f'{pipeline.name}-{timestamp}'

        with tempfile.TemporaryDirectory() as temp_dir:
            # pipeline_path = os.path.join(temp_dir, f'{pipeline_name}')
            pipeline_path = temp_dir

            # TODO: consider ordering
            for operation in pipeline.operations.values():
                notebook = self.get_absolute_path(operation.filename)
                assert os.path.isfile(notebook), "Invalid '{}'".format(notebook)

                self.log.info("Pipeline : %s", pipeline_name)
                self.log.debug("Creating temp directory %s", temp_dir)

                # execute notebook to a tmp location
                notebook_dir = os.path.dirname(notebook)
                notebook_name = os.path.basename(notebook)
                notebook_output = os.path.join(pipeline_path, notebook_name)

                self.log.debug(f'Processing notebook {notebook} to {notebook_output}')
                t0 = time.time()
                papermill.execute_notebook(
                    input_path=notebook,
                    output_path=notebook_output,
                    cwd=notebook_dir
                )
                t1 = time.time()
                duration = (t1 - t0)
                self.log.debug(f'Execution of notebook  {notebook_name} took {duration:.3f} secs.')

            return PipelineProcessorResponse()

        return None

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        raise NotImplementedError('Local pipelines does not support export functionality')
