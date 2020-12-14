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

The Elyra [JupyterLab extensions](https://jupyterlab.readthedocs.io/en/stable/user/extensions.html) can be installed using `pip`, `conda`, or from source code.

Note: JupyterLab currently requires a re-build after installing any extension.

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

If desired, you can install these Elyra extensions independently:

- [Pipeline editor](https://pypi.org/project/elyra-pipeline-editor-extension/)

   ```bash
   pip install --upgrade elyra-pipeline-editor-extension && jupyter lab build
   ```

- [Code snippets](https://pypi.org/project/elyra-code-snippet-extension/)

   ```bash
   pip install --upgrade elyra-code-snippet-extension && jupyter lab build
   ```

- [Python script editor](https://pypi.org/project/elyra-python-editor-extension/)

   ```bash
   pip install --upgrade elyra-python-editor-extension && jupyter lab build
   ```

### conda

If you use `conda`, install Elyra with:

```bash
conda install -c conda-forge elyra && jupyter lab build
```

or install the Pipeline editor, Code Snippet, or Python editor extensions individually:

```bash
conda install -c conda-forge elyra-pipeline-editor-extension && jupyter lab build
```

```bash
conda install -c conda-forge elyra-code-snippet-extension && jupyter lab build
```

```bash
conda install -c conda-forge elyra-python-editor-extension && jupyter lab build
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
      elyra 1.5.2 OK
    jupyterlab  enabled
    - Validating...
      jupyterlab 2.2.8 OK
    jupyterlab_git  enabled
    - Validating...
      jupyterlab_git 0.23.1 OK
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
        @elyra/code-snippet-extension v1.5.2  enabled  OK*
        @elyra/metadata-extension v1.5.2  enabled  OK*
        @elyra/pipeline-editor-extension v1.5.2  enabled  OK*
        @elyra/python-editor-extension v1.5.2  enabled  OK*
        @elyra/theme-extension v1.5.2  enabled  OK*
        @jupyterlab/git v0.22.3  enabled  OK
        @jupyterlab/toc v4.0.0  enabled  OK
        nbdime-jupyterlab v2.0.0  enabled  OK
```

### Docker 

If you have Docker installed, you can use JupyterLab and Elyra by running one of the [ready-to-run Docker images](https://hub.docker.com/r/elyra/elyra/tags) maintained by the Elyra Team:

 - `elyra/elyra:latest` has the latest released version installed.
 - `elyra/elyra:x.y.z` has version `x.y.z` installed.
 - `elyra/elyra:dev` is automatically re-built each time a change is committed to the master branch.

Invocation example 1: Run the most recent Elyra development build in a Docker container. All changes are discarded when the Docker container is stopped.

```
docker run -it -p 8888:8888 elyra/elyra:1.2.1 jupyter lab --debug
```

Invocation example 2: Run the most recent Elyra development build in a Docker container and mount the existing local `$HOME/jupyter-notebooks/` directory as JupyterLab work directory. This enables you to make existing notebooks and other files available in the Docker container. Only files in this working directory are retained when the Docker container is stopped. 

```
docker run -it -p 8888:8888\
 -v ${HOME}/jupyter-notebooks/:/home/jovyan/work\
 -w /home/jovyan/work\
 elyra/elyra:1.5.2 jupyter lab --debug
```

Invocation example 3: Same as above. In addition a local directory named `${HOME}/jupyter-data-dir` is mounted as the Jupyter data directory in the Docker container, storing all user-defined Elyra metadata artifacts you might create, such as code snippets, runtime configurations, or runtime images.

Note: To start with a clean environment `${HOME}/jupyter-data-dir` should refer to an empty directory. To re-use an existing Jupyter data directory from a local installation specify the output of `jupyter --data-dir` as directory name. 

```
docker run -it -p 8888:8888\
 -v ${HOME}/jupyter-notebooks/:/home/jovyan/work\
 -w /home/jovyan/work\
 -v ${HOME}/jupyter-data-dir:/home/jovyan/.local/share/jupyter\
 elyra/elyra:1.5.2 jupyter lab --debug
```

Open the displayed URL in your browser to start using JupyterLab and Elyra.

```
    To access the notebook, open this file in a browser:
        file:///home/jovyan/.local/share/jupyter/runtime/nbserver-6-open.html
    Or copy and paste one of these URLs:
        http://4d17829ecd4c:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
     or http://127.0.0.1:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
```


### Red Hat OpenShift

JupyterLab and Elyra are included in the Open Data Hub community operator. Follow the instructions in [this document](/recipes/deploying-elyra-with-opendatahub.md) to deploy the operator in a Red Hat OpenShift cluster.
