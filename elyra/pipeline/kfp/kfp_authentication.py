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

from abc import ABC
from abc import abstractmethod
from enum import Enum
from http import HTTPStatus
import os
import re
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from urllib.parse import urlsplit

from kfp.client import KF_PIPELINES_SA_TOKEN_ENV
from kfp.client import KF_PIPELINES_SA_TOKEN_PATH
from kfp.client import ServiceAccountTokenVolumeCredentials
import requests


def _empty_or_whitespaces_only(a_string: str) -> bool:
    """
    Utility function: evaluates whether a_string is None or contains
    only whitespaces.

    :param a_string: string to be evaluated
    :type: str
    :return: True if a_string is None or contains only whitespaces
    :rtype: Boolean
    """
    if a_string is None or len(a_string.strip()) == 0:
        return True
    return False


class SupportedAuthProviders(Enum):
    """
    List of supported authentication providers that is defined
    in this module. Each entry in this list must be associated
    with an implementation of AbstractAuthenticator.
    """

    # KF is not secured
    # (See NoAuthenticationAuthenticator)
    NO_AUTHENTICATION = "No authentication"
    # KF is secured using KUBERNETES_SERVICE_ACCOUNT_TOKEN
    # (See K8sServiceAccountTokenAuthenticator implementation)
    KUBERNETES_SERVICE_ACCOUNT_TOKEN = "Kubernetes service account token"
    # KF is secured using DEX with static id/password
    # (See StaticPasswordKFPAuthenticator implementation)
    DEX_STATIC_PASSWORDS = "DEX (static passwords)"
    # Supports DEX with LDAP authentication
    # (See DEXLDAPAuthenticator implementation)
    DEX_LDAP = "DEX (LDAP)"
    # Supports multiple authentication mechanisms
    # (See DEXLegacyAuthenticator implementation)
    DEX_LEGACY = "DEX (legacy)"
    # Supports authentication that relies on a static bearer token value
    EXISTING_BEARER_TOKEN = "Token authentication"

    @staticmethod
    def get_default_provider() -> "SupportedAuthProviders":
        """
        Returns the "default" enum member (provider)
        :return: default enum member
        :rtype: str
        """
        return SupportedAuthProviders.NO_AUTHENTICATION

    @staticmethod
    def get_provider_names() -> List[str]:
        """
        Returns all enum member (provider) names
        :return: List of provider names
        :rtype: List[str]
        """
        return list(map(lambda c: c.name, SupportedAuthProviders))

    @staticmethod
    def get_instance_by_name(name: str) -> "SupportedAuthProviders":
        """
        Returns an enumeration member of SupportedAuthProviders
        corresponding to the given name.
        :raises ValueError: name is not a valid enum member name
        :return: An enum member of SupportedAuthProviders
        :rtype: SupportedAuthProviders
        """
        try:
            return SupportedAuthProviders[name]
        except KeyError:
            raise ValueError(f"'{name}' is not a valid {SupportedAuthProviders.__name__}")

    @staticmethod
    def get_instance_by_value(value: str) -> "SupportedAuthProviders":
        """
        Returns an enumeration member of SupportedAuthProviders
        corresponding to the given value.
        :raises ValueError: value is not a valid enum member value
        :return: An enum member of SupportedAuthProviders
        :rtype: SupportedAuthProviders
        """
        return SupportedAuthProviders(value)

    @staticmethod
    def to_dict() -> Dict:
        """
        Convert the enum into a dictionary. Keys are the member
        names (internal authentication type id) and values are
        the associated user-friendly member values.

        :return: dictionary, comprising all members of the enum
        :rtype: Dict
        """
        enum_member_dict = {}
        for member in SupportedAuthProviders:
            enum_member_dict[member.name] = member.value
        return enum_member_dict


