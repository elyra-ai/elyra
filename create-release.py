#!/usr/bin/env python3
#
# Copyright 2018-2020 IBM Corporation
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
import os
import re
import shutil
import subprocess

from types import SimpleNamespace

config: SimpleNamespace

VERSION_REG_EX = r"(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(\.(?P<release>[a-z]+)(?P<build>\d+))?"

DEFAULT_GIT_URL = 'git@github.com:elyra-ai/elyra.git'
DEFAULT_EXTENSION_PACKAGE_GIT_URL = 'git@github.com:elyra-ai/elyra-package-template.git'
DEFAULT_BUILD_DIR = 'build/release'


class DependencyException(Exception):
    """Error if dependency is missing"""


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


def validate_environment() -> None:
    """Validate environment configurations are valid"""
    pass


def update_version_to_release() -> None:
    global config

    old_version = config.old_version
    new_version = config.new_version

    try:
        # Update backend version
        sed(_source('.bumpversion.cfg'),
            rf"^current_version* =* {_python_dev_version(old_version)}",
            f"current_version = {new_version}")
        sed(_source('elyra/_version.py'),
            rf"^__version__* =* '{_python_dev_version(old_version)}'",
            f"__version__ = '{new_version}'"),
        sed(_source('README.md'),
            rf"elyra {_python_dev_version(old_version)}",
            f"elyra {new_version}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"elyra {_python_dev_version(old_version)}",
            f"elyra {new_version}")

        # Update docker related tags
        sed(_source('Makefile'),
            r"^TAG:=dev",
            f"TAG:={new_version}")
        sed(_source('README.md'),
            r"elyra:dev ",
            f"elyra:{new_version} ")
        sed(_source('README.md'),
            r"/v[0-9].[0-9].[0-9]?",
            f"/v{new_version}?")
        sed(_source('docs/source/getting_started/installation.md'),
            r"elyra:dev ",
            f"elyra:{new_version} ")
        sed(_source('docs/source/getting_started/installation.md'),
            r"/v[0-9].[0-9].[0-9]?",
            f"/v{new_version}?")
        sed(_source('docs/source/recipes/deploying-elyra-in-a-jupyterhub-environment.md'),
            r"dev",
            f"{new_version}")

        sed(_source('etc/docker/elyra/Dockerfile'),
            r"    cd /tmp/elyra && make UPGRADE_STRATEGY=eager install && rm -rf /tmp/elyra",
            f"    cd /tmp/elyra \&\& git checkout tags/v{new_version} -b v{new_version} \&\& make UPGRADE_STRATEGY=eager install \&\& rm -rf /tmp/elyra")

        # Update UI component versions
        sed(_source('README.md'),
            rf"v{_npm_dev_version(old_version)}",
            f"v{new_version}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"v{_npm_dev_version(old_version)}",
            f"v{new_version}")

        sed(_source('packages/theme/src/index.ts'),
            r"https://elyra.readthedocs.io/en/latest/",
            f"https://elyra.readthedocs.io/en/stable/")

        check_run(["lerna", "version", new_version, "--no-git-tag-version", "--no-push", "--yes"], cwd=config.source_dir)
        check_run(["yarn", "version", "--new-version", new_version, "--no-git-tag-version"], cwd=config.source_dir)

    except Exception as ex:
        raise UpdateVersionException from ex


