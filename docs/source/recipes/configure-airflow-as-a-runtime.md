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


# Configuring Airflow on Kubernetes for use with Elyra (Experimental)

Using Apache Airflow with Elyra requires configuring two parts,
the Airflow Deployment on Kubernetes and Elyra's runtime configuration.

This guide assumes a general working knowledge of kubernetes and administration of a cluster

## Requirements

- A Private Github Repository
    
AND  

- A Kubernetes Cluster 
    - Ensure Kubernetes is at least v1.18+, earlier versions may work (not tested)
    - Helm v3.0  
    - Great guide on how to deploy an Airflow cluster:
    [Apache Airflow with Kubernetes Executor and Minikube](https://marclamberti.com/blog/airflow-kubernetes-executor/)
      OR
    - Use the [Helm chart](https://github.com/airflow-helm/charts/tree/main/charts/airflow) available in the Airflow source distribution with our [sample configuration](../../../etc/kubernetes/airflow/helm/values.yaml)  
    
OR  
  
- An Existing Apache Airflow Cluster 
    - Ensure Apache Airflow is at least v1.10.8+, earlier versions may work (not tested)
    - The [airflow-notebook](https://pypi.org/project/airflow-notebook/) python package installed on all schedulers/workers  
    - Using the Kubernetes Executor  
    
## Setting up a Github Repository
A Github repository is needed to host your DAGs(pipelines). 

- You will need to setup two things:
    - [Generate an SSH key to be used as a secret for Airflow](https://docs.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account)
    - [A Github Access Token with write access to the repo](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)
    
## Deploying Airflow on a new Kubernetes Cluster

### SSH key requirements (Airflow Git-Sync)
Apache Airflow uses a git-sync container to sync its collection of DAGs (pipelines) from a Github Repository. In order do so, 
it requires an SSH key with read permissions to the repository added to the cluster as a kubernetes secret and provided during deployment.
Please note that existing deployments may already have this step or equivalent already configured. 

1. Create a Kubernetes secret with the SSH key created [earlier](#setting-up-a-github-repository). Please note filenames and locations may be different on your system. 
Ensure that you update the sample configuration with your correct filenames and paths prior to deploying.
```bash
kubectl create secret generic airflow-secret --from-file=id_rsa=.ssh/id_rsa --from-file=known_hosts=.ssh/known_hosts --from-file=id_rsa.pub=.ssh/id_rsa.pub -n airflow
```

2. After creating your secret, enter the name of the kubernetes secret in the sample configuration for `helm` or in your own custom configuration.
Also, update the `git url` section to the private github repository created [earlier](#setting-up-a-github-repository)  
For example, if you named your secret `airflow-secret` and github repository was under the `elyra` organization and named `examples` under the 
`airflow` branch, your sample configuration would look something like this:
```bash
  ## configs for the DAG git repository & sync container
  ##
  git:
    ## url of the git repository
    ##
    ## EXAMPLE: (HTTP)
    ##   url: "https://github.com/torvalds/linux.git"
    ##
    ## EXAMPLE: (SSH)
    ##   url: "ssh://git@github.com:torvalds/linux.git"
    ##
    url: "ssh://git@github.com/elyra-ai/examples"

    ## the branch/tag/sha1 which we clone
    ##
    ref: "airflow"

    ## the name of a pre-created secret containing files for ~/.ssh/
    ##
    ## NOTE:
    ## - this is ONLY RELEVANT for SSH git repos
    ## - the secret commonly includes files: id_rsa, id_rsa.pub, known_hosts
    ## - known_hosts is NOT NEEDED if `git.sshKeyscan` is true
    ##
    secret: "airflow-secret"

    ## if we should implicitly trust [git.repoHost]:git.repoPort, by auto creating a ~/.ssh/known_hosts
    ##
```

4. Install Airflow with the [sample configuration](../../../etc/kubernetes/airflow/helm/values.yaml) or your own custom configuration 
after making any other changes you might need to the configuration.

- The sample configuration is set to sync Airflow with the Github repository every 10 seconds. You can update this
as needed. It also uses a custom container image with the `airflow-notebook` package requirement pre-installed.
  


```bash
helm install "airflow" stable/airflow --values https://raw.github.com/elyra-ai/elyra/etc/kubernetes/helm/airflow/values.yaml
```

## Setting up Elyra on existing Airflow Deployments

Getting Airflow to work with Elyra on existing deployments requires two things:

- The deployment is synced to a Github Repository
- The `airflow-notebook` python package is installed on the required Airflow pods (web-server, scheduler, workers)

## Elyra Runtime Configuration Requirements

1. A Github Personal Access Token under the user/organization where the DAG repository is located. This step was done [earlier](#setting-up-a-github-repository).

2. Add the token to your Airflow metadata runtime configuration 


