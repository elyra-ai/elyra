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
import hashlib
import json
import logging
import os
from pathlib import Path
import subprocess
from subprocess import CalledProcessError
from subprocess import CompletedProcess
from subprocess import run
import sys
from tempfile import TemporaryFile
import time
from typing import Optional

import minio
import mock
import nbformat
import papermill
import pytest

from elyra.kfp import bootstrapper

# To run this test from an IDE:
# 1. set PYTHONPATH='`path-to-repo`/etc/docker-scripts' and working directory to `path-to-repo`
# 2. Manually launch test_minio container: docker run --name test_minio -d -p 9000:9000 minio/minio server /data
#    (this is located in Makefile)
#
# NOTE: Any changes to elyra/tests/kfp/resources/test-notebookA.ipynb require an
# update of elyra/tests/kfp/resources/test-archive.tgz  using the command below:
# tar -cvzf test-archive.tgz test-notebookA.ipynb


MINIO_HOST_PORT = os.getenv("MINIO_HOST_PORT", "127.0.0.1:9000")

ELYRA_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
RESOURCES_DIR = os.path.join(ELYRA_ROOT_DIR, "elyra", "tests", "kfp", "resources")


@pytest.fixture(scope="module", autouse=True)
def start_minio():
    """Start the minio container to simulate COS."""

    # The docker run command will fail if an instance of the test_minio container is running.
    # We'll make a "silent" attempt to start.  If that fails, assume its due to the container
    # conflict, force its shutdown, and try once more.  If successful, yield the minio instance
    # but also shutdown on the flip-side of the yield (when the fixture is cleaned up).
    #
    # Although actions like SIGINT (ctrl-C) should still trigger the post-yield logic, urgent
    # interrupts like SIGQUIT (ctrl-\) or multiple SIGINTs can still orphan the container, so
    # we still need the pre-yield behavior.

    minio = start_minio_container(False)
    if minio is None:  # Got a failure. Shutdown (assumed) container and try once more.
        stop_minio_container()
        minio = start_minio_container(True)

    time.sleep(3)  # give container a chance to start
    yield minio
    stop_minio_container()


def start_minio_container(raise_on_failure: bool = False) -> Optional[CompletedProcess]:
    minio = None
    try:
        minio = run(
            ["docker", "run", "--name", "test_minio", "-d", "-p", "9000:9000", "minio/minio", "server", "/data"],
            check=True,
        )
    except CalledProcessError as ex:
        if raise_on_failure:
            raise RuntimeError(f"Error executing docker process: {ex}") from ex

    return minio


def stop_minio_container():
    run(["docker", "rm", "-f", "test_minio"], check=True)


@pytest.fixture(scope="function")
def s3_setup():
    bucket_name = "test-bucket"
    cos_client = minio.Minio(MINIO_HOST_PORT, access_key="minioadmin", secret_key="minioadmin", secure=False)
    cos_client.make_bucket(bucket_name)

    yield cos_client

    cleanup_files = cos_client.list_objects(bucket_name, recursive=True)
    for file in cleanup_files:
        cos_client.remove_object(bucket_name, file.object_name)
    cos_client.remove_bucket(bucket_name)


