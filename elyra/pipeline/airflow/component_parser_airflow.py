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
import ast
import re
from types import SimpleNamespace
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParameter
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component import ControllerMap
from elyra.pipeline.runtime_type import RuntimeProcessorType


DEFAULT_DATA_TYPE = str.__name__
DEFAULT_REQUIRED = True
DEFAULT_VALUE = None


class AirflowComponentParser(ComponentParser):
    _file_types: List[str] = [".py"]

    component_platform: RuntimeProcessorType = RuntimeProcessorType.APACHE_AIRFLOW

    def parse(self, registry_entry: SimpleNamespace) -> Optional[List[Component]]:
        components: List[Component] = list()

        component_definition = registry_entry.component_definition
        if not component_definition:
            return None

        # Parse the component definition for all defined classes
        parsed_class_defs = self._parse_all_classes(component_definition)

        # for component_class, component_content in component_classes.items():
        for parsed_class in parsed_class_defs:
            component_class = parsed_class.name
            component_content = self._get_content_for_class(parsed_class, component_definition)

            # Create a Component object for each class
            # component_properties = self._parse_properties(component_content)
            component_properties = self._parse_properties_for_class(parsed_class, component_content)

            component_id = registry_entry.component_id
            # If this file contains more than one operator, adjust name to avoid
            # overwriting components with same id
            if len(parsed_class_defs) > 1:
                component_id += f":{component_class}"

            new_component = Component(
                id=component_id,
                name=component_class,
                description='',
                catalog_type=registry_entry.catalog_type,
                source_identifier=registry_entry.component_identifier,
                definition=component_content,
                runtime_type=self.component_platform.name,
                categories=registry_entry.categories,
                properties=component_properties
            )

            components.append(new_component)

        return components

    def _parse_all_classes(self, component_definition: str) -> List[ast.ClassDef]:
        parsed_content = ast.parse(component_definition)

        class_defs = []
        import_defs = []
        for body_element in parsed_content.body:
            if isinstance(body_element, ast.ClassDef):
                class_defs.append(body_element)
            elif isinstance(body_element, (ast.Import, ast.ImportFrom)):
                import_defs.append(body_element)

        class_names = [class_def.name for class_def in class_defs]
        import_names = [import_name.name for import_def in import_defs for import_name in import_def.names]
        for class_def in class_defs:
            remove_class = True
            for base_class in class_def.bases:
                base_class_name = base_class.id
                if (
                    base_class_name == 'BaseOperator' or
                    base_class_name in class_names or
                    (base_class_name.endswith('Operator') and base_class_name in import_names)
                ):
                    remove_class = False

            if remove_class:
                class_defs.remove(class_def)

        return class_defs

    def _get_content_for_class(self, class_def: ast.ClassDef, component_definition: str) -> str:
        component_def_as_lines = component_definition.split('\n')
        class_def_as_lines = component_def_as_lines[class_def.lineno:class_def.end_lineno]
        return '\n'.join(class_def_as_lines)

    def _get_default_on_line(self, lineno: int, defaults: List[ast.Constant]) -> Optional[ast.Constant]:
        if any(default.lineno == lineno for default in defaults):
            # There will hopefully only be one match
            line_matches = [default for default in defaults if default.lineno == lineno]
            if len(line_matches) == 1:
                return [default for default in defaults if default.lineno == lineno][0]
        return None

    def _get_arg_data_types(self, args: List[ast.arg], defaults: List[ast.Constant]) -> List[Any]:
        """
        TODO
        """
        arg_data_types = []
        for arg in args:
            arg_data_type = DEFAULT_DATA_TYPE
            default = self._get_default_on_line(arg.lineno, defaults)
            if default:
                if hasattr(default, 'value') and default.value is not None:
                    arg_data_type = type(default.value).__name__
                elif hasattr(arg.annotation, 'slice') and hasattr(arg.annotation.slice, 'id'):
                    arg_data_type = arg.annotation.slice.id
            arg_data_types.append(arg_data_type)

        return arg_data_types

    def _get_default_values(self, args: List[ast.arg], defaults: List[ast.Constant]) -> List[Any]:
        default_values = []
        for arg in args:
            value = DEFAULT_VALUE  # TODO is this ok to be None??
            default = self._get_default_on_line(arg.lineno, defaults)
            if default and hasattr(default, 'value'):
                value = default.value
                if isinstance(default.value, str):
                    value = value.strip().replace("\n", "")

            default_values.append(value)

        return default_values

    def _get_required_flags(self, args: List[ast.arg]) -> List[bool]:
        required_flags = []
        for arg in args:
            required = DEFAULT_REQUIRED
            if (
                hasattr(arg.annotation, 'value')
                and hasattr(arg.annotation.value, 'id')
                and arg.annotation.value.id == 'Optional'
            ):
                required = False
            required_flags.append(required)

        return required_flags

    def _parse_parameter_description(self, parameter_name: str, class_definition: str) -> str:
        # Search for parameter description in class docstring (':param [arg_name]:')
        param_regex = re.compile(f":param {parameter_name}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.))")
        match = param_regex.search(class_definition)
        parsed_description = match.group(1).strip().replace("\"", "'").replace("\n", "") if match else ""
        return parsed_description

    def _parse_parameter_data_type(self, parameter_name: str, class_definition: str) -> str:
        # Search for parameter data type in class docstring (':type [arg_name]:')
        type_regex = re.compile(f":type {parameter_name}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.|\n))")
        match = type_regex.search(class_definition)
        parsed_data_type = match.group(1).strip() if match else ""
        return parsed_data_type

    def _get_init_arguments_for_operator(self, class_def: ast.ClassDef) -> Optional[zip]:
        for body_item in class_def.body:
            if isinstance(body_item, ast.FunctionDef) and "init" in body_item.name:
                # TODO make sure this is how this will work for args vs kwonlyargs, etc. and add comment
                args = [arg for arg in body_item.args.args if arg.arg != 'self']
                defaults = body_item.args.defaults
                if body_item.args.kwonlyargs:
                    args = body_item.args.kwonlyargs
                    defaults = body_item.args.kw_defaults

                # TODO Handle case where arguments are all placed on separate lines??

                # Gather pertinent information about each argument including its name, data type,
                # default value, and whether or not it's required
                arg_names = [arg.arg for arg in args if arg.arg != 'self']
                data_types = self._get_arg_data_types(args, defaults)
                default_values = self._get_default_values(args, defaults)
                required_flags = self._get_required_flags(args)

                return zip(arg_names, data_types, default_values, required_flags)

        return None

    def _parse_properties_for_class(self, ast_class_def: ast.ClassDef, class_definition: str):
        # NOTE: Currently no runtime-specific properties are needed, including runtime image. See
        # justification here: https://github.com/elyra-ai/elyra/issues/1912#issuecomment-879424452
        # properties.extend(self.get_runtime_specific_properties())

        properties = []
        zipped_args = self._get_init_arguments_for_operator(ast_class_def)

        # Override control id since all input properties can take in an xcom
        control_id = "OneOfControl"

        for arg_name, data_type_ast, value, required in zipped_args:
            description = self._parse_parameter_description(arg_name, class_definition)
            data_type_parsed = self._parse_parameter_data_type(arg_name, class_definition)

            # Amend description to include type information as parsed, if available.
            # Otherwise, include the type information determined from AST parse
            description = self._format_description(
                description=description,
                data_type=(data_type_parsed or data_type_ast)
            )

            # Standardize data type information
            data_type_info = self.determine_type_information(data_type_ast)  # TODO use parsed type or AST type?
            if data_type_info.undetermined:
                self.log.debug(f"Data type from parsed data ('{data_type_ast}') could not be determined. "
                               f"Proceeding as if '{data_type_info.data_type}' was detected.")
            elif 'xcom' in arg_name.lower() and data_type_info.data_type == 'boolean':
                # Override a default of False for xcom push
                data_type_info.default_value = True

            # Set the default control type
            default_control_type = data_type_info.control_id

            # Create Dict of control ids that this property can use
            one_of_control_types = [
                (default_control_type, data_type_info.data_type, ControllerMap[default_control_type].value),
                ("NestedEnumControl", "inputpath", ControllerMap["NestedEnumControl"].value)
            ]

            component_params = ComponentParameter(
                id=arg_name,
                name=arg_name,
                data_type=data_type_info.data_type,
                value=(value or data_type_info.default_value),
                description=description,
                default_control_type=default_control_type,
                control_id=control_id,
                one_of_control_types=one_of_control_types,
                allow_no_options=True,
                required=required
            )
            properties.append(component_params)

        return properties

    def get_runtime_specific_properties(self) -> List[ComponentParameter]:
        """
        Define properties that are common to the Airflow runtime.
        """
        return [
            ComponentParameter(
                id="runtime_image",
                name="Runtime Image",
                data_type="string",
                value="",
                description="Container image used as execution environment.",
                control="custom",
                control_id="EnumControl",
                required=True,
            )
        ]
