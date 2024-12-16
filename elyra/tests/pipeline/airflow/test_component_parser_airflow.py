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
from subprocess import CompletedProcess
from subprocess import run

from conftest import AIRFLOW_TEST_OPERATOR_CATALOG
from conftest import TEST_CATALOG_NAME
import jupyter_core.paths
import pytest

from elyra.metadata.metadata import Metadata
from elyra.pipeline.catalog_connector import CatalogEntry
from elyra.pipeline.catalog_connector import FilesystemComponentCatalogConnector
from elyra.pipeline.catalog_connector import UrlComponentCatalogConnector
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.component_metadata import ComponentCatalogMetadata
from elyra.pipeline.runtime_type import RuntimeProcessorType

COMPONENT_CATALOG_DIRECTORY = os.path.join(jupyter_core.paths.ENV_JUPYTER_PATH[0], "components")
RUNTIME_PROCESSOR = RuntimeProcessorType.APACHE_AIRFLOW


@pytest.fixture
def invalid_url(request):
    return request.param


def _get_resource_path(filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    resource_path = os.path.join(root, "..", "..", "..", "tests/pipeline", "resources", "components", filename)
    resource_path = os.path.normpath(resource_path)

    return resource_path


@pytest.mark.parametrize("catalog_instance", [AIRFLOW_TEST_OPERATOR_CATALOG], indirect=True)
def test_component_catalog_can_load_components_from_registries(catalog_instance, component_cache):
    components = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components) > 0


@pytest.mark.parametrize("create_inprocess", [True, False])
async def test_modify_component_catalogs(component_cache, metadata_manager_with_teardown, create_inprocess):
    # Get initial set of components
    initial_components = component_cache.get_all_components(RUNTIME_PROCESSOR)

    # Create new registry instance with a single URL-based component
    urls = [
        "https://raw.githubusercontent.com/elyra-ai/elyra/main/elyra/tests/pipeline/"
        "resources/components/airflow_test_operator.py"
    ]

    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": urls,
    }
    registry_instance = Metadata(
        schema_name="url-catalog", name=TEST_CATALOG_NAME, display_name="New Test Registry", metadata=instance_metadata
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
    assert len(components_after_create) == len(initial_components) + 3

    added_component_names = [component.name for component in components_after_create]
    assert "TestOperator" in added_component_names
    assert "TestOperatorNoInputs" not in added_component_names

    # Modify the test registry to add an additional path to
    urls.append(
        "https://raw.githubusercontent.com/elyra-ai/elyra/main/elyra/tests/pipeline/resources/components"
        "/airflow_test_operator_no_inputs.py"
    )
    metadata_manager_with_teardown.update(TEST_CATALOG_NAME, registry_instance)

    # Wait for update to complete
    component_cache.wait_for_all_cache_tasks()

    # Get set of components from all active registries, including modified test registry
    components_after_update = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components_after_update) == len(initial_components) + 4

    modified_component_names = [component.name for component in components_after_update]
    assert "TestOperator" in modified_component_names
    assert "TestOperatorNoInputs" in modified_component_names

    # Delete the test registry
    metadata_manager_with_teardown.remove(TEST_CATALOG_NAME)

    # Wait for update to complete
    component_cache.wait_for_all_cache_tasks()

    # Check that components remaining after delete are the same as before the new catalog was added
    components_after_remove = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components_after_remove) == len(initial_components)


