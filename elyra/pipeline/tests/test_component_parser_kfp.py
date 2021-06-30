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
import requests

import jupyter_core.paths
import os

from elyra.pipeline.component_parser_kfp import KfpComponentParser
from elyra.pipeline.component_registry import ComponentRegistry

COMPONENT_CATALOG_DIRECORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], 'components')


def _read_component_resource(component_filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, 'resources', 'components', component_filename)

    with open(resource_path, 'rb') as f:
        return f.read().decode()


def _read_component_resource_from_url(component_url):
    res = requests.get(component_url)
    return res.text


def test_component_registry_can_load_components_from_catalog():
    component_catalog = os.path.join(COMPONENT_CATALOG_DIRECORY, 'kfp_component_catalog.json')
    component_parser = KfpComponentParser()
    component_registry = ComponentRegistry(component_catalog, component_parser)

    components = component_registry.get_all_components()
    assert len(components) > 0


def test_parse_kfp_component_file():
    parser = KfpComponentParser()

    test_filename = 'kfp_test_operator.yaml'
    component_definition = _read_component_resource(test_filename)

    # properties_obj = parser.parse_properties("elyra_op_test-operator_TestOperator",
    #                                          component_definition, test_filename, "filename")
    component = parser.parse("elyra_op_test-operator_TestOperator", component_definition)[0]
    properties = ComponentRegistry.to_canvas_properties(component)

    properties_json = json.loads(properties)

    assert properties_json['current_parameters']['elyra_airflow_test_string_no_default'] == ''
    assert properties_json['current_parameters']['elyra_airflow_test_bool_default'] is False
    assert properties_json['current_parameters']['elyra_airflow_elyra_int_test_int_default'] == 0
    assert properties_json['current_parameters']['elyra_airflow_elyra_dict_test_dict_default'] == ''  # {}
    assert properties_json['current_parameters']['elyra_airflow_test_list_default'] == ''  # []

    assert properties_json['current_parameters']['elyra_airflow_test_string_default_value'] == 'default'
    assert properties_json['current_parameters']['elyra_airflow_test_string_default_empty'] == ''

    assert properties_json['current_parameters']['elyra_airflow_test_bool_false'] is False
    assert properties_json['current_parameters']['elyra_airflow_test_bool_true'] is True

    assert properties_json['current_parameters']['elyra_airflow_elyra_int_test_int_zero'] == 0
    assert properties_json['current_parameters']['elyra_airflow_elyra_int_test_int_non_zero'] == 1


def test_parse_kfp_bash_component_url():
    parser = KfpComponentParser()

    test_url = 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/bash_operator.py'
    test_filename = 'bash_operator.py'
    kfp_component = _read_component_resource_from_url(test_url)

    properties_obj = parser.parse_properties("elyra_op_bash-operator_BashOperator",
                                             kfp_component, test_filename, "url")
    component = parser.parse("elyra_op_bash-operator_BashOperator", kfp_component, properties_obj)[0]
    properties = ComponentRegistry.to_canvas_properties(component)

    properties_json = json.loads(properties)

    assert properties_json['current_parameters']['elyra_airflow_bash_command'] == ''
    assert properties_json['current_parameters']['elyra_airflow_xcom_push'] is False
    assert properties_json['current_parameters']['elyra_airflow_elyra_dict_env'] == ''  # {}
    assert properties_json['current_parameters']['elyra_airflow_output_encoding'] == 'utf-8'


def test_parse_all_kfp_sample_components():
    components = {
        'Bash Operator': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/bash_operator.py',  # noqa: E501
        'Email Operator': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/email_operator.py',  # noqa: E501
        'Spark JDBC Operator': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/contrib/operators/spark_jdbc_operator.py',  # noqa: E501
        'Spark Sql Operator': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/contrib/operators/spark_sql_operator.py',  # noqa: E501
        'Spark Submit Operator': 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/contrib/operators/spark_submit_operator.py',  # noqa: E501
    }
    parser = KfpComponentParser()

    for component_file_name, component_url in components.items():
        kfp_component = _read_component_resource_from_url(component_url)

        op_name = component_file_name.replace(" ", "-").lower()
        class_name = component_file_name.replace(" ", "")

        properties_obj = parser.parse_properties(f"elyra_op_{op_name}_{class_name}",
                                                 kfp_component, component_url, "url")
        component = parser.parse(f"elyra_op_{op_name}_{class_name}", kfp_component, properties_obj)[0]
        properties = ComponentRegistry.to_canvas_properties(component)
        properties_json = json.loads(properties)

        assert len(properties_json['current_parameters']) > 0
