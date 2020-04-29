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

ANACONDA_HOME=${ANACONDA_HOME:='~/anaconda'}

LAB_VERSION=""

if [ "$1" = "--version" ]
then
    LAB_VERSION="==$2"
fi

echo "Anaconda..........: $ANACONDA_HOME"
echo "Anaconda env......: $CONDA_DEFAULT_ENV"
echo " "

set -e
echo "Uninstalling old packages"
pip uninstall -y elyra || true;
pip uninstall -y jupyterlab-git || true;
pip uninstall -y jupyterlab-server || true;
pip uninstall -y jupyterlab || true;
pip uninstall -y nbdime || true;
echo " "

echo "Cleaning jupyter and jupyterlab workspace"
rm -rf ~/.jupyter
rm -rf $ANACONDA_HOME/etc/jupyter
rm -rf $ANACONDA_HOME/share/jupyter
rm -rf $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/etc/jupyter
rm -rf $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/share/jupyter
echo " "

echo "Installing/Updating Notebook and JupyterLab"
pip install --quiet --upgrade notebook
pip install --quiet --upgrade "jupyterlab$LAB_VERSION"
echo " "

if [ ! -z "$LAB_VERSION" ]
then
  if [ ${LAB_VERSION:2:1} == "1" ]
  then
    echo ">>> Installing nbdime and jupyterlab git for lab 1.x"
    pip install --quiet --upgrade nbdime==1.1.0
    pip install --quiet --upgrade jupyterlab-git==0.10.1
    echo " "
  fi
else
  echo ">>> Installing nbdime and jupyterlab git for lab 2.x"
  pip install --quiet --upgrade nbdime
  pip install --quiet --upgrade jupyterlab-git==0.20.0rc0
  echo " "
fi

jupyter --version
echo " "
jupyter serverextension list
echo " "
jupyter labextension list
echo " "
