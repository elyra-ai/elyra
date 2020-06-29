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
import fnmatch


def create_project_temp_dir():
    temp_dir = tempfile.gettempdir()
    project_temp_dir = os.path.join(temp_dir, 'elyra')
    if not os.path.exists(project_temp_dir):
        os.mkdir(project_temp_dir)
    return project_temp_dir


def has_directory(directory, files):
    """Checks if any entries in the files list starts with the given directory."""
    return any(file.startswith(directory + os.sep) or fnmatch.fnmatch(directory, file) for file in files)


def has_wildcards(file):
    """Returns True if the file contains wildcard characters per https://docs.python.org/3/library/fnmatch.html """
    wildcard_chars = ['*', '?', '[']
    return any(wc in file for wc in wildcard_chars)


def in_subdir(file):
    """Returns True if file is within a sub-directory."""
    return os.sep in file and not file.startswith(os.sep) and not file.endswith(os.sep)


def create_temp_archive(archive_name, source_dir, files=None, has_dependencies=False, recursive=False):
    """
    Create archive file with specified list of files
    :param archive_name: the name of the archive to be created
    :param source_dir: the root folder containing source files
    :param files: list of files, or masks, used to select contents of the archive
    :param has_dependencies: boolean value reflecting that files list contains a non-zero set of dependencies
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
            else:  # We have a directory, check if any dependencies start with this value and allow if found
                if has_dependencies and has_directory(tarinfo.name, files):
                    return tarinfo
                return None

        # We have a file, include it since include subdirs + no dependencies
        if recursive and not has_dependencies:
            return tarinfo

        # Process dependency
        for dependency in files:
            if not dependency or dependency in processed_files:  # Skip processing
                continue

            # Match dependency against candidate file - handling wildcards
            if fnmatch.fnmatch(tarinfo.name, dependency):
                if not has_wildcards(dependency):  # if this is a simple match, record that its been processed
                    processed_files.append(dependency)
                return tarinfo

            # If the dependency is a "flat" wildcarded value (i.e., isn't prefixed with a directory name)
            # then we should take the basename of the candidate file to perform the match against.
            if has_wildcards(dependency) and not in_subdir(dependency):
                if fnmatch.fnmatch(os.path.basename(tarinfo.name), dependency):
                    return tarinfo

        return None

    if files is None:
        files = ['*']

    processed_files = []
    temp_dir = create_project_temp_dir()
    archive = os.path.join(temp_dir, archive_name)

    with tarfile.open(archive, "w:gz") as tar:
        tar.add(source_dir, arcname="", filter=tar_filter)

    if not archive:
        raise RuntimeError('Internal error creating archive: {}'.format(archive_name))

    return archive