class AuthenticationError(Exception):
    """
    Indicates that an error occurred while an authentication request
    was being processed.
    """

    def __init__(
        self,
        message: str,
        provider: Optional[SupportedAuthProviders] = None,
        request_history: Optional[List[Tuple[str, requests.Response]]] = None,
    ):
        """
        Create a new AuthenticationError exception. The throw-er should
        populate the request_history to allow for troubleshooting. List entry key is the (HTTP)
        request URL, the value the response object.

        :param message: a user friendly error message
        :type message: str
        :param provider: if the error is raised by an implementation of AbstractAuthenticator,
         use the value of _type; optional, defaults to None
        :type provider: Optional[SupportedAuthProviders], optional
        :param request_history: , defaults to None
        :type request_history: Optional[List[Dict[str, requests.Response]]], optional
        """
        self._message = message
        self._provider = provider
        self._request_history = request_history

    def get_request_history(self) -> Optional[List[Tuple[str, requests.Response]]]:
        """
        Returns the HTTP request history that led to this exception.

        :return: A list of tuples, comprising HTTP URL and the response object
        :rtype: Optional[List[Tuple[str, requests.Response]]]
        """
        return self._request_history

    def request_history_to_string(self) -> Optional[str]:
        """
        Dump key HTTP request history into a string for logging purposes

        :return: Formatted HTTP request history, which led to the failure.
        :rtype: Optional[str]
        """
        output = None
        for request_entry in self._request_history or []:
            if output is None:
                output = (
                    f"Request URL: {request_entry[0]} "
                    f"HTTP status code: {request_entry[1].status_code} "
                    f"response URL: {request_entry[1].url}"
                )
            else:
                output = (
                    f"{output}\n"
                    f"Request URL: {request_entry[0]} "
                    f"HTTP status code: {request_entry[1].status_code} "
                    f"response URL: {request_entry[1].url}"
                )
        return output


