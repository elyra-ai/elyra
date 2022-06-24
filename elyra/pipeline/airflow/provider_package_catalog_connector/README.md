### Catalog connector for Apache Airflow provider packages

This catalog connector enables Elyra to load operator definitions from [Apache Airflow provider packages](https://airflow.apache.org/docs/apache-airflow-providers/index.html). Only built distributions ('`.whl`') are supported.

### Use the connector

1. Launch JupyterLab.
1. [Open the '`Manage Components`' panel](
https://elyra.readthedocs.io/en/stable/user_guide/pipeline-components.html#managing-custom-components-using-the-jupyterlab-ui).
1. Add a new Airflow provider package catalog ('`+`' > '`New Apache Airflow provider package operator catalog`').
1. Specify a catalog name, e.g. '`HTTP provider package`'.
1. (Optional) Specify a category under which the loaded operators will be organized in the palette.
1. Configure the '`Provider package download URL`'. The URL must reference a location that Elyra can access using an HTTP `GET` request. If the resource is secured, provide credentials, such as a user id and password or API key.

### Example 

If the Airflow provider package is stored on PyPI:
   1. Search for the Apache Airflow provider package on PyPI.
   1. Open the package's release history and choose the desired version.
   1. Open the `Download files` link.
   1. Copy the download link for the package's wheel. ([Example download URL for the HTTP v2.0.2 provider package](https://files.pythonhosted.org/packages/a1/08/91653e9f394cbefe356ac07db809be7e69cc89b094379ad91d6cef3d2bc9/apache_airflow_providers_http-2.0.2-py3-none-any.whl))
1. Save the catalog entry.
1. Open the Visual Pipeline Editor and expand the palette. The loaded Apache Airflow operators are displayed.

### Troubleshooting

If the palette does not include the expected operators check the JupyterLab log file for error messages. Error messages include the component catalog name, as shown in this example:
```
Error. The Airflow provider package connector '<CATALOG_NAME>' encountered an issue downloading '<URL>'. HTTP response code: <HTTP_CODE>
```