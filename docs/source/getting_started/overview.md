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
## Overview

Elyra is a set of AI-centric extensions to JupyterLab Notebooks.


Elyra currently includes:
* [Notebook Pipelines visual editor](#notebook-pipelines-visual-editor)
* [Ability to run a notebook as a batch job](#ability-to-run-a-notebook-as-a-batch-job)
* [Hybrid runtime support](#hybrid-runtime-support)
* [Python script execution support](#python-script-execution-support)
* [Reusable Code Snippets (Experimental)](#reusable-code-snippets-experimental)
* [Notebook versioning based on git integration](#notebook-versioning-based-on-git-integration)
* [Notebook navigation using auto-generated **Table of Contents**](#notebook-navigation-using-auto-generated-table-of-contents)
* [Reusable configuration for runtimes](#reusable-configuration-for-runtimes)

![Elyra](../images/elyra-main-page.png)

#### Notebook Pipelines visual editor

Building an AI pipeline for a model is hard, breaking down and modularizing a pipeline is harder.
A typical machine/deep learning pipeline begins as a series of preprocessing steps followed by
experimentation/optimization and finally deployment. Each of these steps represent a challenge in
the model development lifecycle.

Elyra provides a **Notebook Pipeline visual editor** for building Notebook-based AI pipelines,
simplifying the conversion of multiple notebooks into batch jobs or workflow.

Currently, the only supported pipeline runtime is
[**Kubeflow Pipelines**](https://www.kubeflow.org/docs/pipelines/overview/pipelines-overview/),
but others can be easily added.

![Notebook Pipeline Editor](../images/pipeline-editor.png)

The pipeline visual editor also enables detailed customization of your pipeline, allowing
users to choose which docker image to use when executing your notebook, setup environment
variables required to properly run your notebook, as well as configuring dependency files 
that need to be available to child notebooks.

![Notebook Pipeline Editor - Node Properties](../images/pipeline-editor-properties.png)

#### Ability to run a notebook as a batch job

Elyra also extends the notebook UI to simplify the submission of a single notebook as a batch job

![Submit Notebook as batch jobs](../images/submit-notebook-batch-job.gif)

#### Hybrid runtime support

Elyra leverages Jupyter Enterprise Gateway to enable Jupyter Notebooks
to share resources across distributed clusters such as Apache Spark, Kubernetes, OpenShift, and the like. 

It simplifies the task of running notebooks interactively on cloud machines,
seamlessly leveraging the power of cloud-based resources such as GPUs and TPUs.  

#### Python script execution support

Elyra exposes **Python Scripts** as first-class citizens, introducing the ability to
create python scripts directly from the workspace launcher, and leveraging the
**Hybrid Runtime Support** to allow users to locally edit their scripts and execute
them against local or cloud-based resources seamlessly.

![Enhanced Python Support](../images/python-runner.png)

#### Reusable Code Snippets (Experimental)

Elyra supports a beta version of the **Code Snippet** feature. 
This allows users to add custom pieces of code that can be reused, making programming in JupyterLab more efficient
by reducing repetitive work.

![Code Snippets](../images/code-snippet-expanded.png)

For more information on how to configure code snippets metadata see [Elyra Code Snippets](../user_guide/code-snippets)

#### Notebook versioning based on git integration

The integrated support for git repositories simplify tracking changes, allowing rollback to working versions
of the code, backups and, most importantly, sharing among team members - fostering productivity by
enabling a collaborative working environment.

![Git Integration](../images/git.png)

#### Notebook navigation using auto-generated **Table of Contents**

The enhanced notebook navigation recognizes **markdown** titles, subtitles, etc to auto-generate
a Notebook **Table of Contents** providing enhanced navigation capabilities. 

![Notebook Table of Contents](../images/notebook-toc.png)

#### Reusable configuration for runtimes

Elyra introduces a 'shared configuration service' that simplifies workspace configuration management,
enabling things like external runtime access details to be configured once and shared
across multiple components.  
