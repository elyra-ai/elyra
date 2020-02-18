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
from elyra.pipeline import PipelineParser, PipelineProcessorManager


class SchedulerHandler(APIHandler):

    """REST-ish method calls to execute pipelines as batch jobs"""
    def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    def post(self, *args, **kwargs):
        self.log.debug("Pipeline SchedulerHandler now executing post request")

        pipeline_definition = self.get_json_body()

        self.log.debug("JSON payload: %s", pipeline_definition)

        try:
            pipeline = PipelineParser.parse(pipeline_definition)
            run_url = PipelineProcessorManager.process(pipeline)
        except Exception as e:
            self.send_error_message(500, "Pipeline submission failed with the following error: {}".format(str(e)))
        else:
            self.send_success_message("Pipeline successfully submitted", run_url)

    def send_message(self, message):
        self.write(message)
        self.flush()

    def send_success_message(self, message, job_url):
        self.set_status(200)
        msg = json.dumps({"status": "ok",
                          "message": message,
                          "url": job_url})
        self.send_message(msg)

    def send_error_message(self, status_code, error_message):
        self.set_status(status_code)
        msg = json.dumps({"status": "error",
                          "message": error_message})
        self.send_message(msg)

    def __artifact_list_to_str(self, pipeline_array):
        if not pipeline_array:
            return "None"
        else:
            return ','.join(pipeline_array)
