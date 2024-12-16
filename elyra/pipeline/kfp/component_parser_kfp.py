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
from types import SimpleNamespace
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from jsonschema import validate
from jsonschema import ValidationError
import yaml

from elyra.pipeline.catalog_connector import CatalogEntry
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.kfp.kfp_component_utils import component_yaml_schema
from elyra.pipeline.properties import ComponentProperty
from elyra.pipeline.runtime_type import RuntimeProcessorType


class KfpComponentParser(ComponentParser):
    _file_types: List[str] = [".yaml"]

    component_platform: RuntimeProcessorType = RuntimeProcessorType.KUBEFLOW_PIPELINES

    def parse(self, catalog_entry: CatalogEntry) -> Optional[List[Component]]:
        # Get YAML object from component definition
        component_yaml = self._read_component_yaml(catalog_entry)
        if not component_yaml:
            return None

        # Assign component_id and description
        description = ""
        if component_yaml.get("description"):
            # Remove whitespace characters and replace with spaces
            description = " ".join(component_yaml.get("description").split())

        component_properties = self._parse_properties(component_yaml)

        component = catalog_entry.get_component(
            id=catalog_entry.id,
            name=component_yaml.get("name"),
            description=description,
            properties=component_properties,
            file_extension=self._file_types[0],
        )

        return [component]

    def _parse_properties(self, component_yaml: Dict[str, Any]) -> List[ComponentProperty]:
        properties: List[ComponentProperty] = []

        # NOTE: Currently no runtime-specific properties are needed
        # properties.extend(self.get_runtime_specific_properties())

        # Then loop through and create custom properties
        # Get parameter sub-dictionaries from YAML object

        input_params = component_yaml.get("inputs", [])
        output_params = component_yaml.get("outputs", [])

        all_params = {"input": input_params, "output": output_params}

        # Loop through inputs and outputs and create custom properties
        for param_type, params in all_params.items():
            for param in params:
                # KFP components default to being required unless otherwise stated.
                # Reference: https://www.kubeflow.org/docs/components/pipelines/reference/component-spec/#interface
                required = True
                if param.get("optional") is True:
                    required = False

                # Assign parsed data type (default to string)
                data_type_parsed = param.get("type", "String")

                # Define adjusted type as either inputPath or outputPath
                data_type_adjusted = data_type_parsed  # can be str, bool, int, etc. or inputPath or outputPath
                if self._is_path_based_parameter(param.get("name"), component_yaml):
                    data_type_adjusted = f"{param_type}Path"

                data_type_info = self.determine_type_information(data_type_adjusted)

                if data_type_info.undetermined:
                    self.log.debug(
                        f"Data type from parsed data ('{data_type_parsed}') could not be determined. "
                        f"Proceeding as if 'string' was detected."
                    )

                if not data_type_info.required:
                    required = data_type_info.required

                # Get value if provided, adjust any double quoted default values
                # to use single quotes to avoid json parsing errors
                value = param.get("default", "").replace('"', "'")

                # Set parameter ref (id) and display name
                ref_name = param.get("name").lower().replace(" ", "_")
                display_name = param.get("name")

                description = param.get("description") or ""

                if data_type_info.allowed_input_types != [None]:
                    # This is not an output; add parsed data type hint to description in parentheses
                    description = self._format_description(description=description, data_type=data_type_parsed)
                else:
                    ref_name = f"output_{ref_name}"

                component_props = ComponentProperty(
                    id=ref_name,
                    name=display_name,
                    json_data_type=data_type_info.json_data_type,
                    allowed_input_types=data_type_info.allowed_input_types,
                    value=(value or data_type_info.default_value),
                    description=description,
                    required=required,
                    parsed_data_type=data_type_parsed,
                )

                properties.append(component_props)

        return properties

    def _read_component_yaml(self, catalog_entry: CatalogEntry) -> Optional[Dict[str, Any]]:
        """
        Convert component_definition string to YAML object
        """
        try:
            results = yaml.safe_load(catalog_entry.entry_data.definition)
        except Exception as e:
            self.log.warning(
                f"Could not load YAML definition for component with identifying information: "
                f"'{catalog_entry.entry_reference}' -> {str(e)}"
            )
            return None

        try:
            # Validate against component YAML schema
            validate(instance=results, schema=component_yaml_schema)
            # If the component definition does not define a container command, log a warning.
            # See https://www.kubeflow.org/docs/components/pipelines/installation/choose-executor/#emissary-executor
            if results.get("implementation", {}).get("container", {}).get("command") is None:
                self.log.warning(
                    f"Component '{results['name']}' does not define a container command. "
                    "It might fail execution on Kubeflow Pipelines installations that are "
                    "configured to use Argo as workflow engine and emissary "
                    "executor as workflow executor."
                )
        except ValidationError as ve:
            self.log.warning(
                f"Invalid format of YAML definition for component with identifying information: "
                f"'{catalog_entry.entry_reference}' -> {str(ve)}"
            )
            return None

        return results

    def _is_path_based_parameter(self, parameter_name: str, component_body: Dict[str, Any]) -> bool:
        """
        Check whether parameter is a KFP path parameter (as opposed to a value parameter)

        :param parameter_name: the name of the parameter that will be checked
        :param component_body: the component YAML contents
        """
        # Get component_body['implementation']['container'] sub-dictionary if it exists
        component_impl = component_body.get("implementation", {}).get("container", {})

        # Get list of component commands/arguments
        commands_and_args = component_impl.get("command", []) + component_impl.get("args", [])

        # Loop through dictionary-types only; parameter-based fields will
        # always be of the format {'inputPath': 'parameter name'}
        for param_dict in [c for c in commands_and_args if isinstance(c, dict)]:
            # Check the (single-element) list of values for a
            # match on the full parameter name given
            if parameter_name in list(param_dict.values()):
                # Check whether the first (and only) key contains the
                # phrase "Path", e.g. inputPath or outputPath
                if "Path" in list(param_dict.keys())[0]:
                    return True
                # Otherwise, assume inputValue for this parameter name
                # and do not proceed to check other parameter dicts
                break

        return False

    def determine_type_information(self, parsed_type: str) -> SimpleNamespace:
        """
        Takes the type information of a component parameter as parsed from the component
        specification and returns a new type that is one of several standard options.
        """
        data_type_info = super().determine_type_information(parsed_type)

        # By default, original input type (determined by parent) is stored as the `json_data_type`
        # and then overridden with Kubeflow Pipeline's meta-type
        if data_type_info.undetermined:
            if "inputpath" in data_type_info.parsed_data:
                data_type_info.allowed_input_types = ["inputpath"]  # only allows path-based inputs
                data_type_info.undetermined = False
                data_type_info.default_value = None
            elif "outputpath" in data_type_info.parsed_data:
                data_type_info.allowed_input_types = [None]  # output parameters do not accept inputs
                data_type_info.undetermined = False

        return data_type_info
