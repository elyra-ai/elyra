<!--
{% comment %}
Copyright 2018-2021 Elyra Authors

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


[![PyPI version](https://badge.fury.io/py/elyra.svg)](https://badge.fury.io/py/elyra)
[![Anaconda-Server Badge](https://anaconda.org/conda-forge/elyra/badges/version.svg)](https://anaconda.org/conda-forge/elyra)
[![Downloads](https://pepy.tech/badge/elyra)](https://pepy.tech/project/elyra)
[![Documentation Status](https://readthedocs.org/projects/elyra/badge/?version=latest)](https://elyra.readthedocs.io/en/latest/?badge=latest)
[![GitHub](https://img.shields.io/badge/issue_tracking-github-blue.svg)](https://github.com/elyra-ai/elyra/issues)
[![Gitter](https://badges.gitter.im/elyra-ai/community.svg)](https://gitter.im/elyra-ai/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

# Elyra

Elyra is a set of AI-centric extensions to JupyterLab Notebooks.

Elyra currently includes the following functionality:

- [Create and run AI pipelines](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#ai-pipelines-visual-editor)
- [Run notebooks as batch jobs](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#ability-to-run-a-notebook-as-a-batch-job)
- [Reusable Code Snippets](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#reusable-code-snippets)
- [Hybrid runtime support](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#hybrid-runtime-support) based on [Jupyter Enterprise Gateway](https://github.com/jupyter/enterprise_gateway)
- [Python and R script editors with local/remote execution capabilities](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#python-and-r-scripts-execution-support)
- [Python script navigation using auto-generated Table of Contents](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#python-script-execution-support)
- [Notebook navigation using auto-generated outlines using Table of Contents](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#notebook-navigation-using-auto-generated-table-of-contents)
- [Version control using Git integration](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#version-control-using-git-integration)
- [Language Server Protocol integration](https://elyra.readthedocs.io/en/latest/getting_started/overview.html#language-server-protocol-integration)

![Elyra](docs/source/images/elyra-main-page.png)

The [Elyra Getting Started Guide](https://elyra.readthedocs.io/en/latest/getting_started/overview.html)
includes more details on these features.

## Try Elyra

#### Using Binder
You can try out some of Elyra features using the [My Binder](https://mybinder.readthedocs.io/en/latest/) service.

Click on a link below to try Elyra, on a sandbox environment, without having to install anything.

- [![Launch latest stable version](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/elyra-ai/elyra/v2.2.4?urlpath=lab/tree/binder-demo) (Latest stable version - see [changelog](/docs/source/getting_started/changelog.md) for recent updates)
- [![Launch latest development version](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/elyra-ai/elyra/master?urlpath=lab/tree/binder-demo) (Development version - expect longer image load time due to just-in-time build)

#### Using Docker

You can also try Elyra by running one of the docker images from [Docker Hub](https://hub.docker.com/r/elyra/elyra/tags):
- `elyra/elyra:latest` has the latest released version installed.
- `elyra/elyra:x.y.z` has a specific version installed.
- `elyra/elyra:dev` is automatically re-built each time a change is committed to the master branch.

The command below starts the most recent development build in a clean environment:

```
docker run -it -p 8888:8888 elyra/elyra:dev jupyter lab --debug
```

To make a local directory containing your Notebooks (e.g. ${HOME}/opensource/jupyter-notebooks/) available in your
docker container, you can use a mount command similar to the following:

```
docker run -it -p 8888:8888 -v ${HOME}/opensource/jupyter-notebooks/:/home/jovyan/work -w /home/jovyan/work elyra/elyra:dev jupyter lab --debug
```

These should produce output similar to that below, where you can then find the URL to be used
to access Elyra in your local browser.

```
    To access the notebook, open this file in a browser:
        file:///home/jovyan/.local/share/jupyter/runtime/nbserver-6-open.html
    Or copy and paste one of these URLs:
        http://4d17829ecd4c:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
     or http://127.0.0.1:8888/?token=d690bde267ec75d6f88c64a39825f8b05b919dd084451f82
```

## Installation
Elyra can be installed from PyPI:

### Prerequisites :
* [NodeJS 12+](https://nodejs.org/en/)
* [Python 3.6+](https://www.python.org/downloads/)

##### Optional :
* [Miniconda](https://docs.conda.io/en/latest/miniconda.html) 

#### JupyterLab support

* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 3.x is supported on **Elyra 2.0.0 and above**

  Install from PyPI:
  ```bash
  pip install --upgrade "elyra>=2.0.1" && jupyter lab build
  ```

  Note: Ubuntu and CentOS users may need to use `pip3 install elyra` 

  Install fom Conda:
  ```bash
  conda install -c conda-forge "elyra>=2.0.1" && jupyter lab build
  ```

* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 2.x is supported on **Elyra 1.0.0 and above**

  Install from PyPI:
  ```bash
  pip install --upgrade "elyra<2.0.0" && jupyter lab build
  ```
  Note: Ubuntu and CentOS users may need to use `pip3 install elyra`

  Install from Conda:
  ```bash
  conda install -c conda-forge "elyra<2.0.0" && jupyter lab build
  ```

* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 1.x is supported on **Elyra 0.10.x and below**

  Install from PyPI:
  ```bash
  pip install elyra==0.10.3 && jupyter lab build
  ```

**NOTE:** On November 2020, a new version of PIP (20.3) was released with a new, "2020" resolver. This resolver does not yet work with Elyra and might lead to errors in installation. In order to install Elyra, you need to either downgrade pip to version 20.2.4 `pip install --upgrade pip==20.2.4` or, in case you use pip 20.3 (or later), you need to add option `--use-deprecated legacy-resolver` to your pip install command.
### Verify Installation 

Run the following commands to verify the installation. Note that in the example output below the `[version]` placeholder is displayed instead of an actual version identifier, which might change with every release.

```bash
jupyter serverextension list
```
Should output:
``` 
config dir: /usr/local/etc/jupyter
    jupyter_resource_usage  enabled 
    - Validating...
      jupyter_resource_usage  OK
    jupyterlab  enabled 
    - Validating...
      jupyterlab [version] OK
    nbdime  enabled 
    - Validating...
      nbdime [version] OK
```


```bash
jupyter server extension list
```
Should output:
```
Config dir: /.../.jupyter

Config dir: /.../etc/jupyter
    elyra enabled
    - Validating elyra...
      elyra [version] OK
    jupyter_lsp enabled
    - Validating jupyter_lsp...
      jupyter_lsp [version] OK
    jupyter_resource_usage enabled
    - Validating jupyter_resource_usage...
      jupyter_resource_usage  OK
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

NOTE: If you don't see the Elyra server extension enabled, you may need to explicitly enable
it with `jupyter server extension enable elyra`

```bash
jupyter labextension list
```
Should output:
```      
JupyterLab [version]
/.../share/jupyter/labextensions
        @jupyter-server/resource-usage [version] enabled OK (python, jupyter-resource-usage)
        @krassowski/jupyterlab-lsp [version] enabled OK (python, jupyterlab_lsp)
        @jupyterlab/git [version] enabled OK (python, jupyterlab-git)

Other labextensions (built into JupyterLab)
   app dir: /.../share/jupyter/lab
        @elyra/code-snippet-extension [version] enabled OK
        @elyra/metadata-extension [version] enabled OK
        @elyra/pipeline-editor-extension [version] enabled OK
        @elyra/python-editor-extension [version] enabled OK
        @elyra/r-editor-extension [version] enabled OK
        @elyra/theme-extension [version] enabled OK
        nbdime-jupyterlab [version] enabled OK        
        
```

## Starting Elyra
After verifying Elyra has been installed, start Elyra with:
```bash
jupyter lab
```

## Getting Help

We welcome your questions, ideas, and feedback. Check the [`Getting Help` section in the `Getting Started guide`](https://elyra.readthedocs.io/en/latest/getting_started/getting-help.html) to learn more about the channels you can use to get in touch with us.

## Contributing to Elyra
If you are interested in helping make Elyra better, we encourage you to take a look at our 
[Contributing](CONTRIBUTING.md) page,  
[Development Workflow](https://elyra.readthedocs.io/en/latest/developer_guide/development-workflow.html)
documentation, and invite you to attend our weekly dev community meetings.

### Weekly Dev Community Meeting 
Join us weekly to discuss Elyra development topics.  Everyone is welcome and participation is optional.

**When**: Thursdays at [9AM Pacific](https://www.thetimezoneconverter.com/?t=9%3A00%20am&tz=San%20Francisco&)

**Where**: [Webex](https://ibm.webex.com/meet/akchin)

**What**: [Meeting Notes](https://hackmd.io/SgvSqrWWR2248mCw2BZ5gg?both)
