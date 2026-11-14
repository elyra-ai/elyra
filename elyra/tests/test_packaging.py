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
"""Regression tests for the wheel layout produced by Elyra's packaging configuration.

The JupyterLab extensions must be installed exactly once, through the wheel's
shared-data (``share/jupyter/labextensions``). Shipping the ``labextensions/``
source tree in the wheel as well duplicates every built asset in site-packages
and installs stray stub modules (and, for elyra-server, makes it no longer
server-only).

The tests build small throwaway projects that reuse the real ``pyproject.toml``
and extension template, so they exercise the actual hatch build configuration.
"""

from pathlib import Path
import zipfile

import pytest

wheel_builder = pytest.importorskip("hatchling.builders.wheel")

REPO_ROOT = Path(__file__).resolve().parents[2]
SERVICES_UI_ASSET = "share/jupyter/labextensions/@elyra/services/package.json"
# shared-data mapping in the form create-release.py writes into the extension template
SERVICES_SHARED_DATA = '"labextensions/elyra_services/labextension" = "share/jupyter/labextensions/@elyra/services"'


def _write(path: Path, content: str = "") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def _add_labextension(project: Path, *, with_ui: bool) -> None:
    """Add the services labextension: its stub module and, optionally, a built asset."""
    _write(project / "labextensions" / "elyra_services" / "__init__.py")
    if with_ui:
        _write(project / "labextensions" / "elyra_services" / "labextension" / "package.json", "{}")


def _build_wheel(project: Path, out_dir: Path) -> list[str]:
    """Build a standard wheel for ``project`` with hatchling and return its member names."""
    builder = wheel_builder.WheelBuilder(str(project))
    wheel = next(builder.build(directory=str(out_dir), versions=["standard"]))
    with zipfile.ZipFile(wheel) as archive:
        return archive.namelist()


def _elyra_project(root: Path, *, name: str, with_ui: bool) -> Path:
    """Create a minimal project that uses Elyra's real pyproject.toml.

    For elyra-server, apply the same name rewrite as create-release.py's build_server().
    """
    pyproject = (REPO_ROOT / "pyproject.toml").read_text()
    pyproject = pyproject.replace('name="elyra"', f'name="{name}"')
    _write(root / "pyproject.toml", pyproject)
    _write(root / "README.md", "Elyra")
    _write(root / "elyra" / "__init__.py")
    _write(root / "elyra" / "_version.py", '__version__ = "1.0.0"\n')
    _write(root / "elyra" / "tests" / "__init__.py")
    _add_labextension(root, with_ui=with_ui)
    return root


def _extension_project(root: Path) -> Path:
    """Create an individual extension package the way create-release.py renders the template."""
    pyproject = (REPO_ROOT / "etc" / "templates" / "pyproject.toml").read_text()
    for placeholder, value in {
        "{{package-name}}": "elyra-test-extension",
        "{{version}}": "1.0.0",
        "{{description}}": "Elyra test extension",
        "{{install-requires}}": '"elyra-server==1.0.0"',
        "{{shared-data}}": SERVICES_SHARED_DATA,
    }.items():
        pyproject = pyproject.replace(placeholder, value)
    _write(root / "pyproject.toml", pyproject)
    _add_labextension(root, with_ui=True)
    return root


@pytest.mark.parametrize("name", ["elyra", "elyra-server"])
def test_wheel_ships_python_package_without_labextensions_tree(tmp_path, name):
    files = _build_wheel(_elyra_project(tmp_path / "project", name=name, with_ui=True), tmp_path / "dist")

    assert "elyra/__init__.py" in files
    assert [f for f in files if f.startswith("labextensions/")] == []
    assert [f for f in files if f.startswith("elyra/tests/")] == []


def test_elyra_wheel_installs_ui_through_shared_data(tmp_path):
    files = _build_wheel(_elyra_project(tmp_path / "project", name="elyra", with_ui=True), tmp_path / "dist")

    assert [f for f in files if f.endswith(f".data/data/{SERVICES_UI_ASSET}")] != []


def test_server_wheel_built_before_ui_is_server_only(tmp_path):
    # create-release.py builds elyra-server before the UI exists
    files = _build_wheel(_elyra_project(tmp_path / "project", name="elyra-server", with_ui=False), tmp_path / "dist")

    assert [f for f in files if "labextensions" in f] == []


def test_extension_wheel_installs_ui_only_through_shared_data(tmp_path):
    files = _build_wheel(_extension_project(tmp_path / "extension"), tmp_path / "dist")

    assert [f for f in files if f.endswith(f".data/data/{SERVICES_UI_ASSET}")] != []
    assert [f for f in files if f.startswith("labextensions/")] == []