def main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict):
    """Primary body for main method testing..."""
    monkeypatch.setattr(bootstrapper.OpUtil, "parse_arguments", lambda x: argument_dict)
    monkeypatch.setattr(bootstrapper.OpUtil, "package_install", mock.Mock(return_value=True))

    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "minioadmin")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "minioadmin")
    monkeypatch.setenv("TEST_ENV_VAR1", "test_env_var1")

    s3_setup.fput_object(
        bucket_name=argument_dict["cos-bucket"],
        object_name="test-directory/test-file.txt",
        file_path=os.path.join(RESOURCES_DIR, "test-requirements-elyra.txt"),
    )
    s3_setup.fput_object(
        bucket_name=argument_dict["cos-bucket"],
        object_name="test-directory/test,file.txt",
        file_path=os.path.join(RESOURCES_DIR, "test-bad-requirements-elyra.txt"),
    )
    s3_setup.fput_object(
        bucket_name=argument_dict["cos-bucket"],
        object_name="test-directory/test-archive.tgz",
        file_path=os.path.join(RESOURCES_DIR, "test-archive.tgz"),
    )

    with tmpdir.as_cwd():
        bootstrapper.main()
        test_file_list = [
            "test-archive.tgz",
            "test-file.txt",
            "test,file.txt",
            "test-file/test-file-copy.txt",
            "test-file/test,file/test,file-copy.txt",
            "test-notebookA.ipynb",
            "test-notebookA-output.ipynb",
            "test-notebookA.html",
        ]
        # Ensure working directory has all the files.
        for file in test_file_list:
            assert os.path.isfile(file)
        # Ensure upload directory has all the files EXCEPT the output notebook
        # since it was it is uploaded as the input notebook (test-notebookA.ipynb)
        # (which is included in the archive at start).
        for file in test_file_list:
            if file != "test-notebookA-output.ipynb":
                assert s3_setup.stat_object(
                    bucket_name=argument_dict["cos-bucket"], object_name="test-directory/" + file
                )
                if file == "test-notebookA.html":
                    with open("test-notebookA.html") as html_file:
                        assert "TEST_ENV_VAR1: test_env_var1" in html_file.read()


def _get_operation_instance(monkeypatch, s3_setup):
    config = {
        "cos-endpoint": "http://" + MINIO_HOST_PORT,
        "cos-user": "minioadmin",
        "cos-password": "minioadmin",
        "cos-bucket": "test-bucket",
        "filepath": "untitled.ipynb",
    }

    op = bootstrapper.FileOpBase.get_instance(**config)

    # use the same minio instance used by the test
    # to avoid access denied errors when two minio
    # instances exist
    monkeypatch.setattr(op, "cos_client", s3_setup)

    return op


def test_main_method(monkeypatch, s3_setup, tmpdir):
    argument_dict = {
        "cos-endpoint": "http://" + MINIO_HOST_PORT,
        "cos-bucket": "test-bucket",
        "cos-directory": "test-directory",
        "cos-dependencies-archive": "test-archive.tgz",
        "filepath": os.path.join(RESOURCES_DIR, "test-notebookA.ipynb"),
        "inputs": "test-file.txt;test,file.txt",
        "outputs": "test-file/test-file-copy.txt;test-file/test,file/test,file-copy.txt",
        "user-volume-path": None,
    }
    main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict)


def test_main_method_with_wildcard_outputs(monkeypatch, s3_setup, tmpdir):
    argument_dict = {
        "cos-endpoint": "http://" + MINIO_HOST_PORT,
        "cos-bucket": "test-bucket",
        "cos-directory": "test-directory",
        "cos-dependencies-archive": "test-archive.tgz",
        "filepath": os.path.join(RESOURCES_DIR, "test-notebookA.ipynb"),
        "inputs": "test-file.txt;test,file.txt",
        "outputs": "test-file/*",
        "user-volume-path": None,
    }
    main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict)


def test_main_method_with_dir_outputs(monkeypatch, s3_setup, tmpdir):
    argument_dict = {
        "cos-endpoint": "http://" + MINIO_HOST_PORT,
        "cos-bucket": "test-bucket",
        "cos-directory": "test-directory",
        "cos-dependencies-archive": "test-archive.tgz",
        "filepath": os.path.join(RESOURCES_DIR, "test-notebookA.ipynb"),
        "inputs": "test-file.txt;test,file.txt",
        "outputs": "test-file",  # this is the directory that contains the outputs
        "user-volume-path": None,
    }
    main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict)


def is_writable_dir(path):
    """Helper method determines whether 'path' is a writable directory"""
    try:
        with TemporaryFile(mode="w", dir=path) as t:
            t.write("1")
        return True
    except Exception:
        return False


def remove_file(filename, fail_ok=True):
    """Removes filename. If fail_ok is False an assert is raised
    if removal failed for any reason, e.g. filenotfound
    """
    try:
        os.remove(filename)
    except OSError as ose:
        if fail_ok is False:
            raise AssertionError(f"Cannot remove {filename}: {str(ose)} {ose}")


