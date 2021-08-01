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
## Development Workflow
This section describes the steps necessary to build Elyra in a development environment. 

#### Requirements

* [Python 3 Miniconda](https://docs.conda.io/en/latest/miniconda.html)
* [NodeJS 12+](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/lang/en/docs/install)

### Setting up your development environment

* Install Miniconda
Download and install a [Python 3 version of Miniconda](https://docs.conda.io/en/latest/miniconda.html) according to your Operating System

* Create a new Python environment

    ```
    conda create -n <env-name> python
    ```

    The python version of your environment will match the miniconda version you installed. You can override the default by explicitly setting `python=3.7`, for example.

* Activate the new environment

    ```
    conda activate <env-name>
    ```

* Verify your miniconda environment

    ```
    python --version
    which python # Displays current python path
    pip3 --version
    which pip3
    ```
    Python path must be under miniconda envs folder.
    Confirm pip3 location matches where miniconda is installed.

* Install NodeJS

    ```
    conda install -y -c conda-forge/label/main nodejs
    ```

### Setting up your Elyra Github repository

* Fork the [Elyra Github repository](https://github.com/elyra-ai/elyra) (if you haven't already)

* Make a local copy of Elyra fork
    ```
    git clone https://github.com/<your-github-id>/elyra.git
    cd elyra
    ```
* Set `upstream` as described in the [GitHub documentation](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/configuring-a-remote-for-a-fork)

### Building
Elyra is divided in two parts, a collection of Jupyter Notebook backend extensions,
and their respective JupyterLab UI extensions. Our JupyterLab extensions are located in our `packages`
directory. 

#### Build & Installation

Elyra uses `make` to automate some of the development workflow tasks.

Issuing a `make` command with no task specified will provide a list of the currently supported tasks.

```bash
$ make

clean                          Make a clean source tree and uninstall extensions
container-images               Build all container images
docs                           Build docs
install-server                 Build and install backend only
install                        Build and install
lint                           Run linters
publish-container-images       Publish all container images
release                        Build wheel file for release
test                           Run all tests (backend, frontend and cypress integration tests)
watch                          Watch packages. For use alongside jupyter lab --watch
```

You can build and install all Elyra packages with:

```bash
make clean install
```

You can check that the notebook server extension was successfully installed with:
```bash
jupyter serverextension list
```

You can check that the JupyterLab extension was successfully installed with:
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

#### Parallel Development with @elyra/pipeline-editor

You can install Elyra using a local build of @elyra/pipeline-editor with:
```bash
make clean dev-link install
```

### Back-end Development
After making code changes to the back-end, you can re-build Elyra's Python package with:

```bash
make install-server
```

This command builds and installs the updated  Python package independently, skipping any UI component build.

Restart JupyterLab to pick up the new code changes.

### Front-end Incremental Development

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
make elyra-image
```

By default, the command above will build a container image from the tip of the repository master branch.

In order to build from a particular release, you can pass a `TAG` parameter to the make command as below:

```bash
make elyra-image TAG=2.2.1
```

Official container images are published on [Docker Hub](https://hub.docker.com/r/elyra/elyra/tags)
and [quay.io](https://quay.io/repository/elyra/elyra?tab=tags).
