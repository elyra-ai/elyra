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

"""Tests for elyra-metadata application"""
import json
import os
import shutil
from tempfile import mkdtemp
from tempfile import TemporaryDirectory
from typing import AnyStr
from typing import List
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
from elyra.tests.metadata.test_utils import valid_display_name_json
from elyra.tests.metadata.test_utils import valid_metadata2_json
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


def get_file_contents(filename: str) -> AnyStr:
    contents: AnyStr
    with open(filename) as f:
        contents = f.read()
    return contents


def test_no_opts(script_runner):
    ret = script_runner.run("elyra-metadata")
    assert ret.success is False
    message = (
        "No subcommand specified.  One of: "
        "['list', 'create', 'update', 'remove', 'migrate', 'export', 'import'] "
        "must be specified."
    )
    assert message in ret.stdout


def test_bad_subcommand(script_runner):
    ret = script_runner.run("elyra-metadata", "bogus-subcommand")
    assert ret.success is False
    assert (
        "Subcommand 'bogus-subcommand' is invalid.  One of: "
        "['list', 'create', 'update', 'remove', 'migrate', 'export', 'import'] "
        "must be specified." in ret.stdout
    )


# ---------- begin of 'create' command tests


@pytest.mark.parametrize("option_style", ["equals", "sans-equals", "missing"])
def test_create_from_file(script_runner, mock_data_dir, option_style):
    content = create_json_file(mock_data_dir, "valid.json", valid_metadata_json)

    argv: List[str] = [
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
    ]

    if option_style == "equals":
        argv.append(f"--file={content}")
    elif option_style == "sans-equals":
        argv.append("--file")
        argv.append(f"{content}")
    else:  # missing
        argv.append("--file")

    ret = script_runner.run(*argv)

    if option_style == "missing":
        assert ret.success is False
        assert (
            "ERROR: Parameter '--file' requires a file with format JSON and no value was provided.  "
            "Try again with an appropriate value." in ret.stdout
        )
    else:  # success expected
        assert ret.success
        assert "Metadata instance 'valid' for schema 'metadata-test' has been written" in ret.stdout


@pytest.mark.parametrize("option_style", ["equals", "sans-equals", "missing"])
def test_create_from_json(script_runner, mock_data_dir, option_style):
    content = json.dumps(valid_metadata_json)

    argv: List[str] = [
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
    ]

    if option_style == "equals":
        argv.append(f"--json={content}")
    elif option_style == "sans-equals":
        argv.append("--json")
        argv.append(f"{content}")
    else:  # missing
        argv.append("--json")

    ret = script_runner.run(*argv)

    if option_style == "missing":
        assert ret.success is False
        assert (
            "ERROR: Parameter '--json' requires a value with format JSON and no value was provided.  "
            "Try again with an appropriate value." in ret.stdout
        )
    else:  # success expected
        assert ret.success
        assert "Metadata instance 'valid_metadata_instance' for schema 'metadata-test' has been written" in ret.stdout


def test_create_bad_argument(script_runner):
    ret = script_runner.run("elyra-metadata", "create", "--bogus-argument")
    assert ret.success is False
    assert "Subcommand '--bogus-argument' is invalid." in ret.stdout
    assert f"Create a metadata instance in schemaspace '{METADATA_TEST_SCHEMASPACE}'." in ret.stdout


def test_create_bad_schemaspace(script_runner):
    ret = script_runner.run("elyra-metadata", "create", "bogus-schemaspace")
    assert ret.success is False
    assert "Subcommand 'bogus-schemaspace' is invalid." in ret.stdout
    assert f"Create a metadata instance in schemaspace '{METADATA_TEST_SCHEMASPACE}'." in ret.stdout


def test_create_help(script_runner):
    ret = script_runner.run("elyra-metadata", "create", METADATA_TEST_SCHEMASPACE, "--help")
    assert ret.success is False
    assert f"Create a metadata instance in schemaspace '{METADATA_TEST_SCHEMASPACE}'." in ret.stdout


def test_create_no_schema_single(script_runner, mock_data_dir):
    # Use the runtime-images schemaspace since that is most likely to always be a single-schema schemaspace.
    # Note: this test will break if it ever supports multiple.
    ret = script_runner.run("elyra-metadata", "create", "runtime-images")
    assert ret.success is False
    assert "ERROR: '--display_name' is a required parameter." in ret.stdout


def test_create_no_schema_multiple(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "create", METADATA_TEST_SCHEMASPACE)
    assert ret.success is False
    # Since order in dictionaries, where the one-of list is derived, can be random, just check up to the
    # first known difference in the schema names.
    assert (
        "ERROR: '--schema_name' is a required parameter and must be one of the "
        "following values: ['metadata-test" in ret.stdout
    )


def test_create_bad_schema_multiple(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "create", METADATA_TEST_SCHEMASPACE, "--schema_name=metadata-foo")
    assert ret.success is False
    assert "ERROR: Parameter '--schema_name' requires one of the " "following values: ['metadata-test" in ret.stdout


def test_create_no_name(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "create", METADATA_TEST_SCHEMASPACE, "--schema_name=metadata-test")
    assert ret.success is False
    assert "ERROR: '--display_name' is a required parameter." in ret.stdout


def test_create_complex_usage(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "create", METADATA_TEST_SCHEMASPACE, "--schema_name=metadata-test")
    assert ret.success is False
    assert "Note: The following properties in this schema contain JSON keywords that are not supported" in ret.stdout
    assert "*** References unsupported keywords: {'oneOf'}" in ret.stdout
    assert "*** References unsupported keywords: {'allOf'}" in ret.stdout
    assert "*** References unsupported keywords: {'$ref'}" in ret.stdout


def test_create_only_display_name(script_runner, mock_data_dir):
    metadata_display_name = "1 teste 'rápido'"
    metadata_name = "a_1_teste_rpido"

    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        f"--display_name={metadata_display_name}",
        "--required_test=required_value",
    )
    assert ret.success is True
    assert f"Metadata instance '{metadata_name}' for schema 'metadata-test' has been written to:" in ret.stdout

    # Ensure it can be fetched by name...
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE_ID)
    resource = metadata_manager.get(metadata_name)
    assert resource.display_name == metadata_display_name


def test_create_invalid_name(script_runner, mock_data_dir):
    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=UPPER_CASE_NOT_ALLOWED",
        "--display_name=display_name",
        "--required_test=required_value",
    )
    assert ret.success is False
    assert "The following exception occurred saving metadata instance for schema 'metadata-test'" in ret.stdout
    assert "Name of metadata must be lowercase alphanumeric" in ret.stdout


def test_create_simple(script_runner, mock_data_dir):
    expected_file = os.path.join(
        mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, "test-metadata_42_valid-name.json"
    )
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=test-metadata_42_valid-name",
        "--display_name=display_name",
        "--required_test=required_value",
    )
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == "metadata-test"
        assert instance_json["display_name"] == "display_name"
        assert instance_json["metadata"]["required_test"] == "required_value"
        assert instance_json["metadata"]["number_default_test"] == 42  # defaults will always persist


def test_create_existing(script_runner, mock_data_dir):
    expected_file = os.path.join(
        mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, "test-metadata_42_valid-name.json"
    )
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=test-metadata_42_valid-name",
        "--display_name=display_name",
        "--required_test=required_value",
        "--number_default_test=24",
    )
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout
    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["metadata"]["number_default_test"] == 24  # ensure CLI value is used over default

    # Re-attempt create - failure expected
    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=test-metadata_42_valid-name",
        "--display_name=display_name",
        "--required_test=required_value",
    )

    assert ret.success is False
    assert (
        "An instance named 'test-metadata_42_valid-name' already exists in the metadata-tests "
        "schemaspace" in ret.stderr
    )


