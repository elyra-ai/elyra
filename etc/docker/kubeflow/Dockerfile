# syntax=docker/dockerfile:experimental
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

# Ubuntu 22.04 LTS (Jammy Jellyfish)
# Repository: https://github.com/kubeflow/kubeflow/tree/master/components/example-notebook-servers
FROM ghcr.io/kubeflow/kubeflow/notebook-servers/jupyter:v1.8.0

ARG TAG="dev"
ARG ELYRA_VERSION
ARG ELYRA_PACKAGE=elyra-"$ELYRA_VERSION"-py3-none-any.whl

# - Include with KFP support and component examples ('kfp-examples')
ARG ELYRA_EXTRAS=[kfp,kfp-examples,airflow-gitlab]

# Includes the readme as a token file for COPY that always exists, otherwise production builds fail when whl not present
COPY README.md ${ELYRA_PACKAGE}* ./

USER root
RUN chown jovyan:users ./"${ELYRA_PACKAGE}"
USER jovyan

# Update pip
RUN python3 -m pip install --no-cache-dir --upgrade pip

# Install Elyra
RUN python3 -m pip install --quiet --no-cache-dir "$ELYRA_PACKAGE""$ELYRA_EXTRAS"

# Configure Elyra in the conda environment rather than in $HOME. Kubeflow mounts
# the workspace volume on the home directory and seeds a new volume only from
# /tmp_home, so files written to $HOME here never reach the notebook server.
# Users can still override this configuration in ~/.jupyter.
#  - enable only the Kubeflow Pipelines runtime
RUN config_dir="$(python3 -c 'import jupyter_core.paths as p; print(p.ENV_CONFIG_PATH[0])')" && \
    mkdir -p "$config_dir" && \
    echo "c.PipelineProcessorRegistry.runtimes = ['kfp']" > "$config_dir/jupyter_elyra_config.py"

# Cleanup
USER root
RUN rm -f README.md ${ELYRA_PACKAGE}
USER jovyan

# Install the component examples catalog as a factory instance, next to Elyra's
# runtime images. ELYRA_METADATA_PATH makes elyra-metadata write it there, and
# its permissions are opened up to match runtime-images (Elyra writes it for
# the owner only).
#  - this will fail if the 'kfp-examples' pip extra is not installed
RUN data_dir="$(python3 -c 'import jupyter_core.paths as p; print(p.ENV_JUPYTER_PATH[0])')" && \
    ELYRA_METADATA_PATH="$data_dir" elyra-metadata create component-catalogs \
        --schema_name=elyra-kfp-examples-catalog \
        --display_name="Kubeflow Pipelines examples" \
        --runtime_type=KUBEFLOW_PIPELINES \
        --categories="['examples']" && \
    chmod -R a+rX "$data_dir/metadata/component-catalogs"
