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
import pathlib
import shutil
import subprocess
import sys


NODE_LOCATION = (
    shutil.which("node") or
    shutil.which("node.exe") or
    shutil.which("node.cmd")
)
NODE = str(pathlib.Path(NODE_LOCATION).resolve())
PATH_TO_BIN_JS = str(
    (
        pathlib.Path(__file__).parent /
        'node_modules' / 'language-server' / 'dist' /
        'index.js'
    ).resolve()
)


def main():
    p = subprocess.Popen(
        [NODE, PATH_TO_BIN_JS, '--stdio', *sys.argv[1:]],
        stdin=sys.stdin, stdout=sys.stdout
    )
    sys.exit(p.wait())


def load(app):
    return {
        "pipeline-language-server": {
            "version": 2,
            "argv": ['elyra-pipeline-lsp'],
            "languages": ["plain"],
            "mime_types": [
                "text/plain"
            ]
        }
    }


if __name__ == "__main__":
    main()
