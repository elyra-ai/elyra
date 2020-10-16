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
# TODO - gateway or straight socket?
# import time
import websocket

from jupyter_client.asynchronous.client import AsyncKernelClient
from jupyter_client.client import validate_string_dict
from jupyter_client.clientabc import KernelClientABC
from jupyter_client.channels import major_protocol_version
from jupyter_client.manager import KernelManager
from jupyter_client.managerabc import KernelManagerABC
from logging import Logger
# TODO - gateway or straight socket?
#  from notebook.gateway.handlers import GatewayWebSocketClient
from notebook.gateway.managers import GatewayClient, gateway_request
from notebook.utils import url_path_join, to_os_path
from queue import Queue
from threading import Thread
from tornado import gen, web
from tornado.escape import json_encode, json_decode, url_escape, utf8
from traitlets import DottedObjectName


class HTTPKernelManager(KernelManager):
    """Manages a single kernel remotely via a Gateway Server. """

    kernel_id = None
    kernel = None

    def __init__(self, **kwargs):
        # super(HTTPKernelManager, self).__init__(**kwargs)
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

    """Manages kernels in an asynchronous manner """

    client_class = DottedObjectName('elyra.pipeline.http_kernel_manager.HTTPKernelClient')

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
                self.log.warn("Kernel not found at: %s" % kernel_url)
                kernel = None
            else:
                raise
        else:
            kernel = json_decode(response.body)
        self.log.debug("Kernel retrieved: %s" % kernel)
        raise gen.Return(kernel)

    def cwd_for_path(self, path):
        """Turn API path into absolute OS path."""
        os_path = to_os_path(path, self.root_dir)
        # in the case of notebooks and kernels not being on the same filesystem,
        # walk up to root_dir if the paths don't exist
        while not os.path.isdir(os_path) and os_path != self.root_dir:
            os_path = os.path.dirname(os_path)
        return os_path
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
            self.log.info("Gateway Kernel started: %s" % self.kernel_id)
            self.log.debug("Kernel args: %r" % kwargs)
        else:
            self.kernel = await self.get_kernel(kernel_id)
            self.kernel_id = self.kernel['id']
            self.log.info("Using existing kernel: %s" % self.kernel_id)

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
            response = yield gateway_request(kernel_url, method='POST', body=json_encode({}))
            self.log.debug("Restart kernel response: %d %s", response.code, response.reason)

    async def interrupt_kernel(self):
        """Interrupts the kernel via an HTTP request. """
        if self.has_kernel:
            kernel_url = self._get_kernel_endpoint_url(self.kernel_id) + '/interrupt'
            self.log.debug("Request interrupt kernel at: %s", kernel_url)
            response = await gateway_request(kernel_url, method='POST', body=json_encode({}))
            self.log.debug("Interrupt kernel response: %d %s", response.code, response.reason)

    def is_alive(self):
        """Is the kernel process still running?"""
        if self.has_kernel:
            return True  # FIXME - call get kernel here?
        else:
            # we don't have a kernel
            return False

    def cleanup_resources(self, restart=False):
        """Clean up resources when the kernel is shut down"""
        pass


KernelManagerABC.register(HTTPKernelManager)


class ChannelQueue(Queue):

    channel_name: str = None

    # TODO - gateway or straight socket?
    # def __init__(self, channel_name: str, gateway: GatewayWebSocketClient, log: Logger):
    def __init__(self, channel_name: str, kernel_socket: websocket, log: Logger):
        super().__init__()
        self.channel_name = channel_name
        self.kernel_socket = kernel_socket
        self.log = log

    async def get_msg(self, *args, **kwargs) -> dict:
        timeout = kwargs.get('timeout', 1)
        self.log.debug("Getting response for channel: {} with timeout: {}".format(self.channel_name, timeout))
        msg = self.get(timeout=timeout)
        self.log.debug("Got response for channel: {}, msg_id: {}, msg_type: {}".
                       format(self.channel_name, msg['msg_id'], msg['msg_type'] if msg else 'null'))
        return msg

    def send(self, msg: dict) -> None:
        message = json.dumps(msg, default=self.serialize_datetime).replace("</", "<\\/")
        # TODO - gateway or straight socket?
        # self.gateway.on_message(json_encode(message))
        self.kernel_socket.send(message)

    def serialize_datetime(self, dt):
        if isinstance(dt, (datetime.date, datetime.datetime)):
            return dt.timestamp()

    def start(self) -> None:
        pass

    def stop(self) -> None:
        pass

    def is_alive(self) -> bool:
        return True  # FIXME


