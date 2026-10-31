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
"""Runtime requirements stay compatible with Jupyter Enterprise Gateway kernel images."""

from pathlib import Path

from packaging.version import Version
import pytest

from elyra.kfp import bootstrapper

REQUIREMENTS_FILE = Path(__file__).parents[3] / "etc" / "generic" / "requirements-elyra.txt"

# Upper bounds that Enterprise Gateway kernel images apply (see etc/docker/kernel-py/Dockerfile in
# jupyter-server/enterprise_gateway). The bootstrapper upgrades image packages to Elyra's pins, so a
# pin at or above a cap would push an incompatible version into those images.
ENTERPRISE_GATEWAY_KERNEL_CAPS = {"ipykernel": "7", "jupyter-client": "9", "pyzmq": "28"}


@pytest.mark.parametrize("package, cap", ENTERPRISE_GATEWAY_KERNEL_CAPS.items())
def test_runtime_pins_stay_below_enterprise_gateway_caps(package, cap):
    pins = bootstrapper.OpUtil.package_list_to_dict(str(REQUIREMENTS_FILE))
    assert Version(pins[package]) < Version(cap)
