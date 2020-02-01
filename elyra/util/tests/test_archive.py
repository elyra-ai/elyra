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
import unittest
import shutil
import tarfile
import tempfile

from datetime import datetime

from elyra.util import create_temp_archive


class ArchiveTestCase(unittest.TestCase):
    temp_dir = tempfile.gettempdir()
    test_timestamp = datetime.now().strftime("%m%d%H%M%S")
    test_dir_name = 'test_' + test_timestamp
    test_dir = None
    test_files = [
        'a.py',
        'b.py',
        'c.json',
        'd.txt'
    ]

    def setUp(self):
        """
        Setup a temp folder with some files to be used
        during test cases
        """
        # create test files
        self.test_dir = tempfile.mkdtemp(self.test_dir_name)
        for test_file in self.test_files:
            file_path = os.path.join(self.test_dir, test_file)
            with open(file_path, 'a'):
                os.utime(file_path, None)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            print('removing test directory: {}'.format(self.test_dir))
            shutil.rmtree(self.test_dir)

    def test_archive_all(self):
        test_archive_name = 'all-' + self.test_timestamp + '.tar.gz'
        archive_path = create_temp_archive(test_archive_name, self.test_dir)
        self.assertArchivedContent(archive_path, self.test_files)

    def test_archive_by_extension(self):
        test_archive_name = 'python-' + self.test_timestamp + '.tar.gz'
        archive_path = create_temp_archive(test_archive_name, self.test_dir, ['*.py'])
        self.assertArchivedContent(archive_path, ['a.py', 'b.py'])

    def test_archive_multiple_extensions(self):
        test_archive_name = 'multiple-' + self.test_timestamp + '.tar.gz'
        archive_path = create_temp_archive(test_archive_name, self.test_dir, ['*.json', '*.txt'])
        self.assertArchivedContent(archive_path, ['c.json', 'd.txt'])

    def test_archive_unexistent_extensions(self):
        test_archive_name = 'empty-' + self.test_timestamp + '.tar.gz'
        archive_path = create_temp_archive(test_archive_name, self.test_dir, ['*.yml'])
        self.assertArchivedContent(archive_path, [])

    def assertArchivedContent(self, archive_path, expected_content):
        actual_content = []
        with tarfile.open(archive_path, "r:gz") as tar:
            for tarinfo in tar:
                if tarinfo.isreg():
                    actual_content.append(tarinfo.name)

        self.assertListEqual(sorted(actual_content), sorted(expected_content))
