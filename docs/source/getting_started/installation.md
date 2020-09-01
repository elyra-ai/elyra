<!--
{% comment %}
Copyright 2018-2020 IBM Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
{% endcomment %}
-->
## Installation

The Elyra [JupyterLab extension](https://jupyterlab.readthedocs.io/en/stable/user/extensions.html) can be installed using `pip`, `conda`, or from source code. Installation of Elyra requires a rebuild of JupyterLab.

### Prerequisites

* [Node.js 12+](https://nodejs.org/en/)
* [Python 3.x](https://www.python.org/downloads/)

Note: Elyra 1.0.0 and above require JupyterLab 2.x.

### pip

If you use `pip`, install Elyra with:

```bash
pip install --upgrade elyra && jupyter lab build
```

Note: Ubuntu and CentOS users may need to use `pip3 install elyra` 

### conda

If you use `conda`, install Elyra with:

```bash
conda install -c conda-forge elyra && jupyter lab build
```

### Build from source

To build Elyra from source code follow the instructions in [developer guide](/developer_guide/development-workflow.md).

### Verify Installation

To verify an Elyra installation review the installed server extensions and lab extensions.

#### Verify the server extensions

Verify that the `elyra` extension is installed.

```bash
jupyter serverextension list
```

Should output:

```
config dir: /usr/local/etc/jupyter
    elyra  enabled
    - Validating...
      elyra <VERSION> OK
    jupyterlab  enabled
    - Validating...
      jupyterlab 2.2.2 OK
    jupyterlab_git  enabled
    - Validating...
      jupyterlab_git 0.20.0 OK
    nbdime  enabled
    - Validating...
      nbdime 2.0.0 OK
```

NOTE: If you don't see the elyra server extension enabled, you may need to explicitly enable it by running `jupyter serverextension enable elyra`.

#### Verify the lab extensions

Verify that the `elyra` labextensions are installed.

```bash
jupyter labextension list
```

Should output:

```
Known labextensions:
   app dir: /.../share/jupyter/lab
        @elyra/code-snippet-extension <VERSION>  enabled  OK*
        @elyra/metadata-extension <VERSION>  enabled  OK*
        @elyra/pipeline-editor-extension <VERSION>  enabled  OK*
        @elyra/python-editor-extension <VERSION>  enabled  OK*
        @elyra/theme-extension <VERSION>  enabled  OK*
        @jupyterlab/git v0.20.0  enabled  OK
        @jupyterlab/toc v4.0.0  enabled  OK
        nbdime-jupyterlab v2.0.0  enabled  OK
```

### Docker 

If you have Docker installed, you can install and use JupyterLab and Elyra by selecting one of the [ready-to-run Docker images](https://hub.docker.com/r/elyra/elyra/tags) maintained by the Elyra Team:

 - `elyra/elyra:latest` has the latest released version installed.
 - `elyra/elyra:x.y.z` has version `x.y.z` installed.
 - `elyra/elyra:dev` is automatically re-built each time a change is committed to the master branch.

The command below starts the most recent development build in a clean environment:

```
docker run -it -p 8888:8888 elyra/elyra:dev jupyter lab --debug
```

To make a local directory containing your Notebooks (e.g. `${HOME}/opensource/jupyter-notebooks/`) available in your Docker container, you can use a mount command similar to the following:

```
docker run -it -p 8888:8888 -v ${HOME}/opensource/jupyter-notebooks/:/home/jovyan/work -w /home/jovyan/work elyra/elyra:dev jupyter lab --debug
```

Open the displayed URL in your browser to start using JupyterLab and Elyra.

```
    To access the notebook, open this file in a browser:
        file:///home/jovyan/.local/share/jupyter/runtime/nbserver-6-open.html
    Or copy and paste one of these URLs:
        http://4d17829ecd4c:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
     or http://127.0.0.1:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
```