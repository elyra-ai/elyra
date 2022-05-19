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

This directory root contains Dockerfiles and required supporting files needed to build custom images for use with Elyra.

### elyra
Builds the Elyra image for use as standalone or with JupyterHub. See [Deploying Elyra and JupyterHub in a Kubernetes environment](https://elyra.readthedocs.io/en/latest/recipes/deploying-elyra-in-a-jupyterhub-environment.html#deploying-elyra-jupyterhub-in-a-kubernetes-environment)

### elyra-on-openshift (Open Data Hub)
Elyra on OpenShift is available via Open Data Hub. Elyra Image is available via [quay.io](https://quay.io/repository/thoth-station/s2i-lab-elyra?tab=tags) and supporting image build files via [s2i-lab-elyra](https://github.com/opendatahub-io/s2i-lab-elyra)

### kubeflow (Open Data Hub)
Build the Elyra image for use with Kubeflow's Notebook Server. This image includes all kfp dependencies (i.e. kfp, kfp-tekton). See [Using Elyra with the Kubeflow Notebook Server](https://elyra.readthedocs.io/en/latest/recipes/using-elyra-with-kubeflow-notebook-server.html)

