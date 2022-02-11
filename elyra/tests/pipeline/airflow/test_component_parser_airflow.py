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
import os
from types import SimpleNamespace

from conftest import AIRFLOW_COMPONENT_CACHE_INSTANCE
from conftest import TEST_CATALOG_NAME
import jupyter_core.paths
import pytest

from elyra.metadata.metadata import Metadata
from elyra.pipeline.catalog_connector import FilesystemComponentCatalogConnector
from elyra.pipeline.catalog_connector import UrlComponentCatalogConnector
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.runtime_type import RuntimeProcessorType

COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], 'components')
RUNTIME_PROCESSOR = RuntimeProcessorType.APACHE_AIRFLOW


@pytest.fixture
def invalid_url(request):
    return request.param


def _get_resource_path(filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, '..', '..', '..', 'tests/pipeline', 'resources', 'components', filename)
    resource_path = os.path.normpath(resource_path)

    return resource_path


@pytest.mark.parametrize('component_cache_instance', [AIRFLOW_COMPONENT_CACHE_INSTANCE], indirect=True)
def test_component_catalog_can_load_components_from_registries(component_cache_instance):
    components = ComponentCache.instance().get_all_components(RUNTIME_PROCESSOR)
    assert len(components) > 0


def test_modify_component_catalogs(metadata_manager_with_teardown):
    # Initialize a ComponentCache instance and wait for all worker threads to compete
    component_catalog = ComponentCache.instance()
    component_catalog.wait_for_all_cache_updates()

    # Get initial set of components from the current active registries
    initial_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)

    # Components must be sorted by id for the equality comparison with later component lists
    initial_components = sorted(initial_components, key=lambda component: component.id)

    # Create new registry instance with a single URL-based component
    urls = ["https://raw.githubusercontent.com/elyra-ai/elyra/master/elyra/tests/pipeline/resources/components/"
            "airflow_test_operator.py"]

    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": urls
    }
    registry_instance = Metadata(schema_name="url-catalog",
                                 name=TEST_CATALOG_NAME,
                                 display_name="New Test Registry",
                                 metadata=instance_metadata)

    metadata_manager_with_teardown.create(TEST_CATALOG_NAME, registry_instance)

    # Wait for update to complete
    component_catalog.wait_for_all_cache_updates()

    # Get new set of components from all active registries, including added test registry
    added_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)
    added_components = sorted(added_components, key=lambda component: component.id)
    assert len(added_components) > len(initial_components)

    added_component_names = [component.name for component in added_components]
    assert 'TestOperator' in added_component_names
    assert 'TestOperatorNoInputs' not in added_component_names

    # Modify the test registry to add an additional path to
    urls.append("https://raw.githubusercontent.com/elyra-ai/elyra/master/elyra/tests/pipeline/resources/components"
                "/airflow_test_operator_no_inputs.py")
    metadata_manager_with_teardown.update(TEST_CATALOG_NAME, registry_instance)

    # Wait for update to complete
    component_catalog.wait_for_all_cache_updates()

    # Get set of components from all active registries, including modified test registry
    modified_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)
    modified_components = sorted(modified_components, key=lambda component: component.id)
    assert len(modified_components) > len(added_components)

    modified_component_names = [component.name for component in modified_components]
    assert 'TestOperator' in modified_component_names
    assert 'TestOperatorNoInputs' in modified_component_names

    # Delete the test registry
    metadata_manager_with_teardown.remove(TEST_CATALOG_NAME)

    # Wait for update to complete
    component_catalog.wait_for_all_cache_updates()

    post_delete_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)
    post_delete_components = sorted(post_delete_components, key=lambda component: component.id)
    assert len(post_delete_components) == len(initial_components)

    # Check that the list of component ids is the same as before addition of the test registry
    initial_component_ids = [component.id for component in initial_components]
    post_delete_component_ids = [component.id for component in post_delete_components]
    assert post_delete_component_ids == initial_component_ids

    # Check that component palette is the same as before addition of the test registry
    initial_palette = ComponentCache.to_canvas_palette(initial_components)
    post_delete_palette = ComponentCache.to_canvas_palette(post_delete_components)
    assert initial_palette == post_delete_palette