def test_create_complex(script_runner, mock_data_dir):
    complex_keyword = "defs"
    name: str = f"test-complex-{complex_keyword}".lower()

    option = "--json"
    value = '{ "defs_test": 42 }'

    expected_file = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, f"{name}.json")
    # Cleanup from any potential previous failures (should be rare)
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        f"--name={name}",
        f"--display_name=Test Complex {complex_keyword}",
        "--required_test=required_value",
        f"{option}",  # don't use '=' between option and value
        f"{value}",
    )
    assert ret.success
    assert f"Metadata instance '{name}' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout
    assert os.path.exists(expected_file)

    with open(expected_file) as fd:
        json_results = json.load(fd)

    # Verify common stuff
    assert json_results["display_name"] == f"Test Complex {complex_keyword}"
    assert json_results["metadata"]["required_test"] == "required_value"
    assert json_results["metadata"]["defs_test"] == 42


# ---------- end of 'create' command tests
#
# ---------- begin of 'update' command tests


def test_update_bad_argument(script_runner):
    ret = script_runner.run("elyra-metadata", "update", "--bogus-argument")
    assert ret.success is False
    assert "Subcommand '--bogus-argument' is invalid." in ret.stdout
    assert f"Update a metadata instance in schemaspace '{METADATA_TEST_SCHEMASPACE}'." in ret.stdout


def test_update_bad_schemaspace(script_runner):
    ret = script_runner.run("elyra-metadata", "update", "bogus-schemaspace")
    assert ret.success is False
    assert "Subcommand 'bogus-schemaspace' is invalid." in ret.stdout
    assert f"Update a metadata instance in schemaspace '{METADATA_TEST_SCHEMASPACE}'." in ret.stdout


def test_update_help(script_runner):
    ret = script_runner.run("elyra-metadata", "update", METADATA_TEST_SCHEMASPACE, "--help")
    assert ret.success is False
    assert f"Update a metadata instance in schemaspace '{METADATA_TEST_SCHEMASPACE}'." in ret.stdout


def test_update_no_schema_single(script_runner, mock_data_dir):
    # Use the runtime-images schemaspace since that is most likely to always be a single-schema schemaspace.
    # Note: this test will break if it ever supports multiple.
    ret = script_runner.run("elyra-metadata", "update", "runtime-images")
    assert ret.success is False
    assert (
        "The following exception occurred saving metadata instance for schema 'runtime-image': "
        "The 'name' parameter requires a value." in ret.stdout
    )


def test_update_no_schema_multiple(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "update", METADATA_TEST_SCHEMASPACE)
    assert ret.success is False
    # Since order in dictionaries, where the one-of list is derived, can be random, just check up to the
    # first known difference in the schema names.
    assert (
        "ERROR: '--schema_name' is a required parameter and must be one of the "
        "following values: ['metadata-test" in ret.stdout
    )


def test_update_bad_schema_multiple(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "update", METADATA_TEST_SCHEMASPACE, "--schema_name=metadata-foo")
    assert ret.success is False
    assert "ERROR: Parameter '--schema_name' requires one of the " "following values: ['metadata-test" in ret.stdout


def test_update_no_name(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "update", METADATA_TEST_SCHEMASPACE, "--schema_name=metadata-test")
    assert ret.success is False
    assert (
        "The following exception occurred saving metadata instance for schema 'metadata-test': "
        "The 'name' parameter requires a value." in ret.stdout
    )


def test_update_no_instance(script_runner, mock_data_dir):
    """Attempt replace before instance exists"""
    ret = script_runner.run(
        "elyra-metadata",
        "update",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=test-metadata_42_valid-name",
        "--display_name=display_name",
        "--required_test=required_value",
    )
    assert ret.success is False
    assert (
        "No such instance named 'test-metadata_42_valid-name' was found in the metadata-tests schemaspace."
        in ret.stdout
    )


def test_update_simple(script_runner, mock_data_dir):
    expected_file = os.path.join(
        mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, "test-metadata_42_valid-name.json"
    )
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    # create an instance
    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=test-metadata_42_valid-name",
        "--display_name=display_name",
        "--required_test=required_value",
    )
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout

    # update instance
    ret = script_runner.run(
        "elyra-metadata",
        "update",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=test-metadata_42_valid-name",
        "--display_name=display_name",
        "--required_test=updated_required_value",
    )
    assert ret.success
    assert "Metadata instance 'test-metadata_42_valid-name' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == "metadata-test"
        assert instance_json["display_name"] == "display_name"
        assert instance_json["metadata"]["required_test"] == "updated_required_value"
        assert instance_json["metadata"]["number_default_test"] == 42  # defaults will always persist


