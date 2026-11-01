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

import minio
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


def test_parse_arguments_with_cos_region():
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
        "-n",
        "test-pipeline",
        "--cos-region",
        "us-east-1",
    ]
    args_dict = bootstrapper.OpUtil.parse_arguments(test_args)

    assert args_dict["cos-region"] == "us-east-1"
    assert not bootstrapper.OpUtil.parse_arguments(test_args[:-2])["cos-region"]


@pytest.mark.parametrize("cos_region", [None, "us-east-1"])
def test_cos_client_region(monkeypatch, cos_region):
    """Verify that the object storage client uses the specified region, if any"""
    minio_client = mock.Mock()
    monkeypatch.setattr(minio, "Minio", minio_client)

    bootstrapper.NotebookFileOp(
        **{
            "filepath": "test-notebook.ipynb",
            "cos-endpoint": "http://test.me.now",
            "cos-bucket": "test-bucket",
            "cos-user": "test-user",
            "cos-password": "test-password",
            "cos-region": cos_region,
        }
    )

    minio_client.assert_called_once()
    assert minio_client.call_args.kwargs["region"] == cos_region
