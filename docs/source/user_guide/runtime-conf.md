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
## Runtime Configuration

### Prerequisites
* A Kubeflow Pipelines Endpoint
* IBM Cloud Object Storage or other S3 Based Object Store (Optional)

### Configuring Runtime Metadata
**AI Pipelines** require configuring a pipeline runtime to enable its full potential. 
AI Pipelines currently only support `Kubeflow Pipelines` with plans to expand support for other runtimes
in the future.

To configure runtime metadata for `Kubeflow Pipelines` use the `jupyter runtimes install kfp` command providing appropriate options.  This command will create a json file in your local Jupyter Data directory under its `metadata/runtimes` subdirectories.  If not known, the Jupyter Data directory can be discovered by issuing a ```jupyter --data-dir```
command on your terminal.

Here's an example invocation of `jupyter runtimes install kfp` to create runtime metadata for use by `Kubeflow Pipelines` corresponding to the example values in the table below. Following its invocation, a file containing the runtime metadata can be found in `[JUPYTER DATA DIR]/metadata/runtimes/my_kfp.json`.
```bash
jupyter runtimes install kfp --name=my_kfp \
       --display_name="My Kubeflow Pipeline Runtime" \
       --api_endpoint=https://kubernetes-service.ibm.com/pipeline \
       --cos_endpoint=minio-service.kubeflow:9000 \
       --cos_username=minio \
       --cos_password=minio123 \
       --cos_bucket=test-bucket
```
This produces the following content in `my_kfp.json`:
```json
{
    "display_name": "My Kubeflow Pipeline Runtime",
    "schema_name": "kfp",
    "metadata": {
        "api_endpoint": "https://kubernetes-service.ibm.com/pipeline",
        "cos_endpoint": "minio-service.kubeflow:9000",
        "cos_username": "minio",
        "cos_password": "minio123",
        "cos_bucket": "test-bucket"
    }
}
```
NOTE: In case of typing a custom bucket name using minio cloud storage, make sure the bucket name has no underscores

To validate your new configuration is available, run:
```bash
jupyter runtimes list

Available metadata for external runtimes:
  my_kfp    /Users/jdoe/Library/Jupyter/metadata/runtimes/my_kfp.json
```

Existing runtime metadata configurations can be removed via `jupyter runtimes remove --name=[runtime]`:
```bash
jupyter runtimes remove --name=my_kfp
```

`Elyra` depends on its runtime metadata to determine how to communicate with your KubeFlow Pipelines
Server and with your chosen Object Store to store artifacts.   

#### Parameters

##### api_endpoint
The KubeFlow Pipelines API Endpoint you wish to run your Pipeline.

Example: `https://kubernetes-service.ibm.com/pipeline`

##### cos_endpoint
This should be the URL address of your S3 Object Storage. If running an Object Storage Service within a kubernetes cluster (Minio), you can use the kubernetes local DNS address.

Example: `minio-service.kubeflow:9000`

##### cos_username
Username used to access the Object Store. SEE NOTE.

Example: `minio`

##### cos_password
Description: Password used to access the Object Store. SEE NOTE.

Example: `minio123`

##### cos_bucket
Name of the bucket you want your artifacts in. If the bucket doesn't exist, it will be created

Example: `test-bucket`

NOTE: If using IBM Cloud Object Storage, you must generate a set of [HMAC Credentials](https://cloud.ibm.com/docs/services/cloud-object-storage/hmac?topic=cloud-object-storage-uhc-hmac-credentials-main) 
and grant that key at least [Writer](https://cloud.ibm.com/docs/services/cloud-object-storage/iam?topic=cloud-object-storage-iam-bucket-permissions) level privileges.
Your `access_key_id` and `secret_access_key` will be used as your `cos_username` and `cos_password` respectively.