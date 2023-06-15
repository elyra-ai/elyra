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
from datetime import datetime
import os
import shutil
import tarfile
import tempfile
import unittest

import pytest

from elyra.util.archive import create_temp_archive


class ArchiveTestCase(unittest.TestCase):
    temp_dir = tempfile.gettempdir()
    test_timestamp = datetime.now().strftime("%m%d%H%M%S")
    test_dir_name = "test_" + test_timestamp
    test_dir = None
    test_files = ["a.py", "b.py", "c.json", "d.txt", "e.ipynb"]

    def setUp(self):
        """
        Setup a temp folder with some files to be used
        during test cases
        """
        # create test files
        self.test_dir = tempfile.mkdtemp(self.test_dir_name)
        self._create_test_files(self.test_dir)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_archive_all(self):
        test_archive_name = "all-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir, filenames=["*"])
        self.assertArchivedContent(archive_path, self.test_files)

    def test_archive_empty_filter(self):
        test_archive_name = "all-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir, filenames=[])
        self.assertArchivedFileCount(archive_path, 0)

    def test_archive_no_filter(self):
        test_archive_name = "all-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir)
        self.assertArchivedFileCount(archive_path, 0)

    def test_archive_by_filter(self):
        test_archive_name = "python-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir, filenames=["*.py"])
        self.assertArchivedContent(archive_path, ["a.py", "b.py"])

    def test_archive_by_sequence_wildcard(self):
        test_archive_name = "python-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir, filenames=["[ab].*"])
        self.assertArchivedContent(archive_path, ["a.py", "b.py"])

    def test_archive_by_excluded_sequence(self):
        test_archive_name = "python-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir, filenames=["*[!b].py"])
        self.assertArchivedContent(archive_path, ["a.py"])

    def test_archive_multiple_filters(self):
        test_archive_name = "multiple-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir, filenames=["*.json", "*.txt"])
        self.assertArchivedContent(archive_path, ["c.json", "d.txt"])

    def test_archive_require_complete(self):
        test_archive_name = "multiple-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(
            test_archive_name, self.test_dir, filenames=["*.json", "*.txt", "a.py"], require_complete=True
        )
        self.assertArchivedContent(archive_path, ["c.json", "d.txt", "a.py"])

    def test_archive_require_complete_fail(self):
        test_archive_name = "multiple-" + self.test_timestamp + ".tar.gz"
        # c.py does not exist and exception is expected
        with pytest.raises(FileNotFoundError) as ex:
            create_temp_archive(
                test_archive_name, self.test_dir, filenames=["*.json", "*.txt", "a.py", "c.py"], require_complete=True
            )
        assert "{'c.py'}" in str(ex)  # ensure c.py is the only item not matched

    def test_archive_nonexistent_filter(self):
        test_archive_name = "empty-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(test_archive_name, self.test_dir, filenames=["*.yml"])
        self.assertArchivedContent(archive_path, [])

    def test_archive_with_subdirectories(self):
        subdir_name = os.path.join(self.test_dir, "subdir")
        os.makedirs(subdir_name)
        self._create_test_files(subdir_name)

        test_archive_name = "subdir-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(
            archive_name=test_archive_name, source_dir=self.test_dir, filenames=["*"], recursive=True
        )

        self.assertArchivedFileCount(archive_path, 10)

    def test_archive_with_subdirectories_no_filter(self):
        subdir_name = os.path.join(self.test_dir, "subdir")
        os.makedirs(subdir_name)
        self._create_test_files(subdir_name)

        test_archive_name = "subdir-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(archive_name=test_archive_name, source_dir=self.test_dir, recursive=True)

        self.assertArchivedFileCount(archive_path, 0)

    def test_archive_with_subdirectories_and_filters(self):
        subdir_name = os.path.join(self.test_dir, "subdir")
        os.makedirs(subdir_name)
        self._create_test_files(subdir_name)

        test_archive_name = "subdir-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(
            archive_name=test_archive_name, source_dir=self.test_dir, filenames=["subdir/*.py"], recursive=True
        )

        self.assertArchivedFileCount(archive_path, 2)
        self.assertArchivedContent(archive_path, ["subdir/a.py", "subdir/b.py"])

    def test_archive_with_second_level_subdirectories(self):
        subdir_name = os.path.join(self.test_dir, "subdir")
        os.makedirs(subdir_name)
        self._create_test_files(subdir_name)

        another_subdir_name = os.path.join(subdir_name, "another.subdir")
        os.makedirs(another_subdir_name)
        self._create_test_files(another_subdir_name)

        test_archive_name = "subdir-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(
            archive_name=test_archive_name, source_dir=self.test_dir, filenames=["*"], recursive=True
        )

        self.assertArchivedFileCount(archive_path, 15)

    def test_archive_with_second_level_subdirectories_and_nonexistent_filter(self):
        subdir_name = os.path.join(self.test_dir, "subdir")
        os.makedirs(subdir_name)
        self._create_test_files(subdir_name)

        another_subdir_name = os.path.join(subdir_name, "another.subdir")
        os.makedirs(another_subdir_name)
        self._create_test_files(another_subdir_name)

        test_archive_name = "subdir-" + self.test_timestamp + ".tar.gz"
        archive_path = create_temp_archive(
            archive_name=test_archive_name, source_dir=self.test_dir, filenames=["*.yml"], recursive=True
        )

        self.assertArchivedFileCount(archive_path, 0)

    def assertArchivedContent(self, archive_path, expected_content):
        actual_content = []
        with tarfile.open(archive_path, "r:gz") as tar:
            for tarinfo in tar:
                if tarinfo.isreg():
                    actual_content.append(tarinfo.name)

        self.assertListEqual(sorted(actual_content), sorted(expected_content))

    def assertArchivedFileCount(self, archive_path, expected_number_of_files):
        n_files = 0
        with tarfile.open(archive_path, "r:gz") as tar:
            for tarinfo in tar:
                if tarinfo.isreg():
                    n_files += 1

        self.assertEqual(expected_number_of_files, n_files)

    def _create_test_files(self, dir_name):
        for test_file in self.test_files:
            file_path = os.path.join(dir_name, test_file)
            with open(file_path, "a"):
                os.utime(file_path, None)
