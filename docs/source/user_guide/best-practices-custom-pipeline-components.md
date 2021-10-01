<!--
{% comment %}
Copyright 2018-2021 Elyra Authors

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

> This documentation content is currently under development.
