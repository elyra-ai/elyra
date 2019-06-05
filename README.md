# Jupyter Notebook Scheduler - JupyterLab Extension

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
