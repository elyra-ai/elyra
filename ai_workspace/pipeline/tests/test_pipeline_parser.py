import os
import unittest
import json

from ai_workspace.pipeline import PipelineParser, Pipeline, Operation


class PipelineParserTestCase(unittest.TestCase):
    valid_operation = Operation(id='{{uuid}}',
                                type='{{type}}',
                                title='{{title}}',
                                platform='{{platform}}',
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

        pipeline = PipelineParser.parse(pipeline_definition)

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

    @staticmethod
    def read_pipeline_resource(pipeline_filename):
        root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
        pipeline_path = os.path.join(root, pipeline_filename)

        with open(pipeline_path, 'r') as f:
            pipeline_json = json.load(f)

        return pipeline_json


