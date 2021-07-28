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
from elyra.pipeline.component_parser_kfp import KfpComponentParser
from elyra.pipeline.component_registry import ComponentRegistry

COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], 'components')


def _get_resource_path(filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, 'resources', 'components', filename)

    return resource_path


def test_component_registry_can_load_components_from_catalog():
    component_registry_location = os.path.join(COMPONENT_CATALOG_DIRECTORY, 'kfp_component_catalog.json')
    component_parser = KfpComponentParser()
    component_registry = ComponentRegistry(component_registry_location, component_parser)

    components = component_registry.get_all_components()
    assert len(components) > 0


def test_parse_kfp_component_file():
    entry = {
        'id': 'elyra_op_test-operator_TestOperator',
        'name': 'Test Operator',
        'type': FilesystemComponentReader.type,
        'location': _get_resource_path('kfp_test_operator.yaml'),
        'catalog_entry_id': '',
        'category_id': 'kfp'
    }
    component_entry = SimpleNamespace(**entry)

    parser = KfpComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentRegistry.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
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

    # Ensure that the 'required' attribute was set correctly. KFP components default to required
    # unless explicitly marked otherwise in component YAML.
    required_property = next(prop for prop in properties_json['uihints']['parameter_info']
                             if prop.get('parameter_ref') == 'elyra_test_required_property')
    assert required_property['data']['required'] is True

    optional_property = next(prop for prop in properties_json['uihints']['parameter_info']
                             if prop.get('parameter_ref') == 'elyra_test_optional_property')
    assert optional_property['data']['required'] is False

    default_required_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                     if prop.get('parameter_ref') == 'elyra_test_required_property_default')
    assert default_required_property['data']['required'] is True

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

    file_property = next(prop for prop in properties_json['uihints']['parameter_info']
                         if prop.get('parameter_ref') == 'elyra_test_unusual_type_file')
    assert file_property['data']['format'] == "file"

    no_type_property = next(prop for prop in properties_json['uihints']['parameter_info']
                            if prop.get('parameter_ref') == 'elyra_test_unusual_type_notgiven')
    assert no_type_property['data']['format'] == "string"

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert unusual_dict_property['description']['default'] == "The test command description "\
                                                              "(type: Dictionary of arrays)"
    assert unusual_list_property['description']['default'] == "The test command description (type: An array)"
    assert unusual_string_property['description']['default'] == "The test command description (type: A string)"
    assert file_property['description']['default'] == "The test command description (type: Notebook)"
    assert no_type_property['description']['default'] == "The test command description (type: string)"


def test_parse_kfp_component_url():
    entry = {
        'id': 'run-notebook-using-papermill',
        'name': 'Run Notebook Using Papermill',
        'type': UrlComponentReader.type,
        'location': 'https://raw.githubusercontent.com/kubeflow/pipelines/1.4.1/components/notebooks/Run_notebook_using_papermill/component.yaml',  # noqa: E501
        'catalog_entry_id': '',
        'category_id': 'kfp'
    }
    component_entry = SimpleNamespace(**entry)
    parser = KfpComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentRegistry.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json['current_parameters']['label'] == ''
    assert properties_json['current_parameters']['component_source'] == component_entry.location
    assert properties_json['current_parameters']['elyra_notebook'] == ''
    assert properties_json['current_parameters']['elyra_parameters'] == '{}'
    assert properties_json['current_parameters']['elyra_packages_to_install'] == ''  # {}
    assert properties_json['current_parameters']['elyra_input_data'] == ''


async def test_parse_components_invalid_location():
    # Ensure a component with an invalid location is not returned
    component_registry_location = os.path.join(os.path.dirname(__file__),
                                               'resources/components',
                                               'kfp_component_catalog_invalid.json')
    component_parser = KfpComponentParser()
    component_registry = ComponentRegistry(component_registry_location, component_parser)

    components = component_registry.get_all_components()
    assert len(components) == 0

    categories = component_registry.get_all_categories()
    assert len(categories) == 0

    palette_json = ComponentRegistry.to_canvas_palette(components, categories)
    empty_palette = {
        "version": "3.0",
        "categories": []
    }
    assert palette_json == empty_palette
