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

"""Tests for elyra-metadata application"""
import json
import os
import shutil
from tempfile import mkdtemp
from typing import Optional

import pytest

from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE
from elyra.metadata.schema import METADATA_TEST_SCHEMASPACE_ID
from elyra.tests.metadata.test_utils import all_of_json
from elyra.tests.metadata.test_utils import another_metadata_json
from elyra.tests.metadata.test_utils import create_json_file
from elyra.tests.metadata.test_utils import invalid_metadata_json
from elyra.tests.metadata.test_utils import invalid_no_display_name_json
from elyra.tests.metadata.test_utils import invalid_schema_name_json
from elyra.tests.metadata.test_utils import one_of_json
from elyra.tests.metadata.test_utils import PropertyTester
from elyra.tests.metadata.test_utils import valid_metadata_json

os.environ["METADATA_TESTING"] = "1"  # Enable metadata-tests schemaspace


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
    assert "No subcommand specified. Must specify one of: ['list', 'install', 'remove', 'migrate']" in ret.stdout


def test_bad_subcommand(script_runner):
    ret = script_runner.run('elyra-metadata', 'bogus-subcommand')
    assert ret.success is False
    assert ret.stdout.startswith("Subcommand 'bogus-subcommand' is invalid.")
    assert "No subcommand specified. Must specify one of: ['list', 'install', 'remove', 'migrate']" in ret.stdout


