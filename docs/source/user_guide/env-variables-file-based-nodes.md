<!--
{% comment %}
Copyright 2018-2025 Elyra Authors

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
## System-level environment variables used in file-based pipeline nodes

[Generic pipelines and typed pipelines](pipelines.md) support natively file-based nodes for  Jupyter notebooks, Python scripts, and R scripts. In order to support heterogeneous execution - that is making them runnable to your requiremenents in any runtime environment (JupyterLab, Kubeflow Pipelines, and Apache Airflow) - follow the documentation on environment variables listed below.

There are system-level environment variables for two types of scopes:
- Jupyterlab pipeline generation and validation (PipelineProcessor)
- Runtime image task (Airflow) or component (KFP) execution of file-based node Jupyter notebooks, Python scripts, and R scripts (bootstrapper pipeline run)

This page lists the environment variables; their scope, defaults, and background concept.

### `ELYRA_ENABLE_PIPELINE_INFO`

Scope: Jupyterlab PipelineProcessor and runtime image task execution in runtime environment
Impact: Produces a formatted log INFO message used entirely for support purposes.
Having single-line entries in the log (no embedded newlines) with pipeline name, operation_name, action and Duration makes it easy to cross-evaluate logs across log files.

Background: During processing of Pipelines in jupyterlab, i.e. before execution when logging pipeline info during submitting the pipeline, processing later Pipeline operation dependencies,
submitting the Pipeline to Git, and exporting the Pipeline as KFP Python or yaml or Airflow DAG Python code (not needed with local / LocalPipelineProcessor).

Also used in runtime-specific container environment in bootstrapper.py python code for execution run logging operation info of KFP Pipeline components and Airflow Pipeline / DAG Tasks to
log KFP component / Airflow task execution info when execution of the script starts, dependencies are processed, and the script execution operation ends.
 
Default: We recommend leaving this at its default "true", i.e. no explicit setting of this environment variable necessary.
If you want to set `ELYRA_ENABLE_PIPELINE_INFO` to `false`, you can do so in either
- Jupyterlab at runtime
- Statically baked into Jupyterlab container definition for use in Jupyterlab container build
- Pipeline Editor at Pipeline Properties - Generic Node Defaults - Environment Variables or at Node Properties - Additional Properties - Environment Variables
- Statically baked into Jupyterlab container definition for use in KFP or Airflow runtime image container build

### `ELYRA_GENERIC_NODES_ENABLE_SCRIPT_OUTPUT_TO_S3`

Scope: Runtime image task (Airflow) or component (KFP) execution of file-based node Jupyter notebooks, Python scripts, and R scripts (bootstrapper pipeline run). Relevant for pipeline runs in KFP components or Airflow DAGs.
Background:
- Puts script execution Output / STDOUT into a .log file for Python and R Scripts. 
- Puts script execution Output / STDOUT into a notebookname-output.ipynb and notebookname-Output.html file.

Impact: Controls whether the files are then uploaded to the Elyra S3 bucket, if this environment variable is not set at pipeline, node, or runtime container level.

Default: `true` if not specified, i.e. no explicit setting of this environment variable necessary.

Background: 
If you prefer to use S3-compatible storage for transfer of files between pipeline steps only and **not for logging information / run output of R, Python and Jupyter Notebook files**,
for example because you capture and store logs with central KFP, Airflow, K8S / Openshift mechanisms,
set env var **`ELYRA_GENERIC_NODES_ENABLE_SCRIPT_OUTPUT_TO_S3`** to **`false`**.

If you want to set `ELYRA_GENERIC_NODES_ENABLE_SCRIPT_OUTPUT_TO_S3` to `false`, you can do so in either
- Pipeline Editor at Pipeline Properties - Generic Node Defaults - Environment Variables or at Node Properties - Additional Properties - Environment Variables
- Statically baked into Jupyterlab container definition for use in KFP or Airflow runtime image container build

### `ELYRA_INSTALL_PACKAGES`

Scope: Runtime image task (Airflow) or component (KFP) execution of file-based node Jupyter notebooks, Python scripts, and R scripts (bootstrapper pipeline run)

Impact: Controls whether Elyra’s required packages are installed automatically during the bootstrap phase.

Default: `true` if not specified, i.e. no explicit setting of this environment variable necessary.

Background: 
In air-gapped environments (where internet access is restricted), Elyra cannot automatically download its dependencies. Additionally, in some cases, the required packages may already be installed on the system.

If your environment already has Elyra’s dependencies available, you can set **`ELYRA_INSTALL_PACKAGES`** to **`false`** to avoid installing them again or to avoid having errors in air-gapped environments.
