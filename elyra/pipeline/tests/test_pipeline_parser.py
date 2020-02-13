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
import os
import unittest
import json

from elyra.pipeline import PipelineParser, Operation


class PipelineParserTestCase(unittest.TestCase):
    valid_operation = Operation(id='{{uuid}}',
                                type='{{type}}',
                                title='{{title}}',
                                artifact='{{artifact}}',
                                image='{{image}}')

    def test_parse_valid_pipeline(self):
        pipeline_definition = self.read_pipeline_resource('pipeline_valid.json')

        pipeline = PipelineParser.parse(pipeline_definition)

        self.assertEqual(pipeline.title, '{{title}}')
        self.assertEqual(len(pipeline.operations), 1)

        self.assertTrue(pipeline.operations['{{uuid}}'] == PipelineParserTestCase.valid_operation)

    @unittest.expectedFailure
    def test_parse_invalid_pipeline(self):
        pipeline_definition = self.read_pipeline_resource('pipeline_invalid.json')

        PipelineParser.parse(pipeline_definition)

    def test_parse_multinode_pipeline(self):
        pipeline_definition = self.read_pipeline_resource('pipeline_3_node_sample.json')

        pipeline = PipelineParser.parse(pipeline_definition)

        self.assertEqual(len(pipeline.operations), 3)

    def test_parse_pipeline_operations_and_handle_artifact_file_details(self):
        pipeline_definition = self.read_pipeline_resource('pipeline_3_node_sample.json')

        pipeline = PipelineParser.parse(pipeline_definition)

        self.assertEqual(len(pipeline.operations), 3)

        for op in pipeline.operations.values():
            self.assertTrue('/' not in op.artifact_filename)
            self.assertTrue('.' not in op.artifact_name)

    def test_parse_pipeline_with_dependencies(self):
        pipeline_definition = self.read_pipeline_resource('pipeline_3_node_sample_with_dependencies.json')

        pipeline = PipelineParser.parse(pipeline_definition)

        self.assertEqual(len(pipeline.operations['acc4527d-7cc8-4c16-b520-5aa0f50a2e34'].dependencies), 2)

    def test_parse_pipeline_global_attributes(self):
        pipeline_definition = self.read_pipeline_resource('pipeline_valid.json')

        pipeline = PipelineParser.parse(pipeline_definition)

        self.assertEqual(pipeline.title, '{{title}}')
        self.assertEqual(pipeline.runtime, '{{runtime}}')
        self.assertEqual(pipeline.runtime_config, '{{runtime-config}}')

    @staticmethod
    def read_pipeline_resource(pipeline_filename):
        root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
        pipeline_path = os.path.join(root, pipeline_filename)

        with open(pipeline_path, 'r') as f:
            pipeline_json = json.load(f)

        return pipeline_json
