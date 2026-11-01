#
# Copyright 2018-2026 Elyra Authors
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

from collections import namedtuple
import logging
import os
from types import SimpleNamespace
from unittest import mock

import nbformat
import pytest

from elyra.airflow import bootstrapper

RESOURCES_DIR = os.path.join(os.path.dirname(__file__), "resources")

# Same fields as sys.version_info, so attribute and index access both work.
VersionInfo = namedtuple("VersionInfo", ["major", "minor", "micro", "releaselevel", "serial"])


def use_python(monkeypatch, major: int, minor: int) -> None:
    """Make the bootstrapper see a runtime image running Python ``major.minor``."""
    fake_sys = SimpleNamespace(version_info=VersionInfo(major, minor, 0, "final", 0), executable="python3")
    monkeypatch.setattr(bootstrapper, "sys", fake_sys)


@pytest.mark.parametrize("minor", [11, 12, 13])
def test_supported_python_uses_elyra_requirements(monkeypatch, minor):
    use_python(monkeypatch, 3, minor)
    assert bootstrapper.OpUtil.determine_elyra_requirements() == "requirements-elyra.txt"


@pytest.mark.parametrize("major, minor", [(3, 10), (3, 14), (2, 7)])
def test_unsupported_python_fails_naming_the_version(monkeypatch, major, minor):
    use_python(monkeypatch, major, minor)
    with pytest.raises(RuntimeError, match=rf"Python {major}\.{minor}\b"):
        bootstrapper.OpUtil.determine_elyra_requirements()


def test_package_install_stops_before_pip_on_unsupported_python(monkeypatch):
    use_python(monkeypatch, 3, 10)
    pip_run = mock.Mock()
    monkeypatch.setattr(bootstrapper.subprocess, "run", pip_run)

    with pytest.raises(RuntimeError, match=r"Python 3\.10\b"):
        bootstrapper.OpUtil.package_install()
    pip_run.assert_not_called()


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


class FakeObjectStorageClient:
    """Minimal in-memory stand-in for the minio client used by FileOpBase"""

    def __init__(self, objects):
        self.objects = objects  # object name -> content

    def list_objects(self, bucket_name, prefix="", recursive=False):
        return [SimpleNamespace(object_name=name) for name in sorted(self.objects) if name.startswith(prefix)]

    def fget_object(self, bucket_name, object_name, file_path):
        from minio.error import S3Error

        if object_name not in self.objects:
            raise S3Error(
                response=None,
                code="NoSuchKey",
                message="The specified key does not exist.",
                resource=object_name,
                request_id=None,
                host_id=None,
            )
        os.makedirs(os.path.dirname(file_path) or ".", exist_ok=True)
        with open(file_path, "w") as fh:
            fh.write(self.objects[object_name])


def get_operation_with_objects(objects):
    op = bootstrapper.FileOpBase.get_instance(
        **{
            "cos-endpoint": "http://localhost:9000",
            "cos-user": "user",
            "cos-password": "password",
            "cos-bucket": "test-bucket",
            "cos-directory": "test-directory",
            "filepath": "untitled.ipynb",
        }
    )
    op.cos_client = FakeObjectStorageClient({f"test-directory/{name}": name for name in objects})
    return op


def list_files(directory):
    return {
        os.path.relpath(os.path.join(root, file), directory) for root, _, files in os.walk(directory) for file in files
    }


@pytest.mark.parametrize(
    "input_file, expected_files",
    [
        ("data/a.csv", {"data/a.csv"}),
        ("data", {"data/a.csv", "data/.hidden.csv", "data/sub/b.csv"}),
        ("data/", {"data/a.csv", "data/.hidden.csv", "data/sub/b.csv"}),
        ("data/*", {"data/a.csv", "data/sub/b.csv"}),
        ("data/*.csv", {"data/a.csv"}),
        ("*.csv", {"results.csv"}),
        ("*.parquet", set()),
    ],
)
def test_process_input_file(tmpdir, input_file, expected_files):
    op = get_operation_with_objects(
        ["results.csv", "data/a.csv", "data/.hidden.csv", "data/sub/b.csv", "data-copy/a.csv"]
    )

    with tmpdir.as_cwd():
        op.process_input_file(input_file)
    assert list_files(tmpdir) == expected_files
    for file in expected_files:
        assert tmpdir.join(file).read() == file


def test_process_input_file_gets_directory_with_existing_files(tmpdir):
    op = get_operation_with_objects(["data/a.csv", "data/sub/b.csv"])

    with tmpdir.as_cwd():
        op.process_input_file("data/a.csv")
        op.process_input_file("data")
    assert list_files(tmpdir) == {"data/a.csv", "data/sub/b.csv"}


def test_fail_process_input_file_not_found(tmpdir):
    from minio.error import S3Error

    op = get_operation_with_objects(["data-copy/a.csv"])

    with tmpdir.as_cwd():
        with pytest.raises(S3Error) as exc_info:
            op.process_input_file("data")
    assert exc_info.value.code == "NoSuchKey"
    assert list_files(tmpdir) == set()