def update_version_to_dev() -> None:
    global config

    new_version = config.new_version
    dev_version = config.dev_version
    try:
        # Update backend version
        sed(_source('.bumpversion.cfg'),
            rf"^current_version* =* {new_version}",
            f"current_version = {_python_dev_version(dev_version)}")
        sed(_source('elyra/_version.py'),
            rf"^__version__* =* '{new_version}'",
            f"__version__ = '{_python_dev_version(dev_version)}'")
        sed(_source('README.md'),
            rf"elyra {new_version}",
            f"elyra {_python_dev_version(dev_version)}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"elyra {new_version}",
            f"elyra {_python_dev_version(dev_version)}")

        # Update docker related tags
        sed(_source('Makefile'),
            rf"^TAG:={new_version}",
            "TAG:=dev")
        sed(_source('README.md'),
            rf"elyra:{new_version} ",
            "elyra:dev ")
        # this does not goes back to dev
        # sed(source('README.md'), r"/v[0-9].[0-9].[0-9]", "/v{}".format(dev_version))
        sed(_source('docs/source/getting_started/installation.md'),
            rf"elyra:{new_version} ",
            "elyra:dev ")
        # this does not goes back to dev
        # sed(source('docs/source/getting_started/installation.md'), r"/v[0-9].[0-9].[0-9]", "/v{}".format(dev_version))
        sed(_source('docs/source/recipes/deploying-elyra-in-a-jupyterhub-environment.md'),
            rf"{new_version}",
            "dev")

        sed(_source('etc/docker/elyra/Dockerfile'),
            rf"\&\& git checkout tags/v{new_version} -b v{new_version} ",
            f"")

        # Update UI component versions
        sed(_source('README.md'),
            rf"extension v{new_version}",
            f"extension v{_npm_dev_version(dev_version)}")
        sed(_source('docs/source/getting_started/installation.md'),
            rf"extension v{new_version}",
            f"extension v{_npm_dev_version(dev_version)}")

        sed(_source('packages/theme/src/index.ts'),
            r"https://elyra.readthedocs.io/en/stable/",
            f"https://elyra.readthedocs.io/en/latest/")

        check_run(["lerna", "version", _npm_dev_version(dev_version), "--no-git-tag-version", "--no-push", "--yes"], cwd=config.source_dir)
        check_run(["yarn", "version", "--new-version", _npm_dev_version(dev_version), "--no-git-tag-version"], cwd=config.source_dir)

    except Exception as ex:
        raise UpdateVersionException from ex


def _source(file: str) -> str:
    global config

    return os.path.join(config.source_dir, file)


def _python_dev_version(version: str) -> str:
    v = re.search(VERSION_REG_EX, version)
    return f"{v['major']}.{v['minor']}.{v['patch']}.dev0"


def _npm_dev_version(version: str) -> str:
    v = re.search(VERSION_REG_EX, version)
    return f"{v['major']}.{v['minor']}.{v['patch']}-dev"


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


def build():
    global config

    print("-----------------------------------------------------------------")
    print("--------------------------- Building ----------------------------")
    print("-----------------------------------------------------------------")

    check_run(["make", "clean", "release"], cwd=config.source_dir, capture_output=False)

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


def prepare_extensions_release() -> None:
    global config

    extensions = ['elyra-code-snippet-extension',
                  'elyra-pipeline-editor-extension',
                  'elyra-python-editor-extension']

    for extension in extensions:
        print(f'Preparing extension : {extension}')
        extension_source_dir = os.path.join(config.work_dir, extension)
        # clone extension package template
        if os.path.exists(extension_source_dir):
            print(f'Removing working directory: {config.source_dir}')
            shutil.rmtree(extension_source_dir)
        print(f'Cloning : {config.git_extension_package_url} to {config.work_dir}')
        check_run(['git', 'clone', config.git_extension_package_url, extension], cwd=config.work_dir)
        # update template
        setup_file = os.path.join(extension_source_dir, 'setup.py')
        sed(setup_file, "elyra-extension", extension)
        sed(setup_file, "0.0.1", config.new_version)
        # copy extension package
        extension_package_name = f'{extension}-{config.new_version}.tgz'
        extension_package_source_file = os.path.join(config.source_dir, 'dist', extension_package_name)
        extension_package_dest_file = os.path.join(extension_source_dir, 'dist', extension_package_name)
        os.makedirs(os.path.dirname(extension_package_dest_file), exist_ok=True)
        shutil.copy(extension_package_source_file, extension_package_dest_file)
        # build extension
        check_run(['python', 'setup.py', 'bdist_wheel'], cwd=extension_source_dir)
        print('')