@pytest.mark.parametrize("complex_keyword", ["defs", "oneOf", "allOf"])
def test_update_complex(script_runner, mock_data_dir, complex_keyword):
    # create and use deep copies of the global one_of_json and one_of_json
    # to avoid side effects
    one_of_json_cp = json.loads(json.dumps(one_of_json))
    all_of_json_cp = json.loads(json.dumps(all_of_json))

    test_file: Optional[str] = None
    name: str = f"test-complex-{complex_keyword}".lower()

    if complex_keyword == "defs":
        option = "--json"
        value = '{ "defs_test": 42 }'
    elif complex_keyword == "oneOf":
        option = "--file"
        # Build the file...
        test_file = os.path.join(mock_data_dir, f"{complex_keyword}.json")
        with open(test_file, mode="w") as one_of_fd:
            json.dump(one_of_json_cp, one_of_fd)
        value = test_file
    else:  # allOf
        option = "--allOf_test"  # Use "ovp-from-file" approach
        # Build the file...
        test_file = os.path.join(mock_data_dir, f"{complex_keyword}.json")
        with open(test_file, mode="w") as all_of_fd:
            json.dump(all_of_json_cp, all_of_fd)
        value = test_file

    expected_file = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, f"{name}.json")
    # Cleanup from any potential previous failures (should be rare)
    if os.path.exists(expected_file):
        os.remove(expected_file)

    # create instance
    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        f"--name={name}",
        f"--display_name=Test Complex {complex_keyword}",
        "--required_test=required_value",
        f"{option}={value}",
    )
    assert ret.success
    assert f"Metadata instance '{name}' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout
    assert os.path.exists(expected_file)

    with open(expected_file) as fd:
        json_results = json.load(fd)

    # Verify common stuff
    assert json_results["display_name"] == f"Test Complex {complex_keyword}"
    assert json_results["metadata"]["required_test"] == "required_value"

    # Verify result and prepare for replace...
    if complex_keyword == "defs":
        assert json_results["metadata"]["defs_test"] == 42
        value = '{ "defs_test": 24 }'
    elif complex_keyword == "oneOf":
        assert json_results["metadata"]["oneOf_test"]["obj_switch"] == "obj2"
        assert json_results["metadata"]["oneOf_test"]["obj2_prop1"] == 42, f"--> {json_results}"
        one_of_json_cp["metadata"]["oneOf_test"]["obj2_prop1"] = 24
        with open(test_file, mode="w+") as one_of_fd:
            json.dump(one_of_json_cp, one_of_fd)
    elif complex_keyword == "allOf":
        assert len(json_results["metadata"]["allOf_test"]) == 9
        assert json_results["metadata"]["allOf_test"]["obj1_switch"] == "obj1"
        assert json_results["metadata"]["allOf_test"]["obj1_prop1"] == "allOf-test-val1"
        assert json_results["metadata"]["allOf_test"]["obj1_prop2"] == "allOf-test-val2"
        all_of_json_cp["obj1_prop1"] = "allOf-test-val1-replace"
        assert json_results["metadata"]["allOf_test"]["obj2_switch"] == "obj2"
        assert json_results["metadata"]["allOf_test"]["obj2_prop1"] == 42
        assert json_results["metadata"]["allOf_test"]["obj2_prop2"] == 24
        all_of_json_cp["obj2_prop1"] = 24
        assert json_results["metadata"]["allOf_test"]["obj3_switch"] == "obj3"
        assert json_results["metadata"]["allOf_test"]["obj3_prop1"] == 42.7
        assert json_results["metadata"]["allOf_test"]["obj3_prop2"] is True
        all_of_json_cp["obj3_prop1"] = 7.24

        with open(test_file, mode="w+") as all_of_fd:
            json.dump(all_of_json_cp, all_of_fd)

    # Replace the previously created instance
    ret = script_runner.run(
        "elyra-metadata",
        "update",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        f"--name={name}",
        f"--display_name=Test Complex {complex_keyword}2",
        "--required_test=required_value",
        f"{option}={value}",
    )
    assert ret.success
    assert f"Metadata instance '{name}' for schema 'metadata-test' has been written" in ret.stdout
    assert expected_file in ret.stdout
    assert os.path.exists(expected_file)

    with open(expected_file) as fd:
        json_results = json.load(fd)

    # Verify common stuff
    assert json_results["display_name"] == f"Test Complex {complex_keyword}2"
    assert json_results["metadata"]["required_test"] == "required_value"

    # Verify result following replace...
    if complex_keyword == "defs":
        assert json_results["metadata"]["defs_test"] == 24
    elif complex_keyword == "oneOf":
        assert json_results["metadata"]["oneOf_test"]["obj_switch"] == "obj2"
        assert json_results["metadata"]["oneOf_test"]["obj2_prop1"] == 24
        assert json_results["metadata"]["oneOf_test"]["obj2_prop2"] == 24
    elif complex_keyword == "allOf":
        assert len(json_results["metadata"]["allOf_test"]) == 9
        assert json_results["metadata"]["allOf_test"]["obj1_prop1"] == "allOf-test-val1-replace"
        assert json_results["metadata"]["allOf_test"]["obj1_prop2"] == "allOf-test-val2"
        assert json_results["metadata"]["allOf_test"]["obj2_prop1"] == 24
        assert json_results["metadata"]["allOf_test"]["obj2_prop2"] == 24
        assert json_results["metadata"]["allOf_test"]["obj3_prop1"] == 7.24
        assert json_results["metadata"]["allOf_test"]["obj3_prop2"] is True


# ---------- end of 'update' command tests


def test_list_help(script_runner):
    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--help")
    assert ret.success is False
    assert f"List installed metadata for {METADATA_TEST_SCHEMASPACE}." in ret.stdout


def test_list_bad_argument(script_runner):
    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--bogus-argument")
    assert ret.success is False
    assert "ERROR: The following arguments were unexpected: ['--bogus-argument']" in ret.stdout


def test_list_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE)
    assert ret.success
    lines = ret.stdout.split("\n")
    assert len(lines) == 2  # always 2 more than the actual runtime count
    assert f"No metadata instances found for {METADATA_TEST_SCHEMASPACE}" in lines[0]

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None
    resource = metadata_manager.create("valid2", valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.create("another", another)
    assert resource is not None
    resource = metadata_manager.create("another2", another)
    assert resource is not None

    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--include-invalid")
    assert ret.success
    lines = ret.stdout.split("\n")
    assert len(lines) == 9  # always 5 more than the actual runtime count
    assert lines[0] == f"Available metadata instances for {METADATA_TEST_SCHEMASPACE} (includes invalid):"
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
    metadata_manager.remove("valid2")
    metadata_manager.remove("another2")
    # Include two additional invalid files as well - one for uri failure, another missing display_name
    metadata_dir = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE)
    create_json_file(metadata_dir, "invalid.json", invalid_metadata_json)
    create_json_file(metadata_dir, "no_display_name.json", invalid_no_display_name_json)
    create_json_file(metadata_dir, "invalid_schema_name.json", invalid_schema_name_json)

    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--include-invalid")
    assert ret.success
    lines = ret.stdout.split("\n")
    assert len(lines) == 10  # always 5 more than the actual runtime count
    assert lines[0] == f"Available metadata instances for {METADATA_TEST_SCHEMASPACE} (includes invalid):"
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

    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE)
    assert ret.success
    lines = ret.stdout.split("\n")
    assert len(lines) == 7  # always 5 more than the actual runtime count
    assert lines[0] == f"Available metadata instances for {METADATA_TEST_SCHEMASPACE}:"
    line_elements = [line.split() for line in lines[4:6]]
    assert line_elements[0][1] == "another"
    assert line_elements[1][1] == "valid"


def test_list_json_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--json")
    assert ret.success
    lines = ret.stdout.split("\n")
    assert len(lines) == 2
    assert lines[0] == "[]"

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None
    resource = metadata_manager.create("valid2", valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.create("another", another)
    assert resource is not None
    resource = metadata_manager.create("another2", another)
    assert resource is not None

    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--json", "--include-invalid")
    assert ret.success
    # Consume results
    results = json.loads(ret.stdout)
    assert len(results) == 4

    # Remove the '2' runtimes and reconfirm smaller set
    metadata_manager.remove("valid2")
    metadata_manager.remove("another2")

    # Include two additional invalid files as well - one for uri failure, another missing display_name
    metadata_dir = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE)
    create_json_file(metadata_dir, "invalid.json", invalid_metadata_json)
    create_json_file(metadata_dir, "no_display_name.json", invalid_no_display_name_json)

    # Ensure invalids are NOT listed
    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--json")
    assert ret.success
    results = json.loads(ret.stdout)
    assert len(results) == 2

    # Ensure invalids ARE listed
    ret = script_runner.run("elyra-metadata", "list", METADATA_TEST_SCHEMASPACE, "--json", "--include-invalid")
    assert ret.success
    results = json.loads(ret.stdout)
    assert len(results) == 4


def test_remove_help(script_runner):
    ret = script_runner.run("elyra-metadata", "remove", METADATA_TEST_SCHEMASPACE, "--help")
    assert ret.success is False
    assert f"Remove a metadata instance from schemaspace '{METADATA_TEST_SCHEMASPACE}'." in ret.stdout


def test_remove_no_name(script_runner):
    ret = script_runner.run("elyra-metadata", "remove", METADATA_TEST_SCHEMASPACE)
    assert ret.success is False
    assert "ERROR: '--name' is a required parameter." in ret.stdout


def test_remove_with_no_equals(script_runner, mock_data_dir):
    # Attempt removal w/o the '=' between parameter and value
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)
    valid = Metadata(**valid_metadata_json)
    metadata_manager.create("valid", valid)

    ret = script_runner.run("elyra-metadata", "remove", METADATA_TEST_SCHEMASPACE, "--name", "valid")
    assert ret.success is True


