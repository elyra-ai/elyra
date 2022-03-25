<!--
{% comment %}
Copyright 2018-2022 Elyra Authors

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

## Command line interface

The Elyra command line interface (CLI) allows you to [manage metadata](#managing-metadata) and [work with pipelines](#working-with-pipelines).

The CLI is part of the Elyra installation and can be used without a running JupyterLab instance.

### Managing metadata

In Elyra, information such as a [runtime configuration](runtime-conf.md) or a [runtime image](runtime-image-conf) is considered metadata. `elyra-metadata` is used to list, create, update, export or delete metadata.

#### Getting help

To display the list of commands that `elyra-metadata` supports, run

```
$ elyra-metadata -h
```

To learn more about a specific command, e.g. `list`, run
```
$ elyra-metadata list -h
```

#### Formatting list output

By default the `list` command displays the results in a user-friendly format. 

```
$ elyra-metadata list runtime-images
Available metadata instances for runtime-images (includes invalid):

Schema          Instance    Resource
------          --------    --------
runtime-image   anaconda    .../runtime-images/anaconda.json
```

Specify the `--json` parameter to return the results in JSON to allow for programmatic processing, e.g. using [`jq`](https://stedolan.github.io/jq/). 

```
$ elyra-metadata list runtime-images --json | jq ".[].display_name"
"Tensorflow 1.15.2"
"Tensorflow 1.15.2 with GPU"
"R Script"
"Anaconda (2020.07) with Python 3.x"
"Tensorflow 2.3.0"
"Pandas 1.1.1"
"Pytorch 1.4 with CUDA-devel"
"Tensorflow 2.3.0 with GPU"
"Pytorch 1.4 with CUDA-runtime"
"Pandas on quay.io"

```

#### List, create, update, export, and delete metadata

Refer to the topics below for detailed information on how to use `elyra-metadata` to
 - [Manage code snippets](code-snippets.html#managing-code-snippets-using-the-elyra-cli)
 - [Manage runtime configurations](runtime-conf.html#managing-runtime-configurations-using-the-elyra-cli)
 - [Manage runtime images](runtime-image-conf.html#managing-runtime-image-configurations-using-the-elyra-cli)
 - [Manage pipeline components](pipeline-components.html#managing-custom-components-using-the-elyra-cli)

#### Creating and updating metadata with complex properties
The `elyra-metadata` application derives its command-line options (aside from a handful of system options) directly from the schema associated with the referenced schemaspace. In most cases, the schema properties are straightforward and easily determined.  However, JSON schemas can also contain complex properties and references that are not within the scope of `elyra-metadata`.  This section presents ways to create and update instances built from complex schemas.

Application-level properties within a schema reside as top-level properties within the schema's `metadata` stanza. For example, here's the `code-snippet` schema for the `code-snippets` schemaspace:

```json
{
  "metadata": {
    "description": "Additional data specific to this Code Snippet",
    "type": "object",
    "properties": {
      "description": {
        "title": "Description",
        "description": "Code snippet description",
        "type": "string"
      },
      "tags": {
        "title": "Tags",
        "description": "Tags for categorizing snippets",
        "type": "array",
        "uihints": {
          "field_type": "tags"
        }
      },
      "language": {
        "title": "Language",
        "description": "Code snippet implementation language",
        "type": "string",
        "uihints": {
          "field_type": "dropdown",
          "default_choices": [
            "Python",
            "Java",
            "R",
            "Scala",
            "Markdown"
          ],
          "category": "Source"
        },
        "minLength": 1
      },
      "code": {
        "title": "Code",
        "description": "Code snippet code lines",
        "type": "array",
        "uihints": {
          "field_type": "code",
          "category": "Source"
        }
      }
    },
    "required": [
      "language",
      "code"
    ]
  }
}
```
and `elyra-metadata` generates options corresponding to each of the `metadata` properties and including helpful tips like whether the property is required and a hint as to how its value should be entered:
```
--description=<string> (Format: sequence of characters) 
	Code snippet description
--tags=<array> (Format: "['item1', 'item2']" or "item1,item2") 
	Tags for categorizing snippets
--language=<string> (Required. Format: sequence of characters) 
	Code snippet implementation language
--code=<array> (Required. Format: "['item1', 'item2']" or "item1,item2") 
	Code snippet code lines
```

When complex properties are present, the complexity of interpreting their semantics into CLI options is not sustainable.  To address this, two options can be used that bypass the per-property processing and allow you to create or update the instance directly.

The `--file` option takes a filepath to a JSON-formatted file.  The file can contain the entire JSON including the higher-level system properties that reside outside the `metadata` stanza.  Or, it may contain only the JSON that comprises the `metadata` stanza.

The `--json` option works similar to `--file` but allows the specification of the bulk JSON to be referenced as a string.  Its behavior is the same as `--file` relative to what is expected in the data.  This option may be used in situations where file creation is not available or the metadata is small.

The other, top-level properties can be specified directly on the command line and will act as overrides to whatever properties and values are referenced within the bulk JSON data.

It should also be noted that individual object-valued properties can optionally take a filepath as their value.  If the value exists as a file, that file will be read and used to populate the object-valued property's value.

Should a failure be encountered relative to a complex schema, the properties identified as complex will be identified in the tool's usage statement.  They will refer to a note at the bottom of the usage statement indicating that these approaches should be used.

Finally, when updating instances using the `update` command, you are not required to include unchanged values on the command line.  Instead, the existing object is read and any properties provided on the command line, or included in the bulk JSON data, are applied to the existing properties.

### Working with pipelines

In Elyra, [a pipeline](pipelines.md) is a representation of a
workflow that you run locally or remotely on Kubeflow Pipelines or Apache Airflow. The `elyra-pipeline` CLI is used to run pipelines, validate pipelines, describe pipelines, or export pipelines.

#### Getting help

To display the list of commands that `elyra-pipeline` supports, run

```
$ elyra-pipeline --help
```

To learn more about a specific command, e.g. `run`, run
```
$ elyra-pipeline run --help
```

Refer to the topics below for detailed information on how to use `elyra-pipeline` to
 - [Display pipeline information summary](pipelines.html#running-a-pipeline-using-the-command-line)
 - [Run a pipeline locally](pipelines.html#running-a-pipeline-from-the-command-line-interface)
 - [Submit a pipeline for remote execution](pipelines.html#running-a-pipeline-from-the-command-line-interface)
 - [Export a pipeline](pipelines.html#exporting-a-pipeline-from-the-command-line-interface)



