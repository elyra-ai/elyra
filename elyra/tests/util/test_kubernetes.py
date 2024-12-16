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
import string

from elyra.util.kubernetes import is_valid_annotation_key
from elyra.util.kubernetes import is_valid_annotation_value
from elyra.util.kubernetes import is_valid_kubernetes_resource_name
from elyra.util.kubernetes import is_valid_label_key
from elyra.util.kubernetes import is_valid_label_value
from elyra.util.kubernetes import sanitize_label_value


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


def test_is_valid_label_key_invalid_input():
    """
    Verify that is_valid_label_key detects whether or
    not a given string is a valid Kubernetes label key:
    Valid label keys have two segments: an optional prefix and name,
    separated by a slash (/). The name segment is required and must
    be 63 characters or less, beginning and ending with an alphanumeric
    character ([a-z0-9A-Z]) with dashes (-), underscores (_), dots (.),
    and alphanumerics between. The prefix is optional. If specified,
    the prefix must be a DNS subdomain: a series of DNS labels separated
    by dots (.), not longer than 253 characters in total, followed by a slash (/).
    """
    # test length violations
    assert not is_valid_label_key(key=None)  # Too short
    assert not is_valid_label_key(key="")  # Too short
    assert not is_valid_label_key(key=f"{'p' * 254}/n")  # prefix too long
    assert not is_valid_label_key(key="/n")  # prefix too short
    assert not is_valid_label_key(key="p/")  # name too short
    assert not is_valid_label_key(key="a" * 254)  # name too long
    assert not is_valid_label_key(key=f"d/{'b' * 64}")  # name too long
    # test first character violations (not alphanum)
    assert not is_valid_label_key(key="-a")
    assert not is_valid_label_key(key=".b")
    assert not is_valid_label_key(key=" c")
    # test last character violations (not alphanum)
    assert not is_valid_label_key(key="a-")
    assert not is_valid_label_key(key="b.")
    assert not is_valid_label_key(key="c ")
    assert not is_valid_label_key(key="sw33T#")
    # test middle characters violations
    assert not is_valid_label_key(key="a$$a")
    assert not is_valid_label_key(key="b  b")


def test_is_valid_label_key_valid_input():
    """
    Verify that is_valid_label_key doesn't report valid input as problematic
    """
    # test valid label keys
    assert is_valid_label_key(key="l0l")
    assert is_valid_label_key(key="l0L")
    assert is_valid_label_key(key="L-l")
    assert is_valid_label_key(key="L.L")
    assert is_valid_label_key(key="4-you")
    assert is_valid_label_key(key="you.2")
    assert is_valid_label_key(key="p/n")
    assert is_valid_label_key(key="prefix/you.2")
    assert is_valid_label_key(key="how.sad/to-see")
    assert is_valid_label_key(key=f"{'d' * 253}/{'n' * 63}")


def test_is_valid_label_value_invalid_input():
    """
    Verify that is_valid_label_value detects whether or
    not a given string is a valid Kubernetes label value:
    """
    # test length violations
    assert not is_valid_label_value(value=f"{'v' * 64}")  # value too long
    # test first character violations (not alphanum)
    assert not is_valid_label_value(value="-")
    assert not is_valid_label_value(value="-a")
    assert not is_valid_label_value(value=".b")
    assert not is_valid_label_value(value=" c")
    # test last character violations (not alphanum)
    assert not is_valid_label_value(value="a-")
    assert not is_valid_label_value(value="b.")
    assert not is_valid_label_value(value="c ")
    assert not is_valid_label_value(value="sw33T#")
    # test middle characters violations
    assert not is_valid_label_value(value="a$$a")
    assert not is_valid_label_value(value="b  b")


def test_is_valid_label_value_valid_input():
    """
    Verify that is_valid_label_value doesn't report valid input as problematic
    """
    # test valid label values
    assert is_valid_label_value(value=None)
    assert is_valid_label_value(value="")
    assert is_valid_label_value(value="l0L")
    assert is_valid_label_value(value="L-l")
    assert is_valid_label_value(value="L.L")
    assert is_valid_label_value(value="l_4")
    assert is_valid_label_value(value="4-you")
    assert is_valid_label_value(value="You.2")


