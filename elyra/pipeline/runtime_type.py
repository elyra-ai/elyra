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
from typing import Any
from typing import Dict
from typing import List


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
    ######################################
    # Add new entry here for each new type
    ######################################

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


class RuntimePlatformInfo(object):
    """Base class for a runtime processor's information"""
    type: RuntimeProcessorType
    icon_endpoint: str
    file_types: List[Dict[str, str]]

    @classmethod
    def get_instance_by_type(cls, runtime_type: RuntimeProcessorType) -> 'RuntimePlatformInfo':
        if runtime_type == RuntimeProcessorType.KUBEFLOW_PIPELINES:
            return KubeflowPipelinesPlatformInfo()
        if runtime_type == RuntimeProcessorType.APACHE_AIRFLOW:
            return ApacheAirflowPlatformInfo()
        if runtime_type == RuntimeProcessorType.ARGO:
            return ArgoPlatformInfo()
        if runtime_type == RuntimeProcessorType.LOCAL:
            return LocalPlatformInfo()
        raise ValueError(f"Runtime type {runtime_type} is not recognized.")

    def to_dict(self) -> Dict[str, Any]:
        d = dict(name=self.type.name,
                 display_name=self.type.value,
                 icon=self.icon_endpoint,
                 file_types=self.file_types)
        return d


class ArgoPlatformInfo(RuntimePlatformInfo):
    """Holds static information relative to Argo processors """
    type = RuntimeProcessorType.ARGO
    icon_endpoint = "static/elyra/argo.svg"
    file_types = [{'name': 'py', 'display_name': 'Argo domain-specific language Python code'}]


class ApacheAirflowPlatformInfo(RuntimePlatformInfo):
    """Holds static information relative to Apache Airflow processors """
    type = RuntimeProcessorType.APACHE_AIRFLOW
    icon_endpoint = "static/elyra/airflow.svg"
    file_types = [{'name': 'py', 'display_name': 'Airflow domain-specific language Python code'}]


class KubeflowPipelinesPlatformInfo(RuntimePlatformInfo):
    """Holds static information relative to Kubeflow Pipelines processors """
    type = RuntimeProcessorType.KUBEFLOW_PIPELINES
    icon_endpoint = "static/elyra/kubeflow.svg"
    file_types = [
        {'name': 'py', 'display_name': 'KFP domain-specific language Python code'},
        {'name': 'yaml', 'display_name': 'KFP static configuration file (YAML formatted)'}
    ]


class LocalPlatformInfo(RuntimePlatformInfo):
    """Holds static information relative to local processors """
    type = RuntimeProcessorType.LOCAL
    icon_endpoint = "static/elyra/pipeline-flow.svg"
    file_types = []

###########################################################
# Add new platform info definitions here for each new type
###########################################################
