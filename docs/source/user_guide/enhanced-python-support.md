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
# Enhanced Python Support

Elyra provides **Enhanced Python Support** where Python scripts can be developed and
executed. It also leverages the **Hybrid Runtime Support** to enable running
these scripts in remote environments.

![Enhanced Python Support](../images/python-editor.gif)

The execution of the Python script leverages the available `Python based Kernels`. This enables
users to run their scripts in different configurations and environments.

Elyra also allows submitting a Python script as a single node pipeline for execution in a Kubeflow or Airflow environment in the cloud. This feature is accessible when the Elyra [AI Pipelines](../user_guide/pipelines.md) extension is also enabled.

## Python script execution support

* In the Jupyter Lab Launcher, click the `Python File` icon to create a new Python Script.
* When used in conjunction with `Jupyter Enterprise Gateway`, the dropdown will be populated with more kernel options,
allowing users to run their scripts with remote kernels with more specialized resources.
* To run your script locally, select the `python3` option in the dropdown menu, and click the `Run` icon.

## Ability to run a Python script as a batch job

Elyra allows the execution of a Python script as a batch job in remote cloud environments. This feature leverages the AI pipelines feature and requires access to either a Kubeflow Pipelines or Airflow deployment via a [runtime configuration](../user_guide/runtime-conf).

To submit a Python script as a batch job, open a Python script file and select `Submit Script...` button from the editor toolbar.

![Submit Python Script as a batch job](../images/submit-script.gif)

To learn more about pipeline [runtimes configuration]((../user_guide/runtime-conf)) and [runtime images]((../user_guide/runtime-image-conf)), follow those sections provided in the Elyra user guide documentation.

## Python Editor related components

The Elyra Python editor is based on the JupyterLab editor which is currently based on CodeMirror.

![Python Editor Components](../images/python-editor-components.png)