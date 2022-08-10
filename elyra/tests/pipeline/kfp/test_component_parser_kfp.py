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
import json
import os
from pathlib import Path
from subprocess import CompletedProcess
from subprocess import run

from conftest import KFP_COMPONENT_CACHE_INSTANCE
from conftest import TEST_CATALOG_NAME
import jupyter_core.paths
import pytest
import yaml

from elyra.metadata.metadata import Metadata
from elyra.pipeline.catalog_connector import CatalogEntry
from elyra.pipeline.catalog_connector import EntryData
from elyra.pipeline.catalog_connector import FilesystemComponentCatalogConnector
from elyra.pipeline.catalog_connector import UrlComponentCatalogConnector
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.component_metadata import ComponentCatalogMetadata
from elyra.pipeline.kfp.component_parser_kfp import KfpComponentParser
from elyra.pipeline.runtime_type import RuntimeProcessorType

COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], "components")
RUNTIME_PROCESSOR = RuntimeProcessorType.KUBEFLOW_PIPELINES


def _get_resource_path(filename):
    pipeline_dir = os.path.realpath(os.path.dirname(os.path.dirname(__file__)))
    resource_path = os.path.join(pipeline_dir, "resources", "components", filename)
    resource_path = os.path.normpath(resource_path)

    return resource_path


@pytest.mark.parametrize("catalog_instance", [KFP_COMPONENT_CACHE_INSTANCE], indirect=True)
def test_component_catalog_load(component_cache, catalog_instance):
    components = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components) > 0


@pytest.mark.parametrize("create_inprocess", [True, False])
async def test_modify_component_catalogs(jp_environ, component_cache, metadata_manager_with_teardown, create_inprocess):
    # Get initial set of components
    initial_components = component_cache.get_all_components(RUNTIME_PROCESSOR)

    # Create new registry instance with a single URL-based component
    paths = [_get_resource_path("kfp_test_operator.yaml")]

    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": paths,
    }
    registry_instance = Metadata(
        schema_name="local-file-catalog",
        name=TEST_CATALOG_NAME,
        display_name="New Test Registry",
        metadata=instance_metadata,
    )

    if create_inprocess:
        metadata_manager_with_teardown.create(TEST_CATALOG_NAME, registry_instance)
    else:
        res: CompletedProcess = run(
            [
                "elyra-metadata",
                "install",
                "component-catalogs",
                f"--schema_name={registry_instance.schema_name}",
                f"--json={registry_instance.to_json()}",
                f"--name={TEST_CATALOG_NAME}",
            ]
        )
        assert res.returncode == 0

    # Wait for update to complete
    component_cache.wait_for_all_cache_tasks()

    # Get new set of components from all active registries, including added test registry
    components_after_create = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components_after_create) == len(initial_components) + 1

    added_component_names = [component.name for component in components_after_create]
    assert "Test Operator" in added_component_names
    assert "Test Operator No Inputs" not in added_component_names

    # Modify the test registry to add a path to the catalog instance
    paths.append(_get_resource_path("kfp_test_operator_no_inputs.yaml"))
    metadata_manager_with_teardown.update(TEST_CATALOG_NAME, registry_instance)

    # Wait for update to complete
    component_cache.wait_for_all_cache_tasks()

    # Get set of components from all active registries, including modified test registry
    components_after_update = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components_after_update) == len(initial_components) + 2

    modified_component_names = [component.name for component in components_after_update]
    assert "Test Operator" in modified_component_names
    assert "Test Operator No Inputs" in modified_component_names

    # Delete the test registry
    metadata_manager_with_teardown.remove(TEST_CATALOG_NAME)

    # Wait for update to complete
    component_cache.wait_for_all_cache_tasks()

    # Check that components remaining after delete are the same as before the new catalog was added
    components_after_remove = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components_after_remove) == len(initial_components)