def test_remove_missing(script_runner, mock_data_dir):
    # Create an instance so that the schemaspace exists.
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)
    valid = Metadata(**valid_metadata_json)
    metadata_manager.create("valid", valid)

    ret = script_runner.run("elyra-metadata", "remove", METADATA_TEST_SCHEMASPACE, "--name=missing")
    assert ret.success is False
    assert "No such instance named 'missing' was found in the metadata-tests schemaspace." in ret.stdout

    # Now cleanup original instance.
    ret = script_runner.run("elyra-metadata", "remove", METADATA_TEST_SCHEMASPACE, "--name=valid")
    assert ret.success


def test_remove_instance(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None
    resource = metadata_manager.create("valid2", valid)
    assert resource is not None
    another = Metadata(**another_metadata_json)
    resource = metadata_manager.create("another", another)
    assert resource is not None
    resource = metadata_manager.create("another2", another)
    assert resource is not None

    ret = script_runner.run("elyra-metadata", "remove", METADATA_TEST_SCHEMASPACE, "--name=valid")
    assert ret.success

    ret = script_runner.run("elyra-metadata", "remove", METADATA_TEST_SCHEMASPACE, "--name=another")
    assert ret.success

    instances = metadata_manager.get_all()
    assert len(instances) == 2
    assert instances[0].name.endswith("2")
    assert instances[1].name.endswith("2")


def test_export_help(script_runner):
    ret = script_runner.run("elyra-metadata", "export", METADATA_TEST_SCHEMASPACE, "--help")
    assert ret.success is False
    assert f"Export installed metadata in schemaspace '{METADATA_TEST_SCHEMASPACE}'" in ret.stdout


def test_export_no_directory(script_runner):
    ret = script_runner.run("elyra-metadata", "export", METADATA_TEST_SCHEMASPACE)
    assert ret.success is False
    assert "'--directory' is a required parameter." in ret.stdout


def test_export_bad_argument(script_runner):
    ret = script_runner.run(
        "elyra-metadata", "export", METADATA_TEST_SCHEMASPACE, "--directory=dummy-directory", "--bogus-argument"
    )
    assert ret.success is False
    assert "The following arguments were unexpected: ['--bogus-argument']" in ret.stdout


def test_export_bad_schemaspace(script_runner):
    ret = script_runner.run("elyra-metadata", "export", "bogus-schemaspace")
    assert ret.success is False
    assert "Subcommand 'bogus-schemaspace' is invalid." in ret.stdout


def test_export_bad_schema(script_runner):
    ret = script_runner.run(
        "elyra-metadata",
        "export",
        METADATA_TEST_SCHEMASPACE,
        "--directory=dummy-directory",
        "--schema_name=bogus-schema",
    )
    assert (
        "Schema name 'bogus-schema' is invalid. For the 'metadata-tests' schemaspace, "
        "the schema name must be one of ['metadata-test', 'metadata-test2']" in ret.stdout
    )
    assert ret.success is False


def test_export_no_schema_no_instances(script_runner, mock_data_dir):
    ret = script_runner.run("elyra-metadata", "export", METADATA_TEST_SCHEMASPACE, "--directory=dummy-directory")
    assert ret.success
    assert f"No metadata instances found for schemaspace '{METADATA_TEST_SCHEMASPACE}'" in ret.stdout
    assert "Nothing exported to 'dummy-directory'" in ret.stdout


def test_export_inaccessible_directory(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    # create metadata
    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None

    directory_parameter = "/dummy-directory"

    ret = script_runner.run("elyra-metadata", "export", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is False
    assert f"Error creating directory structure for '{directory_parameter}/{METADATA_TEST_SCHEMASPACE}': " in ret.stdout
    assert any(ele in ret.stdout for ele in ["Read-only file system: ", "Permission denied: ", "Access Denied: "])
    assert f"'{directory_parameter}'" in ret.stdout


def test_export_with_schema_no_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    # create metadata in a different schema
    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None

    ret = script_runner.run(
        "elyra-metadata",
        "export",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test2",
        "--directory=dummy-directory",
    )
    assert ret.success
    assert (
        f"No metadata instances found for schemaspace '{METADATA_TEST_SCHEMASPACE}' "
        f"and schema 'metadata-test2'" in ret.stdout
    )
    assert "Nothing exported to 'dummy-directory'" in ret.stdout


def test_export_no_schema_with_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    # create valid metadata
    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None

    # create invalid metadata
    metadata_dir = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE)
    create_json_file(metadata_dir, "invalid.json", invalid_metadata_json)
    create_json_file(metadata_dir, "invalid2.json", invalid_metadata_json)

    # test for valid and invalid
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name
    ret = script_runner.run(
        "elyra-metadata", "export", METADATA_TEST_SCHEMASPACE, "--include-invalid", f"--directory={directory_parameter}"
    )
    assert ret.success
    export_directory = os.path.join(directory_parameter, METADATA_TEST_SCHEMASPACE)
    assert f"Creating directory structure for '{export_directory}'" in ret.stdout
    assert (
        f"Exporting metadata instances for schemaspace '{METADATA_TEST_SCHEMASPACE}' "
        f"(includes invalid) to '{export_directory}'" in ret.stdout
    )
    assert "Exported 3 instances (2 of which are invalid)" in ret.stdout

    exported_metadata = sorted(os.listdir(export_directory), key=str.casefold)
    assert len(exported_metadata) == 3
    assert exported_metadata[0] == "invalid.json"
    assert exported_metadata[1] == "invalid2.json"
    assert exported_metadata[2] == "valid.json"
    temp_dir.cleanup()

    # test for valid and invalid using '--include-invalid' option, which
    # prior to version 4.0 is a no-op
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name
    ret = script_runner.run(
        "elyra-metadata", "export", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}", "--include-invalid"
    )
    assert ret.success
    export_directory = os.path.join(directory_parameter, METADATA_TEST_SCHEMASPACE)
    assert f"Creating directory structure for '{export_directory}'" in ret.stdout
    assert (
        f"Exporting metadata instances for schemaspace '{METADATA_TEST_SCHEMASPACE}' "
        f"(includes invalid) to '{export_directory}'" in ret.stdout
    )
    assert "Exported 3 instances (2 of which are invalid)" in ret.stdout

    exported_metadata = sorted(os.listdir(export_directory), key=str.casefold)
    assert len(exported_metadata) == 3
    assert exported_metadata[0] == "invalid.json"
    assert exported_metadata[1] == "invalid2.json"
    assert exported_metadata[2] == "valid.json"
    temp_dir.cleanup()

    # test for valid only
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name
    ret = script_runner.run("elyra-metadata", "export", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success
    export_directory = os.path.join(directory_parameter, METADATA_TEST_SCHEMASPACE)
    assert f"Creating directory structure for '{export_directory}'" in ret.stdout
    assert (
        f"Exporting metadata instances for schemaspace '{METADATA_TEST_SCHEMASPACE}' "
        f"(valid only) to '{export_directory}'" in ret.stdout
    )
    assert "Exported 1 instance (0 of which are invalid)" in ret.stdout

    exported_metadata = os.listdir(export_directory)
    assert len(exported_metadata) == 1
    assert exported_metadata[0] == "valid.json"
    temp_dir.cleanup()


def test_export_with_schema_with_instances(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    # create valid metadata
    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None
    valid = Metadata(**valid_metadata2_json)
    resource = metadata_manager.create("valid2", valid)
    assert resource is not None

    # create invalid metadata
    metadata_dir = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE)
    create_json_file(metadata_dir, "invalid.json", invalid_metadata_json)

    # create export directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # test for valid and invalid
    ret = script_runner.run(
        "elyra-metadata",
        "export",
        METADATA_TEST_SCHEMASPACE,
        "--include-invalid",
        "--schema_name=metadata-test",
        f"--directory={directory_parameter}",
    )
    assert ret.success
    export_directory = os.path.join(directory_parameter, METADATA_TEST_SCHEMASPACE)
    assert f"Creating directory structure for '{export_directory}'" in ret.stdout
    assert (
        f"Exporting metadata instances for schemaspace '{METADATA_TEST_SCHEMASPACE}'"
        f" and schema 'metadata-test' (includes invalid) to '{export_directory}'" in ret.stdout
    )
    assert "Exported 2 instances (1 of which is invalid)" in ret.stdout

    exported_metadata = sorted(os.listdir(export_directory), key=str.casefold)
    assert len(exported_metadata) == 2
    assert exported_metadata[0] == "invalid.json"
    assert exported_metadata[1] == "valid.json"
    temp_dir.cleanup()

    # create export directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # test for valid only
    ret = script_runner.run(
        "elyra-metadata",
        "export",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        f"--directory={directory_parameter}",
    )
    assert ret.success
    export_directory = os.path.join(directory_parameter, METADATA_TEST_SCHEMASPACE)
    assert f"Creating directory structure for '{export_directory}'" in ret.stdout
    assert (
        f"Exporting metadata instances for schemaspace '{METADATA_TEST_SCHEMASPACE}'"
        f" and schema 'metadata-test' (valid only) to '{export_directory}'" in ret.stdout
    )
    assert "Exported 1 instance (0 of which are invalid)" in ret.stdout

    exported_metadata = os.listdir(export_directory)
    assert len(exported_metadata) == 1
    assert exported_metadata[0] == "valid.json"
    temp_dir.cleanup()


def test_export_without_clean(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    # create valid metadata
    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None

    # create export directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name
    export_directory = os.path.join(directory_parameter, METADATA_TEST_SCHEMASPACE)
    os.mkdir(export_directory)

    # create metadata file with dummy data and verify its contents
    dummy_json = {"required_test": "required_value"}
    metadata_filename = "valid.json"
    create_json_file(export_directory, metadata_filename, dummy_json)
    metadata_file_path = os.path.join(export_directory, metadata_filename)
    assert os.path.exists(metadata_file_path)
    assert json.loads(get_file_contents(metadata_file_path)) == dummy_json

    # create additional dummy file with a different name and verify its contents
    dummy_filename = "dummy.json"
    create_json_file(export_directory, dummy_filename, dummy_json)
    dummy_file_path = os.path.join(export_directory, dummy_filename)
    assert os.path.exists(dummy_file_path)
    assert json.loads(get_file_contents(dummy_file_path)) == dummy_json

    # create dummy file under different folder (different schema) and verify its contents
    export_directory_other = os.path.join(directory_parameter, "runtimes")
    os.mkdir(export_directory_other)
    dummy_filename_other = "dummy.json"
    create_json_file(export_directory_other, dummy_filename_other, dummy_json)
    dummy_file_path_other = os.path.join(export_directory_other, dummy_filename_other)
    assert os.path.exists(dummy_file_path_other)
    assert json.loads(get_file_contents(dummy_file_path_other)) == dummy_json

    # export metadata without --clean flag
    ret = script_runner.run(
        "elyra-metadata",
        "export",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        f"--directory={directory_parameter}",
    )
    assert ret.success
    assert f"Creating directory structure for '{export_directory}'" not in ret.stdout
    assert (
        f"Exporting metadata instances for schemaspace '{METADATA_TEST_SCHEMASPACE}'"
        f" and schema 'metadata-test' (valid only) to '{export_directory}'" in ret.stdout
    )
    assert "Exported 1 instance (0 of which are invalid)" in ret.stdout

    # verify that the metadata file was overwritten while both the dummy files were left as is
    export_directory_files = sorted(os.listdir(export_directory), key=str.casefold)
    assert len(export_directory_files) == 2

    assert export_directory_files[0] == dummy_filename
    assert json.loads(get_file_contents(dummy_file_path)) == dummy_json

    assert export_directory_files[1] == metadata_filename
    exported_metadata = json.loads(get_file_contents(metadata_file_path))
    assert "schema_name" in exported_metadata
    assert exported_metadata.get("schema_name") == valid_metadata_json.get("schema_name")

    export_directory_other_files = sorted(os.listdir(export_directory_other), key=str.casefold)
    assert len(export_directory_other_files) == 1
    assert export_directory_other_files[0] == dummy_filename_other
    assert json.loads(get_file_contents(dummy_file_path_other)) == dummy_json
    temp_dir.cleanup()


def test_export_clean(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    # create valid metadata
    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None

    # create export directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name
    export_directory = os.path.join(directory_parameter, METADATA_TEST_SCHEMASPACE)
    os.mkdir(export_directory)

    # create metadata file with dummy data and verify its contents
    dummy_json = {"required_test": "required_value"}
    metadata_filename = "valid.json"
    create_json_file(export_directory, metadata_filename, dummy_json)
    metadata_file_path = os.path.join(export_directory, metadata_filename)
    assert os.path.exists(metadata_file_path)
    assert json.loads(get_file_contents(metadata_file_path)) == dummy_json

    # create additional dummy file with a different name and verify its contents
    dummy_filename = "dummy.json"
    create_json_file(export_directory, dummy_filename, dummy_json)
    dummy_file_path = os.path.join(export_directory, dummy_filename)
    assert os.path.exists(dummy_file_path)
    assert json.loads(get_file_contents(dummy_file_path)) == dummy_json

    # create dummy file under different folder (different schema) and verify its contents
    export_directory_other = os.path.join(directory_parameter, "runtimes")
    os.mkdir(export_directory_other)
    dummy_filename_other = "dummy.json"
    create_json_file(export_directory_other, dummy_filename_other, dummy_json)
    dummy_file_path_other = os.path.join(export_directory_other, dummy_filename_other)
    assert os.path.exists(dummy_file_path_other)
    assert json.loads(get_file_contents(dummy_file_path_other)) == dummy_json

    # export metadata with --clean flag
    ret = script_runner.run(
        "elyra-metadata",
        "export",
        METADATA_TEST_SCHEMASPACE,
        "--clean",
        "--schema_name=metadata-test",
        f"--directory={directory_parameter}",
    )
    assert ret.success
    assert f"Creating directory structure for '{export_directory}'" not in ret.stdout
    assert f"Cleaning out all files in '{export_directory}'" in ret.stdout
    assert (
        f"Exporting metadata instances for schemaspace '{METADATA_TEST_SCHEMASPACE}'"
        f" and schema 'metadata-test' (valid only) to '{export_directory}'" in ret.stdout
    )
    assert "Exported 1 instance (0 of which are invalid)" in ret.stdout

    # verify that the metadata file was overwritten and dummy file within the same schema folder was deleted
    # whereas the dummy file within the other schema folder was left as is
    export_directory_files = os.listdir(export_directory)
    assert len(export_directory_files) == 1

    assert export_directory_files[0] == metadata_filename
    exported_metadata = json.loads(get_file_contents(metadata_file_path))
    assert "schema_name" in exported_metadata
    assert exported_metadata.get("schema_name") == valid_metadata_json.get("schema_name")

    export_directory_other_files = sorted(os.listdir(export_directory_other), key=str.casefold)
    assert len(export_directory_other_files) == 1
    assert export_directory_other_files[0] == dummy_filename_other
    assert json.loads(get_file_contents(dummy_file_path_other)) == dummy_json
    temp_dir.cleanup()


def test_import_help(script_runner):
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, "--help")
    assert ret.success is False
    assert f"\nImport metadata instances into schemaspace '{METADATA_TEST_SCHEMASPACE}'" in ret.stdout


def test_import_no_directory(script_runner):
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE)
    assert ret.success is False
    assert "ERROR: '--directory' is a required parameter." in ret.stdout


def test_import_bad_argument(script_runner):
    ret = script_runner.run(
        "elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, "--directory=dummy-directory", "--bogus-argument"
    )
    assert ret.success is False
    assert "ERROR: The following arguments were unexpected: ['--bogus-argument']" in ret.stdout


def test_import_bad_schemaspace(script_runner):
    ret = script_runner.run("elyra-metadata", "import", "bogus-schemaspace")
    assert ret.success is False
    assert "Subcommand 'bogus-schemaspace' is invalid." in ret.stdout


def test_import_inaccessible_directory(script_runner):
    directory_parameter = "/dummy-directory"

    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is False
    assert (
        f"Unable to reach the '{directory_parameter}'"
        f" directory: No such file or directory: '{directory_parameter}" in ret.stdout
    )


def test_import_empty_directory(script_runner):
    # create import directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # import metadata
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is True
    assert f"No instances for import found in the '{directory_parameter}' directory" in ret.stdout
    temp_dir.cleanup()


def test_import_non_json_file(script_runner):
    # create import directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # add a dummy file in the directory
    dummy_filename = "dummy.txt"
    dummy_filepath = os.path.join(directory_parameter, dummy_filename)
    dummy_file_content = "This is a dummy txt file."
    with open(dummy_filepath, "w") as f:
        f.write(dummy_file_content)
    assert os.path.exists(dummy_filepath)
    assert get_file_contents(dummy_filepath) == dummy_file_content

    # import metadata
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is True
    assert f"No instances for import found in the '{directory_parameter}' directory" in ret.stdout
    temp_dir.cleanup()


def test_import_valid_metadata_files(script_runner, mock_data_dir):
    # create import directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # add valid metadata json files in the directory
    metadata_filename = "valid.json"
    metadata_file_path = os.path.join(directory_parameter, metadata_filename)
    with open(metadata_file_path, "w") as f:
        json.dump(valid_metadata_json, f)
    assert os.path.exists(metadata_file_path)
    assert json.loads(get_file_contents(metadata_file_path)) == valid_metadata_json

    metadata_filename2 = "valid2.json"
    metadata_file_path2 = os.path.join(directory_parameter, metadata_filename2)
    with open(metadata_file_path2, "w") as f:
        json.dump(valid_metadata2_json, f)
    assert os.path.exists(metadata_file_path2)
    assert json.loads(get_file_contents(metadata_file_path2)) == valid_metadata2_json

    # import metadata
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is True
    assert "Imported 2 instances" in ret.stdout
    temp_dir.cleanup()

    # verify contents of imported metadata
    metadata_directory = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE)
    assert os.path.isdir(metadata_directory)
    installed_metadata_file_path = os.path.join(metadata_directory, metadata_filename)
    assert os.path.isfile(installed_metadata_file_path)

    with open(installed_metadata_file_path, "r") as metadata_file:
        instance_json = json.load(metadata_file)
        assert instance_json["schema_name"] == valid_metadata_json["schema_name"]
        assert instance_json["display_name"] == valid_metadata_json["display_name"]
        assert instance_json["metadata"]["required_test"] == valid_metadata_json["metadata"]["required_test"]
        assert instance_json["metadata"]["uri_test"] == valid_metadata_json["metadata"]["uri_test"]
        assert instance_json["metadata"]["number_range_test"] == valid_metadata_json["metadata"]["number_range_test"]

    installed_metadata_file_path = os.path.join(metadata_directory, metadata_filename2)
    assert os.path.isfile(installed_metadata_file_path)

    with open(installed_metadata_file_path, "r") as metadata_file:
        instance_json = json.load(metadata_file)
        assert instance_json["schema_name"] == valid_metadata2_json["schema_name"]
        assert instance_json["display_name"] == valid_metadata2_json["display_name"]
        assert instance_json["metadata"]["required_test"] == valid_metadata2_json["metadata"]["required_test"]
        assert instance_json["metadata"]["uri_test"] == valid_metadata2_json["metadata"]["uri_test"]
        assert instance_json["metadata"]["number_range_test"] == valid_metadata2_json["metadata"]["number_range_test"]


def test_import_invalid_metadata_file(script_runner, mock_data_dir):
    # create import directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # add invalid metadata json file in the directory
    metadata_filename = "invalid.json"
    metadata_file_path = os.path.join(directory_parameter, metadata_filename)
    with open(metadata_file_path, "w") as f:
        json.dump(invalid_metadata_json, f)
    assert os.path.exists(metadata_file_path)
    with open(metadata_file_path) as f:
        assert json.load(f) == invalid_metadata_json

    # import metadata
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is True
    lines = ret.stdout.split("\n")
    assert len(lines) == 8
    assert "Imported 0 instances" in lines[0]
    assert "1 instance could not be imported" in lines[1]
    assert "The following files could not be imported:" in lines[3]
    assert lines[6].startswith("invalid.json")
    assert (
        lines[6]
        .strip()
        .endswith(
            "Validation failed for instance 'invalid' using the metadata-test "
            + "schema with error: '//localhost:8081/' is not a 'uri'."
        )
    )

    temp_dir.cleanup()


def test_import_with_subfolder(script_runner, mock_data_dir):
    # create import directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # add valid metadata json file in the import directory
    metadata_filename = "valid.json"
    metadata_file_path = os.path.join(directory_parameter, metadata_filename)
    with open(metadata_file_path, "w") as f:
        json.dump(valid_metadata_json, f)
    assert os.path.exists(metadata_file_path)
    assert json.loads(get_file_contents(metadata_file_path)) == valid_metadata_json

    # add invalid metadata json files in the directory
    invalid_metadata_filename = "invalid.json"
    invalid_metadata_file_path = os.path.join(directory_parameter, invalid_metadata_filename)
    with open(invalid_metadata_file_path, "w") as f:
        json.dump(invalid_metadata_json, f)
    assert os.path.exists(invalid_metadata_file_path)
    assert json.loads(get_file_contents(invalid_metadata_file_path)) == invalid_metadata_json

    invalid_metadata_file_path2 = os.path.join(directory_parameter, "invalid2.json")
    shutil.copyfile(invalid_metadata_file_path, invalid_metadata_file_path2)
    assert os.path.exists(invalid_metadata_file_path2)
    assert json.loads(get_file_contents(invalid_metadata_file_path2)) == invalid_metadata_json

    # create a sub-folder within import directory and add a valid metadata file in it
    os.mkdir(os.path.join(directory_parameter, "subfolder"))
    metadata_filename2 = "valid2.json"
    metadata_file_path2 = os.path.join(directory_parameter, "subfolder", metadata_filename2)
    with open(metadata_file_path2, "w") as f:
        json.dump(valid_metadata2_json, f)
    assert os.path.exists(metadata_file_path2)
    assert json.loads(get_file_contents(metadata_file_path2)) == valid_metadata2_json

    # import metadata
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is True
    lines = ret.stdout.split("\n")
    assert len(lines) == 9
    assert "Imported 1 instance" in lines[0]
    assert "2 instances could not be imported" in lines[1]
    assert "The following files could not be imported:" in lines[3]
    assert lines[6].startswith("invalid.json")
    assert (
        lines[6]
        .strip()
        .endswith(
            "Validation failed for instance 'invalid' using the metadata-test "
            + "schema with error: '//localhost:8081/' is not a 'uri'."
        )
    )
    assert lines[7].startswith("invalid2.json")
    assert (
        lines[7]
        .strip()
        .endswith(
            "Validation failed for instance 'invalid2' using the metadata-test "
            + "schema with error: '//localhost:8081/' is not a 'uri'."
        )
    )

    temp_dir.cleanup()

    # verify contents of imported metadata
    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    installed_metadata_file_path = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, metadata_filename)
    assert os.path.isfile(installed_metadata_file_path)

    with open(installed_metadata_file_path, "r") as metadata_file:
        instance_json = json.load(metadata_file)
        assert instance_json["schema_name"] == valid_metadata_json["schema_name"]
        assert instance_json["display_name"] == valid_metadata_json["display_name"]
        assert instance_json["metadata"]["required_test"] == valid_metadata_json["metadata"]["required_test"]
        assert instance_json["metadata"]["uri_test"] == valid_metadata_json["metadata"]["uri_test"]
        assert instance_json["metadata"]["number_range_test"] == valid_metadata_json["metadata"]["number_range_test"]


