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
import os

from jupyter_packaging import get_data_files
from setuptools import setup

here = os.path.abspath(os.path.dirname(__file__))

#####################################################################################################
# Additional files and archives to be packaged with distribution
#####################################################################################################
data_files_spec = [
    ("etc/jupyter/jupyter_notebook_config.d", "etc/config/jupyter_notebook_config.d", "*.json"),
    ("etc/jupyter/jupyter_server_config.d", "etc/config/jupyter_server_config.d", "*.json"),
    ("share/jupyter/metadata/runtime-images", "etc/config/metadata/runtime-images", "*.json"),
    ("share/jupyter/metadata/component-catalogs", "etc/config/metadata/component-catalogs", "*.json"),  # deprecated
    ("share/jupyter/components", "etc/config/components", "*.json"),  # deprecated
    ("share/jupyter/components/kfp/", "etc/config/components/kfp", "*.yaml"),  # deprecated
    ("share/jupyter/components/airflow/", "etc/config/components/airflow", "*.py"),  # deprecated
    ("share/jupyter/lab/settings", "etc/config/settings", "*.json"),
    ("share/jupyter/labextensions", "dist/labextensions", "**"),
]

setup_args = dict(data_files=get_data_files(data_files_spec))

if __name__ == "__main__":
    setup(**setup_args)
