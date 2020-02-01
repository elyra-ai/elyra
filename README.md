<!--
{% comment %}
Copyright 2018-2020 IBM Corporation

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

# Elyra

Elyra is a set of AI-centric extensions to JupyterLab Notebooks.

Elyra currently includes:
* Notebook Pipelines visual editor
* Ability to run notebook as batch jobs
* Hybrid runtime support (based on Jupyter Enterprise gateway)
* Python Script execution capabilities within the editor
* Notebook versioning based on git integration
* Notebook navigation using auto-generated **Table of Contents**
* Reusable Configuration for runtimes

![Elyra](docs/source/images/ai-workspace.png)


#### Notebook Pipelines visual editor

Building an AI pipeline for a model is hard, breaking down and modularizing a pipeline is harder.
A typical machine/deep learning pipeline begins as a series of preprocessing steps followed by
experimentation/optimization and finally deployment. Each of these steps represent a challenge in
implementation, execution, scheduling and operation when bringing deep learning models from
development to production.

Elyra provides a **Notebook Pipeline visual editor** for building Notebook-based AI pipelines,
simplifying the conversion of multiple notebooks into batch jobs or workflow.

Currently the only supported pipeline runtime is
[**Kubeflow Pipelines**](https://www.kubeflow.org/docs/pipelines/overview/pipelines-overview/),
but others can be easily added.

![Notebook Pipeline Editor](docs/source/images/pipeline-editor.png)

The pipeline visual editor also enables detailed customization of your pipeline, enabling
users to choose which docker image to use when executing your notebook, setup environment
variables required to properly run your notebook, as well as configuring dependency files 
that needs to be flown to child notebooks.

![Notebook Pipeline Editor - Node Properties](docs/source/images/pipeline-editor-properties.png)

#### Ability to run notebook as batch jobs

Elyra also extends the notebook UI to simplify the submission of a single notebook as a batch job

![Submit Notebook as batch jobs](docs/source/images/submit-notebook-batch-job.gif)

#### Hybrid runtime support

Elyra leverages the work that we’ve done with Jupyter Enterprise Gateway to enable Jupyter Notebooks
to share resources across distributed clusters such as Apache Spark, Kubernetes, OpenShift, and the like. 

It simplifies the task of running the notebooks interactively on cloud machines, improving productivity
by leveraging the power of cloud-based resources that enable the use of specialized hardware such as GPUs and TPUs. 

#### Python script execution support

Elyra provides **Enhanced Python Support** where Python scripts can be developed and
executed. It also leverages the **Hybrid Runtime Support** to enable running
these scripts either locally or in remote environments.

![Enhanced Python Support](docs/source/images/python-runner.png)

#### Notebook versioning based on git integration

The integrated support for git repositories simplify tracking changes, allowing rollback to working versions
of the code, backups and, most importantly, sharing among team members - fostering productivity by
enabling a collaborative working environment.

![Git Integration](docs/source/images/git.png)

#### Notebook navigation using auto-generated **Table of Contents**

The enhanced notebook navigation looks into **markdown** titles, subtitles, etc to auto-generate
a Notebook **Table of Contents** and provide enhanced navigation capabilities. 

![Notebook Table of Contents](docs/source/images/notebook-toc.png)

#### Reusable Configuration for runtimes

Elyra introduces a 'shared configuration service' that simplify workspace configuration management,
enabling things like information around accessing external runtimes to be configured once and shared
across multiple components.  

----

## Installation
Elyra can be installed via PyPi or via Docker

### Prerequisites :
* [NodeJS](https://nodejs.org/en/)
* Python 3.X
* [Elyra Metadata Runtime](#configuring-runtime-metadata)
##### Optional :
* [Anaconda](https://www.anaconda.com/distribution/) 
* [Docker](https://docs.docker.com/install//) - If using the docker image

To Install Elyra:

via PyPi:
```bash
pip install elyra && jupyter lab build
```
via Docker:
```bash
 docker run -it -p 8888:8888 -v [LOCAL METADATA RUNTIME DIR]:/home/jovyan/.local/share/jupyter/metadata/runtime 
                             -v [LOCAL NOTEBOOK DIR]:/opt/work elyra/elyra:dev
```

## Runtime Configuration

### Prerequisites
* A Kubeflow Pipelines Endpoint
* IBM Cloud Object Storage or other S3 Based Object Store (Optional)

### Configuring Runtime Metadata
**AI Pipelines** requires configuring a pipeline runtime to enable its full potential. 
AI Pipelines currently only supports `Kubeflow Pipelines` with plans to expand to support other runtimes
in the future.

To configure runtime metadata for `Kubeflow Pipelines` use the `jupyter runtime install kfp` command providing appropriate options.  This command will create a json file in your local Jupyter Data directory under its `metadata/runtime` subdirectories.  If not known, the Jupyter Data directory can be discovered by issuing a ```jupyter --data-dir```
command on your terminal.

Here's an example invocation of `jupyter runtime install kfp` to create runtime metadata for use by `Kubeflow Pipelines` corresponding to the example values in the table below. Following its invocation, a file containing the runtime metadata can be found in `[JUPYTER DATA DIR]/metadata/runtime/my_kfp.json`.
```bash
jupyter runtime install kfp --name=my_kfp \
       --display_name="My Kubeflow Pipeline Runtime" \
       --api_endpoint=https://kubernetes-service.ibm.com/pipeline \
       --cos_endpoint=minio-service.kubeflow:9000 \
       --cos_username=minio \
       --cos_password=minio123 \
       --cos_bucket=test_bucket
```
This produces the following content in `my_kfp.json`:
```json
{
    "display_name": "My Kubeflow Pipeline Runtime",
    "schema_name": "kfp",
    "metadata": {
        "api_endpoint": "https://kubernetes-service.ibm.com/pipeline",
        "cos_endpoint": "minio-service.kubeflow:9000",
        "cos_bucket": "test_bucket",
        "cos_username": "minio",
        "cos_password": "minio123"
    }
}
```
To validate your new configuration is available, run:
```bash
jupyter runtime list

Available metadata for external runtimes:
  my_kfp    /Users/jdoe/Library/Jupyter/metadata/runtime/my_kfp.json
```

Existing runtime metadata configurations can be removed via `jupyter runtime remove --name=[runtime]`:
```bash
jupyter runtime remove --name=my_kfp
```

`Elyra` depends on its `Metadata Runtime` to determine how to communicate with your KubeFlow Pipelines
Server and with your chosen Object Store to store artifacts.   

|Parameter   | Description  | Example |
|:---:|:------|:---:|
|api_endpoint| The KubeFlow Pipelines API Endpoint you wish to run your Pipeline. |  `https://kubernetes-service.ibm.com/pipeline`   |
|cos_endpoint| This should be the URL address of your S3 Object Storage. If running an Object Storage Service within a kubernetes cluster (Minio), you can use the kubernetes local DNS address.   | `minio-service.kubeflow:9000` |
|cos_username| Username used to access the Object Store. SEE NOTE. | `minio` |
|cos_password| Password used to access the Object Store. SEE NOTE. | `minio123` |
|cos_bucket|   Name of the bucket you want your artifacts in. If the bucket doesn't exist, it will be created| `test_bucket` |

NOTE: If using IBM Cloud Object Storage, you must generate a set of [HMAC Credentials](https://cloud.ibm.com/docs/services/cloud-object-storage/hmac?topic=cloud-object-storage-hmac) 
and grant that key at least [Writer](https://cloud.ibm.com/docs/services/cloud-object-storage/iam?topic=cloud-object-storage-iam-bucket-permissions) level privileges.
Your `access_key_id` and `secret_access_key` will be used as your `cos_username` and `cos_password` respectively.

## Development Workflow
### Building

`Elyra` is divided in two parts, a collection of Jupyter Notebook backend extensions,
and their respective JupyterLab UI extensions. Our JupyterLab extensions are located in our `packages`
directory. 

#### Requirements

* [Yarn](https://yarnpkg.com/lang/en/docs/install) 

#### Installation

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

## Building a Docker Image

Prequisites :  
* Docker v18.09 Installed or higher

```bash
make docker-image
```
