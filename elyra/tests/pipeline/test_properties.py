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

from elyra.pipeline.properties import PipelineParameter

# ---------------------------------------------------
# Tests for PipelineParameter
# ---------------------------------------------------


def test_pipelineparameter_constructor():
    """
    Verify that the PipelineParameter constructor behaves as expected
    """

    # Test behavior when value and default is empty string or None AND no custom
    # value is provided. Expected: value and default value are always returned as None
    parm_name = "parm1"
    parm_description = "parm1 description"
    for parm_required in [True, False]:
        for parm_value in ["", None]:
            for parm_default_type in ["String", "Integer", "Float", "Bool"]:
                for parm_default_value in ["", None]:
                    default_value = {"type": parm_default_type, "value": parm_default_value}
                    pp = PipelineParameter(parm_name, parm_description, parm_value, default_value, parm_required)
                    assert pp.name == parm_name
                    assert pp.description == parm_description
                    assert pp.value is None
                    assert pp.default_value is None
                    assert pp.required == parm_required

    # Test behavior when default value is empty string or None AND a custom value is provided.
    # Expected: custom value is used.
    parm_name = "parm2"
    parm_description = "parm2 description"
    for parm_required in [True, False]:
        for parm_default_value in ["", None]:
            # Test 'String' parameter type
            parm_value = "a string parameter value"
            default_value = {"type": "String", "value": parm_default_value}
            pp = PipelineParameter(parm_name, parm_description, parm_value, default_value, parm_required)
            assert pp.name == parm_name
            assert pp.description == parm_description
            assert pp.value == parm_value
            assert pp.default_value is None
            assert pp.required == parm_required
            # Test 'Integer' parameter type
            for parm_value in [0, 42]:
                default_value = {"type": "Integer", "value": parm_default_value}
                pp = PipelineParameter(parm_name, parm_description, parm_value, default_value, parm_required)
                assert pp.name == parm_name
                assert pp.description == parm_description
                assert pp.value == parm_value
                assert pp.default_value is None
                assert pp.required == parm_required
            # Test 'Float' parameter type
            for parm_value in [0, 3.14]:
                default_value = {"type": "Float", "value": parm_default_value}
                pp = PipelineParameter(parm_name, parm_description, parm_value, default_value, parm_required)
                assert pp.name == parm_name
                assert pp.description == parm_description
                assert pp.value == parm_value
                assert pp.default_value is None
                assert pp.required == parm_required
            # Test 'Bool' parameter type
            for parm_value in [True, False]:
                default_value = {"type": "Bool", "value": parm_default_value}
                pp = PipelineParameter(parm_name, parm_description, parm_value, default_value, parm_required)
                assert pp.name == parm_name
                assert pp.description == parm_description
                assert pp.value == parm_value
                assert pp.default_value is None
                assert pp.required == parm_required
