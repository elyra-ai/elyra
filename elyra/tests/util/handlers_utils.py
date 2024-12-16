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

import tornado


def expected_http_error(error, expected_code, expected_message=None):
    """Check that the error matches the expected output error."""
    e = error.value
    if isinstance(e, tornado.web.HTTPError):
        if expected_code != e.status_code:
            return False
        if expected_message is not None and expected_message != str(e):
            return False
        return True
    elif any(
        [
            isinstance(e, tornado.httpclient.HTTPClientError),
            isinstance(e, tornado.httpclient.HTTPError),
        ]
    ):
        if expected_code != e.code:
            return False
        if expected_message:
            message = json.loads(e.response.body.decode())["message"]
            if expected_message != message:
                return False
        return True
