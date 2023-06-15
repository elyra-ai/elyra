#
# Copyright 2018-2023 Elyra Authors
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
from logging import Logger
import mimetypes
from typing import List
from typing import Optional

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado import web

from elyra.metadata.error import MetadataNotFoundError
from elyra.metadata.manager import MetadataManager
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.pipeline.component import Component
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.component_catalog import RefreshInProgressError
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline_constants import PIPELINE_PARAMETERS
from elyra.pipeline.pipeline_definition import PipelineDefinition
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.registry import PipelineProcessorRegistry
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.pipeline.runtime_type import RuntimeTypeResources
from elyra.pipeline.validation import PipelineValidationManager
from elyra.util.http import HttpErrorMixin


MIMETYPE_MAP = {".yaml": "text/x-yaml", ".py": "text/x-python", None: "text/plain"}


def get_runtime_processor_type(runtime_type: str, log: Logger, request_path: str) -> Optional[RuntimeProcessorType]:
    """
    Gets the runtime processor type for the runtime type given in the request path.

    :param runtime_type: can be the shorthand runtime ('kfp', 'airflow') or the
        runtime type name ('KUBEFLOW_PIPELINES', 'APACHE_AIRFLOW') (preferred).
    :param log: used to log the appropriate warning for shorthand-name requests
    :param request_path: full request path of the endpoint

    :returns: the RuntimeProcessorType for the given runtime_type, or None
    """
    processor_manager = PipelineProcessorManager.instance()
    if processor_manager.is_supported_runtime_type(runtime_type):
        # The request path uses the appropriate RuntimeProcessorType name. Use this
        # to get the RuntimeProcessorType instance to pass to get_all_components
        return RuntimeProcessorType.get_instance_by_name(runtime_type)
    elif processor_manager.is_supported_runtime(runtime_type):
        # The endpoint path contains the shorthand version of a runtime (e.g., 'kfp',
        # 'airflow'). This case and its associated functions should eventually be removed
        # in favor of using the RuntimeProcessorType name in the request path.
        log.warning(
            f"Deprecation warning: when calling endpoint '{request_path}' "
            f"use runtime type name (e.g. 'KUBEFLOW_PIPELINES', 'APACHE_AIRFLOW') "
            f"instead of shorthand name (e.g., 'kfp', 'airflow')"
        )
        return processor_manager.get_runtime_type(runtime_type)
    return None


