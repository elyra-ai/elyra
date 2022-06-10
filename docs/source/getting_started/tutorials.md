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
## Tutorials and examples

The community maintains a set of official tutorials and examples for many Elyra features. [Articles, blog posts, and other resources that are not part of the Elyra documentation are located here](published-resources.md).

### Tutorials

The following tutorials highlight key features of Elyra.

#### Run generic pipelines in JupyterLab

Learn how to [create a generic pipeline and run it in your local JupyterLab environment](https://github.com/elyra-ai/examples/tree/main/pipelines/introduction-to-generic-pipelines).

#### Run generic pipelines on Kubeflow Pipelines

Learn how to [run generic pipelines on Kubeflow Pipelines](https://github.com/elyra-ai/examples/tree/main/pipelines/run-generic-pipelines-on-kubeflow-pipelines). This tutorial requires a Kubeflow Pipelines deployment in a local environment or on the cloud.

#### Run runtime-specific pipelines on Kubeflow Pipelines

Learn how to [run runtime-specific pipelines on Kubeflow Pipelines](https://github.com/elyra-ai/examples/tree/main/pipelines/run-pipelines-on-kubeflow-pipelines). This tutorial requires a Kubeflow Pipelines deployment in a local environment or on the cloud.

#### Run generic pipelines on Apache Airflow

Learn how to [run generic pipelines on Apache Airflow](https://github.com/elyra-ai/examples/tree/main/pipelines/run-generic-pipelines-on-apache-airflow). This tutorial requires an Apache Airflow deployment in a local environment or on the cloud.

#### Run runtime-specific pipelines on Apache Airflow

Learn how to [run runtime-specific pipelines on Apache Airflow](https://github.com/elyra-ai/examples/tree/main/pipelines/run-pipelines-on-apache-airflow). This tutorial requires an Apache Airflow deployment in a local environment or on the cloud.


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
