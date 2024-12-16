#
# Copyright 2018-2025 Elyra Authors
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
from conftest import AIRFLOW_TEST_OPERATOR_CATALOG
import pytest

from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.properties import ElyraPropertyList
from elyra.pipeline.properties import EnvironmentVariable
from elyra.tests.pipeline.util import _read_pipeline_resource


@pytest.fixture
def valid_operation():
    env_vars = [EnvironmentVariable(env_var="var1", value="var1"), EnvironmentVariable(env_var="var2", value="var2")]
    component_parameters = {
        "filename": "{{filename}}",
        "runtime_image": "{{runtime_image}}",
        "dependencies": ["a.txt", "b.txt", "c.txt"],
        "outputs": ["d.txt", "e.txt", "f.txt"],
    }
    return GenericOperation(
        id="{{uuid}}",
        type="execution_node",
        classifier="execute-notebook-node",
        name="{{label}}",
        component_props=component_parameters,
        elyra_props={"env_vars": ElyraPropertyList(env_vars)},
    )


def test_valid_pipeline(valid_operation):
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")

    pipeline = PipelineParser().parse(pipeline_json)

    assert pipeline.name == "{{name}}"
    assert pipeline.runtime == "{{runtime}}"
    assert pipeline.runtime_config == "{{runtime-config}}"
    assert len(pipeline.operations) == 1

    pipeline_op_envs = pipeline.operations["{{uuid}}"].elyra_props.pop(ENV_VARIABLES)
    valid_op_envs = valid_operation.elyra_props.pop(ENV_VARIABLES)
    assert pipeline_op_envs.to_dict() == valid_op_envs.to_dict()

    assert pipeline.operations["{{uuid}}"] == valid_operation


def test_pipeline_with_dirty_list_values(valid_operation):
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_with_invalid_list_values.json")

    pipeline = PipelineParser().parse(pipeline_json)

    assert pipeline.name == "{{name}}"
    assert pipeline.runtime == "{{runtime}}"
    assert pipeline.runtime_config == "{{runtime-config}}"
    assert len(pipeline.operations) == 1

    pipeline_op_envs = pipeline.operations["{{uuid}}"].elyra_props.pop(ENV_VARIABLES)
    valid_op_envs = valid_operation.elyra_props.pop(ENV_VARIABLES)
    assert pipeline_op_envs.to_dict() == valid_op_envs.to_dict()

    assert pipeline.operations["{{uuid}}"] == valid_operation


def test_multinode_pipeline():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_3_node_sample.json")

    pipeline = PipelineParser().parse(pipeline_json)

    assert len(pipeline.operations) == 3


def test_supernode_pipeline():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_with_supernode.json")

    pipeline = PipelineParser().parse(pipeline_json)

    assert len(pipeline.operations) == 4

    # Confirm structure of pipeline:
    # Two execution nodes feed their outputs to super-node with one execution_node.
    # Super-node's execution node, then sends its output to external execution node.
    # 4 nodes total.  Super-node execution node should have two parent-operations
    # pointing at first two nodes, and final node should have one parent pointing
    # at execution node WITHIN supernode.

    external_input_node_ids = ["db9f3f5b-b2e3-4824-aadd-c1c6bf652534", "f6584209-6f22-434f-9820-41327b6c749d"]
    supernode_excution_node_id = "079c0e12-eb5f-4fcc-983b-09e011869fee"
    external_node_id = "7628306d-2cc2-405c-94a1-fe42c95567a1"

    for node_id in pipeline.operations:
        # Validate operations list
        if node_id in external_input_node_ids:
            # These are input nodes, ensure parent_operation_ids are empty
            assert len(pipeline.operations[node_id].parent_operation_ids) == 0
            continue
        if node_id == supernode_excution_node_id:
            # Node within supernode, should have two parent_ops matching external_input_node_ids
            assert len(pipeline.operations[node_id].parent_operation_ids) == 2
            assert set(pipeline.operations[node_id].parent_operation_ids) == set(external_input_node_ids)
            continue
        if node_id == external_node_id:
            # Final external node, should have super_node embedded node as parent op.
            assert len(pipeline.operations[node_id].parent_operation_ids) == 1
            assert pipeline.operations[node_id].parent_operation_ids[0] == supernode_excution_node_id
            continue
        assert False, "Invalid node_id encountered in pipeline operations!"


