# Elyra

[![Build Status](https://github.com/elyra-ai/elyra/workflows/Build/badge.svg)](https://github.com/elyra-ai/elyra/actions?query=workflow%3ABuild)
[![Documentation Status](https://readthedocs.org/projects/elyra/badge/?version=latest)](https://elyra.readthedocs.io/en/latest/?badge=latest)
[![PyPI version](https://badge.fury.io/py/elyra.svg)](https://badge.fury.io/py/elyra)
[![Conda-Forge version](https://img.shields.io/conda/vn/conda-forge/elyra.svg)](https://anaconda.org/conda-forge/elyra)

Elyra is a set of AI-centric extensions to JupyterLab. It aims to help data scientists, machine learning engineers, and AI developers through the model development life cycle.

## Key Features

- **Visual Pipeline Editor**: Build and run AI pipelines by dragging and dropping notebooks, Python scripts, and R scripts.
- **Code Snippets**: Save and reuse code fragments across different notebooks and editors.
- **Script Editor**: Edit and run Python and R scripts with support for remote execution.
- **Hybrid Runtime Support**: Run your pipelines locally or on remote runtimes like Kubeflow Pipelines or Apache Airflow.
- **Content Navigation**: Easily navigate through your project files using the enhanced file browser.

## Installation

Elyra can be installed using `pip` or `conda`. We recommend installing Elyra in a virtual environment.

### Using pip

```bash
pip install elyra
```

### Using conda

```bash
conda install -c conda-forge elyra
```

### Using Docker

You can also run Elyra using a pre-built Docker image from [Docker Hub](https://hub.docker.com/u/elyra):

```bash
docker run -it -p 8888:8888 elyra/elyra:latest jupyter lab
```

## Getting Started

Once installed, start JupyterLab as you normally would:

```bash
jupyter lab
```

After JupyterLab opens in your browser, you will see the Elyra extensions available in the Launcher:

1.  **Pipeline Editor**: Click on the "Pipeline Editor" icon to start building your first visual workflow.
2.  **Script Editors**: Use the Python or R editor to develop scripts that can be integrated into your pipelines.
3.  **Code Snippets**: Access the snippets sidebar to manage your reusable code blocks.

For a detailed walkthrough, check out our [Getting Started Guide](https://elyra.readthedocs.io/en/latest/getting_started/overview.html).

## Documentation

Comprehensive documentation for Elyra can be found at [elyra.readthedocs.io](https://elyra.readthedocs.io/).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more information on how to get involved.

## License

Elyra is licensed under the [Apache License 2.0](LICENSE).