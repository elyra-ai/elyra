#!/usr/bin/env python3
#
# Copyright 2018-2021 Elyra Authors
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

DEFAULT_GIT_URL = 'git@github.com:elyra-ai/elyra.git'
DEFAULT_EXTENSION_PACKAGE_GIT_URL = 'git@github.com:elyra-ai/elyra-package-template.git'
DEFAULT_BUILD_DIR = 'build/release'


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
    return response.stdout.decode('utf-8').replace('\n', '')


def dependency_exists(command) -> bool:
    """Returns true if a command exists on the system"""
    try:
        check_run(["which", command])
    except:
        return False

    return True


def sed(file: str, pattern: str, replace: str) -> None:
    """Perform regex substitution on a given file"""
    try:
        check_run(["sed", "-i", "", "-e", f"s#{pattern}#{replace}#g", file], capture_output=False)
    except Exception as ex:
        raise RuntimeError(f'Error processing updated to file {file}: ') from ex


def validate_dependencies() -> None:
    """Error if a dependency is missing or invalid"""
    if not dependency_exists("git"):
        raise DependencyException('Please install git https://git-scm.com/downloads')
    if not dependency_exists("node"):
        raise DependencyException('Please install node.js https://nodejs.org/')
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
        sed(_source('.bumpversion.cfg'),
            rf"^current_version* =* {old_version}",
            f"current_version = {new_version}")
        sed(_source('elyra/_version.py'),
            rf"^__version__* =* '{old_version}'",
            f"__version__ = '{new_version}'"),
        sed(_source('README.md'),
            rf"elyra {old_version}",
            f"elyra {new_version}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"elyra {old_version}",
            f"elyra {new_version}")

        # Update docker related tags
        sed(_source('Makefile'),
            r"^TAG:=dev",
            f"TAG:={new_version}")
        sed(_source('README.md'),
            r"elyra:dev ",
            f"elyra:{new_version} ")
        if config.rc is None and config.beta is None:
            # Update the stable version Binder link
            sed(_source('README.md'),
                r"/v[0-9].[0-9].[0-9]?",
                f"/v{new_version}?")
        sed(_source('etc/docker/kubeflow/README.md'),
            r"kf-notebook:dev",
            f"kf-notebook:{new_version}")
        sed(_source('docs/source/getting_started/installation.md'),
            r"elyra:dev ",
            f"elyra:{new_version} ")
        sed(_source('docs/source/getting_started/installation.md'),
            r"/v[0-9].[0-9].[0-9]?",
            f"/v{new_version}?")
        sed(_source('docs/source/recipes/configure-airflow-as-a-runtime.md'),
            r"master",
            f"{config.tag}")
        sed(_source('docs/source/recipes/deploying-elyra-in-a-jupyterhub-environment.md'),
            r"dev",
            f"{new_version}")
        sed(_source('docs/source/recipes/using-elyra-with-kubeflow-notebook-server.md'),
            r"master",
            f"{new_version}")

        sed(_source('etc/docker/kubeflow/Dockerfile'),
            r"elyra\[kfp-tekton,kfp-examples\]==.*",
            f"elyra\[kfp-tekton,kfp-examples\]=={new_version}")
        sed(_source('etc/docker/elyra/Dockerfile'),
            r"    cd /tmp/elyra && make UPGRADE_STRATEGY=eager install && rm -rf /tmp/elyra",
            f"    cd /tmp/elyra \&\& git checkout tags/v{new_version} -b v{new_version} \&\& make UPGRADE_STRATEGY=eager install \&\& rm -rf /tmp/elyra")

        # Update UI component versions
        sed(_source('README.md'),
            rf"v{old_npm_version}",
            f"v{new_version}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"v{old_npm_version}",
            f"v{new_version}")

        sed(_source('packages/theme/src/index.ts'),
            r"https://elyra.readthedocs.io/en/latest/",
            rf"https://elyra.readthedocs.io/en/v{new_version}/")

        check_run(["lerna", "version", new_npm_version, "--no-git-tag-version", "--no-push", "--yes"], cwd=config.source_dir)
        check_run(["yarn", "version", "--new-version", new_npm_version, "--no-git-tag-version"], cwd=config.source_dir)

    except Exception as ex:
        raise UpdateVersionException from ex


