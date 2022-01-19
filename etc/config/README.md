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

This directory root contains files necessary for the installation of Elyra. They are packaged with every
release of Elyra and used as part of the installation process.

### components

Contains the component registry used to populate runtime specific components in the pipeline editor

### jupyter_server_config.d / jupyter_notebook_config.d

Contains the Jupyter specific configuration files necessary to activate the server side extensions of Elyra.
This includes the following extensions:
- Elyra
- Jupyter Resource Usage
- JupyterLab Git 

### metadata

Contains the default/sample runtime image configuration metadata (image registry and location). For more information
on how to add more runtime images see:
[Runtime Image Configuration](https://elyra.readthedocs.io/en/latest/user_guide/runtime-image-conf.html#runtime-image-configuration)

### settings

The page_config.json data is used to provide configuration data to the application environment. For more details
about this file see:
[LabConfig Directories](https://jupyterlab.readthedocs.io/en/latest/user/directories.html#labconfig-directories)

