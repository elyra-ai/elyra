#
# Copyright 2018-2019 IBM Corporation
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


class MainRuntimeHandler(APIHandler):
    """Handler for all runtime configurations. """

    @web.authenticated
    @gen.coroutine
    def get(self):
        metadata_manager = MetadataManager.instance(namespace="runtime")
        try:
            runtimes = yield maybe_future(metadata_manager.get_all())
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        json_runtimes = {r.name : r.to_dict() for r in runtimes}
        self.set_header("Content-Type", 'application/json')
        self.finish(json_runtimes)


class RuntimeHandler(APIHandler):
    """Handler for specific runtime configurations. """

    @web.authenticated
    @gen.coroutine
    def get(self, runtime_name):
        runtime_name = url_unescape(runtime_name)
        metadata_manager = MetadataManager.instance(namespace="runtime")
        try:
            runtime = yield maybe_future(metadata_manager.get(runtime_name))
        except (ValidationError, KeyError) as err:
            raise web.HTTPError(404, str(err))
        except Exception as ex:
            raise web.HTTPError(500, repr(ex))

        self.set_header("Content-Type", 'application/json')
        self.finish(runtime.to_dict())
