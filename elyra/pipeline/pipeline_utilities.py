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
from dataclasses import asdict as dataclass_asdict
from dataclasses import dataclass
from dataclasses import is_dataclass
import json
from typing import Dict


class KeyValueList(list):
    """
    A list class that exposes functionality specific to lists whose entries are
    key-value pairs separated by a pre-defined character.
    """

    _key_value_separator: str = "="

    def to_dict(self) -> Dict[str, str]:
        """
        Properties consisting of key-value pairs are stored in a list of separated
        strings, while most processing steps require a dictionary - so we must convert.
        If no key/value pairs are specified, an empty dictionary is returned, otherwise
        pairs are converted to dictionary entries, stripped of whitespace, and returned.
        """
        kv_dict = {}
        for kv in self:
            if not kv:
                continue

            if self._key_value_separator not in kv:
                raise ValueError(
                    f"Property {kv} does not contain the expected "
                    f"separator character: '{self._key_value_separator}'."
                )

            key, value = kv.split(self._key_value_separator, 1)

            key = key.strip()
            if not key:
                # Invalid entry; skip inclusion and continue
                continue

            if isinstance(value, str):
                value = value.strip()
            if not value:
                # Invalid entry; skip inclusion and continue
                continue

            kv_dict[key] = value
        return kv_dict

    @classmethod
    def to_str(cls, key: str, value: str) -> str:
        return f"{key}{cls._key_value_separator}{value}"

    @classmethod
    def from_dict(cls, kv_dict: Dict) -> "KeyValueList":
        """
        Convert a set of key-value pairs stored in a dictionary to
        a KeyValueList of strings with the defined separator.
        """
        str_list = [KeyValueList.to_str(key, value) for key, value in kv_dict.items()]
        return KeyValueList(str_list)

    @classmethod
    def merge(cls, primary: "KeyValueList", secondary: "KeyValueList") -> "KeyValueList":
        """
        Merge two key-value pair lists, preferring the values given in the
        primary parameter in the case of a matching key between the two lists.
        """
        primary_dict = primary.to_dict()
        secondary_dict = secondary.to_dict()

        return KeyValueList.from_dict({**secondary_dict, **primary_dict})

    @classmethod
    def difference(cls, minuend: "KeyValueList", subtrahend: "KeyValueList") -> "KeyValueList":
        """
        Given KeyValueLists, convert to dictionaries and remove any keys found in the
        second (subtrahend) from the first (minuend), if present.

        :param minuend: list to be subtracted from
        :param subtrahend: list whose keys will be removed from the minuend

        :returns: the difference of the two lists
        """
        subtract_dict = minuend.to_dict()
        for key in subtrahend.to_dict().keys():
            if key in subtract_dict:
                subtract_dict.pop(key)

        return KeyValueList.from_dict(subtract_dict)


@dataclass
class VolumeMount:
    path: str
    pvc_name: str


@dataclass
class KubernetesSecret:
    env_var: str
    name: str
    key: str


class DataClassJSONEncoder(json.JSONEncoder):
    """
    A JSON Encoder class to prevent errors during serialization of dataclasses.
    """

    def default(self, o):
        """
        Render dataclass content as dict
        """
        if is_dataclass(o):
            return dataclass_asdict(o)
        return super().default(o)
