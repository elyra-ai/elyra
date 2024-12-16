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
import ast
import re
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from elyra.pipeline.catalog_connector import CatalogEntry
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.properties import ComponentProperty
from elyra.pipeline.runtime_type import RuntimeProcessorType

CONTROL_ID = "OneOfControl"
DEFAULT_DATA_TYPE = "str"
DEFAULT_REQUIRED = True
DEFAULT_VALUE = None
DEFAULT_DESCRIPTION = ""


class AirflowComponentParser(ComponentParser):
    _file_types: List[str] = [".py"]

    component_platform: RuntimeProcessorType = RuntimeProcessorType.APACHE_AIRFLOW

    def parse(self, catalog_entry: CatalogEntry) -> Optional[List[Component]]:
        components: List[Component] = []

        definition = catalog_entry.entry_data.definition
        if not definition:
            return None

        entry_reference = catalog_entry.entry_reference

        # Parse the component definition for all defined Operator classes
        try:
            parsed_class_nodes = self._parse_all_classes(definition)
            num_operator_classes = len(parsed_class_nodes)
        except Exception as e:
            self.log.error(
                f"Content associated with identifier '{entry_reference}' could not be parsed: {e}. Skipping..."
            )
            return None

        for component_class, content in parsed_class_nodes.items():
            if not content.get("init_function"):
                # Without the init function, class can't be parsed for properties
                self.log.warning(
                    f"Operator '{component_class}' associated with identifier '{entry_reference}' "
                    f"does not have an __init__ function. Skipping..."
                )
                continue

            # Assign component name and unique id
            component_id = catalog_entry.id
            if num_operator_classes > 1:
                # This file contains more than one operator and id must be adjusted
                # to include the Operator class name as well
                component_id += f":{component_class}"

            # Get the properties for this Operator class
            try:
                component_properties: List[ComponentProperty] = self._parse_properties_from_init(**content)
            except Exception as e:
                self.log.error(
                    f"Properties of operator '{component_class}' associated with identifier '{entry_reference}' "
                    f"could not be parsed: {e}. Skipping..."
                )
                continue

            component = catalog_entry.get_component(
                id=component_id,
                name=component_class,
                description=DEFAULT_DESCRIPTION,
                properties=component_properties,
                file_extension=self._file_types[0],
            )

            components.append(component)

        return components

    def _parse_all_classes(self, file_contents: str) -> Dict[str, Dict]:
        """
        Parses the contents of the file to retrieve ast.ClassDef objects,
        then filters the objects to only include Operator classes
        """
        parsed_content = ast.parse(file_contents)
        ast_classes = [node for node in parsed_content.body if isinstance(node, ast.ClassDef)]
        ast_imports = [node for node in parsed_content.body if isinstance(node, ast.ImportFrom)]

        # Filter the list of classes to only include confirmed Operator classes
        operator_classes = self._filter_operator_classes(ast_classes, ast_imports)

        return {
            operator.name: {
                "init_function": self._get_class_init_function_def(operator),
                "docstring": self._get_class_docstring(operator) or "",
            }
            for operator in operator_classes
        }

    def _filter_operator_classes(
        self, class_def_nodes: List[ast.ClassDef], import_from_nodes: List[ast.ImportFrom]
    ) -> List[ast.ClassDef]:
        """
        Analyze each ast.ClassDef object to determine whether it directly or indirectly
        extends the BaseOperator.

        :param class_def_nodes: a list of all ast.ClassDef objects in a file
        :param import_from_nodes: a list of all ast.ImportFrom objects in a file (only used to satisfy
                                  the temporary workaround called out below)

        :returns: a filtered list of ast.ClassDef objects that can be considered 'Operators'
        """
        operator_classes = []
        classes_to_analyze = []

        # Get class names for package imports that match one of the following patterns,
        # indicating that this class does match a known Operator class as defined in
        # a provider package or core Airflow package
        regex_patterns = [
            re.compile(r"airflow\.providers\.[a-zA-Z0-9_]+\.operators"),  # airflow.providers.*.operators (provider)
            re.compile(r"airflow\.operators\."),  # airflow.operators.* (core Airflow package)
        ]
        operator_bases = ["BaseOperator"]
        for module in import_from_nodes:
            if any(regex.match(module.module) for regex in regex_patterns):
                operator_bases.extend([name.name for name in module.names])

        # Determine whether each class directly extends the BaseOperator or whether it
        # must be further analyzed for indirect extension
        for node in class_def_nodes:
            if not hasattr(node, "bases") or len(node.bases) == 0:
                # Class does not extend other classes; do not add to Operator list
                continue
            if any(base.id in operator_bases for base in node.bases):
                # At least one base class either directly extends the BaseOperator or
                # indirectly extends it from an Operator class imported from another package
                operator_classes.append(node)
                continue
            # This class doesn't extend the BaseOperator directly or from an imported module
            # and must be further analyzed to determine indirect extension
            classes_to_analyze.append(node)

        # Identify classes that indirectly extend the BaseOperator from Operator classes
        # defined in the same file
        analysis_incomplete = len(classes_to_analyze) != 0
        while analysis_incomplete:
            analysis_incomplete = False
            for node in classes_to_analyze:
                if any(base.id in [op_class.name for op_class in operator_classes] for base in node.bases):
                    # This class directly extends an Operator class defined in this file
                    operator_classes.append(node)
                    classes_to_analyze.remove(node)

                    # The classes still present in classes_to_analyze must be
                    # re-analyzed with the addition of the new Operator class
                    analysis_incomplete = True
                    break

        return operator_classes

    def _get_class_init_function_def(self, operator_class: ast.ClassDef) -> Optional[ast.FunctionDef]:
        """
        Get the ast.FunctionDef argument representing the init function for the given ClassDef
        """
        for body_item in operator_class.body:
            if isinstance(body_item, ast.FunctionDef) and "init" in body_item.name:
                return body_item
        return None

    def _get_class_docstring(self, operator_class: ast.ClassDef) -> Optional[str]:
        """
        Get the docstring for the given ClassDef object
        """
        for body_item in operator_class.body:
            if isinstance(body_item, ast.Expr):
                # ast.Expr objects value attributes are ast.Constant objects in Python 3.8+,
                # but are ast.Str objects in Python 3.7 and lower, and each store the string
                # value under different attributes ('value' or 's', respectively)
                if isinstance(body_item.value, ast.Constant):
                    return body_item.value.value.strip()
                elif isinstance(body_item.value, ast.Str):
                    return body_item.value.s.strip()
        return None

    def _parse_properties_from_init(self, init_function: ast.FunctionDef, docstring: str) -> List[ComponentProperty]:
        """
        Parse the init function and docstring of single operator class to create a list
        of ComponentProperty objects.
        """
        properties = []

        # NOTE: Currently no runtime-specific properties are needed, including runtime image. See
        # justification here: https://github.com/elyra-ai/elyra/issues/1912#issuecomment-879424452
        # properties.extend(self.get_runtime_specific_properties())

        init_arguments = self._get_init_arguments(init_function)
        for arg_name, arg_attributes in init_arguments.items():
            data_type_from_ast = arg_attributes.get("data_type")

            description = self._parse_from_docstring("param", arg_name, docstring, DEFAULT_DESCRIPTION)
            data_type_parsed = self._parse_from_docstring("type", arg_name, docstring)

            # Amend description to include type information as parsed, if available.
            # Otherwise, include the type information determined from the AST parse
            description = self._format_description(
                description=description, data_type=(data_type_parsed or data_type_from_ast)
            )

            # Standardize data type information
            data_type_info = self.determine_type_information(data_type_parsed or data_type_from_ast)
            if data_type_info.undetermined:
                self.log.debug(
                    f"Data type from parsed data ('{(data_type_parsed or data_type_from_ast)}') "
                    f"could not be determined. Proceeding as if "
                    f"'{data_type_info.json_data_type}' was detected."
                )
            elif "xcom" in arg_name.lower() and data_type_info.json_data_type == "boolean":
                # Override a default of False for xcom push
                data_type_info.default_value = True

            value = arg_attributes.get("default_value") or data_type_info.default_value
            if isinstance(value, str):
                # Escape quotation marks to avoid error during json.loads
                value = value.replace('"', '\\"').replace('"""', '\\"\\"\\"')

            component_param = ComponentProperty(
                id=arg_name,
                name=arg_name,
                json_data_type=data_type_info.json_data_type,
                allowed_input_types=data_type_info.allowed_input_types,
                value=value,
                description=description,
                required=arg_attributes.get("required"),
                allow_no_options=True,
            )
            properties.append(component_param)

        return properties

    def _get_init_arguments(self, init_function: ast.FunctionDef) -> Dict[str, Dict]:
        """
        Build a dictionary keyed by init argument names, with values corresponding
        to the information parsed in the AST including default values, data types,
        and whether a value for the argument is required or not.
        """
        # Retrieve positional arguments (not including 'self', 'args', and 'kwargs')
        # and any default values given
        args_to_skip = ["self", "*", "*args", "**kwargs"]
        args = [argument for argument in init_function.args.args if argument.arg not in args_to_skip]
        arg_defaults = init_function.args.defaults

        len_diff = len(args) - len(arg_defaults)
        if len_diff:
            # Pad arg_defaults array with 'None' to match the length of the arg array
            for _ in range(len_diff):
                # Values are prepended to this array, since in Python arguments that
                # specify default values must come after arguments that do not
                arg_defaults.insert(0, DEFAULT_VALUE)

        if init_function.args.kwonlyargs:
            # Extend the argument list to include keyword-only arguments and default values
            args.extend(init_function.args.kwonlyargs)
            arg_defaults.extend(init_function.args.kw_defaults)  # No need to pad: None is always the default

        # Assemble dictionary of arguments and their associated attributes
        init_arg_dict = {}
        for arg, default in zip(args, arg_defaults):
            arg_name = arg.arg

            required = DEFAULT_REQUIRED
            # Set default value for attribute in question: note that arg.default
            # object attributes are ast.Constant objects (or None) in Python 3.8+,
            # but are ast.NameConstants or ast.Str/ast.Num objects (or None) in Python 3.7
            # and lower. ast.Constant and ast.NameConstant store the value of interest
            # here in the 'value' attribute
            default_value = getattr(default, "value", DEFAULT_VALUE)
            if default is not None:
                if isinstance(default, ast.Str):
                    # The value of interest in this case is accessed by the 's' attribute
                    default_value = default.s
                elif isinstance(default, ast.Num):
                    # The value of interest in this case is accessed by the 'n' attribute
                    default_value = default.n
                if isinstance(default, ast.Attribute):
                    if hasattr(default.value, "id") and hasattr(default, "attr"):
                        # The value of interest in accessed by the 'attr' attribute and value 'id' attribute
                        default_value = f"{default.value.id}.{default.attr}"
                    else:
                        default_value = ""

                # If a default value is provided in the argument list, the processor
                # can use this value if the user doesn't supply their own
                required = False

                if isinstance(default_value, str):
                    # Standardize default string values to remove newline characters
                    default_value = default_value.strip().replace("\n", " ")

            # Get data type directly from default value
            data_type = type(default_value).__name__
            if data_type == "NoneType":
                # Get data from type hint if available
                data_type = DEFAULT_DATA_TYPE
                if isinstance(arg.annotation, ast.Name):
                    # arg is of the form `<arg>: <single-valued_type>`
                    # e.g. `env: str` or `env: bool`
                    data_type = arg.annotation.id

                elif isinstance(arg.annotation, ast.Subscript):
                    # arg is more complex
                    if isinstance(arg.annotation.slice, ast.Name) and isinstance(arg.annotation.value, ast.Name):
                        if arg.annotation.value.id == "Optional":
                            # arg is of the form `<arg>: Optional[<single-valued_type>]`
                            # e.g. `env: Optional[str]` or `env: Optional[int]`
                            data_type = arg.annotation.slice.id
                        else:
                            # arg is of the form `<arg>: <multi-valued_type>[<single-valued_type>]`
                            # e.g. `env: List[str]` or `env: List[int]`
                            data_type = arg.annotation.value.id

                    elif (
                        isinstance(arg.annotation.slice, (ast.Tuple, ast.Index))
                        and isinstance(arg.annotation.value, ast.Name)
                        and arg.annotation.value.id != "Optional"
                    ):
                        # arg is of the form `<arg>: <multi-valued_type>`
                        # e.g. `env: Dict[str, str]` or `env: List[bool]`
                        # (arg.annotation.slice is of type ast.Tuple in
                        # python 3.8+ and ast.Index in python 3.7 and lower)
                        data_type = arg.annotation.value.id

                    elif isinstance(arg.annotation.slice, ast.Subscript) and isinstance(
                        arg.annotation.slice.value, ast.Name
                    ):
                        # arg is of the form `<arg>: Optional[<multi-valued_type>]`
                        # e.g. `env = Optional[Dict[str, str]]` or `env = Optional[List[int]]`
                        # In Python 3.8+
                        data_type = arg.annotation.slice.value.id

                    elif (
                        isinstance(arg.annotation.slice, ast.Index)
                        and isinstance(arg.annotation.slice.value, ast.Subscript)
                        and isinstance(arg.annotation.slice.value.value, ast.Name)
                    ):
                        # arg is of the form `<arg>: Optional[<multi-valued_type>]`
                        # [<multi-valued_type> or `env = Optional[List[int]]`
                        # In Python 3.7 and lower
                        data_type = arg.annotation.slice.value.value.id

                    if isinstance(arg.annotation.value, ast.Name) and arg.annotation.value.id == "Optional":
                        # arg typehint includes the phrase 'Optional'
                        required = False

                elif isinstance(arg.annotation, ast.BinOp):
                    if (
                        isinstance(arg.annotation.left, ast.Subscript)
                        and isinstance(arg.annotation.left.value, ast.Name)
                        and isinstance(arg.annotation.left.value.id, str)
                    ):
                        # arg is of the form `<arg>: [<type>] | [<other_type>]`
                        # e.g. `env = dict[str, str] | None`
                        data_type = arg.annotation.left.value.id

                    if isinstance(arg.annotation.right, ast.Constant) and arg.annotation.right.value is None:
                        # arg typehint includes None, making it optional
                        required = False

            # Insert AST-parsed (or default) values into dictionary
            init_arg_dict[arg_name] = {"data_type": data_type, "default_value": default_value, "required": required}

        return init_arg_dict

    def _parse_from_docstring(self, phrase: str, param: str, class_def: str, default: Any = None) -> Optional[str]:
        """
        Parse for a phrase in class docstring (e.g., ':type [arg_name]:')

        :returns: the phrase match, if found, otherwise returns the default type
        """
        regex = re.compile(f":{phrase} {param}:" + r"([\s\S]*?(?=:type|:param|\.\.|\n\s*\n|$))")
        match = regex.search(class_def)
        if match:
            # Remove quotation marks and newline characters in preparation for eventual json.loads()
            return match.group(1).strip().replace('"', "'").replace("\n", " ").replace("\t", " ")
        return default

    def _get_content_between_lines(self, start_line: int, end_line: int, content: str) -> str:
        """
        Returns the portion of a file between the given line numbers
        """
        # Convert component definition to list of lines
        component_def_as_lines = content.split("\n")

        # Get subset of lines belonging to given operator class
        content_as_lines = component_def_as_lines[start_line:end_line]

        # Return as string
        return "\n".join(content_as_lines)
