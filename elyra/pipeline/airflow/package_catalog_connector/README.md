### Catalog connector for Apache Airflow packages

This catalog connector enables Elyra to load operator definitions from [Apache Airflow Python packages](https://airflow.apache.org/docs/apache-airflow/stable/_api/airflow/operators/index.html). Only built distributions ('`.whl`') are supported.

### Use the connector

1. Launch JupyterLab.
1. [Open the '`Manage Components`' panel](
https://elyra.readthedocs.io/en/stable/user_guide/pipeline-components.html#managing-custom-components-using-the-jupyterlab-ui).
1. Add a new Airflow package catalog ('`+`' > '`New Apache Airflow package operator catalog`').
1. Specify a catalog name, e.g. '`Airflow 1.10.15 wheel`'.
1. (Optional) Specify a category under which the loaded operators will be organized in the palette.
1. Configure the '`Airflow package download URL`'. The URL must reference a location that Elyra can access using an HTTP `GET` request. If the resource is secured, provide credentials, such as a user id and password or API key.
1. If desired, include operators that are located in the `airflow.contrib.operators` package. The connector excludes them by default.

### Example

If the Airflow package is stored on PyPI:
   1. Search for the Apache Airflow package on PyPI.
   1. Open the package's release history and choose the desired version.
   1. Open the `Download files` link.
   1. Copy the download link for the package's wheel. ([Example download URL for Apache Airflow 1.10.15](https://files.pythonhosted.org/packages/f0/3a/f5ce74b2bdbbe59c925bb3398ec0781b66a64b8a23e2f6adc7ab9f1005d9/apache_airflow-1.10.15-py2.py3-none-any.whl))
1. Save the catalog entry.
1. Open the Visual Pipeline Editor and expand the palette. The loaded Apache Airflow operators are displayed.

### Troubleshooting

If the palette does not include the expected operators check the JupyterLab log file for error messages. Error messages include the component catalog name, as shown in this example:
```
Error. The Airflow package connector '<CATALOG_NAME>' encountered an issue downloading '<URL>'. HTTP response code: <HTTP_CODE>
```
