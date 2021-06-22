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
import json

import jupyter_core.paths
import os
import urllib

from elyra.pipeline.component_parser_airflow import AirflowComponentParser
from elyra.pipeline.component_registry import ComponentRegistry

COMPONENT_CATALOG_DIRECORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], 'components')


def _read_component_resource(component_filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, 'resources', 'components', component_filename)

    with open(resource_path, 'rb') as f:
        component_body = f.readlines()

    return component_body


def _read_component_resource_from_url(component_url):
        component_body = urllib.request.urlopen(component_url)  # noqa E131
        return component_body.readlines()


def test_component_registry_can_load_components_from_catalog():
    component_catalog = os.path.join(COMPONENT_CATALOG_DIRECORY, 'airflow_component_catalog.json')
    component_parser = AirflowComponentParser()
    component_registry = ComponentRegistry(component_catalog, component_parser)

    components = component_registry.get_all_components()
    print(json.dumps(components, indent=2))
    assert len(components) > 0


def test_parse_airflow_component_file():
    parser = AirflowComponentParser()

    test_filename = 'airflow_test_operator.py'
    airflow_component = _read_component_resource(test_filename)

    properties = parser.parse_component_properties(airflow_component, test_filename)

    assert properties['current_parameters']['testoperator_test_string_no_default'] == ''
    assert properties['current_parameters']['testoperator_test_bool_default'] is False
    assert properties['current_parameters']['testoperator_elyra_int_test_int_default'] == 0
    assert properties['current_parameters']['testoperator_elyra_dict_test_dict_default'] == ''  # {}
    assert properties['current_parameters']['testoperator_test_list_default'] == ''  # []

    assert properties['current_parameters']['testoperator_test_string_default_value'] == 'default'
    assert properties['current_parameters']['testoperator_test_string_default_empty'] == ''

    assert properties['current_parameters']['testoperator_test_bool_false'] is False
    assert properties['current_parameters']['testoperator_test_bool_true'] is True

    assert properties['current_parameters']['testoperator_elyra_int_test_int_zero'] == 0
    assert properties['current_parameters']['testoperator_elyra_int_test_int_non_zero'] == 1


def test_parse_airflow_bash_component_url():
    parser = AirflowComponentParser()

    test_url = 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/bash_operator.py'
    test_filename = 'bash_operator.py'
    airflow_component = _read_component_resource_from_url(test_url)

    properties = parser.parse_component_properties(airflow_component, test_filename)

    assert properties['current_parameters']['bashoperator_bash_command'] == ''
    assert properties['current_parameters']['bashoperator_xcom_push'] is False
    assert properties['current_parameters']['bashoperator_elyra_dict_env'] == ''  # {}
    assert properties['current_parameters']['bashoperator_output_encoding'] == 'utf-8'


def test_parse_all_airflow_sample_components():
    components = {
        'bash_operator.py': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/bash_operator.py',  # noqa: E501
        'email_operator.py': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/email_operator.py',  # noqa: E501
        'http_operator.py': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/http_operator.py',  # noqa: E501
        'spark_jdbc_operator.py': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/contrib/operators/spark_jdbc_operator.py',  # noqa: E501
        'spark_sql_operator.py': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/contrib/operators/spark_sql_operator.py',  # noqa: E501
        'spark_submit_operator.py': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/contrib/operators/spark_submit_operator.py',  # noqa: E501
    }
    parser = AirflowComponentParser()

    for component_file_name, component_url in components.items():
        component = _read_component_resource_from_url(component_url)
        properties = parser.parse_component_properties(component, component_file_name)

        assert len(properties['current_parameters']) > 0
