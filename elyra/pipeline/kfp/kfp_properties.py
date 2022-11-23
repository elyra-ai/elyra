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
from __future__ import annotations

from keyword import iskeyword
from typing import Any
from typing import List
from typing import Optional

from elyra.pipeline.properties import ListItemPropertyAttribute
from elyra.pipeline.properties import PipelineParameter
from elyra.pipeline.properties import PropertyInputType


class KfpPropertyInputType(PropertyInputType):
    """
    An object representing a single allowed input type for a PropertyAttribute
    object for KUBEFLOW_PIPELINES runtime processors.
    """

    kfp_input_types = {
        "String": {"type_hint": "str", "json_type": "string", "default_value": ""},
        "Bool": {"type_hint": "bool", "json_type": "boolean", "default_value": False, "placeholder": " "},
        "Integer": {"type_hint": "int", "json_type": "integer"},
        "Float": {"type_hint": "float", "json_type": "number", "render_input_value": True},
        # "CustomString": {"json_type": "string", "type_title": "String with custom class name"}
        # "List": {"type_hint": "list", "json_type": "array", "default_value": []},  # not yet supported by frontend
        # "Dict": {"type_hint": "dict", "json_type": "object", "default_value": {}},  # not yet supported by frontend
    }

    def __init__(
        self,
        base_type: str,
        default_value: Optional[Any] = None,
        placeholder: Optional[Any] = None,
        enum: Optional[List[Any]] = None,
        **kwargs,
    ):
        super().__init__(
            base_type=base_type,
            default_value=default_value,
            placeholder=placeholder,
            enum=enum,
            allowed_input_types=self.kfp_input_types,
            **kwargs,
        )

        self.type_hint = kwargs.get("type_hint") or self.kfp_input_types[base_type].get("type_hint")
        self.component_input_type = kwargs.get("type_hint") or self.base_type


class KfpPipelineParameter(PipelineParameter):
    """An ElyraProperty representing a single pipeline parameter for the Kubeflow Pipelines runtime"""

    property_id = "KFP_PIPELINE_PARAMETERS"
    property_attributes = [
        ListItemPropertyAttribute(
            attribute_id="name",
            display_name="Parameter Name",
            allowed_input_types=[PropertyInputType(base_type="str", placeholder="param_1")],
            hidden=False,
            required=True,
            use_in_key=True,
        ),
        ListItemPropertyAttribute(
            attribute_id="default_value",
            display_name="Default Value",
            allowed_input_types=[
                KfpPropertyInputType(base_type="String", placeholder="default_val"),
                KfpPropertyInputType(base_type="Integer"),
                KfpPropertyInputType(base_type="Float"),
                KfpPropertyInputType(base_type="Bool"),
            ],
            hidden=False,
            required=False,
            use_in_key=False,
        ),
        ListItemPropertyAttribute(
            attribute_id="value",
            display_name="Value",
            allowed_input_types=[
                KfpPropertyInputType(base_type="String"),
                KfpPropertyInputType(base_type="Integer"),
                KfpPropertyInputType(base_type="Float"),
                KfpPropertyInputType(base_type="Bool"),
            ],
            hidden=True,
            required=False,
            use_in_key=False,
        ),
        ListItemPropertyAttribute(
            attribute_id="required",
            display_name="Required",
            allowed_input_types=[PropertyInputType(base_type="bool", placeholder=" ")],
            hidden=False,
            required=True,
            use_in_key=False,
        ),
    ]

    def __init__(self, name, value, default_value, required, **kwargs):
        super().__init__(name=name, value=value, default_value=default_value, required=required)
        user_selected_type = default_value.get("type")  # TODO or value.get("type") - depends on pipeline JSON

        kwargs = {}
        # if user_selected_type == "CustomString":
        #    kwargs["type_hint"] = "..."  # TODO grab custom type name entered by user

        self.input_type = KfpPropertyInputType(base_type=user_selected_type, **kwargs)
        # TODO Coerce number types to ints and floats if needed

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not self.name:
            validation_errors.append("Required parameter name was not specified.")
        elif not self.name.isidentifier():
            # param name is not a valid python variable name
            validation_errors.append(
                f"'{self.name}' is not a valid parameter name: name must be a Python variable name."
            )
        elif iskeyword(self.name):
            # param name collides with a python keyword (e.g. class, def, etc.)
            validation_errors.append(f"'{self.name}' is not a valid parameter name: name cannot be a Python keyword.")

        # If 'required' is True, a value must be provided
        if self.required and self.value is None or self.value == "":
            validation_errors.append("Parameter is marked as required but no value has been assigned.")
        return validation_errors
