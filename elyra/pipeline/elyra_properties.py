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

import json
import re
from importlib import import_module
from textwrap import dedent
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from elyra.pipeline.pipeline_constants import ENV_VARIABLES
from elyra.pipeline.pipeline_constants import KUBERNETES_POD_ANNOTATIONS
from elyra.pipeline.pipeline_constants import KUBERNETES_SECRETS
from elyra.pipeline.pipeline_constants import KUBERNETES_TOLERATIONS
from elyra.pipeline.pipeline_constants import MOUNTED_VOLUMES
from elyra.pipeline.pipeline_constants import RUNTIME_IMAGE
from elyra.util.kubernetes import is_valid_annotation_key, is_valid_kubernetes_key, is_valid_kubernetes_resource_name


class ElyraOwnedProperty:
    """
    TODO
    """

    _property_id: str
    _display_name: str
    _json_data_type: str
    _generic: bool
    _custom: bool
    _required: bool = False

    @classmethod
    def all_subclasses(cls):
        """TODO"""
        return set(cls.__subclasses__()).union([s for c in cls.__subclasses__() for s in c.all_subclasses()])

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> Optional[ElyraOwnedProperty]:
        """TODO"""
        for subclass in cls.all_subclasses():
            if getattr(subclass, "_property_id", "") == prop_id:
                if issubclass(subclass, ElyraOwnedPropertyListItem) and isinstance(prop_value, list):
                    value_list = [subclass.create_instance_from_raw_value(prop_id, item) for item in prop_value]
                    return ElyraOwnedPropertyList(value_list)
                else:
                    return subclass.create_instance_from_raw_value(prop_id, prop_value)
        return None

    @classmethod
    def get_classes_for_component_type(cls, component_type: str):
        """
        Retrieve subclasses that apply to the given component type
        (if the class attribute _<component_type> is True).
        """
        dataclass_params = []
        for subclass in cls.all_subclasses():
            if getattr(subclass, f"_{component_type}", False) is True:
                dataclass_params.append(subclass)

        return dataclass_params

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        class_description = dedent(cls.__doc__.replace("\n", " "))
        schema = {"title": cls._display_name, "description": class_description, "type": cls._json_data_type}
        return schema

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        return []


class RuntimeImage(ElyraOwnedProperty):
    """Container image used as execution environment."""

    image_name: str

    _property_id = RUNTIME_IMAGE
    _display_name = "Runtime Image"
    _json_data_type = "string"
    _generic = True
    _custom = False
    _required = True

    def __init__(self, **kwargs):
        self.image_name = kwargs.get("image_name", "").strip()

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> Optional[ElyraOwnedProperty]:
        """TODO"""
        return getattr(import_module(cls.__module__), cls.__name__)(image_name=prop_value)

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["required"] = True  # TODO handle required differently
        schema["uihints"] = {"items": []}
        return schema

    def get_all_validation_errors(self) -> Optional[str]:
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


class ElyraOwnedPropertyList(list):
    """
    TODO
    """

    @staticmethod
    def to_dict(property_list: List[ElyraOwnedPropertyListItem], use_prop_as_value: bool = False) -> Dict[str, str]:
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
    def merge(
        primary: List[ElyraOwnedPropertyList], secondary: List[ElyraOwnedPropertyList]
    ) -> List[ElyraOwnedPropertyList]:
        """
        Merge two lists of Elyra-owned properties, preferring the values given in the
        primary parameter in the case of a matching key between the two lists.
        """
        primary_dict = ElyraOwnedPropertyList.to_dict(primary, use_prop_as_value=True)
        secondary_dict = ElyraOwnedPropertyList.to_dict(secondary, use_prop_as_value=True)

        merged_list = list({**secondary_dict, **primary_dict}.values())
        return ElyraOwnedPropertyList(merged_list)

    @staticmethod
    def difference(
        minuend: List[ElyraOwnedPropertyList], subtrahend: List[ElyraOwnedPropertyList]
    ) -> List[ElyraOwnedPropertyList]:
        """
        Given two lists of Elyra-owned properties, remove any duplicate instances
        found in the second (subtrahend) from the first (minuend), if present.

        :param minuend: list to be subtracted from
        :param subtrahend: list from which duplicates will be determined and given preference

        :returns: the difference of the two lists
        """
        subtract_dict = ElyraOwnedPropertyList.to_dict(minuend)
        for key in ElyraOwnedPropertyList.to_dict(subtrahend).keys():
            if key in subtract_dict:
                subtract_dict.pop(key)

        diff_list = list(subtract_dict.values())
        return ElyraOwnedPropertyList(diff_list)


class ElyraOwnedPropertyListItem(ElyraOwnedProperty):
    """
    TODO
    """

    _property_id: str
    _display_name: str
    _json_data_type: str
    _generic: bool
    _custom: bool
    _required: bool = False
    _keys: List[str]
    _ui_placeholder: str

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["items"] = {"type": "string"}
        schema["uihints"] = {"items": {"ui:placeholder": cls._ui_placeholder}}
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
                prop_key += f"{key_part}:"
        return prop_key

    def get_value_for_dict_entry(self) -> str:
        """Returns the value to be used when constructing a dict from a list of classes."""
        return self.to_str()

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        return []


