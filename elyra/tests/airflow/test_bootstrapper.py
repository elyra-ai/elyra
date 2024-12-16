#
# Copyright 2018-2025 Elyra Authors
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

import logging
import os

import nbformat

from elyra.airflow import bootstrapper

RESOURCES_DIR = os.path.join(os.path.dirname(__file__), "resources")


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
