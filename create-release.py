#!/usr/bin/env python3
#
# Copyright 2018-2023 Elyra Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


import argparse
import elyra
import elyra._version
import git
import io
import os
import re
import shutil
import subprocess
import sys

from datetime import datetime
from pathlib import Path
from types import SimpleNamespace

config: SimpleNamespace

VERSION_REG_EX = r"(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(\.(?P<pre_release>[a-z]+)(?P<build>\d+))?"

DEFAULT_GIT_ORG = "elyra-ai"
DEFAULT_GIT_BRANCH = "main"
DEFAULT_BUILD_DIR = "build/release"


class DependencyException(Exception):
    """Error if dependency is missing"""


class MissingReleaseArtifactException(Exception):
    """Error if an artifact being released is not available"""


class UpdateVersionException(Exception):
    """Error if the old version is invalid or cannot be found, or if there's a duplicate version"""


def check_run(args, cwd=os.getcwd(), capture_output=True, env=None, shell=False) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(args, cwd=cwd, capture_output=capture_output, check=True)
    except subprocess.CalledProcessError as ex:
        raise RuntimeError(f'Error executing process: {ex.stderr.decode("unicode_escape")}') from ex


def check_output(args, cwd=os.getcwd(), env=None, shell=False) -> str:
    response = check_run(args, cwd, capture_output=True, env=env, shell=shell)
    return response.stdout.decode("utf-8").replace("\n", "")


def dependency_exists(command) -> bool:
    """Returns true if a command exists on the system"""
    try:
        check_run(["which", command])
    except subprocess.CalledProcessError:
        return False

    return True


def sed(file: str, pattern: str, replace: str) -> None:
    """Perform regex substitution on a given file"""
    try:
        if sys.platform in ["linux", "linux2"]:
            check_run(["sed", "-i", "-e", f"s#{pattern}#{replace}#g", file], capture_output=False)
        elif sys.platform == "darwin":
            check_run(["sed", "-i", "", "-e", f"s#{pattern}#{replace}#g", file], capture_output=False)
        else:  # windows, other
            raise RuntimeError(f"Current operating system not supported for release publishing: {sys.platform}: ")
    except Exception as ex:
        raise RuntimeError(f"Error processing updated to file {file}: ") from ex


def validate_dependencies() -> None:
    """Error if a dependency is missing or invalid"""
    if not dependency_exists("git"):
        raise DependencyException("Please install git https://git-scm.com/downloads")
    if not dependency_exists("node"):
        raise DependencyException("Please install node.js 18+ https://nodejs.org/")
    if not dependency_exists("yarn"):
        raise DependencyException("Please install yarn https://classic.yarnpkg.com/")
    if not dependency_exists("twine"):
        raise DependencyException("Please install twine https://twine.readthedocs.io/en/latest/#installation")


def validate_environment() -> None:
    """Validate environment configurations are valid"""
    pass


