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
# Deploying Elyra on JupyterHub 

   
## Deploying on Kubernetes 

Requirements (in order of configuration):
- `kubectl` is installed and configured for your cluster
    - Install via [Binary on Linux](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-with-curl-on-linux)
                | [HomeBrew on MacOS](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-using-other-package-management)
                | [Snap on Ubuntu](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-using-other-package-management)
- A Kubernetes Cluster
    - [Sign up and create a Free Kubernetes Cluster](https://cloud.ibm.com/docs/containers?topic=containers-getting-started#clusters_gs)
- `helm` is installed and tiller pod is deployed on your cluster
    - [Installation and Setup](https://zero-to-jupyterhub.readthedocs.io/en/latest/setup-jupyterhub/setup-helm.html)

### Install JupyterHub on Kubernetes

[Download the Zero-to-JupyterHub with Elyra on Kubernetes Helm Chart](Link HERE)

- Create the new storage class
```bash 
kubectl create -f ibm/create_ibm_storageclass.yaml
```

- Generate and configure your JupyterHub secret token
```bash
openssl rand -hex 32
```
- Open the ibm/config.yaml file with your favorite text editor and add the token to it
```bash
proxy:
  secretToken: "your token here"
```
- Save and Exit

- Next, deploy the Helm Chart 
```bash
NAMESPACE=jhub
VERSION=0.9.0
helm install --namespace $NAMESPACE --version=$VERSION --values ibm/config.yaml .
``` 

- Expected Output
```bash
NOTES:
Thank you for installing JupyterHub!

Your release is named [YOUR RELEASE NAME] and installed into the namespace jhub.

You can find if the hub and proxy is ready by doing:

 kubectl --namespace=jhub get pod

and watching for both those pods to be in status 'Running'.

You can find the public IP of the JupyterHub by doing:

 kubectl --namespace=jhub get svc proxy-public

It might take a few minutes for it to appear!

Note that this is still an alpha release! If you have questions, feel free to
  1. Read the guide at https://z2jh.jupyter.org
  2. Chat with us at https://gitter.im/jupyterhub/jupyterhub
  3. File issues at https://github.com/jupyterhub/zero-to-jupyterhub-k8s/issues
```

### Troubleshooting 

- When Provisioning Storage, it may take a minute or two for the volume provisioner to come back with a volume for 
  the claim depending on the service being used. If your notebook startup times-out prior to the claim being `Bound`, just 
  restart the Notebook. You can use `kubectl get pvc -n jhub` to see the status of the claim. 