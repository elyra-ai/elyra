#
# Copyright 2018-2019 IBM Corporation
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
import copy
import io
import json
import os
import time
import tempfile
import unittest

from logging import StreamHandler

from ai_workspace.metadata.metadata import MetadataManager, FileMetadataStore, SchemaManager

StringIO = io.StringIO

test_schema_json = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Test schema for runtime metadata",
    "properties": {
        "schema_name": {
            "type": "string",
            "pattern": "^[a-z][a-z,-,_,0-9]*[a-z,0-9]$",
            "minLength": 1
        },
        "name": {
            "description": "The canonical name of the metadata",
            "type": "string"
        },
        "display_name": {
            "description": "The display name of the metadata",
            "type": "string",
            "pattern": "^[a-z][a-z,-,_, ,0-9]*[a-z,0-9]$"
        },
        "metadata": {
            "description": "Additional data specific to this metadata",
            "type": "object",
            "properties": {
                "api_endpoint": {
                    "description": "The endpoint corresponding to this metadata item",
                    "type": "string",
                    "format": "uri"
                },
                "foo": {
                    "type": "number",
                    "minimum": 1,
                    "maximum": 10
                }
            },
            "required": ["api_endpoint"]
        }
    },
    "required": ["schema_name", "display_name"]
}

valid_metadata_json = {
    'schema_name': 'test_schema',
    'display_name': 'valid runtime',
    'metadata': {
        'api_endpoint': 'http://localhost:31823/v1/models?version=2017-02-13',
        'foo': 8
    }
}

# This metadata doesn't include 'schema_name'.  Will need to adjust should we decide
# to make schema required.
another_metadata_json = {
    'display_name': 'another runtime',
    'metadata': {
        'api_endpoint': 'http://localhost:8081/'
    }
}

invalid_metadata_json = {
    'schema_name': 'test_schema',
    'display_name': 'invalid runtime',
    'metadata': {
        'api_endpoint_missing': 'http://localhost:8081/'
    }
}


def _create_json_file(location, file_name, content):
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

        _create_json_file(self.metadata_dir, 'test_schema.schema', test_schema_json)
        _create_json_file(self.metadata_dir, 'valid.json', valid_metadata_json)
        _create_json_file(self.metadata_dir, 'another.json', another_metadata_json)
        _create_json_file(self.metadata_dir, 'invalid.json', invalid_metadata_json)

        self.filestore_manager = FileMetadataStore(namespace='runtime', metadata_dir=self.metadata_dir)
        self.metadata_manager = \
            MetadataManager(namespace="runtime", store=self.filestore_manager)

    def test_list_metadata_summary(self):
        metadata_summary_list = self.metadata_manager.get_all_metadata_summary()
        self.assertEqual(len(metadata_summary_list), 2)

    def test_list_all_metadata(self):
        metadata_list = self.metadata_manager.get_all()
        self.assertEqual(len(metadata_list), 2)

    def test_read_valid_metadata_by_name(self):
        metadata_name = 'valid'
        some_metadata = self.metadata_manager.get(metadata_name)
        self.assertEqual(some_metadata.name, metadata_name)

    def test_read_invalid_metadata_by_name(self):
        capture = StringIO()
        handler = StreamHandler(capture)
        self.filestore_manager.log.addHandler(handler)

        metadata_name = 'invalid'
        some_metadata = self.metadata_manager.get(metadata_name)

        self.assertIsNone(some_metadata)

        captured = capture.getvalue()
        self.assertIn("Schema validation failed", captured)

    def test_read_missing_metadata_by_name(self):
        metadata_name = 'missing'
        some_metadata = self.metadata_manager.get(metadata_name)
        self.assertIsNone(some_metadata)


