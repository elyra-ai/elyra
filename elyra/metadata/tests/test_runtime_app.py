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

"""Tests for metadata runtime application"""

import json
import os
import pytest
import shutil
from tempfile import mkdtemp
from elyra.metadata.metadata import MetadataManager
from elyra.metadata.runtime import Runtime
from .test_utils import create_json_file, valid_metadata_json, another_metadata_json, invalid_metadata_json


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
    ret = script_runner.run('jupyter-runtimes')
    assert ret.success is False
    assert ret.stdout.startswith("No subcommand specified.")
    assert ret.stderr == ''


def test_bad_subcommand(script_runner):
    ret = script_runner.run('jupyter', 'runtimes', 'bogus-subcommand')
    assert ret.success is False
    assert ret.stdout.startswith("No subcommand specified.")
    assert ret.stderr == ''


def test_install_bad_argument(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'install', '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("Install runtime metadata for pipeline processors.")
    assert "[InstallRuntime] CRITICAL | Unrecognized flag: \'--bogus-argument\'" in ret.stderr


def test_install_bad_runtime(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'install', 'bogus-runtime')
    assert ret.success is False
    assert ret.stdout.startswith("No subcommand specified. Must specify one of:")
    assert "Install runtime metadata for Kubeflow pipelines." in ret.stdout
    assert ret.stderr == ''


def test_kfp_help_all(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'install', 'kfp', '--help-all')
    assert ret.success
    assert ret.stdout.startswith("Install runtime metadata for Kubeflow pipelines.")
    assert ret.stderr == ''


def test_kfp_name_violation(script_runner, mock_runtime_dir):
    ret = script_runner.run('jupyter-runtimes', 'install', 'kfp',
                            '--name=Foo', '--display_name="Foo Baz"',
                            '--api_endpoint=http://wackwach', '--cos_endpoint=http://zackzach',
                            '--cos_username=cos_username', '--cos_password=cos_password',
                            '--cos_bucket=cos-bucket')
    assert ret.success is False
    assert "Install runtime metadata for Kubeflow pipelines." in ret.stdout
    assert "Name of metadata must be lowercase alphanumeric" in ret.stderr


def test_kfp_schema_violation(script_runner, mock_runtime_dir):
    ret = script_runner.run('jupyter-runtimes', 'install', 'kfp',
                            '--name=foo', '--display_name="Foo Baz"',
                            '--api_endpoint=http://wackwach', '--cos_endpoint=http://zackzach',
                            '--cos_username=cos_username', '--cos_password=cos_password',
                            '--cos_bucket=cos_chuckit')
    assert ret.success is False
    assert "Install runtime metadata for Kubeflow pipelines." in ret.stdout
    assert "'cos_chuckit' does not match" in ret.stderr


def test_create_kfp_runtime(script_runner, mock_runtime_dir):
    expected_file = os.path.join(mock_runtime_dir, 'metadata', 'runtimes', 'foo.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('jupyter-runtimes', 'install', 'kfp',
                            '--name=foo', '--display_name="Foo Baz"',
                            '--api_endpoint=http://acme.api:9999', '--cos_endpoint=http://acme.cos:9999',
                            '--cos_username=cos_username', '--cos_password=cos_password',
                            '--cos_bucket=cos-bucket')

    assert ret.success
    assert ret.stdout.startswith("Metadata for kfp runtime 'foo' has been written to")
    assert ret.stderr == ''

    assert os.path.isdir(os.path.join(mock_runtime_dir, 'metadata', 'runtimes'))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        runtime_json = json.load(fd)
        assert runtime_json["schema_name"] == 'kfp'
        assert runtime_json["display_name"] == 'Foo Baz'
        assert runtime_json["metadata"]["api_endpoint"] == 'http://acme.api:9999'
        assert runtime_json["metadata"]["cos_endpoint"] == 'http://acme.cos:9999'
        assert runtime_json["metadata"]["cos_username"] == 'cos_username'


def test_replace_kfp_runtime(script_runner, mock_runtime_dir):
    expected_file = os.path.join(mock_runtime_dir, 'metadata', 'runtimes', 'bar.json')
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run('jupyter-runtimes', 'install', 'kfp',
                            '--name=bar', '--display_name="Foo Bar"',
                            '--api_endpoint=http://acme.api:9999', '--cos_endpoint=http://acme.cos:9999',
                            '--cos_bucket=cos-bucket',
                            '--cos_username=cos_username', '--cos_password=cos_password')

    assert ret.success
    assert ret.stdout.startswith("Metadata for kfp runtime 'bar' has been written to")
    assert ret.stderr == ''

    # Now try to replace w/o --replace flag (exception expected)...
    ret = script_runner.run('jupyter-runtimes', 'install', 'kfp',
                            '--name=bar', '--display_name="Foo Barf"',
                            '--api_endpoint=http://acme.api:1111', '--cos_endpoint=http://acme.cos:1111',
                            '--cos_bucket=cos-bucket',
                            '--cos_username=cos_username', '--cos_password=cos_password')

    assert ret.success is False
    assert "already exists. Use the replace flag to overwrite" in ret.stderr

    # And repeat with --replace, then confirm updates
    ret = script_runner.run('jupyter-runtimes', 'install', 'kfp', '--replace',
                            '--name=bar', '--display_name="Foo Barf"',
                            '--api_endpoint=http://acme.api:1111', '--cos_endpoint=http://acme.cos:1111',
                            '--cos_bucket=cos-bucket',
                            '--cos_username=cos_username', '--cos_password=cos_password')

    assert ret.success
    assert ret.stdout.startswith("Metadata for kfp runtime 'bar' has been written to")
    assert ret.stderr == ''

    assert os.path.isdir(os.path.join(mock_runtime_dir, 'metadata', 'runtimes'))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        runtime_json = json.load(fd)
        assert runtime_json["schema_name"] == 'kfp'
        assert runtime_json["display_name"] == 'Foo Barf'
        assert runtime_json["metadata"]["api_endpoint"] == 'http://acme.api:1111'
        assert runtime_json["metadata"]["cos_endpoint"] == 'http://acme.cos:1111'
        assert runtime_json["metadata"]["cos_username"] == 'cos_username'


def test_list_bad_argument(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'list', '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("List installed external runtime metadata.")
    assert "[ListRuntimes] CRITICAL | Unrecognized flag: \'--bogus-argument\'" in ret.stderr


def test_list_help_all(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'list', '--help-all')
    assert ret.success
    assert ret.stdout.startswith("List installed external runtime metadata.")
    assert ret.stderr == ''


def test_list_runtimes(script_runner, mock_runtime_dir):
    metadata_manager = MetadataManager(namespace=Runtime.namespace)

    valid = Runtime(**valid_metadata_json)
    resource = metadata_manager.add('valid', valid)
    assert resource is not None
    resource = metadata_manager.add('valid2', valid)
    assert resource is not None
    another = Runtime(**another_metadata_json)
    resource = metadata_manager.add('another', another)
    assert resource is not None
    resource = metadata_manager.add('another2', another)
    assert resource is not None

    ret = script_runner.run('jupyter-runtimes', 'list')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 6  # always 2 more than the actual runtime count
    assert lines[0] == "Available metadata for external runtimes:"
    line_elements = [line.split() for line in lines[1:5]]
    assert line_elements[0][0] == "another"
    assert line_elements[1][0] == "another2"
    assert line_elements[2][0] == "valid"
    assert line_elements[3][0] == "valid2"
    assert ret.stderr == ''

    # Remove the '2' runtimes and reconfirm smaller set
    metadata_manager.remove('valid2')
    metadata_manager.remove('another2')
    # Include an invalid file as well
    metadata_dir = os.path.join(mock_runtime_dir, 'metadata', 'runtimes')
    create_json_file(metadata_dir, 'invalid.json', invalid_metadata_json)

    ret = script_runner.run('jupyter-runtimes', 'list')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 5  # always 2 more than the actual runtime count
    assert lines[0] == "Available metadata for external runtimes:"
    line_elements = [line.split() for line in lines[1:4]]
    assert line_elements[0][0] == "another"
    assert line_elements[1][0] == "invalid"
    assert line_elements[1][2] == "**INVALID**"
    assert line_elements[1][3] == "(ValidationError)"
    assert line_elements[2][0] == "valid"

    ret = script_runner.run('jupyter-runtimes', 'list', '--valid-only')
    assert ret.success
    lines = ret.stdout.split('\n')
    assert len(lines) == 4  # always 2 more than the actual runtime count
    assert lines[0] == "Available metadata for external runtimes:"
    line_elements = [line.split() for line in lines[1:3]]
    assert line_elements[0][0] == "another"
    assert line_elements[1][0] == "valid"


def test_remove_bad_argument(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'remove', '--bogus-argument')
    assert ret.success is False
    assert ret.stdout.startswith("Remove external runtime metadata.")
    assert "[RemoveRuntime] CRITICAL | Unrecognized flag: \'--bogus-argument\'" in ret.stderr


def test_remove_bad_param(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'remove', 'bogus-param')
    assert ret.success is False
    assert ret.stdout.startswith("\nRemove external runtime metadata.")
    assert "'name' is a required parameter." in ret.stderr


def test_remove_help_all(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'remove', '--help-all')
    assert ret.success
    assert ret.stdout.startswith("Remove external runtime metadata.")
    assert ret.stderr == ''


def test_remove_missing(script_runner):
    ret = script_runner.run('jupyter-runtimes', 'remove', '--name=missing')
    assert ret.success
    assert ret.stderr == "[RemoveRuntime] WARNING | Metadata 'missing' in namespace 'runtimes' was not found!\n"


def test_remove_runtime(script_runner, mock_runtime_dir):
    metadata_manager = MetadataManager(namespace=Runtime.namespace)

    valid = Runtime(**valid_metadata_json)
    resource = metadata_manager.add('valid', valid)
    assert resource is not None
    resource = metadata_manager.add('valid2', valid)
    assert resource is not None
    another = Runtime(**another_metadata_json)
    resource = metadata_manager.add('another', another)
    assert resource is not None
    resource = metadata_manager.add('another2', another)
    assert resource is not None

    ret = script_runner.run('jupyter-runtimes', 'remove', '--name=valid')
    assert ret.success

    ret = script_runner.run('jupyter-runtimes', 'remove', '--name=another')
    assert ret.success

    runtimes = metadata_manager.get_all_metadata_summary()
    assert len(runtimes) == 2
    assert runtimes[0].name.endswith('2')
    assert runtimes[1].name.endswith('2')
