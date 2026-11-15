#!/bin/bash
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

export NB_IP=${NB_IP:-0.0.0.0}
export NB_PORT=${NB_PORT:-8888}
export KERNEL_USERNAME=${KERNEL_USERNAME:-${NB_USER}}

echo "Kernel user: " ${KERNEL_USERNAME}
echo "JupyterLab ip:" ${NB_IP}
echo "JupyterLab port: " ${NB_PORT}
echo "Gateway URL: " ${JUPYTER_GATEWAY_URL}

echo "${@: -1}"

# The base image (jupyterhub/k8s-singleuser-sample) doesn't include the
# docker-stacks start-notebook.sh, so start the server directly. A JupyterHub
# spawner that uses the image's default command sets JUPYTERHUB_API_TOKEN;
# start the single-user server then, which gets its address from the Hub.
if [[ -n "${JUPYTERHUB_API_TOKEN:-}" ]]; then
    exec jupyterhub-singleuser "$@"
fi
exec jupyter lab --no-browser --ip="${NB_IP}" --port="${NB_PORT}" "$@"
