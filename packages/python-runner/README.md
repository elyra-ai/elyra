# python-runner-extension

Extends Jupyter Lab to run python files using the kernel


## Prerequisites

* JupyterLab

## Installation

> Note: this does not work yet, this extension is not yet published

```bash
jupyter labextension install python-runner-extension
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