class KFPAuthenticator:
    """
    Use this class to authenticate with Kubeflow Pipelines. The authenticate
    method delegates the actual authentication to an implementation of the
    AbstractAuthenticator class.
    """

    def authenticate(
        self,
        api_endpoint: str,
        auth_type_str: str,
        runtime_config_name: str,
        auth_parm_1: Optional[str] = None,
        auth_parm_2: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Try to authenticate with Kubeflow using the provided information.

        :param api_endpoint: Kubeflow Pipelines endpoint URL, as specified in the runtime configuration
        :type api_endpoint: str
        :param auth_type_str Identifies the authentication type to be performed. If the provided value
         is in the SupportedAuthProviders enum, authentication is performed.
        :type auth_type_str: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified.
        :type runtime_config_name: str
        :param auth_parm_1: First authorization parameter from the runtime config, defaults to None
        :type auth_parm_1: Optional[str], optional
        :param auth_parm_2: Second authorization parameter from the runtime config, defaults to None
        :type auth_parm_2: Optional[str], optional
        :raises AuthenticationError: Authentication failed due to the provided reason.
        :return: A data structure containing information that enables kfp.Client to connect to api_endpoint
        :rtype: Dict[str, str]
        """

        kf_url = urlsplit(api_endpoint)._replace(path="").geturl()

        # return data structure for successful requests
        auth_info = {
            "api_endpoint": kf_url,  # KF API endpoint, source: runtime config
            "auth_type": None,  # Authentication type, source: runtime config
            "kf_secured": False,  # Indicates whether KF API is secured
            "cookies": None,  # passed to KFP SDK client as "cookies" param value
            "credentials": None,  # passed to KFP SDK client as "credentials" param value
            "existing_token": None,  # passed to KFP SDK client as "existing_token" param value
        }

        try:
            auth_type = SupportedAuthProviders.get_instance_by_name(auth_type_str)
            auth_info["auth_type"] = auth_type.value
        except ValueError:
            # the provided authentication type is not supported
            raise AuthenticationError(
                f"Authentication type '{auth_type_str}' is not supported. "
                f"Update runtime configuration '{runtime_config_name}' and try again."
            )

        try:
            # Process the authentication request using the appropriate authenticator
            # implementation. Refer to the class definitions for information how
            # the request is processed

            if auth_type == SupportedAuthProviders.NO_AUTHENTICATION:
                # No authentication is performed. The authenticator returns None
                NoAuthenticationAuthenticator().authenticate(kf_url, runtime_config_name)
            elif auth_type == SupportedAuthProviders.DEX_STATIC_PASSWORDS:
                # static id/password checking; the authenticator returns
                # a cookie value
                auth_info["cookies"] = DEXStaticPasswordAuthenticator().authenticate(
                    kf_url, runtime_config_name, username=auth_parm_1, password=auth_parm_2
                )
                auth_info["kf_secured"] = True
            elif auth_type == SupportedAuthProviders.DEX_LEGACY:
                # see implementation for details; the authenticator returns
                # a cookie value
                auth_info["cookies"] = DEXLegacyAuthenticator().authenticate(
                    kf_url, runtime_config_name, username=auth_parm_1, password=auth_parm_2
                )
                if auth_info.get("cookies") is not None:
                    auth_info["kf_secured"] = True
            elif auth_type == SupportedAuthProviders.DEX_LDAP:
                # DEX/LDAP authentication; the authenticator returns
                # a cookie value
                auth_info["cookies"] = DEXLDAPAuthenticator().authenticate(
                    kf_url, runtime_config_name, username=auth_parm_1, password=auth_parm_2
                )
                if auth_info.get("cookies") is not None:
                    auth_info["kf_secured"] = True
            elif auth_type == SupportedAuthProviders.KUBERNETES_SERVICE_ACCOUNT_TOKEN:
                # see implementation for details; the authenticator returns
                # a ServiceAccountTokenVolumeCredentials
                auth_info["credentials"] = K8sServiceAccountTokenAuthenticator().authenticate(
                    kf_url, runtime_config_name
                )
                auth_info["kf_secured"] = True
            elif auth_type == SupportedAuthProviders.EXISTING_BEARER_TOKEN:
                # the authenticator returns a bearer token
                auth_info["existing_token"] = ExistingBearerTokenAuthenticator().authenticate(
                    kf_url, runtime_config_name, token=auth_parm_2
                )
                auth_info["kf_secured"] = True
            else:
                # SupportedAuthProviders contains a member that is not yet
                # associated with an implementation of AbstractAuthenticator
                raise AuthenticationError(f"Support for authentication type '{auth_type.name}' is not implemented.")
        except AuthenticationError:
            raise
        except Exception as ex:
            raise AuthenticationError(
                f"Authentication using authentication type " f'\'{auth_info["auth_type"]}\' failed: {ex}'
            )

        # sanity check: upon completion auth_info must not contain
        # incomplete or conflicting information
        if auth_info.get("auth_type") is None or (
            auth_info.get("cookies") is not None and auth_info.get("existing_token") is not None
        ):
            raise AuthenticationError(
                "A potential authentication implementation problem was detected. " "Please create an issue."
            )
        return auth_info


class AbstractAuthenticator(ABC):
    """
    Abstract base class for authenticator implementations
    """

    _type = None  # unique authenticator id

    @abstractmethod
    def authenticate(self, kf_endpoint: str, runtime_config_name: str) -> Optional[Any]:
        """
        Attempt to authenticate with the specified Kubeflow endpoint. The caller
        expects the implementing method to behave as follows:
        - if authentication fails (for any reason), AuthenticationError is raised
        - an entity (e.g. a cookie) is returned that kfp.Client can use to access the endpoint
        - special case: for authenticators that support unsecured endpoints, None must be returned

        :param kf_endpoint: Kubeflow endpoint URL
        :type kf_endpoint: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified.
        :type runtime_config_name: str
        :raises NotImplementedError: This method needs to be implemented.
        :raises AuthenticationError: Authentication failed. Details are in the exception.
        :return: an entity that provides the Kubeflow Pipelines SDK client access to the specified endpoint
        :rtype: Optional[str]
        """
        raise NotImplementedError("Method AbstractAuthenticator.authenticate must be implemented.")


class NoAuthenticationAuthenticator(AbstractAuthenticator):
    """
    Authenticator for Kubeflow servers that are not secured.
    """

    _type = SupportedAuthProviders.NO_AUTHENTICATION

    def authenticate(self, kf_endpoint: str, runtime_config_name: str) -> Optional[str]:
        """
        Confirms that the specified kf_endpoint can be accessed
        without authentication.

        :param kf_endpoint: Kubeflow API endpoint to verify
        :type kf_endpoint: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified
        :type runtime_config_name: str
        :raises AuthenticationError: the endpoint is secured or an error occurred during processing.
        :return: None if the endpoint is unsecured
        :rtype: Optional[str]
        """
        # verify that the endpoint is unsecured
        get_response = requests.get(kf_endpoint, allow_redirects=True)

        if len(get_response.history) > 0:
            raise AuthenticationError(
                f"Authentication is required for Kubeflow at {kf_endpoint}. "
                f"Update the authentication type setting in runtime configuration "
                f"'{runtime_config_name}' and try again.",
                provider=self._type,
            )
        return None


class DEXStaticPasswordAuthenticator(AbstractAuthenticator):
    """
    Authenticator for DEX/static passwords
    """

    _type = SupportedAuthProviders.DEX_STATIC_PASSWORDS

    def authenticate(
        self, kf_endpoint: str, runtime_config_name: str, username: str = None, password: str = None
    ) -> Optional[str]:
        """
        Authenticate using static password authentication. An AuthenticationError is raised
        if (1) kf_endpoint is unsecured (2) kf_endpoint does not
        support static password authentication (3) the credentials are invalid

        :param kf_endpoint: Kubeflow API endpoint to verify
        :type kf_endpoint: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified
        :type runtime_config_name: str
        :param username: Id to be used for authentication
        :type username: str
        :param password: Password to be used for authentication
        :type password: str
        :raises AuthenticationError: Authentication failed due to the specified error.
        :return: A cookie value
        """

        # This code can be removed after the kfp runtime schema enforces that the values
        # for username and password are valid
        if _empty_or_whitespaces_only(username) or _empty_or_whitespaces_only(password):
            raise AuthenticationError(
                f"Credentials are required to perform this type of authentication. "
                f"Update runtime configuration '{runtime_config_name}' and try again.",
                provider=self._type,
            )

        with requests.Session() as s:
            request_history = []

            ################
            # Determine if Endpoint is Secured
            ################
            resp = s.get(kf_endpoint, allow_redirects=True)
            request_history.append((kf_endpoint, resp))
            if resp.status_code != HTTPStatus.OK:
                raise AuthenticationError(
                    f"Error detecting whether Kubeflow server at {kf_endpoint} is secured: "
                    f"HTTP status code {resp.status_code}"
                    f"Update runtime configuration '{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )

            if len(resp.history) == 0:
                # if we were NOT redirected, then the endpoint is UNSECURED
                # treat this as an error.
                raise AuthenticationError(
                    f"The Kubeflow server at {kf_endpoint} is not secured "
                    "using DEX static password. "
                    f"Update runtime configuration '{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )

            ################
            # Get Dex Login URL
            ################
            redirect_url_obj = urlsplit(resp.url)

            # if we are at `/auth?=xxxx` path, we need to select the
            # static password auth type
            if re.search(r"/auth$", redirect_url_obj.path):
                redirect_url_obj = redirect_url_obj._replace(
                    path=re.sub(r"/auth$", "/auth/local", redirect_url_obj.path)
                )
            else:
                # verify that KF is secured by static passwords
                m = re.search(r"/auth/([^/]*)/?", redirect_url_obj.path)
                if m and m.group(1) != "local":
                    raise AuthenticationError(
                        f"The Kubeflow server at {kf_endpoint} redirected to an unexpected HTTP path "
                        f"('{redirect_url_obj.path}'). Verify that Kubeflow is secured using '{self._type.name}'"
                        f" and, if necessary, update the authentication type in runtime configuration "
                        f"'{runtime_config_name}'.",
                        provider=self._type,
                        request_history=request_history,
                    )

            # if we are at `/auth/local/login` path, then no further action is needed
            # (we can use it for login POST)
            if re.search(r"/auth/local/login$", redirect_url_obj.path):
                dex_login_url = redirect_url_obj.geturl()
            else:
                # else, we need to be redirected to the actual login page
                # this GET should redirect us to the `/auth/local/login` path
                resp = s.get(redirect_url_obj.geturl(), allow_redirects=True)
                request_history.append((redirect_url_obj.geturl(), resp))
                if resp.status_code != HTTPStatus.OK:
                    raise AuthenticationError(
                        "Error redirecting to the DEX static password login page: "
                        f"HTTP status code {resp.status_code}.",
                        provider=self._type,
                        request_history=request_history,
                    )
                # set the login url
                dex_login_url = resp.url

            ################
            # Attempt Dex Login
            ################
            resp = s.post(dex_login_url, data={"login": username, "password": password}, allow_redirects=True)
            request_history.append((dex_login_url, resp))

            if len(resp.history) == 0:
                raise AuthenticationError(
                    "The credentials are probably invalid. "
                    f"Update runtime configuration '{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )

            # store the session cookies in a "key1=value1; key2=value2" string
            return "; ".join([f"{c.name}={c.value}" for c in s.cookies])


class DEXLDAPAuthenticator(AbstractAuthenticator):
    """
    Authenticator for DEX/LDAP.
    """

    _type = SupportedAuthProviders.DEX_LDAP

    def authenticate(
        self, kf_endpoint: str, runtime_config_name: str, username: str = None, password: str = None
    ) -> Optional[str]:
        """
        Authenticate using LDAP. An AuthenticationError is raised
        if (1) kf_endpoint is unsecured (2) kf_endpoint does not
        support LDAP authentication (3) the credentials are invalid

        :param kf_endpoint: Kubeflow API endpoint to verify
        :type kf_endpoint: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified
        :type runtime_config_name: str
        :param username: Id to be used for authentication
        :type username: str
        :param password: Password to be used for authentication
        :type password: str
        :raises AuthenticationError: Authentication failed due to the specified error.
        :return: A cookie value
        """

        # This code can be removed after the kfp runtime schema enforces that the values
        # for username and password are valid
        if _empty_or_whitespaces_only(username) or _empty_or_whitespaces_only(password):
            raise AuthenticationError(
                f"Credentials are required to perform this type of authentication. "
                f"Update runtime configuration '{runtime_config_name}' and try again.",
                provider=self._type,
            )

        with requests.Session() as s:
            request_history = []

            ################
            # Determine if Endpoint is Secured
            ################
            resp = s.get(kf_endpoint, allow_redirects=True)
            request_history.append((kf_endpoint, resp))
            if resp.status_code != HTTPStatus.OK:
                raise AuthenticationError(
                    f"Error detecting whether Kubeflow server at {kf_endpoint} is secured: "
                    f"HTTP status code {resp.status_code}"
                    f"Update runtime configuration '{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )

            if len(resp.history) == 0:
                # if we were NOT redirected, then the endpoint is UNSECURED
                # treat this as an error.
                raise AuthenticationError(
                    f"The Kubeflow server at {kf_endpoint} is not secured using DEX with LDAP. "
                    f"Update the authentication type in runtime configuration "
                    f"'{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )

            ################
            # Get Dex Login URL
            ################
            redirect_url_obj = urlsplit(resp.url)

            # if we are at `/auth?=xxxx` path, we need to select
            # the LDAP auth type
            if re.search(r"/auth$", redirect_url_obj.path):
                redirect_url_obj = redirect_url_obj._replace(
                    path=re.sub(r"/auth$", "/auth/ldap", redirect_url_obj.path)
                )
            else:
                # verify that KF is secured by LDAP
                m = re.search(r"/auth/([^/]*)/?", redirect_url_obj.path)
                if m and m.group(1) != "ldap":
                    raise AuthenticationError(
                        f"The Kubeflow server at {kf_endpoint} redirected to an unexpected HTTP path "
                        f"('{redirect_url_obj.path}'). Verify that Kubeflow is configured for '{self._type.name}'"
                        f" and, if necessary, update the authentication type in runtime configuration "
                        f"'{runtime_config_name}'.",
                        provider=self._type,
                        request_history=request_history,
                    )

            # if we are at `/auth/ldap/login` path, then no further action is needed
            # (we can use it for login POST)
            if re.search(r"/auth/ldap/login$", redirect_url_obj.path):
                dex_login_url = redirect_url_obj.geturl()
            else:
                # else, we need to be redirected to the actual login page
                # this GET should redirect us to the `/auth/ldap/login` path
                resp = s.get(redirect_url_obj.geturl(), allow_redirects=True)
                request_history.append((redirect_url_obj.geturl(), resp))
                if resp.status_code != HTTPStatus.OK:
                    raise AuthenticationError(
                        "Error redirecting to the DEX LDAP login page: " f"HTTP status code {resp.status_code}.",
                        provider=self._type,
                        request_history=request_history,
                    )
                # set the login url
                dex_login_url = resp.url

            ################
            # Attempt Dex Login
            ################
            resp = s.post(dex_login_url, data={"login": username, "password": password}, allow_redirects=True)
            request_history.append((dex_login_url, resp))

            if len(resp.history) == 0:
                raise AuthenticationError(
                    "The DEX LDAP credentials are probably invalid. "
                    f"Update runtime configuration '{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )

            # store the session cookies in a "key1=value1; key2=value2" string
            return "; ".join([f"{c.name}={c.value}" for c in s.cookies])


class K8sServiceAccountTokenAuthenticator(AbstractAuthenticator):
    """
    Authenticator for Service Account Tokens on Kubernetes.
    """

    _type = SupportedAuthProviders.KUBERNETES_SERVICE_ACCOUNT_TOKEN

    def authenticate(self, kf_endpoint: str, runtime_config_name: str) -> ServiceAccountTokenVolumeCredentials:
        """
        Verify that service account token authentication can be performed.
        An AuthenticationError is raised if a problem is encountered that
        would likely prevent the KFP client from authenticating successfully.

        :param kf_endpoint: Kubeflow API endpoint to verify
        :type kf_endpoint: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified
        :type runtime_config_name: str
        :raises AuthenticationError: A potential issue was detected that will
        likely cause a KFP client failure.
        :return: ServiceAccountTokenVolumeCredentials
        """

        request_history = []

        """
        Disable connectivity test to avoid false positives.

        # Verify connectivity for the API endpoint
        resp = requests.get(kf_endpoint, allow_redirects=True)
        request_history.append((kf_endpoint, resp))
        if resp.status_code != HTTPStatus.OK:
            raise AuthenticationError(f'Error detecting whether Kubeflow server at {kf_endpoint} is secured: '
                                      'HTTP status code {resp.status_code}'
                                      f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                      provider=self._type,
                                      request_history=request_history)
        # If redirected, KF cannot be accessed using service account token.
        # This is a likely mismatch between selected Kubeflow auth type and configured auth type.
        if len(resp.history) > 0:
            raise AuthenticationError(f'Kubeflow server at {kf_endpoint} redirected to an unexpected '
                                      f'URL \'{resp.url}\'. Service account token access cannot be used '
                                      'for authentication. '
                                      f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                      provider=self._type,
                                      request_history=request_history)
        """

        # Running in a Kubernetes pod, kfp.Client can use a service account token
        # for authentication. Verify that a token file exists in the current environment.
        service_account_token_path = os.environ.get(KF_PIPELINES_SA_TOKEN_ENV, KF_PIPELINES_SA_TOKEN_PATH)

        try:
            with open(service_account_token_path, "r") as token_file:
                if len(token_file.read()) == 0:
                    raise AuthenticationError(
                        f"Kubernetes service account token file " f"{service_account_token_path} is empty.",
                        provider=self._type,
                        request_history=request_history,
                    )
        except AuthenticationError:
            raise
        except Exception as ex:
            raise AuthenticationError(
                f"Kubernetes service account token could not be read " f"from {service_account_token_path}: {ex}.",
                provider=self._type,
                request_history=request_history,
            )

        # return a ServiceAccountTokenVolumeCredentials to be passed as the "credentials"
        # argument of a `kfp.Client()` constructor
        return ServiceAccountTokenVolumeCredentials(path=service_account_token_path)


class DEXLegacyAuthenticator(AbstractAuthenticator):
    """
    Authenticator for generic/legacy DEX authentication.
    """

    _type = SupportedAuthProviders.DEX_LEGACY

    def authenticate(
        self, kf_endpoint: str, runtime_config_name: str, username: Optional[str] = None, password: Optional[str] = None
    ) -> Optional[str]:
        """
        Authentication using the following flow:
         - detect whether Kubeflow endpoint is secured
         - if endpoint is secured, try to authenticate if a username and password were provided

        :param kf_endpoint: Kubeflow API endpoint to verify
        :type kf_endpoint: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified
        :type runtime_config_name: str
        :param username: Id to be used for authentication
        :type username: Optional[str]
        :param password: Password to be used for authentication
        :type password: Optional[str]
        :raises AuthenticationError: Authentication failed due to the specified error.
        :return: None if kf_endpoint is not secured, a cookie value otherwise
        :rtype: Optional[str]
        """

        # keep history of all HTTP requests and responses for troubleshooting
        request_history = []

        # Obtain redirect URL
        resp = requests.get(kf_endpoint)
        request_history.append((kf_endpoint, resp))
        if resp.status_code != HTTPStatus.OK:
            raise AuthenticationError(
                f"Error detecting whether Kubeflow server at {kf_endpoint} is secured: "
                "HTTP status code {resp.status_code}"
                f"Update runtime configuration '{runtime_config_name}' and try again.",
                provider=self._type,
                request_history=request_history,
            )

        # If KF redirected to '/dex/auth/...
        # try to authenticate using the provided credentials
        if "dex/auth" in resp.url:
            if _empty_or_whitespaces_only(username) or _empty_or_whitespaces_only(password):
                raise AuthenticationError(
                    f"Kubeflow server at {kf_endpoint} is secured: "
                    "username and password are required. "
                    f"Update runtime configuration '{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )

            # Try to authenticate user by sending a request to the
            # redirect URL
            session = requests.Session()
            auth_url = resp.url
            resp = session.post(auth_url, data={"login": username, "password": password})
            request_history.append((auth_url, resp))

            if resp.status_code != HTTPStatus.OK:
                raise AuthenticationError(
                    f"Authentication {auth_url} failed: "
                    f"HTTP status code {resp.status_code}"
                    f"Update runtime configuration '{runtime_config_name}' and try again.",
                    provider=self._type,
                    request_history=request_history,
                )
            # Capture authservice_session cookie, if one was returned
            # in the response
            cookie_auth_key = "authservice_session"
            cookie_auth_value = session.cookies.get(cookie_auth_key)

            if cookie_auth_value:
                return f"{cookie_auth_key}={cookie_auth_value}"

        # The endpoint is not secured.
        return None


class ExistingBearerTokenAuthenticator(AbstractAuthenticator):
    """
    This authenticator uses a user-provided bearer token value for authentication.
    """

    _type = SupportedAuthProviders.EXISTING_BEARER_TOKEN

    def authenticate(self, kf_endpoint: str, runtime_config_name: str, token: str = None) -> Optional[str]:
        """
        Authenticate using static bearer token. Authentication ensures that the token
        is a string that is not None/empty/whitespaces only.

        :param kf_endpoint: Kubeflow API endpoint to verify
        :type kf_endpoint: str
        :param runtime_config_name: Runtime configuration name where kf_endpoint is specified
        :type runtime_config_name: str
        :param token: Bearer token to be used for authentication
        :type password: str
        :raises AuthenticationError: Authentication failed due to the specified error.
        :return: A bearer token value
        """

        # This code can be removed after the kfp runtime schema enforces that the values
        # for password/token are valid
        if _empty_or_whitespaces_only(token):
            raise AuthenticationError(
                f"A token/password is required to perform this type of authentication. "
                f"Update runtime configuration '{runtime_config_name}' and try again.",
                provider=self._type,
            )

        # Return the bearer token
        return token
