#!/bin/bash
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
################################################################################
# INSTRUCTIONS:
# This script is intended to help clean your JupyterLab/Elyra environment. It can be very useful when switching back and forth between different JupyterLab versions during the development of Elyra.
# It is recommended to use a virtual environment (eg. conda env).
# It reinstalls JupyterLab after an environment cleanup.
#
# Make sure you have a conda environment setup (https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)
# Export the variable ANACONDA_HOME with your conda installation path to the environment:
# export ANACONDA_HOME='/Users/my_username/my_anaconda_dir/'
#
# WARNING: The following resources will be deleted:
# ~/.jupyter
# $ANACONDA_HOME/etc/jupyter
# $ANACONDA_HOME/share/jupyter
# $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/etc/jupyter
# $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/share/jupyter
#
# To install a specific JupyterLab version, run the script adding the version argument as below:
# etc/scripts/clean-jupyterlab.sh --version 2.2.9
# When no argument is passed to the command, it will install the latest JupyterLab version.
################################################################################

echo "This script removes your JupyterLab installation"
echo "Any packages or data stored in your JupyterLab environment will be removed"
echo " "
read -p "Press ENTER to continue or CTRL+C to abort"

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
echo "Uninstalling old packages and kernels"
conda uninstall -y xeus-python -c conda-forge || true;
conda uninstall -y r r-essentials r-irkernel || true;
conda uninstall -y r-languageserver -c conda-forge || true;
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
rm -rf $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/share/jupyter/lab
rm -rf $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/share/jupyter/labextensions
rm -rf $ANACONDA_HOME/envs/$CONDA_DEFAULT_ENV/share/jupyter/nbconvert
echo " "

echo "Installing/Updating JupyterLab"
pip install --upgrade pip wheel
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

echo "Installing R kernel and language server"
conda install -y r r-essentials r-irkernel
conda install -y -c conda-forge r-languageserver
echo " "

jupyter --version
echo " "
jupyter kernelspec list
echo " "
jupyter serverextension list
echo " "
jupyter server extension list
echo " "
jupyter labextension list
echo " "
