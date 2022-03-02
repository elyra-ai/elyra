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
import sys
from glob import glob
from jupyter_packaging import get_data_files
from setuptools import setup, find_packages

long_desc = """
            Elyra is a set of AI centric extensions to JupyterLab. It aims to help data scientists,
            machine learning engineers and AI developer’s through the model development life cycle complexities.
            """

here = os.path.abspath(os.path.dirname(__file__))

setup_args = dict(
    name="{{package-name}}",
    version='{{version}}',
    url="https://github.com/elyra-ai/elyra",
    description="Elyra provides AI Centric extensions to JupyterLab",
    long_description=long_desc,
    author="Elyra Maintainers",
    license="Apache License Version 2.0",
    data_files=get_data_files([
        {{data-files}}
    ]),
    packages=find_packages(),
    install_requires=[
        {{install-requires}}
    ],
    include_package_data=True,
    classifiers=(
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Topic :: Scientific/Engineering',
        'Topic :: Scientific/Engineering :: Artificial Intelligence',
        'Topic :: Software Development',
        'Topic :: Software Development :: Libraries',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
    ),
    entry_points={},
)

if __name__ == '__main__':
    setup(**setup_args)
