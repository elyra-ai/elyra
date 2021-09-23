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
FROM jupyterhub/k8s-singleuser-sample:0.10.6

USER root

ADD start-elyra.sh /usr/local/bin/start-elyra.sh
COPY elyra-*.whl ./

RUN chmod ugo+x /usr/local/bin/start-elyra.sh

USER $NB_USER

RUN conda remove --force -y terminado && \
    python -m pip install --upgrade pip && \
    python -m pip install --ignore-installed --upgrade setuptools pandas && \
    npm config set scripts-prepend-node-path auto && \
    npm config get prefix /home/jovyan/.npm-global && \
    mkdir -p /home/jovyan/.npm-global && \
    npm install -g yarn && \
    npm install -g npm

RUN python3 -m pip install --quiet --no-cache-dir --use-deprecated=legacy-resolver elyra-*.whl && jupyter lab build

CMD ["/usr/local/bin/start-elyra.sh"]

