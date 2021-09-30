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

from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentRegistries
from elyra.pipeline.component import FilesystemComponentReader
from elyra.pipeline.component import UrlComponentReader
from elyra.pipeline.component_registry import ComponentRegistry
from elyra.pipeline.kfp.component_parser_kfp import KfpComponentParser

COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], 'components')


def _get_resource_path(filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, '..', '..', '..', 'tests/pipeline', 'resources', 'components', filename)
    resource_path = os.path.normpath(resource_path)

    return resource_path


def test_component_registry_can_load_components_from_registries():
    component_parser = KfpComponentParser()
    component_registry = ComponentRegistry(component_parser)

    components = component_registry.get_all_components()
    assert len(components) > 0


def test_modify_component_registries():
    # Get initial set of components from the current active registries
    parser = KfpComponentParser()
    component_registry = ComponentRegistry(parser, caching_enabled=False)
    initial_components = component_registry.get_all_components()

    # Components must be sorted by id for the equality comparison with later component lists
    initial_components = sorted(initial_components, key=lambda component: component.id)

    metadata_manager = MetadataManager(schemaspace=ComponentRegistries.COMPONENT_REGISTRIES_SCHEMASPACE_ID)

    # Create new registry instance with a single URL-based component
    paths = [_get_resource_path('kfp_test_operator.yaml')]

    instance_metadata = {
        "description": "A test registry",
        "runtime": "kfp",
        "categories": ["New Components"],
        "location_type": "Filename",
        "paths": paths
    }
    registry_instance = Metadata(schema_name="component-registry",
                                 name="new_registry",
                                 display_name="New Registry",
                                 metadata=instance_metadata)

    try:
        if metadata_manager.get("new_registry"):
            metadata_manager.remove("new_registry")
    except Exception:
        pass

    metadata_manager.create("new_registry", registry_instance)

    # Get new set of components from all active registries, including added test registry
    added_components = component_registry.get_all_components()
    assert len(added_components) > len(initial_components)

    added_component_names = [component.name for component in added_components]
    assert 'Test Operator' in added_component_names
    assert 'Test Operator No Inputs' not in added_component_names

    # Modify the test registry to add an additional path to
    paths.append(_get_resource_path('kfp_test_operator_no_inputs.yaml'))
    metadata_manager.update("new_registry", registry_instance)

    # Get set of components from all active registries, including modified test registry
    modified_components = component_registry.get_all_components()
    assert len(modified_components) > len(added_components)

    modified_component_names = [component.name for component in modified_components]
    assert 'Test Operator' in modified_component_names
    assert 'Test Operator No Inputs' in modified_component_names

    # Delete the test registry
    metadata_manager.remove("new_registry")
    post_delete_components = component_registry.get_all_components()
    post_delete_components = sorted(post_delete_components, key=lambda component: component.id)
    assert len(post_delete_components) == len(initial_components)

    # Check that the list of component ids is the same as before addition of the test registry
    initial_component_ids = [component.id for component in initial_components]
    post_delete_component_ids = [component.id for component in post_delete_components]
    assert post_delete_component_ids == initial_component_ids

    # Check that component palette is the same as before addition of the test registry
    initial_palette = ComponentRegistry.to_canvas_palette(post_delete_components)
    post_delete_palette = ComponentRegistry.to_canvas_palette(initial_components)
    assert initial_palette == post_delete_palette