class EnvironmentVariable(ElyraOwnedPropertyListItem):
    """
    Environment variables to be set on the execution environment.
    """

    env_var: str
    value: str

    _property_id = ENV_VARIABLES
    _display_name = "Environment Variables"
    _json_data_type = "array"
    _generic = True
    _custom = False
    _keys = ["env_var"]
    _ui_placeholder = "env_var=VALUE"

    def __init__(self, **kwargs):
        self.env_var = kwargs.get("env_var", "").strip()
        self.value = kwargs.get("value", "").strip()

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> Optional[ElyraOwnedProperty]:
        """TODO"""
        str_parts = prop_value.split("=", 1)
        env_var, value = (str_parts + [""] * 2)[:2]
        return getattr(import_module(cls.__module__), cls.__name__)(
            env_var=env_var, value=value
        )  # TODO maybe change these back to dataclasses?

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["uihints"]["canRefresh"] = True
        return schema

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.env_var}={self.value}"

    def get_value_for_dict_entry(self) -> str:
        """Returns the value to be used when constructing a dict from a list of classes."""
        return self.value

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not self.env_var or not self.value:
            validation_errors.append("Property has an improperly formatted env variable key value pair.")

        return validation_errors


class KubernetesSecret(ElyraOwnedPropertyListItem):
    """
    TODO
    """

    env_var: str
    name: str
    key: str

    _property_id = KUBERNETES_SECRETS
    _display_name = "Kubernetes Secrets"
    _json_data_type = "array"
    _generic = True
    _custom = False
    _keys = ["env_var"]
    _ui_placeholder = "env_var=secret-name:secret-key"

    def __init__(self, **kwargs):
        self.env_var = kwargs.pop("env_var", "").strip()
        self.name = kwargs.pop("name", "").strip()
        self.key = kwargs.pop("key", "").strip()

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> Optional[ElyraOwnedProperty]:
        """TODO"""
        env_var, value = prop_value.split("=", 1)
        value_parts = value.split(":")
        name, key = (value_parts + [""] * 2)[:2]
        return getattr(import_module(cls.__module__), cls.__name__)(env_var=env_var, name=name, key=key)

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.env_var}={self.name}:{self.key}"

    def get_all_validation_errors(self) -> Optional[str]:
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


class VolumeMount(ElyraOwnedPropertyListItem):
    """
    TODO
    """

    path: str
    pvc_name: str

    _property_id = MOUNTED_VOLUMES
    _display_name = "Data Volumes"
    _json_data_type = "array"
    _generic = True
    _custom = True
    _keys = ["path"]
    _ui_placeholder = "/mount/path=pvc-name"

    def __init__(self, **kwargs):
        self.path = f"/{kwargs.pop('path', '').strip('/')}"
        self.pvc_name = kwargs.pop("pvc_name", "").strip()

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> Optional[ElyraOwnedProperty]:
        """TODO"""
        str_parts = prop_value.split("=", 1)
        path, pvc_name = (str_parts + [""] * 2)[:2]
        return getattr(import_module(cls.__module__), cls.__name__)(path=path, pvc_name=pvc_name)

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.path}={self.pvc_name}"

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        # Ensure the PVC name is syntactically a valid Kubernetes resource name
        if not is_valid_kubernetes_resource_name(self.pvc_name):
            validation_errors.append(f"PVC name '{self.pvc_name}' is not a valid Kubernetes resource name.")

        return validation_errors


class KubernetesAnnotation(ElyraOwnedPropertyListItem):
    """
    TODO
    """

    key: str
    value: str

    _property_id = KUBERNETES_POD_ANNOTATIONS
    _display_name = "Kubernetes Pod Annotations"
    _json_data_type = "array"
    _generic = True
    _custom = True
    _keys = ["key"]
    _ui_placeholder = "annotation_key=annotation_value"

    def __init__(self, **kwargs):
        self.key = kwargs.pop("key", "").strip()
        self.value = kwargs.pop("value", "").strip()

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> Optional[ElyraOwnedProperty]:
        """TODO"""
        str_parts = prop_value.split("=", 1)
        key, value = (str_parts + [""] * 2)[:2]
        return getattr(import_module(cls.__module__), cls.__name__)(key=key, value=value)

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.key}={self.value}"

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not is_valid_annotation_key(self.key):
            validation_errors.append(f"'{self.key}' is not a valid Kubernetes annotation key.")

        return validation_errors


class KubernetesToleration(ElyraOwnedPropertyListItem):
    """
    TODO
    """

    key: str
    operator: str
    value: Optional[str]
    effect: str = "Exists"

    _property_id = KUBERNETES_TOLERATIONS
    _display_name = "Kubernetes Tolerations"
    _json_data_type = "array"
    _generic = True
    _custom = True
    _keys = ["key", "operator", "value", "effect"]
    _ui_placeholder = "key:operator:value:effect"

    def __init__(self, **kwargs):
        self.key = kwargs.pop("key", "").strip()
        self.operator = kwargs.pop("operator", "").strip()
        self.value = kwargs.pop("value", "").strip()
        self.effect = kwargs.pop("effect", "Exists").strip()

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> Optional[ElyraOwnedProperty]:
        """TODO"""
        parts = prop_value.split(":")
        key, operator, value, effect = (parts + [""] * 4)[:4]
        return getattr(import_module(cls.__module__), cls.__name__)(
            key=key, operator=operator, value=value, effect=effect
        )

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.key}:{self.operator}:{self.value}:{self.effect}"

    def get_all_validation_errors(self) -> Optional[str]:
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


class DataClassJSONEncoder(json.JSONEncoder):
    """
    A JSON Encoder class to prevent errors during serialization of dataclasses.
    TODO rename
    """

    def default(self, o):
        """
        Render dataclass content as dict
        """
        if isinstance(o, ElyraOwnedProperty):
            return o.__dict__
        return super().default(o)
