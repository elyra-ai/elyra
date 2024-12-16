#
# Copyright 2018-2025 Elyra Authors
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
from elyra.pipeline.kfp.kfp_component_parser import KfpComponentParser
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
                "create",
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
                "create",
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
    props_as_dict = {param.ref: param for param in component.input_properties}

    # Ensure description with unsafe characters is rendered without error
    palette_json = ComponentCache.to_canvas_palette([component])
    expected_description = 'This component description contains an unescaped " character'
    assert expected_description == palette_json["categories"][0]["node_types"][0]["description"]

    properties_json = ComponentCache.to_canvas_properties(component)

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter_value(param_name):
        property_dict = properties_json["properties"]["component_parameters"]["properties"][param_name]
        return property_dict["oneOf"][0]["properties"]["value"].get("default", "")

    # Helper method to retrieve the requested parameter info from the dictionary
    def get_parameter_format(param_name):
        property_dict = properties_json["properties"]["component_parameters"]["properties"][param_name]
        return property_dict["oneOf"][0]["properties"]["value"]["type"]

    # Helper method to retrieve the requested parameter description from the dictionary
    def get_parameter_description(param_name):
        property_dict = properties_json["properties"]["component_parameters"]["properties"][param_name]
        return property_dict["description"]

    # Helper method to retrieve whether the requested parameter is required
    def get_parameter_required(param_name):
        required_parameters = properties_json["properties"]["component_parameters"]["required"]
        return param_name in required_parameters

    # Ensure system parameters are present
    assert properties_json["properties"]["label"] is not None

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["properties"]["component_source"]["default"] == component_source

    assert get_parameter_value("test_string_no_default") == ""
    assert get_parameter_value("test_string_default_value") == "default"
    assert get_parameter_value("test_string_default_empty") == ""
    assert get_parameter_value("test_bool_default") is False
    assert get_parameter_value("test_bool_false") is False
    assert get_parameter_value("test_bool_true") is True
    assert get_parameter_value("test_int_default") == 0
    assert get_parameter_value("test_int_zero") == 0
    assert get_parameter_value("test_int_non_zero") == 1
    assert get_parameter_value("test_float_default") == 0.0
    assert get_parameter_value("test_float_zero") == 0.0
    assert get_parameter_value("test_float_non_zero") == 1.1
    assert get_parameter_value("test_dict_default") == "{}"
    assert get_parameter_value("test_list_default") == "[]"
    assert get_parameter_value("mounted_volumes") == ""

    # Ensure that the 'required' attribute was set correctly. KFP components default to required
    # unless explicitly marked otherwise in component YAML.
    assert get_parameter_required("test_required_property") is True
    assert get_parameter_required("test_optional_property") is False
    assert get_parameter_required("test_required_property_default") is True

    # Ensure that type information is inferred correctly
    assert get_parameter_format("test_unusual_type_dict") == "string"
    assert props_as_dict["test_unusual_type_dict"].json_data_type == "object"

    assert get_parameter_format("test_unusual_type_list") == "string"
    assert props_as_dict["test_unusual_type_list"].json_data_type == "array"

    assert get_parameter_format("test_unusual_type_string") == "string"
    assert props_as_dict["test_unusual_type_string"].json_data_type == "string"

    assert get_parameter_format("test_unusual_type_notgiven") == "string"
    assert props_as_dict["test_unusual_type_notgiven"].json_data_type == "string"

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert (
        get_parameter_description("test_unusual_type_dict") == "The test command description "
        "(type: Dictionary of arrays)"
    )
    assert get_parameter_description("test_unusual_type_list") == "The test command description (type: An array)"
    assert get_parameter_description("test_unusual_type_string") == "The test command description (type: A string)"
    assert get_parameter_description("test_unusual_type_notgiven") == "The test command description (type: String)"


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

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter_value(param_name):
        property_dict = properties_json["properties"]["component_parameters"]["properties"][param_name]
        if "oneOf" not in property_dict:
            # This is an inputpath-only param and doesn't have a default value
            return None
        return property_dict["oneOf"][0]["properties"]["value"].get("default", "")

    # Ensure system parameters are present
    assert properties_json["properties"]["label"] is not None

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["properties"]["component_source"]["default"] == component_source

    assert get_parameter_value("notebook") is None  # Default value for type `inputpath`
    assert get_parameter_value("parameters") == "{}"
    assert get_parameter_value("packages_to_install") == "[]"
    assert get_parameter_value("input_data") == ""

    # Ensure 'Notebook' param exists as both an input and an output (same name defined in yaml)
    assert "notebook" in properties_json["properties"]["component_parameters"]["properties"]
    assert "output_notebook" in properties_json["properties"]["component_parameters"]["properties"]


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

    # Properties JSON should only include the six parameters common to every
    # component ('mounted_volumes', 'kubernetes_pod_annotations', 'kubernetes_pod_labels',
    # 'kubernetes_tolerations', 'kubernetes_shared_mem_size', and 'disable_node_caching),
    # and the output parameter for this component
    num_common_params = 7
    properties_from_json = [
        prop
        for prop in properties_json["properties"]["component_parameters"]["properties"].keys()
        if "header" not in prop
    ]
    assert len(properties_from_json) == num_common_params

    # Ensure system parameters are present
    assert properties_json["properties"]["label"] is not None

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["properties"]["component_source"]["default"] == component_source


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

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter_value(param_name):
        property_dict = properties_json["properties"]["component_parameters"]["properties"][param_name]
        if "oneOf" not in property_dict:
            # This is an inputpath-only param and doesn't have a default value
            return None
        return property_dict["oneOf"][0]["properties"]["value"].get("default", "")

    # Ensure system parameters are present
    assert properties_json["properties"]["label"] is not None

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["properties"]["component_source"]["default"] == component_source

    assert get_parameter_value("training_features") is None  # inputPath
    assert get_parameter_value("training_labels") is None  # inputPath
    assert get_parameter_value("network_json") is None  # inputPath
    assert get_parameter_value("loss_name") == "categorical_crossentropy"
    assert get_parameter_value("num_classes") == 0
    assert get_parameter_value("optimizer") == "rmsprop"
    assert get_parameter_value("optimizer_config") == ""
    assert get_parameter_value("learning_rate") == 0.01
    assert get_parameter_value("num_epochs") == 100
    assert get_parameter_value("batch_size") == 32
    assert get_parameter_value("metrics") == "['accuracy']"
    assert get_parameter_value("random_seed") == 0
