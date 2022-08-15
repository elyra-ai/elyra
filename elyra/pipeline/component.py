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
from abc import abstractmethod
from dataclasses import dataclass
from enum import Enum
from importlib import import_module
import json
from logging import Logger
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from traitlets.config import LoggingConfigurable

# Rather than importing only the CatalogEntry class needed in the Component parse
# type hint below, the catalog_connector module must be imported in its
# entirety in order to avoid a circular reference issue
try:
    from elyra.pipeline import catalog_connector
except ImportError:
    import sys

    catalog_connector = sys.modules[__package__ + ".catalog_connector"]
from elyra.pipeline.runtime_type import RuntimeProcessorType


class ComponentParameter(object):
    """
    Represents a single property for a pipeline component
    """

    def __init__(
        self,
        id: str,
        name: str,
        json_data_type: str,
        value: Any,
        description: str,
        allowed_input_types: List[Optional[str]] = None,
        required: Optional[bool] = False,
        allow_no_options: Optional[bool] = False,
        items: Optional[List[str]] = None,
    ):
        """
        :param id: Unique identifier for a property
        :param name: The name of the property for display
        :param json_data_type: The JSON data type that represents this parameters value
        :param allowed_input_types: The input types that the property can accept, including those for custom rendering
        :param value: The default value of the property
        :param description: A description of the property for display
        :param items: For properties with a control of 'EnumControl', the items making up the enum
        :param required: Whether the property is required
        :param allow_no_options: Specifies whether to allow parent nodes that don't specifically
            define output properties to be selected as input to this node parameter
        """

        if not id:
            raise ValueError("Invalid component: Missing field 'id'.")
        if not name:
            raise ValueError("Invalid component: Missing field 'name'.")

        self._ref = id
        self._name = name
        self._json_data_type = json_data_type

        # The JSON type that the value entered for this property will be rendered in.
        # E.g., array types are entered by users and processed by the backend as
        # strings whereas boolean types are entered and processed as booleans
        self._value_entry_type = json_data_type
        if json_data_type in ["array", "object"]:
            self._value_entry_type = "string"

        if json_data_type == "boolean" and isinstance(value, str):
            value = bool(value in ["True", "true"])
        elif json_data_type == "number" and isinstance(value, str):
            try:
                # Attempt to coerce string to integer value
                value = int(value)
            except ValueError:
                # Value could not be coerced to integer, assume float
                value = float(value)
        if json_data_type in ["array", "object"] and not isinstance(value, str):
            value = str(value)
        self._value = value

        self._description = description

        if not allowed_input_types:
            allowed_input_types = ["inputvalue", "inputpath", "file"]
        self._allowed_input_types = allowed_input_types

        self._items = items or []

        # Check description for information about 'required' parameter
        if "not optional" in description.lower() or (
            "required" in description.lower()
            and "not required" not in description.lower()
            and "n't required" not in description.lower()
        ):
            required = True

        self._required = required
        self._allow_no_options = allow_no_options

    @property
    def ref(self) -> str:
        return self._ref

    @property
    def name(self) -> str:
        return self._name

    @property
    def allowed_input_types(self) -> List[Optional[str]]:
        return self._allowed_input_types

    @property
    def json_data_type(self) -> str:
        return self._json_data_type

    @property
    def value_entry_type(self) -> str:
        return self._value_entry_type

    @property
    def value(self) -> Any:
        return self._value

    @property
    def description(self) -> str:
        return self._description

    @property
    def items(self) -> List[str]:
        return self._items

    @property
    def required(self) -> bool:
        return bool(self._required)

    @property
    def allow_no_options(self) -> bool:
        return self._allow_no_options

    @staticmethod
    def render_parameter_details(param: "ComponentParameter") -> str:
        """
        Render the parameter data type and UI hints needed for the specified param for
        use in the custom component properties DAG template

        :returns: a string literal containing the JSON object to be rendered in the DAG
        """
        json_dict = {"title": param.name, "description": param.description}
        if len(param.allowed_input_types) == 1:
            # Parameter only accepts a single type of input
            input_type = param.allowed_input_types[0]
            if not input_type:
                # This is an output
                json_dict["type"] = "string"
                json_dict["uihints"] = {"ui:widget": "hidden", "outputpath": True}
            elif input_type == "inputpath":
                json_dict["uihints"] = {"inputpath": True}
            elif input_type == "file":
                json_dict["type"] = "string"
                json_dict["uihints"] = {"ui:widget": input_type}
            else:
                json_dict["type"] = param.value_entry_type

            if param.value:
                # Include a default value
                json_dict["default"] = param.value
        else:
            # Parameter accepts multiple types of inputs; render a oneOf block
            one_of = []
            for widget_type in param.allowed_input_types:
                value_obj = {}
                obj = {
                    "type": "object",
                    "properties": {"widget": {"type": "string"}},
                    "uihints": {"widget": {"ui:widget": "hidden"}},
                }
                if widget_type == "inputvalue":
                    obj["title"] = InputTypeDescriptionMap[param.value_entry_type].value
                    obj["properties"]["widget"]["default"] = param.value_entry_type
                    value_obj["type"] = param.value_entry_type
                    if param.value_entry_type == "boolean":
                        value_obj["title"] = " "

                    if param.value is not None:
                        value_obj["default"] = param.value
                else:  # inputpath or file types
                    obj["title"] = InputTypeDescriptionMap[widget_type].value
                    obj["properties"]["widget"]["default"] = widget_type
                    if widget_type == "outputpath":
                        # TODO will this ever be hit?
                        value_obj["type"] = "string"
                        obj["uihints"]["value"] = {"ui:readonly": "true", "outputpath": "true"}
                    elif widget_type == "inputpath":
                        value_obj["oneOf"] = []
                        obj["uihints"]["value"] = {"inputpath": "true"}
                        if param.allow_no_options:
                            obj["uihints"]["allownooptions"] = param.allow_no_options
                    else:
                        value_obj["type"] = "string"
                        obj["uihints"]["value"] = {"ui:widget": widget_type}

                obj["properties"]["value"] = value_obj
                one_of.append(obj)

            json_dict["oneOf"] = one_of

        return json.dumps(json_dict)