def update_version_to_dev() -> None:
    global config

    new_version = config.new_version
    new_npm_version = config.new_npm_version
    dev_version = config.dev_version
    dev_npm_version = config.dev_npm_version

    try:
        # Update backend version
        sed(_source('.bumpversion.cfg'),
            rf"^current_version* =* {new_version}",
            f"current_version = {dev_version}")
        sed(_source('elyra/_version.py'),
            rf"^__version__* =* '{new_version}'",
            f"__version__ = '{dev_version}'")
        sed(_source('README.md'),
            rf"elyra {new_version}",
            f"elyra {dev_version}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"elyra {new_version}",
            f"elyra {dev_version}")

        # Update docker related tags
        sed(_source('Makefile'),
            rf"^TAG:={new_version}",
            "TAG:=dev")
        sed(_source('README.md'),
            rf"elyra:{new_version} ",
            "elyra:dev ")
        sed(_source('etc/docker/kubeflow/README.md'),
            rf"kf-notebook:{new_version}",
            "kf-notebook:dev")
        # this does not goes back to dev
        # sed(source('README.md'), r"/v[0-9].[0-9].[0-9]", "/v{}".format(dev_version))
        sed(_source('docs/source/getting_started/installation.md'),
            rf"elyra:{new_version} ",
            "elyra:dev ")
        # this does not goes back to dev
        # sed(source('docs/source/getting_started/installation.md'), r"/v[0-9].[0-9].[0-9]", "/v{}".format(dev_version))
        sed(_source('docs/source/recipes/configure-airflow-as-a-runtime.md'),
            rf"{config.tag}",
            "master")
        sed(_source('docs/source/recipes/deploying-elyra-in-a-jupyterhub-environment.md'),
            rf"{new_version}",
            "dev")
        sed(_source('docs/source/recipes/using-elyra-with-kubeflow-notebook-server.md'),
            rf"{new_version}",
            "master")

        # for now, this stays with the latest release
        # sed(_source('etc/docker/kubeflow/Dockerfile'), r"elyra[all]==.*", f"elyra[all]=={new_version}")

        sed(_source('etc/docker/elyra/Dockerfile'),
            rf"\&\& git checkout tags/v{new_version} -b v{new_version} ",
            f"")

        # Update UI component versions
        sed(_source('README.md'),
            rf"extension v{new_version}",
            f"extension v{dev_npm_version}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"extension v{new_version}",
            f"extension v{dev_npm_version}")

        sed(_source('packages/theme/src/index.ts'),
            rf"https://elyra.readthedocs.io/en/v{new_version}/",
            rf"https://elyra.readthedocs.io/en/latest/")

        check_run(["lerna", "version", dev_npm_version, "--no-git-tag-version", "--no-push", "--yes"], cwd=config.source_dir)
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

    print(f'Cloning repository: {config.git_url}')
    if os.path.exists(config.work_dir):
        print(f'Removing working directory: {config.work_dir}')
        shutil.rmtree(config.work_dir)
    print(f'Creating working directory: {config.work_dir}')
    os.makedirs(config.work_dir)
    print(f'Cloning : {config.git_url} to {config.work_dir}')
    check_run(['git', 'clone', config.git_url], cwd=config.work_dir)
    check_run(['git', 'config', 'user.name', config.git_user_name], cwd=config.source_dir)
    check_run(['git', 'config', 'user.email', config.git_user_email], cwd=config.source_dir)

    print('')


def build_release():
    global config

    print("-----------------------------------------------------------------")
    print("----------------------- Building Release ------------------------")
    print("-----------------------------------------------------------------")

    check_run(["make", "release"], cwd=config.source_dir, capture_output=False)

    print('')


