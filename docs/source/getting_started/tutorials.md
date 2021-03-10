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
## Tutorials and examples

The community maintains a set of official tutorials and examples for many Elyra features.

### Tutorials

The following tutorials highlight key features of Elyra.

#### Running notebook pipelines in JupyterLab

Learn how to [create a notebook pipeline and run it in your local JupyterLab environment](https://github.com/elyra-ai/examples/tree/master/pipelines/hello_world).

#### Running notebook pipelines on Kubeflow Pipelines

Learn how to [create a notebook pipeline and run it on Kubeflow Pipelines](https://github.com/elyra-ai/examples/tree/master/pipelines/hello_world_kubeflow_pipelines). This tutorial requires a Kubeflow Pipelines deployment in a local environment or on the cloud.

#### Running notebook pipelines on Apache Airflow

Learn how to [create a notebook pipeline and run it on Apache Airflow](https://github.com/elyra-ai/examples/tree/master/pipelines/hello_world_apache_airflow). This tutorial requires an Apache Airflow deployment in a local environment or on the cloud.

#### Examples

The [https://github.com/elyra-ai/examples](https://github.com/elyra-ai/examples) repository contains examples you can use to explore Elyra features.

If you have JupyterLab with the Elyra extensions installed, clone the repository using the included [jupyter-git extension](https://github.com/jupyterlab/jupyterlab-git):
 - From the main menu select `git` > `Clone a repository`. (The label texts might vary depending which version of the `jupyter-git` extension is installed.)
 - Enter `https://github.com/elyra-ai/examples.git` as repository URL.
 - In the JupyterLab File Browser navigate to the `examples` directory and open `README.md`.

#### Sample pipelines

The following pipelines were created by members of the extended Elyra community and should run as-is in JupyterLab and on Kubeflow Pipelines.

- [Analyzing COVID-19 time series data](https://github.com/CODAIT/covid-notebooks)
- [Analyzing flight delays](https://github.com/CODAIT/flight-delay-notebooks)