@pytest.mark.parametrize("create_inprocess", [True, False])
async def test_directory_based_component_catalog(
    component_cache, metadata_manager_with_teardown, create_inprocess, tmpdir
):
    # Verify that the component cache is empty to prevent other tests
    # from having an impact on this' tests result
    initial_components = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(initial_components) == 0, initial_components[0].name

    # Create and populate a temporary catalog directory
    catalog_dir = Path(tmpdir) / "catalog"
    catalog_dir.mkdir()
    # Copy a few YAML files from ../resources/components to
    # the catalog directory
    directory_entries = {"download_data.yaml": None, "kfp_test_operator_no_inputs.yaml": None}
    for file in directory_entries:
        with open(_get_resource_path(file), "r") as fh_in:
            # read file
            data = fh_in.read()
            # extract and store component name
            directory_entries[file] = yaml.safe_load(data)["name"]
            # write (unchanged) file to destination
            with open(catalog_dir / file, "w") as fh_out:
                fh_out.write(data)
        # make sure the file exists in the destination
        assert (catalog_dir / file).is_file()

    # Create new directory-based registry
    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": [str(catalog_dir)],
    }
    registry_instance = Metadata(
        schema_name="local-directory-catalog",
        name=TEST_CATALOG_NAME,
        display_name="New Test Registry",
        metadata=instance_metadata,
    )

    if create_inprocess:
        metadata_manager_with_teardown.create(TEST_CATALOG_NAME, registry_instance)
    else:
        res: CompletedProcess = run(
            [
                "elyra-metadata",
                "install",
                "component-catalogs",
                f"--schema_name={registry_instance.schema_name}",
                f"--json={registry_instance.to_json()}",
                f"--name={TEST_CATALOG_NAME}",
            ]
        )
        assert res.returncode == 0

    # Wait for update to complete
    component_cache.wait_for_all_cache_tasks()

    # Verify that the number of components in the cache equals the number of
    # components in the directory catalog
    components_after_create = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components_after_create) == len(directory_entries), components_after_create

    # Verify the component names
    added_component_names = [component.name for component in components_after_create]
    for component in directory_entries:
        assert directory_entries[component] in added_component_names

    # Delete the test registry and wait for updates to complete
    metadata_manager_with_teardown.remove(TEST_CATALOG_NAME)
    component_cache.wait_for_all_cache_tasks()


