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

### Elyra notebook container image for use with Kubeflow's Notebook Server

This `Dockerfile` is used to build an Elyra notebook image that can be launched by [Kubeflow's Notebook Server](https://www.kubeflow.org/docs/components/notebooks/). Ready-to-use  container images are published on [Docker Hub](https://hub.docker.com/r/elyra/kf-notebook) and [quay.io](https://quay.io/repository/elyra/kf-notebook). Refer to [the documentation](https://elyra.readthedocs.io/en/latest/recipes/using-elyra-with-kubeflow-notebook-server.html) for details.

#### Building a custom container image

To build a custom version of this container image:
- Clone this repository.
- Update the requirements in `etc/docker/kubeflow/requirements.txt`.
- Run `make kf-notebook-image` in the root directory of this repository.

> The container image is automatically tagged with `elyra/kf-notebook:3.2.2` and `quay.io/elyra/kf-notebook:3.2.2`.