def test_import_overwrite_flag(script_runner, mock_data_dir):
    metadata_manager = MetadataManager(schemaspace=METADATA_TEST_SCHEMASPACE)

    # create valid metadata
    valid = Metadata(**valid_metadata_json)
    resource = metadata_manager.create("valid", valid)
    assert resource is not None

    # create import directory
    temp_dir = TemporaryDirectory()
    directory_parameter = temp_dir.name

    # add valid metadata json file for existing metadata in the import directory
    metadata_filename = "valid.json"
    metadata_file_path = os.path.join(directory_parameter, metadata_filename)
    with open(metadata_file_path, "w") as f:
        json.dump(valid_metadata_json, f)
    assert os.path.exists(metadata_file_path)
    assert json.loads(get_file_contents(metadata_file_path)) == valid_metadata_json

    # add valid metadata json file for new metadata
    metadata_filename2 = "valid2.json"
    metadata_file_path2 = os.path.join(directory_parameter, metadata_filename2)
    with open(metadata_file_path2, "w") as f:
        json.dump(valid_metadata_json, f)
    assert os.path.exists(metadata_file_path2)
    assert json.loads(get_file_contents(metadata_file_path2)) == valid_metadata_json

    # import metadata without overwrite flag
    ret = script_runner.run("elyra-metadata", "import", METADATA_TEST_SCHEMASPACE, f"--directory={directory_parameter}")
    assert ret.success is True
    lines = ret.stdout.split("\n")
    assert len(lines) == 8
    assert "Imported 1 instance" in lines[0]
    assert "1 instance could not be imported" in lines[1]
    assert "The following files could not be imported:" in lines[3]
    assert lines[6].startswith("valid.json")
    assert (
        lines[6]
        .strip()
        .endswith(
            "An instance named 'valid' already exists in the metadata-tests "
            + "schemaspace. Use '--overwrite' to update."
        )
    )

    # verify contents of imported metadata
    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    installed_metadata_file_path2 = os.path.join(
        mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, metadata_filename2
    )
    assert os.path.isfile(installed_metadata_file_path2)

    with open(installed_metadata_file_path2, "r") as metadata_file:
        instance_json = json.load(metadata_file)
        assert instance_json["schema_name"] == valid_metadata_json["schema_name"]
        assert instance_json["display_name"] == valid_metadata_json["display_name"]
        assert instance_json["metadata"]["required_test"] == valid_metadata_json["metadata"]["required_test"]
        assert instance_json["metadata"]["uri_test"] == valid_metadata_json["metadata"]["uri_test"]
        assert instance_json["metadata"]["number_range_test"] == valid_metadata_json["metadata"]["number_range_test"]

    # replace one of the metadata files with new content
    os.remove(metadata_file_path2)
    assert os.path.exists(metadata_file_path2) is False
    with open(metadata_file_path2, "w") as f:
        json.dump(valid_display_name_json, f)
    assert os.path.exists(metadata_file_path2)
    assert json.loads(get_file_contents(metadata_file_path2)) == valid_display_name_json

    # add another valid metadata json file for new metadata
    metadata_filename3 = "another.json"
    metadata_file_path3 = os.path.join(directory_parameter, metadata_filename3)
    with open(metadata_file_path3, "w") as f:
        json.dump(another_metadata_json, f)
    assert os.path.exists(metadata_file_path3)
    assert json.loads(get_file_contents(metadata_file_path3)) == another_metadata_json

    # re-try import metadata with overwrite flag
    ret = script_runner.run(
        "elyra-metadata",
        "import",
        METADATA_TEST_SCHEMASPACE,
        f"--directory={directory_parameter}",
        "--overwrite",
    )
    assert ret.success is True
    assert "Imported 3 instances" in ret.stdout
    temp_dir.cleanup()

    # verify contents of existing (unchanged) metadata
    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    installed_metadata_file_path = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, metadata_filename)
    assert os.path.isfile(installed_metadata_file_path)

    with open(installed_metadata_file_path, "r") as metadata_file:
        instance_json = json.load(metadata_file)
        assert instance_json["schema_name"] == valid_metadata_json["schema_name"]
        assert instance_json["display_name"] == valid_metadata_json["display_name"]
        assert instance_json["metadata"]["required_test"] == valid_metadata_json["metadata"]["required_test"]
        assert instance_json["metadata"]["uri_test"] == valid_metadata_json["metadata"]["uri_test"]
        assert instance_json["metadata"]["number_range_test"] == valid_metadata_json["metadata"]["number_range_test"]

    # verify contents of overwritten metadata
    installed_metadata_filepath2 = os.path.join(
        mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, metadata_filename2
    )
    assert os.path.isfile(installed_metadata_filepath2)

    with open(installed_metadata_filepath2, "r") as metadata_file:
        instance_json = json.load(metadata_file)
        assert instance_json["schema_name"] == valid_display_name_json["schema_name"]
        assert instance_json["display_name"] == valid_display_name_json["display_name"]
        assert instance_json["metadata"]["required_test"] == valid_display_name_json["metadata"]["required_test"]

    # verify contents of new imported metadata
    installed_metadata_filepath3 = os.path.join(
        mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, metadata_filename3
    )
    assert os.path.isfile(installed_metadata_filepath3)

    with open(installed_metadata_filepath3, "r") as metadata_file:
        instance_json = json.load(metadata_file)
        assert instance_json["schema_name"] == another_metadata_json["schema_name"]
        assert instance_json["display_name"] == another_metadata_json["display_name"]
        assert instance_json["metadata"]["required_test"] == another_metadata_json["metadata"]["required_test"]
        assert instance_json["metadata"]["uri_test"] == another_metadata_json["metadata"]["uri_test"]


