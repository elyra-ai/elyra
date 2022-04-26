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
from elyra.util.kubernetes import is_valid_kubernetes_resource_name


def test_is_valid_kubernetes_resource_name_invalid_input():
    """
    Verify that is_valid_kubernetes_resource_name detects whether or
    not a given string is a valid Kubernetes resource name:
        - contains no more than 253 characters
        - contain only lowercase alphanumeric characters, '-' or '.'
        - start with an alphanumeric character
        - end with an alphanumeric character
    """
    # test length violations
    assert not is_valid_kubernetes_resource_name(name=None)  # Too short
    assert not is_valid_kubernetes_resource_name(name="")  # Too short
    assert not is_valid_kubernetes_resource_name(name="a" * 254)  # Too long
    # test first character violations (not alphanum or lowercase)
    assert not is_valid_kubernetes_resource_name(name="-a")
    assert not is_valid_kubernetes_resource_name(name=".b")
    assert not is_valid_kubernetes_resource_name(name=" c")
    assert not is_valid_kubernetes_resource_name(name="Dave")
    # test last character violations (not alphanum or lowercase)
    assert not is_valid_kubernetes_resource_name(name="a-")
    assert not is_valid_kubernetes_resource_name(name="b.")
    assert not is_valid_kubernetes_resource_name(name="c ")
    assert not is_valid_kubernetes_resource_name(name="sw33T")
    # test middle characters violations
    assert not is_valid_kubernetes_resource_name(name="aBBa")
    assert not is_valid_kubernetes_resource_name(name="b  b")


def test_is_valid_kubernetes_resource_name_valid_input():
    """
    Verify that is_valid_kubernetes_resource_name detects whether or
    not a given string is a valid Kubernetes resource name:
        - contains no more than 253 characters
        - contain only lowercase alphanumeric characters, '-' or '.'
        - start with an alphanumeric character
        - end with an alphanumeric character
    """
    # test valid names
    assert is_valid_kubernetes_resource_name(name="l0l")
    assert is_valid_kubernetes_resource_name(name="l-l")
    assert is_valid_kubernetes_resource_name(name="l.l")
    assert is_valid_kubernetes_resource_name(name="4-you")
    assert is_valid_kubernetes_resource_name(name="you.2")
