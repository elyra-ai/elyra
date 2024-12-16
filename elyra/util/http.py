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

"""Mixins for Tornado handlers."""

from datetime import datetime
from http.client import responses
import json
import traceback

from tornado import web


class HttpErrorMixin(object):
    """Mixes `write_error` into tornado.web.RequestHandlers to respond with
    JSON-formatted errors.
    """

    def write_error(self, status_code, **kwargs):
        """Responds with an application/json error object.

        Overrides the APIHandler.write_error in the notebook server until it
        properly sets the 'reason' field.

        Parameters
        ----------
        status_code
            HTTP status code to set
        **kwargs
            Arbitrary keyword args. Only uses `exc_info[1]`, if it exists,
            to get a `log_message`, `args`, and `reason` from a raised
            exception that triggered this method

        Examples
        --------
        {"401", reason="Unauthorized", message="Invalid auth token"}
        """
        exc_info = kwargs.get("exc_info")
        message = ""
        reason = responses.get(status_code, "Unknown HTTP Error")
        reply = {"reason": reason, "message": message, "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        if exc_info:
            exception = exc_info[1]
            # Get the custom message, if defined
            if isinstance(exception, web.HTTPError):
                reply["message"] = exception.log_message or message
            else:
                if isinstance(exception, Exception) and exception.args:
                    if isinstance(exception.args[0], Exception):
                        reply["message"] = (
                            f"Error. The server sent an invalid response.\
                                \nPlease open an issue and provide this error message,\
                                any error details, and any related JupyterLab log messages.\
                                \n\nError found:\n{str(exception.args[0])}"
                        )
                    else:
                        reply["message"] = str(exception.args[0])
                else:
                    reply["message"] = f"{exception.__class__.__name__}: {str(exception)}"
                reply["traceback"] = "".join(traceback.format_exception(*exc_info))

            # Construct the custom reason, if defined
            custom_reason = getattr(exception, "reason", "")
            if custom_reason:
                reply["reason"] = custom_reason

        self.set_header("Content-Type", "application/json")
        self.set_status(status_code, reason=reply["reason"])
        self.finish(json.dumps(reply))
