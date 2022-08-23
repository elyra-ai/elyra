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

from importlib import import_module
import json
import re
from textwrap import dedent
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

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
    def all_subclasses(cls) -> set:
        """Get all nested subclasses for a class."""
        # TODO type hint
        return set(cls.__subclasses__()).union([s for c in cls.__subclasses__() for s in c.all_subclasses()])

    @classmethod
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any):
        """Create an instance of a class with the given property id using the user-entered raw value."""
        # TODO type hint
        for subclass in cls.all_subclasses():
            if getattr(subclass, "_property_id", "") == prop_id:
                return subclass.create_instance_from_raw_value(prop_id, prop_value)
        return None

    @classmethod
    def get_classes_for_component_type(cls, component_type: str):
        """
        Retrieve subclasses that apply to the given component type
        (e.g., if the class attribute _<component_type> is True).
        """
        return [subclass for subclass in cls.all_subclasses() if getattr(subclass, f"_{component_type}", False)]

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Build the JSON schema for an Elyra-owned component property"""
        class_description = dedent(cls.__doc__.replace("\n", " "))
        schema = {"title": cls._display_name, "description": class_description, "type": cls._json_data_type}
        return schema

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        return []


class KfpElyraOwnedProperty(ElyraOwnedProperty):
    """
    TODO
    """

    @classmethod
    def add_to_container_op(cls, prop_id: str, prop_value: Any, container_op: ContainerOp) -> None:
        """Add relevant property info to a given KFP ContainerOp"""
        for subclass in cls.all_subclasses():
            if getattr(subclass, "_property_id", "") == prop_id:
                subclass.add_to_container_op(prop_id, prop_value, container_op)


class AirflowElyraOwnedProperty(ElyraOwnedProperty):
    """
    TODO
    """

    @classmethod
    def add_to_executor_config(cls, prop_id: str, prop_value: Any, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        for subclass in cls.all_subclasses():
            if getattr(subclass, "_property_id", "") == prop_id:
                subclass.add_to_executor_config(prop_id, prop_value, kubernetes_executor)


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
    def create_instance_from_raw_value(cls, prop_id: str, prop_value: Any) -> List[ElyraOwnedPropertyListItem]:
        """TODO"""
        instance_list = []
        for list_item in prop_value:
            env_var, value = (list_item.split("=", 1) + [""] * 2)[:2]
            instance_list.append(getattr(import_module(cls.__module__), cls.__name__)(env_var=env_var, value=value))
        return ElyraOwnedPropertyList(instance_list)

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


class KubernetesSecret(ElyraOwnedPropertyListItem, KfpElyraOwnedProperty, AirflowElyraOwnedProperty):
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
        instance_list = []
        for list_item in prop_value:
            env_var, value = list_item.split("=", 1)
            name, key = (value.split(":") + [""] * 2)[:2]
            instance_list.append(
                getattr(import_module(cls.__module__), cls.__name__)(env_var=env_var, name=name, key=key)
            )
        return ElyraOwnedPropertyList(instance_list)

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

    @classmethod
    def add_to_container_op(cls, prop_id: str, prop_value: Any, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        for secret in prop_value:  # Convert tuple entries to format kfp needs
            container_op.container.add_env_variable(
                V1EnvVar(
                    name=secret.env_var,
                    value_from=V1EnvVarSource(secret_key_ref=V1SecretKeySelector(name=secret.name, key=secret.key)),
                )
            )

    @classmethod
    def add_to_executor_config(cls, prop_id: str, prop_value: Any, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        kubernetes_executor["secrets"] = [
            {"deploy_type": "env", "deploy_target": secret.env_var, "secret": secret.name, "key": secret.key}
            for secret in prop_value
        ]


class VolumeMount(ElyraOwnedPropertyListItem, KfpElyraOwnedProperty, AirflowElyraOwnedProperty):
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
        instance_list = []
        for list_item in prop_value:
            path, pvc_name = (list_item.split("=", 1) + [""] * 2)[:2]
            instance_list.append(getattr(import_module(cls.__module__), cls.__name__)(path=path, pvc_name=pvc_name))
        return ElyraOwnedPropertyList(instance_list)

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

    @classmethod
    def add_to_container_op(cls, prop_id: str, prop_value: Any, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        unique_pvcs = []
        for volume in prop_value:
            if volume.pvc_name not in unique_pvcs:
                container_op.add_volume(
                    V1Volume(
                        name=volume.pvc_name,
                        persistent_volume_claim=V1PersistentVolumeClaimVolumeSource(claim_name=volume.pvc_name),
                    )
                )
                unique_pvcs.append(volume.pvc_name)
            container_op.container.add_volume(V1VolumeMount(mount_path=volume.path, name=volume.pvc_name))

    @classmethod
    def add_to_executor_config(cls, prop_id: str, prop_value: Any, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        kubernetes_executor["volumes"] = [
            {
                "name": volume.pvc_name,
                "persistentVolumeClaim": {"claimName": volume.pvc_name},
            }
            for volume in prop_value
        ]
        kubernetes_executor["volume_mounts"] = [
            {
                "mountPath": volume.path,
                "name": volume.pvc_name,
                "read_only": False,
            }
            for volume in prop_value
        ]


class KubernetesAnnotation(ElyraOwnedPropertyListItem, KfpElyraOwnedProperty, AirflowElyraOwnedProperty):
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
        instance_list = []
        for list_item in prop_value:
            key, value = (list_item.split("=", 1) + [""] * 2)[:2]
            instance_list.append(getattr(import_module(cls.__module__), cls.__name__)(key=key, value=value))
        return ElyraOwnedPropertyList(instance_list)

    def to_str(self) -> str:
        """Convert instance to a string representation."""
        return f"{self.key}={self.value}"

    def get_all_validation_errors(self) -> Optional[str]:
        """Perform custom validation on an instance."""
        validation_errors = []
        if not is_valid_annotation_key(self.key):
            validation_errors.append(f"'{self.key}' is not a valid Kubernetes annotation key.")

        return validation_errors

    @classmethod
    def add_to_container_op(cls, prop_id: str, prop_value: Any, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        unique_annotations = []
        for annotation in prop_value:
            if annotation.key not in unique_annotations:
                container_op.add_pod_annotation(annotation.key, annotation.value)
                unique_annotations.append(annotation.key)

    @classmethod
    def add_to_executor_config(cls, prop_id: str, prop_value: Any, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        for annotation in prop_value:
            kubernetes_executor["annotations"][annotation.key] = annotation.value


class KubernetesToleration(ElyraOwnedPropertyListItem, KfpElyraOwnedProperty, AirflowElyraOwnedProperty):
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
        instance_list = []
        for list_item in prop_value:
            key, operator, value, effect = (list_item.split(":") + [""] * 4)[:4]
            instance_list.append(
                getattr(import_module(cls.__module__), cls.__name__)(
                    key=key, operator=operator, value=value, effect=effect
                )
            )
        return ElyraOwnedPropertyList(instance_list)

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

    @classmethod
    def add_to_container_op(cls, prop_id: str, prop_value: Any, container_op: ContainerOp) -> None:
        """Add relevant property items to a given KFP ContainerOp"""
        unique_tolerations = []
        for toleration in prop_value:
            if toleration.to_str() not in unique_tolerations:
                container_op.add_toleration(
                    V1Toleration(
                        effect=toleration.effect,
                        key=toleration.key,
                        operator=toleration.operator,
                        value=toleration.value,
                    )
                )
                unique_tolerations.append(toleration.to_str())

    @classmethod
    def add_to_executor_config(cls, prop_id: str, prop_value: Any, kubernetes_executor: dict) -> None:
        """Add relevant property info to a given Airflow ExecutorConfig dict for an operation"""
        kubernetes_executor["tolerations"] = [
            {
                "key": toleration.key,
                "operator": toleration.operator,
                "value": toleration.value,
                "effect": toleration.effect,
            }
            for toleration in prop_value
        ]


class DataClassJSONEncoder(json.JSONEncoder):
    """
    A JSON Encoder class to prevent errors during serialization of dataclasses.
    TODO rename
    """

    def default(self, o):
        """
        Render dataclass content as dict
        """
        return o.__dict__ if isinstance(o, ElyraOwnedProperty) else super().default(o)