def test_parse_kfp_component_file():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    # Read contents of given path
    path = _get_resource_path("kfp_test_operator.yaml")
    catalog_entry_data = {"path": path}

    # Construct a catalog instance
    catalog_type = "local-file-catalog"
    catalog_instance = ComponentCatalogMetadata(
        schema_name=catalog_type, metadata={"categories": ["Test"], "runtime_type": RUNTIME_PROCESSOR.name}
    )

    # Build the catalog entry data structures required for parsing
    entry_data = reader.get_entry_data(catalog_entry_data, {})
    catalog_entry = CatalogEntry(entry_data, catalog_entry_data, catalog_instance, ["path"])

    # Parse the component entry
    parser = KfpComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(catalog_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure description is rendered even with an unescaped character
    description = 'This component description contains an unescaped " character'
    assert properties_json["current_parameters"]["component_description"] == description

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json["current_parameters"]["label"] == ""

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["current_parameters"]["component_source"] == component_source
    assert properties_json["current_parameters"]["elyra_test_string_no_default"] == {
        "StringControl": "",
        "activeControl": "StringControl",
    }

    assert properties_json["current_parameters"]["elyra_test_string_default_value"] == {
        "StringControl": "default",
        "activeControl": "StringControl",
    }
    assert properties_json["current_parameters"]["elyra_test_string_default_empty"] == {
        "StringControl": "",
        "activeControl": "StringControl",
    }

    assert properties_json["current_parameters"]["elyra_test_bool_default"] == {
        "BooleanControl": False,
        "activeControl": "BooleanControl",
    }
    assert properties_json["current_parameters"]["elyra_test_bool_false"] == {
        "BooleanControl": False,
        "activeControl": "BooleanControl",
    }
    assert properties_json["current_parameters"]["elyra_test_bool_true"] == {
        "BooleanControl": True,
        "activeControl": "BooleanControl",
    }

    assert properties_json["current_parameters"]["elyra_test_int_default"] == {
        "NumberControl": 0,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_test_int_zero"] == {
        "NumberControl": 0,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_test_int_non_zero"] == {
        "NumberControl": 1,
        "activeControl": "NumberControl",
    }

    assert properties_json["current_parameters"]["elyra_test_float_default"] == {
        "NumberControl": 0.0,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_test_float_zero"] == {
        "NumberControl": 0.0,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_test_float_non_zero"] == {
        "NumberControl": 1.0,
        "activeControl": "NumberControl",
    }

    assert properties_json["current_parameters"]["elyra_test_dict_default"] == {
        "StringControl": "{}",
        "activeControl": "StringControl",
    }  # {}
    assert properties_json["current_parameters"]["elyra_test_list_default"] == {
        "StringControl": "[]",
        "activeControl": "StringControl",
    }  # []

    assert properties_json["current_parameters"]["elyra_mounted_volumes"] == {
        "StringControl": "",
        "activeControl": "StringControl",
    }

    # Ensure that the 'required' attribute was set correctly. KFP components default to required
    # unless explicitly marked otherwise in component YAML.
    required_property = next(
        prop
        for prop in properties_json["uihints"]["parameter_info"]
        if prop.get("parameter_ref") == "elyra_test_required_property"
    )
    assert required_property["data"]["required"] is True

    optional_property = next(
        prop
        for prop in properties_json["uihints"]["parameter_info"]
        if prop.get("parameter_ref") == "elyra_test_optional_property"
    )
    assert optional_property["data"]["required"] is False

    default_required_property = next(
        prop
        for prop in properties_json["uihints"]["parameter_info"]
        if prop.get("parameter_ref") == "elyra_test_required_property_default"
    )
    assert default_required_property["data"]["required"] is True

    # Ensure that type information is inferred correctly
    unusual_dict_property = next(
        prop
        for prop in properties_json["uihints"]["parameter_info"]
        if prop.get("parameter_ref") == "elyra_test_unusual_type_dict"
    )
    assert unusual_dict_property["data"]["controls"]["StringControl"]["format"] == "dictionary"

    unusual_list_property = next(
        prop
        for prop in properties_json["uihints"]["parameter_info"]
        if prop.get("parameter_ref") == "elyra_test_unusual_type_list"
    )
    assert unusual_list_property["data"]["controls"]["StringControl"]["format"] == "list"

    unusual_string_property = next(
        prop
        for prop in properties_json["uihints"]["parameter_info"]
        if prop.get("parameter_ref") == "elyra_test_unusual_type_string"
    )
    assert unusual_string_property["data"]["controls"]["StringControl"]["format"] == "string"

    no_type_property = next(
        prop
        for prop in properties_json["uihints"]["parameter_info"]
        if prop.get("parameter_ref") == "elyra_test_unusual_type_notgiven"
    )
    assert no_type_property["data"]["controls"]["StringControl"]["format"] == "string"

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert (
        unusual_dict_property["description"]["default"] == "The test command description "
        "(type: Dictionary of arrays)"
    )
    assert unusual_list_property["description"]["default"] == "The test command description (type: An array)"
    assert unusual_string_property["description"]["default"] == "The test command description (type: A string)"
    assert no_type_property["description"]["default"] == "The test command description (type: string)"


def test_parse_kfp_component_url():
    # Define the appropriate reader for a URL-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = UrlComponentCatalogConnector(kfp_supported_file_types)

    # Read contents of given path
    url = "https://raw.githubusercontent.com/kubeflow/pipelines/1.4.1/components/notebooks/Run_notebook_using_papermill/component.yaml"  # noqa: E501
    catalog_entry_data = {"url": url}

    # Construct a catalog instance
    catalog_type = "url-catalog"
    catalog_instance = ComponentCatalogMetadata(
        schema_name=catalog_type, metadata={"categories": ["Test"], "runtime_type": RUNTIME_PROCESSOR.name}
    )

    # Build the catalog entry data structures required for parsing
    entry_data = reader.get_entry_data(catalog_entry_data, {})
    catalog_entry = CatalogEntry(entry_data, catalog_entry_data, catalog_instance, ["url"])

    # Parse the component entry
    parser = KfpComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(catalog_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json["current_parameters"]["label"] == ""

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["current_parameters"]["component_source"] == component_source
    assert properties_json["current_parameters"]["elyra_notebook"] == "None"  # Default value for type `inputpath`
    assert properties_json["current_parameters"]["elyra_parameters"] == {
        "StringControl": "{}",
        "activeControl": "StringControl",
    }
    assert properties_json["current_parameters"]["elyra_packages_to_install"] == {
        "StringControl": "[]",
        "activeControl": "StringControl",
    }
    assert properties_json["current_parameters"]["elyra_input_data"] == {
        "StringControl": "",
        "activeControl": "StringControl",
    }


def test_parse_kfp_component_file_no_inputs():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    # Read contents of given path
    path = _get_resource_path("kfp_test_operator_no_inputs.yaml")
    catalog_entry_data = {"path": path}

    # Construct a catalog instance
    catalog_type = "local-file-catalog"
    catalog_instance = ComponentCatalogMetadata(
        schema_name=catalog_type, metadata={"categories": ["Test"], "runtime_type": RUNTIME_PROCESSOR.name}
    )

    # Build the catalog entry data structures required for parsing
    entry_data = reader.get_entry_data(catalog_entry_data, {})
    catalog_entry = CatalogEntry(entry_data, catalog_entry_data, catalog_instance, ["path"])

    # Parse the component entry
    parser = KfpComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(catalog_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Properties JSON should only include the four parameters common to every
    # component ('label', 'component_source', 'mounted_volumes', 'kubernetes_pod_annotations',
    # and 'kubernetes_tolerations'), the component description if it exists (which it does for
    # this component), and the output parameter for this component
    num_common_params = 7
    assert len(properties_json["current_parameters"].keys()) == num_common_params, properties_json["current_parameters"]
    assert len(properties_json["parameters"]) == num_common_params
    assert len(properties_json["uihints"]["parameter_info"]) == num_common_params

    # Total number of groups includes one for each parameter,
    # plus 1 for the output group header,
    # plus 1 for the component_source header,
    # plus 1 for the 'other properties' header (that includes, e.g., mounted_volumes)
    num_groups = num_common_params + 3
    assert len(properties_json["uihints"]["group_info"][0]["group_info"]) == num_groups

    # Ensure that template still renders the two common parameters correctly
    assert properties_json["current_parameters"]["label"] == ""

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["current_parameters"]["component_source"] == component_source


async def test_parse_components_not_a_file():
    # Define the appropriate reader for a filesystem-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = FilesystemComponentCatalogConnector(kfp_supported_file_types)

    # Get path to an invalid component definition file and read contents
    path = _get_resource_path("kfp_test_operator_not_a_file.yaml")
    entry_data = reader.get_entry_data({"path": path}, {})
    assert entry_data is None


async def test_parse_components_invalid_yaml(caplog):
    # Get resource path and read definition (by-pass catalog reader functionality)
    path = _get_resource_path("kfp_test_invalid_component.yaml")
    with open(path, "r") as f:
        definition = f.read()

    # Manually construct catalog_entry_data object and catalog instance
    catalog_entry_data = {"path": path}
    catalog_type = "local-file-catalog"
    catalog_instance = ComponentCatalogMetadata(
        schema_name=catalog_type, metadata={"categories": ["Test"], "runtime_type": RUNTIME_PROCESSOR.name}
    )

    # Build the catalog entry data structures required for parsing
    entry_data = EntryData(definition=definition)
    catalog_entry = CatalogEntry(entry_data, catalog_entry_data, catalog_instance, ["path"])

    # Parse the component entry
    parser = KfpComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(catalog_entry)

    # Failed YAML schema validation returns None
    assert component is None

    # Assert validation error is captured appropriately in log
    assert "Invalid format of YAML definition for component" in caplog.text
    assert "Failed validating 'type'" in caplog.text
    assert "On instance['inputs'][0]['name']:\n    2" in caplog.text

    caplog.clear()

    # Modify file to get expected error in YAML safe_load
    new_definition = "key with no mapping\n" + definition
    catalog_entry.entry_data.definition = new_definition

    # Re-parse with new definition content
    component = parser.parse(catalog_entry)

    # Failed YAML safe_load returns None
    assert component is None

    # Assert load error is captured appropriately in log
    assert "Could not load YAML definition for component" in caplog.text
    assert "mapping values are not allowed here" in caplog.text


async def test_parse_components_additional_metatypes():
    # Define the appropriate reader for a URL-type component definition
    kfp_supported_file_types = [".yaml"]
    reader = UrlComponentCatalogConnector(kfp_supported_file_types)

    # Read contents of given path
    url = "https://raw.githubusercontent.com/kubeflow/pipelines/1.4.1/components/keras/Train_classifier/from_CSV/component.yaml"  # noqa: E501
    catalog_entry_data = {"url": url}

    # Construct a catalog instance
    catalog_type = "url-catalog"
    catalog_instance = ComponentCatalogMetadata(
        schema_name=catalog_type, metadata={"categories": ["Test"], "runtime_type": RUNTIME_PROCESSOR.name}
    )

    # Build the catalog entry data structures required for parsing
    entry_data = reader.get_entry_data(catalog_entry_data, {})
    catalog_entry = CatalogEntry(entry_data, catalog_entry_data, catalog_instance, ["url"])

    # Parse the component entry
    parser = KfpComponentParser()
    component = parser.parse(catalog_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure component parameters are prefixed (and system parameters are not) and all hold correct values
    assert properties_json["current_parameters"]["label"] == ""

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["current_parameters"]["component_source"] == component_source
    assert properties_json["current_parameters"]["elyra_training_features"] == "None"  # inputPath
    assert properties_json["current_parameters"]["elyra_training_labels"] == "None"  # inputPath
    assert properties_json["current_parameters"]["elyra_network_json"] == "None"  # inputPath
    assert properties_json["current_parameters"]["elyra_loss_name"] == {
        "StringControl": "categorical_crossentropy",
        "activeControl": "StringControl",
    }
    assert properties_json["current_parameters"]["elyra_num_classes"] == {
        "NumberControl": 0,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_optimizer"] == {
        "StringControl": "rmsprop",
        "activeControl": "StringControl",
    }
    assert properties_json["current_parameters"]["elyra_optimizer_config"] == {
        "StringControl": "",
        "activeControl": "StringControl",
    }
    assert properties_json["current_parameters"]["elyra_learning_rate"] == {
        "NumberControl": 0.01,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_num_epochs"] == {
        "NumberControl": 100,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_batch_size"] == {
        "NumberControl": 32,
        "activeControl": "NumberControl",
    }
    assert properties_json["current_parameters"]["elyra_metrics"] == {
        "StringControl": "['accuracy']",
        "activeControl": "StringControl",
    }
    assert properties_json["current_parameters"]["elyra_random_seed"] == {
        "NumberControl": 0,
        "activeControl": "NumberControl",
    }
