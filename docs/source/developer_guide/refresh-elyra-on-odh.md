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

# Elyra refresh on Open Data Hub 

A custom Elyra container image is included with [Open Data Hub](https://opendatahub.io/).  This document outlines how to upgrade that image to a newer version. This task is typicaly only performed by Elyra maintainers.

## Update Elyra image stream

The [s2i-lab-elyra](https://github.com/opendatahub-io/s2i-lab-elyra) repository contains the artifacts that make Elyra available as an image stream.

- Install pipenv (version <= 2022.1.8) from PyPI.
  ```
  $ pip install pipenv==2022.1.8
  ```
- Fork the `https://github.com/opendatahub-io/s2i-lab-elyra` repository.
- Git clone the fork. 
  ```
  $ git clone git@github.com:<your-fork>/s2i-lab-elyra.git
  ```
- Create a new branch named `update-to-vX.Y.Z` (replacing X, Y, and Z with the latest major, minor, and patch version number for Elyra).

- Update the following as needed:
  - `.aicoe-ci.yaml` if any version changes to the base container image are needed. Only updated periodically after a new version of the [base image](https://quay.io/repository/thoth-station/s2i-minimal-py38-notebook?tab=tags&tag=latest) has been released and tested and vetted by the upstream team for ODH.
  - `.s2i/environment` if any additional environment variables need to be changed or set
  - `.s2i/run` if any additional bash setup commands need to be added/changed prior to starting Elyra

- Update `Pipfile`:
  - Replace the Elyra version number
    ```
    "elyra[all]" = "==X.Y.Z"
    ```

- Regenerate the `pipfile.lock` file
  ```
  $ pipenv lock --pre
  ```

- Create a pull request providing the following information:
  - Title: `Update elyra image to vX.Y.Z`
  - Description: add links to the [release notes](https://github.com/elyra-ai/elyra/releases) for every version that isn't available yet on Open Data Hub. For example, if the last version on ODH is 3.9.1 and you are bumping Elyra to 3.10.1, add links to the release notes for 3.10.0 and 3.10.1. This enables reviewers and users to determine what is new and why an upgrade to this release should be considered.

  Example pull request: https://github.com/opendatahub-io/s2i-lab-elyra/pull/43 

- After the pull request was merged a [new image release](https://github.com/opendatahub-io/s2i-lab-elyra/releases) is created for you. Take note of the new release `vY.Y.Y`. 
  > The release version is different from the Elyra version! 

## Update manifest files

Once the image stream pull request was merged you can update Open Data Hub manifest files.

- Fork the `https://github.com/opendatahub-io/odh-manifests` repository.
- Git clone the fork. 
  ```
  $ git clone git@github.com:<your-fork>/odh-manifests.git
  ```
- Create a new branch named `update-to-vY.Y.Y` replacing YYY with the image release number.

- Update `jupyterhub/notebook-images/overlays/additional/elyra-notebook-imagestream.yaml`
    - Change the existing `opendatahub.io/notebook-python-dependencies` annotation from `"version":"X.X.X"` to `"version":"X.Y.Z"`.
    - Change all existing occurrences of the old image release `vX.X.X` to the new image release `vY.Y.Y`.
- Update `jupyterhub/notebook-images/overlays/build/elyra-notebook-buildconfig.yaml`
    - Change the existing image stream tag name from `s2i-lab-elyra:vX.X.X` to `s2i-lab-elyra:vY.Y.Y`.
    - Change the git ref from `ref: vX.X.X` to `ref: vY.Y.Y`.
- Create a pull request providing the following information:
  - Title: `Update Elyra notebook image to vY.Y.Y`
  - Description: add links to the [release notes](https://github.com/elyra-ai/elyra/releases) for every version that isn't available yet on Open Data Hub. For example, if the last referenced version in the ODH manifest is 3.9.1 and you are bumping Elyra to 3.10.1, add links to the release notes for 3.10.0 and 3.10.1. This enables reviewers and users to determine what is new and why an upgrade to this release should be considered.

  Example pull request: https://github.com/opendatahub-io/odh-manifests/pull/579
