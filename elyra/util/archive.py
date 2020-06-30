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


WILDCARDS = ['*', '?', '[']


def create_project_temp_dir():
    temp_dir = tempfile.gettempdir()
    project_temp_dir = os.path.join(temp_dir, 'elyra')
    if not os.path.exists(project_temp_dir):
        os.mkdir(project_temp_dir)
    return project_temp_dir


def directory_in_list(directory, filenames):
    """Checks if any entries in the filenames list starts with the given directory."""
    return any(name.startswith(directory + os.sep) or fnmatch.fnmatch(directory, name) for name in filenames)


def has_wildcards(filename):
    """Returns True if the filename contains wildcard characters per https://docs.python.org/3/library/fnmatch.html """
    return len(set(WILDCARDS) & set(list(filename))) > 0


def directory_prefixed(filename):
    """Returns True if filename is prefixed by a directory (i.e., in a sub-directory."""
    return os.sep in filename and not filename.startswith(os.sep) and not filename.endswith(os.sep)


def create_temp_archive(archive_name, source_dir, primary_file, dependencies=None, recursive=False):
    """
    Create archive file with specified list of files
    :param archive_name: the name of the archive to be created
    :param source_dir: the root folder containing source files
    :param primary_file: the filename corresponding to the operation's primary object (notebook file for NotebookOp)
    :param dependencies: the list of dependencies, each of which can contain wildcards
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
            # We have a directory, check if any dependencies start with this value and
            # allow if found - except if a single '*' is listed (i.e., include_all) in
            # which case we don't want to add this directory since recursive is False.
            # This occurs with dependencies like `data/util.py` or `data/*.py`.
            elif directory_in_list(tarinfo.name, dependencies) and not include_all:
                return tarinfo
            return None

        # We have a file at this point...

        # If primary, ensure its included
        if fnmatch.fnmatch(tarinfo.name, primary_file):
            return tarinfo

        # Special case for single wildcard entries ('*')
        if include_all:
            return tarinfo

        # Process dependency
        for dependency in dependencies:
            if not dependency or dependency in processed_dependencies:  # Skip processing
                continue

            # Match dependency against candidate filename - handling wildcards
            if fnmatch.fnmatch(tarinfo.name, dependency):
                if not has_wildcards(dependency):  # if this is a direct match, record that its been processed
                    processed_dependencies.append(dependency)
                return tarinfo

            # If the dependency is a "flat" wildcarded value (i.e., isn't prefixed with a directory name)
            # then we should take the basename of the candidate file to perform the match against.  This
            # occurs for dependencies like *.py when include-subdirectories is enabled.
            if not directory_prefixed(dependency) and has_wildcards(dependency):
                if fnmatch.fnmatch(os.path.basename(tarinfo.name), dependency):
                    return tarinfo
        return None

    # If there's a '*' - less things to check.
    include_all = len(set([WILDCARDS[0]]) & set(dependencies)) > 0

    processed_dependencies = []
    temp_dir = create_project_temp_dir()
    archive = os.path.join(temp_dir, archive_name)

    with tarfile.open(archive, "w:gz") as tar:
        tar.add(source_dir, arcname="", filter=tar_filter)

    if not archive:
        raise RuntimeError('Internal error creating archive: {}'.format(archive_name))

    return archive
