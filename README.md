# Jupyter Enterprise Scheduler Notebook Extension


## Installing the extension

```
pip install --upgrade -e .
jupyter serverextension enable --py enterprise_scheduler_extension --sys-prefix
jupyter nbextension install --py enterprise_scheduler_extension --sys-prefix
jupyter nbextension enable --py enterprise_scheduler_extension --sys-prefix
```


You can check that the install was successful with:

```
jupyter nbextension list
jupyter serverextension list
```