def test_process_metrics_method_not_writable_dir(monkeypatch, s3_setup, tmpdir):
    """Test for process_metrics_and_metadata

    Validates that the method can handle output directory that is not writable
    """

    # remove "default" output file if it already exists
    output_metadata_file = Path("/tmp") / "mlpipeline-ui-metadata.json"
    remove_file(output_metadata_file)

    try:
        monkeypatch.setenv("ELYRA_WRITABLE_CONTAINER_DIR", "/good/time/to/fail")
        argument_dict = {
            "cos-endpoint": f"http://{MINIO_HOST_PORT}",
            "cos-bucket": "test-bucket",
            "cos-directory": "test-directory",
            "cos-dependencies-archive": "test-archive.tgz",
            "filepath": os.path.join(RESOURCES_DIR, "test-notebookA.ipynb"),
            "inputs": "test-file.txt;test,file.txt",
            "outputs": "test-file/test-file-copy.txt;test-file/test,file/test,file-copy.txt",
            "user-volume-path": None,
        }
        main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict)
    except Exception as ex:
        print(f"Writable dir test failed: {str(ex)} {ex}")
        assert False
    assert output_metadata_file.exists() is False


def test_process_metrics_method_no_metadata_file(monkeypatch, s3_setup, tmpdir):
    """Test for process_metrics_and_metadata

    Verifies that the method produces a valid KFP UI metadata file if
    the node's script | notebook did not generate this metadata file.
    """
    argument_dict = {
        "cos-endpoint": "http://" + MINIO_HOST_PORT,
        "cos-bucket": "test-bucket",
        "cos-directory": "test-directory",
        "cos-dependencies-archive": "test-archive.tgz",
        "filepath": os.path.join(RESOURCES_DIR, "test-notebookA.ipynb"),
        "inputs": "test-file.txt;test,file.txt",
        "outputs": "test-file/test-file-copy.txt;test-file/test,file/test,file-copy.txt",
        "user-volume-path": None,
    }

    output_path = Path(tmpdir)
    # metadata file name and location
    metadata_file = output_path / "mlpipeline-ui-metadata.json"
    # remove file if it already exists
    remove_file(metadata_file)

    # override the default output directory to make this test platform
    # independent
    monkeypatch.setenv("ELYRA_WRITABLE_CONTAINER_DIR", str(tmpdir))
    main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict)

    # process_metrics should have generated a file named mlpipeline-ui-metadata.json
    # in tmpdir

    try:
        with open(metadata_file, "r") as f:
            metadata = json.load(f)
            assert metadata.get("outputs") is not None
            assert isinstance(metadata["outputs"], list)
            assert len(metadata["outputs"]) == 1
            assert metadata["outputs"][0]["storage"] == "inline"
            assert metadata["outputs"][0]["type"] == "markdown"
            assert (
                f"{argument_dict['cos-endpoint']}/{argument_dict['cos-bucket']}/{argument_dict['cos-directory']}"
                in metadata["outputs"][0]["source"]
            )
            assert argument_dict["cos-dependencies-archive"] in metadata["outputs"][0]["source"]
    except AssertionError:
        raise
    except Exception as ex:
        # Potential reasons for failures:
        # file not found, invalid JSON
        print(f'Validation of "{str(ex)}" failed: {ex}')
        assert False