def test_multiple_pipeline_definition():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/" "pipeline_multiple_pipeline_definitions.json")

    with pytest.raises(ValueError):
        PipelineParser().parse(pipeline_json)


def test_pipeline_operations_and_handle_artifact_file_details():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_3_node_sample.json")

    pipeline = PipelineParser().parse(pipeline_json)

    assert len(pipeline.operations) == 3

    for op in pipeline.operations.values():
        assert "." not in op.name


def test_pipeline_with_dependencies():
    pipeline_json = _read_pipeline_resource(
        "resources/sample_pipelines/" "pipeline_3_node_sample_with_dependencies.json"
    )

    pipeline = PipelineParser().parse(pipeline_json)

    assert len(pipeline.operations["acc4527d-7cc8-4c16-b520-5aa0f50a2e34"].parent_operation_ids) == 2


def test_pipeline_with_comments():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/" "pipeline_3_node_sample_with_comments.json")
    pipeline = PipelineParser().parse(pipeline_json)
    assert (
        pipeline.operations["d52ddfb4-dd0e-47ac-abc7-fa30bb95d45c"].doc
        == "Generate community stats and then aggregate them on an overview dashboard"
    )


def test_pipeline_global_attributes():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")

    pipeline = PipelineParser().parse(pipeline_json)

    assert pipeline.name == "{{name}}"
    assert pipeline.runtime == "{{runtime}}"
    assert pipeline.runtime_config == "{{runtime-config}}"


def test_missing_pipeline_name_should_default_to_untitled():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["app_data"]["properties"].pop("name")

    pipeline = PipelineParser().parse(pipeline_json)

    assert pipeline.name == "untitled"


def test_missing_pipeline_runtime():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["app_data"].pop("runtime")

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_json)

    assert "Invalid pipeline: Missing runtime." in str(e.value)


def test_missing_pipeline_runtime_configuration():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["app_data"].pop("runtime_config")
    # emulate what validation will do when there's no value for runtime_config...
    pipeline_json["pipelines"][0]["app_data"]["runtime"] = "local"

    pipeline = PipelineParser().parse(pipeline_json)
    assert pipeline.runtime == "local"
    assert pipeline.runtime_config is None


def test_missing_operation_id():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["nodes"][0].pop("id")

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_json)

    assert "Missing field 'operation id'" in str(e.value)


def test_missing_operation_type():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["nodes"][0].pop("type")

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_json)

    assert "Node type 'None' is invalid!" in str(e.value)


def test_invalid_node_type():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["nodes"][0]["type"] = "foo"

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_json)

    assert "Node type 'foo' is invalid!" in str(e.value)


def test_missing_operation_filename():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["nodes"][0]["app_data"]["component_parameters"].pop("filename")

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_json)

    assert "Missing field 'operation filename" in str(e.value)


def test_missing_operation_image():
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_valid.json")
    pipeline_json["pipelines"][0]["nodes"][0]["app_data"]["component_parameters"].pop("runtime_image")

    with pytest.raises(ValueError) as e:
        PipelineParser().parse(pipeline_json)

    assert "Missing field 'operation runtime image'" in str(e.value)


@pytest.mark.parametrize("catalog_instance", [AIRFLOW_TEST_OPERATOR_CATALOG], indirect=True)
def test_custom_component_parsed_properties(monkeypatch, catalog_instance):
    pipeline_json = _read_pipeline_resource("resources/sample_pipelines/pipeline_with_airflow_components.json")
    parsed_pipeline = PipelineParser().parse(pipeline_json)

    operation_id = "bb9473ca-12ec-0472-a36a-45bd2a1f6dc1"
    custom_op = parsed_pipeline.operations[operation_id]

    # Ensure this operation's component params does not include the empty mounted volumes list
    assert custom_op.elyra_props.get(MOUNTED_VOLUMES) == []

    operation_id = "bb9606ca-29ec-4133-a36a-67bd2a1f6dc3"
    custom_op = parsed_pipeline.operations[operation_id]

    # Ensure this operation's component params includes the value for the component-defined mounted volumes property
    assert custom_op.component_props_as_dict.get(MOUNTED_VOLUMES)["value"] == "a component-defined property"
    assert custom_op.elyra_props.get(MOUNTED_VOLUMES) is None
