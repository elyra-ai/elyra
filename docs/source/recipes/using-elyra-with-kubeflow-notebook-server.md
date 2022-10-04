<!--
{% comment %}
Copyright 2018-2022 Elyra Authors

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

# Using Elyra with the Kubeflow Notebook Server

In this example we will show how to launch Elyra using [Kubeflow's Notebook Server](https://www.kubeflow.org/docs/components/notebooks/). 

## Requirements
- A Kubeflow Cluster
    - A standard installation of Kubeflow will include the Notebook Server as part of the application stack
    - [Installation Documentation](https://www.kubeflow.org/docs/started/getting-started/)

- Select the desired Elyra container image version from the `elyra/kf-notebook` repositories on [Docker Hub](https://hub.docker.com/r/elyra/kf-notebook) or [quay.io](https://quay.io/repository/elyra/kf-notebook). Do NOT use other images, such as the ones in `elyra/elyra`.
  
  OR

  Create a custom Elyra container image following the [instructions in this directory](https://github.com/elyra-ai/elyra/tree/3.12.0/etc/docker/kubeflow). 
    
## Launching Elyra in the Kubeflow Notebook Server
1. In the default Kubeflow welcome page, in the left side menu, click on `Notebook Servers`   
  
   ![Elyra](../images/recipes/using-elyra-with-kubeflow-notebook-server/elyra-with-kf-notebook-splash-screen.png)  
  
1. Click on `NEW SERVER`   
  
   ![Elyra](../images/recipes/using-elyra-with-kubeflow-notebook-server/elyra-with-kf-notebook-notebook-server.png)  
  
1. Choose a `name` for your notebook server, and under `Image` check the box labeled `Custom Image`.   
  
   ![Elyra](../images/recipes/using-elyra-with-kubeflow-notebook-server/elyra-with-kf-notebook-config-1.png)  

1. In _Kubeflow version 1.3 (and later)_ choose `jupyterlab` as image type.

1. As `Custom Image` enter `elyra/kf-notebook:<ELYRA_VERSION>`, replacing `<ELYRA_VERSION>` with the desired image tag, e.g. `2.1.0`.   
  
   ![Elyra](../images/recipes/using-elyra-with-kubeflow-notebook-server/elyra-with-kf-notebook-image-config.png)

   > To pull an image from quay.io prefix the image name with `quay.io`, e.g. `quay.io/kf-notebook:2.1.0`.  
  
1. Customize the resources as required. We recommend at least 1 CPU and 1Gi of memory.
     
1. Your notebook server with Elyra should begin the provisioning process now. When complete, you'll notice a green light and arrow to the left of your notebook. Click on `Connect` to launch Elyra.   
  
   ![Elyra](../images/recipes/using-elyra-with-kubeflow-notebook-server/elyra-with-kf-notebook-start-notebook.png)  
   
### Next step:
[Creating a runtime metadata configuration](https://elyra.readthedocs.io/en/latest/user_guide/runtime-conf.html)


## Additional Resources and Documentation
[Official Kubeflow Notebook Server Documentation - Creating a Jupyter Notebook Server](https://www.kubeflow.org/docs/components/notebooks/setup/)