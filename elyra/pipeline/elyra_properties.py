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
from textwrap import dedent
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from traitlets import import_item

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
    def create_instance(cls, property_id: str, property_value: Any) -> Optional[ElyraOwnedProperty]:
        """Class method that creates the appropriate instance of ElyraOwnedProperty based on inputs."""
        for subclass in cls.__subclasses__():
            if getattr(subclass, "_property_id", "") == property_id:
                subclass_module = import_item(subclass.__module__)
                return getattr(subclass_module, subclass.__name__)(property_value)
            for sub_subclass in subclass.__subclasses__():
                if getattr(sub_subclass, "_property_id", "") == property_id:
                    subclass_module = import_item(sub_subclass.__module__)
                    return getattr(subclass_module, sub_subclass.__name__)(**property_value)
        return None

    @classmethod
    def get_classes_for_component_type(cls, component_type: str):
        """
        Retrieve subclasses that apply to the given component type
        (if the class attribute _<component_type> is True).
        """
        dataclass_params = []
        for subclass in cls.__subclasses__():
            if getattr(subclass, f"_{component_type}", False) is True:
                dataclass_params.append(subclass)
            for sub_subclass in subclass.__subclasses__():
                if getattr(sub_subclass, f"_{component_type}", False) is True:
                    dataclass_params.append(sub_subclass)

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


class RuntimeImage(ElyraOwnedProperty, str):
    """Container image used as execution environment."""

    _property_id = RUNTIME_IMAGE
    _display_name = "Runtime Image"
    _json_data_type = "string"
    _generic = True
    _custom = False
    _required = True

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["required"] = True  # TODO handle required differently
        schema["uihints"] = {"items": []}
        return schema


class ElyraOwnedListProperty(ElyraOwnedProperty):
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

    @staticmethod
    def is_list_property(property_list: Optional[list] = None) -> bool:
        """
        Determines whether a list consists of all ElyraOwnedListProperty instances.
        """
        if not property_list:
            return False

        return all(isinstance(prop, ElyraOwnedListProperty) for prop in property_list)

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        class_description = dedent(cls.__doc__.replace("\n", " "))

        schema = {
            "title": cls._display_name,
            "description": class_description,
            "type": cls._json_data_type,
            "items": {"type": "string"},
            "uihints": {"items": {}},
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
                prop_key += f"{key_part}:"
        return prop_key

    def get_value_for_dict_entry(self) -> str:
        """Returns the value to be used when constructing a dict from a list of classes."""
        return self.to_str()

    @staticmethod
    def to_dict(property_list: List[ElyraOwnedListProperty], use_prop_as_value: bool = False) -> Dict[str, str]:
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
        primary: List[ElyraOwnedListProperty], secondary: List[ElyraOwnedListProperty]
    ) -> List[ElyraOwnedListProperty]:
        """
        Merge two lists of Elyra-owned properties, preferring the values given in the
        primary parameter in the case of a matching key between the two lists.
        """
        primary_dict = ElyraOwnedListProperty.to_dict(primary, use_prop_as_value=True)
        secondary_dict = ElyraOwnedListProperty.to_dict(secondary, use_prop_as_value=True)

        merged_list = list({**secondary_dict, **primary_dict}.values())
        return merged_list

    @staticmethod
    def difference(
        minuend: List[ElyraOwnedListProperty], subtrahend: List[ElyraOwnedListProperty]
    ) -> List[ElyraOwnedListProperty]:
        """
        Given two lists of Elyra-owned properties, remove any duplicate instances
        found in the second (subtrahend) from the first (minuend), if present.

        :param minuend: list to be subtracted from
        :param subtrahend: list from which duplicates will be determined and given preference

        :returns: the difference of the two lists
        """
        subtract_dict = ElyraOwnedListProperty.to_dict(minuend)
        for key in ElyraOwnedListProperty.to_dict(subtrahend).keys():
            if key in subtract_dict:
                subtract_dict.pop(key)

        diff_list = list(subtract_dict.values())
        return diff_list


class EnvironmentVariable(ElyraOwnedListProperty):
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
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["uihints"]["canRefresh"] = True
        schema["uihints"]["items"]["ui:placeholder"] = cls._ui_placeholder
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


class KubernetesSecret(ElyraOwnedListProperty):
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
        self.key = kwargs.pop("key", "").strip()
        self.value = kwargs.pop("value", "").strip()

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["uihints"]["items"]["ui:placeholder"] = cls._ui_placeholder

        return schema

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.key}={self.value}"

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


class VolumeMount(ElyraOwnedListProperty):
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
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["uihints"]["items"]["ui:placeholder"] = cls._ui_placeholder
        return schema

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


class KubernetesAnnotation(ElyraOwnedListProperty):
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
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["uihints"]["items"]["ui:placeholder"] = cls._ui_placeholder
        return schema

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.key}={self.value}"

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not is_valid_annotation_key(self.key):
            validation_errors.append(f"'{self.key}' is not a valid Kubernetes annotation key.")

        return validation_errors


class KubernetesToleration(ElyraOwnedListProperty):
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
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        schema = super().get_schema()
        schema["uihints"]["items"]["ui:placeholder"] = cls._ui_placeholder
        return schema

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
    """

    def default(self, o):
        """
        Render dataclass content as dict
        """
        # if is_dataclass(o):
        #    return dataclass_asdict(o)
        if isinstance(o, ElyraOwnedProperty):
            return o.__dict__
        return super().default(o)
