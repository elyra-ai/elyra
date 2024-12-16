#
# Copyright 2018-2025 Elyra Authors
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

import fnmatch
import os
import tarfile
import tempfile


WILDCARDS = ["*", "?", "["]


def create_project_temp_dir():
    temp_dir = tempfile.gettempdir()
    project_temp_dir = os.path.join(temp_dir, "elyra")
    if not os.path.exists(project_temp_dir):
        os.mkdir(project_temp_dir)
    return project_temp_dir


def directory_in_list(directory, filenames):
    """Checks if any entries in the filenames list starts with the given directory."""
    return any(name.startswith(directory + os.sep) or fnmatch.fnmatch(directory, name) for name in filenames)


def has_wildcards(filename):
    """Returns True if the filename contains wildcard characters per https://docs.python.org/3/library/fnmatch.html"""
    return len(set(WILDCARDS) & set(list(filename))) > 0


def directory_prefixed(filename):
    """Returns True if filename is prefixed by a directory (i.e., in a sub-directory."""
    return os.sep in filename and not filename.startswith(os.sep) and not filename.endswith(os.sep)


def create_temp_archive(archive_name, source_dir, filenames=None, recursive=False, require_complete=False):
    """
    Create archive file with specified list of files
    :param archive_name: the name of the archive to be created
    :param source_dir: the root folder containing source files
    :param filenames: the list of filenames, each of which can contain wildcards and/or specify subdirectories
    :param recursive: flag to include sub directories recursively
    :param require_complete: flag to indicate an exception should be raised if all filenames are not included
    :return: full path of the created archive
    """

    def tar_filter(tarinfo):
        """Filter files from the generated archive"""
        if tarinfo.type == tarfile.DIRTYPE:
            # ignore hidden directories (e.g. ipynb checkpoints and/or trash contents)
            if any(dir.startswith(".") for dir in tarinfo.name.split("/")):
                return None
            # always return the base directory (empty string) otherwise tar will be empty
            elif not tarinfo.name:
                return tarinfo
            # only include subdirectories if enabled in common properties
            elif recursive:
                return tarinfo
            # We have a directory, check if any filenames start with this value and
            # allow if found - except if a single '*' is listed (i.e., include_all) in
            # which case we don't want to add this directory since recursive is False.
            # This occurs with filenames like `data/util.py` or `data/*.py`.
            elif not include_all and directory_in_list(tarinfo.name, filenames_set):
                return tarinfo
            return None

        # We have a file at this point...

        # Special case for single wildcard entries ('*')
        if include_all:
            return tarinfo

        # Process filename
        for filename in filenames_set:
            if not filename or filename in processed_filenames:  # Skip processing
                continue

            # Match filename against candidate filename - handling wildcards
            if fnmatch.fnmatch(tarinfo.name, filename):
                # if this is a direct match, record that its been processed
                if not has_wildcards(filename) and not recursive:
                    processed_filenames.append(filename)
                matched_set.add(filename)
                return tarinfo

            # If the filename is a "flat" wildcarded value (i.e., isn't prefixed with a directory name)
            # then we should take the basename of the candidate file to perform the match against.  This
            # occurs for dependencies like *.py when include-subdirectories is enabled.
            if not directory_prefixed(filename) and has_wildcards(filename):
                if fnmatch.fnmatch(os.path.basename(tarinfo.name), filename):
                    matched_set.add(filename)
                    return tarinfo
        return None

    # Since filenames is essentially static, convert to set immediately and use the set
    filenames_set = set(filenames or [])

    # If there's a '*' - less things to check.
    include_all = len({WILDCARDS[0]} & filenames_set) > 0
    processed_filenames = []
    matched_set = set()
    temp_dir = create_project_temp_dir()
    archive = os.path.join(temp_dir, archive_name)

    with tarfile.open(archive, "w:gz", dereference=True) as tar:
        tar.add(source_dir, arcname="", filter=tar_filter)

    # Get the list of dependencies by discarding the first item of filenames, which is always the source file.
    dependencies_set = set([] if not filenames else filenames[1:])
    wildcard_expression_list = [f"{WILDCARDS[0]}.py", f"{WILDCARDS[0]}.r"]  # Supported script file extensions.
    wildcard_expression = len(dependencies_set) == 1 and next(iter(dependencies_set)) in wildcard_expression_list

    if require_complete and not include_all:
        # Compare matched_set against filenames_set to ensure they're the same.
        # Tolerate no matching files when a single filename is a wildcard_expression.
        if len(filenames_set) > len(matched_set) and not wildcard_expression:
            raise FileNotFoundError(filenames_set - matched_set)  # Only include the missing filenames

    return archive
