## Airflow provider package catalog connector

This catalog connector enables Elyra to load pipelines components from [Apache Airflow provider packages](https://airflow.apache.org/docs/apache-airflow-providers/index.html).

### Install the connector

You can install this catalog connector from PyPI or source code. Note that a **rebuild of JupyterLab is not required**.

**Prerequisites**

- [Elyra](https://elyra.readthedocs.io/en/stable/getting_started/installation.html) (version 3.6 and above).
- Apache Airflow 2.x

**Install from PyPI**

  ```
  $ pip install airflow-provider-package-catalog-connector
  ```

**Install from source code**

   ```
   $ git clone https://github.com/elyra-ai/elyra.git
   $ cd catalog-connectors/airflow/airflow-provider-package-catalog-connector/
   $ make source-install
   ```

### Use the connector

1. Launch JupyterLab.
1. [Open the '`Manage Components`' panel](
https://elyra.readthedocs.io/en/stable/user_guide/pipeline-components.html#managing-custom-components-using-the-jupyterlab-ui).
1. Add a new Airflow provider package operator catalog ('`+`' > '`New Apache Airflow provider package operator catalog`').
1. Specify a catalog name, e.g. '`Amazon provider package`'.
1. (Optional) Specify a category under which the catalog's operators will be organized in the palette.
1. Configure the `provider package download URL`. The URL must reference a location that Elyra can access using an HTTP GET request, without the need to authenticate. If the provider package is stored on PyPI:
   1. Search for the provider package on PyPI.
   1. In the package's `Navigation` section open the `Download files` link.
   1. Copy the download link for the package's wheel.
   ![Amazon provider package on PyPI](doc/images/aws_example.png)
1. Save the catalog entry.
1. Open the Visual Pipeline Editor and expand the palette. The operators that the provider package defines are displayed.

### Uninstall the connector

1. Remove all Airflow provider package operator catalog entries from the '`Manage Components`' panel.
1. Stop JupyterLab.
1. Uninstall the `airflow-provider-package-catalog-connector` package.
   ```
   $ pip uninstall -y airflow-provider-package-catalog-connector
   ```

### Troubleshooting

**Problem: The palette does not display any operators from the configured catalog.**

**Solution:** If the the Elyra GUI does not display any error message indicating that a problem was encountered, inspect the JupyterLab log file.
