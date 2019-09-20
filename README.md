# Enterprise Workspace for AI

Enterprise Workspace for AI aims to do for AI model development, what the
Eclipse IDE did for Java in the early 2000s. It extends the JupyterLab Notebook
platform with an Enterprise AI centric approach.

![Enterprise Workspace for AI](docs/source/images/ai-workspaces.png)

It provides **Enhanced Python Support** where Python scripts can be developed and
executed. It also leverages the **Distributed Runtime Support** to enable running
these scripts in remote environments.

![Enhanced Python Support](docs/source/images/python-runner.png)

An **AI Pipeline** visual editor is also available and can be used to chain notebooks
together. Currently the only supported pipeline runtime supported is **Kubeflow Pipelines**,
but others can be easily added.

![Pipeline Editor](docs/source/images/pipeline-editor.png)

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

