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
from .metadata import MetadataManager, SchemaManager, Metadata
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
        except (ValidationError, ValueError, FileNotFoundError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        metadata_model = dict()
        metadata_model[namespace] = [r.to_dict(trim=True) for r in metadata]
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata_model)

    @web.authenticated
    @gen.coroutine
    def post(self, namespace):

        namespace = url_unescape(namespace)
        try:
            instance = self._validate_body()
            self.log.debug("MetadataHandler: Creating metadata instance '{}' in namespace '{}'...".
                           format(instance.name, namespace))
            metadata_manager = MetadataManager(namespace=namespace)
            metadata = metadata_manager.add(instance.name, instance, replace=False)
        except (ValidationError, ValueError, SyntaxError) as se:
            raise web.HTTPError(400, str(se))
        except FileNotFoundError as err:
            raise web.HTTPError(404, str(err))
        except FileExistsError as err:
            raise web.HTTPError(409, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_status(201)
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict(trim=True))

    def _validate_body(self):
        """Validates the body issued for creates. """
        body = self.get_json_body()

        # Ensure name, schema_name and metadata fields exist.
        required_fields = ['name', 'schema_name', 'metadata']
        for field in required_fields:
            if field not in body:
                raise SyntaxError("Insufficient information - '{}' is missing from request body.".format(field))

        instance = Metadata(**body)
        return instance


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
        except (ValidationError, ValueError, FileNotFoundError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict(trim=True))

    @web.authenticated
    @gen.coroutine
    def put(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)

        try:
            payload = self.get_json_body()
            # get the current resource...
            metadata_manager = MetadataManager(namespace=namespace)
            current = metadata_manager.get(resource)
            # convert to dictionary and update current with desired changes
            updates = current.to_dict()
            updates.update(payload)
            # Check if name is in the payload and varies from resource, if so, raise 400
            if 'name' in payload and payload['name'] != resource:
                raise NotImplementedError("The attempt to rename instance '{}' to '{}' is not supported.".
                                          format(resource, payload['name']))
            instance = Metadata(**updates)
            self.log.debug("MetadataHandler: Updating metadata instance '{}' in namespace '{}'...".
                           format(resource, namespace))
            metadata = metadata_manager.add(resource, instance, replace=True)
        except (NotImplementedError) as err:
            raise web.HTTPError(400, str(err))
        except (ValidationError, ValueError, FileNotFoundError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict(trim=True))

    @web.authenticated
    @gen.coroutine
    def delete(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)

        try:
            self.log.debug("MetadataHandler: Deleting metadata instance '{}' in namespace '{}'...".
                           format(resource, namespace))
            metadata_manager = MetadataManager(namespace=namespace)
            metadata = metadata_manager.remove(resource)
        except PermissionError as err:
            raise web.HTTPError(403, str(err))
        except (ValidationError, ValueError, FileNotFoundError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict(trim=True))


class SchemaHandler(HttpErrorMixin, APIHandler):
    """Handler for namespace schemas. """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace):
        namespace = url_unescape(namespace)
        schema_manager = SchemaManager()
        try:
            self.log.debug("SchemaHandler: Fetching all schemas for namespace '{}'...".format(namespace))
            schemas = yield maybe_future(schema_manager.get_namespace_schemas(namespace))
        except (ValidationError, ValueError, FileNotFoundError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        schemas_model = dict()
        schemas_model[namespace] = list(schemas.values())
        self.set_header("Content-Type", 'application/json')
        self.finish(schemas_model)


class SchemaResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for a specific schema (resource) for a given namespace. """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)
        schema_manager = SchemaManager()
        try:
            self.log.debug("SchemaResourceHandler: Fetching schema '{}' for namespace '{}'...".
                           format(resource, namespace))
            schema = yield maybe_future(schema_manager.get_schema(namespace, resource))
        except (ValidationError, ValueError, FileNotFoundError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_header("Content-Type", 'application/json')
        self.finish(schema)


class NamespaceHandler(HttpErrorMixin, APIHandler):
    """Handler for retrieving namespaces """

    @web.authenticated
    @gen.coroutine
    def get(self):
        schema_manager = SchemaManager()
        try:
            self.log.debug("NamespaceHandler: Fetching namespaces...")
            namespaces = schema_manager.get_namespaces()
        except (ValidationError, ValueError, FileNotFoundError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        namespace_model = dict()
        namespace_model['namespaces'] = namespaces

        self.set_header("Content-Type", 'application/json')
        self.finish(namespace_model)
