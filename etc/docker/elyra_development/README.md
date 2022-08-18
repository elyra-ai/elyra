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

### Elyra Development Docker Image

Builds an Elyra development workspace image. This image provides all the necessary libraries and frameworks to build and test
Elyra changes. 

#### Building the image

To build a custom version of this container image:
1. Clone this repository
   - `git clone https://github.com/elyra-ai/elyra`
1. [Optional] Add custom Python package requirements to `requirements.yml` in the `path_to_elyra_repo_root/etc/docker/elyra_development` directory.

1. Build the image using the `Dockerfile`:
  - `docker build -t image_name:tag path_to_elyra_repo_root/etc/docker/elyra_development/` 

#### Using this image
This image mounts your local Elyra repository into a directory in the image (`/dev/elyra`) so all changes are persisted. 
1. Run in terminal
  - `docker run -t image_name:tag -v <host_fs_elyra_repo>:/dev/elyra -p 8888:8888`
1. Example :
  - Image was built and named `test_user/elyra-environment:dev`
  - The cloned elyra repository is located at `/path_to_elyra_repo_root`
  - `docker run -t test_user/elyra-environment:dev -v /path_to_elyra_repo_root:/dev/elyra -p 8888:8888`