# Jupyter Enterprise Scheduler Notebook Extension


## Installing the backend extensions

```bash
pip install --upgrade -e .
jupyter serverextension enable --py enterprise_scheduler_extension --sys-prefix
```

You can check that the install was successful with:
```bash
jupyter serverextension list
```

## Installing the frontend extension

```bash
jupyter labextension install
```

You can check that the install was successful with:
```bash
jupyter labextension list
```