def test_process_metrics_method_valid_metadata_file(monkeypatch, s3_setup, tmpdir):
    """Test for process_metrics_and_metadata

    Verifies that the method produces a valid KFP UI metadata file if
    the node's script | notebook generated this metadata file.
    """
    argument_dict = {
        "cos-endpoint": "http://" + MINIO_HOST_PORT,
        "cos-bucket": "test-bucket",
        "cos-directory": "test-directory",
        "cos-dependencies-archive": "test-archive.tgz",
        "filepath": os.path.join(RESOURCES_DIR, "test-notebookA.ipynb"),
        "inputs": "test-file.txt;test,file.txt",
        "outputs": "test-file/test-file-copy.txt;test-file/test,file/test,file-copy.txt",
        "user-volume-path": None,
    }

    output_path = Path(tmpdir)
    # metadata file name and location
    input_metadata_file = "mlpipeline-ui-metadata.json"
    output_metadata_file = output_path / input_metadata_file
    # remove output_metadata_file if it already exists
    remove_file(output_metadata_file)

    #
    # Simulate some custom metadata that the script | notebook produced
    #
    custom_metadata = {
        "some_property": "some property value",
        "outputs": [{"source": "gs://project/bucket/file.md", "type": "markdown"}],
    }

    with tmpdir.as_cwd():
        with open(input_metadata_file, "w") as f:
            json.dump(custom_metadata, f)
    # override the default output directory to make this test platform
    # independent
    monkeypatch.setenv("ELYRA_WRITABLE_CONTAINER_DIR", str(tmpdir))
    main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict)

    # output_metadata_file should now exist

    try:
        with open(output_metadata_file, "r") as f:
            metadata = json.load(f)
            assert metadata.get("some_property") is not None
            assert metadata["some_property"] == custom_metadata["some_property"]
            assert metadata.get("outputs") is not None
            assert isinstance(metadata["outputs"], list)
            assert len(metadata["outputs"]) == 2
            for output in metadata["outputs"]:
                if output.get("storage") is not None:
                    assert output["storage"] == "inline"
                    assert output["type"] == "markdown"
                    assert (
                        f"{argument_dict['cos-endpoint']}/{argument_dict['cos-bucket']}/{argument_dict['cos-directory']}"  # noqa
                        in output["source"]
                    )
                    assert argument_dict["cos-dependencies-archive"] in output["source"]
                else:
                    assert output["type"] == custom_metadata["outputs"][0]["type"]
                    assert output["source"] == custom_metadata["outputs"][0]["source"]
    except AssertionError:
        raise
    except Exception as ex:
        # Potential reasons for failures:
        # file not found, invalid JSON
        print(f'Validation of "{str(ex)}" failed: {ex}')
        assert False


def test_process_metrics_method_invalid_metadata_file(monkeypatch, s3_setup, tmpdir):
    """Test for process_metrics_and_metadata

    Verifies that the method produces a valid KFP UI metadata file if
    the node's script | notebook generated an invalid metadata file.
    """
    argument_dict = {
        "cos-endpoint": f"http://{MINIO_HOST_PORT}",
        "cos-bucket": "test-bucket",
        "cos-directory": "test-directory",
        "cos-dependencies-archive": "test-archive.tgz",
        "filepath": os.path.join(RESOURCES_DIR, "test-notebookA.ipynb"),
        "inputs": "test-file.txt;test,file.txt",
        "outputs": "test-file/test-file-copy.txt;test-file/test,file/test,file-copy.txt",
        "user-volume-path": None,
    }

    output_path = Path(tmpdir)
    # metadata file name and location
    input_metadata_file = "mlpipeline-ui-metadata.json"
    output_metadata_file = output_path / input_metadata_file
    # remove output_metadata_file if it already exists
    remove_file(output_metadata_file)

    #
    # Populate the metadata file with some custom data that's not JSON
    #

    with tmpdir.as_cwd():
        with open(input_metadata_file, "w") as f:
            f.write("I am not a valid JSON data structure")
            f.write("1,2,3,4,5,6,7")

    # override the default output directory to make this test platform
    # independent
    monkeypatch.setenv("ELYRA_WRITABLE_CONTAINER_DIR", str(tmpdir))
    main_method_setup_execution(monkeypatch, s3_setup, tmpdir, argument_dict)

    # process_metrics replaces the existing metadata file
    # because its content cannot be merged

    try:
        with open(output_metadata_file, "r") as f:
            metadata = json.load(f)
            assert metadata.get("outputs") is not None
            assert isinstance(metadata["outputs"], list)
            assert len(metadata["outputs"]) == 1
            assert metadata["outputs"][0]["storage"] == "inline"
            assert metadata["outputs"][0]["type"] == "markdown"
            assert (
                f"{argument_dict['cos-endpoint']}/{argument_dict['cos-bucket']}/{argument_dict['cos-directory']}"
                in metadata["outputs"][0]["source"]
            )
            assert argument_dict["cos-dependencies-archive"] in metadata["outputs"][0]["source"]
    except AssertionError:
        raise
    except Exception as ex:
        # Potential reasons for failures:
        # file not found, invalid JSON
        print(f'Validation of "{str(ex)}" failed: {ex}')
        assert False


