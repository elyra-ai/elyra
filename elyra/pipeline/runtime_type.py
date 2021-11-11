#
# Copyright 2018-2021 Elyra Authors
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
from enum import Enum
from enum import unique


@unique
class RuntimeProcessorType(Enum):
    """RuntimeProcessorType enumerates the set of platforms targeted by runtime processors.

    Each runtime processor implementation (subclass of PipelineProcessor) will reflect one
    of these values.  Users implementing their own runtime processor that corresponds to a
    type not listed in this enumeration are responsible for appropriately extending this
    enumeration and reflecting that entry in the corresponding runtime schema in order to
    fully integrate their processor with Elyra.
    """
    LOCAL = 'Local'
    KUBEFLOW_PIPELINES = 'Kubeflow Pipelines'
    APACHE_AIRFLOW = 'Apache Airflow'
    ARGO = 'Argo'

    @staticmethod
    def get_instance_by_name(name: str) -> 'RuntimeProcessorType':
        """Returns an instance of RuntimeProcessorType corresponding to the given name.

        Raises KeyError if parameter is not a name in the enumeration.
        """
        return RuntimeProcessorType.__members__[name]

    @staticmethod
    def get_instance_by_value(value: str) -> 'RuntimeProcessorType':
        """Returns an instance of RuntimeProcessorType corresponding to the given value.

        Raises KeyError if parameter is not a value in the enumeration.
        """
        for instance in RuntimeProcessorType.__members__.values():
            if instance.value == value:
                return instance
        raise KeyError(f"'{value}'")
