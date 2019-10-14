<!--
{% comment %}
Copyright 2018-2019 IBM Corporation

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

# Enterprise Workspace for AI

Enterprise Workspace for AI aims to do for AI model development, what the
Eclipse IDE did for Java in the early 2000s. It extends the JupyterLab Notebook
platform with an Enterprise AI centric approach.

![Enterprise Workspace for AI](docs/source/images/ai-workspace.png)


An **AI Pipeline** visual editor is also available and can be used to chain notebooks
together. Currently the only supported pipeline runtime is **Kubeflow Pipelines**,
but others can be easily added.

![Pipeline Editor](docs/source/images/pipeline-editor.png)

The pipeline visual editor also enables detailed customization of your pipeline, enabling
users to choose which docker image to use when executing your notebook, setup environment
variables required to properly run your notebook, as well as configuring dependency files 
that needs to be flown to child notebooks.

![Pipeline Editor - Node Properties](docs/source/images/pipeline-editor-properties.png)

It provides **Enhanced Python Support** where Python scripts can be developed and
executed. It also leverages the **Hybrid Runtime Support** to enable running
these scripts either locally or in remote environments.

![Enhanced Python Support](docs/source/images/python-runner.png)

Native Integration with **Git and GitHub** enables seamless versioning for your Notebooks and
Python Scripts.

![Git Integration](docs/source/images/git.png)

A metada service provides the ability to configure runtimes, data sources and other
additional configurations required to tie all these components together and easily
enable portability of the workspace.

## Build and Configurations

### Configuring IBM internal repositories

#### Artifactory NPM

