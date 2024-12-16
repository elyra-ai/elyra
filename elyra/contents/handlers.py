#
# Copyright 2018-2025 Elyra Authors
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
import os

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_unescape
from tornado import web

from elyra.contents.parser import ContentParser
from elyra.util.http import HttpErrorMixin
from elyra.util.path import get_expanded_path


class ContentHandler(HttpErrorMixin, APIHandler):
    """Handler to expose REST API to parse envs from a File"""

    content_parser: ContentParser = ContentParser()

    @web.authenticated
    async def post(self, path):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    @web.authenticated
    async def get(self, path=""):
        path = path or ""
        path = url_unescape(path)

        self.log.debug(f"Parsing file: {path}")

        try:
            absolute_path = self._get_absolute_path(path)
            properties = self.content_parser.parse(absolute_path)

            # TODO: Validation of model
            self.finish(json.dumps(properties))
        except FileNotFoundError as fnfe:
            raise web.HTTPError(404, str(fnfe)) from fnfe
        except IsADirectoryError as iade:
            raise web.HTTPError(400, str(iade)) from iade
        except Exception as e:
            # Parser could not parse the given file, but this does not necessarily indicate an error with the file.
            # Log the issue and return an empty model so that other user processes are not disrupted.
            self.log.debug(f"Could not parse '{path}': {str(e)}")
            empty_properties = {"env_vars": {}, "inputs": [], "outputs": []}
            self.finish(json.dumps(empty_properties))

    def _get_absolute_path(self, path: str) -> str:
        """Returns the absolute path of 'path' in relation to the configured root_dir.

        Note: This version of `get_absolute_path` is used over the version in util/path.py because
        'path' will have a leading `/` and therefore be considered absolute already when, within
        this handler, it should always be a path relative to root_dir.
        """

        root_dir = get_expanded_path(self.settings["server_root_dir"])
        if path[0] == "/":  # if path starts with a slash, use the follow characters so join can be performed
            path = path[1:]
        absolute_path = os.path.normpath(os.path.join(root_dir, path))
        return absolute_path

    def write_error(self, status_code, **kwargs):
        HttpErrorMixin.write_error(self, status_code, **kwargs)
