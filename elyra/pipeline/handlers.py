#
# Copyright 2018-2021 Elyra Authors
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
import io
import json
import os

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from .parser import PipelineParser
from .processor import PipelineProcessorManager
from tornado import web
from ..util.http import HttpErrorMixin

from .registry import ComponentRegistry


class PipelineExportHandler(HttpErrorMixin, APIHandler):
    """Handler to expose REST API to export pipelines"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="Operation not supported.")
        self.set_header("Content-Type", 'application/json')
        self.finish(msg_json)

    @web.authenticated
    async def post(self, *args, **kwargs):
        self.log.debug("Pipeline Export handler now executing post request")

        payload = self.get_json_body()

        self.log.debug("JSON payload: %s", json.dumps(payload, sort_keys=True, indent=2, separators=(',', ': ')))

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
        self.set_header("Content-Type", 'application/json')
        self.finish(json_msg)


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


class PipelineComponentHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipelines editor component configuration"""

    valid_processors = ["local", "kfp", "airflow"]

    @web.authenticated
    async def get(self, processor):
        print(f'>>> Retrieving pipeline components for {processor}')
        if processor not in self.valid_processors:
            raise web.HTTPError(400, f"Invalid processor name '{processor}'")

        components = await PipelineProcessorManager.instance().get_components(processor)
        print('>>>')
        print(components)
        json_msg = json.dumps(components)

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(json_msg)


class PipelineComponentPropertiesHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipeline component properties"""

    valid_processors = ["local", "kfp", "airflow"]
    component_registry: ComponentRegistry = ComponentRegistry()

    @web.authenticated
    async def get(self, processor, component_id):
        print('>>> Retrieving pipeline component properties')
        if processor not in self.valid_processors:
            raise web.HTTPError(400, f"Invalid processor name '{processor}'")

        properties = ComponentRegistry().get_properties(processor, component_id)
        json_msg = json.dumps(properties)

        # json_msg = self._read_config('properties')
        self.set_status(200)

        self.set_header("Content-Type", 'application/json')
        self.finish(json_msg)

    def _read_config(self, config_name):
        config_dir = os.path.join(os.path.dirname(__file__), 'resources')
        config_file = os.path.join(config_dir, config_name + ".json")
        with io.open(config_file, 'r', encoding='utf-8') as f:
            config_json = json.load(f)
        return config_json
