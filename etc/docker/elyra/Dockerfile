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

RUN chmod ugo+x /usr/local/bin/start-elyra.sh && \
    apt-get update && apt-get install -y build-essential curl && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn && \
    rm -rf /var/lib/apt/lists/*

USER $NB_USER

RUN conda remove --force -y terminado && \
    python -m pip install --upgrade pip && \
    python -m pip install --ignore-installed --upgrade setuptools pandas && \
    echo "scripts-prepend-node-path=true" >> /home/jovyan/.npmrc && \
    echo "prefix=/home/jovyan/.npm-global" >> /home/jovyan/.npmrc && \
    mkdir -p /home/jovyan/.npm-global && \
    npm install -g yarn && \
    npm install -g npm && \
    cd /tmp && git clone https://github.com/elyra-ai/elyra.git && \
    cd /tmp/elyra && git checkout tags/v2.2.2 -b v2.2.2 && make UPGRADE_STRATEGY=eager install && rm -rf /tmp/elyra

CMD ["/usr/local/bin/start-elyra.sh"]

