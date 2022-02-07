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

from conftest import KFP_COMPONENT_CACHE_INSTANCE
from conftest import TEST_CATALOG_NAME
import jupyter_core.paths
import pytest

from elyra.metadata.metadata import Metadata
from elyra.pipeline.catalog_connector import FilesystemComponentCatalogConnector
from elyra.pipeline.catalog_connector import UrlComponentCatalogConnector
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.kfp.component_parser_kfp import KfpComponentParser
from elyra.pipeline.runtime_type import RuntimeProcessorType

COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], 'components')
RUNTIME_PROCESSOR = RuntimeProcessorType.KUBEFLOW_PIPELINES


def _get_resource_path(filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, '..', '..', '..', 'tests/pipeline', 'resources', 'components', filename)
    resource_path = os.path.normpath(resource_path)

    return resource_path


@pytest.mark.parametrize('component_cache_instance', [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
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
    paths = [_get_resource_path('kfp_test_operator.yaml')]

    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": paths
    }
    registry_instance = Metadata(schema_name="local-file-catalog",
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
    assert 'Test Operator' in added_component_names
    assert 'Test Operator No Inputs' not in added_component_names

    # Modify the test registry to add an additional path to
    paths.append(_get_resource_path('kfp_test_operator_no_inputs.yaml'))
    metadata_manager_with_teardown.update(TEST_CATALOG_NAME, registry_instance)

    # Wait for update to complete
    component_catalog.wait_for_all_cache_updates()

    # Get set of components from all active registries, including modified test registry
    modified_components = component_catalog.get_all_components(RUNTIME_PROCESSOR)
    modified_components = sorted(modified_components, key=lambda component: component.id)
    assert len(modified_components) > len(added_components)

    modified_component_names = [component.name for component in modified_components]
    assert 'Test Operator' in modified_component_names
    assert 'Test Operator No Inputs' in modified_component_names

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
    initial_palette = ComponentCache.to_canvas_palette(post_delete_components)
    post_delete_palette = ComponentCache.to_canvas_palette(initial_components)
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
    assert 'Filter text' in added_component_names
    assert 'Test Operator' in added_component_names
    assert 'Test Operator No Inputs' in added_component_names


def test_parse_kfp_component_file():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    path = _get_resource_path('kfp_test_operator.yaml')

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
    parser = KfpComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json['current_parameters']['label'] == ''

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source
    assert properties_json['current_parameters']['elyra_test_string_no_default'] == \
           {'StringControl': '', 'activeControl': 'StringControl'}

    assert properties_json['current_parameters']['elyra_test_string_default_value'] == \
           {'StringControl': 'default', 'activeControl': 'StringControl'}
    assert properties_json['current_parameters']['elyra_test_string_default_empty'] == \
           {'StringControl': '', 'activeControl': 'StringControl'}

    assert properties_json['current_parameters']['elyra_test_bool_default'] == \
           {'BooleanControl': 'False', 'activeControl': 'BooleanControl'}
    assert properties_json['current_parameters']['elyra_test_bool_false'] == \
           {'BooleanControl': 'False', 'activeControl': 'BooleanControl'}
    assert properties_json['current_parameters']['elyra_test_bool_true'] == \
           {'BooleanControl': 'True', 'activeControl': 'BooleanControl'}

    assert properties_json['current_parameters']['elyra_test_int_default'] == \
           {'NumberControl': '0', 'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_test_int_zero'] == \
           {'NumberControl': '0', 'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_test_int_non_zero'] == \
           {'NumberControl': '1', 'activeControl': 'NumberControl'}

    assert properties_json['current_parameters']['elyra_test_float_default'] == \
           {'NumberControl': '0.0', 'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_test_float_zero'] == \
           {'NumberControl': '0.0', 'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_test_float_non_zero'] == \
           {'NumberControl': '1.0', 'activeControl': 'NumberControl'}

    assert properties_json['current_parameters']['elyra_test_dict_default'] == \
           {'StringControl': '{}', 'activeControl': 'StringControl'}  # {}
    assert properties_json['current_parameters']['elyra_test_list_default'] == \
           {'StringControl': '[]', 'activeControl': 'StringControl'}  # []

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
    assert unusual_dict_property['data']['controls']['StringControl']['format'] == "dictionary"

    unusual_list_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                 if prop.get('parameter_ref') == 'elyra_test_unusual_type_list')
    assert unusual_list_property['data']['controls']['StringControl']['format'] == "list"

    unusual_string_property = next(prop for prop in properties_json['uihints']['parameter_info']
                                   if prop.get('parameter_ref') == 'elyra_test_unusual_type_string')
    assert unusual_string_property['data']['controls']['StringControl']['format'] == "string"

    file_property = next(prop for prop in properties_json['uihints']['parameter_info']
                         if prop.get('parameter_ref') == 'elyra_test_unusual_type_file')
    assert file_property['data']['format'] == "inputpath"

    no_type_property = next(prop for prop in properties_json['uihints']['parameter_info']
                            if prop.get('parameter_ref') == 'elyra_test_unusual_type_notgiven')
    assert no_type_property['data']['controls']['StringControl']['format'] == "string"

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert unusual_dict_property['description']['default'] == "The test command description " \
                                                              "(type: Dictionary of arrays)"
    assert unusual_list_property['description']['default'] == "The test command description (type: An array)"
    assert unusual_string_property['description']['default'] == "The test command description (type: A string)"
    assert file_property['description']['default'] == \
           "The test command description"  # No data type info is included in parentheses for inputPath variables
    assert no_type_property['description']['default'] == "The test command description (type: string)"


def test_parse_kfp_component_url():
    # Define the appropriate reader for a URL-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = UrlComponentCatalogConnector(kfp_supported_file_types)

    url = 'https://raw.githubusercontent.com/kubeflow/pipelines/1.4.1/components/notebooks/Run_notebook_using_papermill/component.yaml'  # noqa: E501

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
    parser = KfpComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json['current_parameters']['label'] == ''

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source
    assert properties_json['current_parameters']['elyra_notebook'] == 'None'   # Default value for type `inputpath`
    assert properties_json['current_parameters']['elyra_parameters'] == \
           {'StringControl': '{}', 'activeControl': 'StringControl'}
    assert properties_json['current_parameters']['elyra_packages_to_install'] == \
           {'StringControl': '[]', 'activeControl': 'StringControl'}
    assert properties_json['current_parameters']['elyra_input_data'] == \
           {'StringControl': '', 'activeControl': 'StringControl'}


def test_parse_kfp_component_file_no_inputs():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    path = _get_resource_path('kfp_test_operator_no_inputs.yaml')

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
    parser = KfpComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Properties JSON should only include the two parameters common to every
    # component:'label' and 'component_source', the component description if
    # exists (which it does for this component), and the output parameter for
    # this component
    num_common_params = 4
    assert len(properties_json['current_parameters'].keys()) == num_common_params
    assert len(properties_json['parameters']) == num_common_params
    assert len(properties_json['uihints']['parameter_info']) == num_common_params

    # Total number of groups includes one for each parameter,
    # plus one for the output group header,
    # plus 1 for the component_source header
    num_groups = num_common_params + 2
    assert len(properties_json['uihints']['group_info'][0]['group_info']) == num_groups

    # Ensure that template still renders the two common parameters correctly
    assert properties_json['current_parameters']['label'] == ""

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source


async def test_parse_components_invalid_file():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    # Get path to an invalid component definition file and read contents
    path = _get_resource_path('kfp_test_operator_invalid.yaml')
    component_definition = reader.read_catalog_entry({"path": path}, {})
    assert component_definition is None


async def test_parse_components_additional_metatypes():
    # Define the appropriate reader for a URL-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = UrlComponentCatalogConnector(kfp_supported_file_types)

    url = 'https://raw.githubusercontent.com/kubeflow/pipelines/1.4.1/components/keras/Train_classifier/from_CSV/component.yaml'  # noqa: E501

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
    parser = KfpComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json['current_parameters']['label'] == ''

    component_source = str({"catalog_type": catalog_type, "component_ref": component_entry.component_identifier})
    assert properties_json['current_parameters']['component_source'] == component_source
    assert properties_json['current_parameters']['elyra_training_features'] == 'None'  # inputPath
    assert properties_json['current_parameters']['elyra_training_labels'] == 'None'  # inputPath
    assert properties_json['current_parameters']['elyra_network_json'] == 'None'  # inputPath
    assert properties_json['current_parameters']['elyra_loss_name'] == {'StringControl': 'categorical_crossentropy',
                                                                        'activeControl': 'StringControl'}
    assert properties_json['current_parameters']['elyra_num_classes'] == {'NumberControl': '0',
                                                                          'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_optimizer'] == {'StringControl': 'rmsprop',
                                                                        'activeControl': 'StringControl'}
    assert properties_json['current_parameters']['elyra_optimizer_config'] == {'StringControl': '',
                                                                               'activeControl': 'StringControl'}
    assert properties_json['current_parameters']['elyra_learning_rate'] == {'NumberControl': '0.01',
                                                                            'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_num_epochs'] == {'NumberControl': '100',
                                                                         'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_batch_size'] == {'NumberControl': '32',
                                                                         'activeControl': 'NumberControl'}
    assert properties_json['current_parameters']['elyra_metrics'] == {'StringControl': "['accuracy']",
                                                                      'activeControl': 'StringControl'}
    assert properties_json['current_parameters']['elyra_random_seed'] == {'NumberControl': '0',
                                                                          'activeControl': 'NumberControl'}
