<!--
{% comment %}
Copyright 2018-2020 Elyra Authors

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
## Development Workflow
This section describes the steps necessary to build Elyra in a development environment. 

### Building
Elyra is divided in two parts, a collection of Jupyter Notebook backend extensions,
and their respective JupyterLab UI extensions. Our JupyterLab extensions are located in our `packages`
directory. 

#### Requirements

* [Yarn](https://yarnpkg.com/lang/en/docs/install) 

#### Build & Installation

Elyra uses make to automate some of the development workflow tasks.

Issuing a make command with no task specified will provide a list of the currently supported tasks.

```bash
$ make

build-server                   Build backend
build-ui                       Build packages
clean                          Make a clean source tree and uninstall extensions
docker-image                   Build docker image
docs                           Build docs
install-server                 Install backend
install                        Build and install
lint                           Run linters
release                        Build wheel file for release
test-server                    Run unit tests
test-ui                        Run frontend tests
test                           Run all tests
validate-runtime-images        Validates delivered runtime-images meet minimum criteria
watch                          Watch packages. For use alongside jupyter lab --watch
```

You can build and install all Elyra packages with:

```bash
make clean install
```

You can check that the notebook server extension was successful installed with:
```bash
jupyter serverextension list
```

You can check that the JupyterLab extension was successful installed with:
```bash
jupyter labextension list
```

> NOTE: 
When switching between Elyra major versions, it is recommended to clean your JupyterLab environment before a build.
The `clean-jupyterlab` removes your JupyterLab packages and completely deletes your Jupyter workspace.
Make sure to backup any important data in your environment before running the script.
To clean your environment and install the latest JupyterLab:
`etc/scripts/clean-jupyterlab.sh`
To specify a JupyterLab version to be installed:
`etc/scripts/clean-jupyterlab.sh --version 2.2.9`

### Incremental Development

Elyra supports incremental development using `--watch`. This allows you to make code changes to
front-end packages and see them without running `make install` again.

After installation run the following to watch for code changes and rebuild automatically:
```bash
make watch
```

Then in a separate terminal, using the same Python environment, start JupyterLab in watch mode:
```bash
jupyter lab --watch
```

When in watch mode JupyterLab will watch for changes in the build of each package and rebuild.
To see your changes just refresh JupyterLab in your browser.

> NOTE: JupyterLab watch mode will not pick up changes in package dependencies like `services`.
So when making changes to services you will need to stop and restart `jupyter lab --watch` and
not just refresh your browser.

### Building the Elyra Container Image

Elyra's container image can be built using:

```bash
make docker-image
```

Official container images are published on [Docker Hub](https://hub.docker.com/r/elyra/elyra/tags) and [quay.io](https://quay.io/repository/elyra/elyra?tab=tags).
