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

from enum import Enum
from importlib import import_module
import json
import re
from textwrap import dedent
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Set
from typing import Type

from kfp.dsl import ContainerOp
from kubernetes.client import (
    V1EnvVar,
    V1EnvVarSource,
    V1PersistentVolumeClaimVolumeSource,
    V1SecretKeySelector,
    V1Toleration,
    V1Volume,
    V1VolumeMount,
)

from elyra.pipeline.pipeline_constants import DISALLOW_CACHED_OUTPUT
from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import KUBERNETES_POD_ANNOTATIONS
from elyra.pipeline.pipeline_constants import KUBERNETES_SECRETS
from elyra.pipeline.pipeline_constants import KUBERNETES_TOLERATIONS
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.pipeline_constants import RUNTIME_IMAGE
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.util.kubernetes import is_valid_annotation_key, is_valid_kubernetes_key, is_valid_kubernetes_resource_name


class ElyraProperty:
    """
    A component property that is defined and processed by Elyra.
    """

    property_id: str
    generic: bool
    custom: bool
    _display_name: str
    _json_data_type: str
    _required: bool = False

    _subclass_property_map: Dict[str, type] = {}

    @classmethod
    def all_subclasses(cls):
        """Get all nested subclasses for a class."""
        return set(cls.__subclasses__()).union([s for c in cls.__subclasses__() for s in c.all_subclasses()])

    @classmethod
    def build_property_map(cls) -> None:
        """Build the map of property subclasses."""
        cls._subclass_property_map = {sc.property_id: sc for sc in cls.all_subclasses() if hasattr(sc, "property_id")}

    @classmethod
    def create_instance(cls, prop_id: str, value: Optional[Any]) -> ElyraProperty | ElyraPropertyList | None:
        """Create an instance of a class with the given property id using the user-entered values."""
        if not cls._subclass_property_map:
            cls.build_property_map()

        sc = cls._subclass_property_map.get(prop_id)
        if not sc:
            return None

        if issubclass(sc, ElyraPropertyListItem):
            if not isinstance(value, list) or not value:
                return None
            # Create instance for each list element and convert to ElyraPropertyList
            instances = [getattr(import_module(sc.__module__), sc.__name__)(**params) for params in value]
            return ElyraPropertyList.deduplicate(ElyraPropertyList(instances))

        return getattr(import_module(sc.__module__), sc.__name__)(value)

    @classmethod
    def get_classes_for_component_type(cls, component_type: str, runtime_type: Optional[str] = "") -> Set[type]:
        """
        Retrieve property subclasses that apply to the given component type
        (e.g., custom or generic) and to the given runtime type.
        """
        runtime_subclass = cls
        # Determine subclass (KfpElyraProperty, AirflowElyraProperty) that represents given runtime_type
        for subclass in runtime_subclass.__subclasses__():
            subclass_runtime_type = getattr(subclass, "_runtime_type", None)
            if subclass_runtime_type and subclass_runtime_type.name == runtime_type:
                runtime_subclass = subclass
                break

        # Retrieve all sub-subclasses of the runtime subclass that apply to given component_type
        all_subclasses = {sc for sc in runtime_subclass.all_subclasses() if getattr(sc, component_type, False)}
        return all_subclasses

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        class_description = dedent(cls.__doc__).replace("\n", " ")
        schema = {"title": cls._display_name, "description": class_description, "type": cls._json_data_type}
        return schema

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        return []


class KfpElyraProperty(ElyraProperty):
    """
    A component property that is defined and processed by Elyra
    and applies to the KFP runtime.
    """

    _runtime_type = RuntimeProcessorType.KUBEFLOW_PIPELINES

    def add_to_container_op(self, container_op: ContainerOp) -> None:
        """Add relevant property info to a given KFP ContainerOp"""
        pass


