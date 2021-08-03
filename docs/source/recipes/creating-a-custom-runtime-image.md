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

# Creating a custom runtime container image

A runtime image provides the execution environment in which nodes are executed when a Jupyter notebook is processed as part of a pipeline. Elyra includes a number of runtime images for popular configurations, such as TensorFlow or Pytorch.

Should none of these images meet your needs, you can utilize a custom container image, as long as it meets the following pre-requisites:

- The image is stored in a container registry in a public or private network that the container platform in which the pipeline is executed can connect to. Examples of such registries are [hub.docker.com](https://hub.docker.com) or a self-managed registry in an intranet environment.
- The image can be pulled from the registry without the need to authenticate. 
- [Python 3](https://www.python.org/) is pre-installed and in the search path. Python versions that have reached their "end of life" are not supported.
- [`curl`](https://curl.haxx.se/) is pre-installed and in the search path.

Refer to the [Additional considerations](#additional-considerations) section for important implementation details.

## Requirements

To create a custom container image and publish it on [hub.docker.com](https://hub.docker.com) you need

- Docker Desktop
    - Available for [MacOS](https://hub.docker.com/editions/community/docker-ce-desktop-mac) and 
                    [Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows)
- A Docker id at [https://hub.docker.com/](https://hub.docker.com).

## Creating a basic Python runtime container image

The [default Python 3 Docker image](https://hub.docker.com/_/python) has Python and `curl` pre-installed and it is therefore a good starting point.

1. Create a file named `Dockerfile` and add the following content.

   ```
   FROM python:3

   COPY requirements.txt ./
   RUN pip3 install --no-cache-dir -r requirements.txt
   ```

   When you create a container image using this `Dockerfile` the [default Python 3 Docker image](https://hub.docker.com/_/python) is loaded and the requirements listed in `requirements.txt` `pip`-installed.

1. in the same directory create a `requirements.txt` file and add the packages your notebooks depend on. For example, if your notebooks require the latest version of `Pandas` and `Numpy`,  add the appropriate package names.

   ```
   pandas
   numpy
   ```

   Note: If your notebooks require packages that are not pre-installed on this image they need to `pip`-install them explicitly.

1. Open a terminal to the location where you've created the `Dockerfile` and `requirements.txt`.

## Using Docker

1. Build the container image by running the [`docker build`](https://docs.docker.com/engine/reference/commandline/build/) command in the terminal window, replacing `my-runtime-image` with the desired Docker image name.

   ```bash
   docker build -t my-runtime-image .
   ```

## Publishing the basic runtime container image

When a notebook is processed as part of a pipeline the associated container image is downloaded from the container registry stated in the URL of the image.

For example, the following steps publish the container image you've just created on [Docker Hub](https://hub.docker.com) using docker.

1. Log in to Docker Hub using [`docker login`](https://docs.docker.com/engine/reference/commandline/login/) and provide your Docker id and password.

   ```bash
   docker login
   ```

1. Run [`docker images`](https://docs.docker.com/engine/reference/commandline/images/) and locate the image id for your Docker image. The image id uniquely identifies your Docker image.

    ```bash
    docker images

    REPOSITORY         TAG      IMAGE ID            CREATED             SIZE 
    my-runtime-image   latest   0d1bd98fdd84        2 hours ago         887MB
    ```

1. Tag the container image using [`docker tag`](https://docs.docker.com/engine/reference/commandline/tag/), replacing `my-image-id`, `docker-id-or-org-id`, and `my-runtime-image` as necessary. (`docker-id-or-org-id` is either your Docker id or, if you are a member of a team in an organization, the id of that organization.)

   ```bash
   docker tag my-image-id docker-id-or-org-id/my-runtime-image:latest
   ```

   Note: For illustrative purposes this image is tagged `latest`, which makes it the default image. If desired, replace the tag with a specific version number or identifier, such as `Vx.y.z`.

1. Publish the container image on Docker Hub by running [`docker push`](https://docs.docker.com/engine/reference/commandline/push/), replacing `docker-id-or-org-id` and `my-runtime-image` as necessary.

    ```bash
    docker push docker-id-or-org-id/my-runtime-image:latest
    ```

Once the image is published on Docker Hub you can [create a runtime image configuration using the Elyra UI or `elyra-metadata` CLI](/user_guide/runtime-image-conf.md) and reference the published `docker-id-or-org-id/my-runtime-image:latest` Docker image.

## Additional Considerations

Prior to notebook processing Elyra modifies the associated container by changing the default execution command and installing additional packages.
Please review the following section if

- your Dockerfile [includes a CMD instruction](#dockerfiles-with-cmd-instructions)
- your Dockerfile [includes an ENTRYPOINT instruction](#dockerfiles-with-entrypoint-instructions)
- your package requirements [include pinned versions](#conflicting-package-dependencies)

### Dockerfiles with CMD instructions

If a `Dockerfile` includes a [`CMD`](https://docs.docker.com/engine/reference/builder/#cmd) instruction, which is used to specify defaults for an executing container, you might have to customize your notebooks. When a notebook is processed as part of a pipeline the `CMD` instruction is overriden, which might have side effects. The following examples illustrate two scenarios.

#### Scenario 1 - override has no side-effects

The `CMD` instruction launches an application that does not need to be running when the notebook is executed. For example, the official Python container images might launch the interactive Python shell by default, like so:

```bash
...
CMD ["python3"]
```

Notebooks will work as is because Python is explicitly run during notebook processing.

#### Scenario 2 - override has side-effects

The `CMD` instruction launches an application or service that a notebook consumes. For example, a container image might by default launch an application that provides computational (or connectivity) services that notebooks rely on.

```bash
...
CMD ["python3", "/path/to/application-or-service"]
```

When the container started to process a notebook, the referenced application is unavailable because it wasn't automatically started. If feasible, the notebook could launch the application in the background in a code cell like so:

```python
import os
import time
# launch application in the background
os.system("python /path/to/application-or-service &")
# wait to allow for application initialization
time.sleep(2)
```

### Dockerfiles with ENTRYPOINT instructions

If a container is configured to run as an executable by using the  [`ENTRYPOINT`]( https://docs.docker.com/engine/reference/builder/#entrypoint) instruction in the `Dockerfile`, you likely have to customize your notebook. 

#### Scenario 1 - override has side-effects

The `ENTRYPOINT` instruction launches an application or service that a notebook consumes.

```bash
ENTRYPOINT ["python3", "/path/to/application-or-service"]
```

When the container is launched to process a notebook the application or service is unavailable because it wasn't automatically started. If feasible, the notebook could launch the application or service in the background in a code cell like so:

```python
import os
import time
# launch application in the background
os.system("python /path/to/application-or-service &")
# wait to allow for application initialization
time.sleep(2)
```

### Conflicting package dependencies

Elyra installs additional packages in the container prior to notebook processing. If a pre-installed package is not compatible with the version requirements defined in [requirements-elyra.txt](https://github.com/elyra-ai/elyra/blob/master/etc/generic/requirements-elyra.txt), it is replaced. You should review any version discrepancies as they might lead to unexpected processing results.
