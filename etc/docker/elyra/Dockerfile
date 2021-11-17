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

# Ubuntu 18.04 LTS - Bionic
# Repository: https://hub.docker.com/r/jupyterhub/k8s-singleuser-sample/tags
FROM jupyterhub/k8s-singleuser-sample:1.2.0

ARG TAG="dev"

USER root

ADD start-elyra.sh /usr/local/bin/start-elyra.sh

RUN chmod ugo+x /usr/local/bin/start-elyra.sh

USER $NB_USER

RUN python -m pip install --upgrade pandas numpy && \
    python3 -m pip install --quiet --no-cache-dir --use-deprecated=legacy-resolver elyra[all]=="$TAG" && \
    jupyter lab build

# Comment out to hide the component examples for Kubeflow Pipelines and Apache Airflow
RUN elyra-metadata install component-catalogs --schema_name=elyra-airflow-examples-catalog --display_name="Apache Airflow examples" --runtime_type=APACHE_AIRFLOW --categories="['examples']" && \
    elyra-metadata install component-catalogs --schema_name=elyra-kfp-examples-catalog --display_name="Kubeflow Pipelines examples" --runtime_type=KUBEFLOW_PIPELINES --categories="['examples']"

CMD ["/usr/local/bin/start-elyra.sh"]