def test_fail_bad_notebook_main_method(monkeypatch, s3_setup, tmpdir):
    argument_dict = {
        "cos-endpoint": f"http://{MINIO_HOST_PORT}",
        "cos-bucket": "test-bucket",
        "cos-directory": "test-directory",
        "cos-dependencies-archive": "test-bad-archiveB.tgz",
        "filepath": os.path.join(RESOURCES_DIR, "test-bad-notebookB.ipynb"),
        "inputs": "test-file.txt",
        "outputs": "test-file/test-copy-file.txt",
        "user-volume-path": None,
    }

    monkeypatch.setattr(bootstrapper.OpUtil, "parse_arguments", lambda x: argument_dict)
    monkeypatch.setattr(bootstrapper.OpUtil, "package_install", mock.Mock(return_value=True))

    mocked_func = mock.Mock(
        return_value="default",
        side_effect=[
            "test-bad-archiveB.tgz",
            "test-file.txt",
            "test-bad-notebookB-output.ipynb",
            "test-bad-notebookB.html",
            "test-file.txt",
        ],
    )
    monkeypatch.setattr(bootstrapper.FileOpBase, "get_object_storage_filename", mocked_func)

    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "minioadmin")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "minioadmin")

    s3_setup.fput_object(
        bucket_name=argument_dict["cos-bucket"],
        object_name="test-file.txt",
        file_path=os.path.join(ELYRA_ROOT_DIR, "README.md"),
    )
    s3_setup.fput_object(
        bucket_name=argument_dict["cos-bucket"],
        object_name="test-bad-archiveB.tgz",
        file_path=os.path.join(RESOURCES_DIR, "test-bad-archiveB.tgz"),
    )

    with tmpdir.as_cwd():
        with pytest.raises(papermill.exceptions.PapermillExecutionError):
            bootstrapper.main()


def test_package_installation(monkeypatch, virtualenv):
    elyra_packages = {
        "ipykernel": "5.3.0",
        "ansiwrap": "0.8.4",
        "packaging": "20.0",
    }
    current_packages = {
        "bleach": "3.1.5",
        "ansiwrap": "0.7.0",
        "packaging": "20.4",
    }
    expected_packages = {
        "ipykernel": "5.3.0",
        "ansiwrap": "0.8.4",
        "packaging": "20.4",
    }

    mocked_func = mock.Mock(side_effect=[elyra_packages, current_packages])

    monkeypatch.setattr(bootstrapper.OpUtil, "package_list_to_dict", mocked_func)
    monkeypatch.setattr(sys, "executable", virtualenv.python)

    virtualenv.run("python3 -m pip install bleach==3.1.5")
    virtualenv.run("python3 -m pip install ansiwrap==0.7.0")
    virtualenv.run("python3 -m pip install packaging==20.4")

    bootstrapper.OpUtil.package_install(user_volume_path=None)
    virtualenv_packages = {}
    output = virtualenv.run("python3 -m pip freeze", capture=True)
    print("This is the [pip freeze] output :\n" + output)
    for line in output.strip().split("\n"):
        if " @ " in line:
            package_name, package_version = line.strip("\n").split(sep=" @ ")
        elif "===" in line:
            package_name, package_version = line.strip("\n").split(sep="===")
        else:
            package_name, package_version = line.strip("\n").split(sep="==")
        virtualenv_packages[package_name] = package_version

    for package, version in expected_packages.items():
        assert virtualenv_packages[package] == version


