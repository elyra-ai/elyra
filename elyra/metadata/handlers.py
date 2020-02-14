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
from .metadata import MetadataManager


class MetadataHandler(APIHandler):
    """Handler for metadata configurations collection. """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace):
        namespace = url_unescape(namespace)
        metadata_manager = MetadataManager(namespace=namespace)
        try:
            metadata = yield maybe_future(metadata_manager.get_all())
        except (ValidationError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        metadata_model = {}
        metadata_model[namespace] = {r.name: r.to_dict() for r in metadata}
        self.set_header("Content-Type", 'application/json')
        self.finish(metadata_model)


class MetadataNamespaceHandler(APIHandler):
    """Handler for metadata configuration specific resource (e.g. a runtime element). """

    @web.authenticated
    @gen.coroutine
    def get(self, namespace, target):
        namespace = url_unescape(namespace)
        target = url_unescape(target)
        metadata_manager = MetadataManager(namespace=namespace)
        try:

            metadata = yield maybe_future(metadata_manager.get(target))
        except (ValidationError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_header("Content-Type", 'application/json')
        self.finish(metadata.to_dict())
