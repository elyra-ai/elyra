# Enterprise Workspace for AI

This is a JupyterLab extension to schedule Jupyter Notebooks on external runtime. 
Currently, the only supported/tested platform is [FfDL](https://github.com/ibm/ffdl).


## Installing 

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

To add a runtime configuration for pipelines to your system:
- Navigate to your local path resulted from the command ```jupyter --data-dir```
- In metadata/runtime folder, create a new file named **kfp.json** 
with the following content:
```
{
  "display_name": "Kubeflow Pipeline",
  "metadata": {
    "api_endpoint": "http://weakish1.fyre.ibm.com:32488/pipeline",
    "cos_host":"weakish1.fyre.ibm.com:30427",
    "cos_username": "minio",
    "cos_password": "minio123",
    "cos_bucket": "lresende"
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