@pytest.mark.skip(reason="Temporarily disabling see elyra#3072")
def test_package_installation_with_target_path(monkeypatch, virtualenv, tmpdir):
    # TODO : Need to add test for direct-source e.g. ' @ '
    elyra_packages = {
        "ipykernel": "5.3.0",
        "ansiwrap": "0.8.4",
        "packaging": "22.0",
    }
    current_packages = {
        "bleach": "3.1.5",
        "ansiwrap": "0.7.0",
        "packaging": "21.0",
    }
    expected_packages = {
        "ipykernel": "5.3.0",
        "ansiwrap": "0.8.4",
        "packaging": "22.0",
    }

    mocked_func = mock.Mock(side_effect=[elyra_packages, current_packages])

    monkeypatch.setattr(bootstrapper.OpUtil, "package_list_to_dict", mocked_func)
    monkeypatch.setattr(sys, "executable", virtualenv.python)

    virtualenv.run("python3 -m pip install --upgrade pip")
    for package, version in current_packages.items():
        virtualenv.run(f"python3 -m pip install --target={tmpdir} {package}=={version}")

    bootstrapper.OpUtil.package_install(user_volume_path=str(tmpdir))
    virtualenv_packages = {}
    output = virtualenv.run(f"python3 -m pip freeze --path={tmpdir}", capture=True)
    print("This is the [pip freeze] output :\n" + output)
    for line in output.strip().split("\n"):
        if " @ " in line:
            package_name, package_version = line.strip("\n").split(sep=" @ ")
        elif "===" in line:
            package_name, package_version = line.strip("\n").split(sep="===")
        else:
            package_name, package_version = line.strip("\n").split(sep="==")
        virtualenv_packages[package_name] = package_version

    for package, version in expected_packages.items():
        assert (
            virtualenv_packages[package].split(".")[0] == version.split(".")[0]
        ), f"Major version mismatch for package {package}"


def test_convert_notebook_to_html(tmpdir):
    notebook_file = os.path.join(RESOURCES_DIR, "test-notebookA.ipynb")
    notebook_output_html_file = "test-notebookA.html"

    with tmpdir.as_cwd():
        bootstrapper.NotebookFileOp.convert_notebook_to_html(notebook_file, notebook_output_html_file)

        assert os.path.isfile(notebook_output_html_file)
        # Validate that an html file got generated from the notebook
        with open(notebook_output_html_file, "r") as html_file:
            html_data = html_file.read()
            assert html_data.startswith("<!DOCTYPE html>")
            assert "TEST_ENV_VAR1" in html_data  # from os.getenv("TEST_ENV_VAR1")
            assert html_data.endswith("</html>\n")


def test_fail_convert_notebook_to_html(tmpdir):
    notebook_file = os.path.join(RESOURCES_DIR, "test-bad-notebookA.ipynb")
    notebook_output_html_file = "bad-notebookA.html"
    with tmpdir.as_cwd():
        # Recent versions raising typeError due to #1130
        # https://github.com/jupyter/nbconvert/pull/1130
        with pytest.raises((TypeError, nbformat.validator.NotebookValidationError)):
            bootstrapper.NotebookFileOp.convert_notebook_to_html(notebook_file, notebook_output_html_file)


def test_get_file_object_store(monkeypatch, s3_setup, tmpdir):
    file_to_get = "README.md"
    bucket_name = "test-bucket"

    s3_setup.fput_object(
        bucket_name=bucket_name, object_name=file_to_get, file_path=os.path.join(ELYRA_ROOT_DIR, file_to_get)
    )

    with tmpdir.as_cwd():
        op = _get_operation_instance(monkeypatch, s3_setup)

        op.get_file_from_object_storage(file_to_get)
        assert os.path.isfile(file_to_get)
        assert _fileChecksum(file_to_get) == _fileChecksum(os.path.join(ELYRA_ROOT_DIR, file_to_get))


def test_fail_get_file_object_store(monkeypatch, s3_setup, tmpdir):
    file_to_get = "test-file.txt"

    with tmpdir.as_cwd():
        with pytest.raises(minio.error.S3Error) as exc_info:
            op = _get_operation_instance(monkeypatch, s3_setup)
            op.get_file_from_object_storage(file_to_get=file_to_get)
        assert exc_info.value.code == "NoSuchKey"


