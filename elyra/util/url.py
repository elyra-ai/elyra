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
import os
from pathlib import Path
from typing import Union
from urllib.request import url2pathname

from requests import Response
from requests.adapters import BaseAdapter


class FileTransportAdapter(BaseAdapter):
    """
    File Transport Adapter for the requests library. Use this
    adapter to enable the requests library to load a resource
    from the 'file' schema using HTTP 'GET'.
    """

    def send(self, req, **kwargs):
        """
        Return the file specified by the given request
        """

        response = Response()
        response.request = req
        response.connection = self
        if isinstance(req.url, bytes):
            response.url = req.url.decode("utf-8")
        else:
            response.url = req.url

        if req.method.lower() not in ["get"]:
            response.status_code = 405
            response.reason = "Method not allowed"
            return response

        p = Path(url2pathname(req.path_url))
        if p.is_dir():
            response.status_code = 400
            response.reason = "Not a file"
            return response
        elif not p.is_file():
            response.status_code = 404
            response.reason = "File not found"
            return response

        with open(p, "rb") as fh:
            response.status_code = 200
            response._content = fh.read()

        return response

    def close(self):
        pass


def get_verify_parm(default: bool = True) -> Union[bool, str]:
    """
    Returns a value for the 'verify' parameter of the requests.request
    method (https://requests.readthedocs.io/en/latest/api/). The value
    is determined as follows: if environment variable TRUSTED_CA_BUNDLE_PATH
    is defined, use its value, otherwise return the default value.
    """
    if len(os.environ.get("TRUSTED_CA_BUNDLE_PATH", "").strip()) > 0:
        return os.environ.get("TRUSTED_CA_BUNDLE_PATH")

    return default
