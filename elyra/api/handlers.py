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
import os

from notebook.base.handlers import APIHandler
from tornado import web


class BaseSpecHandler(web.StaticFileHandler, APIHandler):

    @staticmethod
    def get_resource_metadata():
        """Returns the (resource, mime-type) for the handlers spec.
        """
        pass

    def initialize(self):
        web.StaticFileHandler.initialize(self, path=os.path.dirname(__file__))

    @web.authenticated
    def get(self):
        return web.StaticFileHandler.get(self, self.get_resource_metadata()[0])

    def get_content_type(self):
        return self.get_resource_metadata()[1]


class YamlSpecHandler(BaseSpecHandler):
    """Exposes the ability to return specifications from static files"""

    @staticmethod
    def get_resource_metadata():
        """Returns the (resource, mime-type) for the handlers spec.
        """
        return 'elyra.yaml', 'text/x-yaml'
