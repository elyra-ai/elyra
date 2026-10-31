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
"""Python versions the KFP bootstrapper accepts in runtime images.

These live outside test_bootstrapper.py because that module's autouse fixture
starts an S3 container, which these pure unit tests do not need.
"""

from collections import namedtuple
from types import SimpleNamespace
from unittest import mock

import pytest

from elyra.kfp import bootstrapper

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
        bootstrapper.OpUtil.package_install(user_volume_path=None)
    pip_run.assert_not_called()
