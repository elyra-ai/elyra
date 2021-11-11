# syntax=docker/dockerfile:experimental
#
# Copyright 2018-2021 Elyra Authors
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

# Ubuntu 20.04.2 LTS (Focal Fossa)
# Repository: https://gallery.ecr.aws/j1r0q0g6/notebooks/notebook-servers/jupyter
FROM public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/jupyter:v1.4

# install - elyra
RUN python3 -m pip install --quiet --no-cache-dir --use-deprecated legacy-resolver \
    elyra[all]==3.2.1

# build jupyter plugins
RUN jupyter lab build

# Enable Kubeflow Pipelines examples catalog
# Comment out the line below to hide the examples
# TODO https://github.com/elyra-ai/elyra/pull/2282: "component-registries" -> "component-catalogs"
RUN elyra-metadata install component-registries --schema_name=elyra-kfp-examples-catalog --display_name="KFP examples" --runtime_type=KUBEFLOW_PIPELINES --categories="['examples']"

# install - requirements.txt
COPY --chown=jovyan:users requirements.txt /tmp/requirements.txt
RUN python3 -m pip install -r /tmp/requirements.txt --quiet --no-cache-dir --use-deprecated=legacy-resolver \
 && rm -f /tmp/requirements.txt