def update_version_to_release() -> None:
    global config

    old_version = config.old_version
    old_npm_version = config.old_npm_version
    new_version = config.new_version
    new_npm_version = config.new_npm_version

    try:
        # Update backend version
        sed(_source(".bumpversion.cfg"), rf"^current_version* =* {old_version}", f"current_version = {new_version}")
        sed(_source("elyra/_version.py"), rf'^__version__* =* "{old_version}"', f'__version__ = "{new_version}"'),
        sed(_source("README.md"), rf"elyra {old_version}", f"elyra {new_version}")
        sed(_source("docs/source/getting_started/installation.md"), rf"elyra {old_version}", f"elyra {new_version}")

        # Update docker related tags
        sed(_source("Makefile"), r"^TAG:=dev", f"TAG:={new_version}")
        sed(_source("README.md"), r"elyra:dev ", f"elyra:{new_version} ")
        sed(_source("etc/docker/kubeflow/README.md"), r"kf-notebook:dev", f"kf-notebook:{new_version}")
        sed(_source("docs/source/getting_started/installation.md"), r"elyra:dev ", f"elyra:{new_version} ")
        sed(_source("docs/source/recipes/configure-airflow-as-a-runtime.md"), r"main", f"{config.tag}")
        sed(_source("docs/source/recipes/deploying-elyra-in-a-jupyterhub-environment.md"), r"dev", f"{new_version}")
        sed(_source("docs/source/recipes/using-elyra-with-kubeflow-notebook-server.md"), r"main", f"{new_version}")

        # Update UI component versions
        sed(_source("README.md"), rf"v{old_npm_version}", f"v{new_version}")
        sed(_source("docs/source/getting_started/installation.md"), rf"v{old_npm_version}", f"v{new_version}")

        sed(
            _source("packages/theme/src/index.ts"),
            r"https://elyra.readthedocs.io/en/latest/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
        )

        sed(
            _source("packages/theme/src/index.ts"),
            r"https://github.com/elyra-ai/elyra/releases/latest/",
            rf"https://github.com/elyra-ai/elyra/releases/v{new_version}/",
        )

        sed(
            _source("packages/theme/src/index.ts"),
            r"What's new in latest",
            rf"What's new in v{new_version}",
        )

        sed(
            _source("elyra/cli/pipeline_app.py"),
            r"https://elyra.readthedocs.io/en/latest/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
        )

        # Update documentation version for elyra-metadata cli help
        sed(
            _source("elyra/metadata/metadata_app_utils.py"),
            r"https://elyra.readthedocs.io/en/latest/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
        )

        sed(
            _source("packages/pipeline-editor/src/EmptyPipelineContent.tsx"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        sed(
            _source("packages/pipeline-editor/src/PipelineEditorWidget.tsx"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        # update documentation references in schema definitions
        # located in elyra/metadata/schemas/
        sed(
            _source("elyra/metadata/schemas/url-catalog.json"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/local-directory-catalog.json"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/local-file-catalog.json"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/airflow.json"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/kfp.json"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/code-snippet.json"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/runtime-image.json"),
            r"https://elyra.readthedocs.io/en/latest/user_guide/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
        )

        # Update documentation references in documentation
        sed(
            _source("docs/source/user_guide/jupyterlab-interface.md"),
            r"https://elyra.readthedocs.io/en/latest/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
        )

        # Update GitHub references in documentation
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            r"elyra-ai/elyra/main/etc/kfp/pip.conf",
            rf"elyra-ai/elyra/v{new_version}/etc/kfp/pip.conf",
        )
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            r"elyra-ai/elyra/main/elyra/kfp/bootstrapper.py",
            rf"elyra-ai/elyra/v{new_version}/elyra/kfp/bootstrapper.py",
        )
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            r"elyra-ai/elyra/main/elyra/airflow/bootstrapper.py",
            rf"elyra-ai/elyra/v{new_version}/elyra/airflow/bootstrapper.py",
        )
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            r"elyra-ai/elyra/main/etc/generic/requirements-elyra.txt",
            rf"elyra-ai/elyra/v{new_version}/etc/generic/requirements-elyra.txt",
        )

        check_run(
            ["lerna", "version", new_npm_version, "--no-git-tag-version", "--no-push", "--yes", "--exact"],
            cwd=config.source_dir,
        )
        check_run(["yarn", "version", "--new-version", new_npm_version, "--no-git-tag-version"], cwd=config.source_dir)

    except Exception as ex:
        raise UpdateVersionException from ex


