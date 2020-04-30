# syntax=docker/dockerfile:experimental
#
# Copyright 2018-2020 IBM Corporation
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
FROM jupyterhub/k8s-singleuser-sample:0.9.0

USER jovyan
# pip packages
RUN pip install --upgrade pip
RUN pip install setuptools --ignore-installed --upgrade

COPY *.whl /tmp/elyra/
RUN pip install /tmp/elyra/*.whl

RUN jupyter lab build --debug

RUN jupyter labextension list && jupyter serverextension list

RUN fix-permissions $CONDA_DIR && \
    fix-permissions /home/jovyan

USER root
RUN fix-permissions /etc/jupyter/

USER jovyan