class AirflowElyraProperty(ElyraProperty):
    """
    A component property that is defined and processed by Elyra
    and applies to the Airflow runtime.
    """

    _runtime_type = RuntimeProcessorType.APACHE_AIRFLOW

    def add_to_executor_config(self, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        pass


class RuntimeImage(KfpElyraProperty, AirflowElyraProperty):
    """Container image used as execution environment."""

    image_name: str

    property_id = RUNTIME_IMAGE
    generic = True
    custom = False
    _display_name = "Runtime Image"
    _json_data_type = "string"
    _required = True

    __slots__ = ["image_name"]

    def __init__(self, image_name, **kwargs):
        self.image_name = image_name.strip()

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema.update({"required": cls._required, "uihints": {"items": []}})
        return schema

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not self.image_name:
            validation_errors.append("Required property value is missing.")
        else:
            image_regex = re.compile(r"[^/ ]+/[^/ ]+$")
            matched = image_regex.search(self.image_name)
            if not matched:
                validation_errors.append(
                    "Node contains an invalid runtime image. Runtime image "
                    "must conform to the format [registry/]owner/image:tag"
                )
        return validation_errors


class DisallowCachedOutput(KfpElyraProperty):
    """Disable caching to force node re-execution in the target runtime environment."""

    selection: bool

    property_id = DISALLOW_CACHED_OUTPUT
    generic = False
    custom = True
    _display_name = "Disallow cached output"
    _json_data_type = "string"

    __slots__ = ["selection"]

    def __init__(self, selection, **kwargs):
        self.selection = selection == "True"

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema.update({"enum": ["True", "False"]})
        return schema

    def add_to_container_op(self, container_op: ContainerOp) -> None:
        """Add relevant property info to a given KFP ContainerOp"""
        # Force re-execution of the operation by setting staleness to zero days
        # https://www.kubeflow.org/docs/components/pipelines/overview/caching/#managing-caching-staleness
        if self.selection:
            container_op.set_caching_options(enable_caching=False)
            container_op.execution_options.caching_strategy.max_cache_staleness = "P0D"


class ElyraPropertyListItem(ElyraProperty):
    """
    An Elyra-owned property that is meant to be a member of an ElyraOwnedPropertyList.
    """

    _keys: List[str]
    _ui_placeholder_map: dict = {}

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["default"] = []
        schema["items"] = {"type": "object", "properties": {}, "required": []}
        for attr in cls.__slots__:
            attr_type = cls.__annotations__.get(attr)
            if "Optional" not in attr_type:
                schema["items"]["required"].append(attr)
            else:
                attr_type = attr_type.replace("Optional[", "").replace("]", "")

            if attr_type == "bool":
                json_type, default = "boolean", False
            elif attr_type in ["int", "float"]:
                json_type, default = "number", 0
            elif attr_type in ["list", "List"]:
                json_type, default = "array", "[]"
            elif attr_type in ["dict", "Dict"]:
                json_type, default = "object", "{}"
            else:
                json_type, default = "string", ""

            schema["items"]["properties"][attr] = {
                "type": json_type,
                "title": cls._ui_placeholder_map.get(attr) or attr,  # TODO change to a placeholder once supported
                "default": default,
            }

        return schema

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        pass

    def get_key_for_dict_entry(self) -> str:
        """
        Given the attribute names in the 'key' property, construct a key
        based on the attribute values of the instance.
        """
        prop_key = ""
        for key_attr in self._keys:
            key_part = getattr(self, key_attr)
            if key_part:
                prop_key += f"{key_part}:" if key_attr != self._keys[-1] else key_part
        return prop_key

    def get_value_for_dict_entry(self) -> str:
        """Returns the value to be used when constructing a dict from a list of classes."""
        return self.to_str()


class EnvironmentVariable(ElyraPropertyListItem, KfpElyraProperty, AirflowElyraProperty):
    """
    Environment variables to be set on the execution environment.
    """

    env_var: str
    value: str

    property_id = ENV_VARIABLES
    generic = True
    custom = False
    _display_name = "Environment Variables"
    _json_data_type = "array"
    _keys = ["env_var"]

    __slots__ = ["env_var", "value"]

    def __init__(self, **kwargs):
        self.env_var = kwargs.get("env_var", "").strip()
        self.value = kwargs.get("value", "").strip()

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["uihints"] = {"canRefresh": True}
        return schema

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.env_var}={self.value}"

    def get_value_for_dict_entry(self) -> str:
        """Returns the value to be used when constructing a dict from a list of classes."""
        return self.value

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not self.env_var or not self.value:
            validation_errors.append("Property has an improperly formatted env variable key value pair.")

        return validation_errors


