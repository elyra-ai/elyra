#
# Copyright 2018-2020 Elyra Authors
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
import asyncio
import argparse
import warnings

from .pipeline.parser import PipelineParser
from .pipeline.processor import PipelineProcessorManager
from .pipeline.pipeline import Pipeline

parser = argparse.ArgumentParser()
parser.add_argument('path')
args = parser.parse_args()


async def submit(pipeline):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        response = await PipelineProcessorManager.instance().process(pipeline)

    msg = response.to_json()
    print("Run URL:", msg["run_url"])
    print("Object Storage URL:", msg["object_storage_url"])
    print("Object Storage Path:", msg["object_storage_path"])


def parse(pipeline_definitions, pipeline_object):
    if 'primary_pipeline' not in pipeline_definitions:
        raise ValueError("Invalid pipeline: Could not determine the primary pipeline.")
    if 'pipelines' not in pipeline_definitions:
        raise ValueError("Invalid pipeline: Pipeline definition not found.")

    primary_pipeline_id = pipeline_definitions['primary_pipeline']
    primary_pipeline = PipelineParser._get_pipeline_definition(pipeline_definitions, primary_pipeline_id)
    if not primary_pipeline:
        raise ValueError("Invalid pipeline: Primary pipeline '{}' not found.".format(primary_pipeline_id))

    PipelineParser()._nodes_to_operations(pipeline_definitions, pipeline_object, primary_pipeline['nodes'])
    return pipeline_object


def cli():
    os.environ["ELYRA_METADATA_PATH"] = os.path.join(os.path.expanduser("~"), ".elyra")

    pipeline_path = os.path.join(os.getcwd(), args.path)
    pipeline_dir = os.path.dirname(pipeline_path)

    with open(pipeline_path) as f:
        pipeline_definition = json.load(f)

    for pipeline in pipeline_definition["pipelines"]:
        for node in pipeline["nodes"]:
            if node["app_data"]["filename"]:
                abs_path = os.path.join(os.getcwd(), pipeline_dir, node["app_data"]["filename"])
                node["app_data"]["filename"] = abs_path

    name = os.path.splitext(os.path.basename(pipeline_path))[0]
    pipeline_object = Pipeline(id=id, name=name, runtime='kfp', runtime_config='fun')

    pipeline = parse(pipeline_definition, pipeline_object)

    asyncio.get_event_loop().run_until_complete(submit(pipeline))


if __name__ == "__main__":
    cli()