def build_server():
    global config

    print("-----------------------------------------------------------------")
    print("------------------------ Building Server ------------------------")
    print("-----------------------------------------------------------------")

    # update project name
    sed(_source('setup.py'), r'name="elyra"', 'name="elyra-server"')

    # build server wheel
    check_run(["make", "build-server"], cwd=config.source_dir, capture_output=False)

    # revert project name
    check_run(["git", "reset", "--hard"], cwd=config.source_dir, capture_output=False)

    print('')


def show_release_artifacts():
    global config
    dist_dir = os.path.join(config.source_dir, 'dist')

    print("-----------------------------------------------------------------")
    print("------------------------ Release Files --------------------------")
    print("-----------------------------------------------------------------")

    print('')
    print(f'Location \t {dist_dir}')
    print('')
    check_run(["ls", "-la", dist_dir], capture_output=False)
    print('')


def copy_extension_archive(extension: str, work_dir: str) -> None:
    global config

    extension_package_name = f'{extension}-{config.new_npm_version}.tgz'
    extension_package_source_file = os.path.join(config.source_dir, 'dist', extension_package_name)
    extension_package_dest_file = os.path.join(work_dir, 'dist', extension_package_name)
    os.makedirs(os.path.dirname(extension_package_dest_file), exist_ok=True)
    shutil.copy(extension_package_source_file, extension_package_dest_file)


def generate_changelog() -> None:
    global config

    print("-----------------------------------------------------------------")
    print("--------------------- Preparing Changelog -----------------------")
    print("-----------------------------------------------------------------")


    changelog_path = os.path.join(config.source_dir, 'docs/source/getting_started/changelog.md')
    changelog_backup_path = os.path.join(config.source_dir, 'docs/source/getting_started/changelog.bak')
    if os.path.exists(changelog_backup_path):
        os.remove(changelog_backup_path)
    shutil.copy(changelog_path, changelog_backup_path)

    repo = git.Repo(config.source_dir)

    # Start generating the release header on top of the changelog
    with io.open(changelog_path, 'r+') as changelog:
        changelog.write('# Changelog\n')
        changelog.write('\n')
        changelog.write(f'## Release {config.new_version} - {datetime.now().strftime("%m/%d/%Y")}\n')
        changelog.write('\n')


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
                if commit_title != 'Prepare for next development iteration':
                    pr_string = ''
                    pr = re.findall('\(#(.*?)\)', commit_title)
                    if pr:
                        commit_title = re.sub('\(#(.*?)\)', '', commit_title).strip()
                        pr_string = f' - [#{pr[0]}](https://github.com/elyra-ai/elyra/pull/{pr[0]})'
                    changelog_entry = f'- {commit_title}{pr_string}\n'
                    changelog.write(changelog_entry)
                else:
                    # here it found the first commit of the release
                    # changelog for the release is done
                    # exit the loop
                    continue_paginating = False
                    break

        # copy the remaining changelog at the bottom of the new content
        with io.open(changelog_backup_path) as old_changelog:
            line = old_changelog.readline() # ignore first line as title
            line = old_changelog.readline()
            while line:
                changelog.write(line)
                line = old_changelog.readline()


def prepare_extensions_release() -> None:
    global config

    print("-----------------------------------------------------------------")
    print("--------------- Preparing Individual Extensions -----------------")
    print("-----------------------------------------------------------------")


    extensions = {'elyra-code-snippet-extension':['elyra-code-snippet-extension', 'elyra-metadata-extension', 'elyra-theme-extension'],
                  'elyra-pipeline-editor-extension':['elyra-pipeline-editor-extension', 'elyra-metadata-extension', 'elyra-theme-extension'],
                  'elyra-python-editor-extension':['elyra-metadata-extension', 'elyra-theme-extension'],
                  'elyra-r-editor-extension':['elyra-metadata-extension', 'elyra-theme-extension']}

    for extension in extensions:
        extension_source_dir = os.path.join(config.work_dir, extension)
        print(f'Preparing extension : {extension} at {extension_source_dir}')
        # clone extension package template
        if os.path.exists(extension_source_dir):
            print(f'Removing working directory: {config.source_dir}')
            shutil.rmtree(extension_source_dir)
        print(f'Cloning : {config.git_extension_package_url} to {config.work_dir}')
        check_run(['git', 'clone', config.git_extension_package_url, extension], cwd=config.work_dir)
        # update template
        setup_file = os.path.join(extension_source_dir, 'setup.py')
        sed(setup_file, "{{package-name}}", extension)
        sed(setup_file, "{{version}}", config.new_version)
        sed(setup_file, "{{data-files}}", "('share/jupyter/lab/extensions', glob('./dist/*.tgz'))")
        sed(setup_file, "{{install-requires}}", f"'elyra-server=={config.new_version}',")

        for dependency in extensions[extension]:
            copy_extension_archive(dependency, extension_source_dir)

        # build extension
        check_run(['python', 'setup.py', 'bdist_wheel', 'sdist'], cwd=extension_source_dir)
        print('')


