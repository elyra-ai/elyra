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
from urllib.parse import urlsplit

import requests


class SupportedKFPAuthProviders(Enum):
    """
    List of supported authentication providers that is defined
    in this module. Each entry in this list must be associated
    with an implementation of AbstractKFPAuthenticator. Each
    entry's value must also be specified as enum value for the
    "auth_type" property in elyra/kfp/metadata/schemas/kfp.json
    to enable users to select the provider from the list.

    """
    # KF is not secured
    # (See UnsecuredKFPAuthenticator)
    NO_AUTHENTICATION = 'No authentication'
    # KF is secured using static id/password
    # (See StaticPasswordKFPAuthenticator implementation)
    STATIC_PASSWORD = 'Static password'
    # KF is secured using KF_PIPELINES_SA_TOKEN_PATH
    # (See SATokenPathKFPAuthenticator implementation)
    KF_PIPELINES_SA_TOKEN_PATH = 'KF_PIPELINES_SA_TOKEN_PATH'
    # Supports multiple authentication mechanisms
    # (See AutoKFPAuthenticator implementation)
    AUTO = 'Auto'
    # Supports LDAP authentication
    # (See LDAPKFPAuthenticator implementation)
    LDAP = 'LDAP'


class AuthenticationError(Exception):
    """
    Indicates that an error occurred while an authentication request
    was being processed.

    """

    def __init__(self,
                 message: str,
                 provider: Optional[str] = None,
                 request_history: Optional[List[Dict[str, requests.Response]]] = None):
        """
        Create a new AuthenticationError exception. The throw-er should
        populate the request_history to allow for troubleshooting. List entry key is the (HTTP)
        request URL, the value the response object.

        :param message: a user friendly error message
        :type message: str
        :param provider: if the error is raised by an implementation of AbstractKFPAuthenticator,
         use the value of _type; optional, defaults to None
        :type provider: Optional[str], optional
        :param request_history: , defaults to None
        :type request_history: Optional[List[Dict[str, requests.Response]]], optional
        """
        self._message = message
        self._provider = provider
        self._request_history = request_history

    def get_request_history(self) -> List[Dict[str, requests.Response]]:
        if self._request_history is not None:
            return self._request_history


