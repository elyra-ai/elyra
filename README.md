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


[![PyPI version](https://badge.fury.io/py/elyra.svg)](https://badge.fury.io/py/elyra)
[![Downloads](https://pepy.tech/badge/elyra/month)](https://pepy.tech/project/jupyterlab/month)
[![Documentation Status](https://readthedocs.org/projects/elyra/badge/?version=latest)](https://elyra.readthedocs.io/en/latest/?badge=latest)
[![GitHub](https://img.shields.io/badge/issue_tracking-github-blue.svg)](https://github.com/elyra-ai/elyra/issues)
[![Gitter](https://badges.gitter.im/elyra-ai/community.svg)](https://gitter.im/elyra-ai/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/elyra-ai/elyra/master?urlpath=lab/tree/binder-demo)

# Elyra

Elyra is a set of AI-centric extensions to JupyterLab Notebooks.

Elyra currently includes:
* Notebook Pipelines visual editor
* Ability to run a notebook as a batch job
* Hybrid runtime support
* Python script execution capabilities within the editor
* Reusable Code Snippets (Experimental)
* Notebook versioning based on git integration
* Notebook navigation using auto-generated **Table of Contents**
* Reusable configuration for runtimes
  
![Elyra](docs/source/images/elyra-main-page.png)

The [Elyra Getting Started Guide](https://elyra.readthedocs.io/en/latest/getting_started/overview.html)
includes more details on these features.

## Installation
Elyra can be installed via PyPi:

### Prerequisites :
* [NodeJS 12+](https://nodejs.org/en/)
* [Python 3.X](https://www.anaconda.com/distribution/)

##### Optional :
* [Anaconda](https://www.anaconda.com/distribution/) 

#### JupyterLab support

* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 1.x is supported on **Elyra 0.10.0 and below**
* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 2.x is supported on **Elyra 0.11.0-rc0 and above**

via PyPi:
```bash
pip install elyra && jupyter lab build
```
Note: Ubuntu and CentOS users may need to use `pip3 install elyra` 

### Verify Installation 
```bash
jupyter serverextension list
```
Should output:
```
config dir: /usr/local/etc/jupyter
    elyra  enabled
    - Validating...
      elyra 0.10.1 OK
    jupyterlab  enabled
    - Validating...
      jupyterlab 2.1.1 OK
    jupyterlab_git  enabled
    - Validating...
      jupyterlab_git 0.20.0rc0 OK
    nbdime  enabled
    - Validating...
      nbdime 2.0.0 OK

```
```bash
jupyter labextension list
```
Should output:
```
Known labextensions:
   app dir: /Users/lresende/opt/anaconda/envs/dev/share/jupyter/lab
        @elyra/application v0.11.0-dev  enabled  OK*
        @elyra/code-snippet-extension-experimental v0.11.0-dev  enabled  OK
        @elyra/pipeline-editor-extension v0.11.0-dev  enabled  OK
        @elyra/python-runner-extension v0.11.0-dev  enabled  OK
        @jupyterlab/git v0.20.0-rc.0  enabled  OK
        @jupyterlab/toc v3.0.0  enabled  OK
        nbdime-jupyterlab v2.0.0  enabled  OK
```
NOTE: If you don't see the elyra server extension enabled, you may need to explicitly enable
it with `jupyter serverextension enable elyra`

## Configuring Runtimes for Pipeline execution

The Elyra Pipeline editor delegates execution of pipelines to remote runtimes. Configure these
external runtimes as documented in
[Runtime Configuration](https://elyra.readthedocs.io/en/latest/user_guide/runtime-conf.html).

## Starting Elyra
After verifying Elyra has been installed, start Elyra with:
```bash
jupyter lab
```

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