class MetadataFileStoreTestCase(unittest.TestCase):
    def setUp(self):
        # create temporary data directory for storing metadata
        self.temp_dir = tempfile.TemporaryDirectory()
        self.metadata_dir = self.temp_dir.name
        self.addCleanup(self.temp_dir.cleanup)

        _create_json_file(self.metadata_dir, 'test_schema.schema', test_schema_json)
        _create_json_file(self.metadata_dir, 'valid.json', valid_metadata_json)
        _create_json_file(self.metadata_dir, 'another.json', another_metadata_json)
        _create_json_file(self.metadata_dir, 'invalid.json', invalid_metadata_json)

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

    def test_read_missing_metadata_by_name(self):
        metadata_name = 'missing'
        some_metadata = self.metadata_file_store.read(metadata_name)
        self.assertIsNone(some_metadata)


class SchemaManagerTestCase(unittest.TestCase):
    def setUp(self) -> None:
        # create temporary data directory for storing metadata
        self.temp_dir = tempfile.TemporaryDirectory()
        self.metadata_dir = self.temp_dir.name
        self.addCleanup(self.temp_dir.cleanup)

        _create_json_file(self.metadata_dir, 'test_schema.schema', test_schema_json)

        self.schema_manager = SchemaManager.instance()

    def _get_epoch(self, schema_name):
        epoch = 0
        schema_file = os.path.join(self.metadata_dir, schema_name + '.schema')
        if os.path.exists(schema_file):
            epoch = int(os.path.getmtime(schema_file))
        return epoch

    def test_is_stale_schema(self):
        self.schema_manager.remove_all()

        epoch = self._get_epoch("test_schema")
        is_stale = self.schema_manager.is_schema_stale("foo", "test_schema", epoch)
        self.assertTrue(is_stale)

        self.schema_manager.add_schema("foo", "test_schema", test_schema_json, epoch)

        is_stale = self.schema_manager.is_schema_stale("foo", "test_schema", epoch)
        self.assertFalse(is_stale)

        # extend the schema...and confirm current schema is stale
        time.sleep(1.0)  # need to delay so epoch is different
        modified_schema = copy.deepcopy(test_schema_json)
        modified_schema['properties']['metadata']['properties']['bar'] = {"type": "string", "minLength": 5}
        _create_json_file(self.metadata_dir, 'test_schema.schema', modified_schema)

        epoch = self._get_epoch("test_schema")
        is_stale = self.schema_manager.is_schema_stale("foo", "test_schema", epoch)
        self.assertTrue(is_stale)

    def test_manage_schema(self):
        self.schema_manager.remove_all()

        self.schema_manager.add_schema("foo", "test_schema", test_schema_json, 111)
        self.schema_manager.add_schema("bar", "test_schema", test_schema_json, 111)
        self.schema_manager.add_schema("baz", "test_schema", test_schema_json, 111)

        foo_schema = self.schema_manager.get_schema("foo", "test_schema")
        self.assertIsNotNone(foo_schema)
        self.assertEqual(foo_schema, test_schema_json)

        baz_schema = self.schema_manager.get_schema("baz", "test_schema")
        self.assertIsNotNone(baz_schema)
        self.assertEqual(baz_schema, test_schema_json)

        bar_schema = self.schema_manager.get_schema("bar", "test_schema")
        self.assertIsNotNone(baz_schema)
        self.assertEqual(bar_schema, test_schema_json)

        # extend the schema... add and ensure update exists...
        modified_schema = copy.deepcopy(bar_schema)
        modified_schema['properties']['metadata']['properties']['bar'] = {"type": "string", "minLength": 5}

        self.schema_manager.add_schema("bar", "test_schema", modified_schema, 112)
        bar_schema = self.schema_manager.get_schema("bar", "test_schema")
        self.assertIsNotNone(bar_schema)
        self.assertNotEqual(bar_schema, test_schema_json)
        self.assertEqual(bar_schema, modified_schema)

        self.schema_manager.remove_schema("bar", "test_schema")
        bar_schema = self.schema_manager.get_schema("bar", "test_schema")
        self.assertIsNone(bar_schema)

        self.schema_manager.remove_all()
        foo_schema = self.schema_manager.get_schema("foo", "test_schema")
        self.assertIsNone(foo_schema)
        baz_schema = self.schema_manager.get_schema("baz", "test_schema")
        self.assertIsNone(baz_schema)


if __name__ == '__main__':
    unittest.main()
