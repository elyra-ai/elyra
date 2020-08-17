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
Elyra can be installed via PyPI:

### Prerequisites
* [Node.js 12+](https://nodejs.org/en/)
* [Python 3.x](https://www.python.org/downloads/)

##### Optional
* [Anaconda](https://www.anaconda.com/distribution/)

#### JupyterLab support

* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 1.x is supported on **Elyra 0.10.x and below**
* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 2.x is supported on **Elyra 1.0.0 and above**

via PyPI:
```bash
pip install --upgrade elyra && jupyter lab build
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
      elyra <VERSION> OK
    jupyterlab  enabled
    - Validating...
      jupyterlab 2.2.2 OK
    jupyterlab_git  enabled
    - Validating...
      jupyterlab_git 0.20.0 OK
    nbdime  enabled
    - Validating...
      nbdime 2.0.0 OK```

NOTE: If you don't see the elyra server extension enabled, you may need to explicitly enable
it with `jupyter serverextension enable elyra`

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
