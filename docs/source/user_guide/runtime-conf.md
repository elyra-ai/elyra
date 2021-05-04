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
## Runtime Configuration

A runtime configuration provides Elyra access to external resources, such as Kubeflow Pipelines or Apache Airflow for scalable pipeline execution.

You can manage runtime configurations using the [JupyterLab UI](#managing-runtime-configurations-using-the-jupyterlab-ui) or the [Elyra CLI](#managing-runtime-configurations-using-the-elyra-cli).

### Prerequisites

A runtime configuration requires connectivity details for 
* A Kubeflow Pipelines deployment or an Apache Airflow deployment
* S3-based Object Storage (e.g. Minio or IBM Cloud Object Storage)

Note: Elyra is only tested with Kubeflow v1.2.x and v1.3.x and Apache Airflow v1.10.x.

### Managing runtime configurations using the JupyterLab UI

To create, edit, or delete runtime configurations using the UI select the `Runtimes` tab from the JupyterLab sidebar, or click the `Runtimes` button in the Pipeline Editor.

  ![Access runtime configurations](../images/access-runtime-configurations.png)

#### Creating a runtime configuration

To create a runtime configuration:
1. Select the `Runtimes` tab from the JupyterLab sidebar.
1. Click `+` to add a new runtime configuration and choose the desired runtime configuration type, e.g. Kubeflow Pipelines or Apache Airflow. 
   ![Create runtime configuration](../images/runtime-create-config.png)
1. Provide a runtime configuration display name, an optional description, and tag the configuration to make it more easily discoverable. 
1. Enter the Kubeflow Pipelines or Apache Airflow deployment information. Refer to section [Kubeflow Pipelines configuration settings](#kubeflow-pipelines-configuration-settings) or [Apache Airflow configuration settings](#apache-airflow-configuration-settings) for details.
1. Enter the Cloud Storage connectivity information. Refer to section [Cloud Storage settings](#cloud-storage-settings) for details.
1. Save the runtime configuration. The new entry is displayed in the list.
1. Expand the entry and verify that you can access the Kubeflow Pipelines or Apache Airflow GUI and the Cloud Storage GUI using the displayed links.
   ![Access runtime configuration](../images/runtime-access-config.png) 

#### Modifying a runtime configuration

To edit a runtime configuration:
1. Select the `Runtimes` tab from the JupyterLab sidebar.
1. Click the pencil next to the runtime configuration.

#### Deleting a runtime configuration

To delete a runtime configuration:
1. Select the `Runtimes` tab from the JupyterLab sidebar.
1. Click the trash can next to the runtime configuration.

### Managing runtime configurations using the Elyra CLI

You can list, create, edit, or delete runtime configurations using the `elyra-metadata` CLI.

#### Listing runtime configurations

To list runtime configurations run

```
elyra-metadata list runtimes
```

The output lists for each runtime the name and the name of the associated JSON formatted metadata file, which is stored in the JupyterLab data directory in the `metadata/runtimes` subdirectory.

```
Available metadata instances for runtimes (includes invalid):

Schema   Instance  Resource  
------   --------  -------- 
kfp      my_kfp    /Users/jdoe/Library/Jupyter/metadata/runtimes/my_kfp.json
```

To format the output as JSON run `elyra-metadata list runtimes --json`. Note that the JSON export includes the content of the metadata files, not just their names.

#### Creating a runtime configuration

To create a runtime configuration for a Kubeflow Pipelines deployment:

```bash
elyra-metadata install runtimes \
       --display_name="My Kubeflow Pipelines Runtime" \
       --api_endpoint=https://kubernetes-service.ibm.com/pipeline \
       --api_username=username@email.com \
       --api_password=mypassword \
       --engine=Argo \
       --cos_endpoint=http://minio-service.kubeflow:9000 \
       --cos_username=minio \
       --cos_password=minio123 \
       --cos_bucket=test-bucket \
       --tags="['kfp', 'v1.0']" \
       --schema_name=kfp
```

Refer to the [Kubeflow Pipelines Configuration settings](#kubeflow-pipelines-configuration-settings) section for an explanation of the parameters.

#### Modifying a runtime configuration

To edit a runtime configuration:

```bash
elyra-metadata install runtimes \
       --replace \
       --name="my_kubeflow_pipelines_runtime" \
       --display_name="My Kubeflow Pipelines Runtime" \
       --api_endpoint=https://kubernetes-service.ibm.com/pipeline \
       --api_username=username@email.com \
       --api_password=mynewpassword \
       --engine=Argo \
       --cos_endpoint=http://minio-service.kubeflow:9000 \
       --cos_username=minio \
       --cos_password=minio123 \
       --cos_bucket=test-bucket \
       --tags="['kfp', 'v1.1']" \
       --schema_name=kfp
```

Refer to the [Kubeflow Pipelines Configuration settings](#kubeflow-pipelines-configuration-settings) section for an explanation of the parameters. Note that you must specify the `--name` parameter. 

#### Deleting a runtime configuration

To delete a runtime configuration run the following command, replacing the configuration name as appropriate.

```bash
elyra-metadata remove runtimes --name=my_kubeflow_pipelines_runtime
```

### Configuration settings

#### Common configuration settings

Configurations include the following   common settings for all supported runtime types. The string in the headings below, which is enclosed in parentheses, denotes the CLI option name.

##### Name (display_name)

A user-friendly name for runtime configuration. This property is required.

Example: `Kubeflow Pipelines dev environment`

##### N/A (name)

A unique identifier for this configuration. A value is automatically generated from `display_name`.

Example: `kubeflow_pipelines_dev_environment`

##### Description (description)

Description for this runtime image configuration. This property is optional.

Example: `Kubeflow Pipelines deployment in QA`

##### Tags (tags)

Zero or more tags for this runtime configuration.

Example: `['test-env','airflow']`

#### Kubeflow Pipelines configuration settings

This section defines the settings for the Kubeflow Pipelines deployment that you want to associate with this runtime configuration.

##### Kubeflow Pipelines API endpoint (api_endpoint)

The KubeFlow Pipelines API endpoint you want to utilize. This setting is required.

Example: `https://kubernetes-service.ibm.com/pipeline`

##### Kubeflow Pipelines user namespace (user_namespace)
The namespace used to run your pipeline in Kubeflow Pipelines. This setting is required if namespaces are defined in Kubeflow Pipelines. SEE NOTE.

Example: `anonymous`

##### Kubeflow Pipelines API endpoint username (api_username)
Username used to access your KubeFlow Pipelines API endpoint. This setting is required if the Kubeflow Pipelines deployment is multi-user, auth enabled.

Example: `username@email.com`

##### Kubeflow Pipelines API endpoint (api_password)
Password used to access your KubeFlow Pipelines API endpoint. This setting is required if the Kubeflow Pipelines deployment is multi-user, auth enabled.

Example: `mypassword`

##### Kubeflow Pipelines engine (engine)
The engine being used by Kubeflow Pipelines to run pipelines: `Argo` or `Tekton`. If you have access to the Kubernetes cluster where Kubeflow Pipelines is deployed, run these commands in a terminal window to determine the engine type.

```
# If this command completes successfully, the engine type is Argo.
kubectl describe configmap -n kubeflow workflow-controller-configmap

# If this command completes successfully, the engine type is Tekton.
kubectl describe configmap -n kubeflow kfp-tekton-config
```

The default is `Argo`.

Example: `Argo`

#### Apache Airflow configuration settings

This section defines the settings for the Apache Airflow deployment that you want to associate with this runtime configuration.

##### Apache Airflow UI endpoint (api_endpoint)

The Apache Airflow API endpoint you want to utilize. This setting is required.

Example: `https://your-airflow-webserver:port`

##### Apache Airflow user namespace (user_namespace)
The namespace used to run your DAG in Apache Airflow. The Kubernetes namespace must be configured with the correct permissions prior to use in Apache Airflow. This setting is Optional. 

The default namespace is `default`.

Example: `anonymous`

##### GitHub API Endpoint (github_api_endpoint)

The GitHub (or GitHub Enterprise) API endpoint where the git client will attempt to connect. This setting is required. Keep the default  `https://api.github.com` for github.com

Example: `https://api.private.githubenterprise.com`

##### GitHub DAG Repository (github_repo)

The GitHub repository that Apache Airflow utilizes to store DAGs. This setting is required and the repository must exist.

Example: `user-or-org/dag-repo-name`

##### GitHub DAG Repository Branch (github_branch)
The name of the branch in `github_repo` where DAGs are stored. 
This setting is required and the branch must exist.

Example: `dag-branch`

##### GitHub Personal Access Token (github_repo_token)
A [GitHub personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) with write access to the GitHub DAG Repository. This setting is required. 

Example: `766f7c267519fee7c71d7f96bdf42e646dc65433`

#### Cloud Storage settings

This section defines the settings for the cloud storage that you want to associate with this runtime configuration.

##### Cloud Object Storage endpoint (cos_endpoint)
This should be the URL address of your S3-compatible Object Storage. If running an Object Storage Service within a Kubernetes cluster (Minio), you can use the Kubernetes local DNS address. This setting is required.

Example: `https://minio-service.kubeflow:9000`

##### Cloud Object Storage Credentials Secret (cos_secret)
(Optional) Kubernetes secret that's defined in the specified user namespace, containing the Cloud Object Storage username and password.
If specified, this secret must exist on the Kubernetes cluster hosting your pipeline runtime in order to successfully
execute pipelines. This setting is optional but is recommended for use in shared environments to avoid exposing a user's 
Cloud Object Storage credentials. 

Example: `my-cos-secret`

The following is an example of how your secret on the Kubernetes cluster hosting your runtime should be defined. The variable
names defined under `data`, must be `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` followed by each respective value 
encoded in base64. Learn how to create, deploy, or configure [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: <cos_secret>
type: Opaque
data:
  AWS_ACCESS_KEY_ID: <BASE64_ENCODED_YOUR_AWS_ACCESS_KEY_ID>
  AWS_SECRET_ACCESS_KEY: <BASE64_ENCODED_YOUR_AWS_SECRET_ACCESS_KEY>
```

##### Cloud Object Storage username (cos_username)
Username used to access the Object Storage. This setting is required.

Example: `minio`

##### Cloud Object Storage password (cos_password)
Password for cos_username. This setting is required.

Example: `minio123`

##### Cloud Object Storage bucket name (cos_bucket)
Name of the bucket you want Elyra to store pipeline artifacts in. This setting is required. If the bucket doesn't exist, it will be created. The specified bucket name must meet the naming conventions imposed by the Object Storage service.

Example: `test-bucket`

> If using IBM Cloud Object Storage, you must generate a set of [HMAC Credentials](https://cloud.ibm.com/docs/services/cloud-object-storage/hmac?topic=cloud-object-storage-uhc-hmac-credentials-main)
and grant that key at least [Writer](https://cloud.ibm.com/docs/services/cloud-object-storage/iam?topic=cloud-object-storage-iam-bucket-permissions) level privileges.
Specify `access_key_id` and `secret_access_key` as `cos_username` and `cos_password`, respectively.


### Troubleshooting 

I am seeing this error when using Elyra with Kubeflow Pipelines that is Dex enabled: 
```bash
HTTP response body: {"error":"Validate experiment request failed.: Invalid input error: Invalid resource references for experiment. Expect one namespace type with owner relationship.
```
- Ensure that you have logged into the Kubeflow Dex landing page (https://kubeflow.cluster:31380....) at least once with 
your credentials via the GUI. You should have been greeted with a dialog box and request to create a new namespace. 
Without this step complete, Elyra will not be able to create pipelines on the Kubeflow cluster. 

- Ensure you've configured Kubeflow Pipelines credentials and that they are correct. When using Dex, the `api_username` is typically 
your email address and `user_namespace` is your email shortname (e.g. `elyra` for `elyra@email.org`).
