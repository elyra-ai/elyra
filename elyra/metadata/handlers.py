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
from tornado import web
from notebook.base.handlers import APIHandler
from notebook.utils import url_unescape, url_path_join

from .error import MetadataNotFoundError, MetadataExistsError, SchemaNotFoundError
from .metadata import Metadata
from .manager import MetadataManager
from .schema import SchemaManager
from ..util.http import HttpErrorMixin


class MetadataHandler(HttpErrorMixin, APIHandler):
    """Handler for metadata configurations collection. """

    @web.authenticated
    async def get(self, namespace):
        namespace = url_unescape(namespace)
        try:
            metadata_manager = MetadataManager(namespace=namespace)
            metadata = metadata_manager.get_all()
        except (ValidationError, ValueError) as err:
            raise web.HTTPError(400, str(err)) from err
        except MetadataNotFoundError as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        metadata_model = dict()
        metadata_model[namespace] = [r.to_dict(trim=True) for r in metadata]
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata_model)

    @web.authenticated
    async def post(self, namespace):

        namespace = url_unescape(namespace)
        try:
            instance = self._validate_body(namespace)
            self.log.debug("MetadataHandler: Creating metadata instance '{}' in namespace '{}'...".
                           format(instance.name, namespace))
            metadata_manager = MetadataManager(namespace=namespace)
            metadata = metadata_manager.create(instance.name, instance)
        except (ValidationError, ValueError, SyntaxError) as err:
            raise web.HTTPError(400, str(err)) from err
        except (MetadataNotFoundError, SchemaNotFoundError) as err:
            raise web.HTTPError(404, str(err)) from err
        except MetadataExistsError as err:
            raise web.HTTPError(409, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_status(201)
        self.set_header("Content-Type", 'application/json')
        location = url_path_join(self.base_url, 'elyra', 'metadata', namespace, metadata.name)
        self.set_header('Location', location)
        self.finish(metadata.to_dict(trim=True))

    def _validate_body(self, namespace: str):
        """Validates the body issued for creates. """
        body = self.get_json_body()

        # Ensure schema_name and metadata fields exist.
        required_fields = ['schema_name', 'metadata']
        for field in required_fields:
            if field not in body:
                raise SyntaxError("Insufficient information - '{}' is missing from request body.".format(field))

        # Ensure there is at least one of name or a display_name
        one_of_fields = ['name', 'display_name']
        if set(body).isdisjoint(one_of_fields):
            raise SyntaxError(
                "Insufficient information - request body requires one of the following: {}.".format(
                    one_of_fields
                )
            )

        instance = Metadata.from_dict(namespace, {**body})
        return instance


class MetadataResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for metadata configuration specific resource (e.g. a runtime element). """

    @web.authenticated
    async def get(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)

        try:
            metadata_manager = MetadataManager(namespace=namespace)
            metadata = metadata_manager.get(resource)
        except (ValidationError, ValueError, NotImplementedError) as err:
            raise web.HTTPError(400, str(err)) from err
        except MetadataNotFoundError as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict(trim=True))

    @web.authenticated
    async def put(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)

        try:
            payload = self.get_json_body()
            # Get the current resource to ensure its pre-existence
            metadata_manager = MetadataManager(namespace=namespace)
            metadata_manager.get(resource)
            # Check if name is in the payload and varies from resource, if so, raise 400
            if 'name' in payload and payload['name'] != resource:
                raise NotImplementedError("The attempt to rename instance '{}' to '{}' is not supported.".
                                          format(resource, payload['name']))
            instance = Metadata.from_dict(namespace, {**payload})
            self.log.debug("MetadataHandler: Updating metadata instance '{}' in namespace '{}'...".
                           format(resource, namespace))
            metadata = metadata_manager.update(resource, instance)
        except (ValidationError, ValueError, NotImplementedError) as err:
            raise web.HTTPError(400, str(err)) from err
        except MetadataNotFoundError as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict(trim=True))

    @web.authenticated
    async def delete(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)

        try:
            self.log.debug("MetadataHandler: Deleting metadata instance '{}' in namespace '{}'...".
                           format(resource, namespace))
            metadata_manager = MetadataManager(namespace=namespace)
            metadata_manager.remove(resource)
        except (ValidationError, ValueError) as err:
            raise web.HTTPError(400, str(err)) from err
        except PermissionError as err:
            raise web.HTTPError(403, str(err)) from err
        except MetadataNotFoundError as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_status(204)
        self.finish()


class SchemaHandler(HttpErrorMixin, APIHandler):
    """Handler for namespace schemas. """

    @web.authenticated
    async def get(self, namespace):
        namespace = url_unescape(namespace)
        schema_manager = SchemaManager()
        try:
            schemas = schema_manager.get_namespace_schemas(namespace)
        except (ValidationError, ValueError, SchemaNotFoundError) as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        schemas_model = dict()
        schemas_model[namespace] = list(schemas.values())
        self.set_header("Content-Type", 'application/json')
        self.finish(schemas_model)


class SchemaResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for a specific schema (resource) for a given namespace. """

    @web.authenticated
    async def get(self, namespace, resource):
        namespace = url_unescape(namespace)
        resource = url_unescape(resource)
        schema_manager = SchemaManager()
        try:
            schema = schema_manager.get_schema(namespace, resource)
        except (ValidationError, ValueError, SchemaNotFoundError) as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_header("Content-Type", 'application/json')
        self.finish(schema)


class NamespaceHandler(HttpErrorMixin, APIHandler):
    """Handler for retrieving namespaces """

    @web.authenticated
    async def get(self):
        schema_manager = SchemaManager()
        try:
            namespaces = schema_manager.get_namespaces()
        except (ValidationError, ValueError) as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        namespace_model = dict()
        namespace_model['namespaces'] = namespaces

        self.set_header("Content-Type", 'application/json')
        self.finish(namespace_model)
