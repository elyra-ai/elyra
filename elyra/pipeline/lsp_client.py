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
import json
import subprocess
import threading

class ReadPipe(threading.Thread):
    def __init__(self, pipe):
        threading.Thread.__init__(self)
        self.pipe = pipe
        self.done = False
        self.res = None

    def run(self):
        message_size = None
        while True:
            line = self.pipe.readline()
            # if not line:
            #     return
            line = line.decode("utf-8")
            
            line = line[:-len("\r\n")]
            if line == "":
                break

            
            if line.startswith("Content-Length: "):
                line = line[len("Content-Length: "):]
                message_size = int(line)
  
        jsonrpc_res = self.pipe.read(message_size).decode("utf-8")
        self.done = True
        self.res = json.loads(jsonrpc_res)



def doThings(content):
    with subprocess.Popen("elyra-pipeline-lsp", stdin=subprocess.PIPE, stdout=subprocess.PIPE) as lsp:
        read_pipe = ReadPipe(lsp.stdout)
        read_pipe.start()
        
        msg = json.dumps({
            "jsonrpc": "2.0",
            "id": 0,
            "method": "initialize",
            "params": {}
        })
        lsp.stdin.write(f"Content-Length: {len(msg)}\r\n\r\n{msg}".encode())
        lsp.stdin.flush()

        while not read_pipe.done:
            pass

        msg = json.dumps({
            "jsonrpc": "2.0",
            "method": "initialized",
            "params": {}
        })
        lsp.stdin.write(f"Content-Length: {len(msg)}\r\n\r\n{msg}".encode())
        lsp.stdin.flush()

        read_pipe = ReadPipe(lsp.stdout)
        read_pipe.start()

        msg = json.dumps({
            "jsonrpc": "2.0",
            "method": "textDocument/didOpen",
            "params": {
                "textDocument": {
                    "text": content
                }
            }
        })
        lsp.stdin.write(f"Content-Length: {len(msg)}\r\n\r\n{msg}".encode())
        lsp.stdin.flush()

        while not read_pipe.done:
            pass

        return read_pipe.res
