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
import re
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from urllib.parse import urlsplit

import requests


class SupportedKFPAuthProviders(Enum):
    NO_AUTHENTICATION = 'No authentication'
    STATIC_PASSWORD = 'Static password'
    AUTO = 'Auto'
    ELYRA_DEX_LEGACY = 'Elyra (deprecated)'


class AuthenticationError(Exception):

    def __init__(self,
                 message: str,
                 provider: Optional[str] = None,
                 request_history: Optional[List[Dict[str, Any]]] = None):
        self._message = message
        self._provider = provider
        self._request_history = request_history

    def get_request_history(self) -> List[Dict[str, requests.Response]]:
        if self._request_history is not None:
            return self._request_history


class KFPAuthenticator():

    def authenticate(self,
                     api_endpoint: str,
                     auth_type: str,
                     runtime_config_name: str,
                     auth_parm_1: Optional[str] = None,
                     auth_parm_2: Optional[str] = None) -> Dict[str, str]:

        kf_url = urlsplit(api_endpoint)._replace(path='').geturl()

        auth_info = {
            'api_endpoint': kf_url,
            'auth_type': None,
            'kf_secured': False,
            'cookies': None,
            'existing_token': None
        }

        try:
            auth_info['auth_type'] = auth_type

            if auth_type == SupportedKFPAuthProviders.NO_AUTHENTICATION.value:
                UnsecuredKFPAuthenticator().authenticate(kf_url,
                                                         runtime_config_name)
            elif auth_type == SupportedKFPAuthProviders.STATIC_PASSWORD.value:
                auth_info['cookies'] =\
                    StaticPasswordKFPAuthenticator().authenticate(kf_url,
                                                                  runtime_config_name,
                                                                  username=auth_parm_1,
                                                                  password=auth_parm_2)
                auth_info['kf_secured'] = True
            elif auth_type == SupportedKFPAuthProviders.AUTO.value:
                # Authentication is performed the way it was implemented in Elyra < 3.2.0
                auth_info['cookies'] =\
                    AutoKFPAuthenticator().authenticate(kf_url,
                                                        runtime_config_name,
                                                        username=auth_parm_1,
                                                        password=auth_parm_2)
                if auth_info.get('cookies') is not None:
                    auth_info['kf_secured'] = True

            elif auth_type == SupportedKFPAuthProviders.ELYRA_DEX_LEGACY.value:
                # Authentication is performed the way it was implemented in Elyra == 3.2.x
                auth_info['cookies'] =\
                    LegacyDEXKFPAuthenticator().authenticate(kf_url,
                                                             runtime_config_name,
                                                             username=auth_parm_1,
                                                             password=auth_parm_2)
                if auth_info.get('cookies') is not None:
                    auth_info['kf_secured'] = True
            else:
                raise AuthenticationError(f'Authentication type \'{auth_type}\' is unsupported. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.')
        except AuthenticationError:
            raise
        except Exception as ex:
            raise AuthenticationError(f'Authentication using auth type {auth_type} failed: {ex}')

        # sanity check: upon completion auth_info must not contain
        # incomplete or conflicting information
        if auth_info.get('auth_type') is None or\
           (auth_info.get('cookies') is not None and auth_info.get('existing_token') is not None):
            raise AuthenticationError('MSG TODO')

        return auth_info


class AbstractKFPAuthenticator(ABC):

    _type = None

    @abstractmethod
    def authenticate(self, kf_endpoint: str) -> Optional[str]:
        raise NotImplementedError('Method AbstractKFPAuthenticator.authenticate must be implemented.')


class UnsecuredKFPAuthenticator(AbstractKFPAuthenticator):

    _type = SupportedKFPAuthProviders.NO_AUTHENTICATION.value

    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str) -> Optional[str]:
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
        # TODO
        raise NotImplementedError('StaticPasswordKFPAuthenticator must be implemented.')


class AutoKFPAuthenticator(AbstractKFPAuthenticator):

    _type = SupportedKFPAuthProviders.AUTO.value

    def authenticate(self,
                     kf_endpoint: str,
                     runtime_config_name: str,
                     username: str,
                     password: str) -> Optional[str]:

        request_history = []

        # Obtain redirect URL
        resp = requests.get(kf_endpoint)
        request_history.append({'request_url': kf_endpoint, 'response': resp})
        if resp.status_code != HTTPStatus.OK:
            raise AuthenticationError('Error detecting whether Kubeflow server at {kf_endpoint} is secured: '
                                      'HTTP status code {resp.status_code}'
                                      f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                      provider=self._type,
                                      request_history=request_history)

        # If KF redirected to '/dex/auth/...
        # try to authenticate using the provided credentials
        if 'dex/auth' in resp.url:

            # Try to authenticate user by sending a request to the
            # redirect URL
            session = requests.Session()
            auth_url = resp.url
            resp = session.post(auth_url,
                                data={'login': username,
                                      'password': password})
            request_history.append({'request_url': auth_url, 'response': resp})

            if resp.status_code != HTTPStatus.OK:
                raise AuthenticationError('Authentication {auth_url} failed: '
                                          'HTTP status code {resp.status_code}'
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)
            # Capture authservice_session cookie, if one was returned
            # in the response
            cookie_auth_key = 'authservice_session'
            cookie_auth_value = session.cookies.get(cookie_auth_key)

            if cookie_auth_value:
                return f'{cookie_auth_key}={cookie_auth_value}'

        return None


class LegacyDEXKFPAuthenticator(AbstractKFPAuthenticator):

    _type = SupportedKFPAuthProviders.AUTO.value

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
                raise AuthenticationError('Error detecting whether Kubeflow server at {kf_endpoint} is secured: '
                                          'HTTP status code {resp.status_code}'
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

            # if we were NOT redirected, then the endpoint is UNSECURED
            if len(resp.history) == 0:
                return None

            ################
            # Get Dex Login URL
            ################
            redirect_url_obj = urlsplit(resp.url)

            # if we are at `/auth?=xxxx` path, we need to select an auth type
            if re.search(r"/auth$", redirect_url_obj.path):
                # default to "staticPasswords" auth type
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
                request_history.append({'request_url': dex_login_url, 'response': resp})
                if resp.status_code != HTTPStatus.OK:
                    raise AuthenticationError('Error redirecting to the DEX login page: '
                                              'HTTP status code {resp.status_code}.',
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
                raise AuthenticationError('Authentication failed. The credentials are probably invalid. '
                                          f'Update runtime configuration \'{runtime_config_name}\' and try again.',
                                          provider=self._type,
                                          request_history=request_history)

            # store the session cookies in a "key1=value1; key2=value2" string
            return "; ".join([f"{c.name}={c.value}" for c in s.cookies])

        return None