# Begin property tests...


def test_required(script_runner, mock_data_dir):
    # Doesn't use PropertyTester due to its unique test since all other tests require this property
    name = "required"

    expected_file = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, name + ".json")
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=" + name,
        "--display_name=" + name,
    )

    assert ret.success is False
    assert "'--required_test' is a required parameter" in ret.stdout

    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=" + name,
        "--display_name=" + name,
        "--required_test=required_value",
    )

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == "metadata-test"
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["required_test"] == "required_value"


def test_number_default(script_runner, mock_data_dir):
    # Doesn't use PropertyTester due to its unique test (no failure, needs update, etc.)
    name = "number_default"

    expected_file = os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE, name + ".json")
    # Cleanup from any potential previous failures
    if os.path.exists(expected_file):
        os.remove(expected_file)

    # No negative test here.  First create w/o a value and ensure 42, then create with a value and ensure that value.
    ret = script_runner.run(
        "elyra-metadata",
        "create",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=" + name,
        "--display_name=" + name,
        "--required_test=required_value",
    )

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == "metadata-test"
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["number_default_test"] == 42

    # Note that we only include the properties that are changed, along with "identifiers" like name and schema_name.
    ret = script_runner.run(
        "elyra-metadata",
        "update",
        METADATA_TEST_SCHEMASPACE,
        "--schema_name=metadata-test",
        "--name=" + name,
        "--number_default_test=7.2",
    )

    assert ret.success
    assert "Metadata instance '" + name + "' for schema 'metadata-test' has been written" in ret.stdout

    assert os.path.isdir(os.path.join(mock_data_dir, "metadata", METADATA_TEST_SCHEMASPACE))
    assert os.path.isfile(expected_file)

    with open(expected_file, "r") as fd:
        instance_json = json.load(fd)
        assert instance_json["schema_name"] == "metadata-test"
        assert instance_json["display_name"] == name
        assert instance_json["metadata"]["number_default_test"] == 7.2


