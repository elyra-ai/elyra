<!--
{% comment %}
Copyright 2020 IBM Corporation

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
## Runtime Image Configuration

A runtime image configuration identifies a container image that Elyra can utilize to run Jupyter notebooks on a container platform, such as Kubernetes.

### Prerequisites

A runtime image configuration is associated with a container image that must meet these prerequisites:

- The image must be stored in a public container registry (no authentication required) (e.g. [https://hub.docker.com](https://hub.docker.com)).
- The image must have a current `Python 3` version pre-installed and in the search path.
- The image must have `curl` pre-installed and in the search path.

Refer to [Creating a custom runtime container image](/recipes/creating-a-custom-runtime-image.md) for details.

### Managing Runtime Image Configurations

Runtime image configurations can be managed with the _Runtime Images_ user interface or the `elyra-metadata` command line interface. 

User-managed runtime image configurations are stored as JSON files in your local Jupyter Data directory under the `metadata/runtime-images` subdirectory.  Run `jupyter --data-dir` in a terminal window to identify the location of the data directory in your environment:

```bash
$ jupyter --data-dir
/Users/jdoe/Library/Jupyter
```

#### Managing Runtime Images with the User Interface

Runtime image configurations can be added, modified, and removed in the _Runtime Images_ panel.

To access the panel in JupyterLab:

- Open the JupyterLab command palette (`<cmd/ctrl><shift><c>`).
- Click `Show Runtime Images` in the `Elyra` section.

![Runtime Images UI](../images/runtime-images-ui.png)

To add a runtime image configuration:

- Click `+` to add a runtime image.
- Add the runtime image properties as appropriate.

To edit a runtime image configuration:

- Click the `edit` icon next to the runtime image name.
- Modify the runtime image properties as desired.

To delete a runtime image configuration:

- Click the `delete` icon next to the runtime image name.
- Confirm deletion.

#### Managing Runtime Images with the Command Line Interface

Runtime image configurations can be added, replaced, and removed with the `elyra-metadata` command line interface.

To list runtime image configurations:

```bash
$ elyra-metadata list runtime-images

Available metadata instances for runtime-images (includes invalid):

Schema          Instance               Resource                                                                                                       
------          --------               --------                                                                                                       
runtime-image   anaconda               /Users/jdoe/.../jupyter/metadata/runtime-images/anaconda.json
...  
```

To add a runtime image configuration for the public `jdoe/my-image:1.0.0` container image:

```bash
$ elyra-metadata install runtime-images --schema_name=runtime-image \
       --name="my_image_name" \
       --display_name="My runtime image" \
       --description="My custom runtime container image" \
       --image_name="jdoe/my-image:1.0.0"
```

To replace a runtime image configuration append the `--replace` option:

```bash
$ elyra-metadata install runtime-images --schema_name=runtime-image \
       --name="my_image_name" \
       --display_name="My runtime image" \
       --description="My other custom runtime container image" \
       --image_name="jdoe/my-other-image:1.0.1" \
       --replace
```

To delete a runtime image configuration:

```bash
$ elyra-metadata remove runtime-images \
       --name="my_image_name"
```

#### Configuration properties

The runtime image configuration properties are defined as follows. The string in the headings below, which is enclosed in parentheses, denotes the CLI option name.

##### Name (display_name)

A user-friendly name for runtime image configuration. This property is required.

Example: `My runtime image`

##### Description (description)

Description for this runtime image configuration.

Example: `My custom runtime container image`

##### Image Name (image_name)

The name and tag of an existing container image in a public container registry that meets the stated prerequisites. This property is required.

Example:

- `jdoe/my-image:1.0.0`

Providing only `owner/image:tag` uses default registry: Docker Hub registry

In general for other public container registries, the URL shall contain also `registry`, therefore the complete URL to be used in this case is: `registry/owner/image:tag`

Example:

- `quay.io/jdoe/my-image:1.0.0`

##### N/A (name)

A unique internal identifier for the runtime image configuration. The property is required when the command line interface is used manage a configuration. An identifier is automatically generated from the user-friendly name when a configuration is added using the UI.

Example: `my_runtime_image`