1. Login to
        [AI-WORKSPACE ARTIFACTORY](https://na.artifactory.swg-devops.com/artifactory/webapp/#/home)
2. Click on upper right corner on your email
3. Click on the gear to generate your API Key
4. On your MacMook run  

       npm config set registry https://na.artifactory.swg-devops.com/artifactory/api/npm/wcp-wdp-npm-virtual/
5. and
       curl -u [email]:[api-key] https://na.artifactory.swg-devops.com/artifactory/api/npm/dbg-aiw-npm-virtual/
6. Run following and copy output to clipboard

       curl -u [email]:[api-key] https://na.artifactory.swg-devops.com/artifactory/api/npm/auth >> ~/.npmrc

After all these commands, your ```~/.npmrc``` file should look like

```bash
registry=https://na.artifactory.swg-devops.com/artifactory/api/npm/wcp-wdp-npm-virtual/
_auth=XXXXXXXXXXXXXXXXXXXXXX
always-auth=true
email=XXXXXXXX@us.ibm.com
```

#### Artifactory PyPi

Create a pipy configuration file ```~/.pip/pip.conf``` with the following content:

```bash
[global]
index-url = https://pypi.org/simple/
extra-index-url = https://[email]:[api-key]@na.artifactory.swg-devops.com/artifactory/api/pypi/dbg-aiworkspace-team-pypi-local/simple
```

Note that ```[email]``` should be replaced by your encoded IBM e-mail address (e.g. %40 encodes @) and
```[api-key]``` should be replaced by the artifactory API Key found on your Artifactory profile page
and generated in the [Artifactory NPM step](README.md#Artifactory-NPM).

### Installing Node.js

Many Jupyter projects, including JupyterLab, require Node.js to build locally.

To install Node.js download and run the latest installer file from the [Node.js website](https://nodejs.org/en/) and follow the on screen instructions.

### Installing npm build packages

A few npm packages are required for properly building the AI Workspace project:

```bash
npm config set scripts-prepend-node-path auto
npm install -g yarn
```


### Building

This extension is divided in two parts, a backend Jupyter Notebook backend extension,
and a JupyterLab UI extension. Use the make command below to build and install all 
required components. 

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

## Runtime Configuration

### Configuring Runtime Metadata

The **AI Pipelines** requires configuring a pipeline runtime to enable its full potential.
There is a shared **Kubeflow Pipeline** test system that the team uses for test and demo
purposes, and to configure your system to use it, follow the steps below:

- Navigate to your local Jupyter config folder that can be discovered by issuing the a ```jupyter --data-dir```
command on your terminal.
- In metadata/runtime folder, create a new file named **kfp.json** 
with the following content:
```
{
  "display_name": "Kubeflow Pipeline",
  "metadata": {
    "api_endpoint": "http://weakish1.fyre.ibm.com:32488/pipeline",
    "cos_endpoint": "http://weakish1.fyre.ibm.com:30427",
    "cos_username": "minio",
    "cos_password": "minio123",
    "cos_bucket": "<<<ENTER A VALID BUCKET NAME>>>"
  }
}
```

- To validate your new configuration, run:
```bash
make clean install
```
followed by
```bash
jupyter runtime list
```

## Building a Docker Image

Prequisites :  
* Docker v18.09 Installed or higher.
* [NPM Configured for IBM Artifactory](#artifactory-npm)  
* [Pip Configured for IBM Artifactory](#artifactory-pypi)


```bash
make docker-image
```

## Pushing and Pulling from IBM Container Registry

Ensure you have the IBM Cloud CLI installed on your system. Install Instructions are [HERE](https://cloud.ibm.com/docs/cli?topic=cloud-cli-getting-started)

Login with your IBM id and make sure to select the Developer Advocate Account:
```bash
ibmcloud login --sso
```
Set your region and login to the registry:
```bash
ibmcloud cr region-set us-south
ibmcloud cr login
```

### Pushing
Rename the image you want then push to the following docker schema:
```bash
docker tag [local image to push] us.icr.io/tommychaopingli/[local image to push]
docker push  us.icr.io/tommychaopingli/[local image to push]

Example:
docker tag akchin/ai-workspace:test us.icr.io/tommychaopingli/ai-workspace:test
```
NOTE: We are using the `tommychaopingli` namespace because the account quota is maxed out for namespaces.
### Pulling

```bash
docker pull us.icr.io/tommychaopingli/[image to pull]

Example:
docker pull us.icr.io/tommychaopingli/ai-workspace:test
```

## KFP Notebook Python Package

[KFP Notebook Github](https://github.ibm.com/ai-workspace/kfp-notebook)  
[KFP Notebook Python Package](https://na.artifactory.swg-devops.com/artifactory/webapp/#/artifacts/browse/tree/General/dbg-aiworkspace-team-pypi-local)

`KFP Notebook` is an NotebookOp that enables running notebooks as part of a Kubeflow Pipeline. AI Workspace uses this package to 
construct each of the components in a pipeline created in the `pipeline editor` and configures each with the 
information it needs to run each operation (Notebook Name, Dependencies, Object Storage Credentials, etc). 
KFP Notebook currently only supports S3 Object Storage and uses the Minio S3 Client.

### Metadata Configuration and Runtime
[Configure your Metadata Runtime](#runtime-configuration)  
KFP Notebook depends on the `Metadata Runtime` in AI Workspace to determine how to communicate with your KubeFlow Pipelines
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

### Integration with KubeFlow Pipelines
The `KFP Notebook` package contains a NotebookOp class that extends KubeFlow Pipeline's ContainerOp DSL. Allowing us 
to outfit any user provided image with the necessary frameworks to run a Jupyter Notebook. 
#### Storage  
`KFP Notebook` currently supports two Object Storage modes, Hybrid and Kubernetes.  
`Hybrid Mode` - AI Workspace is running locally on the user's workstation and is using a remote KubeFlow deployment to run their workloads.  
`Kubernetes Mode` - AI Workspace is running in a pod in a Kubernetes cluster.  
In `Hybrid Mode`, user credentials (username and password) are pulled from your local `metadata runtime` to be set as environmental
variables in the container image. 
In `Kubernetes Mode`, user credentials will be pulled from a Kubernetes `secrets` object and set as environmental variables in the
container image. 

### Kubernetes Secrets Configuration
When running in a pure Kubernetes environment (i.e. `Kubernetes Mode`), secrets are stored on the Kubernetes cluster
itself so users will need to [Create and Manage Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).


