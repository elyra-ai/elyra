#
# Copyright 2018-2023 Elyra Authors
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
import copy
import errno
import io
import json
import os
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from traitlets.config import LoggingConfigurable

from elyra.metadata.error import MetadataExistsError
from elyra.metadata.error import MetadataNotFoundError
from elyra.metadata.metadata import Metadata
from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE
from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE_ID
from elyra.metadata.schema import Schemaspace
from elyra.metadata.schema import SchemasProvider
from elyra.metadata.storage import FileMetadataStore
from elyra.metadata.storage import MetadataStore


NON_EXISTENT_SCHEMASPACE_ID = "9ab68f6f-000c-470e-814d-2af59ea0956e"

valid_metadata_json = {
    "schema_name": "metadata-test",
    "display_name": "valid metadata instance",
    "metadata": {
        "uri_test": "http://localhost:31823/v1/models?version=2017-02-13",
        "number_range_test": 8,
        "required_test": "required_value",
    },
}

valid_metadata2_json = {
    "schema_name": "metadata-test2",
    "display_name": "valid metadata2 instance",
    "metadata": {
        "uri_test": "http://localhost:31823/v1/models?version=2017-02-13",
        "number_range_test": 8,
        "required_test": "required_value",
    },
}

another_metadata_json = {
    "schema_name": "metadata-test",
    "name": "another_instance",
    "display_name": "Another Metadata Instance (2)",
    "metadata": {"uri_test": "http://localhost:8081/", "required_test": "required_value"},
}

invalid_metadata_json = {
    "schema_name": "metadata-test",
    "display_name": "Invalid Metadata Instance - bad uri",
    "metadata": {"uri_test": "//localhost:8081/", "required_test": "required_value"},
}

invalid_json = "{\
    'schema_name': 'metadata-test',\
    'display_name': 'Invalid Metadata Instance - missing comma'\
    'metadata': {\
        'uri_test': '//localhost:8081/',\
        'required_test': 'required_value'\
    }\
}"

invalid_no_display_name_json = {
    "schema_name": "metadata-test",
    "metadata": {"uri_test": "//localhost:8081/", "required_test": "required_value"},
}

valid_display_name_json = {
    "schema_name": "metadata-test",
    "display_name": '1 teste "rápido"',
    "metadata": {"required_test": "required_value"},
}


invalid_schema_name_json = {
    "schema_name": "metadata-testxxx",
    "display_name": "invalid schema name",
    "metadata": {
        "uri_test": "http://localhost:31823/v1/models?version=2017-02-13",
        "number_range_test": 8,
        "required_test": "required_value",
    },
}


# Contains all values corresponding to test schema...
complete_metadata_json = {
    "schema_name": "metadata-test",
    "display_name": "complete metadata instance",
    "metadata": {
        "required_test": "required_value",
        "uri_test": "http://localhost:31823/v1/models?version=2017-02-13",
        "integer_exclusivity_test": 7,
        "integer_multipleOf7_test": 42,
        "number_range_test": 8,
        # purposely missing "number_default_test": 42
        "const_test": 3.14,
        "string_length_test": "1234567",
        "enum_test": "rocks",
        "array_test": ["elyra", "rocks", "the", "world"],
        "object_test": {
            "property1": "first prop",
            "property2": "second_prop",
            "property3": "third prop",
            "property4": "fourth prop",
        },
        "boolean_test": True,
        "null_test": "null",
    },
}

# Minimal json to be built upon for each property test.  Only
# required values are specified.
minimal_metadata_json = {
    "schema_name": "metadata-test",
    "display_name": "complete metadata instance",
    "metadata": {"required_test": "required_value"},
}


# Bring-your-own metadata template used to test hierarchical writes.  The
# display_name field will be updated to reflect the location's instance
# in the hierarchy
byo_metadata_json = {
    "schema_name": "metadata-test",
    "display_name": "location",
    "metadata": {"required_test": "required_value"},
}

# Used in test_update_complex to test --file option
one_of_json = {
    "schema_name": "metadata-test",
    "display_name": "oneOf Testing",
    "metadata": {
        "required_test": "required_value",
        "oneOf_test": {"obj2_prop1": 42, "obj2_prop2": 24, "obj_switch": "obj2"},
    },
}

# Used in test_update_complex to test --allOf_test option (i.e., ovp option)
all_of_json = {
    "obj1_prop1": "allOf-test-val1",
    "obj1_prop2": "allOf-test-val2",
    "obj1_switch": "obj1",
    "obj2_prop1": 42,
    "obj2_prop2": 24,
    "obj2_switch": "obj2",
    "obj3_prop1": 42.7,
    "obj3_prop2": True,
    "obj3_switch": "obj3",
}


