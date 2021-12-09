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

from typing import Any

from elyra.metadata.manager import MetadataManager
from elyra.pipeline.runtimes_metadata import RuntimesMetadata


class AirflowMetadata(RuntimesMetadata):
    """
    Applies changes specific to the kfp schema
    """

    def on_load(self, **kwargs: Any) -> None:
        super().on_load(**kwargs)

        if self.metadata.get('cos_auth_type') is None:
            # Inject cos_auth_type property for metadata persisted using Elyra < 3.4:
            # - cos_username and cos_password must be present
            # - cos_secret may be present (above statement also applies in this case)
            if self.metadata.get('cos_username') and\
               self.metadata.get('cos_password'):
                if len(self.metadata.get('cos_secret', '')) == 0:
                    self.metadata['cos_auth_type'] = 'USER_CREDENTIALS'
                else:
                    self.metadata['cos_auth_type'] = 'KUBERNETES_SECRET'

            # save changes
            MetadataManager(schemaspace="runtimes").update(self.name, self, for_migration=True)

        return None