def test_directory_based_component_registry():
    # Get initial set of components from the current active registries
    parser = KfpComponentParser()
    component_registry = ComponentRegistry(parser, caching_enabled=False)
    initial_components = component_registry.get_all_components()

    metadata_manager = MetadataManager(schemaspace=ComponentRegistries.COMPONENT_REGISTRIES_SCHEMASPACE_ID)

    # Create new directory-based registry instance with components in ../../test/resources/components
    registry_path = _get_resource_path('')
    instance_metadata = {
        "description": "A test registry",
        "runtime": "kfp",
        "categories": ["New Components"],
        "location_type": "Directory",
        "paths": [registry_path]
    }
    registry_instance = Metadata(schema_name="component-registry",
                                 name="new_registry",
                                 display_name="New Registry",
                                 metadata=instance_metadata)

    try:
        if metadata_manager.get("new_registry"):
            metadata_manager.remove("new_registry")
    except Exception:
        pass

    metadata_manager.create("new_registry", registry_instance)

    # Get new set of components from all active registries, including added test registry
    added_components = component_registry.get_all_components()
    assert len(added_components) > len(initial_components)

    # Check that all relevant components from the new registry have been added
    added_component_names = [component.name for component in added_components]
    assert 'Filter text' in added_component_names
    assert 'Test Operator' in added_component_names
    assert 'Test Operator No Inputs' in added_component_names

    # Remove the test instance
    metadata_manager.remove("new_registry")


def test_parse_kfp_component_file():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentReader(kfp_supported_file_types)

    path = _get_resource_path('kfp_test_operator.yaml')

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    component_definition = reader.read_component_definition(path, {})[path]

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
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
    assert file_property['data']['format'] == "inputpath"

    no_type_property = next(prop for prop in properties_json['uihints']['parameter_info']
                            if prop.get('parameter_ref') == 'elyra_test_unusual_type_notgiven')
    assert no_type_property['data']['format'] == "string"

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
    reader = UrlComponentReader(kfp_supported_file_types)

    path = 'https://raw.githubusercontent.com/kubeflow/pipelines/1.4.1/components/notebooks/Run_notebook_using_papermill/component.yaml'  # noqa: E501

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    component_definition = reader.read_component_definition(path, {})[path]

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = KfpComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentRegistry.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json['current_parameters']['label'] == ''
    assert properties_json['current_parameters']['component_source'] == component_entry.location
    assert properties_json['current_parameters']['elyra_notebook'] == 'None'   # Default value for type `inputpath`
    assert properties_json['current_parameters']['elyra_parameters'] == '{}'
    assert properties_json['current_parameters']['elyra_packages_to_install'] == ''  # {}
    assert properties_json['current_parameters']['elyra_input_data'] == ''


def test_parse_kfp_component_file_no_inputs():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentReader(kfp_supported_file_types)

    path = _get_resource_path('kfp_test_operator_no_inputs.yaml')

    # Read contents of given path -- read_component_definition() returns a
    # a dictionary of component definition content indexed by path
    component_definition = reader.read_component_definition(path, {})[path]

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = KfpComponentParser()
    component = parser.parse(component_entry)[0]
    properties_json = ComponentRegistry.to_canvas_properties(component)

    # Properties JSON should only include the two parameters common to every
    # component:'label' and 'component_source', the component description if
    # exists (which it does for this component), and the output parameter for
    # this component
    num_common_params = 4
    assert len(properties_json['current_parameters'].keys()) == num_common_params
    assert len(properties_json['parameters']) == num_common_params
    assert len(properties_json['uihints']['parameter_info']) == num_common_params
    assert len(properties_json['uihints']['group_info'][0]['group_info']) == num_common_params

    # Ensure that template still renders the two common parameters correctly
    assert properties_json['current_parameters']['label'] == ""
    assert properties_json['current_parameters']['component_source'] == component_entry.location


async def test_parse_components_invalid_file():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentReader(kfp_supported_file_types)

    # Get path to an invalid component definition file and read contents
    path = _get_resource_path('kfp_test_operator_invalid.yaml')
    component_definition = reader.read_component_definition(path, {})
    assert component_definition == {}

    # Build entry for parsing
    entry = {
        "location_type": reader.resource_type,
        "location": path,
        "categories": ["Test"],
        "component_definition": component_definition
    }
    component_entry = SimpleNamespace(**entry)

    # Parse the component entry
    parser = KfpComponentParser()
    component = parser.parse(component_entry)
    assert component is None
