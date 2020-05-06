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
Elyra can be installed via PyPi:

### Prerequisites
* [NodeJS 12+](https://nodejs.org/en/)
* [Python 3.X](https://www.anaconda.com/distribution/)

##### Optional
* [Anaconda](https://www.anaconda.com/distribution/) 

#### JupyterLab support

* [JupyterLab](https://github.com/jupyterlab/jupyterlab) 1.x is supported on **Elyra 0.10.1 and below**
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
        @elyra/application v0.10.1  enabled  OK*
        @elyra/code-snippet-extension-experimental v0.10.1  enabled  OK
        @elyra/pipeline-editor-extension v0.10.1  enabled  OK
        @elyra/python-runner-extension v0.10.1  enabled  OK
        @jupyterlab/git v0.20.0-rc.0  enabled  OK
        @jupyterlab/toc v3.0.0  enabled  OK
        nbdime-jupyterlab v2.0.0  enabled  OK
```
NOTE: If you don't see the elyra server extension enabled, you may need to explicitly enable
it with `jupyter serverextension enable elyra`
