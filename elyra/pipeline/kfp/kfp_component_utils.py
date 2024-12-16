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

component_yaml_schema = {
    "properties": {
        "name": {"type": "string"},
        "description": {"type": ["string", "null"]},
        "inputs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": ["string", "null"]},
                    "type": {"type": ["string", "null"]},
                    "optional": {"type": ["boolean", "null"]},
                },
            },
            "required": ["name"],
        },
        "outputs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": ["string", "null"]},
                    "type": {"type": ["string", "null"]},
                    "optional": {"type": ["boolean", "null"]},
                },
            },
            "required": ["name"],
        },
        "implementation": {
            "type": "object",
            "properties": {
                "container": {
                    "type": "object",
                    "properties": {
                        "image": {"type": "string"},
                        "command": {"type": "array", "items": {"type": ["string", "object"]}},
                        "args": {"type": "array", "items": {"type": ["string", "object"]}},
                    },
                }
            },
        },
    }
}
