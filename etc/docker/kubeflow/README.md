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

### Elyra Docker Image - Kubeflow Notebooks

This `Dockerfile` is used to build an Elyra notebook image that can be launched by [Kubeflow's Notebook Server](https://www.kubeflow.org/docs/components/notebooks/).

Ready-to-use container images are published on [Docker Hub](https://hub.docker.com/r/elyra/kf-notebook) and [quay.io](https://quay.io/repository/elyra/kf-notebook). 
Refer to [the documentation](https://elyra.readthedocs.io/en/latest/recipes/using-elyra-with-kubeflow-notebook-server.html) for details.

#### Building a custom container image

To build a custom version of this container image:
1. Clone this repository
2. Build the container image:
   - (Option 1) Build from official distributables: In the repository root directory run `make kf-notebook-image TAG=3.X.X` to create an image using the 3.X.X release from PyPI.
   - (Option 2) Build from local source: In the repository root directory run `make kf-notebook-image TAG=dev` _after_ running `make install` to build Elyra locally. 
3. The container image is automatically tagged with `elyra/kf-notebook:$TAG` and `quay.io/elyra/kf-notebook:$TAG`