def prepare_runtime_extensions_package_release() -> None:
    global config

    print("-----------------------------------------------------------------")
    print("---------------- Preparing Individual Packages ------------------")
    print("-----------------------------------------------------------------")

    packages = {'kfp-notebook':['kfp>=1.6.3'],
                'airflow-notebook':['pygithub', 'black']}

    packages_source = {'kfp-notebook':'kfp',
                      'airflow-notebook':'airflow'}

    for package in packages:
        package_source_dir = os.path.join(config.work_dir, package)
        print(f'Preparing package : {package} at {package_source_dir}')
        # clone extension package template
        if os.path.exists(package_source_dir):
            print(f'Removing working directory: {config.source_dir}')
            shutil.rmtree(package_source_dir)
        print(f'Cloning : {config.git_extension_package_url} to {config.work_dir}')
        check_run(['git', 'clone', config.git_extension_package_url, package], cwd=config.work_dir)
        # update template
        setup_file = os.path.join(package_source_dir, 'setup.py')
        sed(setup_file, "{{package-name}}", package)
        sed(setup_file, "{{version}}", config.new_version)
        # no data files
        sed(setup_file, "{{data-files}}", "")
        # prepare package specific dependencies
        requires = ''
        for dependency in packages[package]:
            requires += f"'{dependency}',"
        sed(setup_file, "{{install-requires}}", requires)
        # copy source files
        source_dir = os.path.join(config.source_dir, 'elyra', packages_source[package])
        dest_dir = os.path.join(package_source_dir, 'elyra', packages_source[package])
        print(f'Copying package source from {source_dir} to {dest_dir}')
        Path(os.path.join(package_source_dir, 'elyra')).mkdir(parents=True, exist_ok=True)
        shutil.copytree(source_dir, dest_dir)

        # build extension
        check_run(['python', 'setup.py', 'bdist_wheel', 'sdist'], cwd=package_source_dir)
        print('')


def prepare_changelog() -> None:
    """
    Prepare a release changelog
    """
    global config
    print(f'Generating changelog for release {config.new_version}')
    print('')

    # clone repository
    checkout_code()
    # generate changelog with new release list of commits
    generate_changelog()
    # commit
    check_run(['git', 'commit', '-a', '-m', f'Update changelog for release {config.new_version}'], cwd=config.source_dir)


def prepare_release() -> None:
    """
    Prepare a release
    """
    global config
    print(f'Processing release from {config.old_version} to {config.new_version} ')
    print('')

    # clone repository
    checkout_code()
    # generate changelog with new release list of commits
    prepare_changelog()
    # Update to new release version
    update_version_to_release()
    # commit and tag
    check_run(['git', 'commit', '-a', '-m', f'Release v{config.new_version}'], cwd=config.source_dir)
    check_run(['git', 'tag', config.tag], cwd=config.source_dir)
    # server-only wheel
    build_server()
    # build release wheel and npm artifacts
    build_release()
    # show built release artifacts
    show_release_artifacts()
    # back to development
    update_version_to_dev()
    # commit
    check_run(['git', 'commit', '-a', '-m', f'Prepare for next development iteration'], cwd=config.source_dir)
    # prepare extensions
    prepare_extensions_release()
    # prepare runtime extsnsions
    prepare_runtime_extensions_package_release()


