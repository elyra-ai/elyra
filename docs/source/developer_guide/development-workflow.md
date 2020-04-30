## Development Workflow

### Building

`Elyra` is divided in two parts, a collection of Jupyter Notebook backend extensions,
and their respective JupyterLab UI extensions. Our JupyterLab extensions are located in our `packages`
directory. 

#### Requirements

* [Yarn](https://yarnpkg.com/lang/en/docs/install) 

#### Installation

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
