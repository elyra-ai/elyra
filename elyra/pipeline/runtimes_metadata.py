#
# Copyright 2018-2023 Elyra Authors
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
from logging import getLogger
from typing import Any

from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata


class RuntimesMetadata(Metadata):
    """
    This class will be instantiated for any instance for a schema within the
    Runtimes schemaspace.
    """

    def on_load(self, **kwargs: Any) -> None:
        """Perform any necessary adjustments, migrations when instance is loaded."""

        # If there's no runtime_type property in the instance metadata, infer from schema_name
        if "runtime_type" not in self.metadata:
            if self.schema_name == "kfp":
                self.metadata["runtime_type"] = "KUBEFLOW_PIPELINES"
            elif self.schema_name == "airflow":
                self.metadata["runtime_type"] = "APACHE_AIRFLOW"
            elif self.schema_name == "argo":
                self.metadata["runtime_type"] = "ARGO"
            else:
                raise ValueError(f"Unknown Runtimes schema name detected: '{self.schema_name}'!  Skipping...")

            getLogger("ServerApp").info(
                f"Upgrading runtime {self.schema_name} instance '{self.name}' "
                f"to include runtime_type '{self.metadata['runtime_type']}'..."
            )
            MetadataManager(schemaspace="runtimes").update(self.name, self, for_migration=True)
