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

This directory root contains configuration files to use when creating a pipeline runtime in a Kubernetes environment for use with Elyra

### airflow

Contains sample Helm chart values (not the chart itself) when deploying an Apache Airflow instance compatible with Elyra.
See [Configuring Airflow on Kubernetes for use with Elyra](https://elyra.readthedocs.io/en/latest/recipes/configure-airflow-as-a-runtime.html)

### kubeflow-pipelines

Contains the sample kustomization.yaml needed to deploy a local instance of Kubeflow Pipelines.
See [Deploying Kubeflow Pipelines Locally for Elyra](https://elyra.readthedocs.io/en/latest/recipes/deploying-kubeflow-locally-for-dev.html#deploying-kubeflow-pipelines-locally-for-elyra) 