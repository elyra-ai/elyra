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
import json
from tornado import web, gen
from notebook.base.handlers import APIHandler
from notebook.utils import maybe_future, url_path_join, url_unescape
from .metadata import MetadataManager, FileMetadataStore


class MainRuntimeHandler(APIHandler):
    """Handler for all runtime configurations. """
    metadata_manager = MetadataManager(namespace="runtime")

    @web.authenticated
    @gen.coroutine
    def get(self):
        runtimes = yield maybe_future(self.metadata_manager.get_all())
        json_runtimes = {r.name : r.to_dict() for r in runtimes}
        self.set_header("Content-Type", 'application/json')
        self.finish(json_runtimes)


class RuntimeHandler(APIHandler):
    """Handler for specific runtime configurations. """
    metadata_manager = MetadataManager(namespace="runtime")

    @web.authenticated
    @gen.coroutine
    def get(self, runtime_name):
        runtime_name = url_unescape(runtime_name)
        runtime = yield maybe_future(self.metadata_manager.get(runtime_name))
        if runtime is None:
            raise web.HTTPError(404, u"Metadata runtime '{}' not found!".format(runtime_name))

        self.set_header("Content-Type", 'application/json')
        self.finish(runtime.to_dict())
