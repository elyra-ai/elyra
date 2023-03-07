  <!--
{% comment %}
Copyright 2018-2022 Elyra Authors

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

The Elyra [JupyterLab extensions](https://jupyterlab.readthedocs.io/en/stable/user/extensions.html) can be installed from PyPI, conda, or from source code.

### Prerequisites

* [Node.js 18+](https://nodejs.org/en/)
* [Python 3.8+](https://www.python.org/downloads/) (or later)

JupyterLab dependencies:
 - Elyra >= 2.0.0 requires JupyterLab 3.x

The instructions below are installing the latest release.

### Packaging

Prior to version 3.1, the `elyra` package included all dependencies. Subsequent releases allow for selective dependency installation:

- `elyra` - install the Elyra core features
- `elyra[all]` - install core features and all dependencies
- `elyra[kfp-tekton]` - install the Elyra core features and support for [Kubeflow Pipelines on Tekton](https://github.com/kubeflow/kfp-tekton)
- `elyra[gitlab]` - install the Elyra core features and GitLab support for Apache Airflow pipelines
- `elyra[kfp-examples]` - install the Elyra core features and [Kubeflow Pipelines custom component examples](https://github.com/elyra-ai/examples/tree/main/component-catalog-connectors/kfp-example-components-connector)

### pip

If you use `pip`, install Elyra with:

```bash
pip3 install --upgrade "elyra[all]"
```

If desired, you can install these Elyra extensions independently:

- [Pipeline Editor](https://pypi.org/project/elyra-pipeline-editor-extension/)

   ```bash
   pip3 install --upgrade elyra-pipeline-editor-extension
   ```

- [Code Snippets](https://pypi.org/project/elyra-code-snippet-extension/)

   ```bash
   pip3 install --upgrade elyra-code-snippet-extension
   ```

- [Code Viewer](https://pypi.org/project/elyra-code-viewer-extension/)

   ```bash
   pip3 install --upgrade elyra-code-viewer-extension
   ```

- [Python Editor](https://pypi.org/project/elyra-python-editor-extension/)

   ```bash
   pip3 install --upgrade elyra-python-editor-extension
   ```

- [R Editor](https://pypi.org/project/elyra-r-editor-extension/)

   ```bash
   pip3 install --upgrade elyra-r-editor-extension
   ```
  
- [Scala Editor](https://pypi.org/project/elyra-scala-editor-extension/)

   ```bash
   pip3 install --upgrade elyra-scala-editor-extension
   ```

### conda

If you use `conda`, install Elyra with:

```bash
conda install -c conda-forge "elyra[all]"
```

**NOTE:**
The Elyra packaging process was changed in version 3.1.0. The [Kubeflow Pipelines on Tekton](https://github.com/kubeflow/kfp-tekton) dependency [is no longer installed by default](https://github.com/elyra-ai/elyra/pull/2043). To install this dependency, you must specify `elyra[all]` or `elyra[kfp-tekton]`.

You can also install the Pipeline editor, Code Snippet, Code Viewer, or Script editor extensions individually:

```bash
conda install -c conda-forge elyra-pipeline-editor-extension
```

```bash
conda install -c conda-forge elyra-code-snippet-extension
```

```bash
conda install -c conda-forge elyra-code-viewer-extension
```

```bash
conda install -c conda-forge elyra-python-editor-extension
```

```bash
conda install -c conda-forge elyra-r-editor-extension
```

**NOTE:** The R Editor extension is not yet available on `conda-forge` or `pip` package manager.

### Build from source

To build Elyra from source code follow the instructions in [developer guide](/developer_guide/development-workflow.md).

### Verify Installation

To verify an Elyra installation review the installed server extensions and lab extensions.

#### Verify the server extensions

Verify that the `elyra` extension is installed.

```bash
jupyter server extension list
```

Should output:

```
Config dir: /.../.jupyter

Config dir: /.../etc/jupyter
    elyra enabled
    - Validating elyra...
      elyra  OK
    jupyter_lsp enabled
    - Validating jupyter_lsp...
      jupyter_lsp [version] OK
    jupyter_resource_usage enabled
    - Validating jupyter_resource_usage...
      jupyter_resource_usage [version] OK
    jupyter_server_mathjax enabled
    - Validating jupyter_server_mathjax...
      jupyter_server_mathjax  OK
    jupyterlab enabled
    - Validating jupyterlab...
      jupyterlab [version] OK
    jupyterlab_git enabled
    - Validating jupyterlab_git...
      jupyterlab_git [version] OK
    nbclassic enabled
    - Validating nbclassic...
      nbclassic  OK
    nbdime enabled
    - Validating nbdime...
      nbdime [version] OK

Config dir: /.../etc/jupyter
```

NOTE: If you don't see the Elyra server extension enabled, you may need to explicitly enable it with `jupyter server extension enable elyra`.

#### Verify the lab extensions

Verify that the `elyra` labextensions are installed.

```bash
jupyter labextension list
```

Should output:

```
JupyterLab [version]
/.../share/jupyter/labextensions
        nbdime-jupyterlab [version] enabled OK
        @jupyter-server/resource-usage [version] enabled OK (python, jupyter-resource-usage)
        @krassowski/jupyterlab-lsp [version] enabled OK (python, jupyterlab_lsp)
        @elyra/code-snippet-extension [version] enabled OK
        @elyra/code-viewer-extension [version] enabled OK
        @elyra/metadata-extension [version] enabled OK
        @elyra/pipeline-editor-extension [version] enabled OK
        @elyra/python-editor-extension [version] enabled OK
        @elyra/scala-editor-extension [version] enabled OK
        @elyra/r-editor-extension [version] enabled OK
        @elyra/theme-extension [version] enabled OK
        @jupyterlab/git [version] enabled OK (python, jupyterlab-git)

Other labextensions (built into JupyterLab)
   app dir: /.../share/jupyter/lab
```

### Docker 

If you have Docker installed, you can use JupyterLab and Elyra by running one of the ready-to-run container images:

 - `elyra/elyra:latest` has the latest released version installed.
 - `elyra/elyra:x.y.z` has version `x.y.z` installed.
 - `elyra/elyra:dev` is automatically re-built each time a change is committed to the main branch.

#### Pulling Elyra container images

Images can be pulled from [Docker Hub](https://hub.docker.com/r/elyra/elyra/tags) 

```
docker pull elyra/elyra:dev
```

or [quay.io](https://quay.io/repository/elyra/elyra?tab=tags)

```
docker pull quay.io/elyra/elyra:dev
```

#### Running Elyra container images

Invocation example 1: Run the latest stable Elyra release in a Docker container. All changes are discarded when the Docker container is stopped.

```
docker run -it -p 8888:8888 elyra/elyra:latest jupyter lab --debug
```

Invocation example 2: Run the latest stable Elyra release in a Docker container and mount the existing local `$HOME/jupyter-notebooks/` directory as JupyterLab work directory. This enables you to make existing notebooks and other files available in the Docker container. Only files in this working directory are retained when the Docker container is stopped.

```
docker run -it -p 8888:8888\
 -v ${HOME}/jupyter-notebooks/:/home/jovyan/work\
 -w /home/jovyan/work\
 elyra/elyra:latest jupyter lab --debug
```

Invocation example 3: Same as above. In addition a local directory named `${HOME}/jupyter-data-dir` is mounted as the Jupyter data directory in the Docker container, storing all user-defined Elyra metadata artifacts you might create, such as code snippets, runtime configurations, or runtime images.

Note: To start with a clean environment `${HOME}/jupyter-data-dir` should refer to an empty directory. To re-use an existing Jupyter data directory from a local installation specify the output of `jupyter --data-dir` as directory name. 

```
docker run -it -p 8888:8888\
 -v ${HOME}/jupyter-notebooks/:/home/jovyan/work\
 -w /home/jovyan/work\
 -v ${HOME}/jupyter-data-dir:/home/jovyan/.local/share/jupyter\
 elyra/elyra:latest jupyter lab --debug
```

Open the displayed URL in your browser to start using JupyterLab and Elyra.

```
    To access the notebook, open this file in a browser:
        file:///home/jovyan/.local/share/jupyter/runtime/nbserver-6-open.html
    Or copy and paste one of these URLs:
        http://4d17829ecd4c:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
     or http://127.0.0.1:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
```

### Kubeflow Notebook Server

The instructions in 
[this topic](/recipes/using-elyra-with-kubeflow-notebook-server.md) outline how to configure a [Kubeflow Notebook Server](https://www.kubeflow.org/docs/components/notebooks) for Elyra.

### Red Hat OpenShift

JupyterLab and Elyra are included in the Open Data Hub community operator. Follow the instructions in [this document](/recipes/deploying-elyra-with-opendatahub.md) to deploy the operator in a Red Hat OpenShift cluster.
