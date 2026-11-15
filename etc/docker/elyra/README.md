<!--
{% comment %}
Copyright 2018-2026 Elyra Authors

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

### Elyra Docker Image

Builds the Elyra image for use as standalone or with JupyterHub.

See [Deploying Elyra and JupyterHub in a Kubernetes environment](https://elyra.readthedocs.io/en/latest/recipes/deploying-elyra-in-a-jupyterhub-environment.html#deploying-elyra-jupyterhub-in-a-kubernetes-environment)

#### Building a custom container image

To build a custom version of this container image:
1. Clone this repository.
1. [Optional] Add custom Python package requirements to `requirements.txt` in the `etc/docker/elyra` directory.
1. Build the image using the `Dockerfile`:
  - (Option 1) In the repository root directory run `make elyra-image TAG=3.X.X` to build with Elyra version `3.X.X`
  - (Option 2) In the repository root directory run `make elyra-image TAG=dev` to build with Elyra from your local source
1. The container image is automatically tagged with `elyra/elyra:$TAG` and `quay.io/elyra/elyra:$TAG`
1. Validate the image with `make validate-elyra-image TAG=$TAG` (or `image=<name>` for any other image).
   This checks that Elyra, its lab extensions and its server extension are installed in the
   image's system environment, and still load when an empty volume is mounted on the home
   directory, as JupyterHub user storage does. It also checks that the image's default
   command starts a Jupyter server.

Packages are installed as `root`, so they go into the image's system environment. Installed as
`jovyan`, pip falls back to `~/.local`, which a home directory volume hides
([#3453](https://github.com/elyra-ai/elyra/issues/3453)). Follow the same pattern when adding
packages to a derived image.