@pytest.mark.parametrize("create_inprocess", [True, False])
async def test_directory_based_component_catalog(component_cache, metadata_manager_with_teardown, create_inprocess):
    # Get initial set of components
    initial_components = component_cache.get_all_components(RUNTIME_PROCESSOR)

    # Create new directory-based registry instance with components in ../../test/resources/components
    registry_path = _get_resource_path("")
    instance_metadata = {
        "description": "A test registry",
        "runtime_type": RUNTIME_PROCESSOR.name,
        "categories": ["New Components"],
        "paths": [registry_path],
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

    # Get new set of components from all active registries, including added test registry
    components_after_create = component_cache.get_all_components(RUNTIME_PROCESSOR)
    assert len(components_after_create) == len(initial_components) + 5

    # Check that all relevant components from the new registry have been added
    added_component_names = [component.name for component in components_after_create]
    assert "TestOperator" in added_component_names
    assert "TestOperatorNoInputs" in added_component_names

    # Delete the test registry and wait for updates to complete
    metadata_manager_with_teardown.remove(TEST_CATALOG_NAME)
    component_cache.wait_for_all_cache_tasks()


def test_parse_airflow_component_file():
    # Define the appropriate reader for a filesystem-type component definition
    airflow_supported_file_types = [".py"]
    reader = FilesystemComponentCatalogConnector(airflow_supported_file_types)

    # Read contents of given path
    path = _get_resource_path("airflow_test_operator.py")
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
    parser = ComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    components = parser.parse(catalog_entry)
    assert len(components) == 3  # TestOperator, DeriveFromTestOperator, and DeriveFromImportedOperator

    # Split components list into its constituent operators
    components = sorted(components, key=lambda component: component.id)
    import_test_op, derive_test_op, test_op = components[0], components[1], components[2]

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

    # Retrieve properties for TestOperator
    # Test Operator does not include type hints for the init function args
    properties_json = ComponentCache.to_canvas_properties(test_op)
    props_as_dict = {param.ref: param for param in test_op.input_properties}

    # Ensure system parameters are present
    assert properties_json["properties"]["label"] is not None

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["properties"]["component_source"]["default"] == component_source

    # Ensure component parameters are prefixed with 'elyra_' and values are as expected
    assert get_parameter_value("str_no_default") == ""
    assert get_parameter_value("str_default") == "default"
    assert get_parameter_value("str_empty") == ""
    assert get_parameter_value("str_not_in_docstring") == ""

    assert get_parameter_value("bool_no_default") is False
    assert get_parameter_value("bool_default_false") is False
    assert get_parameter_value("bool_default_true") is True
    assert get_parameter_value("bool_not_in_docstring") is False

    assert get_parameter_value("int_no_default") == 0
    assert get_parameter_value("int_default_zero") == 0
    assert get_parameter_value("int_default_non_zero") == 2
    assert get_parameter_value("int_not_in_docstring") == 3

    assert get_parameter_value("dict_default_is_none") == "{}"  # {}
    assert get_parameter_value("list_default_is_none") == "[]"  # []

    # Ensure that type information is inferred correctly for properties that
    # define 'unusual' types, such as 'a dictionary of lists'
    assert get_parameter_format("unusual_type_dict") == "string"
    assert props_as_dict["unusual_type_dict"].json_data_type == "object"
    assert get_parameter_format("unusual_type_list") == "string"
    assert props_as_dict["unusual_type_list"].json_data_type == "array"

    # TestOperator has a property, 'mounted_volumes', whose id/ref collides with
    # the system-defined property of the same id. In these cases, the parsed property
    # should be preferred to the system-defined property, which should not appear.
    # Here we ensure that the 'mounted_volumes' property is a string-type (as defined
    # in the Operator class) rather than the system-defined list-type
    assert get_parameter_format("mounted_volumes") == "string"

    # Ensure that type information falls back to string if no type hint present
    # and no ':type: <type info>' phrase found in docstring
    assert get_parameter_format("fallback_type") == "string"

    # Ensure component parameters are marked as required in the correct circumstances
    # (parameter is required if there is no default value provided or if a type hint
    # does not include 'Optional[...]')
    assert get_parameter_required("str_no_default") is True
    assert get_parameter_required("str_default") is False
    assert get_parameter_required("str_empty") is False

    # Ensure descriptions are rendered properly with type hint in parentheses
    assert (
        get_parameter_description("unusual_type_dict") == "a dictionary parameter with the "
        "phrase 'list' in type description "
        "(type: a dictionary of arrays)"
    )
    assert (
        get_parameter_description("unusual_type_list") == "a list parameter with the phrase "
        "'string' in type description "
        "(type: a list of strings)"
    )
    assert get_parameter_description("fallback_type") == "(type: str)"

    # Ensure that a long description with line wrapping and a backslash escape has rendered
    # (and hence did not raise an error during json.loads in the properties API request)
    parsed_description = r"""a string parameter with a very long description
        that wraps lines and also has an escaped underscore in it, as shown here: (\_)"""  # noqa W605
    modified_description = parsed_description.replace("\n", " ") + " (type: str)"  # modify desc acc. to parser rules
    assert get_parameter_description("long_description_property") == modified_description

    # Retrieve properties for DeriveFromTestOperator
    # DeriveFromTestOperator includes type hints for all init arguments
    properties_json = ComponentCache.to_canvas_properties(derive_test_op)
    props_as_dict = {param.ref: param for param in derive_test_op.input_properties}

    # Ensure default values are parsed correct in the case where type hints are present
    assert get_parameter_value("str_default") == "default"
    assert get_parameter_value("bool_default") is True
    assert get_parameter_value("int_default") == 2

    # Ensure component parameters are prefixed with 'elyra_' and types are as expected
    # in the case when a type hint is provided (and regardless of whether or not the
    # parameter type is included in the docstring)
    assert get_parameter_format("str_no_default") == "string"
    assert get_parameter_format("str_default") == "string"
    assert get_parameter_format("str_optional_default") == "string"
    assert get_parameter_format("str_not_in_docstring") == "string"

    assert get_parameter_format("bool_no_default") == "boolean"
    assert get_parameter_format("bool_default") == "boolean"
    assert get_parameter_format("bool_not_in_docstring") == "boolean"

    assert get_parameter_format("int_no_default") == "number"
    assert get_parameter_format("int_default") == "number"
    assert get_parameter_format("int_not_in_docstring") == "number"

    assert get_parameter_format("list_optional_default") == "string"
    assert props_as_dict["list_optional_default"].json_data_type == "array"

    # Ensure component parameters are marked as required in the correct circumstances
    assert get_parameter_required("str_no_default") is True
    assert get_parameter_required("str_default") is False
    assert get_parameter_required("str_optional_default") is False
    assert get_parameter_required("str_not_in_docstring") is True

    # Retrieve properties for DeriveFromImportedOperator
    # DeriveFromImportedOperator includes type hints for dictionary and
    # list values to test the more complex parsing required in this case
    properties_json = ComponentCache.to_canvas_properties(import_test_op)
    props_as_dict = {param.ref: param for param in import_test_op.input_properties}

    # Ensure component parameters are prefixed with '' and types are as expected
    assert get_parameter_format("dict_no_default") == "string"
    assert props_as_dict["dict_no_default"].json_data_type == "object"
    assert get_parameter_format("dict_optional_no_default") == "string"
    assert props_as_dict["dict_optional_no_default"].json_data_type == "object"
    assert get_parameter_format("nested_dict_default") == "string"
    assert props_as_dict["nested_dict_default"].json_data_type == "object"
    assert get_parameter_format("dict_not_in_docstring") == "string"
    assert props_as_dict["dict_not_in_docstring"].json_data_type == "object"

    assert get_parameter_format("list_no_default") == "string"
    assert props_as_dict["list_no_default"].json_data_type == "array"
    assert get_parameter_format("list_optional_no_default") == "string"
    assert props_as_dict["list_optional_no_default"].json_data_type == "array"
    assert get_parameter_format("list_default") == "string"
    assert props_as_dict["list_default"].json_data_type == "array"
    assert get_parameter_format("list_optional_default") == "string"
    assert props_as_dict["list_optional_default"].json_data_type == "array"
    assert get_parameter_format("list_not_in_docstring") == "string"
    assert props_as_dict["list_not_in_docstring"].json_data_type == "array"

    assert get_parameter_value("dict_no_default") == "{}"
    assert get_parameter_value("list_no_default") == "[]"


def test_parse_airflow_component_url():
    # Define the appropriate reader for a URL-type component definition
    airflow_supported_file_types = [".py"]
    reader = UrlComponentCatalogConnector(airflow_supported_file_types)

    # Read contents of given path
    url = (
        "https://raw.githubusercontent.com/elyra-ai/elyra/main/elyra/tests/pipeline/"
        "resources/components/airflow_test_operator.py"
    )
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
    parser = ComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    component = parser.parse(catalog_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(component)

    # Ensure system parameters are present
    assert properties_json["properties"]["label"] is not None

    component_source = json.dumps({"catalog_type": catalog_type, "component_ref": catalog_entry.entry_reference})
    assert properties_json["properties"]["component_source"]["default"] == component_source

    # Helper method to retrieve the requested parameter value from the dictionary
    def get_parameter_value(param_name):
        property_dict = properties_json["properties"]["component_parameters"]["properties"][param_name]
        return property_dict["oneOf"][0]["properties"]["value"].get("default", "")

    assert get_parameter_value("str_no_default") == ""
    assert get_parameter_value("bool_default_true") is True
    assert get_parameter_value("int_default_non_zero") == 2
    assert get_parameter_value("unusual_type_dict") == "{}"  # {}
    assert get_parameter_value("unusual_type_list") == "[]"


def test_parse_airflow_component_file_no_inputs():
    # Define the appropriate reader for a filesystem-type component definition
    airflow_supported_file_types = [".py"]
    reader = FilesystemComponentCatalogConnector(airflow_supported_file_types)

    # Read contents of given path
    path = _get_resource_path("airflow_test_operator_no_inputs.py")
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
    parser = ComponentParser.create_instance(platform=RUNTIME_PROCESSOR)
    no_input_op = parser.parse(catalog_entry)[0]
    properties_json = ComponentCache.to_canvas_properties(no_input_op)

    # Properties JSON should only include the five parameters common to every
    # component: ('mounted_volumes', 'kubernetes_pod_annotations', 'kubernetes_pod_labels',
    # 'kubernetes_shared_mem_size', and 'kubernetes_tolerations')
    num_common_params = 5
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


@pytest.mark.parametrize(
    "invalid_url",
    [
        "https://non-existent-host.py",  # test an invalid host
        "https://raw.githubusercontent.com/elyra-ai/elyra/main/elyra/"
        "tests/pipeline/resources/components/missing_file.py",  # test an invalid file
    ],
    indirect=True,
)
async def test_parse_components_invalid_url(invalid_url):
    # Define the appropriate reader for a Url-type component definition
    airflow_supported_file_types = [".py"]
    reader = UrlComponentCatalogConnector(airflow_supported_file_types)

    # Get path to an invalid component definition file and read contents
    entry_data = reader.get_entry_data({"url": invalid_url}, {})
    assert entry_data is None
