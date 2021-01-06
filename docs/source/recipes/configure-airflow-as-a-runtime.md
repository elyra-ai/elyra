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


# Configuring Airflow on Kubernetes for use with Elyra (Experimental)

Using Apache Airflow with Elyra requires configuring two parts. 
The Airflow Deployment on Kubernetes and Elyra's runtime configuration.

## Requirements
  - An Existing Apache Airflow Cluster 
    - Ensure Apache Airflow is at least v1.10.8+, earlier versions may work (not tested)
    - Using the Kubernetes Executor  
  
OR
  - A Kubernetes Cluster 
    - Ensure Kubernetes is at least v1.18+, earlier versions may work (not tested)
    - Helm v3 is Installed  
    - Great guide on how to deploy an Airflow cluster:
    [Apache Airflow with Kubernetes Executor and Minikube](https://marclamberti.com/blog/airflow-kubernetes-executor/)
      OR
    - Use Helm charts available in the Airflow source distribution with our sample configuration

## Airflow Configuration Requirements

1. Generate an SSH key to be used as a secret for Airflow. This sample configuration will assume that the repository 
   will be private by default. This secret will provide your Airflow deployment with access to a private Github repository
   
2. Create a Kubernetes secret with the SSH key. Please note filenames and locations may be different on your system. 
Ensure that you update the sample configuration with your correct filenames and paths prior to deploying.
```bash
kubectl create secret generic airflow-secret --from-file=id_rsa=.ssh/id_rsa --from-file=known_hosts=.ssh/known_hosts --from-file=id_rsa.pub=.ssh/id_rsa.pub -n airflow
```

3. Install Airflow with the sample configuration or your own custom configuration

- You will need to sync your Airflow Deployment's DAG directory to the same Github repository as configured in your 
`metadata runtime`. Please see the helm chart example for reference, specifically the `git` configuration section.  
- The sample configuration will sync the DAG directory with the Github repository every 10 seconds. 

```bash
helm install "airflow" stable/airflow --values https://raw.github.com/elyra-ai/elyra/etc/kubernetes/helm/airflow/values.yaml
```

## Elyra Runtime Configuration Requirements

1. Create a new Github Personal Access Token under the user/organization where the DAG repository is located.

  - Instructions on how to create a token can be found on [Github](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)
  - Ensure the token is given write permissions to your repository

2. Add the token to your Airflow metadata runtime configuration 
