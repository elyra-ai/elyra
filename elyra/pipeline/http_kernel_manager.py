#
# Copyright 2018-2021 Elyra Authors
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
"""KernelManager class to manage a kernel running on a Gateway Server via the REST API"""

import asyncio
import concurrent.futures
import datetime
import inspect
import json
import os
import websocket

from jupyter_client.asynchronous.client import AsyncKernelClient
from jupyter_client.clientabc import KernelClientABC
from jupyter_client.manager import AsyncKernelManager
from jupyter_client.managerabc import KernelManagerABC
from logging import Logger
from queue import Queue
from socket import gaierror
from threading import Thread
from tornado import web
from tornado.escape import json_encode, json_decode, url_escape, utf8
from tornado.httpclient import AsyncHTTPClient, HTTPError
from traitlets import DottedObjectName, Type
from traitlets.config import SingletonConfigurable
from typing import Optional


class GatewayConfig(SingletonConfigurable):
    """Mixin class to coordinate Gateway-related values and methods"""

    arg_envs = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Transfer any ELYRA_ envs from kwargs to our own local dict and clean up kwargs
        self.arg_envs = {}
        if 'env' in kwargs:
            for k, v in kwargs['env'].items():
                if k.startswith("ELYRA_"):
                    self.arg_envs[k] = v
            # Remove same set from kwargs since we don't want these passed along to kernel process
            for k in self.arg_envs.keys():
                kwargs['env'].pop(k)

            # And capture kernel launch timeout, if present
            self.arg_envs["KERNEL_LAUNCH_TIMEOUT"] = kwargs['env'].get("KERNEL_LAUNCH_TIMEOUT")

        # Initialize Gateway configuration variables with priority to local env, then self.arg_envs
        self.url = self._get_env("ELYRA_GATEWAY_URL")
        if not self.url:
            raise ValueError("ELYRA_GATEWAY_URL env is required to be set!")

        self.ws_url = self._get_env("ELYRA_GATEWAY_WS_URL", self.url.lower().replace('http', 'ws'))
        self.kernels_endpoint = self._get_env("ELYRA_GATEWAY_KERNELS_ENDPOINT", '/api/kernels')
        self.kernelspecs_endpoint = self._get_env("ELYRA_GATEWAY_KERNELSPECS_ENDPOINT", '/api/kernelspecs')
        self.request_timeout = float(self._get_env("ELYRA_GATEWAY_REQUEST_TIMEOUT", "40.0"))
        self.connect_timeout = float(self._get_env("ELYRA_GATEWAY_CONNECT_TIMEOUT", "40.0"))
        self.headers = json.loads(self._get_env("ELYRA_GATEWAY_HEADERS", "{}"))
        self.validate_cert = bool(self._get_env("ELYRA_GATEWAY_VALIDATE_CERT", "True") not in ['no', 'false'])
        self.auth_token = self._get_env("ELYRA_GATEWAY_AUTH_TOKEN")
        self.client_cert = self._get_env("ELYRA_GATEWAY_CLIENT_CERT")
        self.client_key = self._get_env("ELYRA_GATEWAY_CLIENT_KEY")
        self.ca_certs = self._get_env("ELYRA_GATEWAY_CA_CERTS")
        self.http_user = self._get_env("ELYRA_GATEWAY_HTTP_USER")
        self.http_pwd = self._get_env("ELYRA_GATEWAY_HTTP_PWD")
        self.kernel_launch_timeout = int(self._get_env('KERNEL_LAUNCH_TIMEOUT', '40'))

    def _get_env(self, name: str, default: Optional[str] = None) -> Optional[str]:
        """Gets the named value from the environment (first) using original kwargs env as a fallback. """
        return os.environ.get(name, self.arg_envs.get(name, default))

    def _load_connection_args(self, **kwargs) -> dict:
        # Ensure that request timeout and KERNEL_LAUNCH_TIMEOUT are the same, taking the
        #  greater value of the two.
        if self.request_timeout < float(self.kernel_launch_timeout):
            self.request_timeout = float(self.kernel_launch_timeout)
        elif self.request_timeout > float(self.kernel_launch_timeout):
            self.kernel_launch_timeout = int(self.request_timeout)

        kwargs['headers'] = self.headers
        if 'Authorization' not in self.headers.keys():
            kwargs['headers'].update({
                'Authorization': 'token {}'.format(self.auth_token)
            })
        kwargs['connect_timeout'] = self.connect_timeout
        kwargs['request_timeout'] = self.request_timeout
        kwargs['validate_cert'] = self.validate_cert
        if self.client_cert:
            kwargs['client_cert'] = self.client_cert
            kwargs['client_key'] = self.client_key
            if self.ca_certs:
                kwargs['ca_certs'] = self.ca_certs
        if self.http_user:
            kwargs['auth_username'] = self.http_user
        if self.http_pwd:
            kwargs['auth_password'] = self.http_pwd

        return kwargs

    async def gateway_request(self, endpoint, **kwargs):
        """Make an async request to kernel gateway endpoint, returns a response """
        client = AsyncHTTPClient()
        kwargs = self._load_connection_args(**kwargs)
        try:
            response = await client.fetch(endpoint, **kwargs)
        # Trap a set of common exceptions so that we can inform the user that their Gateway url is incorrect
        # or the server is not running.
        # NOTE: We do this here since this handler is called during the Notebook's startup and subsequent refreshes
        # of the tree view.
        except ConnectionRefusedError as e:
            raise web.HTTPError(
                503,
                "Connection refused from Gateway server url '{}'.  Check to be sure the"
                " Gateway instance is running.".format(self.url)
            ) from e
        except HTTPError as e:
            # This can occur if the host is valid (e.g., foo.com) but there's nothing there.
            raise web.HTTPError(e.code, "Error attempting to connect to Gateway server url '{}'.  "
                                        "Ensure gateway url is valid and the Gateway instance is running.".
                                format(self.url)) from e
        except gaierror as e:
            raise web.HTTPError(
                404,
                "The Gateway server specified in the gateway_url '{}' doesn't appear to be valid.  Ensure gateway "
                "url is valid and the Gateway instance is running.".format(self.url)
            ) from e

        return response


