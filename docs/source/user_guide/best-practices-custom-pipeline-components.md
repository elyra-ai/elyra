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
## Requirements and best practices for custom pipeline components

[Components](pipeline-components.md) are the fundamental building blocks of pipelines in Elyra. This document outlines requirements that user-provided custom components must meet to be compatible with the Visual Pipeline Editor. Best practices for generic components are documented in the [Best practices for file-based pipeline nodes](best-practices-file-based-nodes.md) topic.

### Kubeflow Pipelines components

#### Requirements

- The component is implemented as described [here](https://www.kubeflow.org/docs/components/pipelines/sdk/component-development/).
- [Python function-based components](https://www.kubeflow.org/docs/components/pipelines/sdk/python-function-components/) are not supported.
- The [component specification](https://www.kubeflow.org/docs/components/pipelines/sdk/v2/component-development/#creating-a-component-specification) must be accessible to the Visual Pipeline Editor and can be stored locally or remotely. Refer to the 
[Managing pipeline components topic](pipeline-components.html#managing-pipeline-components) for details.

#### Best practices

> This documentation content is currently under development.

### Apache Airflow components

#### Requirements

##### Configure fully qualified package names for custom operator classes

For Apache Airflow operators imported into Elyra using URL, filesystem, or directory-based component catalogs, Elyra 
must be configured to include information on the fully qualified package names for each custom operator class. This 
configuration is what makes it possible for Elyra to correctly render the import statements for each operator node 
in a given DAG.

If you do not correctly configure an operator package name and try to export or submit a pipeline with custom 
components, Elyra will give you an error message similar to the following:

![Error message requiring configuration](../images/user_guide/best-practices-custom-pipeline-components/config-error-message.png)

As seen above, the operators' fully qualified package names must be added to the `available_airflow_operators` 
variable. This variable has a list value and is a 
[configurable trait](https://medium.com/r/?url=https%3A%2F%2Ftraitlets.readthedocs.io%2Fen%2Fstable%2Fconfig.html) 
in Elyra. To configure `available_airflow_operators`, first create a configuration file from the command line (if 
you do not already have one):

```bash
$ jupyter elyra --config
```

Open the configuration file (a Python file) and find the `PipelineProcessor(LoggingConfigurable)` header. Using 
`c.AirflowPipelineProcessor.available_airflow_operators` as the variable name, modify the variable as needed 
using Python list manipulation methods such as `append`, `extend`, or overwrite all existing values using an 
assignment.

For example, if you want to use the `SlackAPIPostOperator` from the Slack provider package and the `PapermillOperator` 
from the core package in your pipelines, your configuration will look like this:

```python
...
#------------------------------------------------------------------------------
# PipelineProcessor(LoggingConfigurable) configuration
#------------------------------------------------------------------------------

c.AirflowPipelineProcessor.available_airflow_operators.extend(
    [
        "airflow.providers.slack.operators.SlackAPIPostOperator",
        "airflow.operators.papermill_operator.PapermillOperator"
    ]
)
...
```

There is no need to restart JupyterLab in order for these changes to be picked up. You can now successfully 
export or submit a pipeline with these custom components. 

#### Best practices

> This documentation content is currently under development.