class HBChannelQueue(ChannelQueue):

    def __init__(self, *args):
        super().__init__(*args)

    def is_beating(self) -> bool:
        return True  # FIXME


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

    _channel_queues = {}

    def __init__(self, **kwargs):
        super(HTTPKernelClient, self).__init__(**kwargs)
        # TODO - gateway or straight socket?
        # self.gateway = GatewayWebSocketClient(gateway_url=GatewayClient.instance().url)
        self.kernel_id = kwargs['kernel_id']
        self.kernel_socket = None

    # --------------------------------------------------------------------------
    # Channel proxy methods
    # --------------------------------------------------------------------------
    def get_shell_msg(self, *args, **kwargs):
        """Get a message from the shell channel"""
        return self.shell_channel.get_msg(*args, **kwargs)

    def get_iopub_msg(self, *args, **kwargs):
        """Get a message from the iopub channel"""
        return self.iopub_channel.get_msg(*args, **kwargs)

    def get_stdin_msg(self, *args, **kwargs):
        """Get a message from the stdin channel"""
        return self.stdin_channel.get_msg(*args, **kwargs)

    def get_control_msg(self, *args, **kwargs):
        """Get a message from the control channel"""
        return self.control_channel.get_msg(*args, **kwargs)

    # TODO - gateway or straight socket?
    def route_messages(self, message, binary=False):
        """Routes messages to appropriate channel queue"""

        channel = message['channel']
        self._channel_queues[channel].put_nowait(message)

    # --------------------------------------------------------------------------
    # Channel management methods
    # --------------------------------------------------------------------------

    def start_channels(self, shell=True, iopub=True, stdin=True, hb=True, control=True):
        """Starts the channels for this kernel.

        For this class, we establish a websocket connection to the destination
        and setup the channel-based queues on which applicable messages will
        be posted.
        """
        # TODO - gateway or straight socket?
        # self.gateway.on_open(kernel_id=self.kernel_id, message_callback=self.route_messages)
        ws_url = url_path_join(
            GatewayClient.instance().ws_url,
            GatewayClient.instance().kernels_endpoint, url_escape(self.kernel_id), 'channels'
        )
        self.kernel_socket = \
            websocket.create_connection(ws_url, timeout=60, enable_multithread=True)

        self.response_reader = Thread(target=self._read_responses)
        self.response_reader.start()

        if shell:
            self.shell_channel.start()
            self.kernel_info()
        if iopub:
            self.iopub_channel.start()
        if stdin:
            self.stdin_channel.start()
            self.allow_stdin = True
        else:
            self.allow_stdin = False
        if hb:
            self.hb_channel.start()
        if control:
            self.control_channel.start()

    def stop_channels(self):
        """Stops all the running channels for this kernel.

        For this class, we close the websocket connection and destroy the
        channel-based queues.
        """
        if self.shell_channel.is_alive():
            self.shell_channel.stop()
        if self.iopub_channel.is_alive():
            self.iopub_channel.stop()
        if self.stdin_channel.is_alive():
            self.stdin_channel.stop()
        if self.hb_channel.is_alive():
            self.hb_channel.stop()
        if self.control_channel.is_alive():
            self.control_channel.stop()

        self.log.debug("Closing websocket connection")
        # self.gateway.on_close()  # TODO - gateway or straight socket?
        self.kernel_socket.close()

        if self._channel_queues:
            self._channel_queues.clear()
            self._channel_queues = None

    @property
    def channels_running(self):
        """Are any of the channels created and running?"""
        return (self.shell_channel.is_alive() or self.iopub_channel.is_alive() or
                self.stdin_channel.is_alive() or self.hb_channel.is_alive() or
                self.control_channel.is_alive())

    ioloop = None  # Overridden in subclasses that use pyzmq event loop

    @property
    def shell_channel(self):
        """Get the shell channel object for this kernel."""
        if self._shell_channel is None:
            self.log.debug("creating shell channel queue")
            self._shell_channel = ChannelQueue('shell', self.kernel_socket, self.log)
            self._channel_queues['shell'] = self._shell_channel
        return self._shell_channel

    @property
    def iopub_channel(self):
        """Get the iopub channel object for this kernel."""
        if self._iopub_channel is None:
            self.log.debug("creating iopub channel queue")
            self._iopub_channel = ChannelQueue('iopub', self.kernel_socket, self.log)
            self._channel_queues['iopub'] = self._iopub_channel
        return self._iopub_channel

    @property
    def stdin_channel(self):
        """Get the stdin channel object for this kernel."""
        if self._stdin_channel is None:
            self.log.debug("creating stdin channel queue")
            self._stdin_channel = ChannelQueue('stdin', self.kernel_socket, self.log)
            self._channel_queues['stdin'] = self._stdin_channel
        return self._stdin_channel

    @property
    def hb_channel(self):
        """Get the hb channel object for this kernel."""
        if self._hb_channel is None:
            self.log.debug("creating hb channel queue")
            self._hb_channel = HBChannelQueue('hb', self.kernel_socket, self.log)
            self._channel_queues['hb'] = self._hb_channel
        return self._hb_channel

    @property
    def control_channel(self):
        """Get the control channel object for this kernel."""
        if self._control_channel is None:
            self.log.debug("creating control channel queue")
            self._control_channel = ChannelQueue('control', self.kernel_socket, self.log)
            self._channel_queues['control'] = self._control_channel
        return self._control_channel

    async def is_alive(self):
        """Is the kernel process still running?"""
        if isinstance(self.parent, KernelManager):
            # This KernelClient was created by a KernelManager,
            # we can ask the parent KernelManager:
            return self.parent.is_alive()
        if self._hb_channel is not None:
            # We don't have access to the KernelManager,
            # so we use the heartbeat.
            return self._hb_channel.is_beating()
        else:
            # no heartbeat and not local, we can't tell if it's running,
            # so naively return True
            return True

    # Methods to send specific messages on channels
    def execute(self, code, silent=False, store_history=True,
                user_expressions=None, allow_stdin=None, stop_on_error=True):
        """Execute code in the kernel.

        Parameters
        ----------
        code : str
            A string of code in the kernel's language.

        silent : bool, optional (default False)
            If set, the kernel will execute the code as quietly possible, and
            will force store_history to be False.

        store_history : bool, optional (default True)
            If set, the kernel will store command history.  This is forced
            to be False if silent is True.

        user_expressions : dict, optional
            A dict mapping names to expressions to be evaluated in the user's
            dict. The expression values are returned as strings formatted using
            :func:`repr`.

        allow_stdin : bool, optional (default self.allow_stdin)
            Flag for whether the kernel can send stdin requests to frontends.

            Some frontends (e.g. the Notebook) do not support stdin requests.
            If raw_input is called from code executed from such a frontend, a
            StdinNotImplementedError will be raised.

        stop_on_error: bool, optional (default True)
            Flag whether to abort the execution queue, if an exception is encountered.

        Returns
        -------
        The msg_id of the message sent.
        """
        if user_expressions is None:
            user_expressions = {}
        if allow_stdin is None:
            allow_stdin = self.allow_stdin

        # Don't waste network traffic if inputs are invalid
        if not isinstance(code, str):
            raise ValueError('code %r must be a string' % code)
        validate_string_dict(user_expressions)

        # Create class for content/msg creation. Related to, but possibly
        # not in Session.
        content = dict(code=code, silent=silent, store_history=store_history,
                       user_expressions=user_expressions,
                       allow_stdin=allow_stdin, stop_on_error=stop_on_error
                       )
        msg = self.session.msg('execute_request', content)
        self.shell_channel.send(msg)
        return msg['header']['msg_id']

    def complete(self, code, cursor_pos=None):
        """Tab complete text in the kernel's namespace.

        Parameters
        ----------
        code : str
            The context in which completion is requested.
            Can be anything between a variable name and an entire cell.
        cursor_pos : int, optional
            The position of the cursor in the block of code where the completion was requested.
            Default: ``len(code)``

        Returns
        -------
        The msg_id of the message sent.
        """
        if cursor_pos is None:
            cursor_pos = len(code)
        content = dict(code=code, cursor_pos=cursor_pos)
        msg = self.session.msg('complete_request', content)
        self.shell_channel.send(msg)
        return msg['header']['msg_id']

    def inspect(self, code, cursor_pos=None, detail_level=0):
        """Get metadata information about an object in the kernel's namespace.

        It is up to the kernel to determine the appropriate object to inspect.

        Parameters
        ----------
        code : str
            The context in which info is requested.
            Can be anything between a variable name and an entire cell.
        cursor_pos : int, optional
            The position of the cursor in the block of code where the info was requested.
            Default: ``len(code)``
        detail_level : int, optional
            The level of detail for the introspection (0-2)

        Returns
        -------
        The msg_id of the message sent.
        """
        if cursor_pos is None:
            cursor_pos = len(code)
        content = dict(code=code, cursor_pos=cursor_pos, detail_level=detail_level, )
        msg = self.session.msg('inspect_request', content)
        self.shell_channel.send(msg)
        return msg['header']['msg_id']

    def history(self, raw=True, output=False, hist_access_type='range', **kwargs):
        """Get entries from the kernel's history list.

        Parameters
        ----------
        raw : bool
            If True, return the raw input.
        output : bool
            If True, then return the output as well.
        hist_access_type : str
            'range' (fill in session, start and stop params), 'tail' (fill in n)
             or 'search' (fill in pattern param).

        session : int
            For a range request, the session from which to get lines. Session
            numbers are positive integers; negative ones count back from the
            current session.
        start : int
            The first line number of a history range.
        stop : int
            The final (excluded) line number of a history range.

        n : int
            The number of lines of history to get for a tail request.

        pattern : str
            The glob-syntax pattern for a search request.

        Returns
        -------
        The ID of the message sent.
        """
        if hist_access_type == 'range':
            kwargs.setdefault('session', 0)
            kwargs.setdefault('start', 0)
        content = dict(raw=raw, output=output, hist_access_type=hist_access_type, **kwargs)
        msg = self.session.msg('history_request', content)
        self.shell_channel.send(msg)
        return msg['header']['msg_id']

    def kernel_info(self):
        """Request kernel info

        Returns
        -------
        The msg_id of the message sent
        """
        msg = self.session.msg('kernel_info_request')
        self.shell_channel.send(msg)
        return msg['header']['msg_id']

    def comm_info(self, target_name=None):
        """Request comm info

        Returns
        -------
        The msg_id of the message sent
        """
        if target_name is None:
            content = {}
        else:
            content = dict(target_name=target_name)
        msg = self.session.msg('comm_info_request', content)
        self.shell_channel.send(msg)
        return msg['header']['msg_id']

    def _handle_kernel_info_reply(self, msg):
        """handle kernel info reply

        sets protocol adaptation version. This might
        be run from a separate thread.
        """
        adapt_version = int(msg['content']['protocol_version'].split('.')[0])
        if adapt_version != major_protocol_version:
            self.session.adapt_version = adapt_version

    def is_complete(self, code):
        """Ask the kernel whether some code is complete and ready to execute."""
        msg = self.session.msg('is_complete_request', {'code': code})
        self.shell_channel.send(msg)
        return msg['header']['msg_id']

    def input(self, string):
        """Send a string of raw input to the kernel.

        This should only be called in response to the kernel sending an
        ``input_request`` message on the stdin channel.
        """
        content = dict(value=string)
        msg = self.session.msg('input_reply', content)
        self.stdin_channel.send(msg)

    def shutdown(self, restart=False):
        """Request an immediate kernel shutdown on the control channel.

        Upon receipt of the (empty) reply, client code can safely assume that
        the kernel has shut down and it's safe to forcefully terminate it if
        it's still alive.

        The kernel will send the reply via a function registered with Python's
        atexit module, ensuring it's truly done as the kernel is done with all
        normal operation.

        Returns
        -------
        The msg_id of the message sent
        """
        # Send quit message to kernel. Once we implement kernel-side setattr,
        # this should probably be done that way, but for now this will do.
        msg = self.session.msg('shutdown_request', {'restart': restart})
        self.control_channel.send(msg)
        return msg['header']['msg_id']

    def _read_responses(self):
        """
        Reads responses from the websocket.  For each response read, it is added to the response queue based
        on the messages parent_header.msg_id.  It does this for the duration of the class's lifetime until its
        shutdown method is called, at which time the socket is closed (unblocking the reader) and the thread
        terminates.  If shutdown happens to occur while processing a response (unlikely), termination takes
        place via the loop control boolean.
        """
        try:
            while True:  # not self.shutting_down:
                # try:  TODO - determine need for hooking restarts
                raw_message = self.kernel_socket.recv()
                if not raw_message:
                    break
                response_message = json_decode(utf8(raw_message))

                channel = response_message['channel']
                self._channel_queues[channel].put_nowait(response_message)

                # except BaseException as be1:
                #     if self.restarting:  # If restarting, wait until restart has completed - which includes new socket
                #         i = 1
                #         while self.restarting:
                #             if i >= 10 and i % 2 == 0:
                #                 self.log.debug("Still restarting after {} secs...".format(i))
                #             time.sleep(1)
                #             i += 1
                #         continue
                #     raise be1

        except websocket.WebSocketConnectionClosedException:
            pass  # websocket closure most likely due to shutdown

        except BaseException as be2:
            # if not self.shutting_down:
            self.log.warning('Unexpected exception encountered ({})'.format(be2))

        self.log.debug('Response reader thread exiting...')


KernelClientABC.register(HTTPKernelClient)
