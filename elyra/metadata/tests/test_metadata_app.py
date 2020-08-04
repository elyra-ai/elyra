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

"""Tests for elyra-metadata application"""
import json
import os
import pytest
import shutil
from tempfile import mkdtemp
from elyra.metadata import Metadata, MetadataManager, METADATA_TEST_NAMESPACE
from .test_utils import PropertyTester, create_json_file, valid_metadata_json, \
    another_metadata_json, invalid_metadata_json, invalid_no_display_name_json

os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests namespace


@pytest.fixture()
def mock_data_dir():
    runtime_dir = mkdtemp(prefix="runtime_")
    orig_data_dir = os.environ.get("JUPYTER_DATA_DIR")
    os.environ["JUPYTER_DATA_DIR"] = runtime_dir
    yield runtime_dir  # provide the fixture value
    shutil.rmtree(runtime_dir)
    if orig_data_dir:
        os.environ["JUPYTER_DATA_DIR"] = orig_data_dir
    else:
        os.environ.pop("JUPYTER_DATA_DIR")


def test_no_opts(script_runner):
    ret = script_runner.run('elyra-metadata')
    assert ret.success is False
    assert ret.stdout.startswith("No subcommand specified. Must specify one of: ['list', 'install', 'remove']")
    assert ret.stderr == ''


def test_bad_subcommand(script_runner):
    ret = script_runner.run('elyra-metadata', 'bogus-subcommand')
    assert ret.success is False
    assert ret.stdout.startswith("Subcommand 'bogus-subcommand' is invalid.")
    assert "No subcommand specified. Must specify one of: ['list', 'install', 'remove']" in ret.stdout
    assert ret.stderr == ''


