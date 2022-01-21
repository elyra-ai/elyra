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


CONTROL_ID = 'OneOfControl'
DEFAULT_DATA_TYPE = str.__name__
DEFAULT_REQUIRED = True
DEFAULT_VALUE = None
DEFAULT_DESCRIPTION = ''


class AirflowComponentParser(ComponentParser):
    _file_types: List[str] = [".py"]

    component_platform: RuntimeProcessorType = RuntimeProcessorType.APACHE_AIRFLOW

    def parse(self, registry_entry: SimpleNamespace) -> Optional[List[Component]]:
        components: List[Component] = list()

        component_definition = registry_entry.component_definition
        if not component_definition:
            return None

        # Parse the component definition for all defined Operator classes
        parsed_class_nodes = self._parse_all_classes(component_definition)
        num_operator_classes = len(parsed_class_nodes)

        for operator_class in parsed_class_nodes:
            # Assign name and unique id
            component_class = operator_class.name
            component_id = registry_entry.component_id
            if num_operator_classes > 1:
                # This file contains more than one operator and id must be adjusted
                # to include the Operator class name as well
                component_id += f":{component_class}"

            # Get subset of component definition for this Operator class
            component_content = self._get_content_for_class(operator_class, component_definition)

            # Get the properties for this Operator class
            component_properties: List[ComponentParameter] = \
                self._parse_properties_for_class(operator_class, component_content)

            new_component = Component(
                id=component_id,
                name=component_class,
                description=DEFAULT_DESCRIPTION,
                catalog_type=registry_entry.catalog_type,
                source_identifier=registry_entry.component_identifier,
                definition=component_content,
                runtime_type=self.component_platform.name,
                categories=registry_entry.categories,
                properties=component_properties
            )

            components.append(new_component)

        return components

    def _parse_all_classes(self, file_contents: str) -> List[ast.ClassDef]:
        """
        Parses the contents of the file to retrieve ast.ClassDef objects,
        then filters the objects to only include Operator classes
        """
        parsed_content = ast.parse(file_contents)
        ast_classes = [
            node for node in parsed_content.body if isinstance(node, ast.ClassDef)
        ]

        # Only used to satisfy the temporary workaround mentioned in _filter_operator_classes
        ast_imports = [
            node for node in parsed_content.body if isinstance(node, ast.ImportFrom)
        ]
        import_module_names = [module.name for import_module in ast_imports for module in import_module.names]

        # Filter the list of classes to only include confirmed Operator classes
        operator_classes = self._filter_operator_classes(ast_classes, import_module_names)
        return operator_classes

    def _filter_operator_classes(self,
                                 class_def_nodes: List[ast.ClassDef],
                                 import_module_names: List[str]) -> List[ast.ClassDef]:
        """
        Analyze each ast.ClassDef object to determine whether it directly or indirectly
        extends the BaseOperator.

        :param class_def_nodes: a list of all ast.ClassDef objects in a file
        :param import_module_names: a list of all ast.ImportFrom objects in a file (only used to satisfy
                                    the temporary workaround called out below)

        :returns: a filtered list of ast.ClassDef objects that can be considered 'Operators'
        """
        operator_classes = []
        classes_to_analyze = []

        # Determine whether each class directly extends the BaseOperator or whether it
        # must be further analyzed for indirect extension
        for node in class_def_nodes:
            if len(node.bases) == 0:
                # Class does not extend other classes; do not add to Operator list
                continue
            if any(base.id == 'BaseOperator' for base in node.bases):
                # At least one base class is the 'BaseOperator', and this class can
                # therefore be considered an Operator itself
                operator_classes.append(node)
                continue
            # This class doesn't directly extend the BaseOperator and must be further
            # analyzed to determine indirect extension
            classes_to_analyze.append(node)

        # Identify classes that indirectly extend the BaseOperator from Operator classes
        # defined in the same file
        analysis_incomplete = len(classes_to_analyze) != 0
        while analysis_incomplete:
            analysis_incomplete = False
            for node in classes_to_analyze:
                for base in node.bases:
                    if base.id in [op_class.name for op_class in operator_classes]:
                        # This class directly extends a confirmed Operator class
                        operator_classes.append(node)
                        classes_to_analyze.remove(node)

                        # The classes still present in classes_to_analyze must be
                        # re-analyzed with the addition of the new Operator class
                        analysis_incomplete = True
                        continue

        # Identify classes that indirectly extend the BaseOperator from Operator classes
        # that are defined in other files
        # TODO (the below is a temporarily workaround)
        for node in classes_to_analyze:
            for base_class in node.bases:
                base_class_name = base_class.id
                if base_class_name.endswith('Operator') and base_class_name in import_module_names:
                    operator_classes.append(node)
                    continue

        return operator_classes

    def _get_content_for_class(self, operator_def: ast.ClassDef, component_definition: str) -> str:
        """
        Returns the portion of the definition file that corresponds to the given Operator class
        """
        # Convert component definition to list of lines
        component_def_as_lines = component_definition.split('\n')

        # Get subset of lines belonging to given operator class
        class_def_as_lines = component_def_as_lines[operator_def.lineno:operator_def.end_lineno]

        # Return as string
        return '\n'.join(class_def_as_lines)

    def _get_arg_default_on_line(self, line_no: int, arg_defaults: List[ast.Constant]) -> Optional[ast.Constant]:
        """
        Returns the ast.Constant that corresponds to an argument default object iff that default
        object is the only one that exists on the given line number.

        :param line_no: the line number of an ast.arg object against which a default may
                        be matched
        :param arg_defaults: a list of argument default ast.Constant objects

        :returns: the ast.Constant default on the given line (if there is a 1:1 relationship
                  between the default object and the line)
        """
        line_matches = [default for default in arg_defaults if default and default.lineno == line_no]
        if len(line_matches) == 1:
            # There is only one possible default match for the given line number
            return line_matches[0]

        # There is no default object for the argument specified on this line number
        return None

    def _get_arg_data_types(self, args: List[ast.arg], defaults: List[ast.Constant]) -> List[str]:
        """
        TODO
        """
        arg_data_types = []
        for arg in args:
            arg_data_type = DEFAULT_DATA_TYPE
            arg_default = self._get_arg_default_on_line(arg.lineno, defaults)
            if arg_default:
                if hasattr(arg_default, 'value') and arg_default.value is not None:
                    arg_data_type = type(arg_default.value).__name__
                elif hasattr(arg.annotation, 'slice') and hasattr(arg.annotation.slice, 'id'):
                    arg_data_type = arg.annotation.slice.id
            arg_data_types.append(arg_data_type)

        return arg_data_types

    def _get_default_values(self, args: List[ast.arg], defaults: List[ast.Constant]) -> List[Any]:
        """

        """
        default_values = []
        for arg in args:
            value = DEFAULT_VALUE  # TODO is this ok to be None??
            default = self._get_arg_default_on_line(arg.lineno, defaults)
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

    def _multiple_arguments_per_line(self, args: List[ast.arg]) -> bool:
        """

        """
        linenos = [arg.lineno for arg in args]
        if {line for line in linenos if linenos.count(line) > 1}:
            return True
        return False

    def _parse_parameter_description(self, parameter_name: str, class_definition: str) -> str:
        """
        Parse for parameter description in class docstring (':param [arg_name]:')

        :returns: the description as parsed, if found, or an empty string
        """
        param_regex = re.compile(f":param {parameter_name}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.))")
        match = param_regex.search(class_definition)
        description = DEFAULT_DESCRIPTION
        if match:
            # Remove quotation marks and newline characters
            description = match.group(1).strip().replace("\"", "'").replace("\n", " ")
        return description

    def _parse_parameter_data_type(self, parameter_name: str, class_definition: str) -> str:
        """
        Parse for parameter data type in class docstring (':type [arg_name]:')

        :returns: the data type as parsed, if found, or an empty string
        """
        type_regex = re.compile(f":type {parameter_name}:" + r"([\s\S]*?(?=:type|:param|\"\"\"|'''|\.\.|\n))")
        match = type_regex.search(class_definition)
        parsed_data_type = match.group(1).strip() if match else DEFAULT_DATA_TYPE
        return parsed_data_type

    def _get_init_arguments_for_operator(self, operator_class: ast.ClassDef) -> Optional[zip]:
        """
        Retrieve the init arguments and related information (data types, default values, and
        whether or not they are required) for an Operator class.

        :returns: TODO
        """
        for body_item in operator_class.body:
            if isinstance(body_item, ast.FunctionDef) and "init" in body_item.name:
                init_arg_node = body_item.args

                # Retrieve positional arguments (not including 'self') and any default values
                args: List[ast.arg] = [argument for argument in init_arg_node.args if argument.arg != 'self']
                arg_defaults: List[Optional[ast.Constant]] = init_arg_node.defaults
                if body_item.args.kwonlyargs:
                    # Extend the argument list to include keyword-only arguments and default values
                    args.extend(init_arg_node.kwonlyargs)
                    arg_defaults.extend(init_arg_node.kw_defaults)

                # Check for case where arguments must be parsed manually (i.e. without AST objects)
                if self._multiple_arguments_per_line(args):
                    # TODO properly handle this case?
                    self.log.warning(f"Error parsing operator class '{operator_class.name}': "
                                     f"arguments to __init__ must each be on their own line")
                    return None

                # Gather pertinent information about each argument including its name, data type,
                # default value, and whether or not it's required
                arg_names = [argument.arg for argument in args]
                data_types = self._get_arg_data_types(args, arg_defaults)
                default_values = self._get_default_values(args, arg_defaults)
                required_flags = self._get_required_flags(args)

                if len(arg_names) != len(data_types) != len(default_values) != len(required_flags):
                    raise RuntimeError

                return zip(arg_names, data_types, default_values, required_flags)

        return None

    def _parse_properties_for_class(self,
                                    operator_class: ast.ClassDef,
                                    class_definition: str) -> List[ComponentParameter]:
        """
        Parse a single operator class to create a list of ComponentParameter objects.
        """
        # NOTE: Currently no runtime-specific properties are needed, including runtime image. See
        # justification here: https://github.com/elyra-ai/elyra/issues/1912#issuecomment-879424452
        # properties.extend(self.get_runtime_specific_properties())

        properties = []
        zipped_args = self._get_init_arguments_for_operator(operator_class)
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

            # Create Dict of control ids that this property can use
            default_control_type = data_type_info.control_id
            one_of_control_types = [
                (default_control_type, data_type_info.data_type, ControllerMap[default_control_type].value),
                ("NestedEnumControl", "inputpath", ControllerMap["NestedEnumControl"].value)
            ]

            component_param = ComponentParameter(
                id=arg_name,
                name=arg_name,
                data_type=data_type_info.data_type,
                value=(value or data_type_info.default_value),
                description=description,
                default_control_type=default_control_type,
                control_id=CONTROL_ID,
                one_of_control_types=one_of_control_types,
                allow_no_options=True,
                required=required
            )
            properties.append(component_param)

        return properties

    def get_runtime_specific_properties(self) -> List[ComponentParameter]:
        """
        Define properties that are common to the Airflow runtime.
        """

        # TODO add args and kwargs as rts-properties here
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