def update_version_to_dev() -> None:
    global config

    new_version = config.new_version
    dev_version = config.dev_version
    dev_npm_version = config.dev_npm_version

    try:
        # Update backend version
        sed(_source(".bumpversion.cfg"), rf"^current_version* =* {new_version}", f"current_version = {dev_version}")
        sed(_source("elyra/_version.py"), rf'^__version__* =* "{new_version}"', f'__version__ = "{dev_version}"')
        sed(_source("README.md"), rf"elyra {new_version}", f"elyra {dev_version}")
        sed(_source("docs/source/getting_started/installation.md"), rf"elyra {new_version}", f"elyra {dev_version}")

        # Update docker related tags
        sed(_source("Makefile"), rf"^TAG:={new_version}", "TAG:=dev")
        sed(_source("README.md"), rf"elyra:{new_version} ", "elyra:dev ")
        sed(_source("etc/docker/kubeflow/README.md"), rf"kf-notebook:{new_version}", "kf-notebook:dev")
        sed(_source("docs/source/getting_started/installation.md"), rf"elyra:{new_version} ", "elyra:dev ")
        sed(_source("docs/source/recipes/configure-airflow-as-a-runtime.md"), rf"{config.tag}", "main")
        sed(_source("docs/source/recipes/deploying-elyra-in-a-jupyterhub-environment.md"), rf"{new_version}", "dev")
        sed(_source("docs/source/recipes/using-elyra-with-kubeflow-notebook-server.md"), rf"{new_version}", "main")

        # Update UI component versions
        sed(_source("README.md"), rf"extension v{new_version}", f"extension v{dev_npm_version}")
        sed(
            _source("docs/source/getting_started/installation.md"),
            rf"extension v{new_version}",
            f"extension v{dev_npm_version}",
        )

        sed(
            _source("packages/theme/src/index.ts"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
            rf"https://elyra.readthedocs.io/en/latest/",
        )

        sed(
            _source("packages/theme/src/index.ts"),
            rf"https://github.com/elyra-ai/elyra/releases/v{new_version}/",
            rf"https://github.com/elyra-ai/elyra/releases/latest/",
        )

        sed(
            _source("packages/theme/src/index.ts"),
            rf"What's new in v{new_version}",
            rf"What's new in latest",
        )

        # Update documentation references in documentation
        sed(
            _source("docs/source/user_guide/jupyterlab-interface.md"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
            r"https://elyra.readthedocs.io/en/latest/",
        )

        sed(
            _source("elyra/cli/pipeline_app.py"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
            rf"https://elyra.readthedocs.io/en/latest/",
        )

        # Update documentation version for elyra-metadata cli help
        sed(
            _source("elyra/metadata/metadata_app_utils.py"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
            rf"https://elyra.readthedocs.io/en/latest/",
        )

        sed(
            _source("packages/pipeline-editor/src/EmptyPipelineContent.tsx"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        sed(
            _source("packages/pipeline-editor/src/PipelineEditorWidget.tsx"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        # Update GitHub references in documentation
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            rf"elyra-ai/elyra/v{new_version}/etc/kfp/pip.conf",
            r"elyra-ai/elyra/main/etc/kfp/pip.conf",
        )
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            rf"elyra-ai/elyra/v{new_version}/elyra/kfp/bootstrapper.py",
            r"elyra-ai/elyra/main/elyra/kfp/bootstrapper.py",
        )
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            rf"elyra-ai/elyra/v{new_version}/elyra/airflow/bootstrapper.py",
            r"elyra-ai/elyra/main/elyra/airflow/bootstrapper.py",
        )
        sed(
            _source("docs/source/recipes/running-elyra-in-air-gapped-environment.md"),
            rf"elyra-ai/elyra/v{new_version}/etc/generic/requirements-elyra.txt",
            r"elyra-ai/elyra/main/etc/generic/requirements-elyra.txt",
        )

        # update documentation references in schema definitions
        # located in elyra/metadata/schemas/
        sed(
            _source("elyra/metadata/schemas/url-catalog.json"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/local-directory-catalog.json"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/local-file-catalog.json"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/airflow.json"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/kfp.json"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/code-snippet.json"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        sed(
            _source("elyra/metadata/schemas/runtime-image.json"),
            rf"https://elyra.readthedocs.io/en/v{new_version}/user_guide/",
            rf"https://elyra.readthedocs.io/en/latest/user_guide/",
        )

        check_run(
            ["lerna", "version", dev_npm_version, "--no-git-tag-version", "--no-push", "--yes", "--exact"],
            cwd=config.source_dir,
        )
        check_run(["yarn", "version", "--new-version", dev_npm_version, "--no-git-tag-version"], cwd=config.source_dir)

    except Exception as ex:
        raise UpdateVersionException from ex


def _source(file: str) -> str:
    global config

    return os.path.join(config.source_dir, file)


def checkout_code() -> None:
    global config

    print("-----------------------------------------------------------------")
    print("-------------------- Retrieving source code ---------------------")
    print("-----------------------------------------------------------------")

    print(f"Cloning repository: {config.git_url}")
    if os.path.exists(config.work_dir):
        print(f"Removing working directory: {config.work_dir}")
        shutil.rmtree(config.work_dir)
    print(f"Creating working directory: {config.work_dir}")
    os.makedirs(config.work_dir)
    print(f"Cloning : {config.git_url} to {config.work_dir}")
    check_run(["git", "clone", config.git_url, "-b", config.git_branch], cwd=config.work_dir)
    check_run(["git", "config", "user.name", config.git_user_name], cwd=config.source_dir)
    check_run(["git", "config", "user.email", config.git_user_email], cwd=config.source_dir)

    print("")


def build_release():
    global config

    print("-----------------------------------------------------------------")
    print("----------------------- Building Release ------------------------")
    print("-----------------------------------------------------------------")

    # Build wheels and source packages
    check_run(["make", "release"], cwd=config.source_dir, capture_output=False)

    if not config.pre_release:
        # Build container images from tagged release
        check_run(["git", "checkout", f"tags/v{config.new_version}"], cwd=config.source_dir, capture_output=False)
        check_run(["make", "container-images"], cwd=config.source_dir, capture_output=False)
        check_run(["git", "checkout", "main"], cwd=config.source_dir, capture_output=False)

    print("")


def build_server():
    global config

    print("-----------------------------------------------------------------")
    print("------------------------ Building Server ------------------------")
    print("-----------------------------------------------------------------")

    # update project name
    sed(_source("pyproject.toml"), r'name="elyra"', 'name="elyra-server"')
    sed(
        _source("pyproject.toml"),
        r'description="Elyra provides AI Centric extensions to JupyterLab"',
        'description="The elyra-server package provides common core libraries and functions that are required by '
        "Elyra's individual extensions. Note: Installing this package alone will not enable the use of Elyra. "
        "Please install the 'elyra' package instead. e.g. pip install elyra[all]\"",
    )

    # build server wheel
    check_run(["make", "build-server"], cwd=config.source_dir, capture_output=False)

    # revert project name
    check_run(["git", "reset", "--hard"], cwd=config.source_dir, capture_output=False)

    print("")


def show_release_artifacts():
    global config
    dist_dir = os.path.join(config.source_dir, "dist")

    print("-----------------------------------------------------------------")
    print("------------------------ Release Files --------------------------")
    print("-----------------------------------------------------------------")

    print("")
    print(f"Location \t {dist_dir}")
    print("")
    check_run(["ls", "-la", dist_dir], capture_output=False)
    print("")


def copy_extension_dir(extension: str, work_dir: str) -> None:
    global config

    extension_package_source_dir = os.path.join(config.source_dir, "build/labextensions/@elyra", extension)
    extension_package_dest_dir = os.path.join(work_dir, "build/labextensions/@elyra", extension)
    os.makedirs(os.path.dirname(extension_package_dest_dir), exist_ok=True)
    shutil.copytree(extension_package_source_dir, extension_package_dest_dir)


def generate_changelog() -> None:
    global config

    print("-----------------------------------------------------------------")
    print("--------------------- Preparing Changelog -----------------------")
    print("-----------------------------------------------------------------")

    changelog_path = os.path.join(config.source_dir, "docs/source/getting_started/changelog.md")
    changelog_backup_path = os.path.join(config.source_dir, "docs/source/getting_started/changelog.bak")
    if os.path.exists(changelog_backup_path):
        os.remove(changelog_backup_path)
    shutil.copy(changelog_path, changelog_backup_path)

    repo = git.Repo(config.source_dir)

    # define static header
    header_lines = [
        "# Changelog\n",
        "\n",
        "A summary of new feature highlights is located on the [GitHub release page](https://github.com/elyra-ai/elyra/releases).\n",
        "\n",
    ]

    # Start generating the release header on top of the changelog
    with io.open(changelog_path, "r+") as changelog:
        # add static header
        for line in header_lines:
            changelog.write(line)
        # add release section
        changelog.write(f'## Release {config.new_version} - {datetime.now().strftime("%m/%d/%Y")}\n')
        changelog.write("\n")

        start = 0
        page_size = 10
        continue_paginating = True
        while continue_paginating:
            # paginate the list of commits until it finds the begining of release changes
            # which is denominated by a commit titled 'Prepare for next development iteration'
            commits = list(repo.iter_commits(max_count=page_size, skip=start))
            start += page_size
            for commit in commits:
                # for each commit, get it's title and prepare a changelog
                # entry linking to the related pull request
                commit_title = commit.message.splitlines()[0]
                # commit_hash = commit.hexsha
                # print(f'>>> {commit_hash} - {commit_title}')
                if commit_title != "Prepare for next development iteration":
                    pr_string = ""
                    pr = re.findall("\(#(.*?)\)", commit_title)
                    if pr:
                        commit_title = re.sub("\(#(.*?)\)", "", commit_title).strip()
                        pr_string = f" - [#{pr[0]}](https://github.com/elyra-ai/elyra/pull/{pr[0]})"
                    changelog_entry = f"- {commit_title}{pr_string}\n"
                    changelog.write(changelog_entry)
                else:
                    # here it found the first commit of the release
                    # changelog for the release is done
                    # exit the loop
                    continue_paginating = False
                    break

        # copy the remaining changelog at the bottom of the new content
        with io.open(changelog_backup_path) as old_changelog:
            # ignore existing static header
            line = old_changelog.readline()
            while line and line.startswith("## Release") is False:
                line = old_changelog.readline()

            changelog.write("\n")

            while line:
                changelog.write(line)
                line = old_changelog.readline()


def prepare_extensions_release() -> None:
    global config

    print("-----------------------------------------------------------------")
    print("--------------- Preparing Individual Extensions -----------------")
    print("-----------------------------------------------------------------")

    extensions = {
        "elyra-code-snippet-extension": SimpleNamespace(
            packages=["code-snippet-extension", "metadata-extension", "theme-extension"],
            description=f"The Code Snippet editor extension adds support for reusable code fragments, "
            f"making programming in JupyterLab more efficient by reducing repetitive work. "
            f"See https://elyra.readthedocs.io/en/v{config.new_version}/user_guide/code-snippets.html",
        ),
        "elyra-code-viewer-extension": SimpleNamespace(
            packages=["code-viewer-extension"],
            description="The Code Viewer extension adds the ability to display a given chunk of code "
            "(string) in a transient read-only 'editor' without needing to create a file."
            "This extension will be available in JupyterLab core in a near future release and removed "
            "from Elyra as a standalone extension.",
        ),
        "elyra-pipeline-editor-extension": SimpleNamespace(
            packages=["code-viewer-extension", "pipeline-editor-extension", "metadata-extension", "theme-extension"],
            description=f"The Visual Editor Pipeline extension is used to build AI pipelines from notebooks, "
            f"Python scripts and R scripts, simplifying the conversion of multiple notebooks "
            f"or script files into batch jobs or workflows."
            f"See https://elyra.readthedocs.io/en/v{config.new_version}/user_guide/pipelines.html",
        ),
        "elyra-python-editor-extension": SimpleNamespace(
            packages=["python-editor-extension", "metadata-extension", "theme-extension", "script-debugger-extension"],
            description=f"The Python Script editor extension contains support for Python files, "
            f"which can take advantage of the Hybrid Runtime Support enabling users to "
            f"locally edit, execute and debug .py scripts against local or cloud-based resources."
            f"See https://elyra.readthedocs.io/en/v{config.new_version}/user_guide/enhanced-script-support.html",
        ),
        "elyra-r-editor-extension": SimpleNamespace(
            packages=["r-editor-extension", "metadata-extension", "theme-extension", "script-debugger-extension"],
            description=f"The R Script editor extension contains support for R files, which can take "
            f"advantage of the Hybrid Runtime Support enabling users to locally edit .R scripts "
            f"and execute them against local or cloud-based resources."
            f"See https://elyra.readthedocs.io/en/v{config.new_version}/user_guide/enhanced-script-support.html",
        ),
        "elyra-scala-editor-extension": SimpleNamespace(
            packages=["scala-editor-extension", "metadata-extension", "theme-extension", "script-debugger-extension"],
            description=f"The Scala Language editor extension contains support for Scala files, which can take "
            f"advantage of the Hybrid Runtime Support enabling users to locally edit .scala files "
            f"and execute them against local or cloud-based resources."
            f"See https://elyra.readthedocs.io/en/v{config.new_version}/user_guide/enhanced-script-support.html",
        ),
    }

    for extension in extensions:
        extension_source_dir = os.path.join(config.work_dir, extension)
        print(f"Preparing extension : {extension} at {extension_source_dir}")
        # copy extension package template to working directory
        if os.path.exists(extension_source_dir):
            print(f"Removing working directory: {config.source_dir}")
            shutil.rmtree(extension_source_dir)
        check_run(["mkdir", "-p", extension_source_dir], cwd=config.work_dir)
        print(f'Copying : {_source("etc/templates/setup.py")} to {extension_source_dir}')
        check_run(["cp", _source("etc/templates/setup.py"), extension_source_dir], cwd=config.work_dir)
        # update template
        setup_file = os.path.join(extension_source_dir, "setup.py")
        sed(setup_file, "{{package-name}}", extension)
        sed(setup_file, "{{version}}", config.new_version)
        sed(setup_file, "{{data - files}}", re.escape("('share/jupyter/labextensions', 'build/labextensions', '**')"))
        sed(setup_file, "{{install - requires}}", f"'elyra-server=={config.new_version}',")
        sed(setup_file, "{{description}}", f"'{extensions[extension].description}'")

        for dependency in extensions[extension].packages:
            copy_extension_dir(dependency, extension_source_dir)

        # build extension
        check_run(["python", "setup.py", "bdist_wheel", "sdist"], cwd=extension_source_dir)
        print("")


def prepare_runtime_extensions_package_release() -> None:
    global config

    print("-----------------------------------------------------------------")
    print("---------------- Preparing Individual Packages ------------------")
    print("-----------------------------------------------------------------")

    packages = {"kfp-notebook": ["kfp>=1.6.3"], "airflow-notebook": ["pygithub", "black"]}

    packages_source = {"kfp-notebook": "kfp", "airflow-notebook": "airflow"}

    for package in packages:
        package_source_dir = os.path.join(config.work_dir, package)
        print(f"Preparing package : {package} at {package_source_dir}")
        # copy extension package template to working directory
        if os.path.exists(package_source_dir):
            print(f"Removing working directory: {config.source_dir}")
            shutil.rmtree(package_source_dir)
        check_run(["mkdir", "-p", package_source_dir], cwd=config.work_dir)
        print(f'Copying : {_source("etc/templates/setup.py")} to {package_source_dir}')
        check_run(["cp", _source("etc/templates/setup.py"), package_source_dir], cwd=config.work_dir)
        # update template
        setup_file = os.path.join(package_source_dir, "setup.py")
        sed(setup_file, "{{package-name}}", package)
        sed(setup_file, "{{version}}", config.new_version)
        # no data files
        sed(setup_file, "{{data - files}}", "")
        # prepare package specific dependencies
        requires = ""
        for dependency in packages[package]:
            requires += f"'{dependency}',"
        sed(setup_file, "{{install - requires}}", requires)
        # copy source files
        source_dir = os.path.join(config.source_dir, "elyra", packages_source[package])
        dest_dir = os.path.join(package_source_dir, "elyra", packages_source[package])
        print(f"Copying package source from {source_dir} to {dest_dir}")
        Path(os.path.join(package_source_dir, "elyra")).mkdir(parents=True, exist_ok=True)
        shutil.copytree(source_dir, dest_dir)

        # build extension
        check_run(["python", "setup.py", "bdist_wheel", "sdist"], cwd=package_source_dir)
        print("")


def prepare_changelog() -> None:
    """
    Prepare a release changelog
    """
    global config
    print(f"Generating changelog for release {config.new_version}")
    print("")

    # clone repository
    checkout_code()
    # generate changelog with new release list of commits
    generate_changelog()
    # commit
    check_run(
        ["git", "commit", "-a", "-m", f"Update changelog for release {config.new_version}"], cwd=config.source_dir
    )


def prepare_release() -> None:
    """
    Prepare a release
    """
    global config
    print(f"Processing release from {config.old_version} to {config.new_version} ")
    print("")

    # clone repository
    checkout_code()
    # generate changelog with new release list of commits
    prepare_changelog()
    # Update to new release version
    update_version_to_release()
    # commit and tag
    check_run(["git", "commit", "-a", "-m", f"Release v{config.new_version}"], cwd=config.source_dir)
    check_run(["git", "tag", config.tag], cwd=config.source_dir)
    # server-only wheel
    build_server()
    # build release wheel and npm artifacts
    build_release()
    # show built release artifacts
    show_release_artifacts()
    # back to development
    update_version_to_dev()
    # commit
    check_run(["git", "commit", "-a", "-m", f"Prepare for next development iteration"], cwd=config.source_dir)
    # prepare extensions
    prepare_extensions_release()
    # prepare runtime extsnsions
    prepare_runtime_extensions_package_release()


def publish_release(working_dir) -> None:
    global config

    files_to_publish = [
        f"{config.source_dir}/dist/elyra-{config.new_version}-py3-none-any.whl",
        f"{config.source_dir}/dist/elyra-{config.new_version}.tar.gz",
        f"{config.source_dir}/dist/elyra_server-{config.new_version}-py3-none-any.whl",
        f"{config.source_dir}/dist/elyra_server-{config.new_version}.tar.gz",
        f"{config.work_dir}/airflow-notebook/dist/airflow_notebook-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/airflow-notebook/dist/airflow-notebook-{config.new_version}.tar.gz",
        f"{config.work_dir}/kfp-notebook/dist/kfp_notebook-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/kfp-notebook/dist/kfp-notebook-{config.new_version}.tar.gz",
        f"{config.work_dir}/elyra-code-snippet-extension/dist/elyra_code_snippet_extension-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/elyra-code-snippet-extension/dist/elyra-code-snippet-extension-{config.new_version}.tar.gz",
        f"{config.work_dir}/elyra-code-viewer-extension/dist/elyra_code_viewer_extension-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/elyra-code-viewer-extension/dist/elyra-code-viewer-extension-{config.new_version}.tar.gz",
        f"{config.work_dir}/elyra-pipeline-editor-extension/dist/elyra_pipeline_editor_extension-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/elyra-pipeline-editor-extension/dist/elyra-pipeline-editor-extension-{config.new_version}.tar.gz",
        f"{config.work_dir}/elyra-python-editor-extension/dist/elyra_python_editor_extension-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/elyra-python-editor-extension/dist/elyra-python-editor-extension-{config.new_version}.tar.gz",
        f"{config.work_dir}/elyra-r-editor-extension/dist/elyra_r_editor_extension-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/elyra-r-editor-extension/dist/elyra-r-editor-extension-{config.new_version}.tar.gz",
        f"{config.work_dir}/elyra-scala-editor-extension/dist/elyra_scala_editor_extension-{config.new_version}-py3-none-any.whl",
        f"{config.work_dir}/elyra-scala-editor-extension/dist/elyra-scala-editor-extension-{config.new_version}.tar.gz",
    ]

    print("-----------------------------------------------------------------")
    print("---------------------- Publishing to PyPI -----------------------")
    print("-----------------------------------------------------------------")

    # Validate all artifacts to be published are available
    for file in files_to_publish:
        if not os.path.exists(file):
            raise MissingReleaseArtifactException(f"Missing release file: {file}")

    # push files to PyPI
    for file in files_to_publish:
        print(f"Publishing: {file}")
        check_run(["twine", "upload", "--sign", file], cwd=working_dir)

    print("-----------------------------------------------------------------")
    print("--------------- Pushing Release and Tag to git ------------------")
    print("-----------------------------------------------------------------")

    # push release and tags to git
    print()
    print("Pushing release to git")
    check_run(["git", "push"], cwd=config.source_dir)
    print("Pushing release tag to git")
    check_run(["git", "push", "--tags"], cwd=config.source_dir)

    print("-----------------------------------------------------------------")
    print("--------------- Preparing to push npm packages ------------------")
    print("-----------------------------------------------------------------")

    # checkout the tag
    print()
    print(f"Checking out release tag {config.tag}")
    check_run(["git", "checkout", config.tag], cwd=config.source_dir)
    check_run(["git", "status"], cwd=config.source_dir)

    print("-----------------------------------------------------------------")
    print("-------------------- Pushing npm packages -----------------------")
    print("-----------------------------------------------------------------")

    # publish npm packages
    print()
    print(f"publishing npm packages")
    check_run(
        ["lerna", "publish", "--yes", "from-package", "--no-git-tag-version", "--no-verify-access", "--no-push"],
        cwd=config.source_dir,
    )

    print("-----------------------------------------------------------------")
    print("-------------------- Pushing container images -------------------")
    print("-----------------------------------------------------------------")
    # push container images
    print()
    if not config.pre_release:
        print(f"Pushing container images")
        is_latest = config.git_branch == "main"
        check_run(["git", "checkout", f"tags/v{config.new_version}"], cwd=config.source_dir, capture_output=False)
        check_run(["make", "publish-container-images", f"IMAGE_IS_LATEST={is_latest}"], cwd=config.source_dir)
        check_run(["git", "checkout", "main"], cwd=config.source_dir, capture_output=False)


def initialize_config(args=None) -> SimpleNamespace:
    if not args:
        raise ValueError("Invalid command line arguments")

    v = re.search(VERSION_REG_EX, elyra._version.__version__)

    configuration = {
        "goal": args.goal,
        "git_url": f"git@github.com:{args.org or DEFAULT_GIT_ORG}/elyra.git",
        "git_branch": args.branch or DEFAULT_GIT_BRANCH,
        "git_hash": "HEAD",
        "git_user_name": check_output(["git", "config", "user.name"]),
        "git_user_email": check_output(["git", "config", "user.email"]),
        "base_dir": os.getcwd(),
        "work_dir": os.path.join(os.getcwd(), DEFAULT_BUILD_DIR),
        "source_dir": os.path.join(os.getcwd(), DEFAULT_BUILD_DIR, "elyra"),
        "old_version": elyra._version.__version__,
        "old_npm_version": f"{v['major']}.{v['minor']}.{v['patch']}-dev",
        "new_version": (
            args.version
            if (not args.rc or not str.isdigit(args.rc)) and (not args.beta or not str.isdigit(args.beta))
            else f"{args.version}rc{args.rc}" if args.rc else f"{args.version}b{args.beta}"
        ),
        "new_npm_version": (
            args.version
            if (not args.rc or not str.isdigit(args.rc)) and (not args.beta or not str.isdigit(args.beta))
            else f"{args.version}-rc.{args.rc}" if args.rc else f"{args.version}-beta.{args.beta}"
        ),
        "rc": args.rc,
        "beta": args.beta,
        "dev_version": f"{args.dev_version}.dev0",
        "dev_npm_version": f"{args.dev_version}-dev",
        "tag": (
            f"v{args.version}"
            if (not args.rc or not str.isdigit(args.rc)) and (not args.beta or not str.isdigit(args.beta))
            else f"v{args.version}rc{args.rc}" if args.rc else f"v{args.version}b{args.beta}"
        ),
        "pre_release": True if (args.rc or args.beta) else False,
    }

    global config
    config = SimpleNamespace(**configuration)


def print_config() -> None:
    global config
    print("")
    print("-----------------------------------------------------------------")
    print("--------------------- Release configuration ---------------------")
    print("-----------------------------------------------------------------")
    print(f"Goal \t\t\t -> {config.goal}")
    print(f"Git URL \t\t -> {config.git_url}")
    print(f"Git Branch \t\t -> {config.git_branch}")
    print(f"Git reference \t\t -> {config.git_hash}")
    print(f"Git user \t\t -> {config.git_user_name}")
    print(f"Git user email \t\t -> {config.git_user_email}")
    print(f"Work dir \t\t -> {config.work_dir}")
    print(f"Source dir \t\t -> {config.source_dir}")
    print(f"Old Version \t\t -> {config.old_version}")
    print(f"Old NPM Version \t -> {config.old_npm_version}")
    print(f"New Version \t\t -> {config.new_version}")
    print(f"New NPN Version \t -> {config.new_npm_version}")
    if config.rc is not None:
        print(f"RC number \t\t -> {config.rc}")
    if config.beta is not None:
        print(f"Beta number \t\t -> {config.beta}")
    print(f"Dev Version \t\t -> {config.dev_version}")
    print(f"Dev NPM Version \t -> {config.dev_npm_version}")
    print(f"Release Tag \t\t -> {config.tag}")
    print("-----------------------------------------------------------------")
    print("")


def print_help() -> str:
    return """create-release.py [ prepare | publish ] --version VERSION
    
    DESCRIPTION
    Creates Elyra release based on git commit hash or from HEAD.
    
    create release prepare-changelog --version 1.3.0 [--beta 0] [--rc 0]
    This will prepare the release changelog and make it ready for review on the release workdir.

    create-release.py prepare --version 1.3.0 --dev-version 1.4.0 [--beta 0] [--rc 0]
    This will prepare a release candidate, build it locally and make it ready for review on the release workdir.
    
    Note: that one can either use a beta or rc modifier for the release, but not both.

    create-release.py publish --version 1.3.0 [--beta 0] [--rc 0]
    This will build a previously prepared release, and publish the artifacts to public repositories.
    
    Required software dependencies for building and publishing a release:
     - Git
     - Node
     - Twine
     - Yarn
     
     Required configurations for publishing a release:
     - GPG with signing key configured
     
     
    """


def main(args=None):
    """Perform necessary tasks to create and/or publish a new release"""
    parser = argparse.ArgumentParser(usage=print_help())
    parser.add_argument(
        "goal",
        help="Supported goals: {prepare-changelog | prepare | publish}",
        type=str,
        choices={"prepare-changelog", "prepare", "publish"},
    )
    parser.add_argument("--version", help="the new release version", type=str, required=True)
    parser.add_argument("--dev-version", help="the new development version", type=str, required=False)
    parser.add_argument("--beta", help="the release beta number", type=str, required=False)
    parser.add_argument("--rc", help="the release candidate number", type=str, required=False)
    parser.add_argument("--org", help="the github org or username to use", type=str, required=False)
    parser.add_argument("--branch", help="the branch name to use", type=str, required=False)
    args = parser.parse_args()

    # can't use both rc and beta parameters
    if args.beta and args.rc:
        print_help()
        sys.exit(1)

    global config
    try:
        # Validate all pre-requisites are available
        validate_dependencies()
        validate_environment()

        # Generate release config based on the provided arguments
        initialize_config(args)
        print_config()

        if config.goal == "prepare-changelog":
            prepare_changelog()

            print("")
            print("")
            print(f"Changelog for release version: {config.new_version} is ready for review at {config.source_dir}")
            print("After you are done, push the reviewed changelog to github.")
            print("")
            print("")
        elif config.goal == "prepare":
            if not args.dev_version:
                print_help()
                sys.exit()

            prepare_release()

            print("")
            print("")
            print(f"Release version: {config.new_version} is ready for review")
            print("After you are done, run the script again to [publish] the release.")
            print("")
            print("")

        elif args.goal == "publish":
            publish_release(working_dir=os.getcwd())
        else:
            print_help()
            sys.exit()

    except Exception as ex:
        raise RuntimeError(f"Error performing release {args.version}") from ex


if __name__ == "__main__":
    main()
