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

from conftest import AIRFLOW_COMPONENT_CACHE_INSTANCE
import jupyter_core.paths
import pytest

from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentCatalogs
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


def test_modify_component_catalogs():
    # Initialize a ComponentCache instance and wait for all worker threads to compete
    component_catalog = ComponentCache.instance()
    component_catalog.wait_for_all_cache_updates()

    # Get initial set of components from the current active registries
    initial_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)

    # Components must be sorted by id for the equality comparison with later component lists
    initial_components = sorted(initial_components, key=lambda component: component.id)

    metadata_manager = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)

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
                                 name="new_test_registry",
                                 display_name="New Test Registry",
                                 metadata=instance_metadata)

    try:
        if metadata_manager.get("new_test_registry"):
            metadata_manager.remove("new_test_registry")
    except Exception:
        pass

    metadata_manager.create("new_test_registry", registry_instance)

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
    metadata_manager.update("new_test_registry", registry_instance)

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
    metadata_manager.remove("new_test_registry")

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


def test_directory_based_component_catalog():
    # Initialize a ComponentCache instance and wait for all worker threads to compete
    component_catalog = ComponentCache.instance()
    component_catalog.wait_for_all_cache_updates()

    # Get initial set of components from the current active registries
    initial_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)

    metadata_manager = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID)

    # Create new directory-based registry instance with components in ../../test/resources/components
    registry_path = _get_resource_path('')
    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": [registry_path]
    }
    registry_instance = Metadata(schema_name="local-directory-catalog",
                                 name="new_test_registry",
                                 display_name="New Test Registry",
                                 metadata=instance_metadata)

    try:
        if metadata_manager.get("new_test_registry"):
            metadata_manager.remove("new_test_registry")
    except Exception:
        pass

    metadata_manager.create("new_test_registry", registry_instance)

    # Wait for update to complete
    component_catalog.wait_for_all_cache_updates()

    # Get new set of components from all active registries, including added test registry
    added_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)
    assert len(added_components) > len(initial_components)

    # Check that all relevant components from the new registry have been added
    added_component_names = [component.name for component in added_components]
    assert 'TestOperator' in added_component_names
    assert 'TestOperatorNoInputs' in added_component_names

    # Remove the test instance
    metadata_manager.remove("new_test_registry")


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
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not), and hold correct values
    assert properties_json['current_parameters']['label'] == ''

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter(param_name):
        property_dict = properties_json['current_parameters'][param_name]
        return property_dict[property_dict['activeControl']]

    assert get_parameter('elyra_test_string_no_default') == ''
    assert get_parameter('elyra_test_string_default_value') == 'default'
    assert get_parameter('elyra_test_string_default_empty') == ''

    assert get_parameter('elyra_test_bool_default') is False
    assert get_parameter('elyra_test_bool_false') is False
    assert get_parameter('elyra_test_bool_true') is True

    assert get_parameter('elyra_test_int_default') == 0
    assert get_parameter('elyra_test_int_zero') == 0
    assert get_parameter('elyra_test_int_non_zero') == 1

    assert get_parameter('elyra_test_dict_default') == '{}'  # {}
    assert get_parameter('elyra_test_list_default') == '[]'  # []

    # Ensure that type information is inferred correctly
    unusual_dict_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                 if prop.get('parameter_ref') == 'elyra_test_unusual_type_dict')
    assert unusual_dict_property['data']['controls']['StringControl']['format'] == "dictionary"

    unusual_list_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                 if prop.get('parameter_ref') == 'elyra_test_unusual_type_list')
    assert unusual_list_property['data']['controls']['StringControl']['format'] == "list"

    unusual_string_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                   if prop.get('parameter_ref') == 'elyra_test_unusual_type_string')
    assert unusual_string_property['data']['controls']['StringControl']['format'] == "string"

    no_type_property = next(prop for prop in properties_json['uihints']['parameter_info']
                            if prop.get('parameter_ref') == 'elyra_test_unusual_type_notgiven')
    assert no_type_property['data']['controls']['StringControl']['format'] == "string"

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert unusual_dict_property['description']['default'] == "The test command description "\
                                                              "(type: a dictionary of arrays)"
    assert unusual_list_property['description']['default'] == "The test command description (type: a list of strings)"
    assert unusual_string_property['description']['default'] == "The test command description (type: a string)"
    assert no_type_property['description']['default'] == "The test command description (type: string)"


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
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Properties JSON should only include the two parameters common to every
    # component:'label' and 'component_source'
    num_common_params = 2
    assert len(properties_json['current_parameters'].keys()) == num_common_params
    assert len(properties_json['parameters']) == num_common_params
    assert len(properties_json['uihints']['parameter_info']) == num_common_params
    assert len(properties_json['uihints']['group_info'][0]['group_info']) == num_common_params

    # Ensure that template still renders the two common parameters correctly
    assert properties_json['current_parameters']['label'] == ""

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source


def test_parse_airflow_component_file_type_hints():
    # Define the appropriate reader for a filesystem-type component definition
    airflow_supported_file_types = [".py"]
    reader = FilesystemComponentCatalogConnector(airflow_supported_file_types)

    path = _get_resource_path('airflow_test_operator_type_hints.py')

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
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not), and hold correct values
    assert properties_json['current_parameters']['label'] == ''

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter(param_name):
        property_dict = properties_json['current_parameters'][param_name]
        return property_dict[property_dict['activeControl']]

    assert get_parameter('elyra_test_string_default') == ''
    assert get_parameter('elyra_test_bool_default') is False
    assert get_parameter('elyra_test_int_default') == 0
    assert get_parameter('elyra_test_str_list_default') == '[]'
    assert get_parameter('elyra_test_str_dict_default') == '{}'

    assert get_parameter('elyra_test_string_value') == 'default'
    assert get_parameter('elyra_test_string_empty') == ''

    assert get_parameter('elyra_test_bool_false') is False
    assert get_parameter('elyra_test_bool_true') is True

    assert get_parameter('elyra_test_int_zero') == 0
    assert get_parameter('elyra_test_int_non_zero') == 1

    assert get_parameter('elyra_test_str_list_value') == "['test']"
    assert get_parameter('elyra_test_str_list_empty') == "[]"

    assert get_parameter('elyra_test_str_dict_value') == "{'test': 'test'}"
    assert get_parameter('elyra_test_str_dict_empty') == '{}'

    # Ensure that type information is inferred correctly
    str_list_default_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                     if prop.get('parameter_ref') == 'elyra_test_str_list_default')
    assert str_list_default_property['data']['controls']['StringControl']['format'] == "list"

    str_dict_default_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                     if prop.get('parameter_ref') == 'elyra_test_str_dict_default')
    assert str_dict_default_property['data']['controls']['StringControl']['format'] == "dictionary"

    string_default_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                   if prop.get('parameter_ref') == 'elyra_test_string_default')
    assert string_default_property['data']['controls']['StringControl']['format'] == "string"

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert str_list_default_property['description']['default'] == "The test command description (type: list)"
    assert str_dict_default_property['description']['default'] == "The test command description (type: dict)"
    assert string_default_property['description']['default'] == "The test command description (type: str)"


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
