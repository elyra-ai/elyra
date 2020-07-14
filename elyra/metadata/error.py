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
#
"""This module includes custom error classes pertaining to the metadata service."""


class MetadataNotFoundError(BaseException):
    """Raised when a metadata instance is not found.

       Overrides FileNotFoundError to set contextual message text
       and includes the corresponding namespace.
    """
    def __init__(self, namespace: str, name: str):
        super().__init__("No such instance named '{}' was found in the {} namespace.".format(name, namespace))


class MetadataExistsError(BaseException):
    """Raised when a metadata instance unexpectedly exists.

       Overrides FileExistsError to set contextual message text
       and includes the corresponding namespace.
    """
    def __init__(self, namespace: str, name: str):
        super().__init__("An instance named '{}' already exists in the {} namespace.".format(name, namespace))


class SchemaNotFoundError(BaseException):
    """Raised when a schema instance is not found.

       Overrides FileNotFoundError to set contextual message text
       and includes the corresponding namespace.
    """
    def __init__(self, namespace: str, name: str):
        super().__init__("No such schema named '{}' was found in the {} namespace.".format(name, namespace))
