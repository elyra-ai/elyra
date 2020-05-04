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
from elyra.metadata.metadata import Metadata, MetadataManager
from .test_utils import create_json_file, valid_metadata_json, another_metadata_json, invalid_metadata_json

os.environ["ELYRA_METADATA_APP_TESTING"] = "1"  # Enable elyra-metadata-tests namespace

@pytest.fixture()
def mock_runtime_dir():
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
    assert "Install a metadata instance into namespace \'elyra-metadata-tests\'." in ret.stdout


def test_install_bad_namespace(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', 'bogus-namespace')
    assert ret.success is False
    assert ret.stdout.startswith("Subcommand 'bogus-namespace' is invalid.")
    assert "Install a metadata instance into a given namespace." in ret.stdout
    assert "Install a metadata instance into namespace \'elyra-metadata-tests\'." in ret.stdout
    assert ret.stderr == ''


def test_install_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests', '--help')
    assert ret.success is False
    assert ret.stdout.startswith("\nInstall a metadata instance into namespace 'elyra-metadata-tests'.")
    assert ret.stderr == ''


def test_install_no_schema_name(script_runner, mock_runtime_dir):
    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests')
    assert ret.success is False
    assert ret.stdout.startswith("'--schema_name' is a required parameter.")
    assert ret.stderr == ''


def test_install_no_name(script_runner, mock_runtime_dir):
    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests', '--schema_name=test')
    assert ret.success is False
    assert ret.stdout.startswith("'--name' is a required parameter.")
    assert ret.stderr == ''


def test_install_invalid_name(script_runner, mock_runtime_dir):
    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests', '--schema_name=test',
                            '--name=UPPER_CASE_NOT_ALLOWED', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success is False
    assert ret.stdout.startswith("The following exception occurred saving metadata instance "
                                 "'UPPER_CASE_NOT_ALLOWED' for schema 'test'")
    assert "Name of metadata must be lowercase alphanumeric" in ret.stdout


def test_install_simple(script_runner, mock_runtime_dir):
    expected_file = os.path.join(mock_runtime_dir, 'metadata', 'elyra-metadata-tests',
                                 'test-metadata_42_valid-name.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests', '--schema_name=test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_runtime_dir, 'metadata', 'elyra-metadata-tests'))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'test'
        assert instance_json["display_name"] == 'display_name'
        assert instance_json["metadata"]["required_test"] == 'required_value'
        assert instance_json["metadata"]["number_default_test"] == 42  # defaults will always persist


def test_install_and_replace(script_runner, mock_runtime_dir):
    expected_file = os.path.join(mock_runtime_dir, 'metadata', 'elyra-metadata-tests',
                                 'test-metadata_42_valid-name.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests', '--schema_name=test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'test' has been written" in ret.stdout

    # Re-attempt w/o replace flag - failure expected
    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests', '--schema_name=test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value')
    assert ret.success is False
    assert "A failure occurred saving metadata instance 'test-metadata_42_valid-name' for schema 'test'." in ret.stdout
    assert "already exists. Use the replace flag to overwrite" in ret.stderr

    # Re-attempt with replace flag - success expected
    ret = script_runner.run('elyra-metadata', 'install', 'elyra-metadata-tests', '--schema_name=test',
                            '--name=test-metadata_42_valid-name', '--display_name=display_name',
                            '--required_test=required_value', '--replace')
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_runtime_dir, 'metadata', 'elyra-metadata-tests'))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == 'test'
        assert instance_json["display_name"] == 'display_name'
        assert instance_json["metadata"]["required_test"] == 'required_value'
        assert instance_json["metadata"]["number_default_test"] == 42  # defaults will always persist


def test_list_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'list', 'elyra-metadata-tests', '--help')
    assert ret.success is False
    assert ret.stdout.startswith("\nList installed metadata for elyra-metadata-tests.")
    assert ret.stderr == ''