def create_json_file(location: Any, file_name: str, content: Dict) -> str:
    return create_file(location, file_name, json.dumps(content))


def create_file(location: Any, file_name: str, content: str) -> str:
    try:
        os.makedirs(location)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    resource = os.path.join(location, file_name)
    with open(resource, "w", encoding="utf-8") as f:
        f.write(content)
    return resource


def create_instance(metadata_store: MetadataStore, location: str, name: str, content: Any) -> str:
    resource = name
    if isinstance(metadata_store, FileMetadataStore):
        if isinstance(content, dict):
            create_json_file(location, name + ".json", content)
        else:
            create_file(location, name + ".json", content)
        resource = os.path.join(location, name + ".json")
    elif isinstance(metadata_store, MockMetadataStore):
        instances = metadata_store.instances
        if instances is None:
            setattr(metadata_store, "instances", dict())
            instances = metadata_store.instances
        if not isinstance(content, dict):
            content = {"display_name": name, "reason": f"JSON failed to load for instance '{name}'"}
        instances[name] = content
    return resource


def get_instance(instances, field, value):
    """Given a list of instances (dicts), return the dictionary where field == value."""
    for inst in instances:
        if inst[field] == value:
            return inst
    assert False, f"Value '{value}' for field '{field}' was not found in instances!"


class PropertyTester(object):
    """Helper class used by elyra_md tests to test each of the properties in the test.json schema."""

    name = None  # prefixed with 'test_' is test name, post-fixed with '_test' is schema property name
    negative_res = False  # expected success of first test
    negative_value = None  # value to use in first test (usually negative test)
    negative_stdout = None  # expected string to find in first test's stdout
    negative_stderr = None  # expected string to find in second test's stdout
    positive_res = True  # expected success of second test
    positive_value = None  # value to use in second test (usually successful)

    def __init__(self, name):
        self.name = name
        self.property = name + "_test"

    def run(self, script_runner, mock_data_dir):
        expected_file = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, self.name + ".json")
        # Cleanup from any potential previous failures
        if os.path.exists(expected_file):
            os.remove(expected_file)

        # First test
        ret = script_runner.run(
            "elyra-metadata",
            "create",
            METADATA_TEST_SCHEMASPACE,
            "--schema_name=metadata-test",
            "--name=" + self.name,
            "--display_name=" + self.name,
            "--required_test=required_value",
            "--" + self.property + "=" + str(self.negative_value),
        )

        assert ret.success is self.negative_res
        assert self.negative_stdout in ret.stdout
        assert self.negative_stderr in ret.stderr

        # Second test
        ret = script_runner.run(
            "elyra-metadata",
            "create",
            METADATA_TEST_SCHEMASPACE,
            "--schema_name=metadata-test",
            "--name=" + self.name,
            "--display_name=" + self.name,
            "--required_test=required_value",
            "--" + self.property + "=" + str(self.positive_value),
        )

        assert ret.success is self.positive_res
        assert "Metadata instance '" + self.name + "' for schema 'metadata-test' has been written" in ret.stdout

        assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
        assert os.path.isfile(expected_file)

        with open(expected_file, "r") as fd:
            instance_json = json.load(fd)
            assert instance_json["schema_name"] == "metadata-test"
            assert instance_json["display_name"] == self.name
            assert instance_json["metadata"][self.property] == self.positive_value


class MockMetadataStore(MetadataStore):
    """Hypothetical class used to demonstrate (and test) use of custom storage classes."""

    def __init__(self, schemaspace: str, **kwargs: Any) -> None:
        super().__init__(schemaspace, **kwargs)
        self.instances = None

    def schemaspace_exists(self) -> bool:
        """Returns True if the schemaspace for this instance exists"""
        return self.instances is not None

    def fetch_instances(self, name: Optional[str] = None, include_invalid: bool = False) -> List[dict]:
        """Fetch metadata instances"""

        if name:
            if self.instances is not None and name in self.instances:
                instance = self.instances.get(name)
                if instance.get("reason"):
                    raise ValueError(instance.get("reason"))
                instance["name"] = name
                return [instance]
            raise MetadataNotFoundError(self.schemaspace, name)

        # all instances are wanted, filter based on include-invalid and reason ...
        instance_list = []
        if self.instances is not None:
            for name, instance in self.instances.items():
                if include_invalid or not instance.get("reason"):
                    instance["name"] = name
                    instance_list.append(instance)
        return instance_list

    def store_instance(self, name: str, metadata: dict, for_update: bool = False) -> dict:
        """Stores the named metadata instance."""
        try:
            instance = self.fetch_instances(name)
            if not for_update:  # Create - already exists
                raise MetadataExistsError(self.schemaspace, instance[0].get("resource"))
        except MetadataNotFoundError as mnfe:
            if for_update:  # Update - doesn't exist
                raise mnfe from mnfe

        if self.instances is None:
            self.instances = dict()
        self.instances[name] = metadata  # persisted, now fetch

        instance = self.fetch_instances(name)  # confirm persistence
        return instance[0]

    def delete_instance(self, metadata: dict) -> None:
        """Deletes the metadata instance."""
        name = metadata.get("name")
        self.instances.pop(name)