def test_uri(script_runner, mock_data_dir):
    prop_test = PropertyTester("uri")
    prop_test.negative_value = "//invalid-uri"
    prop_test.negative_stdout = "'//invalid-uri' is not a 'uri'"
    #  this can be joined with previous if adding meta-properties
    #  "; title: URI Test, format: uri"
    prop_test.negative_stderr = "'//invalid-uri' is not a 'uri'"
    prop_test.positive_value = "http://localhost:31823/v1/models?version=2017-02-13"
    prop_test.run(script_runner, mock_data_dir)


def test_integer_exclusivity(script_runner, mock_data_dir):
    prop_test = PropertyTester("integer_exclusivity")
    prop_test.negative_value = 3
    prop_test.negative_stdout = "3 is less than or equal to the minimum of 3"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Integer Exclusivity Test, exclusiveMinimum: 3, exclusiveMaximum: 10"
    prop_test.negative_stderr = "3 is less than or equal to the minimum of 3"
    prop_test.positive_value = 7
    prop_test.run(script_runner, mock_data_dir)


def test_integer_multiple(script_runner, mock_data_dir):
    prop_test = PropertyTester("integer_multiple")
    prop_test.negative_value = 32
    prop_test.negative_stdout = "32 is not a multiple of 6"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Integer Multiple Test, multipleOf: 6"
    prop_test.negative_stderr = "32 is not a multiple of 6"
    prop_test.positive_value = 42
    prop_test.run(script_runner, mock_data_dir)


