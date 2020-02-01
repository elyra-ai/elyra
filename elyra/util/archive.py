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

import os
import tarfile
import tempfile


def create_project_temp_dir():
    temp_dir = tempfile.gettempdir()
    project_temp_dir = os.path.join(temp_dir, 'elyra')
    if not os.path.exists(project_temp_dir):
        os.mkdir(project_temp_dir)
    return project_temp_dir


def create_temp_archive(archive_name, source_dir, files=None, recursive=False):
    """
    Create archive file with specified list of files
    :param archive_name: the name of the archive to be created
    :param source_dir: the root folder containing source files
    :param files: list of files, or masks, used to select contents of the archive
    :param recursive: flag to include sub directories recursively
    :return: full path of the created archive
    """

    def tar_filter(tarinfo):
        """Filter files from the generated archive"""
        if tarinfo.type == tarfile.DIRTYPE:
            # ignore hidden directories (e.g. ipynb checkpoints and/or trash contents)
            if any(dir.startswith('.') for dir in tarinfo.name.split('/')):
                return None
            # always return the base directory (empty string) otherwise tar will be empty
            elif not tarinfo.name:
                return tarinfo
            # only include subdirectories if enabled in common properties
            elif recursive:
                return tarinfo
            else:
                return None

        if '*' in files:
            return tarinfo

        # if tarinfo.name == os.path.basename(operation.artifact):
        #    return tarinfo

        for dependency in files:
            if dependency:
                if dependency.startswith('*'):
                    # handle check for extension wildcard
                    if tarinfo.name.endswith(dependency.replace('*.', '.')):
                        return tarinfo
                else:
                    # handle check for specific file
                    if tarinfo.name == dependency:
                        return tarinfo

        return None

    if files is None:
        files = ['*']

    temp_dir = create_project_temp_dir()
    archive = os.path.join(temp_dir, archive_name)

    with tarfile.open(archive, "w:gz") as tar:
        tar.add(source_dir, arcname="", filter=tar_filter)

    if not archive:
        raise RuntimeError('Internal error creating archive: {}'.format(archive_name))

    return archive
