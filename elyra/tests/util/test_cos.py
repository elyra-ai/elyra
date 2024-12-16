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

from elyra.util.cos import join_paths


def test_join_paths():
    """
    Verify that join_path yields the expected results
    """

    # one or more paths is None
    assert join_paths(None, None) == ""
    assert join_paths("", None) == ""
    assert join_paths(None, "") == ""
    assert join_paths("path", None) == "path"
    assert join_paths("/path", None) == "path"
    assert join_paths("path/", None) == "path"
    assert join_paths("/path/", None) == "path"

    # one or more paths is the empty string
    assert join_paths("", "") == ""
    assert join_paths("path", "") == "path"
    assert join_paths("/path", "") == "path"
    assert join_paths("path/", "") == "path"
    assert join_paths("/path/", "") == "path"
    assert join_paths("", "path") == "path"
    assert join_paths("", "/path") == "path"
    assert join_paths("", "path/") == "path"
    assert join_paths("", "/path/") == "path"

    assert join_paths("path", "path2") == "path/path2"
    assert join_paths("/path", "path2") == "path/path2"
    assert join_paths("path/", "path2") == "path/path2"
    assert join_paths("/path/", "path2") == "path/path2"
    assert join_paths("path", "/path2") == "path/path2"
    assert join_paths("path", "path2/") == "path/path2"
    assert join_paths("path", "/path2/") == "path/path2"
    assert join_paths("/path", "/path2") == "path/path2"
    assert join_paths("/path", "path2/") == "path/path2"
    assert join_paths("/path", "/path2/") == "path/path2"
    assert join_paths("/path/", "/path2") == "path/path2"
    assert join_paths("/path/", "path2/") == "path/path2"
    assert join_paths("/path/", "/path2/") == "path/path2"

    # multiple //
    assert join_paths("//path", "path2") == "path/path2"
    assert join_paths("path//", "path2") == "path/path2"
    assert join_paths("//path//", "path2") == "path/path2"
    assert join_paths("path", "//path2") == "path/path2"
    assert join_paths("path", "path2//") == "path/path2"
    assert join_paths("path", "//path2//") == "path/path2"
    assert join_paths("//path", "//path2") == "path/path2"
    assert join_paths("//path", "path2//") == "path/path2"
    assert join_paths("//path", "//path2//") == "path/path2"
    assert join_paths("//path//", "//path2") == "path/path2"
    assert join_paths("//path//", "path2//") == "path/path2"
    assert join_paths("//path//", "//path2//") == "path/path2"