def test_install_bad_argument(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("Subcommand '--bogus-argument' is invalid.")
    assert "Install a metadata instance into schemaspace \'{}\'.".format(METADATA_TEST_SCHEMASPACE) in ret.stdout


def test_install_bad_schemaspace(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', 'bogus-schemaspace')
    assert ret.success is False
    assert ret.stdout.startswith("Subcommand 'bogus-schemaspace' is invalid.")
    assert "Install a metadata instance into a given schemaspace." in ret.stdout
    assert "Install a metadata instance into schemaspace \'{}\'.".format(METADATA_TEST_SCHEMASPACE) in ret.stdout


def test_install_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--help')
    assert ret.success is False
    assert ret.stdout.startswith(f"\nInstall a metadata instance into schemaspace '{METADATA_TEST_SCHEMASPACE}'.")


def test_install_no_schema_single(script_runner, mock_data_dir):
    # Use the runtime-images schemaspace since that is most likely to always be a single-schema schemaspace.
    # Note: this test will break if it ever supports multiple.
    ret = script_runner.run('elyra-metadata', 'install', "runtime-images")
    assert ret.success is False
    assert ret.stdout.startswith("'--display_name' is a required parameter.")


def test_install_no_schema_multiple(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE)
    assert ret.success is False
    # Since order in dictionaries, where the one-of list is derived, can be random, just check up to the
    # first known difference in the schema names.
    assert ret.stdout.startswith("'--schema_name' is a required parameter and must be one of the "
                                 "following values: ['metadata-test")


def test_install_bad_schema_multiple(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-foo')
    assert ret.success is False
    assert ret.stdout.startswith("Parameter '--schema_name' requires one of the following values: ['metadata-test")


def test_install_no_name(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test')
    assert ret.success is False
    assert ret.stdout.startswith("'--display_name' is a required parameter.")


def test_install_complex_usage(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test')
    assert ret.success is False
    assert 'Note: The following properties in this schema contain JSON keywords that are not supported' in ret.stdout
    assert '*** References unsupported keywords: {\'oneOf\'}' in ret.stdout
    assert '*** References unsupported keywords: {\'allOf\'}' in ret.stdout
    assert '*** References unsupported keywords: {\'$ref\'}' in ret.stdout


def test_install_only_display_name(script_runner, mock_data_dir):
    metadata_display_name = "1 teste 'rápido'"
    metadata_name = 'a_1_teste_rpido'

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            f'--display_name={metadata_display_name}', '--required_test=required_value')
    assert ret.success is True
    assert ret.stdout.startswith(f"Metadata instance '{metadata_name}' for schema 'metadata-test' has been written to:")

    # Ensure it can be fetched by name...
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE_ID)
    resource = metadata_manager.get(metadata_name)
    assert resource.display_name == metadata_display_name


def test_install_invalid_name(script_runner, mock_data_dir):
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=UPPER_CASE_NOT_ALLOWED', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success is False
    assert ret.stdout.startswith("The following exception occurred saving metadata instance for schema 'metadata-test'")
    assert "Name of metadata must be lowercase alphanumeric" in ret.stdout


def test_install_simple(script_runner, mock_data_dir):
    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE,
                                 'test-metadata_42_valid-name.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == 'display_name'
        assert instance_json["metadata"]["required_test"] == 'required_value'
        assert instance_json["metadata"]["number_default_test"] == 42  # defaults will always persist


def test_install_and_replace(script_runner, mock_data_dir):
    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE,
                                 'test-metadata_42_valid-name.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value', '--number_default_test=24')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout
    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["metadata"]["number_default_test"] == 24  # ensure CLI value is used over default

    # Re-attempt w/o replace flag - failure expected
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success is False
    assert "An instance named 'test-metadata_42_valid-name' already exists in the metadata-tests " \
           "schemaspace" in ret.stderr

    # Re-attempt with replace flag but without --name - failure expected
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--display_name=display_name', '--required_test=required_value', '--replace')
    assert ret.success is False
    assert "The 'name' parameter requires a value" in ret.stdout

    # Re-attempt with replace flag - success expected
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value', '--replace')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == 'display_name'
        assert instance_json["metadata"]["required_test"] == 'required_value'
        assert instance_json["metadata"]["number_default_test"] == 24  # ensure original value is used over default


@pytest.mark.parametrize("complex_keyword", ["defs", "oneOf", "allOf"])
def test_install_and_replace_complex(script_runner, mock_data_dir, complex_keyword):

    test_file: Optional[str] = None
    name: str = f"test-complex-{complex_keyword}".lower()

    if complex_keyword == "defs":
        option = "--json"
        value = "{ \"defs_test\": 42 }"

    elif complex_keyword == "oneOf":
        option = "--file"
        # Build the file...
        test_file = os.path.join(mock_data_dir, f'{complex_keyword}.json')
        with open(test_file, mode='w') as one_of_fd:
            json.dump(one_of_json, one_of_fd)
        value = test_file
    else:  # allOf
        option = "--allOf_test"  # Use "ovp-from-file" approach
        # Build the file...
        test_file = os.path.join(mock_data_dir, f'{complex_keyword}.json')
        with open(test_file, mode='w') as all_of_fd:
            json.dump(all_of_json, all_of_fd)
        value = test_file

    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE, f'{name}.json')
    # Cleanup from any potential previous failures (should be rare)
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            f'--name={name}', f'--display_name=Test Complex {complex_keyword}',
                            '--required_test=required_value', f'{option}={value}')
    assert ret.success
    assert f"Metadata instance '{name}' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout
    assert os.path.exists(expected_file)

    with open(expected_file) as fd:
        json_results = json.load(fd)

    # Verify common stuff
    assert json_results['display_name'] == f'Test Complex {complex_keyword}'
    assert json_results['metadata']['required_test'] == 'required_value'

    # Verify result and prepare for replace...
    if complex_keyword == "defs":
        assert json_results['metadata']['defs_test'] == 42
        value = "{ \"defs_test\": 24 }"
    elif complex_keyword == "oneOf":
        assert json_results['metadata']['oneOf_test']['obj_switch'] == "obj2"
        assert json_results['metadata']['oneOf_test']['obj2_prop1'] == 42
        one_of_json['metadata']['oneOf_test']['obj2_prop1'] = 24
        with open(test_file, mode='w+') as one_of_fd:
            json.dump(one_of_json, one_of_fd)
    elif complex_keyword == "allOf":
        assert len(json_results['metadata']['allOf_test']) == 9
        assert json_results['metadata']['allOf_test']['obj1_switch'] == "obj1"
        assert json_results['metadata']['allOf_test']['obj1_prop1'] == "allOf-test-val1"
        assert json_results['metadata']['allOf_test']['obj1_prop2'] == "allOf-test-val2"
        all_of_json['obj1_prop1'] = "allOf-test-val1-replace"
        assert json_results['metadata']['allOf_test']['obj2_switch'] == "obj2"
        assert json_results['metadata']['allOf_test']['obj2_prop1'] == 42
        assert json_results['metadata']['allOf_test']['obj2_prop2'] == 24
        all_of_json['obj2_prop1'] = 24
        assert json_results['metadata']['allOf_test']['obj3_switch'] == "obj3"
        assert json_results['metadata']['allOf_test']['obj3_prop1'] == 42.7
        assert json_results['metadata']['allOf_test']['obj3_prop2'] is True
        all_of_json['obj3_prop1'] = 7.24

        with open(test_file, mode='w+') as all_of_fd:
            json.dump(all_of_json, all_of_fd)

    # Replace the previously-created instance
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            f'--name={name}', f'--display_name=Test Complex {complex_keyword}2',
                            '--required_test=required_value', f'{option}={value}', '--replace')
    assert ret.success
    assert f"Metadata instance '{name}' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout
    assert os.path.exists(expected_file)

    with open(expected_file) as fd:
        json_results = json.load(fd)

    # Verify common stuff
    assert json_results['display_name'] == f'Test Complex {complex_keyword}2'
    assert json_results['metadata']['required_test'] == 'required_value'

    # Verify result following replace...
    if complex_keyword == "defs":
        assert json_results['metadata']['defs_test'] == 24
    elif complex_keyword == "oneOf":
        assert json_results['metadata']['oneOf_test']['obj_switch'] == "obj2"
        assert json_results['metadata']['oneOf_test']['obj2_prop1'] == 24
        assert json_results['metadata']['oneOf_test']['obj2_prop2'] == 24
    elif complex_keyword == "allOf":
        assert len(json_results['metadata']['allOf_test']) == 9
        assert json_results['metadata']['allOf_test']['obj1_prop1'] == "allOf-test-val1-replace"
        assert json_results['metadata']['allOf_test']['obj1_prop2'] == "allOf-test-val2"
        assert json_results['metadata']['allOf_test']['obj2_prop1'] == 24
        assert json_results['metadata']['allOf_test']['obj2_prop2'] == 24
        assert json_results['metadata']['allOf_test']['obj3_prop1'] == 7.24
        assert json_results['metadata']['allOf_test']['obj3_prop2'] is True


