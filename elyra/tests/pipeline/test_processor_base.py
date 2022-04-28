#
# Copyright 2018-2022 Elyra Authors
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

import pytest

from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import KeyValueList
from elyra.pipeline.processor import RuntimePipelineProcessor
from elyra.tests.pipeline.test_pipeline_parser import _read_pipeline_resource


@pytest.fixture
def runtime_processor(setup_factory_data):
    processor = RuntimePipelineProcessor(os.getcwd())
    return processor


@pytest.fixture
def parsed_pipeline(request):
    pipeline_resource = _read_pipeline_resource(request.param)
    return PipelineParser().parse(pipeline_json=pipeline_resource)


@pytest.fixture
def sample_metadata():
    return {
        "api_endpoint": "http://examples.com:31737",
        "cos_endpoint": "http://examples.com:31671",
        "cos_username": "example",
        "cos_password": "example123",
        "cos_bucket": "test",
        "engine": "Argo",
        "tags": [],
    }


def test_get_volume_mounts(runtime_processor):
    mounted_volumes = KeyValueList(["/mount/test=rwx-test-claim", "/mount/test_two=second-claim"])
    component_parameters = {
        "filename": "pipelines_test_file",
        "env_vars": [],
        "runtime_image": "tensorflow/tensorflow:latest",
        "mounted_volumes": mounted_volumes,
    }
    test_operation = GenericOperation(
        id="this-is-a-test-id",
        type="execution-node",
        classifier="execute-notebook-node",
        name="test",
        component_params=component_parameters,
    )
    parsed_volumes_dict = runtime_processor._get_volume_mounts(operation=test_operation)
    assert parsed_volumes_dict == {
        "/mount/test": "rwx-test-claim",
        "/mount/test_two": "second-claim",
    }
