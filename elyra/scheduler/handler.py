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
import json

from notebook.base.handlers import APIHandler
from ..pipeline import PipelineParser, PipelineProcessorManager
from ..util.http import HttpErrorMixin


class SchedulerHandler(HttpErrorMixin, APIHandler):

    """REST-ish method calls to execute pipelines as batch jobs"""
    def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    def post(self, *args, **kwargs):
        self.log.debug("Pipeline SchedulerHandler now executing post request")

        pipeline_definition = self.get_json_body()

        self.log.debug("JSON payload: %s", pipeline_definition)

        pipeline = PipelineParser.parse(pipeline_definition)

        if pipeline.export:
            PipelineProcessorManager.export(pipeline)
            json_msg = json.dumps({"status": "ok",
                                   "message": "Pipeline successfully exported"})
        else:
            run_url = PipelineProcessorManager.process(pipeline)
            json_msg = json.dumps({"status": "ok",
                                   "message": "Pipeline successfully submitted",
                                   "url": run_url})

        self.set_status(200)
        self.write(json_msg)
        self.flush()

    def __artifact_list_to_str(self, pipeline_array):
        if not pipeline_array:
            return "None"
        else:
            return ','.join(pipeline_array)
