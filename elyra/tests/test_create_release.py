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
"""Tests for the release safeguards in create-release.py."""

import importlib.util
from pathlib import Path
import re
from types import SimpleNamespace

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def create_release():
    """Load create-release.py as a module (its file name is not importable)."""
    spec = importlib.util.spec_from_file_location("create_release", REPO_ROOT / "create-release.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _make_labextensions(source_dir: Path, built: dict[str, bool]) -> None:
    """Create labextension packages under source_dir, each with or without its built output."""
    for name, is_built in built.items():
        package = source_dir / "labextensions" / name
        package.mkdir(parents=True)
        (package / "__init__.py").write_text("")
        if is_built:
            (package / "labextension").mkdir()
            (package / "labextension" / "package.json").write_text("{}")


def test_verify_labextensions_built_accepts_built_tree(create_release, tmp_path):
    _make_labextensions(tmp_path, {"elyra_services": True, "elyra_ui_components": True})
    create_release.config = SimpleNamespace(source_dir=str(tmp_path))

    create_release.verify_labextensions_built()


@pytest.mark.parametrize(
    "built, reported",
    [
        ({"elyra_services": True, "elyra_ui_components": False}, "elyra_ui_components"),
        ({"elyra_services": False, "elyra_ui_components": False}, "elyra_services, elyra_ui_components"),
        ({}, "no labextension packages found"),
    ],
)
def test_verify_labextensions_built_rejects_unbuilt_tree(create_release, tmp_path, built, reported):
    _make_labextensions(tmp_path, built)
    create_release.config = SimpleNamespace(source_dir=str(tmp_path))

    with pytest.raises(RuntimeError, match=re.escape(reported)):
        create_release.verify_labextensions_built()
