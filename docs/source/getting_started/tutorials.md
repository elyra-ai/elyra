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

#### Running notebook pipelines on Apache Airflow

Creating a pipeline with Elyra and Apache Airflow is very similar to creating a pipeline with Kubeflow. 

##### Submitting a pipeline to Apache Airflow vs. Kubeflow Pipelines
- The process of creating a pipeline in Elyra's pipeline editor remains mostly the same with the following differences: 
- When submitting a job to an Airflow runtime, you will need to select `Airflow` in the first dropdown menu, the panel will
then update the next dropdown list with available Airflow runtimes for you to submit to. Select one and hit submit.
- After submitting a job, a dialog box will appear with the following:
    - A link to the main Apache Airflow Dashboard where your pipeline will be running
    - A link to the Github Repository where you pushed your pipeline file
    - A link to your Cloud Object Storage bucket, where your pipeline input and output artifacts will reside 
  
##### Exporting an Apache Airflow pipeline to File
- When exporting a pipeline to file, you will need to select `Airflow` in the first dropdown menu, the panel will
then update the next dropdown list with available Airflow runtimes for you to submit to, lastly, you would 
select the export file `type`. For now the only option is export to a python (.py) file when using Airflow.