def publish_release(working_dir) -> None:
    global config

    files_to_publish = [
        f'{config.source_dir}/dist/elyra-{config.new_version}-py3-none-any.whl',
        f'{config.source_dir}/dist/elyra-{config.new_version}.tar.gz',
        f'{config.source_dir}/dist/elyra_server-{config.new_version}-py3-none-any.whl',
        f'{config.source_dir}/dist/elyra-server-{config.new_version}.tar.gz',
        f'{config.work_dir}/airflow-notebook/dist/airflow_notebook-{config.new_version}-py3-none-any.whl',
        f'{config.work_dir}/airflow-notebook/dist/airflow-notebook-{config.new_version}.tar.gz',
        f'{config.work_dir}/kfp-notebook/dist/kfp_notebook-{config.new_version}-py3-none-any.whl',
        f'{config.work_dir}/kfp-notebook/dist/kfp-notebook-{config.new_version}.tar.gz',
        f'{config.work_dir}/elyra-code-snippet-extension/dist/elyra_code_snippet_extension-{config.new_version}-py3-none-any.whl',
        f'{config.work_dir}/elyra-code-snippet-extension/dist/elyra-code-snippet-extension-{config.new_version}.tar.gz',
        f'{config.work_dir}/elyra-pipeline-editor-extension/dist/elyra_pipeline_editor_extension-{config.new_version}-py3-none-any.whl',
        f'{config.work_dir}/elyra-pipeline-editor-extension/dist/elyra-pipeline-editor-extension-{config.new_version}.tar.gz',
        f'{config.work_dir}/elyra-python-editor-extension/dist/elyra_python_editor_extension-{config.new_version}-py3-none-any.whl',
        f'{config.work_dir}/elyra-python-editor-extension/dist/elyra-python-editor-extension-{config.new_version}.tar.gz',
        f'{config.work_dir}/elyra-r-editor-extension/dist/elyra_r_editor_extension-{config.new_version}-py3-none-any.whl',
        f'{config.work_dir}/elyra-r-editor-extension/dist/elyra-r-editor-extension-{config.new_version}.tar.gz',
    ];

    print("-----------------------------------------------------------------")
    print("---------------------- Publishing to PyPI -----------------------")
    print("-----------------------------------------------------------------")

    # Validate all artifacts to be published are available
    for file in files_to_publish:
        if not os.path.exists(file):
            raise MissingReleaseArtifactException(f'Missing release file: {file}')

    # push files to PyPI
    for file in files_to_publish:
        print(f'Publishing: {file}')
        check_run(['twine', 'upload', '--sign', file], cwd=working_dir)

    print("-----------------------------------------------------------------")
    print("--------------- Pushing Release and Tag to git ------------------")
    print("-----------------------------------------------------------------")

    # push release and tags to git
    print()
    print('Pushing release to git')
    check_run(['git', 'push'], cwd=config.source_dir)
    print('Pushing release tag to git')
    check_run(['git', 'push', '--tags'], cwd=config.source_dir)

    print("-----------------------------------------------------------------")
    print("--------------- Preparing to push npm packages ------------------")
    print("-----------------------------------------------------------------")

    # checkout the tag
    print()
    print(f'Checking out release tag {config.tag}')
    check_run(['git', 'checkout', config.tag], cwd=config.source_dir)
    check_run(['git', 'status'], cwd=config.source_dir)

    print("-----------------------------------------------------------------")
    print("-------------------- Pushing npm packages -----------------------")
    print("-----------------------------------------------------------------")

    # publish npm packages
    print()
    print(f'publishing npm packages')
    check_run(['lerna', 'publish', '--yes', 'from-package', '--no-git-tag-version', '--no-verify-access', '--no-push'], cwd=config.source_dir)


