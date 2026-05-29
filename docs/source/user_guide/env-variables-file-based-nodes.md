<!--
{% comment %}
Copyright 2018-2026 Elyra Authors

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

[Generic pipelines and runtime specific pipelines](pipelines.md) support natively file-based nodes for  Jupyter notebooks, Python scripts, and R scripts. In order to support heterogeneous execution - that is making them runnable to your requirements in any runtime environment (JupyterLab, Kubeflow Pipelines, and Apache Airflow) - follow the documentation on environment variables listed below.

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

### `ELYRA_WRITABLE_CONTAINER_DIR`

Scope: Runtime image task (Airflow) or component (KFP) execution of file-based node Jupyter notebooks, Python scripts, and R scripts

Impact: Specifies the writable directory inside the container where Elyra stores temporary files during pipeline execution.

Default: `/tmp`

Background:
During generic node execution in Kubeflow Pipelines or Apache Airflow, the bootstrapper needs a writable directory to download dependencies, scripts, and notebook files. If the container’s default `/tmp` directory is not writable or has limited space, set this variable to an alternative path.

If you want to change the writable container directory, you can set `ELYRA_WRITABLE_CONTAINER_DIR` in either
- Pipeline Editor at Pipeline Properties - Generic Node Defaults - Environment Variables or at Node Properties - Additional Properties - Environment Variables
- Statically baked into the runtime image container definition

### `ELYRA_WRITABLE_CONTAINER_DIR` (JupyterLab scope)

Scope: JupyterLab PipelineProcessor (used during pipeline generation for KFP and Airflow)

Impact: The value is embedded in the generated pipeline code to configure the container working directory for each generic node.

Default: `/tmp`

### `CRIO_RUNTIME`

Scope: JupyterLab PipelineProcessor (KFP pipeline generation only)

Impact: Enables CRI-O container runtime-specific workarounds during KFP pipeline generation. When set to `True`, the generated pipeline code includes additional configuration for pip and writable volume mounts required by CRI-O environments.

Default: `False`

If you want to enable CRI-O-specific behavior, set `CRIO_RUNTIME` to `True` in the JupyterLab environment where pipelines are submitted.

### `ELYRA_BOOTSTRAP_SCRIPT_URL`

Scope: JupyterLab PipelineProcessor (KFP and Airflow pipeline generation)

Impact: Overrides the URL for the bootstrap script that is downloaded and executed in the container during generic node execution. By default, the URL is constructed from the Elyra GitHub repository (`elyra-ai/elyra`, current release branch).

Default: Constructed as `https://raw.githubusercontent.com/{org}/{repo}/{branch}/elyra/kfp/bootstrapper.py`, where `{org}`, `{repo}`, and `{branch}` default to `elyra-ai`, `elyra`, and the current release tag (or `main` for development builds).

You can also override the individual URL components using:
- `ELYRA_GITHUB_ORG` (default: `elyra-ai`)
- `ELYRA_GITHUB_REPO` (default: `elyra`)
- `ELYRA_GITHUB_BRANCH` (default: `main` for development builds, `v{version}` for releases)

### `ELYRA_REQUIREMENTS_URL`

Scope: JupyterLab PipelineProcessor (KFP and Airflow pipeline generation)

Impact: Overrides the URL for the `requirements-elyra.txt` file that lists Elyra’s runtime dependencies. This file is downloaded during generic node bootstrap and used to install the required Python packages.

Default: Constructed from the same GitHub repository URL components as `ELYRA_BOOTSTRAP_SCRIPT_URL`.

### `ELYRA_PIP_CONFIG_URL`

Scope: JupyterLab PipelineProcessor (KFP pipeline generation, CRI-O environments only)

Impact: Overrides the URL for the `pip.conf` file used in CRI-O environments. This variable is only used when `CRIO_RUNTIME` is set to `True`.

Default: Constructed from the same GitHub repository URL components as `ELYRA_BOOTSTRAP_SCRIPT_URL`.

### `ELYRA_CATALOG_CONNECTOR_MAX_READERS`

Scope: JupyterLab component catalog connector

Impact: Controls the maximum number of reader threads used to read catalog entries in parallel. Increasing this value may speed up catalog loading for large catalogs but will consume more system resources.

Default: `3`

### `ELYRA_CATALOG_UPDATE_TIMEOUT`

Scope: JupyterLab component catalog refresh

Impact: Time in seconds before a warning is logged if a catalog update is still in progress. This does not cancel the update; it only generates a log warning.

Default: `15`

### `ELYRA_WORKER_THREAD_WARNING_THRESHOLD`

Scope: JupyterLab component catalog refresh

Impact: Threshold for outstanding worker thread count. When the number of active catalog refresh threads exceeds this value, a warning is logged.

Default: `10`

### `ELYRA_METADATA_PATH`

Scope: JupyterLab metadata storage

Impact: Overrides the default metadata storage search paths. When set, the specified directories take highest priority when Elyra resolves metadata instances (runtime configurations, runtime images, code snippets, component catalogs). Accepts an OS-specific path-separator-delimited list of directories (`:` on Linux/macOS, `;` on Windows).

Default: Not set. Elyra uses the standard Jupyter data directories.

### `TRUSTED_CA_BUNDLE_PATH`

Scope: JupyterLab (catalog connectors, URL downloads)

Impact: Path to a PEM file containing trusted CA certificates. In environments where SSL server authenticity can only be validated using private public key infrastructure (PKI) with non-publicly-trusted certificate authorities, set this variable to the path of a PEM file containing the required certificates. Elyra uses this bundle for SSL verification when downloading component catalog entries or other resources over HTTPS.

Default: Not set. Standard system CA certificates are used.
