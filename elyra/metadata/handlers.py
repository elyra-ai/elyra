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
from jsonschema import ValidationError
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from jupyter_server.utils import url_unescape
from tornado import web

from elyra.metadata.error import MetadataExistsError
from elyra.metadata.error import MetadataNotFoundError
from elyra.metadata.error import SchemaNotFoundError
from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schema import SchemaManager
from elyra.util.http import HttpErrorMixin


class MetadataHandler(HttpErrorMixin, APIHandler):
    """Handler for metadata configurations collection."""

    @web.authenticated
    async def get(self, schemaspace):
        schemaspace = url_unescape(schemaspace)
        parent = self.settings.get("elyra")
        try:
            metadata_manager = MetadataManager(schemaspace=schemaspace, parent=parent)
            metadata = metadata_manager.get_all()
        except (ValidationError, ValueError) as err:
            raise web.HTTPError(400, str(err)) from err
        except MetadataNotFoundError as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        metadata_model = {schemaspace: [r.to_dict(trim=True) for r in metadata]}
        self.set_header("Content-Type", "application/json")
        self.finish(metadata_model)

    @web.authenticated
    async def post(self, schemaspace):
        schemaspace = url_unescape(schemaspace)
        parent = self.settings.get("elyra")
        try:
            instance = self._validate_body(schemaspace)
            self.log.debug(
                f"MetadataHandler: Creating metadata instance '{instance.name}' in schemaspace '{schemaspace}'..."
            )
            metadata_manager = MetadataManager(schemaspace=schemaspace, parent=parent)
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
        self.set_header("Content-Type", "application/json")
        location = url_path_join(self.base_url, "elyra", "metadata", schemaspace, metadata.name)
        self.set_header("Location", location)
        self.finish(metadata.to_dict(trim=True))

    def _validate_body(self, schemaspace: str):
        """Validates the body issued for creates."""
        body = self.get_json_body()

        # Ensure schema_name and metadata fields exist.
        required_fields = ["schema_name", "metadata"]
        for field in required_fields:
            if field not in body:
                raise SyntaxError(f"Insufficient information - '{field}' is missing from request body.")

        # Ensure there is at least one of name or a display_name
        one_of_fields = ["name", "display_name"]
        if set(body).isdisjoint(one_of_fields):
            raise SyntaxError(
                f"Insufficient information - request body requires one of the following: {one_of_fields}."
            )

        instance = Metadata.from_dict(schemaspace, {**body})
        return instance

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class MetadataResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for metadata configuration specific resource (e.g. a runtime element)."""

    @web.authenticated
    async def get(self, schemaspace, resource):
        schemaspace = url_unescape(schemaspace)
        resource = url_unescape(resource)
        parent = self.settings.get("elyra")

        try:
            metadata_manager = MetadataManager(schemaspace=schemaspace, parent=parent)
            metadata = metadata_manager.get(resource)
        except (ValidationError, ValueError, NotImplementedError) as err:
            raise web.HTTPError(400, str(err)) from err
        except MetadataNotFoundError as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_header("Content-Type", "application/json")
        self.finish(metadata.to_dict(trim=True))

    @web.authenticated
    async def put(self, schemaspace, resource):
        schemaspace = url_unescape(schemaspace)
        resource = url_unescape(resource)
        parent = self.settings.get("elyra")

        try:
            payload = self.get_json_body()
            # Get the current resource to ensure its pre-existence
            metadata_manager = MetadataManager(schemaspace=schemaspace, parent=parent)
            metadata_manager.get(resource)
            # Check if name is in the payload and varies from resource, if so, raise 400
            if "name" in payload and payload["name"] != resource:
                raise NotImplementedError(
                    f"The attempt to rename instance '{resource}' to '{payload['name']}' is not supported."
                )
            instance = Metadata.from_dict(schemaspace, {**payload})
            self.log.debug(
                f"MetadataHandler: Updating metadata instance '{resource}' in schemaspace '{schemaspace}'..."
            )
            metadata = metadata_manager.update(resource, instance)
        except (ValidationError, ValueError, NotImplementedError) as err:
            raise web.HTTPError(400, str(err)) from err
        except MetadataNotFoundError as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_status(200)
        self.set_header("Content-Type", "application/json")
        self.finish(metadata.to_dict(trim=True))

    @web.authenticated
    async def delete(self, schemaspace, resource):
        schemaspace = url_unescape(schemaspace)
        resource = url_unescape(resource)
        parent = self.settings.get("elyra")

        try:
            self.log.debug(
                f"MetadataHandler: Deleting metadata instance '{resource}' in schemaspace '{schemaspace}'..."
            )
            metadata_manager = MetadataManager(schemaspace=schemaspace, parent=parent)
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

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class SchemaHandler(HttpErrorMixin, APIHandler):
    """Handler for schemaspace schemas."""

    @web.authenticated
    async def get(self, schemaspace):
        schemaspace = url_unescape(schemaspace)

        try:
            schema_manager = SchemaManager.instance()
            schemas = schema_manager.get_schemaspace_schemas(schemaspace)
        except (ValidationError, ValueError, SchemaNotFoundError) as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        schemas_model = {schemaspace: list(schemas.values())}
        self.set_header("Content-Type", "application/json")
        self.finish(schemas_model)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class SchemaResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for a specific schema (resource) for a given schemaspace."""

    @web.authenticated
    async def get(self, schemaspace, resource):
        schemaspace = url_unescape(schemaspace)
        resource = url_unescape(resource)

        try:
            schema_manager = SchemaManager.instance()
            schema = schema_manager.get_schema(schemaspace, resource)
        except (ValidationError, ValueError, SchemaNotFoundError) as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        self.set_header("Content-Type", "application/json")
        self.finish(schema)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class SchemaspaceHandler(HttpErrorMixin, APIHandler):
    """Handler for retrieving schemaspace names."""

    @web.authenticated
    async def get(self):
        try:
            schema_manager = SchemaManager.instance()
            schemaspaces = schema_manager.get_schemaspace_names()
        except (ValidationError, ValueError) as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        schemaspace_model = {"schemaspaces": schemaspaces}

        self.set_header("Content-Type", "application/json")
        self.finish(schemaspace_model)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)


class SchemaspaceResourceHandler(HttpErrorMixin, APIHandler):
    """Handler for retrieving schemaspace JSON info (id, display name and descripton) for a given schemaspace."""

    @web.authenticated
    async def get(self, schemaspace):
        try:
            schema_manager = SchemaManager.instance()
            schemaspace = schema_manager.get_schemaspace(schemaspace)

        except (ValidationError, ValueError) as err:
            raise web.HTTPError(404, str(err)) from err
        except Exception as err:
            raise web.HTTPError(500, repr(err)) from err

        schemaspace_info_model = {
            "name": schemaspace.name,
            "id": schemaspace.id,
            "display_name": schemaspace.display_name,
            "description": schemaspace.description,
        }

        self.set_header("Content-Type", "application/json")
        self.finish(schemaspace_info_model)

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)
