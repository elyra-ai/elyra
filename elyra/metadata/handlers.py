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
from jsonschema import ValidationError
from tornado import web, gen
from notebook.base.handlers import APIHandler
from notebook.utils import maybe_future, url_unescape
from .metadata import MetadataManager, SchemaManager
from ..util.http import HttpErrorMixin


class MetadataHandler(HttpErrorMixin, APIHandler):
    """Handler for metadata configurations collection. """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace):
        namespace = url_unescape(namespace)
        try:
            metadata_manager = MetadataManager(namespace=namespace)
            self.log.debug("MetadataHandler: Fetching all metadata resources from namespace '{}'...".format(namespace))
            metadata = yield maybe_future(metadata_manager.get_all())
        except (ValidationError, ValueError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        metadata_model = dict()
        metadata_model[namespace] = {r.name: r.to_dict() for r in metadata}
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata_model)


class MetadataResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for metadata configuration specific resource (e.g. a runtime element). """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)

        try:
            metadata_manager = MetadataManager(namespace=namespace)
            self.log.debug("MetadataResourceHandler: Fetching metadata resource '{}' from namespace '{}'...".
                           format(resource, namespace))
            metadata = yield maybe_future(metadata_manager.get(resource))
        except (ValidationError, ValueError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict())


class MetadataSchemaHandler(HttpErrorMixin, APIHandler):
    """Handler for namespace schemas. """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace):
        namespace = url_unescape(namespace)
        schema_manager = SchemaManager()
        try:
            self.log.debug("MetadataSchemaHandler: Fetching all schemas for namespace '{}'...".format(namespace))
            schemas = yield maybe_future(schema_manager.get_namespace_schemas(namespace))
        except (ValidationError, ValueError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        schemas_model = dict()
        schemas_model[namespace] = {r['name']: r for r in schemas.values()}
        self.set_header("Content-Type", 'application/json')
        self.finish(schemas_model)


class MetadataSchemaResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for a specific schema (resource) for a given namespace. """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)
        schema_manager = SchemaManager()
        try:
            self.log.debug("MetadataSchemaResourceHandler: Fetching schema '{}' for namespace '{}'...".
                           format(resource, namespace))
            schema = yield maybe_future(schema_manager.get_schema(namespace, resource))
        except (ValidationError, ValueError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_header("Content-Type", 'application/json')
        self.finish(schema)
