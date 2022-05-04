# syntax=docker/dockerfile:experimental
#
# Copyright 2018-2022 Elyra Authors
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

ARG TAG="dev"
ARG ELYRA_VERSION
ARG ELYRA_PACKAGE=elyra-"$ELYRA_VERSION"-py3-none-any.whl

# - Include with KFP Tekton support ('kfp-tekton') and component examples ('kfp-examples')
ARG ELYRA_EXTRAS=[kfp-tekton,kfp-examples]

# Includes the readme as a token file for COPY that always exists, otherwise production builds fail when whl not present
COPY $ELYRA_PACKAGE README.md ./

# Install Elyra
RUN if [ "$TAG" = "dev" ] ; then \
    python -m pip install --quiet --no-cache-dir "$ELYRA_PACKAGE""$ELYRA_EXTRAS"; \
    else \
    python -m pip install --quiet --no-cache-dir elyra"$ELYRA_EXTRAS"=="$TAG" ; fi

# Cleanup
USER root
RUN rm $ELYRA_PACKAGE README.md
USER jovyan

# Install component examples catalog
#  - this will fail if the 'kfp-examples' pip extra is not installed
RUN elyra-metadata create component-catalogs \
    --schema_name=elyra-kfp-examples-catalog \
    --display_name="Kubeflow Pipelines examples" \
    --runtime_type=KUBEFLOW_PIPELINES \
    --categories="['examples']"
