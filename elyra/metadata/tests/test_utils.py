#
# Copyright 2018-2020 IBM Corporation
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
import errno
import io
import json
import os

from jsonschema import ValidationError
from elyra.metadata import METADATA_TEST_NAMESPACE, Metadata, MetadataStore, FileMetadataStore, \
    MetadataNotFoundError, MetadataExistsError
from typing import Optional, List, Any


valid_metadata_json = {
    'schema_name': 'metadata-test',
    'display_name': 'valid metadata instance',
    'metadata': {
        'uri_test': 'http://localhost:31823/v1/models?version=2017-02-13',
        'number_range_test': 8,
        'required_test': "required_value"
    }
}

another_metadata_json = {
    'schema_name': 'metadata-test',
    'name': 'another_instance',
    'display_name': 'Another Metadata Instance (2)',
    'metadata': {
        'uri_test': 'http://localhost:8081/',
        'required_test': "required_value"
    }
}

invalid_metadata_json = {
    'schema_name': 'metadata-test',
    'display_name': 'Invalid Metadata Instance - bad uri',
    'metadata': {
        'uri_test': '//localhost:8081/',
        'required_test': "required_value"
    }
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
    'schema_name': 'metadata-test',
    'metadata': {
        'uri_test': '//localhost:8081/',
        'required_test': "required_value"
    }
}

valid_display_name_json = {
    'schema_name': 'metadata-test',
    'display_name': '1 teste "rápido"',
    'metadata': {
        'required_test': "required_value"
    }
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
            "property4": "fourth prop"},
        "boolean_test": True,
        "null_test": "null"
    }
}

# Minimal json to be built upon for each property test.  Only
# required values are specified.
minmal_metadata_json = {
    "schema_name": "metadata-test",
    "display_name": "complete metadata instance",
    "metadata": {
        "required_test": "required_value"
    }
}


# Bring-your-own metadata template used to test hierarchical writes.  The
# display_name field will be updated to reflect the location's instance
# in the hierarchy
byo_metadata_json = {
    "schema_name": "metadata-test",
    "display_name": "location",
    "metadata": {
        "required_test": "required_value"
    }
}


def create_json_file(location, file_name, content):
    create_file(location, file_name, json.dumps(content))


def create_file(location, file_name, content):
    try:
        os.makedirs(location)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    resource = os.path.join(location, file_name)
    with open(resource, 'w', encoding='utf-8') as f:
        f.write(content)


def create_instance(metadata_store: MetadataStore, location: str, name: str, content: Any):
    if isinstance(metadata_store, FileMetadataStore):
        if isinstance(content, dict):
            create_json_file(location, name + '.json', content)
        else:
            create_file(location, name + '.json', content)
    elif isinstance(metadata_store, MockMetadataStore):
        instances = getattr(metadata_store, 'instances')
        if instances is None:
            setattr(metadata_store, 'instances', dict())
            instances = getattr(metadata_store, 'instances')
        if not isinstance(content, dict):
            content = {'display_name': name, 'reason': "JSON failed to load for instance '{}'".format(name)}
        instances[name] = content


def get_schema(schema_name):
    schema_file = os.path.join(os.path.dirname(__file__), '..', 'schemas', schema_name + '.json')
    if not os.path.exists(schema_file):
        raise ValidationError("Metadata schema file '{}' is missing!".format(schema_file))

    with io.open(schema_file, 'r', encoding='utf-8') as f:
        schema_json = json.load(f)

    return schema_json


def get_instance(instances, field, value):
    """Given a list of instances (dicts), return the dictionary where field == value."""
    for inst in instances:
        if inst[field] == value:
            return inst
    assert False, "Value '{}' for field '{}' was not found in instances!".format(value, field)