def test_put_file_object_store(monkeypatch, s3_setup, tmpdir):
    bucket_name = "test-bucket"
    file_to_put = "LICENSE"

    op = _get_operation_instance(monkeypatch, s3_setup)
    op.put_file_to_object_storage(object_name=file_to_put, file_to_upload=os.path.join(ELYRA_ROOT_DIR, file_to_put))

    with tmpdir.as_cwd():
        s3_setup.fget_object(bucket_name, file_to_put, file_to_put)
        assert os.path.isfile(file_to_put)
        assert _fileChecksum(file_to_put) == _fileChecksum(os.path.join(ELYRA_ROOT_DIR, file_to_put))


def test_fail_invalid_filename_put_file_object_store(monkeypatch, s3_setup):
    file_to_put = "LICENSE_NOT_HERE"

    with pytest.raises(FileNotFoundError):
        op = _get_operation_instance(monkeypatch, s3_setup)
        op.put_file_to_object_storage(file_to_upload=file_to_put)


def test_fail_bucket_put_file_object_store(monkeypatch, s3_setup):
    bucket_name = "test-bucket-not-exist"
    file_to_put = "LICENSE"

    with pytest.raises(minio.error.S3Error) as exc_info:
        op = _get_operation_instance(monkeypatch, s3_setup)
        monkeypatch.setattr(op, "cos_bucket", bucket_name)
        op.put_file_to_object_storage(file_to_upload=os.path.join(ELYRA_ROOT_DIR, file_to_put))
    assert exc_info.value.code == "NoSuchBucket"


def test_find_best_kernel_nb(tmpdir):
    source_nb_file = os.path.join(RESOURCES_DIR, "test-notebookA.ipynb")
    nb_file = os.path.join(tmpdir, "test-notebookA.ipynb")

    # "Copy" nb file to destination - this test does not update the kernel or language.
    nb = nbformat.read(source_nb_file, 4)
    nbformat.write(nb, nb_file)

    with tmpdir.as_cwd():
        kernel_name = bootstrapper.NotebookFileOp.find_best_kernel(nb_file)
        assert kernel_name == nb.metadata.kernelspec["name"]


def test_find_best_kernel_lang(tmpdir, caplog):
    caplog.set_level(logging.INFO)
    source_nb_file = os.path.join(RESOURCES_DIR, "test-notebookA.ipynb")
    nb_file = os.path.join(tmpdir, "test-notebookA.ipynb")

    # "Copy" nb file to destination after updating the kernel name - forcing a language match
    nb = nbformat.read(source_nb_file, 4)
    nb.metadata.kernelspec["name"] = "test-kernel"
    nb.metadata.kernelspec["language"] = "PYTHON"  # test case-insensitivity
    nbformat.write(nb, nb_file)

    with tmpdir.as_cwd():
        kernel_name = bootstrapper.NotebookFileOp.find_best_kernel(nb_file)
        assert kernel_name == "python3"
        assert len(caplog.records) == 1
        assert caplog.records[0].message.startswith("Matched kernel by language (PYTHON)")


def test_find_best_kernel_nomatch(tmpdir, caplog):
    source_nb_file = os.path.join(RESOURCES_DIR, "test-notebookA.ipynb")
    nb_file = os.path.join(tmpdir, "test-notebookA.ipynb")

    # "Copy" nb file to destination after updating the kernel name and language - forcing use of updated name
    nb = nbformat.read(source_nb_file, 4)
    nb.metadata.kernelspec["name"] = "test-kernel"
    nb.metadata.kernelspec["language"] = "test-language"
    nbformat.write(nb, nb_file)

    with tmpdir.as_cwd():
        kernel_name = bootstrapper.NotebookFileOp.find_best_kernel(nb_file)
        assert kernel_name == "test-kernel"
        assert len(caplog.records) == 1
        assert caplog.records[0].message.startswith("Reverting back to missing notebook kernel 'test-kernel'")


def test_parse_arguments():
    test_args = [
        "-e",
        "http://test.me.now",
        "-d",
        "test-directory",
        "-t",
        "test-archive.tgz",
        "-f",
        "test-notebook.ipynb",
        "-b",
        "test-bucket",
        "-p",
        "/tmp/lib",
        "-n",
        "test-pipeline",
    ]
    args_dict = bootstrapper.OpUtil.parse_arguments(test_args)

    assert args_dict["cos-endpoint"] == "http://test.me.now"
    assert args_dict["cos-directory"] == "test-directory"
    assert args_dict["cos-dependencies-archive"] == "test-archive.tgz"
    assert args_dict["cos-bucket"] == "test-bucket"
    assert args_dict["filepath"] == "test-notebook.ipynb"
    assert args_dict["user-volume-path"] == "/tmp/lib"
    assert args_dict["pipeline-name"] == "test-pipeline"
    assert not args_dict["inputs"]
    assert not args_dict["outputs"]