def test_directory_based_component_catalog(metadata_manager_with_teardown):
    # Initialize a ComponentCache instance and wait for all worker threads to compete
    component_catalog = ComponentCache.instance()
    component_catalog.wait_for_all_cache_updates()

    # Get initial set of components from the current active registries
    initial_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)

    # Create new directory-based registry instance with components in ../../test/resources/components
    registry_path = _get_resource_path('')
    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": [registry_path]
    }
    registry_instance = Metadata(schema_name="local-directory-catalog",
                                 name=TEST_CATALOG_NAME,
                                 display_name="New Test Registry",
                                 metadata=instance_metadata)

    metadata_manager_with_teardown.create(TEST_CATALOG_NAME, registry_instance)

    # Wait for update to complete
    component_catalog.wait_for_all_cache_updates()

    # Get new set of components from all active registries, including added test registry
    added_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)
    assert len(added_components) > len(initial_components)

    # Check that all relevant components from the new registry have been added
    added_component_names = [component.name for component in added_components]
    assert 'TestOperator' in added_component_names
    assert 'TestOperatorNoInputs' in added_component_names


def test_parse_airflow_component_file():
    # Define the appropriate reader for a filesystem-type component definition
    airflow_supported_file_types = [".py"]
    reader = FilesystemComponentCatalogConnector(airflow_supported_file_types)

    path = _get_resource_path('airflow_test_operator.py')

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    component_definition = reader.read_catalog_entry({"path": path}, {})

    # Build entry for parsing
    catalog_type = "local-file-catalog"
    entry = {
        "component_id": reader.get_unique_component_hash(catalog_type, {"path": path}, ["path"]),
        "catalog_type": catalog_type,
        "categories": ["Test"],
        "component_definition": component_definition,
        "component_identifier": {"path": path}
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = ComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    components = parser.parse(component_entry)
    assert len(components) == 3  # TestOperator, DeriveFromTestOperator, and DeriveFromImportedOperator

    # Split components list into its constituent operators
    components = sorted(components, key=lambda component: component.id)
    import_test_op, derive_test_op, test_op = components[0], components[1], components[2]

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter_value(param_name):
        property_dict = properties_json['current_parameters'][param_name]
        return property_dict[property_dict['activeControl']]

    # Helper method to retrieve the requested parameter info from the dictionary
    def get_parameter_format(param_name, control_id='StringControl'):
        param_info = None
        for prop_info in properties_json['uihints']['parameter_info']:
            if prop_info.get('parameter_ref') == param_name:
                param_info = prop_info['data']['controls'][control_id]['format']
                break

        return param_info

    # Helper method to retrieve the requested parameter description from the dictionary
    def get_parameter_description(param_name):
        param_desc = None
        for prop_info in properties_json['uihints']['parameter_info']:
            if prop_info.get('parameter_ref') == param_name:
                param_desc = prop_info['description']['default']
                break

        return param_desc

    # Helper method to retrieve whether the requested parameter is required
    def get_parameter_required(param_name):
        param_info = None
        for prop_info in properties_json['uihints']['parameter_info']:
            if prop_info.get('parameter_ref') == param_name:
                param_info = prop_info['data']['required']
                break

        return param_info

    # Retrieve properties for TestOperator
    # Test Operator does not include type hints for the init function args
    properties_json = ComponentCache.to_canvas_properties(test_op)

    # Ensure system parameters are not prefixed and hold correct values
    assert properties_json['current_parameters']['label'] == ''

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source

    # Ensure component parameters are prefixed with 'elyra_' and values are as expected
    assert get_parameter_value('elyra_str_no_default') == ''
    assert get_parameter_value('elyra_str_default') == 'default'
    assert get_parameter_value('elyra_str_empty') == ''
    assert get_parameter_value('elyra_str_not_in_docstring') == ''

    assert get_parameter_value('elyra_bool_no_default') is False
    assert get_parameter_value('elyra_bool_default_false') is False
    assert get_parameter_value('elyra_bool_default_true') is True
    assert get_parameter_value('elyra_bool_not_in_docstring') is False

    assert get_parameter_value('elyra_int_no_default') == 0
    assert get_parameter_value('elyra_int_default_zero') == 0
    assert get_parameter_value('elyra_int_default_non_zero') == 2
    assert get_parameter_value('elyra_int_not_in_docstring') == 3

    assert get_parameter_value('elyra_dict_default_is_none') == '{}'  # {}
    assert get_parameter_value('elyra_list_default_is_none') == '[]'  # []

    # Ensure that type information is inferred correctly for properties that
    # define 'unusual' types, such as 'a dictionary of lists'
    assert get_parameter_format('elyra_unusual_type_dict') == 'dictionary'
    assert get_parameter_format('elyra_unusual_type_list') == 'list'

    # Ensure that type information falls back to string if no type hint present
    # and no ':type: <type info>' phrase found in docstring
    assert get_parameter_format('elyra_fallback_type') == 'string'

    # Ensure component parameters are marked as required in the correct circumstances
    # (parameter is required if there is no default value provided or if a type hint
    # does not include 'Optional[...]')
    assert get_parameter_required('elyra_str_no_default') is True
    assert get_parameter_required('elyra_str_default') is False
    assert get_parameter_required('elyra_str_empty') is False

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert get_parameter_description('elyra_unusual_type_dict') == "a dictionary parameter with the " \
                                                                   "phrase 'list' in type description "\
                                                                   "(type: a dictionary of arrays)"
    assert get_parameter_description('elyra_unusual_type_list') == "a list parameter with the phrase " \
                                                                   "'string' in type description " \
                                                                   "(type: a list of strings)"
    assert get_parameter_description('elyra_fallback_type') == "(type: str)"

    # Retrieve properties for DeriveFromTestOperator
    # DeriveFromTestOperator includes type hints for all init arguments
    properties_json = ComponentCache.to_canvas_properties(derive_test_op)

    # Ensure default values are parsed correct in the case where type hints are present
    assert get_parameter_value('elyra_str_default') == 'default'
    assert get_parameter_value('elyra_bool_default') is True
    assert get_parameter_value('elyra_int_default') == 2

    # Ensure component parameters are prefixed with 'elyra_' and types are as expected
    # in the case when a type hint is provided (and regardless of whether or not the
    # parameter type is included in the docstring)
    assert get_parameter_format('elyra_str_no_default') == 'string'
    assert get_parameter_format('elyra_str_default') == 'string'
    assert get_parameter_format('elyra_str_optional_default') == 'string'
    assert get_parameter_format('elyra_str_not_in_docstring') == 'string'

    assert get_parameter_format('elyra_bool_no_default', 'BooleanControl') == 'boolean'
    assert get_parameter_format('elyra_bool_default', 'BooleanControl') == 'boolean'
    assert get_parameter_format('elyra_bool_not_in_docstring', 'BooleanControl') == 'boolean'

    assert get_parameter_format('elyra_int_no_default', 'NumberControl') == 'number'
    assert get_parameter_format('elyra_int_default', 'NumberControl') == 'number'
    assert get_parameter_format('elyra_int_not_in_docstring', 'NumberControl') == 'number'

    assert get_parameter_format('elyra_list_optional_default') == 'list'

    # Ensure component parameters are marked as required in the correct circumstances
    assert get_parameter_required('elyra_str_no_default') is True
    assert get_parameter_required('elyra_str_default') is False
    assert get_parameter_required('elyra_str_optional_default') is False
    assert get_parameter_required('elyra_str_not_in_docstring') is True

    # Retrieve properties for DeriveFromImportedOperator
    # DeriveFromImportedOperator includes type hints for  dictionary and
    # list values to test the more complex parsing required in this case
    properties_json = ComponentCache.to_canvas_properties(import_test_op)

    # Ensure component parameters are prefixed with 'elyra_' and types are as expected
    assert get_parameter_format('elyra_dict_no_default') == "dictionary"
    assert get_parameter_format('elyra_dict_optional_no_default') == "dictionary"
    assert get_parameter_format('elyra_nested_dict_default') == "dictionary"
    assert get_parameter_format('elyra_dict_not_in_docstring') == "dictionary"

    assert get_parameter_format('elyra_list_no_default') == "list"
    assert get_parameter_format('elyra_list_optional_no_default') == "list"
    assert get_parameter_format('elyra_list_default') == "list"
    assert get_parameter_format('elyra_list_optional_default') == "list"
    assert get_parameter_format('elyra_list_not_in_docstring') == "list"

    assert get_parameter_value('elyra_dict_no_default') == "{}"
    assert get_parameter_value('elyra_list_no_default') == "[]"


def test_parse_airflow_component_url():
    # Define the appropriate reader for a Url-type component definition
    airflow_supported_file_types = [".py"]
    reader = UrlComponentCatalogConnector(airflow_supported_file_types)

    url = 'https://raw.githubusercontent.com/apache/airflow/1.10.15/airflow/operators/bash_operator.py'  # noqa: E501

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    component_definition = reader.read_catalog_entry({"url": url}, {})

    # Build entry for parsing
    catalog_type = "url-catalog"
    entry = {
        "component_id": reader.get_unique_component_hash(catalog_type, {"url": url}, ["url"]),
        "catalog_type": catalog_type,
        "categories": ["Test"],
        "component_definition": component_definition,
        "component_identifier": {"url": url}
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = ComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed, and system parameters are not, and hold correct values
    assert properties_json['current_parameters']['label'] == ''

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter(param_name):
        property_dict = properties_json['current_parameters'][param_name]
        return property_dict[property_dict['activeControl']]

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source
    assert get_parameter('elyra_bash_command') == ''
    assert get_parameter('elyra_xcom_push') is True
    assert get_parameter('elyra_env') == '{}'  # {}
    assert get_parameter('elyra_output_encoding') == 'utf-8'


def test_parse_airflow_component_file_no_inputs():
    # Define the appropriate reader for a filesystem-type component definition
    airflow_supported_file_types = [".py"]
    reader = FilesystemComponentCatalogConnector(airflow_supported_file_types)

    path = _get_resource_path('airflow_test_operator_no_inputs.py')

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    component_definition = reader.read_catalog_entry({"path": path}, {})

    # Build entry for parsing
    catalog_type = "local-file-catalog"
    entry = {
        "component_id": reader.get_unique_component_hash(catalog_type, {"path": path}, ["path"]),
        "catalog_type": catalog_type,
        "categories": ["Test"],
        "component_definition": component_definition,
        "component_identifier": {"path": path}
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = ComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    no_input_op = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(no_input_op)

    # Properties JSON should only include the two parameters common to every
    # component:'label' and 'component_source'
    num_common_params = 2
    assert len(properties_json['current_parameters'].keys()) == num_common_params
    assert len(properties_json['parameters']) == num_common_params
    assert len(properties_json['uihints']['parameter_info']) == num_common_params

    # Total number of groups includes one for each parameter, plus 1 for the component_source header
    # (Airflow does not include an output header since there are no formally defined outputs)
    num_groups = num_common_params + 1
    assert len(properties_json['uihints']['group_info'][0]['group_info']) == num_groups

    # Ensure that template still renders the two common parameters correctly
    assert properties_json['current_parameters']['label'] == ""

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source


@pytest.mark.parametrize('invalid_url', [
    'https://nourl.py',  # test an invalid host
    'https://raw.githubusercontent.com/elyra-ai/elyra/master/elyra/\
     pipeline/tests/resources/components/invalid_file.py'  # test an invalid file
], indirect=True)
async def test_parse_components_invalid_url(invalid_url):
    # Define the appropriate reader for a Url-type component definition
    airflow_supported_file_types = [".py"]
    reader = UrlComponentCatalogConnector(airflow_supported_file_types)

    # Get path to an invalid component definition file and read contents
    component_definition = reader.read_catalog_entry({"url": invalid_url}, {})
    assert component_definition is None
