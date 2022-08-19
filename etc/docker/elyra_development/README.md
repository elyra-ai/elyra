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

### Elyra Development Container Image

Builds an Elyra development workspace image. This image provides all the necessary libraries and frameworks to build and test
Elyra changes. 

#### Building the image

To build a custom version of this container image:
1. Clone this repository
   ```
   $ git clone https://github.com/elyra-ai/elyra.git
   ```
1. [Optional] Add custom Python package requirements to `requirements.yml` in the `path_to_elyra_repo_root/etc/docker/elyra_development` directory.

1. Build the image using the `Dockerfile` in the `path_to_elyra_repo_root/etc/docker/elyra_development` directory, replacing the `<path_to_elyra_repo_root>`, `<image_name>`, and `<tag>` placeholders as appropriate.
   ```
   $ docker build -t <image_name>:<tag> <path_to_elyra_repo_root>/etc/docker/elyra_development/
   ``` 

#### Using this image
This image mounts your local Elyra repository into a directory in the image (`/dev/elyra`) so all changes are persisted. 

In a terminal window run the following command, replacing the `<image_name>`, `<tag>`, and `<host_fs_elyra_repo>` placeholders as appropriate.

```
$ docker run -v <host_fs_elyra_repo>:/dev/elyra -p 8888:8888 -it <image_name>:<tag>
```

**Example**

Assuming the container image was built and named `test_user/elyra-environment:dev` and 
the cloned Elyra repository is located at `/path_to_elyra_repo_root`, run

```
$ docker run -v /path_to_elyra_repo_root:/dev/elyra -p 8888:8888 -it test_user/elyra-environment:dev
```

#### Starting Elyra in the container
Once inside the container, after building with your changes in Elyra, start JupyterLab with:
```bash
$ jupyter lab --allow-root --ip=0.0.0.0 --debug
```
