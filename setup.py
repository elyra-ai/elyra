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
import os
import sys
from glob import glob
from setuptools import setup, find_packages

try:
    long_desc = open('README.md').read()
except:
    long_desc = ''

here = os.path.abspath(os.path.dirname(__file__))

version_ns = {}
with open(os.path.join(here, 'ai_workspace', '_version.py')) as f:
    exec(f.read(), {}, version_ns)

npm_packages_path = "./dist/*.tgz"
auto_extension_path = "./jupyter-config/jupyter_notebook_config.d/*.json"

setup_args = dict(
    name="ai-workspace",
    url="https://github.com/ai-workspace/ai-workspace",
    author="CODAIT",
    version=version_ns['__version__'],
    data_files=[('etc/jupyter/jupyter_notebook_config.d', glob(auto_extension_path))],
    packages=find_packages(),
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
    description="AI Workspace",
    long_description=long_desc,
    entry_points={
        'console_scripts': [
            'jupyter-runtime = ai_workspace.metadata.runtime:RuntimeMetadataApp.launch_instance',
        ],
    },
)

if "--dev" not in sys.argv:
    setup_args["data_files"].append(('share/jupyter/lab/extensions', glob(npm_packages_path)))
else:
    sys.argv.remove("--dev")

if __name__ == '__main__':
    setup(**setup_args)