class Component(object):
    """
    Represents a generic or runtime-specific component
    """

    def __init__(
        self,
        id: str,
        name: str,
        description: Optional[str],
        catalog_type: str,
        component_reference: Any,
        definition: Optional[str] = None,
        runtime_type: Optional[str] = None,
        op: Optional[str] = None,
        categories: Optional[List[str]] = None,
        properties: Optional[List[ComponentParameter]] = None,
        extensions: Optional[List[str]] = None,
        parameter_refs: Optional[dict] = None,
        package_name: Optional[str] = None,
    ):
        """
        :param id: Unique identifier for a component
        :param name: The name of the component for display
        :param description: The description of the component
        :param catalog_type: Indicates the type of component definition resource
                              location; one of ['url', filename', 'directory]
        :param component_reference: Source information to help locate the component definition
        :param definition: The content of the specification file for this component
        :param runtime_type: The runtime type of the component (e.g. KUBEFLOW_PIPELINES, APACHE_AIRFLOW, etc.)
        :param op: The operation name of the component; used by generic components in rendering the palette
        :param categories: A list of categories that this component belongs to; used to organize component
                           in the palette
        :param properties: The set of properties for the component
        :param extensions: The file extension used by the component
        :param package_name: The fully qualified package name (excluding class name) of the file associated
            with this component
        """

        if not id:
            raise ValueError("Invalid component: Missing field 'id'.")
        if not name:
            raise ValueError("Invalid component: Missing field 'name'.")

        self._id = id
        self._name = name
        self._description = description
        self._catalog_type = catalog_type
        self._component_reference = component_reference

        self._definition = definition
        self._runtime_type = runtime_type
        self._op = op
        self._categories = categories or []
        self._properties = properties

        if not parameter_refs:
            if self._catalog_type == "elyra":
                parameter_refs = {"filehandler": "filename"}
            else:
                parameter_refs = {}

        if self._catalog_type == "elyra" and extensions and not parameter_refs.get("filehandler"):
            Component._log_warning(
                f"Component '{self._id}' specifies extensions '{extensions}' but \
                                   no entry in the 'parameter_ref' dictionary for 'filehandler' and \
                                   cannot participate in drag and drop functionality as a result."
            )

        self._extensions = extensions
        self._parameter_refs = parameter_refs
        self._package_name = package_name

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> Optional[str]:
        return self._description

    @property
    def catalog_type(self) -> str:
        return self._catalog_type

    @property
    def component_reference(self) -> Any:
        return self._component_reference

    @property
    def component_source(self) -> str:
        """
        Informational property consisting of the catalog type from which
        this component originates and the reference information used to
        locate it within that catalog.
        """
        return json.dumps({"catalog_type": self.catalog_type, "component_ref": self.component_reference})

    @property
    def definition(self) -> str:
        return self._definition

    @property
    def runtime_type(self) -> Optional[RuntimeProcessorType]:
        return self._runtime_type

    @property
    def op(self) -> Optional[str]:
        if self._op:
            return self._op
        else:
            return self._id

    @property
    def categories(self) -> List[str]:
        return self._categories

    @property
    def properties(self) -> Optional[List[ComponentParameter]]:
        return self._properties

    @property
    def extensions(self) -> Optional[List[str]]:
        return self._extensions

    @property
    def parameter_refs(self) -> dict:
        return self._parameter_refs

    @property
    def import_statement(self) -> Optional[str]:
        if not self._package_name:
            return None
        return f"from {self._package_name} import {self._name}"

    @property
    def input_properties(self) -> List[ComponentParameter]:
        return [prop for prop in self._properties if None not in prop.allowed_input_types]

    @property
    def output_properties(self) -> List[ComponentParameter]:
        return [prop for prop in self._properties if None in prop.allowed_input_types]

    @property
    def required_properties(self) -> List[ComponentParameter]:
        return [prop for prop in self.input_properties if prop.required]

    @property
    def file_extension(self) -> Optional[str]:
        """
        The file extension of the definition file representing this
        Component.
        """
        return self.extensions[0] if self.extensions else None

    @staticmethod
    def _log_warning(msg: str, logger: Optional[Logger] = None):
        if logger:
            logger.warning(msg)
        else:
            print(f"WARNING: {msg}")


