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

from typing import Any

from elyra.metadata.manager import MetadataManager
from elyra.pipeline.runtimes_metadata import RuntimesMetadata
from elyra.util.gitutil import SupportedGitTypes


class AirflowMetadata(RuntimesMetadata):
    """
    Applies changes specific to the Airflow schema
    """

    def on_load(self, **kwargs: Any) -> None:
        super().on_load(**kwargs)

        update_required = False

        if self.metadata.get("git_type") is None:
            # Inject git_type property for metadata persisted using Elyra < 3.5:
            self.metadata["git_type"] = SupportedGitTypes.GITHUB.name
            update_required = True

        if self.metadata.get("cos_auth_type") is None:
            # Inject cos_auth_type property for metadata persisted using Elyra < 3.4:
            # - cos_username and cos_password must be present
            # - cos_secret may be present (above statement also applies in this case)
            if self.metadata.get("cos_username") and self.metadata.get("cos_password"):
                if len(self.metadata.get("cos_secret", "")) == 0:
                    self.metadata["cos_auth_type"] = "USER_CREDENTIALS"
                else:
                    self.metadata["cos_auth_type"] = "KUBERNETES_SECRET"
                update_required = True

        if update_required:
            # save changes
            MetadataManager(schemaspace="runtimes").update(self.name, self, for_migration=True)

        return None

    def pre_save(self, **kwargs: Any) -> None:
        """
        This method enforces conditional constraints related to
        COS authentication type properties.
        TODO: Remove after https://github.com/elyra-ai/elyra/issues/2338 was resolved.
        """
        super().pre_save(**kwargs)

        if self.metadata.get("cos_auth_type") is None:
            # nothing to do
            return

        if self.metadata["cos_auth_type"] == "USER_CREDENTIALS":
            if (
                len(self.metadata.get("cos_username", "").strip()) == 0
                or len(self.metadata.get("cos_password", "").strip()) == 0
            ):
                raise ValueError(
                    "A username and password are required " "for the selected Object Storage authentication type."
                )
            if len(self.metadata.get("cos_secret", "").strip()) > 0:
                raise ValueError(
                    "Kubernetes secrets are not supported " "for the selected Object Storage authentication type."
                )
        elif self.metadata["cos_auth_type"] == "KUBERNETES_SECRET":
            if (
                len(self.metadata.get("cos_username", "").strip()) == 0
                or len(self.metadata.get("cos_password", "").strip()) == 0
                or len(self.metadata.get("cos_secret", "").strip()) == 0
            ):
                raise ValueError(
                    "Username, password, and Kubernetes secret are required "
                    "for the selected Object Storage authentication type."
                )
        elif self.metadata["cos_auth_type"] == "AWS_IAM_ROLES_FOR_SERVICE_ACCOUNTS":
            if (
                len(self.metadata.get("cos_username", "").strip()) > 0
                or len(self.metadata.get("cos_password", "").strip()) > 0
                or len(self.metadata.get("cos_secret", "").strip()) > 0
            ):
                raise ValueError(
                    "Username, password, and Kubernetes secret are not supported "
                    "for the selected Object Storage authentication type."
                )
