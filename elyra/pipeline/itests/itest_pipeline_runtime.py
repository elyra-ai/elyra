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
import json
import unittest
import unittest.mock as mock

from elyra.metadata import Metadata
from elyra.pipeline import PipelineParser, PipelineProcessorManager


def mock_get_metadata(arg, **kwargs):
    metadata_json = {
        "schema": "kfp",
        "display_name": "Kubeflow Pipeline (yukked1)",
        "metadata": {
            "api_endpoint": "http://yukked1.fyre.ibm.com:31380/pipeline",
            "cos_endpoint": "http://yukked1.fyre.ibm.com:31128",
            "cos_username": "minio",
            "cos_password": "minio123",
            "cos_bucket": "lresende"
        }
    }

    return Metadata(**metadata_json)


class PipelineRuntimeTestCase(unittest.TestCase):

    @mock.patch('elyra.pipeline.processor_kfp.KfpPipelineProcessor._get_runtime_configuration',
                mock_get_metadata)
    def test_process_valid_pipeline(self):
        pipeline_definition = self.read_pipeline_resource('pipeline.json')

        pipeline = PipelineParser.parse(pipeline_definition)
        PipelineProcessorManager.process(pipeline)

    @staticmethod
    def read_pipeline_resource(pipeline_filename):
        root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
        pipeline_path = os.path.join(root, pipeline_filename)

        with open(pipeline_path, 'r') as f:
            pipeline_json = json.load(f)

        return pipeline_json
