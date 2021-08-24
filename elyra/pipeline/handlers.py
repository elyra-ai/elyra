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
from datetime import datetime
from http.client import responses
import json
from typing import List
from typing import Optional

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado import web

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentCategory
from elyra.pipeline.component_registry import ComponentRegistry
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.validate import PipelineValidationManager
from elyra.util.http import HttpErrorMixin


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

        parent = self.settings.get('elyra')
        payload = self.get_json_body()

        self.log.debug("JSON payload: %s", json.dumps(payload, indent=2, separators=(',', ': ')))

        pipeline_definition = payload['pipeline']
        pipeline_export_format = payload['export_format']
        pipeline_export_path = payload['export_path']
        pipeline_overwrite = payload['overwrite']

        response = await PipelineValidationManager.instance().validate(pipeline=pipeline_definition)
        self.log.debug(f"Validation checks completed. Results as follows: {response.to_json()}")

        if not response.has_fatal:
            pipeline = PipelineParser(root_dir=self.settings['server_root_dir'],
                                      parent=parent).parse(pipeline_definition)

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
        else:
            json_msg = json.dumps({
                'reason': responses.get(400),
                'message': 'Errors found in pipeline',
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'issues': response.to_json().get('issues')
            })
            self.set_status(400)

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

        parent = self.settings.get('elyra')
        pipeline_definition = self.get_json_body()
        self.log.debug("JSON payload: %s", pipeline_definition)

        response = await PipelineValidationManager.instance().validate(pipeline=pipeline_definition)

        self.log.debug(f"Validation checks completed. Results as follows: {response.to_json()}")

        if not response.has_fatal:
            self.log.debug("Processing the pipeline submission and executing request")
            pipeline = PipelineParser(root_dir=self.settings['server_root_dir'],
                                      parent=parent).parse(pipeline_definition)
            response = await PipelineProcessorManager.instance().process(pipeline)
            json_msg = json.dumps(response.to_json())
            self.set_status(200)
        else:
            json_msg = json.dumps({
                'reason': responses.get(400),
                'message': 'Errors found in pipeline',
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'issues': response.to_json().get('issues')
            })
            self.set_status(400)

        self.set_header("Content-Type", 'application/json')
        self.finish(json_msg)


class PipelineComponentHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipelines editor component configuration"""

    @web.authenticated
    async def get(self, processor):
        self.log.debug(f'Retrieving pipeline components for: {processor} runtime')

        if PipelineProcessorManager.instance().is_supported_runtime(processor) is False:
            raise web.HTTPError(400, f"Invalid processor name '{processor}'")

        components: List[Component] = await PipelineProcessorManager.instance().get_components(processor)
        categories: List[ComponentCategory] = await PipelineProcessorManager.instance().get_all_categories(processor)
        palette_json = ComponentRegistry.to_canvas_palette(components=components, categories=categories)

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(palette_json)


class PipelineComponentPropertiesHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipeline component_id properties"""

    @web.authenticated
    async def get(self, processor, component_id):
        self.log.debug(f'Retrieving pipeline component properties for component: {component_id}')

        if PipelineProcessorManager.instance().is_supported_runtime(processor) is False:
            raise web.HTTPError(400, f"Invalid processor name '{processor}'")

        if not component_id:
            raise web.HTTPError(400, "Missing component ID")

        component: Optional[Component] = \
            await PipelineProcessorManager.instance().get_component(processor, component_id)
        properties_json = ComponentRegistry.to_canvas_properties(component)

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')

        self.finish(properties_json)


class PipelineValidationHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to validate pipeline payloads for errors"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="GET requests are not supported.")
        self.write(msg_json)
        self.flush()

    @web.authenticated
    async def post(self):
        self.log.debug("Pipeline Validation Handler now executing post request")

        pipeline_definition = self.get_json_body()
        self.log.debug("Pipeline payload: %s", pipeline_definition)

        response = await PipelineValidationManager.instance().validate(pipeline=pipeline_definition)
        json_msg = response.to_json()

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(json_msg)
