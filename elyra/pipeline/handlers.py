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
from notebook.utils import url_path_join
from .parser import PipelineParser
from .processor import PipelineProcessorManager
from tornado import web
from ..util.http import HttpErrorMixin


class PipelineExportHandler(HttpErrorMixin, APIHandler):
    """Handler to expose REST API to export pipelines"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    @web.authenticated
    async def post(self, *args, **kwargs):
        self.log.debug("Pipeline Export handler now executing post request")

        payload = self.get_json_body()

        self.log.debug("JSON payload: %s", payload)

        pipeline_definition = payload['pipeline']
        pipeline_export_format = payload['export_format']
        pipeline_export_path = payload['export_path']
        pipeline_overwrite = payload['overwrite']

        pipeline = PipelineParser().parse(pipeline_definition)

        pipeline_exported_path = await PipelineProcessorManager.instance().export(
            pipeline,
            pipeline_export_format,
            pipeline_export_path,
            pipeline_overwrite
        )
        json_msg = json.dumps({"export_path": pipeline_export_path})

        self.set_status(201)
        self.set_header("Content-Type", 'application/json')
        location = url_path_join(
            self.base_url,
            'api',
            'contents',
            pipeline_exported_path
        )
        self.set_header('Location', location)
        self.write(json_msg)
        self.flush()


class PipelineSchedulerHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to execute pipelines as batch jobs"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    @web.authenticated
    async def post(self, *args, **kwargs):
        self.log.debug("Pipeline SchedulerHandler now executing post request")

        pipeline_definition = self.get_json_body()
        self.log.debug("JSON payload: %s", pipeline_definition)

        pipeline = PipelineParser().parse(pipeline_definition)

        response = await PipelineProcessorManager.instance().process(pipeline)
        json_msg = json.dumps(response.to_json())

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(json_msg)
        self.flush()
