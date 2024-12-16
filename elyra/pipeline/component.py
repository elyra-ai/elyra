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
from __future__ import annotations

from abc import abstractmethod
from dataclasses import dataclass
from dataclasses import field
from importlib import import_module
import json
from logging import Logger
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from traitlets.config import LoggingConfigurable

from elyra.pipeline.properties import ComponentProperty
from elyra.pipeline.properties import ElyraProperty
from elyra.pipeline.runtime_type import RuntimeProcessorType

# Rather than importing only the CatalogEntry class needed in the Component parse
# type hint below, the catalog_connector module must be imported in its
# entirety in order to avoid a circular reference issue
try:
    from elyra.pipeline import catalog_connector
except ImportError:
    import sys

    catalog_connector = sys.modules[f"{__package__}.catalog_connector"]


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
        runtime_type: Optional[RuntimeProcessorType] = None,
        op: Optional[str] = None,
        categories: Optional[List[str]] = None,
        properties: Optional[List[ComponentProperty]] = None,
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
    def runtime_type_name(self) -> Optional[str]:
        return self._runtime_type.name if isinstance(self._runtime_type, RuntimeProcessorType) else None

    @property
    def op(self) -> Optional[str]:
        return self._op or self._id

    @property
    def categories(self) -> List[str]:
        return self._categories

    @property
    def properties(self) -> Optional[List[ComponentProperty]]:
        return self._properties

    @property
    def extensions(self) -> Optional[List[str]]:
        return self._extensions

    @property
    def parameter_refs(self) -> dict:
        return self._parameter_refs

    @property
    def import_statement(self) -> Optional[str]:
        return f"from {self._package_name} import {self._name}" if self._package_name else None

    @property
    def input_properties(self) -> List[ComponentProperty]:
        return [prop for prop in self._properties if None not in prop.allowed_input_types]

    @property
    def output_properties(self) -> List[ComponentProperty]:
        return [prop for prop in self._properties if None in prop.allowed_input_types]

    @property
    def required_properties(self) -> List[ComponentProperty]:
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

    def get_elyra_properties(self) -> List[ComponentProperty]:
        """
        Retrieve the list of Elyra-owned ComponentProperty objects that apply to
        this component, removing any whose id collides with a property parsed from
        the component definition.
        """
        op_type = "generic" if self.component_reference == "elyra" else "custom"
        elyra_props = ElyraProperty.get_classes_for_component_type(op_type, self.runtime_type)
        if self.properties:
            # Remove certain Elyra-owned properties if a component-defined property of the same id is already present
            parsed_property_ids = [prop.ref for prop in self.properties]
            elyra_props = [prop for prop in elyra_props if prop.property_id not in parsed_property_ids]
        return elyra_props


class ComponentParser(LoggingConfigurable):  # ABC
    component_platform: RuntimeProcessorType = None
    _file_types: List[str] = None
    _parser_class_map: Dict[str, str] = {
        "APACHE_AIRFLOW": "elyra.pipeline.airflow.airflow_component_parser:AirflowComponentParser",
        "KUBEFLOW_PIPELINES": "elyra.pipeline.kfp.kfp_component_parser:KfpComponentParser",
    }

    @classmethod
    def create_instance(cls, platform: RuntimeProcessorType) -> ComponentParser:
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
    def parse(self, catalog_entry: catalog_connector.CatalogEntry) -> Optional[List[Component]]:
        """
        Parse a component definition given in the catalog entry and return
        a list of fully-qualified Component objects
        """
        raise NotImplementedError()

    def _format_description(self, description: str, data_type: str) -> str:
        """
        Adds property type information parsed from component specification
        to property description.
        """
        if description:
            return f"{description} (type: {data_type})"
        return f"(type: {data_type})"

    def determine_type_information(self, parsed_type: str) -> "PropertyTypeInfo":
        """
        Takes the type information of a component property as parsed from the component
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
                data_type_info = PropertyTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type=data_type, default_value=default_value
                )
                break
        else:  # None of the container types were found...
            # Standardize type names
            if any(word in parsed_type_lowered for word in ["str", "string"]):
                data_type_info = PropertyTypeInfo(
                    parsed_data=parsed_type_lowered,
                    json_data_type="string",
                )
            elif any(word in parsed_type_lowered for word in ["int", "integer", "number"]):
                data_type_info = PropertyTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type="number", default_value=0
                )
            elif any(word in parsed_type_lowered for word in ["float"]):
                data_type_info = PropertyTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type="number", default_value=0.0
                )
            elif any(word in parsed_type_lowered for word in ["bool", "boolean"]):
                data_type_info = PropertyTypeInfo(
                    parsed_data=parsed_type_lowered, json_data_type="boolean", default_value=False
                )
            else:  # Let this be undetermined. Callers should check for this status and adjust
                data_type_info = PropertyTypeInfo(parsed_data=parsed_type_lowered, undetermined=True)

        from elyra.pipeline.processor import PipelineProcessorManager  # placed here to avoid circular reference

        if PipelineProcessorManager.instance().supports_pipeline_params(runtime_type=self.component_platform):
            data_type_info.allowed_input_types.append("parameter")

        return data_type_info


@dataclass
class PropertyTypeInfo:
    """
    This class is initialized by ComponentParser.determine_type_information() and used by subclass
    implementations to determine the current state of parsing a data-type.

    The instance will indicate whether the base ComponentParser could determine the actual data-type
    via a `True` value in its `undetermined` attribute, in which case subclass implementations
    are advised to attempt further parsing. In such cases, the rest of the attributes of the instance
    will reflect a 'string' data type as that is the most flexible data_type and, hence, the default.

    Allowed input types for the given property defaults to the set of all available input types,
    unless the child method is able to determine that the allowed types must be adjusted,
    e.g. kfp path-based types.
    """

    parsed_data: str
    json_data_type: Optional[str] = "string"
    allowed_input_types: Optional[List[str]] = field(default_factory=lambda: ["inputvalue", "inputpath", "file"])
    default_value: Optional[Any] = ""
    required: Optional[bool] = True
    undetermined: Optional[bool] = False
