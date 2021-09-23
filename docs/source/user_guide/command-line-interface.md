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

## Command line interface

The Elyra command line interface (CLI) allows you to [manage metadata](#managing-metadata) and [work with pipelines](#working-with-pipelines).

The CLI is part of the Elyra installation and can be used without a running JupyterLab instance.

### Managing metadata

In Elyra, information such as a [runtime configuration](runtime-conf.md) or a [runtime image](runtime-image-conf) is considered metadata. `elyra-metadata` is used to list, create, update, or delete metadata.

#### Getting help

To display the list of commands that `elyra-metadata` supports, run

```
$ elyra-metadata -h
```

To learn more about a specific command, e.g. `list`, run
```
$ elyra-metadata list -h
```

#### Formatting list output

By default the `list` command displays the results in a user-friendly format. 

```
$ elyra-metadata list runtime-images
Available metadata instances for runtime-images (includes invalid):

Schema          Instance    Resource
------          --------    --------
runtime-image   anaconda    .../runtime-images/anaconda.json
```

Specify the `--json` parameter to return the results in JSON to allow for programmatic processing, e.g. using [`jq`](https://stedolan.github.io/jq/). 

```
$ elyra-metadata list runtime-images --json | jq ".[].display_name"
"Tensorflow 1.15.2"
"Tensorflow 1.15.2 with GPU"
"R Script"
"Anaconda (2020.07) with Python 3.x"
"Tensorflow 2.3.0"
"Pandas 1.1.1"
"Pytorch 1.4 with CUDA-devel"
"Tensorflow 2.3.0 with GPU"
"Pytorch 1.4 with CUDA-runtime"
"Pandas on quay.io"

```

#### List, create, update, and delete metadata

Refer to the topics below for detailed information on how to use `elyra-metadata` to
 - [Manage code snippets](code-snippets.html#managing-code-snippets-using-the-elyra-cli)
 - [Manage runtime configurations](runtime-conf.html#managing-runtime-configurations-using-the-elyra-cli)
 - [Manage runtime images](runtime-image-conf.html#managing-runtime-images-with-the-command-line-interface)
 - [Manage pipeline components](pipeline-components.html#managing-custom-components-using-the-elyra-cli)

### Working with pipelines

In Elyra, [a pipeline](pipelines.md) is a representation of a
workflow that you run locally or remotely on Kubeflow Pipelines or Apache Airflow.

#### Getting help

To display the list of commands that `elyra-pipeline` supports, run

```
$ elyra-pipeline --help
```

To learn more about a specific command, e.g. `run`, run
```
$ elyra-pipeline run --help
```

#### Running pipelines

Refer to the topics below for detailed information on how to use `elyra-pipeline` to
 - [Display pipeline information summary](pipelines.html#running-a-pipeline-using-the-command-line)
 - [Run a pipeline locally](pipelines.html#running-a-pipeline-using-the-command-line)
 - [Submit a pipeline for remote execution](pipelines.html#running-a-pipeline-using-the-command-line)