class PropertyTester(object):
    """Helper class used by elyra_md tests to test each of the properties in the test.json schema. """
    name = None             # prefixed with 'test_' is test name, post-fixed with '_test' is schema property name
    negative_res = False    # expected success of first test
    negative_value = None   # value to use in first test (usually negative test)
    negative_stdout = None  # expected string to find in first test's stdout
    negative_stderr = None  # expected string to find in second test's stdout
    positive_res = True     # expected success of second test
    positive_value = None   # value to use in second test (usually successful)

    def __init__(self, name):
        self.name = name
        self.property = name + "_test"

    def run(self, script_runner, mock_data_dir):
        expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE, self.name + '.json')
        # Cleanup from any potential previous failures
        if os.path.exists(expected_file):
            os.remove(expected_file)

        # First test
        ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                                '--name=' + self.name, '--display_name=' + self.name,
                                '--required_test=required_value',
                                '--' + self.property + '=' + str(self.negative_value))

        assert ret.success is self.negative_res
        assert self.negative_stdout in ret.stdout
        assert self.negative_stderr in ret.stderr

        # Second test
        ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                                '--name=' + self.name, '--display_name=' + self.name,
                                '--required_test=required_value',
                                '--' + self.property + '=' + str(self.positive_value))

        assert ret.success is self.positive_res
        assert "Metadata instance '" + self.name + "' for schema 'metadata-test' has been written" in ret.stdout

        assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE))
        assert os.path.isfile(expected_file)

        with open(expected_file, "r") as fd:
            instance_json = json.load(fd)
            assert instance_json["schema_name"] == 'metadata-test'
            assert instance_json["display_name"] == self.name
            assert instance_json["metadata"][self.property] == self.positive_value


class MockMetadataStore(MetadataStore):
    """Hypothetical class used to demonstrate (and test) use of custom storage classes."""

    def __init__(self, namespace: str, **kwargs: Any) -> None:
        super().__init__(namespace, **kwargs)
        self.instances = None

    def namespace_exists(self) -> bool:
        """Returns True if the namespace for this instance exists"""
        if self.instances is not None:
            return True
        return False

    def fetch_instances(self, name: Optional[str] = None, include_invalid: bool = False) -> List[dict]:
        """Fetch metadata instances"""

        if name:
            if self.instances is not None:
                if name in self.instances:
                    instance = self.instances.get(name)
                    if instance.get('reason'):
                        raise ValueError(instance.get('reason'))
                    instance['name'] = name
                    return [instance]
            raise MetadataNotFoundError(self.namespace, name)

        # all instances are wanted, filter based on include-invalid and reason ...
        instance_list = []
        if self.instances is not None:
            for name, instance in self.instances.items():
                if include_invalid or not instance.get('reason'):
                    instance['name'] = name
                    instance_list.append(instance)
        return instance_list

    def store_instance(self, name: str, metadata: dict, for_update: bool = False) -> dict:
        """Stores the named metadata instance."""
        try:
            instance = self.fetch_instances(name)
            if not for_update:  # Create - already exists
                raise MetadataExistsError(self.namespace, instance[0].get('resource'))
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
        name = metadata.get('name')
        self.instances.pop(name)


class MockMetadataTest(Metadata):
    """Hypothetical class used to demonstrate (and test) use of custom instance classes.

    This class name is referenced in the metadata-test schema.
    """
    for_update = None
    special_property = None

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.for_update = kwargs.get('for_update')
        self.special_property = kwargs.get('special_property')

    def to_dict(self, trim: bool = False) -> dict:
        d = super().to_dict(trim=trim)
        if self.for_update is not None:
            d['for_update'] = self.for_update
        if self.special_property is not None:
            d['special_property'] = self.special_property
        return d

    def post_load(self, **kwargs: Any) -> None:
        super().post_load(**kwargs)
        self.special_property = self.display_name

    def pre_save(self, **kwargs: Any) -> None:
        super().pre_save(**kwargs)
        self.for_update = kwargs['for_update']
        self.special_property = self.metadata['required_test']

    def pre_delete(self, **kwargs: Any) -> None:
        super().pre_delete(**kwargs)
        self.special_property = self.display_name


class MockMetadataTestInvalid(object):
    """Invalid metadata instance class that doesn't derive from Metadata.

    This requires an update to schema and is only used for manual testing.
    """
    def __init__(self, **kwargs: Any) -> None:
        pass