class PipelineExportHandler(HttpErrorMixin, APIHandler):
    """Handler to expose REST API to export pipelines"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="Operation not supported.")
        self.set_header("Content-Type", "application/json")
        await self.finish(msg_json)

    @web.authenticated
    async def post(self, *args, **kwargs):
        self.log.debug("Pipeline Export handler now executing post request")

        parent = self.settings.get("elyra")
        payload = self.get_json_body()

        self.log.debug(f"JSON payload: {json.dumps(payload, indent=2, separators=(',', ': '))}")

        pipeline_definition = payload["pipeline"]
        pipeline_export_format = payload["export_format"]
        pipeline_export_path = payload["export_path"]
        pipeline_overwrite = payload["overwrite"]

        response = await PipelineValidationManager.instance().validate(pipeline_definition)
        self.log.debug(f"Validation checks completed. Results as follows: {response.to_json()}")

        if not response.has_fatal:
            pipeline = PipelineParser(root_dir=self.settings["server_root_dir"], parent=parent).parse(
                pipeline_definition
            )

            pipeline_exported_path = await PipelineProcessorManager.instance().export(
                pipeline, pipeline_export_format, pipeline_export_path, pipeline_overwrite
            )
            json_msg = json.dumps({"export_path": pipeline_export_path})
            self.set_status(201)
            self.set_header("Content-Type", "application/json")
            location = url_path_join(self.base_url, "api", "contents", pipeline_exported_path)
            self.set_header("Location", location)
        else:
            json_msg = json.dumps(
                {
                    "reason": responses.get(400),
                    "message": "Errors found in pipeline",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "issues": response.to_json().get("issues"),
                }
            )
            self.set_status(400)

        self.set_header("Content-Type", "application/json")
        await self.finish(json_msg)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class PipelineSchedulerHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to execute pipelines as batch jobs"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        await self.flush()

    @web.authenticated
    async def post(self, *args, **kwargs):
        self.log.debug("Pipeline SchedulerHandler now executing post request")

        parent = self.settings.get("elyra")
        pipeline_definition = self.get_json_body()
        self.log.debug(f"JSON payload: {pipeline_definition}")

        response = await PipelineValidationManager.instance().validate(pipeline=pipeline_definition)

        self.log.debug(f"Validation checks completed. Results as follows: {response.to_json()}")

        if not response.has_fatal:
            self.log.debug("Processing the pipeline submission and executing request")
            pipeline = PipelineParser(root_dir=self.settings["server_root_dir"], parent=parent).parse(
                pipeline_definition
            )
            response = await PipelineProcessorManager.instance().process(pipeline)
            json_msg = json.dumps(response.to_json())
            self.set_status(200)
        else:
            json_msg = json.dumps(
                {
                    "reason": responses.get(400),
                    "message": "Errors found in pipeline",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "issues": response.to_json().get("issues"),
                }
            )
            self.set_status(400)

        self.set_header("Content-Type", "application/json")
        await self.finish(json_msg)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class PipelineComponentHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipelines editor component configuration"""

    @web.authenticated
    async def get(self, runtime_type):
        self.log.debug(f"Retrieving pipeline components for runtime type: {runtime_type}")

        runtime_processor_type = get_runtime_processor_type(runtime_type, self.log, self.request.path)
        if not runtime_processor_type:
            raise web.HTTPError(400, f"Invalid runtime type '{runtime_type}'")

        # Include generic components for all runtime types
        components: List[Component] = ComponentCache.get_generic_components()

        # Add additional runtime-type-specific components, if present
        components.extend(ComponentCache.instance().get_all_components(platform=runtime_processor_type))

        palette_json = ComponentCache.to_canvas_palette(components=components)

        self.set_status(200)
        self.set_header("Content-Type", "application/json")
        await self.finish(palette_json)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class PipelinePropertiesHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipeline properties"""

    @web.authenticated
    async def get(self, runtime_type):
        self.log.debug(f"Retrieving pipeline properties for runtime type: {runtime_type}")

        runtime_processor_type = get_runtime_processor_type(runtime_type, self.log, self.request.path)
        if not runtime_processor_type:
            raise web.HTTPError(400, f"Invalid runtime type '{runtime_type}'")

        # Get pipeline properties json
        pipeline_properties_json = PipelineDefinition.get_pipeline_properties(runtime_type=runtime_processor_type)

        self.set_status(200)
        self.set_header("Content-Type", "application/json")
        await self.finish(pipeline_properties_json)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class PipelineParametersHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipeline parameters"""

    @web.authenticated
    async def get(self, runtime_type):
        self.log.debug(f"Retrieving pipeline parameters for runtime type: {runtime_type}")

        runtime_processor_type = get_runtime_processor_type(runtime_type, self.log, self.request.path)
        if not runtime_processor_type:
            raise web.HTTPError(400, f"Invalid runtime type '{runtime_type}'")

        ppm = PipelineProcessorManager.instance()
        pipeline_parameter_class = ppm.get_pipeline_parameter_class(runtime_type=runtime_processor_type)
        if pipeline_parameter_class is not None:
            # Get pipeline parameters json schema
            pipeline_params_json = pipeline_parameter_class.get_schema()
            self.set_status(200)
        else:
            # Pipeline parameters are not supported, return message indicating such
            processor_name = runtime_processor_type.value
            pipeline_params_json = json.dumps(
                {"message": f"Runtime processor type '{processor_name}' does not support pipeline parameters."}
            )
            self.set_status(405)

        self.set_header("Content-Type", "application/json")
        await self.finish(pipeline_params_json)


class PipelineComponentPropertiesHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to retrieve pipeline component_id properties"""

    def get_mimetype(self, ext: Optional[str]) -> str:
        """
        Get the MIME type for the component definition content.
        """
        if ext == ".yml":
            ext = ".yaml"

        # Get mimetype from mimetypes map or built-in mimetypes package; default to plaintext
        mimetype = MIMETYPE_MAP.get(ext, mimetypes.guess_type(f"file{ext}")[0]) or "text/plain"
        return mimetype

    @web.authenticated
    async def get(self, runtime_type, component_id):
        self.log.debug(f"Retrieving pipeline component properties for component: {component_id}")

        if not component_id:
            raise web.HTTPError(400, "Missing component ID")

        runtime_processor_type = get_runtime_processor_type(runtime_type, self.log, self.request.path)
        if not runtime_processor_type:
            raise web.HTTPError(400, f"Invalid runtime type '{runtime_type}'")

        # Try to get component_id as a generic component; assigns None if id is not a generic component
        component: Optional[Component] = ComponentCache.get_generic_component(component_id)

        # Try to retrieve a runtime-type-specific component; assigns None if not found
        if not component:
            component = ComponentCache.instance().get_component(
                platform=runtime_processor_type, component_id=component_id
            )

        if not component:
            raise web.HTTPError(404, f"Component '{component_id}' not found")

        if self.request.path.endswith("/properties"):
            # Return complete set of component properties
            json_response = ComponentCache.to_canvas_properties(component)
            if not PipelineProcessorManager.instance().supports_pipeline_params(runtime_type=runtime_processor_type):
                # Pipeline parameters are not supported and the property can be removed from the set
                json_response["properties"]["component_parameters"]["properties"].pop(PIPELINE_PARAMETERS, None)
        else:
            # Return component definition content
            json_response = json.dumps(
                {"content": component.definition, "mimeType": self.get_mimetype(component.file_extension)}
            )

        self.set_status(200)
        self.set_header("Content-Type", "application/json")
        await self.finish(json_response)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class PipelineValidationHandler(HttpErrorMixin, APIHandler):
    """Handler to expose method calls to validate pipeline payloads for errors"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="GET requests are not supported.")
        self.write(msg_json)
        await self.flush()

    @web.authenticated
    async def post(self):
        self.log.debug("Pipeline Validation Handler now executing post request")

        pipeline_definition = self.get_json_body()
        self.log.debug(f"Pipeline payload: {pipeline_definition}")

        response = await PipelineValidationManager.instance().validate(pipeline_definition)
        json_msg = response.to_json()

        self.set_status(200)
        self.set_header("Content-Type", "application/json")
        await self.finish(json_msg)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class PipelineRuntimeTypesHandler(HttpErrorMixin, APIHandler):
    """Handler to get static information relative to the set of configured runtime types"""

    @web.authenticated
    async def get(self):
        self.log.debug("Retrieving active runtime information from PipelineProcessorRegistry...")
        resources: List[RuntimeTypeResources] = PipelineProcessorRegistry.instance().get_runtime_types_resources()

        runtime_types = []
        for runtime_type in resources:
            runtime_types.append(runtime_type.to_dict())

        self.set_status(200)
        self.set_header("Content-Type", "application/json")
        await self.finish({"runtime_types": runtime_types})

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class ComponentCacheHandler(HttpErrorMixin, APIHandler):
    """Handler to trigger a complete re-fresh of all component catalogs."""

    @web.authenticated
    async def put(self):
        # Validate the body
        cache_refresh = self.get_json_body()
        if "action" not in cache_refresh or cache_refresh["action"] != "refresh":
            raise web.HTTPError(400, reason="A body of {'action': 'refresh'} is required!")

        try:
            self.log.debug("Refreshing component cache for all catalog instances...")
            ComponentCache.instance().refresh()
            self.set_status(204)
        except RefreshInProgressError as ripe:
            self.set_status(409, str(ripe))

        await self.finish()

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class ComponentCacheCatalogHandler(HttpErrorMixin, APIHandler):
    """Handler to trigger a re-fresh of a single component catalog with the given name."""

    @web.authenticated
    async def put(self, catalog):
        # Validate the body
        cache_refresh = self.get_json_body()
        if "action" not in cache_refresh or cache_refresh["action"] != "refresh":
            raise web.HTTPError(400, reason="A body of {'action': 'refresh'} is required.")

        try:
            # Ensure given catalog name is a metadata instance
            catalog_instance = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID).get(
                name=catalog
            )
        except MetadataNotFoundError:
            raise web.HTTPError(404, f"Catalog '{catalog}' cannot be found.")

        self.log.debug(f"Refreshing component cache for catalog with name '{catalog}'...")
        ComponentCache.instance().update(catalog=catalog_instance, action="modify")
        self.set_status(204)

        await self.finish()

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)
