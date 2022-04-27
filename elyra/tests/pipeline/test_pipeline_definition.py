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
from unittest import mock

import pytest

from elyra.pipeline import pipeline_constants
from elyra.pipeline.pipeline import KeyValueList
from elyra.pipeline.pipeline_definition import PipelineDefinition
from elyra.tests.pipeline.util import _read_pipeline_resource


@pytest.fixture
def mock_pipeline_property_propagation(monkeypatch):
    # Mock propagate_pipeline_default_properties to skip propagation
    monkeypatch.setattr(PipelineDefinition, "propagate_pipeline_default_properties", lambda x: True)


def test_valid_pipeline():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    assert pipeline_definition.is_valid()


def test_validation_flags_missing_schema_version(mock_pipeline_property_propagation):
    _check_missing_pipeline_field("version", "Pipeline schema version field is missing.")


def test_validation_flags_schema_version_has_wrong_type(mock_pipeline_property_propagation):
    _check_pipeline_field_type("version", 3.0, "Pipeline schema version field should be a string.")


def test_validation_flags_missing_pipelines_field(mock_pipeline_property_propagation):
    _check_missing_pipeline_field("pipelines", "Pipeline is missing 'pipelines' field.")


def test_validation_flags_pipelines_has_wrong_type(mock_pipeline_property_propagation):
    _check_pipeline_field_type("pipelines", "", "Field 'pipelines' should be a list.")


def test_validation_flags_pipelines_is_empty(mock_pipeline_property_propagation):
    _check_pipeline_field_type("pipelines", list(), "Pipeline has zero length 'pipelines' field.")


def test_validation_flags_missing_primary_pipeline_field(mock_pipeline_property_propagation):
    _check_missing_pipeline_field("primary_pipeline", "Could not determine the primary pipeline.")


def test_validation_flags_missing_primary_pipeline_nodes_field(mock_pipeline_property_propagation):
    _check_missing_primary_pipeline_field("nodes", "At least one node must exist in the primary pipeline.")


def test_validation_flags_missing_app_data_field(mock_pipeline_property_propagation):
    _check_missing_primary_pipeline_field("app_data", "Primary pipeline is missing the 'app_data' field.")


def test_validation_flags_missing_version_field():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["app_data"].pop("version")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    assert pipeline_definition.is_valid() is False
    assert "Primary pipeline is missing the 'version' field." in pipeline_definition.validate()


def test_updates_to_primary_pipeline_updates_pipeline_definition():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)
    pipeline_definition.primary_pipeline.set("version", 3)

    assert pipeline_definition.primary_pipeline.version == 3
    assert pipeline_definition.to_dict()["pipelines"][0]["app_data"]["version"] == 3


def test_updates_to_nodes_updates_pipeline_definition():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)
    for node in pipeline_definition.primary_pipeline.nodes:
        node.set_component_parameter("filename", "foo")

    for node in pipeline_definition.to_dict()["pipelines"][0]["nodes"]:
        assert node["app_data"]["component_parameters"]["filename"] == "foo"


def test_envs_to_dict():
    test_list = ["TEST= one", "TEST_TWO=two ", "TEST_THREE =", " TEST_FOUR=1", "TEST_FIVE = fi=ve "]
    test_dict_correct = {"TEST": "one", "TEST_TWO": "two", "TEST_FOUR": "1", "TEST_FIVE": "fi=ve"}
    assert KeyValueList(test_list).to_dict() == test_dict_correct


def test_env_dict_to_list():
    test_dict = {"TEST": "one", "TEST_TWO": "two", "TEST_FOUR": "1"}
    test_list_correct = ["TEST=one", "TEST_TWO=two", "TEST_FOUR=1"]
    assert KeyValueList.from_dict(test_dict) == test_list_correct


def test_convert_kv_properties(monkeypatch):
    kv_test_property_name = "kv_test_property"
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid_with_pipeline_default.json")

    # Mock get_kv_properties() to ensure the "kv_test_property" variable is included in the list
    mock_kv_property_list = [pipeline_constants.ENV_VARIABLES, kv_test_property_name]
    monkeypatch.setattr(PipelineDefinition, "get_kv_properties", mock.Mock(return_value=mock_kv_property_list))

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    node = pipeline_definition.primary_pipeline.nodes.pop()
    pipeline_defaults = pipeline_definition.primary_pipeline.get_property(pipeline_constants.PIPELINE_DEFAULTS)

    for kv_property in mock_kv_property_list:
        assert isinstance(node.get_component_parameter(kv_property), KeyValueList)
        assert isinstance(pipeline_defaults[kv_property], KeyValueList)

    # Ensure a non-list property is not converted to a KeyValueList
    assert not isinstance(
        pipeline_definition.primary_pipeline.get_property(pipeline_constants.RUNTIME_IMAGE), KeyValueList
    )

    # Ensure plain list property is not converted to a KeyValueList
    assert not isinstance(node.get_component_parameter("outputs"), KeyValueList)


def test_propagate_pipeline_default_properties(monkeypatch):
    kv_list_correct = ["var1=var1", "var2=var2", "var3=var_three"]
    kv_test_property_name = "kv_test_property"
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid_with_pipeline_default.json")

    # Mock get_kv_properties() to ensure the "kv_test_property" variable is included in the list
    mock_kv_property_list = [pipeline_constants.ENV_VARIABLES, kv_test_property_name]
    monkeypatch.setattr(PipelineDefinition, "get_kv_properties", mock.Mock(return_value=mock_kv_property_list))

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)
    node = pipeline_definition.primary_pipeline.nodes.pop()
    assert node.get_component_parameter(pipeline_constants.ENV_VARIABLES) == kv_list_correct
    assert node.get_component_parameter(kv_test_property_name) == kv_list_correct


def _check_pipeline_correct_pipeline_name():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    primary_pipeline = pipeline_definition.primary_pipeline

    assert primary_pipeline.name == "{{name}}"


def _check_pipeline_correct_pipeline_alternative_name():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid_alternative_name.json")
    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    primary_pipeline = pipeline_definition.primary_pipeline

    assert primary_pipeline.name == "{{alternative_name}}"


#####################
# Utility functions #
#####################
def _check_missing_pipeline_field(field: str, error_msg: str):
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json.pop(field)

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    assert pipeline_definition.is_valid() is False
    assert error_msg in pipeline_definition.validate()


def _check_pipeline_field_type(field: str, wrong_type_value: any, error_msg: str):
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json.pop(field)
    pipeline_json[field] = wrong_type_value

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    assert pipeline_definition.is_valid() is False
    assert error_msg in pipeline_definition.validate()


def _check_missing_primary_pipeline_field(field: str, error_msg: str):
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0].pop(field)

    pipeline_definition = PipelineDefinition(pipeline_definition=pipeline_json)

    assert pipeline_definition.is_valid() is False
    assert error_msg in pipeline_definition.validate()