def prepare_release() -> None:
    """
    Prepare a release
    """
    global config
    print(f'Processing release from {config.old_version} to {config.new_version} ')
    print('')

    # clone repository
    checkout_code()
    # Update to new release version
    update_version_to_release()
    # build release artifacts
    build()
    # show built release artifacts
    show_release_artifacts()
    # commit and tag
    check_run(['git', 'commit', '-a', '-m', f'Release v{config.new_version}'], cwd=config.source_dir)
    check_run(['git', 'tag', config.tag], cwd=config.source_dir)
    # back to development
    update_version_to_dev()
    # commit
    check_run(['git', 'commit', '-a', '-m', f'Prepare for next development iteration'], cwd=config.source_dir)
    # prepare extensions
    prepare_extensions_release()


def publish_release(working_dir, config:dict) -> None:
    pass;


def initialize_config(args=None) -> SimpleNamespace:
    if not args:
        raise ValueError("Invalid command line arguments")

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
        'old_version': elyra.__version__.replace(r".dev[0-9]", ""),
        'new_version': args.version,
        'dev_version': args.dev_version,
        'tag': f'v{args.version}'
    }

    global config
    config = SimpleNamespace(**configuration)


def print_config() -> None:
    global config
    print('')
    print("-----------------------------------------------------------------")
    print("--------------------- Release configuration ---------------------")
    print("-----------------------------------------------------------------")
    print(f'Goal \t\t -> {config.goal}')
    print(f'Git URL \t -> {config.git_url}')
    print(f'Git Extension URL \t -> {config.git_extension_package_url}')
    print(f'Git reference \t -> {config.git_hash}')
    print(f'Git user \t -> {config.git_user_name}')
    print(f'Git user emain \t -> {config.git_user_email}')
    print(f'Work dir \t -> {config.work_dir}')
    print(f'Source dir \t -> {config.source_dir}')
    print(f'Old Version \t -> {config.old_version}')
    print(f'New Version \t -> {config.new_version}')
    print(f'Dev Version \t -> {config.dev_version}')
    print(f'Release Tag \t -> {config.tag}')
    print("-----------------------------------------------------------------")
    print('')


def print_help() -> str:
    return (
    """create-release.py [ prepare | publish ] --version VERSION
    
    DESCRIPTION
    Creates Elyra release based on git commit hash or from HEAD.
    
    create-release.py prepare --version 1.3.0 --dev-version 1.4.0
    This form will prepare a release candidate, build it locally and push the changes to a branch for review.  
    
    create-release.py publish --version 1.3.0
    This form will build a previously prepared release, and publish the artifacts to public repositories.
    
    Required software dependencies for building a release:
     - Git
     - Node
     - Yarn
     
     Required configurations for publishing a release:
     - GPG with signing key configured
     
     
    """
    )


def main(args=None):
    """Perform necessary tasks to create and/or publish a new release"""
    parser = argparse.ArgumentParser(usage=print_help())
    parser.add_argument('goal', help='Supported goals: {prepare | publish}', type=str, choices={'prepare', 'publish'})
    parser.add_argument('--version', help='the new release version', type=str, required=True)
    parser.add_argument('--dev-version', help='the new development version', type=str, required=True, )
    args = parser.parse_args()

    global config
    try:
        # Validate all pre-requisites are available
        validate_dependencies()
        validate_environment()

        # Generate release config based on the provided arguments
        initialize_config(args)
        print_config()

        if config.goal == 'prepare':
            prepare_release()

            print(f"Release version: {config.new_version} is ready for review")
            print("After you are done, run the script again to [publish] the release.")

        elif args.mode == "publish":
            publish_release(working_dir=os.getcwd())

    except Exception as ex:
        raise RuntimeError(f'Error performing release {args.version}') from ex


if __name__ == "__main__":
    main()
