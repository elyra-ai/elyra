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

# Elyra Release

## Requesting publish access

In order to perform a release, one will need to have publish access to

- PyPI
  - [elyra](https://pypi.org/manage/project/elyra/collaboration/)
  - [elyra-server](https://pypi.org/manage/project/elyra-server/collaboration/)
  - [elyra-r-editor-extension](https://pypi.org/manage/project/elyra-r-editor-extension/collaboration/)
  - [elyra-python-editor-extension](https://pypi.org/manage/project/elyra-python-editor-extension/collaboration/)
  - [elyra-pipeline-editor-extension](https://pypi.org/manage/project/elyra-pipeline-editor-extension/collaboration/)
  - [elyra-code-snippet-extension](https://pypi.org/manage/project/elyra-code-snippet-extension/collaboration/)
  - [kfp-notebook](https://pypi.org/manage/project/kfp-notebook/collaboration/)
  - [airflow-notebook](https://pypi.org/manage/project/airflow-notebook/collaboration/)
- Npm
  - [elyra](https://www.npmjs.com/settings/elyra/members)
- DockerHub org
  - [elyra](https://hub.docker.com/orgs/elyra)
- Quay.io org
  - [quay.io](https://quay.io/organization/elyra)

## Configuring your environment

Publishing a release requires proper access to the external repositories as well as your development environment
pre-configured to publish to these repositories without prompting for password:

### Configuring your environment to publish to PyPI

PyPI package managers will look for repository credentials in a `~/.pypirc` file. The example file below could
be used as a template for configuring your environment:

```
[distutils] # this tells distutils what package indexes you can push to
index-servers =
  pypi

[pypi]
repository:  https://upload.pypi.org/legacy/
username: <USERNAME>
password: <PASSWORD>
```

We use [twine](https://twine.readthedocs.io/en/latest/#installation) for uploading packages to PyPI, and another option
to setup your credentials is to use [twine's keyring support](https://twine.readthedocs.io/en/latest/#keyring-support).

### Configuring your environment to publish to npm.js

When publishing npm packages, user credentials are configured in the `~/.npmrc` file, where your e-mail and access token
should be available:

```
email=<USER EMAIL>
//registry.npmjs.org/:_authToken=<AUTH TOKEN>
```

Follow [these steps](https://docs.npmjs.com/creating-and-viewing-access-tokens) to create your authorization token.

### Configuring signing keys

During publishing, the packages will be signed and that will require you to have support for [pgp](https://gpgtools.org/)
and a valid [signing key](https://gpgtools.tenderapp.com/kb/how-to/first-steps-where-do-i-start-where-do-i-begin-setup-gpgtools-create-a-new-key-your-first-encrypted-mail)

Note: Although this is probably not recommended, the release script expects a signing key that would work without
prompting the user for a passphrase.

## Before you begin

Elyra depends on a few different packages that are under the control of the Elyra community and used
mostly to abstract integration with other runtimes and components.

Currently, these packages are:

- [pipeline-editor](https://github.com/elyra-ai/pipeline-editor)
- [canvas](https://github.com/elyra-ai/canvas)

Before you begin creating a new Elyra release, verify if there is a need to release any of these packages, and if
necessary, update Elyra to use the new release.

## Elyra release process overview

Building an Elyra release consists of the following steps:

- Updating the [changelog.md](../getting_started/changelog.md) with the list of changes added to the release
- Building the Elyra python package.
- Building Elyra JupyterLab extensions as npm packages.
- Generate and build the modified packages to enable single-extension deployment.
- Build and publish multiple docker images

Most of the steps required to prepare and publish a release have been automated through the `create-release.sh` script,
which exposes three goals:

- The `prepare-changelog` goal traverse the recent commits to update the changelog.md for a given release.

```bash
create release prepare-changelog --version 2.3.0
```

- The `prepare` goal create the release artifacts and make them available locally for validation.

```bash
create release prepare --version 2.3.0 --dev-version 2.4.0
```

-- The 'publish' goal get a previous prepared release and publish the artifacts to respective repositories.

```bash
create release publish --version 2.3.0
```

### Creating minor/patch releases from branches

In the case of creating minor/patch releases from a branch, one will need to modify the release script so that it
perform a checkout of the `given branch` after cloning the Elyra repository:

Update the `checkout_code` function in the create-release script and add the following at the end of that function:
```
check_run(['git', 'checkout', '<BRANCH NAME>'], cwd=config.source_dir)
check_run(['git', 'status'], cwd=config.source_dir)
```

## Preparing Elyra release

### Generate the release changelog
```bash
create release prepare-changelog --version 2.3.0
```
- The updated changelog will then be available at `./build/release/elyra` as a git commit
  - The release manager should make any necessary adjustments and/or updates before 'pushing the changelog commit'. 
  - Note that the release manage could also push the change log as a new pull request to gather inputs from the community.

## Prepare the release artifacts
```bash
create-release.py prepare --version 2.0.0 --dev-version 2.1.0 [--rc 0][--beta 0]
```
- The artifacts for the new release will then be available at `./build/release/`
  - The Elyra folder is the main release
  - The other folders, are the individual extensions packaged as standalone packages
```bash
elyra
elyra-code-snippet-extension
elyra-pipeline-editor-extension
elyra-python-editor-extension
elyra-r-editor-extension
```
- Test the release
  - Run multiple scenarios, to make sure each extension is working ok
  - Run the covid-notebook scenario
  - Run the NOAA sample

### Publish the release
```bash
create-release.py publish --version 2.0.0 [--rc 0] [--beta 0]
```
- Build and publish container images based on release tag
```bash
git pull --rebase
git checkout tags/v2.0.0
make container-images publish-container-images
```  

- Update dev and latest image tags based on release tag
```bash
docker tag elyra/elyra:2.0.0 elyra/elyra:dev && docker push elyra/elyra:dev
docker tag elyra/elyra:2.0.0 elyra/elyra:latest && docker push elyra/elyra:latest
docker tag quay.io/elyra/elyra:2.0.0 quay.io/elyra/elyra:dev && docker push quay.io/elyra/elyra:dev
docker tag quay.io/elyra/elyra:2.0.0 quay.io/elyra/elyra:latest && docker push quay.io/elyra/elyra:latest

docker tag elyra/airflow:2.0.0 elyra/airflow:dev && docker push elyra/airflow:dev
docker tag elyra/airflow:2.0.0 elyra/airflow:latest && docker push elyra/airflow:latest
docker tag quay.io/elyra/airflow:2.0.0 quay.io/elyra/airflow:dev && docker push quay.io/elyra/airflow:dev
docker tag quay.io/elyra/airflow:2.0.0 quay.io/elyra/airflow:latest && docker push quay.io/elyra/airflow:latest

docker tag elyra/kf-notebook:2.0.0 elyra/kf-notebook:dev && docker push elyra/kf-notebook:dev
docker tag elyra/kf-notebook:2.0.0 elyra/kf-notebook:latest && docker push elyra/kf-notebook:latest
docker tag quay.io/elyra/kf-notebook:2.0.0 quay.io/elyra/kf-notebook:dev && docker push quay.io/elyra/kf-notebook:dev
docker tag quay.io/elyra/kf-notebook:2.0.0 quay.io/elyra/kf-notebook:latest && docker push quay.io/elyra/kf-notebook:latest
```

- Merge changes for conda-forge
  - https://github.com/conda-forge/elyra-feedstock/pulls
  - https://github.com/conda-forge/elyra-server-feedstock/pulls
  - https://github.com/conda-forge/elyra-code-snippet-extension-feedstock/pulls
  - https://github.com/conda-forge/elyra-pipeline-editor-extension-feedstock/pulls
  - https://github.com/conda-forge/elyra-python-editor-extension-feedstock/pulls
  - https://github.com/conda-forge/elyra-r-editor-extension-feedstock/pulls
