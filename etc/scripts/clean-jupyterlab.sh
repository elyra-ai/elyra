#!/bin/bash
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

ANACONDA_HOME=${ANACONDA_HOME:='~/opt/anaconda'}
JUPYTERLAB_HOME=${JUPYTERLAB_HOME:='~/opensource/jupyterlab/jupyterlab'}

LAB_VERSION="1.2.13"

if [ "$1" = "--version" ]
then
    LAB_VERSION="$2"
fi
LAB_VERSION="==$LAB_VERSION"

echo "Anaconda..........: $ANACONDA_HOME"
echo "Anaconda env......: $CONDA_DEFAULT_ENV"
echo "JupyterLab........: $JUPYTERLAB_HOME"
echo "JupyterLab Version: $LAB_VERSION"
echo " "

set -e
pip uninstall -y elyra || true;
pip uninstall -y jupyterlab-git || true;
pip uninstall -y jupyterlab-server || true;
pip uninstall -y jupyterlab || true;
pip uninstall -y nbdime || true;

# Clean jupyterlab environment / workspace
echo "Cleaning jupyter and jupyterlab environment / workspace"
rm -rf ~/.jupyter
rm -rf $ANACONDA_HOME/etc/jupyter
rm -rf $ANACONDA_HOME/share/jupyter
rm -rf $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/etc/jupyter
rm -rf $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/share/jupyter

pip install --upgrade notebook
pip install --upgrade "jupyterlab$LAB_VERSION"

if [ ${LAB_VERSION:2:1} == "1" ]
then
  echo ">>> Installing nbdime 1.1.0"
  pip install --upgrade nbdime==1.1.0
  pip install --upgrade jupyterlab-git==0.10.1
fi

if [ ${LAB_VERSION:2:1} == "2" ]
then
echo ">>> Installing nbdime 2.0.0"
  pip install --upgrade nbdime==2.0.0
  pip install --upgrade jupyterlab-git==0.20.0rc0
fi

jupyter --version

jupyter serverextension list
jupyter labextension list
