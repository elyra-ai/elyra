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
import time
import json
import subprocess
import threading


class ReadPipe(threading.Thread):
    def __init__(self, pipe):
        threading.Thread.__init__(self)
        self.pipe = pipe
        self.done = False
        self.res = None

    def wait(self):
        start = time.time()
        while not self.done:
            end = time.time()
            if end > start + 3:
                raise TimeoutError()
            pass
        return self.res

    def run(self):
        message_size = None
        while True:
            line = self.pipe.readline()
            line = line.decode("utf-8")
            line = line[:-len("\r\n")]
            if line == "":
                break

            if line.startswith("Content-Length: "):
                line = line[len("Content-Length: "):]
                message_size = int(line)

        jsonrpc_res = self.pipe.read(message_size).decode("utf-8")
        self.res = json.loads(jsonrpc_res)
        self.done = True


class LSPClient:
    def __init__(self):
        self.lsp = subprocess.Popen("pipeline-language-server", stdin=subprocess.PIPE, stdout=subprocess.PIPE)

        read_pipe = ReadPipe(self.lsp.stdout)
        read_pipe.start()

        self._sendMessage({
            "jsonrpc": "2.0",
            "id": 0,
            "method": "initialize",
            "params": {}
        })

        read_pipe.wait()

        self._sendMessage({
            "jsonrpc": "2.0",
            "method": "initialized",
            "params": {}
        })

    def close(self):
        self.lsp.terminate()

    def _sendMessage(self, msg):
        msg = json.dumps(msg)
        self.lsp.stdin.write(f"Content-Length: {len(msg)}\r\n\r\n{msg}".encode())
        self.lsp.stdin.flush()

    def validate(self, content):
        read_pipe = ReadPipe(self.lsp.stdout)
        read_pipe.start()

        self._sendMessage({
            "jsonrpc": "2.0",
            "method": "textDocument/didOpen",
            "params": {
                "textDocument": {
                    "text": content
                }
            }
        })

        return read_pipe.wait()
