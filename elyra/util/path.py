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

"""Path utilities"""

import os


def get_absolute_path(root_dir: str, path: str) -> str:
    """Checks if path is absolute or not.  If not absolute, `path` is appended to `root_dir`. """

    absolute_path = path
    if not os.path.isabs(path):
        absolute_path = os.path.join(root_dir, path)

    return absolute_path


def get_expanded_path(root_dir: str = None) -> str:
    # Since root_dir may contain '~' for user home, use expanduser()
    return os.path.expanduser(root_dir or os.getcwd())