def test_list_bad_argument(script_runner):
    ret = script_runner.run('elyra-metadata', 'list', 'elyra-metadata-tests', '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("The following arguments were unexpected: ['--bogus-argument']")
    assert ret.stderr == ''


def test_list_instances(script_runner, mock_runtime_dir):
    metadata_manager = MetadataManager(namespace='elyra-metadata-tests')

    ret = script_runner.run('elyra-metadata', 'list', 'elyra-metadata-tests')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 2  # always 2 more than the actual runtime count
    assert lines[0].startswith("No metadata instances available for elyra-metadata-tests at:")

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.add('valid', valid)
    assert resource is not None
    resource = metadata_manager.add('valid2', valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.add('another', another)
    assert resource is not None
    resource = metadata_manager.add('another2', another)
    assert resource is not None

    ret = script_runner.run('elyra-metadata', 'list', 'elyra-metadata-tests')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 9  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for elyra-metadata-tests (includes invalid):"
    line_elements = [line.split() for line in lines[4:8]]
    assert line_elements[0][0] == "test"
    assert line_elements[0][1] == "another"
    assert line_elements[1][0] == "test"
    assert line_elements[1][1] == "another2"
    assert line_elements[2][0] == "test"
    assert line_elements[2][1] == "valid"
    assert line_elements[3][0] == "test"
    assert line_elements[3][1] == "valid2"
    assert ret.stderr == ''

    # Remove the '2' runtimes and reconfirm smaller set
    metadata_manager.remove('valid2')
    metadata_manager.remove('another2')
    # Include an invalid file as well
    metadata_dir = os.path.join(mock_runtime_dir, 'metadata', 'elyra-metadata-tests')
    create_json_file(metadata_dir, 'invalid.json', invalid_metadata_json)

    ret = script_runner.run('elyra-metadata', 'list', 'elyra-metadata-tests')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 8  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for elyra-metadata-tests (includes invalid):"
    line_elements = [line.split() for line in lines[4:7]]
    assert line_elements[0][1] == "another"
    assert line_elements[1][1] == "invalid"
    assert line_elements[1][3] == "**INVALID**"
    assert line_elements[1][4] == "(ValidationError)"
    assert line_elements[2][1] == "valid"

    ret = script_runner.run('elyra-metadata', 'list', 'elyra-metadata-tests', '--valid-only')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 7  # always 5 more than the actual runtime count
    assert lines[0] == "Available metadata instances for elyra-metadata-tests (valid only):"
    line_elements = [line.split() for line in lines[4:6]]
    assert line_elements[0][1] == "another"
    assert line_elements[1][1] == "valid"


def test_remove_help(script_runner):
    ret = script_runner.run('elyra-metadata', 'remove', 'elyra-metadata-tests', '--help')
    assert ret.success is False
    assert ret.stdout.startswith("\nRemove a metadata instance from namespace 'elyra-metadata-tests'.")
    assert ret.stderr == ''


def test_remove_no_name(script_runner):
    ret = script_runner.run('elyra-metadata', 'remove', 'elyra-metadata-tests')
    assert ret.success is False
    assert ret.stdout.startswith("'--name' is a required parameter.")
    assert ret.stderr == ''


def test_remove_missing(script_runner):
    ret = script_runner.run('elyra-metadata', 'remove', 'elyra-metadata-tests', '--name=missing')
    assert ret.success is False
    assert ret.stdout == '"Metadata \'missing\' in namespace \'elyra-metadata-tests\' was not found!"\n'
    assert ret.stderr == ''


def test_remove_instance(script_runner, mock_runtime_dir):
    metadata_manager = MetadataManager(namespace='elyra-metadata-tests')

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.add('valid', valid)
    assert resource is not None
    resource = metadata_manager.add('valid2', valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.add('another', another)
    assert resource is not None
    resource = metadata_manager.add('another2', another)
    assert resource is not None

    ret = script_runner.run('elyra-metadata', 'remove', 'elyra-metadata-tests', '--name=valid')
    assert ret.success

    ret = script_runner.run('elyra-metadata', 'remove', 'elyra-metadata-tests', '--name=another')
    assert ret.success

    instances = metadata_manager.get_all_metadata_summary()
    assert len(instances) == 2
    assert instances[0].name.endswith('2')
    assert instances[1].name.endswith('2')