class HTTPKernelManager(AsyncKernelManager):
    """Manages a single kernel remotely via a Gateway Server. """

    kernel_id = None
    kernel = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_endpoint = None  # url_path_join(self.url, self.kernels_endpoint)
        self.kernel = None
        self.gateway_config = None  # initialized in start_kernel

    def _get_kernel_endpoint_url(self, kernel_id=None):
        """Builds a url for the kernels endpoint

        Parameters
        ----------
        kernel_id: kernel UUID (optional)
        """
        if kernel_id:
            return url_path_join(self.base_endpoint, url_escape(str(kernel_id)))

        return self.base_endpoint

    @property
    def has_kernel(self):
        """Has a kernel been started that we are managing."""
        return self.kernel is not None

    client_class = DottedObjectName('elyra.pipeline.http_kernel_manager.HTTPKernelClient')
    client_factory = Type(klass='elyra.pipeline.http_kernel_manager.HTTPKernelClient')

    # --------------------------------------------------------------------------
    # create a Client connected to our Kernel
    # --------------------------------------------------------------------------

    def client(self, **kwargs):
        """Create a client configured to connect to our kernel"""
        kw = {}
        kw.update(self.get_connection_info(session=True))
        kw.update(dict(
            connection_file=self.connection_file,
            parent=self,
        ))
        kw['kernel_id'] = self.kernel_id

        # add kwargs last, for manual overrides
        kw.update(kwargs)
        return self.client_factory(**kw)

    async def get_kernel(self, kernel_id):
        """Get kernel for kernel_id.

        Parameters
        ----------
        kernel_id : uuid
            The uuid of the kernel.
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id)
        self.log.debug("Request kernel at: %s" % kernel_url)
        try:
            response = await self.gateway_config.gateway_request(kernel_url, method='GET')
        except web.HTTPError as error:
            if error.status_code == 404:
                self.log.warning("Kernel not found at: %s" % kernel_url)
                kernel = None
            else:
                raise
        else:
            kernel = json_decode(response.body)
        self.log.debug("Kernel retrieved: %s" % kernel)
        return kernel

    # --------------------------------------------------------------------------
    # Kernel management
    # --------------------------------------------------------------------------

    async def start_kernel(self, **kwargs):
        """Starts a kernel via HTTP in an asynchronous manner.

        Parameters
        ----------
        `**kwargs` : optional
             keyword arguments that are passed down to build the kernel_cmd
             and launching the kernel (e.g. Popen kwargs).
        """
        self.gateway_config = GatewayConfig.instance(**kwargs)
        self.base_endpoint = url_path_join(self.gateway_config.url, self.gateway_config.kernels_endpoint)

        kernel_id = kwargs.get('kernel_id')

        if kernel_id is None:
            kernel_name = kwargs.get('kernel_name', 'python3')
            kernel_url = self._get_kernel_endpoint_url()
            self.log.debug("Request new kernel at: %s" % kernel_url)

            # Let KERNEL_USERNAME take precedent over http_user config option.
            if os.environ.get('KERNEL_USERNAME') is None and self.gateway_config.http_user:
                os.environ['KERNEL_USERNAME'] = self.gateway_config.http_user

            # Env whitelist not used here - so only include KERNEL_
            kernel_env = {k: v for (k, v) in dict(os.environ).items() if k.startswith('KERNEL_')}

            # Add any env entries in this request
            kernel_env.update(kwargs.get('env'))

            # Convey the full path to where this notebook file is located.
            if kwargs.get('cwd') is not None and kernel_env.get('KERNEL_WORKING_DIR') is None:
                kernel_env['KERNEL_WORKING_DIR'] = kwargs['cwd']

            kernel_env['KERNEL_LAUNCH_TIMEOUT'] = str(self.gateway_config.kernel_launch_timeout)

            json_body = json_encode({'name': kernel_name, 'env': kernel_env})

            response = await self.gateway_config.gateway_request(kernel_url, method='POST', body=json_body)
            self.kernel = json_decode(response.body)
            self.kernel_id = self.kernel['id']
            self.log.info("HTTPKernelManager started kernel: {}, args: {}".format(self.kernel_id, kwargs))
        else:
            self.kernel = await self.get_kernel(kernel_id)
            self.kernel_id = self.kernel['id']
            self.log.info("HTTPKernelManager using existing kernel: {}".format(self.kernel_id))

    async def shutdown_kernel(self, now=False, restart=False):
        """Attempts to stop the kernel process cleanly via HTTP. """

        if self.has_kernel:
            kernel_url = self._get_kernel_endpoint_url(self.kernel_id)
            self.log.debug("Request shutdown kernel at: %s", kernel_url)
            response = await self.gateway_config.gateway_request(kernel_url, method='DELETE')
            self.log.debug("Shutdown kernel response: %d %s", response.code, response.reason)

    async def restart_kernel(self, **kw):
        """Restarts a kernel via HTTP.  """
        if self.has_kernel:
            kernel_url = self._get_kernel_endpoint_url(self.kernel_id) + '/restart'
            self.log.debug("Request restart kernel at: %s", kernel_url)
            response = await self.gateway_config.gateway_request(kernel_url, method='POST', body=json_encode({}))
            self.log.debug("Restart kernel response: %d %s", response.code, response.reason)

    async def interrupt_kernel(self):
        """Interrupts the kernel via an HTTP request. """
        if self.has_kernel:
            kernel_url = self._get_kernel_endpoint_url(self.kernel_id) + '/interrupt'
            self.log.debug("Request interrupt kernel at: %s", kernel_url)
            response = await self.gateway_config.gateway_request(kernel_url, method='POST', body=json_encode({}))
            self.log.debug("Interrupt kernel response: %d %s", response.code, response.reason)

    async def is_alive(self):
        """Is the kernel process still running?"""
        if self.has_kernel:
            # Go ahead and issue a request to get the kernel
            self.kernel = await self.get_kernel(self.kernel_id)
            return True
        else:  # we don't have a kernel
            return False

    def cleanup_resources(self, restart=False):
        """Clean up resources when the kernel is shut down"""
        pass


KernelManagerABC.register(HTTPKernelManager)


class ChannelQueue(Queue):

    channel_name: str = None

    def __init__(self, channel_name: str, channel_socket: websocket.WebSocket, log: Logger):
        super().__init__()
        self.channel_name = channel_name
        self.channel_socket = channel_socket
        self.log = log

    async def get_msg(self, *args, **kwargs) -> dict:
        timeout = kwargs.get('timeout', 1)
        msg = self.get(timeout=timeout)
        self.log.debug("Received message on channel: {}, msg_id: {}, msg_type: {}".
                       format(self.channel_name, msg['msg_id'], msg['msg_type'] if msg else 'null'))
        self.task_done()
        return msg

    def send(self, msg: dict) -> None:
        message = json.dumps(msg, default=ChannelQueue.serialize_datetime).replace("</", "<\\/")
        self.log.debug("Sending message on channel: {}, msg_id: {}, msg_type: {}".
                       format(self.channel_name, msg['msg_id'], msg['msg_type'] if msg else 'null'))
        self.channel_socket.send(message)

    @staticmethod
    def serialize_datetime(dt):
        if isinstance(dt, (datetime.date, datetime.datetime)):
            return dt.timestamp()

    def start(self) -> None:
        pass

    def stop(self) -> None:
        if not self.empty():
            # If unprocessed messages are detected, drain the queue collecting non-status
            # messages.  If any remain that are not 'shutdown_reply' and this is not iopub
            # go ahead and issue a warning.
            msgs = []
            while self.qsize():
                msg = self.get_nowait()
                if msg['msg_type'] != 'status':
                    msgs.append(msg['msg_type'])
            if self.channel_name == 'iopub' and 'shutdown_reply' in msgs:
                return
            if len(msgs):
                self.log.warning("Stopping channel '{}' with {} unprocessed non-status messages: {}.".
                                 format(self.channel_name, len(msgs), msgs))

    def is_alive(self) -> bool:
        return self.channel_socket is not None


class HBChannelQueue(ChannelQueue):

    def is_beating(self) -> bool:
        # Just use the is_alive status for now
        return self.is_alive()


class HTTPKernelClient(AsyncKernelClient):
    """Communicates with a single kernel indirectly via a websocket to a gateway server.

    There are five channels associated with each kernel:

    * shell: for request/reply calls to the kernel.
    * iopub: for the kernel to publish results to frontends.
    * hb: for monitoring the kernel's heartbeat.
    * stdin: for frontends to reply to raw_input calls in the kernel.
    * control: for kernel management calls to the kernel.

    The messages that can be sent on these channels are exposed as methods of the
    client (KernelClient.execute, complete, history, etc.). These methods only
    send the message, they don't wait for a reply. To get results, use e.g.
    :meth:`get_shell_msg` to fetch messages from the shell channel.
    """

    # flag for whether execute requests should be allowed to call raw_input:
    allow_stdin = False
    _channels_stopped = False
    _channel_queues = {}

    def __init__(self, **kwargs):
        super(HTTPKernelClient, self).__init__(**kwargs)
        self.kernel_id = kwargs['kernel_id']
        self.channel_socket = None
        self.response_router = None
        self.gateway_config = GatewayConfig.instance()

    # --------------------------------------------------------------------------
    # Channel management methods
    # --------------------------------------------------------------------------

    async def start_channels(self, shell=True, iopub=True, stdin=True, hb=True, control=True):
        """Starts the channels for this kernel.

        For this class, we establish a websocket connection to the destination
        and setup the channel-based queues on which applicable messages will
        be posted.
        """

        ws_url = url_path_join(self.gateway_config.ws_url, self.gateway_config.kernels_endpoint,
                               url_escape(self.kernel_id), 'channels')
        # Gather cert info in case where ssl is desired...
        ssl_options = dict()
        ssl_options['ca_certs'] = self.gateway_config.ca_certs
        ssl_options['certfile'] = self.gateway_config.client_cert
        ssl_options['keyfile'] = self.gateway_config.client_key

        self.channel_socket = websocket.create_connection(ws_url,
                                                          timeout=self.gateway_config.connect_timeout,
                                                          enable_multithread=True,
                                                          sslopt=ssl_options)
        self.response_router = Thread(target=self._route_responses)
        self.response_router.start()

        await maybe_future(super().start_channels(shell=shell, iopub=iopub, stdin=stdin, hb=hb, control=control))

    def stop_channels(self):
        """Stops all the running channels for this kernel.

        For this class, we close the websocket connection and destroy the
        channel-based queues.
        """
        super().stop_channels()
        self._channels_stopped = True
        self.log.debug("Closing websocket connection")

        self.channel_socket.close()
        self.response_router.join()

        if self._channel_queues:
            self._channel_queues.clear()
            self._channel_queues = None

    # Channels are implemented via a ChannelQueue that is used to send and receive messages

    @property
    def shell_channel(self):
        """Get the shell channel object for this kernel."""
        if self._shell_channel is None:
            self.log.debug("creating shell channel queue")
            self._shell_channel = ChannelQueue('shell', self.channel_socket, self.log)
            self._channel_queues['shell'] = self._shell_channel
        return self._shell_channel

    @property
    def iopub_channel(self):
        """Get the iopub channel object for this kernel."""
        if self._iopub_channel is None:
            self.log.debug("creating iopub channel queue")
            self._iopub_channel = ChannelQueue('iopub', self.channel_socket, self.log)
            self._channel_queues['iopub'] = self._iopub_channel
        return self._iopub_channel

    @property
    def stdin_channel(self):
        """Get the stdin channel object for this kernel."""
        if self._stdin_channel is None:
            self.log.debug("creating stdin channel queue")
            self._stdin_channel = ChannelQueue('stdin', self.channel_socket, self.log)
            self._channel_queues['stdin'] = self._stdin_channel
        return self._stdin_channel

    @property
    def hb_channel(self):
        """Get the hb channel object for this kernel."""
        if self._hb_channel is None:
            self.log.debug("creating hb channel queue")
            self._hb_channel = HBChannelQueue('hb', self.channel_socket, self.log)
            self._channel_queues['hb'] = self._hb_channel
        return self._hb_channel

    @property
    def control_channel(self):
        """Get the control channel object for this kernel."""
        if self._control_channel is None:
            self.log.debug("creating control channel queue")
            self._control_channel = ChannelQueue('control', self.channel_socket, self.log)
            self._channel_queues['control'] = self._control_channel
        return self._control_channel

    def _route_responses(self):
        """
        Reads responses from the websocket and routes each to the appropriate channel queue based
        on the message's channel.  It does this for the duration of the class's lifetime until the
        channels are stopped, at which time the socket is closed (unblocking the router) and
        the thread terminates.  If shutdown happens to occur while processing a response (unlikely),
        termination takes place via the loop control boolean.
        """
        try:
            while not self._channels_stopped:
                raw_message = self.channel_socket.recv()
                if not raw_message:
                    break
                response_message = json_decode(utf8(raw_message))
                channel = response_message['channel']
                self._channel_queues[channel].put_nowait(response_message)

        except websocket.WebSocketConnectionClosedException:
            pass  # websocket closure most likely due to shutdown

        except BaseException as be:
            if not self._channels_stopped:
                self.log.warning('Unexpected exception encountered ({})'.format(be))

        self.log.debug('Response router thread exiting...')


# Helper functions copied from notebook/utils.py to remove dependency

def url_path_join(*pieces):
    """Join components of url into a relative url

    Use to prevent double slash when joining subpath. This will leave the
    initial and final / in place
    """
    initial = pieces[0].startswith('/')
    final = pieces[-1].endswith('/')
    stripped = [s.strip('/') for s in pieces]
    result = '/'.join(s for s in stripped if s)
    if initial:
        result = '/' + result
    if final:
        result = result + '/'
    if result == '//':
        result = '/'
    return result


def maybe_future(obj):
    """Like tornado's deprecated gen.maybe_future

    but more compatible with asyncio for recent versions
    of tornado
    """
    if inspect.isawaitable(obj):
        return asyncio.ensure_future(obj)
    elif isinstance(obj, concurrent.futures.Future):
        return asyncio.wrap_future(obj)
    else:
        # not awaitable, wrap scalar in future
        f = asyncio.Future()
        f.set_result(obj)
        return f


KernelClientABC.register(HTTPKernelClient)