def test_fail_missing_notebook_parse_arguments():
    test_args = ["-e", "http://test.me.now", "-d", "test-directory", "-t", "test-archive.tgz", "-b", "test-bucket"]
    with pytest.raises(SystemExit):
        bootstrapper.OpUtil.parse_arguments(test_args)


def test_fail_missing_endpoint_parse_arguments():
    test_args = ["-d", "test-directory", "-t", "test-archive.tgz", "-f", "test-notebook.ipynb", "-b", "test-bucket"]
    with pytest.raises(SystemExit):
        bootstrapper.OpUtil.parse_arguments(test_args)


def test_fail_missing_archive_parse_arguments():
    test_args = ["-e", "http://test.me.now", "-d", "test-directory", "-f", "test-notebook.ipynb", "-b", "test-bucket"]
    with pytest.raises(SystemExit):
        bootstrapper.OpUtil.parse_arguments(test_args)


def test_fail_missing_bucket_parse_arguments():
    test_args = [
        "-e",
        "http://test.me.now",
        "-d",
        "test-directory",
        "-t",
        "test-archive.tgz",
        "-f",
        "test-notebook.ipynb",
    ]
    with pytest.raises(SystemExit):
        bootstrapper.OpUtil.parse_arguments(test_args)


def test_fail_missing_directory_parse_arguments():
    test_args = ["-e", "http://test.me.now", "-t", "test-archive.tgz", "-f", "test-notebook.ipynb", "-b", "test-bucket"]
    with pytest.raises(SystemExit):
        bootstrapper.OpUtil.parse_arguments(test_args)


def test_requirements_file(monkeypatch, tmpdir, caplog):
    elyra_requirements_file = Path(__file__).parent / "resources/test-requirements-elyra.txt"
    elyra_correct_number_of_packages = 18
    elyra_packages = bootstrapper.OpUtil.package_list_to_dict(str(elyra_requirements_file))
    assert len(elyra_packages) == elyra_correct_number_of_packages

    current_requirements_file = Path(__file__).parent / "resources/test-requirements-current.txt"
    current_correct_number_of_packages = 15
    current_packages = bootstrapper.OpUtil.package_list_to_dict(str(current_requirements_file))
    assert len(current_packages) == current_correct_number_of_packages

    mocked_package_list_to_dict = mock.Mock(side_effect=[elyra_packages, current_packages])
    monkeypatch.setattr(bootstrapper.OpUtil, "package_list_to_dict", mocked_package_list_to_dict)

    mocked_subprocess_run = mock.Mock(return_value="default")
    monkeypatch.setattr(subprocess, "run", mocked_subprocess_run)

    bootstrapper.OpUtil.package_install(user_volume_path=str(tmpdir))
    assert "WARNING: Source package 'jupyter-client' found already installed as an editable package" in caplog.text
    assert "WARNING: Source package 'requests' found already installed as an editable package" in caplog.text
    assert "WARNING: Source package 'tornado' found already installed from git" in caplog.text


def test_fail_requirements_file_bad_delimiter():
    bad_requirements_file = Path(__file__).parent / "resources/test-bad-requirements-elyra.txt"
    with open(bad_requirements_file, "r") as f:
        file_content = f.readlines()
    valid_package_list = [
        line.strip("\n").split("==")[0] for line in file_content if not line.startswith("#") and "==" in line
    ]

    package_dict = bootstrapper.OpUtil.package_list_to_dict(bad_requirements_file)
    assert valid_package_list == list(package_dict.keys())


def _fileChecksum(filename):
    hasher = hashlib.sha256()

    with open(filename, "rb") as afile:
        buf = afile.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = afile.read(65536)
    checksum = hasher.hexdigest()
    return checksum
