<!--
{% comment %}
Copyright 2018-2020 IBM Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
{% endcomment %}
-->

# Elyra Metadata Services

While building Enterprise extensions for the Elyra project we identified that there
is very often a requirement to integrate with external runtimes, data sources, and other 
components hosted in remote locations or that need additional metadata in order to connect
to these external components. 

The **Metadata Service** provides a generic service that can be used to store metadata
that can be easily integrated with Elyra backend and/or frontend components.

![Metadata Services](../source/images/metadata-components.png)

## Metadata Services structure using the default file system store

The default implementation is for the metadata services to store metadata files in the file system, grouped
by directories based on the type of metadata. 

The root directory for metadata is relative to the 'Jupyter Data directory' (e.g. jupyter --data-dir)

```
/Users/xxx/Library/Jupyter/metadata/
```

Each type of metadata is then stored in a child directory, which internally is
referred to as the `namespace`. 

As an example `runtimes` is the namespace for runtime metadata instances that reside in the following directory:

```
/Users/xxx/Library/Jupyter/metadata/runtimes
```

The contents of this folder would then include multiple metadata files, each associated with a type or schema corresponding to the desired runtime platform.

For example, the following contains runtime metadata for two runtime platforms, airflow and kfp, 
where each runtime type has 1 or 2 runtimes defined, respectively.

```
/Users/xxx/Library/Jupyter/metadata/runtimes/airflow-cloud.json
/Users/xxx/Library/Jupyter/metadata/runtimes/kfp-fyre.json
/Users/xxx/Library/Jupyter/metadata/runtimes/kfp-qa.json
```

And each metadata file looks like:

```json
{
  "display_name": "Kubeflow Pipeline - Fyre",
  "schema_name": "kfp",
  "metadata": {
    "api_endpoint": "http://weakish1.fyre.ibm.com:32488/pipeline",
    "cos_endpoint": "http://weakish1.fyre.ibm.com:30427",
    "cos_username": "minio",
    "cos_password": "minio123",
    "cos_bucket": "lresende"
  }
}
```

Because the runtime platform schemas are considered "factory data", the schema files are provided as part of the distribution and are located in the Elyra distribution under `elyra/metadata/schemas`:

```
[path to python distributions]/elyra/metadata/runtime/kfp.schema
[path to python distributions]/elyra/metadata/runtime/airflow.schema
```


### Metadata Client API

Users can easily manipulate metadata via the Client API

```bash
jupyter runtimes list
```

```
Available metadata for external runtimes:
  kfp-fyre       /Users/lresende/Library/Jupyter/metadata/runtimes/kfp-fyre.json
  kfp-qa         /Users/lresende/Library/Jupyter/metadata/runtimes/kfp-qa.json
  airflow-cloud  /Users/lresende/Library/Jupyter/metadata/runtimes/airflow-cloud.json
```

### Metadata Service REST API

A REST API is available for easy integration with frontend components:

Retrieve all metadata for a given namespace:

```REST
GET /api/metadata/<namespace>
```

Retrieve a given metadata resource from a given namespace:

```REST
GET /api/metadata/<namespace>/<resource>
```


### Metadata APIs
A Python API is also available for accessing and manipulating metadata.  This is accomplished using the `MetadataManager` along with a corresponding storage class.  The default storage class is `FileMetadataStore`.

```Python
from elyra.metadata.metadata import MetadataManager, FileMetadataStore

metadata_manager = MetadataManager(namespace="runtimes",
                                   store=FileMetadataStore(namespace='runtimes'))

runtime_configuration = metadata_manager.get('kfp')

if not runtime_configuration:
    raise RuntimeError("Runtime metadata not available.")

api_endpoint = runtime_configuration.metadata['api_endpoint']
cos_endpoint = runtime_configuration.metadata['cos_endpoint']
cos_username = runtime_configuration.metadata['cos_username']
cos_password = runtime_configuration.metadata['cos_password']
bucket_name = runtime_configuration.metadata['cos_bucket']

```



