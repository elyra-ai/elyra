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
