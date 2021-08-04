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
import os
import sys

from glob import glob
from setuptools import setup, find_packages

long_desc = """
            Elyra is a set of AI centric extensions to JupyterLab. It aims to help data scientists,
            machine learning engineers and AI developer’s through the model development life cycle complexities.
            """

here = os.path.abspath(os.path.dirname(__file__))

version_ns = {}
with open(os.path.join(here, 'elyra', '_version.py')) as f:
    exec(f.read(), {}, version_ns)

npm_packages_path = "./dist/*.tgz"
auto_jupyter_notebook_extension_path = "./etc/config/jupyter_notebook_config.d/*.json"
auto_jupyter_server_extension_path = "./etc/config/jupyter_server_config.d/*.json"
component_registry_path = './etc/config/components/*.json'
components_kfp_path = './etc/config/components/kfp/*.yaml'
components_airflow_path = './etc/config/components/airflow/*.py'
metadata_path = './etc/config/metadata/runtime-images/*.json'
settings_path = './etc/config/settings/*.json'

setup_args = dict(
    name="elyra",
    version=version_ns['__version__'],
    url="https://github.com/elyra-ai/elyra",
    description="Elyra provides AI Centric extensions to JupyterLab",
    long_description=long_desc,
    author="Elyra Maintainers",
    license="Apache License Version 2.0",
    data_files=[('etc/jupyter/jupyter_notebook_config.d', glob(auto_jupyter_notebook_extension_path)),
                ('etc/jupyter/jupyter_server_config.d', glob(auto_jupyter_server_extension_path)),
                ('share/jupyter/metadata/runtime-images', glob(metadata_path)),
                ('share/jupyter/components', glob(component_registry_path)),
                ('share/jupyter/components/kfp/', glob(components_kfp_path)),
                ('share/jupyter/components/airflow/', glob(components_airflow_path)),
                ('share/jupyter/lab/settings', glob(settings_path))],
    packages=find_packages(),
    install_requires=[
        'autopep8>=1.5.0,<1.5.6',
        'click>=7.1.1,<8', #Required bykfp 1.6.3
        'colorama',
        'entrypoints>=0.3',
        'jinja2>=2.11',
        'jsonschema>=3.2.0',
        'jupyter_core>=4.0,<5.0',
        'jupyter_client>=6.1.7',
        'jupyter_server>=1.7.0',
        'jupyterlab>=3.0.0',
        'jupyterlab-git~=0.32',
        'jupyterlab-lsp>=3.8.0',
        'jupyter-resource-usage>=0.5.1',
        'minio>=5.0.7,<7.0.0',
        'nbclient>=0.5.1',
        'nbconvert>=5.6.1',
        'nbdime~=3.1',
        'nbformat>=5.1.2',
        'networkx>=2.5.1',
        'papermill>=2.1.3',
        'python-lsp-server[all]>=1.1.0',
        'pyyaml>=5.3.1,<6.0',
        'requests>=2.25.1,<3.0',
        'rfc3986-validator>=0.1.1',
        'tornado>=6.1.0',
        'traitlets>=4.3.2',
        'urllib3>=1.26.5',
        'watchdog>=2.1.3',
        'websocket-client',
        'yaspin',
        # KFP runtime dependencies
        'kfp==1.6.3',
        'kfp-tekton==0.8.1',
        # Airflow runtime dependencies
        'pygithub',
        'black'
    ],
    extras_require={
        'test': ['pytest', 'pytest-tornasync'],
    },
    include_package_data=True,
    classifiers=(
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Topic :: Scientific/Engineering',
        'Topic :: Scientific/Engineering :: Artificial Intelligence',
        'Topic :: Software Development',
        'Topic :: Software Development :: Libraries',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
    ),
    entry_points={
        'console_scripts': [
            'elyra-metadata = elyra.metadata.metadata_app:MetadataApp.main',
            'elyra-pipeline = elyra.cli.pipeline_app:pipeline',
            'jupyter-elyra = elyra.elyra_app:launch_instance'
        ],
        'elyra.pipeline.processors': [
            'local = elyra.pipeline.processor_local:LocalPipelineProcessor',
            'airflow = elyra.pipeline.processor_airflow:AirflowPipelineProcessor',
            'kfp = elyra.pipeline.processor_kfp:KfpPipelineProcessor'
        ],
        'papermill.engine': [
            'ElyraEngine = elyra.pipeline.elyra_engine:ElyraEngine',
        ]
    },
)


if "--dev" not in sys.argv:
    setup_args["data_files"].append(('share/jupyter/lab/extensions', glob(npm_packages_path)))
else:
    sys.argv.remove("--dev")

if __name__ == '__main__':
    setup(**setup_args)
