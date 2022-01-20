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
# Enhanced Script Support

Elyra provides **Enhanced Script Support** where Python and R scripts can be developed and
executed. It also leverages the **Hybrid Runtime Support** to enable running
these scripts in remote environments.

![Enhanced Python Support](../images/python-editor.gif)

The execution of these scripts leverages the available Python and R based Kernels. This enables users to run their scripts in different configurations and environments.

Elyra also allows submitting a Python and R scripts as a single node pipeline for execution in a Kubeflow Pipelines or Apache Airflow environment in the cloud. This feature is accessible when the Elyra [AI Pipelines](../user_guide/pipelines.md) extension is also enabled.

## Python script execution support

In the JupyterLab Launcher, click the `Python Editor` icon to create a new Python script and open the Python Editor.

![Open Python Editor](../images/launcher-python-editor.png)

When used in conjunction with `Jupyter Enterprise Gateway`, the dropdown in the editor's toolbar will be populated with more kernel options,
allowing users to run their scripts with remote kernels with more specialized resources.

To run your script locally, select the `Python 3` option in the dropdown menu, and click the `Run` icon.

## R script execution support

In the JupyterLab Launcher, click the `R Editor` icon to create a new R script and open the R Editor.

![Open R Editor](../images/launcher-r-editor.png)

To run your R script locally you will need to install an R kernel.

If you are using a [conda](https://docs.conda.io/en/latest/miniconda.html) environment:
```bash
$ conda install -y r-irkernel
```

Alternatively, you can install it via [CRAN](https://cran.r-project.org/) on an R console:  
NOTE: You will need to have R installed and available prior to using this method of installing the R kernel.

In an R interactive console,
```bash
> install.packages('IRkernel')
```
then enable it on Jupyter:
```bash
> IRkernel::installspec()
```

You can check that the R kernel was successfully installed with:
```bash
jupyter kernelspec list
```

To run the script, from the Script editor toolbar, select the `R` option in the kernel selection drop-down, and click the `Run` icon.

Similar to the extended support for Python kernels when using the `Jupyter Enterprise Gateway`, the Script editor dropdown in the toolbar will display all available remote kernel options for R scripts.

### R-Editor Language Server Protocol
You can enable R language server features for the R Editor in a conda environment with the following command:
```bash
$ conda install -c conda-forge r-languageserver
```

You can find more documentation about conda-forge [here](https://github.com/conda-forge/r-languageserver-feedstock).

Another option is to install the R language server through the [CRAN](https://cran.r-project.org/). Once R is installed, use the following [command](https://github.com/REditorSupport/languageserver):
```bash
$ R -e install.packages("languageserver")
```

## Ability to execute a Python and R script as a pipeline

Elyra allows the execution of Python and R scripts as a pipeline or batch job in remote cloud environments. This feature leverages the AI pipelines feature and requires access to either a Kubeflow Pipelines or Apache Airflow deployment via a [runtime configuration](../user_guide/runtime-conf).

To run a Python or R script as a pipeline, open the script file and select `Run as Pipeline` button from the editor toolbar.

![Run Python Script as pipeline](../images/submit-script.gif)

To learn more about [runtime configurations](../user_guide/runtime-conf) and [runtime images](../user_guide/runtime-image-conf), follow those sections provided in the Elyra user guide documentation.

## Script Editors components

The Elyra Python Editor and R Editor are based on the JupyterLab editor which is currently based on CodeMirror.

![Python Editor and R Editor Components](../images/script-editor-components.png)