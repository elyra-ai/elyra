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

from setuptools import setup, find_packages

try:
    long_desc = open('README.md').read()
except:
    long_desc = ''

setup(
    name="ai-workspace",
    url="https://github.ibm.com/ai-workspace/ai-workspace",
    author="CODAIT",
    version="0.2.0",
    packages=find_packages(),
    data_files=[('etc/jupyter/jupyter_notebook_config.d', ['jupyter-config/jupyter_notebook_config.d/ai_workspace.json']),
                ('etc/jupyter/jupyter_notebook_config.d', ['jupyter-config/jupyter_notebook_config.d/jupyterlab_git.json']),
                ('share/jupyter/lab/extensions', ['dist/aiworkspace-notebook-scheduler-extension-0.2.0.tgz',
                                                  'dist/aiworkspace-pipeline-editor-extension-0.2.0.tgz',
                                                  'dist/aiworkspace-python-runner-extension-0.2.0.tgz',
                                                  'dist/git-0.8.2.tgz'])
                ],
    install_requires=[
        "jupyter_core>=4.0,<5.0",
        "kfp",
        "kfp-notebook>=0.2.0",
        "minio",
        'ipywidgets',
        'jupyterlab>=1.0.0,<2.0.0',
        'jupyterlab-git',
        'nbconvert',
        'notebook>=6'
        'traitlets>=4.3.2',
        'jsonschema',
        'requests>=2.9.1,<3.0',
    ],
    include_package_data=True,
    description="Enterprise Workspace for AI",
    long_description=long_desc,
    entry_points={
        'console_scripts': [
            'jupyter-runtime = ai_workspace.metadata.runtime:RuntimeMetadataApp.launch_instance',
        ],
    },
)