class MockMetadataTest(Metadata):
    """Hypothetical class used to demonstrate (and test) use of custom instance classes.

    This class name is referenced in the metadata-test schema.
    """

    pre_property = None
    post_property = None

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.pre_property = kwargs.get("pre_property")
        self.post_property = kwargs.get("post_property")

    def to_dict(self, trim: bool = False) -> dict:
        d = super().to_dict(trim=trim)
        if self.pre_property is not None:
            d["pre_property"] = self.pre_property
        if self.post_property is not None:
            d["post_property"] = self.post_property
        return d

    def on_load(self, **kwargs: Any) -> None:
        super().on_load(**kwargs)
        self.post_property = self.display_name

    def pre_save(self, **kwargs: Any) -> None:
        super().pre_save(**kwargs)
        self.pre_property = self.metadata["required_test"]

    def post_save(self, **kwargs: Any) -> None:
        super().post_save(**kwargs)
        self.post_property = self.display_name

    def pre_delete(self, **kwargs: Any) -> None:
        super().pre_delete(**kwargs)
        self.pre_property = self.metadata["required_test"]

    def post_delete(self, **kwargs: Any) -> None:
        super().post_delete(**kwargs)
        self.post_property = self.display_name


class MockMetadataTestRollback(MockMetadataTest):
    """Used by metadata tests to validate rollback behaviors when post-save/delete hooks throw exceptions."""

    def post_save(self, **kwargs: Any) -> None:
        super().post_save(**kwargs)
        for_update = kwargs["for_update"]
        if os.getenv("METADATA_TEST_HOOK_OP", "skipped") == "create" and not for_update:
            raise NotImplementedError
        if os.getenv("METADATA_TEST_HOOK_OP", "skipped") == "update" and for_update:
            raise ModuleNotFoundError
        self.post_property = self.display_name

    def post_delete(self, **kwargs: Any) -> None:
        super().post_delete(**kwargs)
        if os.getenv("METADATA_TEST_HOOK_OP", "skipped") == "delete":
            raise FileNotFoundError
        self.post_property = self.display_name


class MockMetadataTestInvalid(object):
    """Invalid metadata instance class that doesn't derive from Metadata.

    This requires an update to schema and is only used for manual testing.
    """

    def __init__(self, **kwargs: Any) -> None:
        pass


class MetadataTestSchemaspace(Schemaspace):
    def __init__(self, *args, **kwargs):
        super().__init__(
            schemaspace_id=METADATA_TEST_SCHEMASPACE_ID,
            name=METADATA_TEST_SCHEMASPACE,
            description="Schemaspace for instances of metadata for testing",
            **kwargs,
        )


class BYOSchemaspaceBadId(Schemaspace):
    def __init__(self, *args, **kwargs):
        super().__init__(schemaspace_id="byo_schemaspace_bad_id", name="byo-schemaspace-bad-id", **kwargs)


class BYOSchemaspaceBadName(Schemaspace):
    def __init__(self, *args, **kwargs):
        super().__init__(
            schemaspace_id="b5b391d7-24f5-4b62-93bb-5e5423e651b8", name="byo.schemaspace-bad.name", **kwargs
        )


