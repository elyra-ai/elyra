import os
import tempfile
import uuid
import unittest
import json

from ai_workspace.metadata.metadata import Metadata, FileMetadataStore

DATA_DIR = os.path.join(os.path.dirname(__file__))

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


class SandboxTestCase(unittest.TestCase):

    def setUp(self):
        metadata = Metadata(**valid_metadata_json)
        print('>>>')
        print(metadata.to_dict())
        print(metadata.to_json())
        print('>>>')

    def test_something(self):
        pass
