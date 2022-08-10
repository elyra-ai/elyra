#
# Copyright 2018-2022 Elyra Authors
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
from pathlib import Path

from requests import session

from elyra.util.url import FileTransportAdapter


def test_valid_file_url():
    """
    Verify that the FileTransportAdapter works as expected for valid input
    """
    requests_session = session()
    requests_session.mount("file://", FileTransportAdapter())

    # utilize the test source code as resource
    this_file = __file__
    url = Path(this_file).as_uri()
    res = requests_session.get(url)
    assert res.status_code == 200, this_file
    with open(this_file, "r") as source:
        assert res.text == source.read()


def test_invalid_file_url():
    """
    Verify that the FileTransportAdapter works as expected for error
    scenarios:
     - requested resource is a directory
     - requested resource not found
     - request method is not 'GET'
    """
    requests_session = session()
    requests_session.mount("file://", FileTransportAdapter())

    # utilize the test source code as resource
    this_file_p = Path(__file__)

    # requested resource is a directory
    url = this_file_p.parent.as_uri()
    res = requests_session.get(url)
    assert res.status_code == 400, url
    assert res.reason == "Not a file"
    assert len(res.text) == 0

    # requested resource wasn't found
    url = this_file_p.resolve().with_name("no-such-file").as_uri()
    res = requests_session.get(url)
    assert res.status_code == 404, url
    assert res.reason == "File not found"
    assert len(res.text) == 0

    # request method is not supported
    url = this_file_p.as_uri()
    unsupported_methods = [
        requests_session.delete,
        requests_session.head,
        requests_session.options,
        requests_session.patch,
        requests_session.post,
        requests_session.put,
    ]
    for unsupported_method in unsupported_methods:
        res = unsupported_method(url)
        assert res.status_code == 405, url
        assert res.reason == "Method not allowed"