def test_list_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE, '--help')
    assert ret.success is False
    assert ret.stdout.startswith("\nList installed metadata for {}.".format(METADATA_TEST_SCHEMASPACE))


def test_list_bad_argument(script_runner):
    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE, '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("The following arguments were unexpected: ['--bogus-argument']")


def test_list_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE)
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 2  # always 2 more than the actual runtime count
    assert lines[0].startswith("No metadata instances found for {}".format(METADATA_TEST_SCHEMASPACE))

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

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE)
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 9  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for {} (includes invalid):".format(METADATA_TEST_SCHEMASPACE)
    line_elements = [line.split() for line in lines[4:8]]
    assert line_elements[0][0] == "metadata-test"
    assert line_elements[0][1] == "another"
    assert line_elements[1][0] == "metadata-test"
    assert line_elements[1][1] == "another2"
    assert line_elements[2][0] == "metadata-test"
    assert line_elements[2][1] == "valid"
    assert line_elements[3][0] == "metadata-test"
    assert line_elements[3][1] == "valid2"

    # Remove the '2' runtimes and reconfirm smaller set
    metadata_manager.remove('valid2')
    metadata_manager.remove('another2')
    # Include two additional invalid files as well - one for uri failure, andother missing display_name
    metadata_dir = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE)
    create_json_file(metadata_dir, 'invalid.json', invalid_metadata_json)
    create_json_file(metadata_dir, 'no_display_name.json', invalid_no_display_name_json)
    create_json_file(metadata_dir, 'invalid_schema_name.json', invalid_schema_name_json)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE)
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 10  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for {} (includes invalid):".format(METADATA_TEST_SCHEMASPACE)
    line_elements = [line.split() for line in lines[4:9]]
    assert line_elements[0][1] == "another"
    assert line_elements[1][1] == "invalid"
    assert line_elements[1][3] == "**INVALID**"
    assert line_elements[1][4] == "(ValidationError)"
    assert line_elements[2][3] == "**INVALID**"
    assert line_elements[2][4] == "(ValidationError)"
    assert line_elements[3][1] == "valid"
    assert line_elements[4][3] == "**INVALID**"
    assert line_elements[4][4] == "(SchemaNotFoundError)"

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE, '--valid-only')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 7  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for {} (valid only):".format(METADATA_TEST_SCHEMASPACE)
    line_elements = [line.split() for line in lines[4:6]]
    assert line_elements[0][1] == "another"
    assert line_elements[1][1] == "valid"


def test_list_json_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE, '--json')
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

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE, '--json')
    assert ret.success
    # Consume results
    results = json.loads(ret.stdout)
    assert len(results) == 4

    # Remove the '2' runtimes and reconfirm smaller set
    metadata_manager.remove('valid2')
    metadata_manager.remove('another2')

    # Include two additional invalid files as well - one for uri failure, andother missing display_name
    metadata_dir = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE)
    create_json_file(metadata_dir, 'invalid.json', invalid_metadata_json)
    create_json_file(metadata_dir, 'no_display_name.json', invalid_no_display_name_json)

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE, '--json')
    assert ret.success
    results = json.loads(ret.stdout)
    assert len(results) == 4

    ret = script_runner.run('elyra-metadata', 'list', METADATA_TEST_SCHEMASPACE, '--json', '--valid-only')
    assert ret.success
    results = json.loads(ret.stdout)
    assert len(results) == 2


