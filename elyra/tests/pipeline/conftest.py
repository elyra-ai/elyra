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
import os
import shutil

import pytest


@pytest.fixture
def setup_factory_data(jp_environ, jp_env_jupyter_path):
    """Copies the factory metadata instances for runtime-images and compontent-registries to test hierarchy."""
    source = os.path.join(os.path.dirname(__file__), "..", "..", "..", "etc/config/metadata")
    destination = os.path.join(jp_env_jupyter_path, "metadata")
    shutil.copytree(source, destination)
    yield destination  # this return value probably won't be used, but here nonetheless


# Set Elyra server extension as enabled (overriding server_config fixture from jupyter_server)
@pytest.fixture
def jp_server_config(setup_factory_data):
    return {"ServerApp": {"jpserver_extensions": {"elyra": True}}}
