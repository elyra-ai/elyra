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
import os
import json
import urllib

from elyra.pipeline.registry import AirflowComponentParser


def _read_component_resource(component_filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, 'resources', 'components', component_filename)

    with open(resource_path, 'rb') as f:
        component_body = f.readlines()

    return component_body


def _read_component_resource_from_url(component_url):
        component_body = urllib.request.urlopen(component_url)  # noqa E131
        return component_body.readlines()


def test_parse_airflow_component_file():
    parser = AirflowComponentParser()

    test_filename = 'airflow_test_operator.py'
    airflow_component = _read_component_resource(test_filename)

    properties = parser.parse_component_properties(airflow_component, test_filename)

    assert properties['current_parameters']['testoperator_test_string_no_default'] == ''
    assert properties['current_parameters']['testoperator_test_string_default_value'] == 'default'
    assert properties['current_parameters']['testoperator_test_string_default_empty'] == None
    assert properties['current_parameters']['testoperator_test_bool_default'] is False
    assert properties['current_parameters']['testoperator_test_bool_false'] is False
    assert properties['current_parameters']['testoperator_test_bool_true'] is True
    assert properties['current_parameters']['testoperator_elyra_int_test_int_default'] is None
    assert properties['current_parameters']['testoperator_elyra_int_test_int_zero'] == 0
    assert properties['current_parameters']['testoperator_elyra_int_test_int_non_zero'] == 1


def test_parse_airflow_component_url():
    parser = AirflowComponentParser()

    test_url = 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/bash_operator.py'
    test_filename = 'bash_operator.py'
    airflow_component = _read_component_resource_from_url(test_url)

    properties = parser.parse_component_properties(airflow_component, test_filename)

    assert properties['current_parameters']['bashoperator_bash_command'] == ''
    assert properties['current_parameters']['bashoperator_xcom_push'] == False
    assert properties['current_parameters']['bashoperator_elyra_dict_env'] == None
    assert properties['current_parameters']['bashoperator_output_encoding'] == 'utf-8'
