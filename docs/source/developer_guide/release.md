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

# Building an Elyra release


- Check if there is a need of a kfp-notebook release
  - if necessary, update Elyra to use that new release
- Update the [changelog.md](../getting_started/changelog.md)
- Run the release script
```bash
create-release.py prepare --version 2.0.0 --dev-version 2.1.0 [--rc 0]
```
- The artifacts for the new release will then be available at `./build/release/`
  - The Elyra folder is the main release
  - The other folders, are the individual extensions packaged as standalone packages
```bash
elyra
elyra-code-snippet-extension
elyra-pipeline-editor-extension
elyra-python-editor-extension
```
- Test the release
  - Run multiple scenarios, to make sure each extension is working ok
  - Run the covid-notebook scenario
  - Run the NOAA sample
- Publish the release
```bash
create-release.py publish --version 2.0.0 [--rc 0]
```
- Build and publish docker images based on release tag
```bash
git pull --rebase
git checkout tags/v2.0.0
make container-image publish-container-image
```  
- Merge changes for conda-forge
  - https://github.com/conda-forge/elyra-feedstock/pulls
  - https://github.com/conda-forge/elyra-server-feedstock/pulls
  - https://github.com/conda-forge/elyra-code-snippet-extension-feedstock/pulls
  - https://github.com/conda-forge/elyra-python-editor-extension-feedstock/pulls
  - https://github.com/conda-forge/elyra-pipeline-editor-extension-feedstock/pulls
