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
# Elyra Project Structure

Elyra consists of a multi-module project that includes:
* Backend services implemented as Jupyter Extensions
* UI Components that extends JupyterLab functionality implemented as JupyterLab Widgets

   
## Installing Elyra full features

Elyra full installation can be done via pip

```
pip install --upgrade elyra
```

When installing via pip the following occurs

* Backend services are deployed as Jupyter Extensions and automatically enabled
* JupyterLab widgets installed and enabled
* JupyterLab build is started 