class BYOSchemaspaceBadClass(LoggingConfigurable):
    """Class is not a subclass of Schemaspace"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class BYOSchemaspaceCaseSensitiveName(Schemaspace):
    def __init__(self, *args, **kwargs):
        super().__init__(
            schemaspace_id="1b1e461a-c7fa-40f2-a3a3-bf1f2fd48eeA", name="byo-schemaspace_CaseSensitiveName", **kwargs
        )


class BYOSchemaspaceThrows(Schemaspace):
    BYO_SCHEMASPACE_ID = "20c98d38-36f6-4f05-a4dc-9b0a6c2cb734"
    BYO_SCHEMASPACE_NAME = "byo-schemaspace-throws"

    def __init__(self, *args, **kwargs):
        super().__init__(
            schemaspace_id=BYOSchemaspace.BYO_SCHEMASPACE_ID, name=BYOSchemaspace.BYO_SCHEMASPACE_NAME, **kwargs
        )
        raise NotImplementedError("Test that throw from constructor is not harmful.")


class BYOSchemaspace(Schemaspace):
    BYO_SCHEMASPACE_ID = "20c98d38-36f6-4f05-a4dc-9b0a6c2cb733"
    BYO_SCHEMASPACE_NAME = "byo-schemaspace"

    def __init__(self, *args, **kwargs):
        super().__init__(
            schemaspace_id=BYOSchemaspace.BYO_SCHEMASPACE_ID, name=BYOSchemaspace.BYO_SCHEMASPACE_NAME, **kwargs
        )


class MetadataTestSchemasProvider(SchemasProvider):
    """Returns schemas relative to Runtime Images schemaspace."""

    def get_schemas(self) -> List[Dict]:
        schemas = []
        parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        schema_dir = os.path.join(parent_dir, "metadata", "schemas")
        schema_files = [
            json_file
            for json_file in os.listdir(schema_dir)
            if json_file.endswith(".json") and json_file.startswith("metadata-test")
        ]
        for json_file in schema_files:
            schema_file = os.path.join(schema_dir, json_file)
            with io.open(schema_file, "r", encoding="utf-8") as f:
                schema_json = json.load(f)

                if json_file == "metadata-test.json":  # Apply filtering
                    # Update multipleOf from 7 to 6 and and value 'added' to enum-valued property
                    multiple_of: int = schema_json["properties"]["metadata"]["properties"]["integer_multiple_test"][
                        "multipleOf"
                    ]
                    assert multiple_of == 7
                    schema_json["properties"]["metadata"]["properties"]["integer_multiple_test"]["multipleOf"] = 6

                    enum: list = schema_json["properties"]["metadata"]["properties"]["enum_test"]["enum"]
                    assert len(enum) == 2
                    enum.append("added")
                    schema_json["properties"]["metadata"]["properties"]["enum_test"]["enum"] = enum

                schemas.append(schema_json)

        return schemas


def schema_factory(schemaspace_id: str, schemaspace_name: str, num_good: int, bad_reasons: List[str]) -> List[Dict]:
    # get the metadata test schema as a primary copy
    parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    schema_file = os.path.join(parent_dir, "metadata", "schemas", "metadata-test.json")
    with io.open(schema_file, "r", encoding="utf-8") as f:
        primary_schema = json.load(f)

    def create_base_schema(primary: Dict, tag: str, ss_name: str, ss_id: str) -> Dict:
        base_schema: Dict = copy.deepcopy(primary)
        base_schema["title"] = f"BYO Test {tag}"
        base_schema["name"] = f"byo-test-{tag}"
        base_schema["display_name"] = base_schema["title"]
        base_schema["schemaspace"] = ss_name
        base_schema["schemaspace_id"] = ss_id
        base_schema["properties"]["schema_name"]["const"] = base_schema["name"]
        base_schema.pop("metadata_class_name")
        return base_schema

    schemas = []
    # Gather bad schemas
    for reason in bad_reasons:
        schema = create_base_schema(primary_schema, reason, schemaspace_name, schemaspace_id)
        if reason == "missing_required":  # remove display_name
            schema["properties"].pop("display_name")  # This will trigger a validation error
        elif reason == "unknown_schemaspace":  # update schemaspace_id to a non-existent schemaspace
            schema["schemaspace_id"] = NON_EXISTENT_SCHEMASPACE_ID
        schemas.append(schema)

    # Gather good schemas
    for i in range(num_good):
        schemas.append(create_base_schema(primary_schema, str(i), schemaspace_name, schemaspace_id))

    return schemas


class BYOSchemasProvider(SchemasProvider):
    """Test SchemasProvider that loads the metadata-test schema and adjusts its values to match BYOSchemaspace."""

    def get_schemas(self) -> List[Dict]:
        # We'll create 2 good schemas and 2 bad schemas for BYOSchemaspace
        schemas = schema_factory(
            BYOSchemaspace.BYO_SCHEMASPACE_ID,
            BYOSchemaspace.BYO_SCHEMASPACE_NAME,
            2,
            ["missing_required", "unknown_schemaspace"],
        )
        return schemas


class BYOSchemasProviderThrows(SchemasProvider):
    """Test SchemasProvider that raises an exception to ensure the exception doesn't mess things up."""

    def get_schemas(self) -> List[Dict]:
        raise ModuleNotFoundError("Exception to ensure bad providers are not side-effecting.")


class BYOSchemasProviderBadClass(object):
    """Test SchemasProvider that is of the wrong subclass."""

    def get_schemas(self) -> List[Dict]:
        schemas = schema_factory(BYOSchemaspace.BYO_SCHEMASPACE_ID, BYOSchemaspace.BYO_SCHEMASPACE_NAME, 2, [])
        return schemas