def test_number_range(script_runner, mock_data_dir):
    prop_test = PropertyTester("number_range")
    prop_test.negative_value = 2.7
    prop_test.negative_stdout = "2.7 is less than the minimum of 3"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Number Range Test, minimum: 3, maximum: 10"
    prop_test.negative_stderr = "2.7 is less than the minimum of 3"
    prop_test.positive_value = 7.2
    prop_test.run(script_runner, mock_data_dir)


def test_const(script_runner, mock_data_dir):
    prop_test = PropertyTester("const")
    prop_test.negative_value = 2.718
    prop_test.negative_stdout = "3.14 was expected"
    #  this can be joined with previous if adding meta-properties
    #  " ; title: Const Test, const: 3.14"
    prop_test.negative_stderr = "3.14 was expected"
    prop_test.positive_value = 3.14
    prop_test.run(script_runner, mock_data_dir)


def test_string_length(script_runner, mock_data_dir):
    prop_test = PropertyTester("string_length")
    prop_test.negative_value = "12345678901"
    prop_test.negative_stdout = "'12345678901' is too long"
    #  this can be joined with previous if adding meta-properties
    #  "; title: String Length Test, minLength: 3, maxLength: 10"
    prop_test.negative_stderr = "'12345678901' is too long"
    prop_test.positive_value = "123456"
    prop_test.run(script_runner, mock_data_dir)


def test_string_pattern(script_runner, mock_data_dir):
    prop_test = PropertyTester("string_pattern")  # Must start/end with alphanumeric, can include '-' and '.'
    prop_test.negative_value = "-foo1"
    prop_test.negative_stdout = "'-foo1' does not match '^[a-z0-9][a-z0-9-.]*[a-z0-9]$'"
    #  this can be joined with previous if adding meta-properties
    #  "; title: String Pattern Test, pattern: ^[a-z0-9][a-z0-9-.]*[a-z0-9]$"
    prop_test.negative_stderr = "'-foo1' does not match '^[a-z0-9][a-z0-9-.]*[a-z0-9]$'"
    prop_test.positive_value = "0foo-bar.com-01"
    prop_test.run(script_runner, mock_data_dir)


def test_enum(script_runner, mock_data_dir):
    prop_test = PropertyTester("enum")
    prop_test.negative_value = "jupyter"
    prop_test.negative_stdout = "'jupyter' is not one of ['elyra', 'rocks', 'added']"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Enum Test, enum: ['elyra', 'rocks', 'added']"
    prop_test.negative_stderr = "'jupyter' is not one of ['elyra', 'rocks', 'added']"
    prop_test.positive_value = "added"
    prop_test.run(script_runner, mock_data_dir)


def test_array(script_runner, mock_data_dir):
    prop_test = PropertyTester("array")
    prop_test.negative_value = [1, 2, 2]
    prop_test.negative_stdout = "[1, 2, 2] has non-unique elements"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Array Test, minItems: 3, maxItems: 10, uniqueItems: True"
    prop_test.negative_stderr = "[1, 2, 2] has non-unique elements"
    prop_test.positive_value = [1, 2, 3, 4, 5]
    prop_test.run(script_runner, mock_data_dir)


def test_object(script_runner, mock_data_dir):
    prop_test = PropertyTester("object")
    prop_test.negative_value = {"prop1": 2, "prop2": 3}
    prop_test.negative_stdout = "{'prop1': 2, 'prop2': 3} does not have enough properties"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Object Test, minProperties: 3, maxProperties: 10"
    prop_test.negative_stderr = "{'prop1': 2, 'prop2': 3} does not have enough properties"
    prop_test.positive_value = {"prop1": 2, "prop2": 3, "prop3": 4, "prop4": 5}
    prop_test.run(script_runner, mock_data_dir)


def test_boolean(script_runner, mock_data_dir):
    prop_test = PropertyTester("boolean")
    prop_test.negative_value = "bogus_boolean"
    prop_test.negative_stdout = "'bogus_boolean' is not of type 'boolean'"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Boolean Test"
    prop_test.negative_stderr = "'bogus_boolean' is not of type 'boolean'"
    prop_test.positive_value = True
    prop_test.run(script_runner, mock_data_dir)


def test_null(script_runner, mock_data_dir):
    prop_test = PropertyTester("null")
    prop_test.negative_value = "bogus_null"
    prop_test.negative_stdout = "'bogus_null' is not of type 'null'"
    #  this can be joined with previous if adding meta-properties
    #  "; title: Null Test"
    prop_test.negative_stderr = "'bogus_null' is not of type 'null'"
    prop_test.positive_value = None
    prop_test.run(script_runner, mock_data_dir)