def test_is_valid_annotation_key_invalid_input():
    """
    Verify that is_valid_annotation_key detects whether or
    not a given string is a valid Kubernetes annotation key:
    Valid annotation keys have two segments: an optional prefix and name,
    separated by a slash (/). The name segment is required and must
    be 63 characters or less, beginning and ending with an alphanumeric
    character ([a-z0-9A-Z]) with dashes (-), underscores (_), dots (.),
    and alphanumerics between. The prefix is optional. If specified,
    the prefix must be a DNS subdomain: a series of DNS labels separated
    by dots (.), not longer than 253 characters in total, followed by a slash (/).
    """
    # test length violations
    assert not is_valid_annotation_key(key=None)  # Too short
    assert not is_valid_annotation_key(key="")  # Too short
    assert not is_valid_annotation_key(key=f"{'p' * 254}/n")  # prefix too long
    assert not is_valid_annotation_key(key="/n")  # prefix too short
    assert not is_valid_annotation_key(key="p/")  # name too short
    assert not is_valid_annotation_key(key="a" * 254)  # name too long
    assert not is_valid_annotation_key(key=f"d/{'b' * 64}")  # name too long
    # test first character violations (not alphanum)
    assert not is_valid_annotation_key(key="-a")
    assert not is_valid_annotation_key(key=".b")
    assert not is_valid_annotation_key(key=" c")
    # test last character violations (not alphanum)
    assert not is_valid_annotation_key(key="a-")
    assert not is_valid_annotation_key(key="b.")
    assert not is_valid_annotation_key(key="c ")
    assert not is_valid_annotation_key(key="sw33T#")
    # test middle characters violations
    assert not is_valid_annotation_key(key="a$$a")
    assert not is_valid_annotation_key(key="b  b")


def test_is_valid_annotation_key_valid_input():
    """
    Verify that is_valid_label_key doesn't report valid input as problematic
    """
    # test valid label keys
    assert is_valid_annotation_key(key="l0l")
    assert is_valid_annotation_key(key="l0L")
    assert is_valid_annotation_key(key="L-l")
    assert is_valid_annotation_key(key="L.L")
    assert is_valid_annotation_key(key="4-you")
    assert is_valid_annotation_key(key="you.2")
    assert is_valid_annotation_key(key="p/n")
    assert is_valid_annotation_key(key="prefix/you.2")
    assert is_valid_annotation_key(key="how.sad/to-see")
    assert is_valid_annotation_key(key=f"{'d' * 253}/{'n' * 63}")


def test_is_valid_annotation_value_invalid_input():
    """
    Verify that is_valid_annotation_value detects whether or
    not a given string is a valid Kubernetes annotation value:
    """
    # test valid label values
    assert not is_valid_annotation_value(value=1)


def test_is_valid_annotation_value_valid_input():
    """
    Verify that is_valid_label_value doesn't report valid input as problematic
    """
    # test valid label values
    assert is_valid_annotation_value(value=None)
    assert is_valid_annotation_value(value="")
    assert is_valid_annotation_value(value="l0L")
    assert is_valid_annotation_value(value="L-l")
    assert is_valid_annotation_value(value="L.L")
    assert is_valid_annotation_value(value="l_4")
    assert is_valid_annotation_value(value="4-you")
    assert is_valid_annotation_value(value="You.2")