def initialize_config(args=None) -> SimpleNamespace:
    if not args:
        raise ValueError("Invalid command line arguments")

    v = re.search(VERSION_REG_EX, elyra._version.__version__)

    configuration = {
        'goal': args.goal,
        'git_url': DEFAULT_GIT_URL,
        'git_extension_package_url': DEFAULT_EXTENSION_PACKAGE_GIT_URL,
        'git_hash': 'HEAD',
        'git_user_name': check_output(['git', 'config', 'user.name']),
        'git_user_email': check_output(['git', 'config', 'user.email']),
        'base_dir': os.getcwd(),
        'work_dir': os.path.join(os.getcwd(), DEFAULT_BUILD_DIR),
        'source_dir': os.path.join(os.getcwd(), DEFAULT_BUILD_DIR, 'elyra'),
        'old_version': elyra._version.__version__,
        'old_npm_version': f"{v['major']}.{v['minor']}.{v['patch']}-dev",
        'new_version': args.version if (not args.rc or not str.isdigit(args.rc)) and (not args.beta or not str.isdigit(args.beta)) else f'{args.version}rc{args.rc}' if args.rc else f'{args.version}b{args.beta}',
        'new_npm_version': args.version if (not args.rc or not str.isdigit(args.rc)) and (not args.beta or not str.isdigit(args.beta)) else f'{args.version}-rc.{args.rc}' if args.rc else f'{args.version}-beta.{args.beta}',
        'rc': args.rc,
        'beta': args.beta,
        'dev_version': f'{args.dev_version}.dev0',
        'dev_npm_version': f'{args.dev_version}-dev',
        'tag': f'v{args.version}' if (not args.rc or not str.isdigit(args.rc)) and (not args.beta or not str.isdigit(args.beta)) else f'v{args.version}rc{args.rc}' if args.rc else f'v{args.version}b{args.beta}'
    }

    global config
    config = SimpleNamespace(**configuration)


def print_config() -> None:
    global config
    print('')
    print("-----------------------------------------------------------------")
    print("--------------------- Release configuration ---------------------")
    print("-----------------------------------------------------------------")
    print(f'Goal \t\t\t -> {config.goal}')
    print(f'Git URL \t\t -> {config.git_url}')
    print(f'Git Extension URL \t -> {config.git_extension_package_url}')
    print(f'Git reference \t\t -> {config.git_hash}')
    print(f'Git user \t\t -> {config.git_user_name}')
    print(f'Git user emain \t\t -> {config.git_user_email}')
    print(f'Work dir \t\t -> {config.work_dir}')
    print(f'Source dir \t\t -> {config.source_dir}')
    print(f'Old Version \t\t -> {config.old_version}')
    print(f'Old NPM Version \t -> {config.old_npm_version}')
    print(f'New Version \t\t -> {config.new_version}')
    print(f'New NPN Version \t -> {config.new_npm_version}')
    if config.rc is not None:
        print(f'RC number \t\t -> {config.rc}')
    if config.beta is not None:
        print(f'Beta number \t\t -> {config.beta}')
    print(f'Dev Version \t\t -> {config.dev_version}')
    print(f'Dev NPM Version \t -> {config.dev_npm_version}')
    print(f'Release Tag \t\t -> {config.tag}')
    print("-----------------------------------------------------------------")
    print('')


def print_help() -> str:
    return (
    """create-release.py [ prepare | publish ] --version VERSION
    
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
    )


def main(args=None):
    """Perform necessary tasks to create and/or publish a new release"""
    parser = argparse.ArgumentParser(usage=print_help())
    parser.add_argument('goal', help='Supported goals: {prepare-changelog | prepare | publish}', type=str, choices={'prepare-changelog', 'prepare', 'publish'})
    parser.add_argument('--version', help='the new release version', type=str, required=True)
    parser.add_argument('--dev-version', help='the new development version', type=str, required=False)
    parser.add_argument('--beta', help='the release beta number', type=str, required=False)
    parser.add_argument('--rc', help='the release candidate number', type=str, required=False)
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

        if config.goal == 'prepare-changelog':
            prepare_changelog()

            print("")
            print("")
            print(f"Changelog for release version: {config.new_version} is ready for review at {config.source_dir}")
            print("After you are done, push the reviewed changelog to github.")
            print("")
            print("")
        elif config.goal == 'prepare':
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
        raise RuntimeError(f'Error performing release {args.version}') from ex


if __name__ == "__main__":
    main()
