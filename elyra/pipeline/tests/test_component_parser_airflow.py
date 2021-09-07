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
from types import SimpleNamespace

import jupyter_core.paths

from elyra.pipeline.component import FilesystemComponentReader
from elyra.pipeline.component import UrlComponentReader
from elyra.pipeline.component_parser_airflow import AirflowComponentParser
from elyra.pipeline.component_registry import ComponentRegistry

COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], 'components')


def _get_resource_path(filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, 'resources', 'components', filename)

    return resource_path


def test_component_registry_can_load_components_from_catalog():
    component_parser = AirflowComponentParser()
    component_registry = ComponentRegistry(component_parser)

    components = component_registry.get_all_components()
    assert len(components) > 0


def test_parse_airflow_component_file():
    # Define the appropriate reader for a filesystem-type component definition
    airflow_supported_file_types = [".py"]
    reader = FilesystemComponentReader(airflow_supported_file_types)

    # Get path to component definition file and read contents
    path = _get_resource_path('airflow_test_operator.py')
    component_definition = reader.read_component_definition(path)

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = AirflowComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentRegistry.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not), and hold correct values
    assert properties_json['current_parameters']['label'] == ''
    assert properties_json['current_parameters']['component_source'] == component_entry.location
    assert properties_json['current_parameters']['elyra_test_string_no_default'] == ''
    assert properties_json['current_parameters']['elyra_test_string_default_value'] == 'default'
    assert properties_json['current_parameters']['elyra_test_string_default_empty'] == ''

    assert properties_json['current_parameters']['elyra_test_bool_default'] is False
    assert properties_json['current_parameters']['elyra_test_bool_false'] is False
    assert properties_json['current_parameters']['elyra_test_bool_true'] is True

    assert properties_json['current_parameters']['elyra_test_int_default'] == 0
    assert properties_json['current_parameters']['elyra_test_int_zero'] == 0
    assert properties_json['current_parameters']['elyra_test_int_non_zero'] == 1

    assert properties_json['current_parameters']['elyra_test_dict_default'] == ''  # {}
    assert properties_json['current_parameters']['elyra_test_list_default'] == ''  # []

    # Ensure that type information is inferred correctly
    unusual_dict_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                 if prop.get('parameter_ref') == 'elyra_test_unusual_type_dict')
    assert unusual_dict_property['data']['format'] == "dictionary"

    unusual_list_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                 if prop.get('parameter_ref') == 'elyra_test_unusual_type_list')
    assert unusual_list_property['data']['format'] == "list"

    unusual_string_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                   if prop.get('parameter_ref') == 'elyra_test_unusual_type_string')
    assert unusual_string_property['data']['format'] == "string"

    no_type_property = next(prop for prop in properties_json['uihints']['parameter_info']
                            if prop.get('parameter_ref') == 'elyra_test_unusual_type_notgiven')
    assert no_type_property['data']['format'] == "string"

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert unusual_dict_property['description']['default'] == "The test command description "\
                                                              "(type: a dictionary of arrays)"
    assert unusual_list_property['description']['default'] == "The test command description (type: a list of strings)"
    assert unusual_string_property['description']['default'] == "The test command description (type: a string)"
    assert no_type_property['description']['default'] == "The test command description (type: string)"


def test_parse_airflow_component_url():
    # Define the appropriate reader for a Url-type component definition
    airflow_supported_file_types = [".py"]
    reader = UrlComponentReader(airflow_supported_file_types)

    # Get path to component definition file and read contents
    path = 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/bash_operator.py'  # noqa: E501
    component_definition = reader.read_component_definition(path)

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = AirflowComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentRegistry.to_canvas_properties(component)

    # Ensure component parameters are prefixed, and system parameters are not, and hold correct values
    assert properties_json['current_parameters']['label'] == ''
    assert properties_json['current_parameters']['component_source'] == component_entry.location
    assert properties_json['current_parameters']['elyra_bash_command'] == ''
    assert properties_json['current_parameters']['elyra_xcom_push'] is False
    assert properties_json['current_parameters']['elyra_env'] == ''  # {}
    assert properties_json['current_parameters']['elyra_output_encoding'] == 'utf-8'


def test_parse_airflow_component_file_no_inputs():
    # Define the appropriate reader for a filesystem-type component definition
    airflow_supported_file_types = [".py"]
    reader = FilesystemComponentReader(airflow_supported_file_types)

    # Get path to component definition file and read contents
    path = _get_resource_path('airflow_test_operator_no_inputs.py')
    component_definition = reader.read_component_definition(path)

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = AirflowComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentRegistry.to_canvas_properties(component)

    # Properties JSON should only include the two parameters common to every
    # component:'label' and 'component_source'
    num_common_params = 2
    assert len(properties_json['current_parameters'].keys()) == num_common_params
    assert len(properties_json['parameters']) == num_common_params
    assert len(properties_json['uihints']['parameter_info']) == num_common_params
    assert len(properties_json['uihints']['group_info'][0]['group_info']) == num_common_params

    # Ensure that template still renders the two common parameters correctly
    assert properties_json['current_parameters']['label'] == ""
    assert properties_json['current_parameters']['component_source'] == component_entry.location


async def test_parse_components_url_invalid_location():
    # Define the appropriate reader for a Url-type component definition
    airflow_supported_file_types = [".py"]
    reader = UrlComponentReader(airflow_supported_file_types)

    # Get path to an invalid component definition file and read contents
    invalid_path = 'https://nourl.py'
    component_definition = reader.read_component_definition(invalid_path)
    assert component_definition is None

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": invalid_path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = AirflowComponentParser()
    component = parser.parse(component_entry)
    assert component is None
