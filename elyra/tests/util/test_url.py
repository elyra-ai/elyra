#
# Copyright 2018-2023 Elyra Authors
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
import os
from pathlib import Path

import pytest
from requests import session

from elyra.util.url import FileTransportAdapter
from elyra.util.url import get_verify_parm


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


@pytest.fixture
def setup_env_vars():
    # runs before test (save the value of environment variable
    # TRUSTED_CA_BUNDLE_PATH to avoid any contamination by tests
    # that modify it)
    current_TRUSTED_CA_BUNDLE_PATH_value = os.environ.get("TRUSTED_CA_BUNDLE_PATH")
    yield
    # runs after test (restore the value of environment variable
    # TRUSTED_CA_BUNDLE_PATH, if it was defined)
    if current_TRUSTED_CA_BUNDLE_PATH_value is not None:
        os.environ["TRUSTED_CA_BUNDLE_PATH"] = current_TRUSTED_CA_BUNDLE_PATH_value


@pytest.mark.usefixtures("setup_env_vars")
def test_valid_get_verify_parm():
    """
    Verify that method get_verify_parm works as expected:
     - env variable TRUSTED_CA_BUNDLE_PATH is defined
     - env variable TRUSTED_CA_BUNDLE_PATH is not defined, but a default is specified
     - env variable TRUSTED_CA_BUNDLE_PATH is not defined and no default is specified
    """
    test_TRUSTED_CA_BUNDLE_PATH_value = "/path/to/cert/bundle"
    os.environ["TRUSTED_CA_BUNDLE_PATH"] = test_TRUSTED_CA_BUNDLE_PATH_value
    assert get_verify_parm() == test_TRUSTED_CA_BUNDLE_PATH_value
    del os.environ["TRUSTED_CA_BUNDLE_PATH"]
    # set explicit default
    assert get_verify_parm(False) is False
    # set explicit default
    assert get_verify_parm(True) is True
    # use implicit default
    assert get_verify_parm() is True


@pytest.mark.usefixtures("setup_env_vars")
def test_invalid_get_verify_parm():
    """
    Verify that method get_verify_parm works as if environment variable
    TRUSTED_CA_BUNDLE_PATH contains an invalid value
    """
    test_TRUSTED_CA_BUNDLE_PATH_value = ""
    os.environ["TRUSTED_CA_BUNDLE_PATH"] = test_TRUSTED_CA_BUNDLE_PATH_value
    assert get_verify_parm() is True

    test_TRUSTED_CA_BUNDLE_PATH_value = "   "
    os.environ["TRUSTED_CA_BUNDLE_PATH"] = test_TRUSTED_CA_BUNDLE_PATH_value
    assert get_verify_parm() is True
