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
auto_extension_path = "./etc/config/jupyter_server_config.d/*.json"
settings_path = './etc/config/settings/*.json'
metadata_path = './etc/config/metadata/runtime-images/*.json'


setup_args = dict(
    name="elyra",
    version=version_ns['__version__'],
    url="https://github.com/elyra-ai/elyra",
    description="Elyra provides AI Centric extensions to JupyterLab",
    long_description=long_desc,
    author="Elyra Maintainers",
    license="Apache License Version 2.0",
    data_files=[('etc/jupyter/jupyter_server_config.d', glob(auto_extension_path)),
                ('share/jupyter/lab/settings', glob(settings_path)),
                ('share/jupyter/metadata/runtime-images', glob(metadata_path))],
    packages=find_packages(),
    install_requires=[
        'autopep8',
        'entrypoints>=0.3',
        'jinja2>=2.11,<3.0',
        'jsonschema>=3.2.0',
        'jupyter_core>=4.0,<5.0',
        'jupyter_client>=6.1.7',
        'jupyter_server>=1.2.0',
        'jupyterlab>=3.0.0',
        'jupyterlab-git==0.30.0b1',
        'jupyterlab-lsp>=3.0.0',
        'jupyter-resource-usage>=0.5.1',
        'kfp-notebook~=0.18.0',
        'kfp==1.1.2',
        'kfp-tekton==0.5.1rc1',
        'minio>=5.0.7,<7.0.0',
        'nbclient>=0.5.1',
        'nbconvert>=5.6.1,<6.0',
        'nbdime>=3.0.0.b1',
        'nbformat>=5.1.2',
        'papermill>=2.1.3',
        'python-language-server[all]>=0.36.2',
        'requests>=2.9.1,<3.0',
        'rfc3986-validator>=0.1.1',
        'traitlets>=4.3.2',
        'urllib3>=1.24.2',
        'websocket-client',
    ],
    extras_require={
        'test': ['pytest', 'pytest-tornasync'],
    },
    include_package_data=True,
    classifiers=(
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Topic :: Scientific/Engineering',
        'Topic :: Scientific/Engineering :: Artificial Intelligence',
        'Topic :: Software Development',
        'Topic :: Software Development :: Libraries',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ),
    entry_points={
        'console_scripts': [
            'elyra-metadata = elyra.metadata.metadata_app:MetadataApp.main',
        ],
        'elyra.pipeline.processors': [
            'local = elyra.pipeline.processor_local:LocalPipelineProcessor',
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
