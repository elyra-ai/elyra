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
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults


class TestOperator(BaseOperator):
    r"""
    Execute a test script.

    :param test_command: The test command description
    :type test_command: str
    :param test_bool: The test command bool description
    :type test_bool: bool
    :param test_int: The test command int description
    :type test_int: int
    """

    @apply_defaults
    def __init__(self,
                 test_command,
                 test_bool=False,
                 test_int=0,
                 *args, **kwargs):

        super(TestOperator, self).__init__(*args, **kwargs)
