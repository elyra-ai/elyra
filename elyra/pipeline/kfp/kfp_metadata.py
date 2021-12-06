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
from elyra.pipeline.kfp.kfp_authentication import SupportedAuthProviders
from elyra.pipeline.runtimes_metadata import RuntimesMetadata


class KfpMetadata(RuntimesMetadata):
    """
    Applies changes specific to the kfp schema
    """

    def on_load(self, **kwargs: Any) -> None:
        super().on_load(**kwargs)

        if self.metadata.get('auth_type') is None:
            # Inject auth_type property for metadata persisted using Elyra < 3.3:
            # - api_username and api_password present -> use DEX Legacy
            # - otherwise -> use no authentication type
            if self.metadata.get('api_username') is None or\
               len(self.metadata.get('api_username').strip()) == 0 or\
               self.metadata.get('api_password') is None or\
               len(self.metadata.get('api_password').strip()) == 0:
                self.metadata['auth_type'] = SupportedAuthProviders.NO_AUTHENTICATION.name
            else:
                self.metadata['auth_type'] = SupportedAuthProviders.DEX_LEGACY.name

            # save changes
            MetadataManager(schemaspace="runtimes").update(self.name, self, for_migration=True)

        return None
