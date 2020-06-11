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
from ..metadata import METADATA_TEST_NAMESPACE

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
    'display_name': 'Invalid Metadata Instance',
    'metadata': {
        'uri_test': '//localhost:8081/',
        'required_test': "required_value"
    }
}

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
    try:
        os.makedirs(location)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    resource = os.path.join(location, file_name)
    with open(resource, 'w', encoding='utf-8') as f:
        f.write(json.dumps(content))


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
