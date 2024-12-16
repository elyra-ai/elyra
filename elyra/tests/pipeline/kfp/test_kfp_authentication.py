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

import pytest

from elyra.pipeline.kfp.kfp_authentication import AuthenticationError
from elyra.pipeline.kfp.kfp_authentication import ExistingBearerTokenAuthenticator
from elyra.pipeline.kfp.kfp_authentication import KFPAuthenticator
from elyra.pipeline.kfp.kfp_authentication import SupportedAuthProviders

# ---------------------------------------------------
# Tests for class KFPAuthenticator
# ---------------------------------------------------


def test_KFPAuthenticator_authenticate_valid_input():
    """
    Verify that authenticate(...) returns the expected results for valid input
    """
    dummy_kfp_endpoint = "https://localhost:8888"
    dummy_runtime_config_name = "bearer_runtime_config"
    dummy_auth_parm_1 = None
    dummy_auth_parm_2 = "sha256~pl3as3l3tm31n"

    # test EXISTING_BEARER_TOKEN invocation
    auth_output = KFPAuthenticator().authenticate(
        api_endpoint=dummy_kfp_endpoint,
        auth_type_str="EXISTING_BEARER_TOKEN",
        runtime_config_name=dummy_runtime_config_name,
        auth_parm_1=dummy_auth_parm_1,
        auth_parm_2=dummy_auth_parm_2,
    )
    assert auth_output.get("api_endpoint") == dummy_kfp_endpoint
    assert auth_output.get("auth_type") == SupportedAuthProviders.EXISTING_BEARER_TOKEN.value
    assert auth_output.get("kf_secured") is True
    assert auth_output.get("cookies") is None
    assert auth_output.get("credentials") is None
    assert auth_output.get("existing_token") == dummy_auth_parm_2


def test_KFPAuthenticator_authenticate_invalid_input():
    """
    Verify that authenticate(...) returns the expected results for an invalid
    authentication type
    """
    dummy_kfp_endpoint = "https://localhost:8888"
    dummy_runtime_config_name = "a_kfp_runtime_config"
    dummy_auth_type_str = "NO_SUCH_AUTH_TYPE"
    dummy_auth_parm_1 = None
    dummy_auth_parm_2 = None

    # authentication type is invalid
    with pytest.raises(AuthenticationError) as exc_error:
        KFPAuthenticator().authenticate(
            api_endpoint=dummy_kfp_endpoint,
            auth_type_str=dummy_auth_type_str,
            runtime_config_name=dummy_runtime_config_name,
            auth_parm_1=dummy_auth_parm_1,
            auth_parm_2=dummy_auth_parm_2,
        )
    assert exc_error.value._provider is None
    assert f"Authentication type '{dummy_auth_type_str}' is not supported." in exc_error.value._message


# ---------------------------------------------------
# Tests for class ExistingBearerTokenAuthenticator
# ---------------------------------------------------


def test_ExistingBearerTokenAuthenticator_authenticate_valid_input():
    """
    Verify that authenticate(...) returns the expected result for input that meets the enforced
    constraints. Note that this test does not actually validate tokens.
    """
    dummy_kfp_endpoint = "https://localhost:8888"
    dummy_runtime_config_name = "bearer_runtime_config"
    dummy_token = "sha256~pl3as3l3tm31n"
    token = ExistingBearerTokenAuthenticator().authenticate(dummy_kfp_endpoint, dummy_runtime_config_name, dummy_token)
    assert token == dummy_token


def test_ExistingBearerTokenAuthenticator_authenticate_invalid_input():
    """
    Verify that authenticate(...) returns the expected result for input that does not
    meet the enforced constraints. Note that this test does not actually validate tokens.
    """
    dummy_kfp_endpoint = "https://localhost:8888"
    dummy_runtime_config_name = "bearer_runtime_config"
    # valid token values are strings that are not None, empty, or comprise of whitespaces only
    for invalid_token in [None, "", "   "]:
        with pytest.raises(AuthenticationError) as exc_error:
            ExistingBearerTokenAuthenticator().authenticate(
                dummy_kfp_endpoint, dummy_runtime_config_name, invalid_token
            )
        assert exc_error.value._provider == SupportedAuthProviders.EXISTING_BEARER_TOKEN
        assert "A token/password is required to perform this type of authentication." in exc_error.value._message
        assert f"Update runtime configuration '{dummy_runtime_config_name}'" in exc_error.value._message
