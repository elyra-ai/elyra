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
# Troubleshooting

## How to identify the installed Elyra version

You can use one of these approaches to determine which Elyra version you are running. Note that some of them might not be supported in the version you have installed.

- Open the JupyterLab launcher and locate the "What's new" tile under the "Elyra" category.

  ![Look up Elyra version in JupyterLab launcher](../images/getting_started/troubleshooting/lookup-version-in-launcher.png)

- Open the JupyterLab launcher and click on the "Documentation" tile under the "Elyra" category. 

  ![Look up Elyra version in the documentation](../images/getting_started/troubleshooting/lookup-version-in-documentation.png)

- Open the JupyterLab launcher, click on the "Terminal" tile and run

  ```
  elyra-pipeline --version
  ```

- Open the JupyterLab launcher, click on the "Terminal" tile and run

  ```
  pip list | grep elyra
  ```


## Build or installation issues

- **Elyra build fails with: error An unexpected error occurred: "ENOTDIR: not a directory, scandir..."**

This happens due to yarn not being happy with additional `@` in the path structure. We have seen this when the
OS user has that symbol in its name (e.g. `user@domain.com`)

- **Install fails with: zsh: no matches found: elyra[all]**

This happens when trying to install Elyra via the Z Shell. The Z shell is the default shell on macOS versions of Catalina or later. Ensure that the argument is surrounded by single quotes as follows - this is not necessary when running on bash.
```
pip install --upgrade "elyra[all]"
```