def test_install_bad_argument(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("Subcommand '--bogus-argument' is invalid.")
    assert "Install a metadata instance into namespace \'{}\'.".format(METADATA_TEST_NAMESPACE) in ret.stdout


def test_install_bad_namespace(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', 'bogus-namespace')
    assert ret.success is False
    assert ret.stdout.startswith("Subcommand 'bogus-namespace' is invalid.")
    assert "Install a metadata instance into a given namespace." in ret.stdout
    assert "Install a metadata instance into namespace \'{}\'.".format(METADATA_TEST_NAMESPACE) in ret.stdout
    assert ret.stderr == ''


def test_install_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--help')
    assert ret.success is False
    assert ret.stdout.startswith("\nInstall a metadata instance into namespace '{}'.".format(METADATA_TEST_NAMESPACE))
    assert ret.stderr == ''


def test_install_no_schema_name(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE)
    assert ret.success is False
    assert ret.stdout.startswith("'--schema_name' is a required parameter.")
    assert ret.stderr == ''


def test_install_no_name(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test')
    assert ret.success is False
    assert ret.stdout.startswith("'--name' is a required parameter.")
    assert ret.stderr == ''


def test_install_invalid_name(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=UPPER_CASE_NOT_ALLOWED', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success is False
    assert ret.stdout.startswith("The following exception occurred saving metadata instance "
                                 "'UPPER_CASE_NOT_ALLOWED' for schema 'metadata-test'")
    assert "Name of metadata must be lowercase alphanumeric" in ret.stdout


def test_install_simple(script_runner, mock_data_dir):
    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE,
                                 'test-metadata_42_valid-name.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == 'display_name'
        assert instance_json["metadata"]["required_test"] == 'required_value'
        assert instance_json["metadata"]["number_default_test"] == 42  # defaults will always persist


def test_install_and_replace(script_runner, mock_data_dir):
    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE,
                                 'test-metadata_42_valid-name.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout

    # Re-attempt w/o replace flag - failure expected
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success is False
    assert ret.stdout == ''
    assert "An instance named 'test-metadata_42_valid-name' already exists in the metadata-tests " \
           "namespace" in ret.stderr

    # Re-attempt with replace flag - success expected
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value', '--replace')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == 'display_name'
        assert instance_json["metadata"]["required_test"] == 'required_value'
        assert instance_json["metadata"]["number_default_test"] == 42  # defaults will always persist


def test_list_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE, '--help')
    assert ret.success is False
    assert ret.stdout.startswith("\nList installed metadata for {}.".format(METADATA_TEST_NAMESPACE))
    assert ret.stderr == ''


def test_list_bad_argument(script_runner):
    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE, '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("The following arguments were unexpected: ['--bogus-argument']")
    assert ret.stderr == ''


def test_list_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(namespace=METADATA_TEST_NAMESPACE)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE)
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 2  # always 2 more than the actual runtime count
    assert lines[0].startswith("No metadata instances found for {}".format(METADATA_TEST_NAMESPACE))

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create('valid', valid)
    assert resource is not None
    resource = metadata_manager.create('valid2', valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.create('another', another)
    assert resource is not None
    resource = metadata_manager.create('another2', another)
    assert resource is not None

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE)
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 9  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for {} (includes invalid):".format(METADATA_TEST_NAMESPACE)
    line_elements = [line.split() for line in lines[4:8]]
    assert line_elements[0][0] == "metadata-test"
    assert line_elements[0][1] == "another"
    assert line_elements[1][0] == "metadata-test"
    assert line_elements[1][1] == "another2"
    assert line_elements[2][0] == "metadata-test"
    assert line_elements[2][1] == "valid"
    assert line_elements[3][0] == "metadata-test"
    assert line_elements[3][1] == "valid2"
    assert ret.stderr == ''

    # Remove the '2' runtimes and reconfirm smaller set
    metadata_manager.remove('valid2')
    metadata_manager.remove('another2')
    # Include two additional invalid files as well - one for uri failure, andother missing display_name
    metadata_dir = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE)
    create_json_file(metadata_dir, 'invalid.json', invalid_metadata_json)
    create_json_file(metadata_dir, 'no_display_name.json', invalid_no_display_name_json)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE)
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 9  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for {} (includes invalid):".format(METADATA_TEST_NAMESPACE)
    line_elements = [line.split() for line in lines[4:8]]
    assert line_elements[0][1] == "another"
    assert line_elements[1][1] == "invalid"
    assert line_elements[1][3] == "**INVALID**"
    assert line_elements[1][4] == "(ValidationError)"
    assert line_elements[2][3] == "**INVALID**"
    assert line_elements[2][4] == "(ValidationError)"
    assert line_elements[3][1] == "valid"

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE, '--valid-only')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 7  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for {} (valid only):".format(METADATA_TEST_NAMESPACE)
    line_elements = [line.split() for line in lines[4:6]]
    assert line_elements[0][1] == "another"
    assert line_elements[1][1] == "valid"


def test_list_json_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(namespace=METADATA_TEST_NAMESPACE)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE, '--json')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 2
    assert lines[0] == "[]"

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create('valid', valid)
    assert resource is not None
    resource = metadata_manager.create('valid2', valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.create('another', another)
    assert resource is not None
    resource = metadata_manager.create('another2', another)
    assert resource is not None

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE, '--json')
    assert ret.success
    assert ret.stderr == ''
    # Consume results
    results = json.loads(ret.stdout)
    assert len(results) == 4

    # Remove the '2' runtimes and reconfirm smaller set
    metadata_manager.remove('valid2')
    metadata_manager.remove('another2')

    # Include two additional invalid files as well - one for uri failure, andother missing display_name
    metadata_dir = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE)
    create_json_file(metadata_dir, 'invalid.json', invalid_metadata_json)
    create_json_file(metadata_dir, 'no_display_name.json', invalid_no_display_name_json)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE, '--json')
    assert ret.success
    results = json.loads(ret.stdout)
    assert len(results) == 4

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_NAMESPACE, '--json', '--valid-only')
    assert ret.success
    results = json.loads(ret.stdout)
    assert len(results) == 2


def test_remove_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_NAMESPACE, '--help')
    assert ret.success is False
    assert ret.stdout.startswith("\nRemove a metadata instance from namespace '{}'.".format(METADATA_TEST_NAMESPACE))
    assert ret.stderr == ''


def test_remove_no_name(script_runner):
    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_NAMESPACE)
    assert ret.success is False
    assert ret.stdout.startswith("'--name' is a required parameter.")
    assert ret.stderr == ''