class ComponentParser(LoggingConfigurable):  # ABC
    component_platform: RuntimeProcessorType = None
    _file_types: List[str] = None
    _parser_class_map: Dict[str, str] = {
        "APACHE_AIRFLOW": "elyra.pipeline.airflow.component_parser_airflow:AirflowComponentParser",
        "KUBEFLOW_PIPELINES": "elyra.pipeline.kfp.component_parser_kfp:KfpComponentParser",
    }

    @classmethod
    def create_instance(cls, platform: RuntimeProcessorType) -> "ComponentParser":
        """
        Class method that creates the appropriate instance of ComponentParser based on platform type name.
        """
        try:
            module_name, class_name = cls._parser_class_map[platform.name].split(":")
            module = import_module(module_name)
            return getattr(module, class_name)()
        except Exception as e:
            raise RuntimeError(f"Could not get appropriate ComponentParser class: {e}")

    @property
    def file_types(self) -> List[str]:
        return self._file_types

    @abstractmethod
    def parse(self, catalog_entry: "catalog_connector.CatalogEntry") -> Optional[List[Component]]:
        """
        Parse a component definition given in the catalog entry and return
        a list of fully-qualified Component objects
        """
        raise NotImplementedError()

    def _format_description(self, description: str, data_type: str) -> str:
        """
        Adds parameter type information parsed from component specification
        to parameter description.
        """
        if description:
            return f"{description} (type: {data_type})"
        return f"(type: {data_type})"

    def determine_type_information(self, parsed_type: str) -> "ParameterTypeInfo":
        """
        Takes the type information of a component parameter as parsed from the component
        specification and returns a new type that is one of several standard options.
        """
        parsed_type_lowered = parsed_type.lower()

        # Determine if this is a "container type"
        # Prefer types that occur in a clause of the form "[type] of ..." (i.e., "container" types)
        # E.g. "a dictionary of key/value pairs" will produce the type "dictionary"
        container_types = ["dictionary", "dict", "set", "list", "array", "arr"]
        for option in container_types:
            if option in parsed_type_lowered:
                data_type = option
                if data_type in ["dict", "dictionary"]:
                    data_type = "object"
                    default_value = {}
                else:  # data_type is one of ['list', 'set', 'array', 'arr']
                    data_type = "array"
                    default_value = []

                # Since we know the type, create our return value and bail
                data_type_info = ParameterTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type=data_type, default_value=default_value
                )
                break
        else:  # None of the container types were found...
            # Standardize type names
            if any(word in parsed_type_lowered for word in ["str", "string"]):
                data_type_info = ParameterTypeInfo(
                    parsed_data=parsed_type_lowered,
                    json_data_type="string",
                )
            elif any(word in parsed_type_lowered for word in ["int", "integer", "number"]):
                data_type_info = ParameterTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type="number", default_value=0
                )
            elif any(word in parsed_type_lowered for word in ["float"]):
                data_type_info = ParameterTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type="number", default_value=0.0
                )
            elif any(word in parsed_type_lowered for word in ["bool", "boolean"]):
                data_type_info = ParameterTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type="boolean", default_value=False
                )
            else:  # Let this be undetermined. Callers should check for this status and adjust
                data_type_info = ParameterTypeInfo(parsed_data=parsed_type_lowered, undetermined=True)

        return data_type_info


class InputTypeDescriptionMap(Enum):
    """A mapping of input types to the description that will appear in the UI"""

    string = "Please enter a string value:"
    number = "Please enter a number value:"
    boolean = "Please select or deselect the checkbox:"
    file = "Please select a file to use as input:"
    inputpath = "Please select an output from a parent:"
    outputpath = None  # outputs are read-only and don't require a description


@dataclass
class ParameterTypeInfo:
    """
    This class is initialized by ComponentParser.determine_type_information() and used by subclass
    implementations to determine the current state of parsing a data-type.

    The instance will indicate whether the base ComponentParser could determine the actual data-type
    via a `True` value in its `undetermined` attribute, in which case subclass implementations
    are advised to attempt further parsing. In such cases, the rest of the attributes of the instance
    will reflect a 'string' data type as that is the most flexible data_type and, hence, the default.

    Allowed input types for the given parameter defaults to the set of all available input types,
    unless the child method is able to determine that the allowed types must be adjusted,
    e.g. kfp path-based types.
    """

    parsed_data: str
    json_data_type: Optional[str] = "string"
    allowed_input_types: Optional[List[str]] = None
    default_value: Optional[Any] = ""
    required: Optional[bool] = True
    undetermined: Optional[bool] = False
