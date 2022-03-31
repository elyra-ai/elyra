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
from enum import Enum
from importlib import import_module
import json
from logging import Logger
from types import SimpleNamespace
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

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
        data_type: str,
        value: str,
        description: str,
        required: bool = False,
        control: str = "custom",
        control_id: str = "StringControl",
        one_of_control_types: Optional[List[Tuple[str, str, str]]] = None,
        default_control_type: str = "StringControl",
        default_data_type: str = "string",
        allow_no_options: Optional[bool] = False,
        items: Optional[List[str]] = None,
    ):
        """
        :param id: Unique identifier for a property
        :param name: The name of the property for display
        :param data_type: The type that the property value takes on
        :param value: The default value of the property
        :param description: A description of the property for display
        :param control: The control of the property on the display, e.g. custom or readonly
        :param control_id: The control type of the property, if the control is 'custom', e.g. StringControl, EnumControl
        :param one_of_control_types: A list of control types to be used when 'OneOfControl' type is the primary control
        :param default_control_type: The default control type to use when 'OneOfControl type is the primary control
        :param items: For properties with a control of 'EnumControl', the items making up the enum
        :param required: Whether the property is required
        """

        if not id:
            raise ValueError("Invalid component: Missing field 'id'.")
        if not name:
            raise ValueError("Invalid component: Missing field 'name'.")

        self._ref = id
        self._name = name
        self._data_type = data_type
        self._value = value

        self._description = description
        self._control = control
        self._control_id = control_id
        self._one_of_control_types = one_of_control_types
        self._default_control_type = default_control_type
        self._default_data_type = default_data_type
        self._allow_no_options = allow_no_options
        self._items = items or []

        # Check description for information about 'required' parameter
        if "not optional" in description.lower() or (
            "required" in description.lower()
            and "not required" not in description.lower()
            and "n't required" not in description.lower()
        ):
            required = True

        self._required = required

    @property
    def ref(self) -> str:
        return self._ref

    @property
    def name(self) -> str:
        return self._name

    @property
    def data_type(self) -> str:
        return self._data_type

    @property
    def value(self) -> str:
        return self._value

    @property
    def description(self) -> str:
        return self._description

    @property
    def control(self) -> str:
        return self._control

    @property
    def control_id(self) -> str:
        return self._control_id

    @property
    def one_of_control_types(self) -> List[Tuple[str, str, str]]:
        """
        The `OneOfControl` controller is an encapsulating control ID that allows users to select
        between multiple input types when configuring the component. For instance, in Airflow, a
        component parameter can take in, as input, both a value as well as an output from a parent
        node.
        When using the `OneOfControl` as the primary control ID for the component parameter,
        `one_of_control_types` provides canvas a list of control IDs that will be used by the
        `OneOfControl` controller. These control IDs are what allow the user to select different
        types of inputs.
        :return: A list of 3-tuples containing the default_control_type, data_type, label associated with controller
        """
        return self._one_of_control_types

    @property
    def default_control_type(self) -> str:
        """
        The `default_control_type` is the control type that will be displayed by default when
        first opening the component's parameters in the pipeline editor.
        """
        return self._default_control_type

    @property
    def default_data_type(self) -> str:
        """
        The `default_data_type` is the first data type that is assigned to this specific parameter
        after parsing the component specification.
        """
        return self._default_data_type

    @property
    def allow_no_options(self) -> bool:
        return self._allow_no_options

    @property
    def items(self) -> List[str]:
        return self._items

    @property
    def required(self) -> bool:
        return bool(self._required)


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
        return [prop for prop in self._properties if prop.data_type != "outputpath"]

    @property
    def output_properties(self) -> List[ComponentParameter]:
        return [prop for prop in self._properties if prop.data_type == "outputpath"]

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

    def determine_type_information(self, parsed_type: str) -> SimpleNamespace:
        """
        Takes the type information of a component parameter as parsed from the component
        specification and returns a new type that is one of several standard options.

        """
        parsed_type_lowered = parsed_type.lower()

        data_type_info: SimpleNamespace

        # Determine if this is a "container type"
        # Prefer types that occur in a clause of the form "[type] of ..." (i.e., "container" types)
        # E.g. "a dictionary of key/value pairs" will produce the type "dictionary"
        container_types = ["dictionary", "dict", "set", "list", "array", "arr"]
        for option in container_types:
            if option in parsed_type_lowered:
                data_type = option
                if data_type in ["dict", "dictionary"]:
                    data_type = "dictionary"
                    default_value = {}
                else:  # data_type is one of ['list', 'set', 'array', 'arr']
                    data_type = "list"
                    default_value = []

                # Since we know the type, create our return value and bail
                data_type_info = ComponentParser.create_data_type_info(
                    parsed_data=parsed_type_lowered, data_type=data_type, default_value=default_value
                )
                break
        else:  # None of the container types were found...
            # Standardize type names
            if any(word in parsed_type_lowered for word in ["str", "string"]):
                data_type_info = ComponentParser.create_data_type_info(
                    parsed_data=parsed_type_lowered, data_type="string"
                )
            elif any(word in parsed_type_lowered for word in ["int", "integer", "number"]):
                data_type_info = ComponentParser.create_data_type_info(
                    parsed_data=parsed_type_lowered,
                    data_type="number",
                    control_id="NumberControl",
                    default_control_type="NumberControl",
                    default_value=0,
                )
            elif any(word in parsed_type_lowered for word in ["float"]):
                data_type_info = ComponentParser.create_data_type_info(
                    parsed_data=parsed_type_lowered,
                    data_type="number",
                    control_id="NumberControl",
                    default_control_type="NumberControl",
                    default_value=0.0,
                )
            elif any(word in parsed_type_lowered for word in ["bool", "boolean"]):
                data_type_info = ComponentParser.create_data_type_info(
                    parsed_data=parsed_type_lowered,
                    data_type="boolean",
                    control_id="BooleanControl",
                    default_control_type="BooleanControl",
                    default_value=False,
                )
            else:  # Let this be undetermined.  Callers should check for this status and adjust
                data_type_info = ComponentParser.create_data_type_info(
                    parsed_data=parsed_type_lowered, data_type="string", undetermined=True
                )

        return data_type_info

    @staticmethod
    def create_data_type_info(
        parsed_data: str,
        data_type: str = "string",
        default_data_type: str = "string",
        data_label: str = None,
        default_value: Any = "",
        required: bool = True,
        one_of_control_types: Optional[List[Tuple[str, str, str]]] = None,
        control_id: str = "StringControl",
        default_control_type: str = "StringControl",
        allow_no_options: Optional[bool] = False,
        control: str = "custom",
        undetermined: bool = False,
    ) -> SimpleNamespace:
        """Returns a SimpleNamespace instance that contains the current state of data-type parsing.

        This method is called by ComponentParser.determine_type_information() and used by subclass
        implementations to determine the current state of parsing a data-type.

        The instance will indicate that the base ComponentParser could not determine the actual data-type
        via a `True` value in its `undetermined` attribute, in which case subclass implementations
        are advised to attempt further parsing. In such cases, the rest of the attributes of the instance
        will reflect a 'string' data type as that is the most flexible data_type and, hence, the default.
        """
        dti = SimpleNamespace(
            parsed_data=parsed_data,
            data_type=data_type,
            default_data_type=default_data_type,
            data_label=data_label or ControllerMap[control_id].value,
            default_value=default_value,
            required=required,
            default_control_type=default_control_type,
            one_of_control_types=one_of_control_types,
            control_id=control_id,
            allow_no_options=allow_no_options,
            control=control,
            undetermined=undetermined,
        )
        return dti


class ControllerMap(Enum):
    StringControl = "Please enter a string value :"
    NumberControl = "Please enter a number value :"
    BooleanControl = "Please select or deselect the checkbox :"
    NestedEnumControl = "Please select an output from a parent :"
