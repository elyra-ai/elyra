#!/bin/bash
#
# Copyright 2018-2020 Elyra Authors
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
conda uninstall -y xeus-python -c conda-forge || true;
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

echo "Installing/Updating JupyterLab"
pip install --upgrade tornado
pip install --upgrade "jupyterlab$LAB_VERSION"
echo " "

echo "Installing Xeus kernel"
XPYTHON_VERSION="$(python --version 2>&1)"
if [[ "$XPYTHON_VERSION" == *"Python 3.6"* ]]
then
    conda install -y xeus-python">=0.8.0,<0.9.0" -c conda-forge
else
    conda install -y xeus-python">=0.9.3" -c conda-forge
fi
echo " "

jupyter --version
echo " "
jupyter serverextension list
echo " "
jupyter server extension list
echo " "
jupyter labextension list
echo " "
