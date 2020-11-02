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
"""KernelManager class to manage a kernel running on a Gateway Server via the REST API"""

import datetime
import json
import os
import websocket

from jupyter_client.asynchronous.client import AsyncKernelClient
from jupyter_client.clientabc import KernelClientABC
from jupyter_client.manager import AsyncKernelManager
from jupyter_client.managerabc import KernelManagerABC
from logging import Logger
from notebook.gateway.managers import GatewayClient, gateway_request
from notebook.utils import url_path_join, maybe_future
from queue import Queue
from threading import Thread
from tornado import web
from tornado.escape import json_encode, json_decode, url_escape, utf8
from traitlets import DottedObjectName, Type


class HTTPKernelManager(AsyncKernelManager):
    """Manages a single kernel remotely via a Gateway Server. """

    kernel_id = None
    kernel = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_endpoint = url_path_join(GatewayClient.instance().url, GatewayClient.instance().kernels_endpoint)
        self.kernel = None

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
            response = await gateway_request(kernel_url, method='GET')
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
        kernel_id = kwargs.get('kernel_id')

        if kernel_id is None:
            kernel_name = kwargs.get('kernel_name', 'python3')
            kernel_url = self._get_kernel_endpoint_url()
            self.log.debug("Request new kernel at: %s" % kernel_url)

            # Let KERNEL_USERNAME take precedent over http_user config option.
            if os.environ.get('KERNEL_USERNAME') is None and GatewayClient.instance().http_user:
                os.environ['KERNEL_USERNAME'] = GatewayClient.instance().http_user

            kernel_env = {k: v for (k, v) in dict(os.environ).items() if k.startswith('KERNEL_') or
                          k in GatewayClient.instance().env_whitelist.split(",")}

            # Add any env entries in this request
            kernel_env.update(kwargs.get('env'))

            # Convey the full path to where this notebook file is located.
            if kwargs.get('cwd') is not None and kernel_env.get('KERNEL_WORKING_DIR') is None:
                kernel_env['KERNEL_WORKING_DIR'] = kwargs['cwd']

            json_body = json_encode({'name': kernel_name, 'env': kernel_env})

            response = await gateway_request(kernel_url, method='POST', body=json_body)
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
            response = await gateway_request(kernel_url, method='DELETE')
            self.log.debug("Shutdown kernel response: %d %s", response.code, response.reason)

    async def restart_kernel(self, **kw):
        """Restarts a kernel via HTTP.  """
        if self.has_kernel:
            kernel_url = self._get_kernel_endpoint_url(self.kernel_id) + '/restart'
            self.log.debug("Request restart kernel at: %s", kernel_url)
            response = await gateway_request(kernel_url, method='POST', body=json_encode({}))
            self.log.debug("Restart kernel response: %d %s", response.code, response.reason)

    async def interrupt_kernel(self):
        """Interrupts the kernel via an HTTP request. """
        if self.has_kernel:
            kernel_url = self._get_kernel_endpoint_url(self.kernel_id) + '/interrupt'
            self.log.debug("Request interrupt kernel at: %s", kernel_url)
            response = await gateway_request(kernel_url, method='POST', body=json_encode({}))
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

    # --------------------------------------------------------------------------
    # Channel management methods
    # --------------------------------------------------------------------------

    async def start_channels(self, shell=True, iopub=True, stdin=True, hb=True, control=True):
        """Starts the channels for this kernel.

        For this class, we establish a websocket connection to the destination
        and setup the channel-based queues on which applicable messages will
        be posted.
        """

        ws_url = url_path_join(
            GatewayClient.instance().ws_url,
            GatewayClient.instance().kernels_endpoint, url_escape(self.kernel_id), 'channels')
        # Gather cert info in case where ssl is desired...
        ssl_options = dict()
        ssl_options['ca_certs'] = GatewayClient.instance().ca_certs
        ssl_options['certfile'] = GatewayClient.instance().client_cert
        ssl_options['keyfile'] = GatewayClient.instance().client_key

        self.channel_socket = websocket.create_connection(ws_url,
                                                          timeout=GatewayClient.instance().KERNEL_LAUNCH_TIMEOUT,
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


KernelClientABC.register(HTTPKernelClient)
