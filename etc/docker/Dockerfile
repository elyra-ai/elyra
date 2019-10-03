# syntax=docker/dockerfile:experimental
#
# Copyright 2018-2019 IBM Corporation
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
FROM jupyterhub/k8s-singleuser-sample:0.8.2

# pip packages
RUN pip install --upgrade pip
RUN pip install setuptools --ignore-installed --upgrade

ENV NBGITPULLER_APP=lab

# Install Lab and NB2KG. Enable NB2KG extension. Lab is enabled by default
RUN pip install --upgrade jupyterlab notebook && \
    jupyter serverextension enable --py jupyterlab --sys-prefix

USER root

COPY *.whl /etc/ai-workspace/
COPY metadata-runtime-template.json /home/jovyan/.local/share/jupyter/metadata/runtime/

RUN chown -R jovyan: /home/jovyan/.local/share/jupyter
RUN mkdir -p /opt/work && chmod 777 /opt/work

RUN --mount=type=secret,id=pipsecret,dst=/home/jovyan/.pip/pip.conf pip install /etc/ai-workspace/*.whl

RUN pip install --upgrade jupyterlab-git && \
    jupyter serverextension enable --py jupyterlab_git && \
    jupyter labextension install @jupyterlab/git --no-build --debug

RUN --mount=type=secret,id=npmsecret,dst=/home/jovyan/.npmrc jupyter lab build --debug

RUN jupyter labextension list && jupyter serverextension list

USER jovyan
ENTRYPOINT ["/bin/bash", "-c", "cd /opt/work && jupyter lab --debug --no-browser"]