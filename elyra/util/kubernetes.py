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
import re


def is_valid_kubernetes_resource_name(name: str) -> bool:
    """
    Returns a truthy value indicating whether name meets the kubernetes
    naming constraints, as outlined in
    https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
    This implementation is based on https://tools.ietf.org/html/rfc1123:
    - contains no more than 253 characters
    - contain only lowercase alphanumeric characters, '-' or '.'
    - start with an alphanumeric character
    - end with an alphanumeric character
    """
    if name is None or (len(name) == 0) or (len(name) > 253) or not name[0].isalnum() or not name[-1].isalnum():
        return False
    for char in name:
        if char.isdigit():
            pass
        elif char.isalpha():
            if not char.islower():
                return False
        elif char not in ["-", "."]:
            return False
    return True


def is_valid_dns_subdomain_name(name: str) -> bool:
    """
    Returns a truthy value indicating whether name meets the kubernetes
    naming constraints for DNS subdomains, as outlined in the link below.

    https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names
    """
    if name is None or len(name) > 253:
        return False

    return re.match(r"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$", name) is not None


def is_valid_kubernetes_key(name: str) -> bool:
    """
    Returns a truthy value indicating whether name meets the kubernetes
    naming constraints, as outlined in the link below.

    https://kubernetes.io/docs/concepts/configuration/secret/#restriction-names-data
    """
    if name is None:
        return False

    return re.match(r"^[\w\-_.]+$", name) is not None


def is_valid_annotation_key(key: str) -> bool:
    """
    Returns a truthy value indicating whether name meets the kubernetes
    naming constraints for annotation keys, as outlined in the link below.

    https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#syntax-and-character-set
    """
    if key is None or (len(key) == 0):
        return False

    parts = key.split("/")
    if len(parts) == 1:
        prefix = ""
        name = parts[0]
    elif len(parts) == 2:
        prefix = parts[0]
        name = parts[1]
    else:
        return False

    # validate optional prefix
    if "/" in key and len(prefix) == 0:
        return False

    if len(prefix) > 0 and not is_valid_dns_subdomain_name(prefix):
        return False

    # validate name
    if len(name) == 0 or len(name) > 63:
        return False
    if not name[0].isalnum() or not name[-1].isalnum():
        return False

    return re.match(r"^[\w\-_.]+$", name) is not None


def is_valid_annotation_value(value: str) -> bool:
    """
    Returns a truthy value indicating whether name meets the kubernetes
    naming constraints for annotation values, as outlined in the link below.

    https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#syntax-and-character-set
    """
    if value is None or (isinstance(value, str) and (len(value) == 0)):
        return True

    return isinstance(value, str)


def is_valid_label_key(key: str) -> bool:
    """
    Returns a truthy value indicating whether name meets the kubernetes
    naming constraints for label keys, as outlined in the link below.

    https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-set
    """

    # rules are identical to those applied to annotation keys; re-use existing code
    return is_valid_annotation_key(key)


def is_valid_label_value(value: str) -> bool:
    """
    Returns a truthy value indicating whether name meets the kubernetes
    naming constraints for label values, as outlined in the link below.

    https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-set
    - must be 63 characters or less (can be empty),
    - unless empty, must begin and end with an alphanumeric character ([a-z0-9A-Z]),
    - could contain dashes (-), underscores (_), dots (.), and alphanumerics between.
    """

    if value is None or (isinstance(value, str) and (len(value) == 0)):
        return True

    if len(value) > 63 or not value[0].isalnum() or not value[-1].isalnum():
        return False

    return re.match(r"^[a-zA-Z0-9]([-_\.A-Za-z0-9]*[a-zA-Z0-9])*$", value) is not None
