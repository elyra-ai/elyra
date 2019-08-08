import io
import os
import tempfile
import uuid
import unittest
import json

from ai_workspace.metadata.metadata import Metadata, MetadataManager, FileMetadataStore

valid_metadata_json = {
    'name': 'valid',
    'display_name': 'valid runtime',
    'metadata': {
        'api_endpoint': 'http://localhost:31823/v1/models?version=2017-02-13'
    }
}

another_metadata_json = {
    'name': 'another',
    'display_name': 'another runtime',
    'metadata': {
        'api_endpoint': 'http://localhost:8081/'
    }
}


def _create_metadata(location, file_name, content):
    resource = os.path.join(location, file_name)
    with open(resource, 'w', encoding='utf-8') as f:
        f.write(json.dumps(content))

# class MetadataTestCase(unittest.TestCase):
#     valid_metadata_resource =  os.path.join('', 'metadata/runtime/a.json')
#     invalid_metadata_resource = os.path.join('', 'metadata/runtime/invalid.json')
#
#     def test_instantiate_from_resource(self):
#         metadata = Metadata.from_resource(MetadataTestCase.valid_metadata_resource)
#         self.assertEqual(metadata.name, "a")
#         self.assertEqual(metadata.display_name, "FfDL")
#         self.assertIsNotNone(metadata.metadata['api_endpoint'])
#
#     def test_instantiate_from_invalid_resource(self):
#         metadata = Metadata.from_resource(MetadataTestCase.invalid_metadata_resource)
#         self.assertIsNone(metadata)


class MetadataManagerTestCase(unittest.TestCase):
    def setUp(self) -> None:
        # create temporary data directory for storing metadata
        self.temp_dir = tempfile.TemporaryDirectory()
        self.metadata_dir = self.temp_dir.name
        self.addCleanup(self.temp_dir.cleanup)

        _create_metadata(self.metadata_dir, 'valid.json', valid_metadata_json)
        _create_metadata(self.metadata_dir, 'another.json', another_metadata_json)

        self.metadata_manager = \
            MetadataManager(namespace="runtime",
                            store=FileMetadataStore(namespace='runtime', metadata_dir=self.metadata_dir))

    def test_list_metadata_summary(self):
        metadata_summary_list = self.metadata_manager.get_all_metadata_summary()
        self.assertEqual(len(metadata_summary_list), 2)

    def test_list_all_metadata(self):
        metadata_list = self.metadata_manager.get_all()
        self.assertEqual(len(metadata_list), 2)

    def test_read_valid_metadata_by_name(self):
        metadata_name = 'valid'
        some_metadata = self.metadata_manager.read(metadata_name)
        self.assertEqual(some_metadata.name, metadata_name)

    def test_read_invalid_metadata_by_name(self):
        metadata_name = 'invalid'
        some_metadata = self.metadata_manager.read(metadata_name)
        self.assertIsNone(some_metadata)


class MetadataFileStoreTestCase(unittest.TestCase):
    def setUp(self):
        # create temporary data directory for storing metadata
        self.temp_dir = tempfile.TemporaryDirectory()
        self.metadata_dir = self.temp_dir.name
        self.addCleanup(self.temp_dir.cleanup)

        _create_metadata(self.metadata_dir, 'valid.json', valid_metadata_json)
        _create_metadata(self.metadata_dir, 'another.json', another_metadata_json)

        self.metadata_file_store = FileMetadataStore(namespace='runtime', metadata_dir=self.metadata_dir)

    def test_list_metadata_summary(self):
        metadata_summary_list = self.metadata_file_store.get_all_metadata_summary()
        self.assertEqual(len(metadata_summary_list), 2)

    def test_list_all_metadata(self):
        metadata_list = self.metadata_file_store.get_all()
        self.assertEqual(len(metadata_list), 2)

    def test_read_valid_metadata_by_name(self):
        metadata_name = 'valid'
        some_metadata = self.metadata_file_store.read(metadata_name)
        self.assertEqual(some_metadata.name, metadata_name)

    def test_read_invalid_metadata_by_name(self):
        metadata_name = 'invalid'
        some_metadata = self.metadata_file_store.read(metadata_name)
        self.assertIsNone(some_metadata)


if __name__ == '__main__':
    unittest.main()