def test_remove_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_SCHEMASPACE, '--help')
    assert ret.success is False
    assert ret.stdout.startswith(f"\nRemove a metadata instance from schemaspace '{METADATA_TEST_SCHEMASPACE}'.")


def test_remove_no_name(script_runner):
    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_SCHEMASPACE)
    assert ret.success is False
    assert ret.stdout.startswith("'--name' is a required parameter.")


def test_remove_malformed_name(script_runner):
    # Attempt removal but forget the '=' between parameter and value

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_SCHEMASPACE, '--name', 'valid')
    assert ret.success is False
    assert "Parameter '--name' requires a value." in ret.stdout


def test_remove_missing(script_runner, mock_data_dir):
    # Create an instance so that the schemaspace exists.
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)
    valid = Metadata(**valid_metadata_json)
    metadata_manager.create('valid', valid)

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_SCHEMASPACE, '--name=missing')
    assert ret.success is False
    assert "No such instance named 'missing' was found in the metadata-tests schemaspace." in ret.stdout

    # Now cleanup original instance.
    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_SCHEMASPACE, '--name=valid')
    assert ret.success


def test_remove_instance(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

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

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_SCHEMASPACE, '--name=valid')
    assert ret.success

    ret = script_runner.run('elyra-metadata', 'remove', METADATA_TEST_SCHEMASPACE, '--name=another')
    assert ret.success

    instances = metadata_manager.get_all()
    assert len(instances) == 2
    assert instances[0].name.endswith('2')
    assert instances[1].name.endswith('2')


# Begin property tests...

def test_required(script_runner, mock_data_dir):
    # Doesn't use PropertyTester due to its unique test since all other tests require this property
    name = "required"

    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE, name + '.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--display_name=' + name)

    assert ret.success is False
    assert "'--required_test' is a required parameter" in ret.stdout

    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--display_name=' + name,
                            '--required_test=required_value')

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["required_test"] == "required_value"


def test_number_default(script_runner, mock_data_dir):
    # Doesn't use PropertyTester due to its unique test (no failure, needs --replace, etc.)
    name = "number_default"

    expected_file = os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE, name + '.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    # No negative test here.  First create w/o a value and ensure 42, then create with a value and ensure that value.
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--display_name=' + name,
                            '--required_test=required_value')

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["number_default_test"] == 42

    # Note that we only include the properties that are changed, along with "identifiers" like name ans schema_name.
    ret = script_runner.run('elyra-metadata', 'install', METADATA_TEST_SCHEMASPACE, '--schema_name=metadata-test',
                            '--name=' + name, '--replace', '--number_default_test=7.2')

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, 'metadata', METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'metadata-test'
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["number_default_test"] == 7.2


def test_uri(script_runner, mock_data_dir):
    prop_test = PropertyTester("uri")
    prop_test.negative_value = "//invalid-uri"
    prop_test.negative_stdout = "Property used to test uri formatting"
    #  this can be joined with previous if adding meta-properties
    #  "; title: URI Test, format: uri"
    prop_test.negative_stderr = "'//invalid-uri' is not a 'uri'"
    prop_test.positive_value = "http://localhost:31823/v1/models?version=2017-02-13"
    prop_test.run(script_runner, mock_data_dir)


def test_integer_exclusivity(script_runner, mock_data_dir):
    prop_test = PropertyTester("integer_exclusivity")
    prop_test.negative_value = 3
    prop_test.negative_stdout = "Property used to test integers with exclusivity restrictions"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Integer Exclusivity Test, exclusiveMinimum: 3, exclusiveMaximum: 10"
    prop_test.negative_stderr = "3 is less than or equal to the minimum of 3"
    prop_test.positive_value = 7
    prop_test.run(script_runner, mock_data_dir)


def test_integer_multiple(script_runner, mock_data_dir):
    prop_test = PropertyTester("integer_multiple")
    prop_test.negative_value = 32
    prop_test.negative_stdout = "Property used to test integers with multipleOf restrictions"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Integer Multiple Test, multipleOf: 6"
    prop_test.negative_stderr = "32 is not a multiple of 6"
    prop_test.positive_value = 42
    prop_test.run(script_runner, mock_data_dir)


