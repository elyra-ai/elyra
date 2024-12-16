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
from typing import Dict
from typing import List
from typing import Optional

from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults


class TestOperator(BaseOperator):
    r"""
    Execute a test script.

    :param test_string_default: The test command description
    :type test_string_default: str
    :param test_string_value: The test command description
    :type test_string_value: str
    :param test_string_empty: The test command description
    :type test_string_empty: str
    :param test_bool_default: The test command description
    :type test_bool_default: bool
    :param test_bool_false: The test command description
    :type test_bool_false: bool
    :param test_bool_true: The test command description
    :type test_bool_true: bool
    :param test_int_default: The test command description
    :type test_int_default: int
    :param test_int_zero: The test command description
    :type test_int_zero: int
    :param test_int_non_zero: The test command description
    :type test_int_non_zero: int
    :param test_str_list_default: The test command description
    :type test_str_list_default: list
    :param test_str_list_value: The test command description
    :type test_str_list_value: list
    :param test_str_list_empty: The test command description
    :type test_str_list_empty: list
    :param test_str_dict_default: The test command description
    :type test_str_dict_default: dict
    :param test_str_dict_value: The test command description
    :type test_str_dict_value: dict
    :param test_str_dict_empty: The test command description
    :type test_str_dict_empty: dict
    """

    @apply_defaults
    def __init__(
        self,
        test_string_default: str,
        test_bool_default: bool,
        test_int_default: int,
        test_str_list_default: Optional[List[str]],
        test_str_dict_default: Optional[Dict[str, str]],
        test_string_value: str = "default",
        test_string_empty: str = "",
        test_bool_false: bool = False,
        test_bool_true: bool = True,
        test_int_zero: int = 0,
        test_int_non_zero: int = 1,
        test_str_list_value: Optional[List[str]] = ["test"],
        test_str_list_empty: Optional[List[str]] = None,
        test_str_dict_value: Optional[Dict[str, str]] = {"test": "test"},
        test_str_dict_empty: Optional[Dict[str, str]] = None,
        *args,
        **kwargs,
    ) -> None:
        super().__init__(*args, **kwargs)
