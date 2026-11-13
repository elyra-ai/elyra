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
"""Validate the Elyra Kubeflow notebook image from inside a running container.

`make validate-kf-notebook-image` starts the image with its own entrypoint, once
as built and once with an empty volume on the home directory (like a new Kubeflow
workspace volume), and pipes this script into it. The checks ask the running
server, through Elyra's REST API, whether the image's customizations are in
effect: only the Kubeflow Pipelines runtime, and the examples component catalog.

Only the standard library is used, so the script runs in any image.
"""

import json
import sys
import time
import urllib.request

SERVER_URL = "http://127.0.0.1:8888"  # the image's server runs without a token
STARTUP_TIMEOUT_SECONDS = 120


def get_json(path: str) -> dict:
    """Return the JSON response of a GET request to the server.

    Raises:
        OSError: if the request fails, including HTTP error responses.
    """
    with urllib.request.urlopen(SERVER_URL + path, timeout=5) as response:
        return json.load(response)


def wait_for_server() -> bool:
    """Return whether the server answers on /api before the startup timeout."""
    deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        try:
            get_json("/api")
            return True
        except OSError:
            time.sleep(1)
    return False


def main(mode: str) -> int:
    """Run the checks, print one PASS/FAIL line each, and return the exit code."""
    print(f"Validating image in '{mode}' mode")
    if not wait_for_server():
        print(f"  FAIL: server answers on {SERVER_URL}/api")
        return 1

    runtime_types = {rt["id"] for rt in get_json("/elyra/pipeline/runtimes/types")["runtime_types"]}
    catalogs = {c["name"] for c in get_json("/elyra/metadata/component-catalogs")["component-catalogs"]}
    checks = [
        ("Kubeflow Pipelines runtime is enabled", "KUBEFLOW_PIPELINES" in runtime_types),
        ("Apache Airflow runtime is disabled", "APACHE_AIRFLOW" not in runtime_types),
        ("examples component catalog is available", "kubeflow_pipelines_examples" in catalogs),
    ]
    failures = 0
    for description, passed in checks:
        print(f"  {'PASS' if passed else 'FAIL'}: {description}")
        failures += not passed

    if failures:
        print(f"{failures} check(s) failed in '{mode}' mode")
        return 1
    print(f"All checks passed in '{mode}' mode")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "built"))