def test_number_range(script_runner, mock_data_dir):
    prop_test = PropertyTester("number_range")
    prop_test.negative_value = 2.7
    prop_test.negative_stdout = "Property used to test numbers with range"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Number Range Test, minimum: 3, maximum: 10"
    prop_test.negative_stderr = "2.7 is less than the minimum of 3"
    prop_test.positive_value = 7.2
    prop_test.run(script_runner, mock_data_dir)


def test_const(script_runner, mock_data_dir):
    prop_test = PropertyTester("const")
    prop_test.negative_value = 2.718
    prop_test.negative_stdout = "Property used to test properties with const"
    #  this can be joined with previous if adding meta-properties
    #  " ; title: Const Test, const: 3.14"
    prop_test.negative_stderr = "3.14 was expected"
    prop_test.positive_value = 3.14
    prop_test.run(script_runner, mock_data_dir)


def test_string_length(script_runner, mock_data_dir):
    prop_test = PropertyTester("string_length")
    prop_test.negative_value = "12345678901"
    prop_test.negative_stdout = "Property used to test strings with length restrictions"
    #  this can be joined with previous if adding meta-properties
    #  "; title: String Length Test, minLength: 3, maxLength: 10"
    prop_test.negative_stderr = "'12345678901' is too long"
    prop_test.positive_value = "123456"
    prop_test.run(script_runner, mock_data_dir)


def test_string_pattern(script_runner, mock_data_dir):
    prop_test = PropertyTester("string_pattern")  # Must start/end with alphanumeric, can include '-' and '.'
    prop_test.negative_value = "-foo1"
    prop_test.negative_stdout = "Property used to test strings with pattern restrictions"
    #  this can be joined with previous if adding meta-properties
    #  "; title: String Pattern Test, pattern: ^[a-z0-9][a-z0-9-.]*[a-z0-9]$"
    prop_test.negative_stderr = "'-foo1' does not match '^[a-z0-9][a-z0-9-.]*[a-z0-9]$'"
    prop_test.positive_value = "0foo-bar.com-01"
    prop_test.run(script_runner, mock_data_dir)


def test_enum(script_runner, mock_data_dir):
    prop_test = PropertyTester("enum")
    prop_test.negative_value = "jupyter"
    prop_test.negative_stdout = "Property used to test properties with enums"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Enum Test, enum: ['elyra', 'rocks', 'added']"
    prop_test.negative_stderr = "'jupyter' is not one of ['elyra', 'rocks', 'added']"
    prop_test.positive_value = "added"
    prop_test.run(script_runner, mock_data_dir)


def test_array(script_runner, mock_data_dir):
    prop_test = PropertyTester("array")
    prop_test.negative_value = [1, 2, 2]
    prop_test.negative_stdout = "Property used to test array with item restrictions"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Array Test, minItems: 3, maxItems: 10, uniqueItems: True"
    prop_test.negative_stderr = "[1, 2, 2] has non-unique elements"
    prop_test.positive_value = [1, 2, 3, 4, 5]
    prop_test.run(script_runner, mock_data_dir)


def test_object(script_runner, mock_data_dir):
    prop_test = PropertyTester("object")
    prop_test.negative_value = {'prop1': 2, 'prop2': 3}
    prop_test.negative_stdout = "Property used to test object elements with properties restrictions"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Object Test, minProperties: 3, maxProperties: 10"
    prop_test.negative_stderr = "{'prop1': 2, 'prop2': 3} does not have enough properties"
    prop_test.positive_value = {'prop1': 2, 'prop2': 3, 'prop3': 4, 'prop4': 5}
    prop_test.run(script_runner, mock_data_dir)


def test_boolean(script_runner, mock_data_dir):
    prop_test = PropertyTester("boolean")
    prop_test.negative_value = "bogus_boolean"
    prop_test.negative_stdout = "Property used to test boolean values"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Boolean Test"
    prop_test.negative_stderr = "'bogus_boolean' is not of type 'boolean'"
    prop_test.positive_value = True
    prop_test.run(script_runner, mock_data_dir)


def test_null(script_runner, mock_data_dir):
    prop_test = PropertyTester("null")
    prop_test.negative_value = "bogus_null"
    prop_test.negative_stdout = "Property used to test null types"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Null Test"
    prop_test.negative_stderr = "'bogus_null' is not of type 'null'"
    prop_test.positive_value = None
    prop_test.run(script_runner, mock_data_dir)