class KFPAuthenticator():
    """
    Use this class to authenticate with Kubeflow Pipelines. The authenticate
    method delegates the actual authentication to an implementation of the
    AbstractKFPAuthenticator class.
    """

    def authenticate(self,
                     api_endpoint: str,
                     auth_type: str,
                     runtime_config_name: str,
                     auth_parm_1: Optional[str] = None,
                     auth_parm_2: Optional[str] = None) -> Dict[str, Any]:
        """
        Try to authenticate with Kubeflow using the provided information.

        :param api_endpoint: Kubeflow Pipelines endpoint URL, as specified in the runtime configuration
        :type api_endpoint: str
        :param auth_type Identifies the authentication type to be performed. If the provided value
         is in the SupportedKFPAuthProviders enum, authentication is performed.
        :type auth_type: str
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

        kf_url = urlsplit(api_endpoint)._replace(path='').geturl()

        # return data structure for successful requests
        auth_info = {
            'api_endpoint': kf_url,   # KF API endpoint, source: runtime config
            'auth_type': None,        # Authentication type, source: runtime config
            'kf_secured': False,      # Indicates whether KF API is secured
            'cookies': None,          # passed to KFP SDK client as "cookies" param value
            'existing_token': None    # passed to KFP SDK client as "existing_token" param value
        }

        try:
            auth_info['auth_type'] = auth_type

            # Process the authentication request using the appropriate authenticator
            # implementation. Refer to the class definitions for information how
            # the request is processed

            if auth_type == SupportedKFPAuthProviders.NO_AUTHENTICATION.value:
                UnsecuredKFPAuthenticator().authenticate(kf_url,
                                                         runtime_config_name)
            elif auth_type == SupportedKFPAuthProviders.STATIC_PASSWORD.value:
                # static id/password checking; the authenticator returns
                # a cookie value
                auth_info['cookies'] =\
                    StaticPasswordKFPAuthenticator().authenticate(kf_url,
                                                                  runtime_config_name,
                                                                  username=auth_parm_1,
                                                                  password=auth_parm_2)
                auth_info['kf_secured'] = True
            elif auth_type == SupportedKFPAuthProviders.AUTO.value:
                # see implementation for details; the authenticator returns
                # a cookie value
                auth_info['cookies'] =\
                    AutoKFPAuthenticator().authenticate(kf_url,
                                                        runtime_config_name,
                                                        username=auth_parm_1,
                                                        password=auth_parm_2)
                if auth_info.get('cookies') is not None:
                    auth_info['kf_secured'] = True

            elif auth_type == SupportedKFPAuthProviders.LDAP.value:
                # DEX/LDAP authentication; the authenticator returns
                # a cookie value
                auth_info['cookies'] =\
                    LDAPKFPAuthenticator().authenticate(kf_url,
                                                        runtime_config_name,
                                                        username=auth_parm_1,
                                                        password=auth_parm_2)
                if auth_info.get('cookies') is not None:
                    auth_info['kf_secured'] = True
            elif auth_type == SupportedKFPAuthProviders.KF_PIPELINES_SA_TOKEN_PATH.value:
                # see implementation for details; the authenticator returns
                # None
                SATokenPathKFPAuthenticator().authenticate(kf_url,
                                                           runtime_config_name)
                auth_info['kf_secured'] = True
            else:
                # the provided authentication type is not supported
                raise AuthenticationError(f'Authentication type \'{auth_type}\' is unsupported. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.')
        except AuthenticationError:
            raise
        except Exception as ex:
            raise AuthenticationError(f'Authentication using auth type \'{auth_type}\' failed: {ex}')

        # sanity check: upon completion auth_info must not contain
        # incomplete or conflicting information
        if auth_info.get('auth_type') is None or\
           (auth_info.get('cookies') is not None and auth_info.get('existing_token') is not None):
            raise AuthenticationError('A potential authentication implementation problem was detected. '
                                      'Please create an issue.')

        return auth_info


class AbstractKFPAuthenticator(ABC):
    """
    Abstract base class for authenticator implementations
    """

    _type = None  # unique authenticator id

    @abstractmethod
    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str) -> Optional[str]:
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
        raise NotImplementedError('Method AbstractKFPAuthenticator.authenticate must be implemented.')


class UnsecuredKFPAuthenticator(AbstractKFPAuthenticator):
    """
    Authenticator for Kubeflow servers that are not secured.
    """

    _type = SupportedKFPAuthProviders.NO_AUTHENTICATION.value

    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str) -> Optional[str]:
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
            raise AuthenticationError(f'Authentication is required for Kubeflow at {kf_endpoint}. '
                                      f'Update the authentication type setting in runtime configuration '
                                      f'\'{runtime_config_name}\' and try again.',
                                      self._type)
        return None


class StaticPasswordKFPAuthenticator(AbstractKFPAuthenticator):

    _type = SupportedKFPAuthProviders.STATIC_PASSWORD.value

    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str,
                     username: str,
                     password: str) -> Optional[str]:
        with requests.Session() as s:

            request_history = []

            ################
            # Determine if Endpoint is Secured
            ################
            resp = s.get(kf_endpoint, allow_redirects=True)
            request_history.append({'request_url': kf_endpoint, 'response': resp})
            if resp.status_code != HTTPStatus.OK:
                raise AuthenticationError(f'Error detecting whether Kubeflow server at {kf_endpoint} is secured: '
                                          f'HTTP status code {resp.status_code}'
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

            if len(resp.history) == 0:
                # if we were NOT redirected, then the endpoint is UNSECURED
                # treat this as an error.
                raise AuthenticationError(f'The Kubeflow server at {kf_endpoint} is not secured using LDAP. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

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

            # if we are at `/auth/xxxx/login` path, then no further action is needed
            # (we can use it for login POST)
            if re.search(r"/auth/.*/login$", redirect_url_obj.path):
                dex_login_url = redirect_url_obj.geturl()
            else:
                # else, we need to be redirected to the actual login page
                # this GET should redirect us to the `/auth/xxxx/login` path
                resp = s.get(redirect_url_obj.geturl(), allow_redirects=True)
                request_history.append({'request_url': redirect_url_obj.geturl(), 'response': resp})
                if resp.status_code != HTTPStatus.OK:
                    raise AuthenticationError('Error redirecting to the DEX login page: '
                                              f'HTTP status code {resp.status_code}.',
                                              provider=self._type,
                                              request_history=request_history)
                # set the login url
                dex_login_url = resp.url

            ################
            # Attempt Dex Login
            ################
            resp = s.post(
                dex_login_url,
                data={"login": username, "password": password},
                allow_redirects=True
            )
            request_history.append({'request_url': dex_login_url, 'response': resp})

            if len(resp.history) == 0:
                raise AuthenticationError('The LDAP credentials are probably invalid. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

            # store the session cookies in a "key1=value1; key2=value2" string
            return "; ".join([f"{c.name}={c.value}" for c in s.cookies])

        # this code should never be reached; raise an error
        raise AuthenticationError('An implementation problem was detected for static password authentication. '
                                  'Please create an issue.',
                                  provider=self._type,
                                  request_history=request_history)


class LDAPKFPAuthenticator(AbstractKFPAuthenticator):
    """
    Tries to authenticate using LDAP
    """

    _type = SupportedKFPAuthProviders.LDAP.value

    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str,
                     username: str,
                     password: str) -> Optional[str]:

        with requests.Session() as s:

            request_history = []

            ################
            # Determine if Endpoint is Secured
            ################
            resp = s.get(kf_endpoint, allow_redirects=True)
            request_history.append({'request_url': kf_endpoint, 'response': resp})
            if resp.status_code != HTTPStatus.OK:
                raise AuthenticationError(f'Error detecting whether Kubeflow server at {kf_endpoint} is secured: '
                                          f'HTTP status code {resp.status_code}'
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

            if len(resp.history) == 0:
                # if we were NOT redirected, then the endpoint is UNSECURED
                # treat this as an error.
                raise AuthenticationError(f'The Kubeflow server at {kf_endpoint} is not secured using LDAP. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

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

            # if we are at `/auth/xxxx/login` path, then no further action is needed
            # (we can use it for login POST)
            if re.search(r"/auth/.*/login$", redirect_url_obj.path):
                dex_login_url = redirect_url_obj.geturl()
            else:
                # else, we need to be redirected to the actual login page
                # this GET should redirect us to the `/auth/xxxx/login` path
                resp = s.get(redirect_url_obj.geturl(), allow_redirects=True)
                request_history.append({'request_url': redirect_url_obj.geturl(), 'response': resp})
                if resp.status_code != HTTPStatus.OK:
                    raise AuthenticationError('Error redirecting to the DEX login page: '
                                              f'HTTP status code {resp.status_code}.',
                                              provider=self._type,
                                              request_history=request_history)
                # set the login url
                dex_login_url = resp.url

            ################
            # Attempt Dex Login
            ################
            resp = s.post(
                dex_login_url,
                data={"login": username, "password": password},
                allow_redirects=True
            )
            request_history.append({'request_url': dex_login_url, 'response': resp})

            if len(resp.history) == 0:
                raise AuthenticationError('The LDAP credentials are probably invalid. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

            # store the session cookies in a "key1=value1; key2=value2" string
            return "; ".join([f"{c.name}={c.value}" for c in s.cookies])

        # this code should never be reached; raise an error
        raise AuthenticationError('An implementation problem was detected for LDAP authentication. '
                                  'Please create an issue.',
                                  provider=self._type,
                                  request_history=request_history)


class SATokenPathKFPAuthenticator(AbstractKFPAuthenticator):

    _type = SupportedKFPAuthProviders.KF_PIPELINES_SA_TOKEN_PATH.value

    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str) -> Optional[str]:

        request_history = []

        # Verify the API endpoint
        resp = requests.get(kf_endpoint)
        request_history.append({'request_url': kf_endpoint, 'response': resp})
        if resp.status_code != HTTPStatus.OK:
            raise AuthenticationError(f'Error detecting whether Kubeflow server at {kf_endpoint} is secured: '
                                      'HTTP status code {resp.status_code}'
                                      f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                      provider=self._type,
                                      request_history=request_history)

        # Running in a Kubernetes pod, kfp.Client can utilize environment
        # variable KF_PIPELINES_SA_TOKEN_PATH for authentication. Verify
        # that the variable is defined in the current environment.
        env_var_name = 'KF_PIPELINES_SA_TOKEN_PATH'
        if os.environ.get(env_var_name) is None:
            raise AuthenticationError(f'Environment variable {env_var_name} is undefined.',
                                      provider=self._type,
                                      request_history=request_history)

        # Nothing needs to be passed to the KFP client
        return None


class AutoKFPAuthenticator(AbstractKFPAuthenticator):
    """
    Tries to authenticate by invoking the endpoint and following up
    on a redirect response that the Kubeflow server might have produced.
    """

    _type = SupportedKFPAuthProviders.AUTO.value

    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str,
                     username: Optional[str],
                     password: Optional[str]) -> Optional[str]:
        """
        Authentication using the following flow:
         - detect wether Kubeflow endpoint is secured
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
        request_history.append({'request_url': kf_endpoint, 'response': resp})
        if resp.status_code != HTTPStatus.OK:
            raise AuthenticationError(f'Error detecting whether Kubeflow server at {kf_endpoint} is secured: '
                                      'HTTP status code {resp.status_code}'
                                      f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                      provider=self._type,
                                      request_history=request_history)

        # If KF redirected to '/dex/auth/...
        # try to authenticate using the provided credentials
        if 'dex/auth' in resp.url:

            if username is None or password is None:
                raise AuthenticationError(f'Kubeflow server at {kf_endpoint} is secured: '
                                          'username and password are required. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

            # Try to authenticate user by sending a request to the
            # redirect URL
            session = requests.Session()
            auth_url = resp.url
            resp = session.post(auth_url,
                                data={'login': username,
                                      'password': password})
            request_history.append({'request_url': auth_url, 'response': resp})

            if resp.status_code != HTTPStatus.OK:
                raise AuthenticationError(f'Authentication {auth_url} failed: '
                                          f'HTTP status code {resp.status_code}'
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)
            # Capture authservice_session cookie, if one was returned
            # in the response
            cookie_auth_key = 'authservice_session'
            cookie_auth_value = session.cookies.get(cookie_auth_key)

            if cookie_auth_value:
                return f'{cookie_auth_key}={cookie_auth_value}'

        # The endpoint is not secured.
        return None