class KubernetesSecret(ElyraPropertyListItem, KfpElyraProperty, AirflowElyraProperty):
    """
    Kubernetes secrets to make available as environment variables to this node.
    The secret name and key given must be present in the Kubernetes namespace
    where the node is executed or this node will not run.
    """

    env_var: str
    name: str
    key: str

    property_id = KUBERNETES_SECRETS
    generic = True
    custom = False
    _display_name = "Kubernetes Secrets"
    _json_data_type = "array"
    _keys = ["env_var"]
    _ui_placeholder_map = {"name": "secret-name", "key": "secret-key"}

    __slots__ = ["env_var", "name", "key"]

    def __init__(self, **kwargs):
        self.env_var: str = kwargs.pop("env_var", "").strip()
        self.name = kwargs.pop("name", "").strip()
        self.key = kwargs.pop("key", "").strip()

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.env_var}={self.name}:{self.key}"

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not self.name or not self.key:
            validation_errors.append(
                f"Environment variable '{self.env_var}' has an improperly formatted"
                f"representation of secret name and key."
            )
        # Ensure the secret name is syntactically a valid Kubernetes resource name
        if not is_valid_kubernetes_resource_name(self.name):
            validation_errors.append(
                f"Secret name '{self.name}' is not a valid Kubernetes resource name.",
            )
        # Ensure the secret key is a syntactically valid Kubernetes key
        if not is_valid_kubernetes_key(self.key):
            validation_errors.append(
                f"Key '{self.key}' is not a valid Kubernetes secret key.",
            )

        return validation_errors

    def add_to_container_op(self, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        container_op.container.add_env_variable(
            V1EnvVar(
                name=self.env_var,
                value_from=V1EnvVarSource(secret_key_ref=V1SecretKeySelector(name=self.name, key=self.key)),
            )
        )

    def add_to_executor_config(self, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        if "secrets" not in kubernetes_executor:
            kubernetes_executor["secrets"] = []
        kubernetes_executor["secrets"].append(
            {"deploy_type": "env", "deploy_target": self.env_var, "secret": self.name, "key": self.key}
        )


class VolumeMount(ElyraPropertyListItem, KfpElyraProperty, AirflowElyraProperty):
    """
    Volumes to be mounted in this node. The specified Persistent Volume Claims must exist in the
    Kubernetes namespace where the node is executed or this node will not run.
    """

    path: str
    pvc_name: str

    property_id = MOUNTED_VOLUMES
    generic = True
    custom = True
    _display_name = "Data Volumes"
    _json_data_type = "array"
    _keys = ["path"]
    _ui_placeholder_map = {"path": "/mount/path"}

    __slots__ = ["path", "pvc_name"]

    def __init__(self, **kwargs):
        self.path = f"/{kwargs.pop('path', '').strip('/')}"
        self.pvc_name = kwargs.pop("pvc_name", "").strip()

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.path}={self.pvc_name}"

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        # Ensure the PVC name is syntactically a valid Kubernetes resource name
        if not is_valid_kubernetes_resource_name(self.pvc_name):
            validation_errors.append(f"PVC name '{self.pvc_name}' is not a valid Kubernetes resource name.")

        return validation_errors

    def add_to_container_op(self, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        volume = V1Volume(
            name=self.pvc_name,
            persistent_volume_claim=V1PersistentVolumeClaimVolumeSource(claim_name=self.pvc_name),
        )
        if volume not in container_op.volumes:
            container_op.add_volume(volume)
        container_op.container.add_volume_mount(V1VolumeMount(mount_path=self.path, name=self.pvc_name))

    def add_to_executor_config(self, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        if "volumes" not in kubernetes_executor:
            kubernetes_executor["volumes"] = []
            kubernetes_executor["volume_mounts"] = []
        kubernetes_executor["volumes"].append(
            {
                "name": self.pvc_name,
                "persistentVolumeClaim": {"claimName": self.pvc_name},
            }
        )
        kubernetes_executor["volume_mounts"].append({"mountPath": self.path, "name": self.pvc_name, "read_only": False})


class KubernetesAnnotation(ElyraPropertyListItem, KfpElyraProperty, AirflowElyraProperty):
    """
    Metadata to be added to this node. The metadata is exposed as annotation
    in the Kubernetes pod that executes this node.
    """

    key: str
    value: str

    property_id = KUBERNETES_POD_ANNOTATIONS
    generic = True
    custom = True
    _display_name = "Kubernetes Pod Annotations"
    _json_data_type = "array"
    _keys = ["key"]
    _ui_placeholder_map = {"key": "annotation_key", "value": "annotation_value"}

    __slots__ = ["key", "value"]

    def __init__(self, **kwargs):
        self.key = kwargs.pop("key", "").strip()
        self.value = kwargs.pop("value", "").strip()

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.key}={self.value}"

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not is_valid_annotation_key(self.key):
            validation_errors.append(f"'{self.key}' is not a valid Kubernetes annotation key.")

        return validation_errors

    def add_to_container_op(self, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        if self.key not in container_op.pod_annotations:
            container_op.add_pod_annotation(self.key, self.value)

    def add_to_executor_config(self, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        if "annotations" not in kubernetes_executor:
            kubernetes_executor["annotations"] = {}
        kubernetes_executor["annotations"][self.key] = self.value


class KubernetesToleration(ElyraPropertyListItem, KfpElyraProperty, AirflowElyraProperty):
    """
    Kubernetes tolerations to apply to the pod where the node is executed.
    """

    key: str
    operator: str
    value: Optional[str]
    effect: str

    property_id = KUBERNETES_TOLERATIONS
    generic = True
    custom = True
    _display_name = "Kubernetes Tolerations"
    _json_data_type = "array"
    _keys = ["key", "operator", "value", "effect"]

    __slots__ = ["key", "operator", "value", "effect"]

    def __init__(self, **kwargs):
        self.key = kwargs.pop("key", "").strip()
        self.operator = kwargs.pop("operator", "").strip()
        self.value = kwargs.pop("value", "").strip()
        self.effect = kwargs.pop("effect", "Exists").strip()

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["items"]["properties"]["operator"]["enum"] = ["Exists", "Equal"]
        return schema

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.key}:{self.operator}:{self.value}:{self.effect}"

    def get_all_validation_errors(self) -> List[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        # Ensure the PVC name is syntactically a valid Kubernetes resource name
        if self.operator not in ["Exists", "Equal"]:
            validation_errors.append(
                f"'{self.operator}' is not a valid operator: the value must be one of 'Exists' or 'Equal'."
            )

        if len(self.key) == 0 and self.operator == "Equal":
            validation_errors.append(
                f"'{self.operator}' is not a valid operator: operator must be 'Exists' if no key is specified."
            )

        if len(self.effect) > 0 and self.effect not in ["NoExecute", "NoSchedule", "PreferNoSchedule"]:
            validation_errors.append(
                f"'{self.effect}' is not a valid effect: effect must be one "
                f"of 'NoExecute', 'NoSchedule', or 'PreferNoSchedule'."
            )

        if self.operator == "Exists" and len(self.value) > 0:
            validation_errors.append(
                f"'{self.value}' is not a valid value: value should be empty if operator is 'Exists'."
            )
        return validation_errors

    def add_to_container_op(self, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        toleration = V1Toleration(
            effect=self.effect,
            key=self.key,
            operator=self.operator,
            value=self.value,
        )
        if toleration not in container_op.tolerations:
            container_op.add_toleration(toleration)

    def add_to_executor_config(self, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        if "tolerations" not in kubernetes_executor:
            kubernetes_executor["tolerations"] = []
        kubernetes_executor["tolerations"].append(
            {
                "key": self.key,
                "operator": self.operator,
                "value": self.value,
                "effect": self.effect,
            }
        )


class ElyraPropertyList(list):
    """
    A list class that exposes functionality specific to lists whose entries are
    of the class ElyraOwnedPropertyListItem.
    """

    @staticmethod
    def to_dict(property_list: List[ElyraPropertyListItem], use_prop_as_value: bool = False) -> Dict[str, str]:
        """
        Each Elyra-owned property consists of a set of attributes, some subset of which represents
        a unique key. Lists of these properties, however, often need converted to dictionary
        form for processing - so we must convert.
        """
        prop_dict = {}
        for prop in property_list:
            prop_key = prop.get_key_for_dict_entry()
            if not prop_key:
                # Invalid entry; skip inclusion and continue
                continue

            prop_value = prop.get_value_for_dict_entry()
            if use_prop_as_value:
                # Force use of the property object itself as the value
                prop_value = prop
            prop_dict[prop_key] = prop_value

        return prop_dict

    @staticmethod
    def deduplicate(instance_list: ElyraPropertyList) -> ElyraPropertyList:
        """Remove duplicates from the given list"""
        instance_dict = ElyraPropertyList.to_dict(instance_list, use_prop_as_value=True)
        return ElyraPropertyList({**instance_dict}.values())

    @staticmethod
    def merge(primary: ElyraPropertyList, secondary: ElyraPropertyList) -> ElyraPropertyList:
        """
        Merge two lists of Elyra-owned properties, preferring the values given in the
        primary parameter in the case of a matching key between the two lists.
        """
        primary_dict = ElyraPropertyList.to_dict(primary, use_prop_as_value=True)
        secondary_dict = ElyraPropertyList.to_dict(secondary, use_prop_as_value=True)

        merged_list = list({**secondary_dict, **primary_dict}.values())
        return ElyraPropertyList(merged_list)

    @staticmethod
    def difference(minuend: ElyraPropertyList, subtrahend: ElyraPropertyList) -> ElyraPropertyList:
        """
        Given two lists of Elyra-owned properties, remove any duplicate instances
        found in the second (subtrahend) from the first (minuend), if present.

        :param minuend: list to be subtracted from
        :param subtrahend: list from which duplicates will be determined and given preference

        :returns: the difference of the two lists
        """
        subtract_dict = ElyraPropertyList.to_dict(minuend, use_prop_as_value=True)
        for key in ElyraPropertyList.to_dict(subtrahend).keys():
            if key in subtract_dict:
                subtract_dict.pop(key)

        return ElyraPropertyList(subtract_dict.values())


class ElyraPropertyJSONEncoder(json.JSONEncoder):
    """
    A JSON Encoder class to prevent errors during serialization of Elyra-owned property classes.
    """

    def default(self, o):
        """
        Render dataclass content as dict
        """
        return o.__dict__ if isinstance(o, ElyraProperty) else super().default(o)


class ComponentParameter(object):
    """
    Represents a single property for a pipeline component
    """

    def __init__(
        self,
        id: str,
        name: str,
        json_data_type: str,
        description: str,
        value: Optional[Any] = "",
        allowed_input_types: Optional[List[Optional[str]]] = None,
        required: Optional[bool] = False,
        allow_no_options: Optional[bool] = False,
        items: Optional[List[str]] = None,
        dataclass: Optional[Type[ElyraProperty]] = None,
    ):
        """
        :param id: Unique identifier for a property
        :param name: The name of the property for display
        :param json_data_type: The JSON data type that represents this parameters value
        :param allowed_input_types: The input types that the property can accept, including those for custom rendering
        :param value: The default value of the property
        :param description: A description of the property for display
        :param required: Whether the property is required
        :param allow_no_options: Specifies whether to allow parent nodes that don't specifically
            define output properties to be selected as input to this node parameter
        :param items: For properties with a control of 'EnumControl', the items making up the enum
        :param dataclass: A dataclass object that represents this (Elyra-owned) parameter
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
        if json_data_type in {"array", "object"}:
            self._value_entry_type = "string"

        if json_data_type == "boolean" and isinstance(value, str):
            value = value in ["True", "true"]
        elif json_data_type == "number" and isinstance(value, str):
            try:
                # Attempt to coerce string to integer value
                value = int(value)
            except ValueError:
                # Value could not be coerced to integer, assume float
                value = float(value)
        if json_data_type in {"array", "object"} and not isinstance(value, str):
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
        self._dataclass = dataclass

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

    @property
    def dataclass(self) -> Optional[ElyraProperty]:
        return self._dataclass

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
                json_dict.update(
                    {
                        "type": "object",
                        "properties": {
                            "widget": {"type": "string", "default": input_type},
                            "value": {"type": "string", "enum": []},
                        },
                        "uihints": {"widget": {"ui:field": "hidden"}, "value": {input_type: True}},
                    }
                )
            elif input_type == "file":
                json_dict["type"] = "string"
                json_dict["uihints"] = {"ui:widget": input_type}
            else:
                json_dict["type"] = param.value_entry_type

                # Render default value if it is not None
                if param.value is not None:
                    json_dict["default"] = param.value
        else:
            # Parameter accepts multiple types of inputs; render a oneOf block
            one_of = []
            for widget_type in param.allowed_input_types:
                obj = {
                    "type": "object",
                    "properties": {"widget": {"type": "string"}, "value": {}},
                    "uihints": {"widget": {"ui:widget": "hidden"}, "value": {}},
                }
                if widget_type == "inputvalue":
                    obj["title"] = InputTypeDescriptionMap[param.value_entry_type].value
                    obj["properties"]["widget"]["default"] = param.value_entry_type
                    obj["properties"]["value"]["type"] = param.value_entry_type
                    if param.value_entry_type == "boolean":
                        obj["properties"]["value"]["title"] = " "

                    # Render default value if it is not None
                    if param.value is not None:
                        obj["properties"]["value"]["default"] = param.value
                else:  # inputpath or file types
                    obj["title"] = InputTypeDescriptionMap[widget_type].value
                    obj["properties"]["widget"]["default"] = widget_type
                    if widget_type == "outputpath":
                        obj["uihints"]["value"] = {"ui:readonly": "true", widget_type: True}
                        obj["properties"]["value"]["type"] = "string"
                    elif widget_type == "inputpath":
                        obj["uihints"]["value"] = {widget_type: True}
                        obj["properties"]["value"]["type"] = "string"
                        obj["properties"]["value"]["enum"] = []
                        if param.allow_no_options:
                            obj["uihints"]["allownooptions"] = param.allow_no_options
                    else:
                        obj["uihints"]["value"] = {"ui:widget": widget_type}
                        obj["properties"]["value"]["type"] = "string"

                one_of.append(obj)
            json_dict["oneOf"] = one_of

        return json.dumps(json_dict)


class InputTypeDescriptionMap(Enum):
    """A mapping of input types to the description that will appear in the UI"""

    string = "Please enter a string value:"
    number = "Please enter a number value:"
    boolean = "Please select or deselect the checkbox:"
    file = "Please select a file to use as input:"
    inputpath = "Please select an output from a parent:"
    outputpath = None  # outputs are read-only and don't require a description