def test_sanitize_label_value():
    valid_middle_chars = "-_."

    # test min length
    assert sanitize_label_value(None) == ""
    assert sanitize_label_value("") == ""
    # test max length (63)
    assert sanitize_label_value("a" * 63) == "a" * 63
    assert sanitize_label_value("a" * 64) == "a" * 63  # truncated
    # test first and last char
    assert sanitize_label_value("1") == "1"
    assert sanitize_label_value("22") == "22"
    assert sanitize_label_value("3_3") == "3_3"
    assert sanitize_label_value("4u4") == "4u4"
    assert sanitize_label_value("5$5") == "5_5"

    # test first char
    for c in string.printable:
        if c in string.ascii_letters + string.digits:
            # first char is valid
            # no length violation
            assert sanitize_label_value(c) == c
            assert sanitize_label_value(c + "B") == c + "B"
            # max length
            assert sanitize_label_value(c + "B" * 62) == (c + "B" * 62)
            # max length exceeded
            assert sanitize_label_value(c + "B" * 63) == (c + "B" * 62)  # truncated
        else:
            # first char is invalid, e.g. '#a', and becomes the
            # second char, which might require replacement
            rv = c
            if c not in valid_middle_chars:
                rv = "_"
            # no length violation
            assert sanitize_label_value(c) == "a" + rv + "a"
            assert sanitize_label_value(c + "B") == "a" + rv + "B"
            # max length
            assert sanitize_label_value(c + "B" * 62) == ("a" + rv + "B" * 61)  # truncated
            # max length exceeded
            assert sanitize_label_value(c + "B" * 63) == ("a" + rv + "B" * 61)  # truncated

    # test last char
    for c in string.printable:
        if c in string.ascii_letters + string.digits:
            # no length violation
            assert sanitize_label_value("b" + c) == "b" + c
            # max length
            assert sanitize_label_value("b" * 62 + c) == ("b" * 62 + c)
            # max length exceeded
            assert sanitize_label_value("b" * 63 + c) == ("b" * 63)
        else:
            # last char is invalid, e.g. 'a#', and requires
            # patching
            rv = c
            if c not in valid_middle_chars:
                rv = "_"
            # no length violation (char is appended)
            assert sanitize_label_value("b" + c) == "b" + rv + "a"
            # max length (char is replaced)
            assert sanitize_label_value("b" * 62 + c) == ("b" * 62 + "a")
            # max length exceeded (no action required)
            assert sanitize_label_value("b" * 63 + c) == ("b" * 63)

    # test first and last char
    for c in string.printable:
        if c in string.ascii_letters + string.digits:
            # no length violation
            assert sanitize_label_value(c + "b" + c) == c + "b" + c  # nothing is modified
            # max length
            assert sanitize_label_value(c + "b" * 61 + c) == (c + "b" * 61 + c)  # nothing is modified
            # max length exceeded
            assert sanitize_label_value(c + "b" * 62 + c) == c + "b" * 62  # truncate only
        else:
            # first and last characters are invalid, e.g. '#a#'
            rv = c
            if c not in valid_middle_chars:
                rv = "_"
            # no length violation
            assert sanitize_label_value(c + "b" + c) == "a" + rv + "b" + rv + "a"
            # max length
            assert sanitize_label_value(c + "b" * 59 + c) == ("a" + rv + "b" * 59 + rv + "a")
            # max length exceeded after processing, scenario 1
            # resolved by adding char before first, replace last
            assert sanitize_label_value(c + "b" * 60 + c) == ("a" + rv + "b" * 60 + "a")
            # max length exceeded after processing, scenario 2
            # resolved by adding char before first, appending after last
            assert sanitize_label_value(c + "b" * 59 + c) == ("a" + rv + "b" * 59 + rv + "a")
            # max length exceeded before processing, scenario 1
            # resolved by adding char before first, truncating last
            assert sanitize_label_value(c + "b" * 62 + c) == ("a" + rv + "b" * 61)
            # max length exceeded before processing, scenario 2
            # resolved by adding char before first, replacing last
            assert sanitize_label_value(c + "b" * 60 + c * 3) == ("a" + rv + "b" * 60 + "a")

    # test char in a position other than first and last
    # if invalid, the char is replaced with '_'
    for c in string.printable:
        if c in string.ascii_letters + string.digits + "-_.":
            assert sanitize_label_value("A" + c + "Z") == "A" + c + "Z"
        else:
            assert sanitize_label_value("A" + c + "Z") == "A_Z"

    # encore
    assert sanitize_label_value(r"¯\_(ツ)_/¯") == "a_________a"