def test_remove_malformed_name(script_runner):
    # Attempt removal but forget the '=' between parameter and value

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_NAMESPACE, '--name', 'valid')
    assert ret.success is False
    assert ret.stderr == ''
    assert "Parameter '--name' requires a value." in ret.stdout


def test_remove_missing(script_runner):
    # Create an instance so that the namespace exists.
    metadata_manager = MetadataManager(namespace=METADATA_TEST_NAMESPACE)
    valid = Metadata(**valid_metadata_json)
    metadata_manager.update('valid', valid)

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_NAMESPACE, '--name=missing')
    assert ret.success is False
    assert ret.stderr == ''
    assert "No such instance named 'missing' was found in the metadata-tests namespace." in ret.stdout

    # Now cleanup original instance.
    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_NAMESPACE, '--name=valid')
    assert ret.success


def test_remove_instance(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(namespace=METADATA_TEST_NAMESPACE)

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create('valid', valid)
    assert resource is not None
    resource = metadata_manager.create('valid2', valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.create('another', another)
    assert resource is not None
    resource = metadata_manager.create('another2', another)
    assert resource is not None

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_NAMESPACE, '--name=valid')
    assert ret.success

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_NAMESPACE, '--name=another')
    assert ret.success

    instances = metadata_manager.get_all()
    assert len(instances) == 2
    assert instances[0].name.endswith('2')
    assert instances[1].name.endswith('2')


# Begin property tests...

def test_required(script_runner, mock_data_dir):
    # Doesn't use PropertyTester due to its unique test since all other tests require this property
    name = "required"

    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE, name + '.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--display_name=' + name)

    assert ret.success is False
    assert "'--required_test' is a required parameter" in ret.stdout

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--display_name=' + name,
                            '--required_test=required_value')

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["required_test"] == "required_value"


def test_number_default(script_runner, mock_data_dir):
    # Doesn't use PropertyTester due to its unique test (no failure, needs --replace, etc.)
    name = "number_default"

    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE, name + '.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    # No negative test here.  First create w/o a value and ensure 42, then create with a value and ensure that value.
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--display_name=' + name,
                            '--required_test=required_value')

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["number_default_test"] == 42

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_NAMESPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--display_name=' + name,
                            '--required_test=required_value', '--replace',
                            '--number_default_test=7.2')

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_NAMESPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["number_default_test"] == 7.2


def test_uri(script_runner, mock_data_dir):
    prop_test = PropertyTester("uri")
    prop_test.negative_value = "//invalid-uri"
    prop_test.negative_stdout = "Property used to test uri formatting; title: URI Test, format: uri"
    prop_test.negative_stderr = "'//invalid-uri' is not a 'uri'"
    prop_test.positive_value = "http://localhost:31823/v1/models?version=2017-02-13"
    prop_test.run(script_runner, mock_data_dir)


def test_integer_exclusivity(script_runner, mock_data_dir):
    prop_test = PropertyTester("integer_exclusivity")
    prop_test.negative_value = 3
    prop_test.negative_stdout = "Property used to test integers with exclusivity restrictions; " \
                                "title: Integer Exclusivity Test, exclusiveMinimum: 3, exclusiveMaximum: 10"
    prop_test.negative_stderr = "3 is less than or equal to the minimum of 3"
    prop_test.positive_value = 7
    prop_test.run(script_runner, mock_data_dir)


def test_integer_multiple(script_runner, mock_data_dir):
    prop_test = PropertyTester("integer_multiple")
    prop_test.negative_value = 32
    prop_test.negative_stdout = "Property used to test integers with multipleOf restrictions; " \
                                "title: Integer Multiple Test, multipleOf: 7"
    prop_test.negative_stderr = "32 is not a multiple of 7"
    prop_test.positive_value = 42
    prop_test.run(script_runner, mock_data_dir)


