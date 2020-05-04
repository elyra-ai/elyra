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
    - Great guide on how to deploy a local Airflow cluster for testing:
    [Apache Airflow with Kubernetes Executor and Minikube](https://marclamberti.com/blog/airflow-kubernetes-executor/)
    - Example helm charts are available in the Airflow source distribution 
- Terminal Access to the Airflow Webserver and Scheduler Host

## Configuration
You will need to sync your Airflow DAG directory to the same object store as configured in your `metadata runtime`
and the same `cos_dag_bucket`. The easiest way to accomplish this is with a cron job that periodically syncs these 
two locations. 

1. SSH into the host/container where Apache Airflow Scheduler is installed. 
    ```bash
    ssh <user>@<airflow host>
    ```
    
    ```bash
    Airflow on Kubernetes Example
    
    kubectl exec -it -n <namespace> <Airflow Pod Name> /bin/bash 
    kubectl exec -it -n default airflow-7bdfd78b9c-fk2g2 /bin/bash
    
    NOTE: If your pod contains multiple containers e.g. webserver, scheduler etc. use the -c option to select one
    EXAMPLE: kubectl exec -it -n default airflow-7bdfd78b9c-fk2g2 -c scheduler /bin/bash
    ```

2. Install the `awscli` python package
    ```bash
    pip install awscli
    ```
3. Setup the configuration file that will be used by the aws client. In our example, we're going to be using our own
Minio Object Storage but any S3 based Object Store should work. Make sure you update `aws_access_key_id` and
    `aws_secret_access_key` with your actual keys.
    ```bash
    mkdir -p ~/.aws
    echo "[default]" >> ~/.aws/config
    echo "aws_access_key_id=minio" >> ~/.aws/config
    echo "aws_secret_access_key=minio123" >> ~/.aws/config
    ```
4. Ensure you have `cron` installed and a file editor, in this example we will be using `vim` but `nano` and others 
should work just as well. We're also using Ubuntu, so your system package manager may vary.
    ```bash
    apt update && apt install -y vim cron
    ```
5. Ensure a crontab exists for the current user
    ```bash
    crontab -e
    ```
6. Start the cron daemon (if not started already)
    ```bash
   service cron start
            OR
   service crond start 
   ```
7. Configure a cron command to be run. In this example, we are syncing with the S3 bucket every 2 minutes
   ```bash
   command="*/2 * * * * aws --endpoint-url <YOUR S3 ENDPOINT> s3 sync s3://<cos_dag_bucket>/ <AIRFLOW DAG DIRECTORY/"
   ```
8. Register the cron job with `crontab`
    ```bash
    crontab -l | { cat; echo "$command"; } | crontab -
    ```      
    The cron job should be running now
    
9. Lastly, install the airflow-notebook python package on **both** `webserver` and `scheduler` hosts  
NOTE: Installation is necessary **only** on the single `scheduler` host if you have `DAG serialization` 
enabled under your airflow.cfg
    ```bash
   pip install airflow-notebook 
   ```