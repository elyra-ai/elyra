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
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from airflow.models import BaseOperator
from airflow.operators.imported_operator import ImportedOperator  # noqa TODO


class TestOperator(BaseOperator):
    r"""
    Operator derives from BaseOperator and mimics Airflow v1 Operator structure.
    Note that some parameters have been intentionally omitted from the docstring
    in order to test that fallback types are assigned appropriately.

    :param str_no_default: a string parameter with no default given
    :type str_no_default: str
    :param bool_no_default: a boolean parameter with no default given
    :type bool_no_default: bool
    :param int_no_default: an integer parameter with no default given
    :type int_no_default: int
    :param str_default: a string parameter with a default value given
    :type str_default: str
    :param bool_default_true: a boolean parameter with a default value of True
    :type bool_default_true: bool
    :param bool_default_false: a boolean parameter with a default value of False
    :type bool_default_false: bool
    :param int_default_non_zero: an integer parameter with a non-zero default value
    :type int_default_non_zero: int
    :param int_default_zero: an integer parameter with a default value of 0
    :type int_default_zero: int
    :param str_empty: a string parameter with a default value of None
    :type str_empty: str
    :param list_default_is_none: an list parameter with a default of None
    :type list_default_is_none: list
    :param dict_default_is_none: a dictionary parameter with a default of None
    :type dict_default_is_none: dict
    :param unusual_type_dict: a dictionary parameter with the phrase 'list' in type description
    :type unusual_type_dict: a dictionary of arrays
    :param unusual_type_list: a list parameter with the phrase 'string' in type description
    :type unusual_type_list: a list of strings
    :param long_description_property: a string parameter with a very long description
        that wraps lines and also has an escaped underscore in it, as shown here: (\_)
    :type long_description_property: str
    :param: mounted_volumes: a property with the same name as an Elyra system property
    :type: str
    """  # noqa W605

    def __init__(
        self,
        str_no_default,
        bool_no_default,
        int_no_default,
        str_default="default",
        bool_default_true=True,
        bool_default_false=False,
        int_default_non_zero=2,
        int_default_zero=0,
        str_empty=None,
        list_default_is_none=None,
        dict_default_is_none=None,
        str_not_in_docstring="",
        bool_not_in_docstring=False,
        int_not_in_docstring=3,
        unusual_type_dict=None,
        unusual_type_list=None,
        fallback_type=None,
        long_description_property=None,
        mounted_volumes=None,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)

    def execute(self, context: Any):
        pass


class DeriveFromTestOperator(TestOperator):
    """
    Operator derives indirectly from BaseOperator and mimics Airflow v2 Operator
    structure, including type hints given for all parameters

    :param str_no_default: a string parameter with no default given
    :type str_no_default: str
    :param bool_no_default: a boolean parameter with no default given
    :type bool_no_default: bool
    :param int_no_default: an integer parameter with no default given
    :type int_no_default: int
    :param str_default: a string parameter with a default value given
    :type str_default: str
    :param bool_default: a boolean parameter with a default value given
    :type bool_default: bool
    :param int_default: an integer parameter with a default value given
    :type int_default: int
    :param str_optional_default: an Optional string parameter with a default value given
    :type str_optional_default: Optional[str]
    :param list_optional_default: an Optional list parameter with a default of None
    :type list_optional_default: Optional[list]
    """

    def __init__(
        self,
        *,
        str_no_default: str,
        bool_no_default: bool,
        int_no_default: int,
        str_not_in_docstring: str,
        bool_not_in_docstring: bool,
        int_not_in_docstring: int,
        str_default: str = "default",
        bool_default: bool = True,
        int_default: int = 2,
        str_optional_default: Optional[str] = "optional default",
        list_optional_default: Optional[List] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)

    def execute(self, context: Any):
        pass


class DeriveFromImportedOperator(ImportedOperator):
    """
    Operator derives from an airflow package Operator (and therefore indirectly
    extends the BaseOperator) and whose parameters are list and dictionary types

    :param dict_no_default: a dictionary parameter with no default given
    :type dict_no_default: dict
    :param list_no_default: a list parameter with no default given
    :type list_no_default: list
    :param dict_optional_no_default: an optional dictionary parameter with no default given
    :type dict_optional_no_default: Optional[Dict[str, str]]
    :param list_optional_no_default: an optional list parameter with no default given
    :type list_optional_no_default: Optional[List[int]]
    :param nested_dict_default: a nested dictionary parameter with a default value
    :type nested_dict_default: Dict[str, Dict[str, str]]
    :param list_default: a list parameter with a default value
    :type list_default: List[str]
    :param list_optional_default: a list parameter with a default value of None
    :type list_optional_default: Optional[List[str]]
    """

    def __init__(
        self,
        *,
        dict_no_default: Dict,
        list_no_default: List,
        dict_optional_no_default: Optional[Dict[str, str]],
        list_optional_no_default: Optional[List[int]],
        nested_dict_default: Dict[str, Dict[str, str]] = None,
        list_default: List[str] = None,
        list_optional_default: Optional[List[str]] = None,
        list_not_in_docstring: List[str],
        dict_not_in_docstring: Dict[str, str],
        **kwargs,
    ):
        super().__init__(**kwargs)

    def execute(self, context: Any):
        pass


class HelperClass1:
    """
    A class that should not be picked up by the parser as it does not
    derive from an Operator class
    """

    def __init__(self, myvar1, *args, **kwargs):
        super().__init__(*args, **kwargs)


class HelperClass2(object):
    """
    Another class that should not be picked up by the parser as it does not
    derive from an Operator class
    """

    def __init__(self, myvar2, *args, **kwargs):
        super().__init__(*args, **kwargs)