def test_number_range(script_runner, mock_data_dir):
    prop_test = PropertyTester("number_range")
    prop_test.negative_value = 2.7
    prop_test.negative_stdout = "Property used to test numbers with range; " \
                                "title: Number Range Test, minimum: 3, maximum: 10"
    prop_test.negative_stderr = "2.7 is less than the minimum of 3"
    prop_test.positive_value = 7.2
    prop_test.run(script_runner, mock_data_dir)


def test_const(script_runner, mock_data_dir):
    prop_test = PropertyTester("const")
    prop_test.negative_value = 2.718
    prop_test.negative_stdout = "Property used to test properties with const; title: Const Test, const: 3.14"
    prop_test.negative_stderr = "3.14 was expected"
    prop_test.positive_value = 3.14
    prop_test.run(script_runner, mock_data_dir)


def test_string_length(script_runner, mock_data_dir):
    prop_test = PropertyTester("string_length")
    prop_test.negative_value = "12345678901"
    prop_test.negative_stdout = "Property used to test strings with length restrictions; " \
                                "title: String Length Test, minLength: 3, maxLength: 10"
    prop_test.negative_stderr = "'12345678901' is too long"
    prop_test.positive_value = "123456"
    prop_test.run(script_runner, mock_data_dir)


def test_string_pattern(script_runner, mock_data_dir):
    prop_test = PropertyTester("string_pattern")  # Must start/end with alphanumeric, can include '-' and '.'
    prop_test.negative_value = "-foo1"
    prop_test.negative_stdout = "Property used to test strings with pattern restrictions; " \
                                "title: String Pattern Test, pattern: ^[a-z0-9][a-z0-9-.]*[a-z0-9]$"
    prop_test.negative_stderr = "'-foo1' does not match '^[a-z0-9][a-z0-9-.]*[a-z0-9]$'"
    prop_test.positive_value = "0foo-bar.com-01"
    prop_test.run(script_runner, mock_data_dir)


def test_enum(script_runner, mock_data_dir):
    prop_test = PropertyTester("enum")
    prop_test.negative_value = "jupyter"
    prop_test.negative_stdout = "Property used to test properties with enums; " \
                                "title: Enum Test, enum: ['elyra', 'rocks']"
    prop_test.negative_stderr = "'jupyter' is not one of ['elyra', 'rocks']"
    prop_test.positive_value = "rocks"
    prop_test.run(script_runner, mock_data_dir)


def test_array(script_runner, mock_data_dir):
    prop_test = PropertyTester("array")
    prop_test.negative_value = [1, 2, 2]
    prop_test.negative_stdout = "Property used to test array with item restrictions; " \
                                "title: Array Test, minItems: 3, maxItems: 10, uniqueItems: True"
    prop_test.negative_stderr = "[1, 2, 2] has non-unique elements"
    prop_test.positive_value = [1, 2, 3, 4, 5]
    prop_test.run(script_runner, mock_data_dir)


def test_object(script_runner, mock_data_dir):
    prop_test = PropertyTester("object")
    prop_test.negative_value = {'prop1': 2, 'prop2': 3}
    prop_test.negative_stdout = "Property used to test object elements with properties restrictions; " \
                                "title: Object Test, minProperties: 3, maxProperties: 10"
    prop_test.negative_stderr = "{'prop1': 2, 'prop2': 3} does not have enough properties"
    prop_test.positive_value = {'prop1': 2, 'prop2': 3, 'prop3': 4, 'prop4': 5}
    prop_test.run(script_runner, mock_data_dir)


def test_boolean(script_runner, mock_data_dir):
    prop_test = PropertyTester("boolean")
    prop_test.negative_value = "bogus_boolean"
    prop_test.negative_stdout = "Property used to test boolean values; title: Boolean Test"
    prop_test.negative_stderr = "'bogus_boolean' is not of type 'boolean'"
    prop_test.positive_value = True
    prop_test.run(script_runner, mock_data_dir)


def test_null(script_runner, mock_data_dir):
    prop_test = PropertyTester("null")
    prop_test.negative_value = "bogus_null"
    prop_test.negative_stdout = "Property used to test null types; title: Null Test"
    prop_test.negative_stderr = "'bogus_null' is not of type 'null'"
    prop_test.positive_value = None
    prop_test.run(script_runner, mock_data_dir)
