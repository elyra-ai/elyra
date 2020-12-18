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

# Configuring Airflow as an Elyra Runtime (Experimental)

## Requirements
- An Apache Airflow Cluster with Kubernetes Executor
    - Ensure Apache Airflow is at least v1.10.8+
    - Great guide on how to deploy an Airflow cluster:
    [Apache Airflow with Kubernetes Executor and Minikube](https://marclamberti.com/blog/airflow-kubernetes-executor/)
    - Example helm charts are available in the Airflow source distribution

## Airflow Configuration Requirements (New Airflow Deployment)
You will need to sync your Airflow Deployment's DAG directory to the same Github repository as configured in your 
`metadata runtime`. 

1. Generate an SSH key to be used as a secret for Airflow. This secret will provide your Airflow deployment with access to
the private Github repository
   
2. Create a Kubernetes secret with the SSH key
```bash
kubectl create secret generic airflow-secret --from-file=id_rsa=.ssh/id_rsa --from-file=known_hosts=.ssh/known_hosts --from-file=id_rsa.pub=.ssh/id_rsa.pub -n airflow
```
3. Install Airflow with the sample configuration
```bash
helm install "airflow" stable/airflow --values https://raw.github.com/elyra-ai/elyra/etc/kubernetes/helm/values.yaml
```

## Elyra Configuration Requirements

1. Create a new Github Token under the user/organization where the DAG reposistory is located.

2. Add the token to your Airflow metadata runtime configuration 


