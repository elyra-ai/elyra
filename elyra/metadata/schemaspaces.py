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

# Holds schemaspace instances for
# Runtimes, RuntimeImages, CodeSnippets and ComponentRegistries
# and the entrypoint class for schemaspaces (ElyraSchemaspaces)
# ElyraSchemaspaces.get_schemaspaces() would return a list of instances of
# RuntimesSchemaspace, RuntimeImagesSchemaspace, CodeSnippetsSchemaspace and ComponentRegistriesSchemaspace
# - all of which derive from SchemaspaceBase.
# ElyraSchemaspaces would NOT be a subclass of SchemaspaceBase
# it just needs to serve the various instances associated with the entrypoint


# Schemaspace:
# the result of the entrypoint load is a schemaspace
# and require that elyra register all 4 schemaspaces as entrypoints.
# The only requirement is that the schemaspace be a subclass of MetadataSchemaspace.

import uuid

from elyra.metadata.schemaspace import Schemaspace


class Runtimes(Schemaspace):
    RUNTIMES_SCHEMASPACE_ID = uuid.uuid4()

    def __init__(self, *args, **kwargs):
        self._id = self.RUNTIMES_SCHEMASPACE_ID
        self._name = "Runtimes"
        self._description = "Schemaspace for instances of Elyra runtime configurations"


class RuntimeImages(Schemaspace):
    RUNTIME_IMAGES_SCHEMASPACE_ID = uuid.uuid4()

    def __init__(self, *args, **kwargs):
        self._id = self.RUNTIME_IMAGES_SCHEMASPACE_ID
        self._name = "Runtime Images"
        self._description = "Schemaspace for instances of Elyra runtime images configurations"


class CodeSnippets(Schemaspace):
    CODE_SNIPPETS_SCHEMASPACE_ID = uuid.uuid4()

    def __init__(self, *args, **kwargs):
        self._id = self.CODE_SNIPPETS_SCHEMASPACE_ID
        self._name = "Code Snippets"
        self._description = "Schemaspace for instances of Elyra code snippets configurations"


class ComponentRegistries(Schemaspace):
    COMPONENT_REGISTRIES_SCHEMASPACE_ID = uuid.uuid4()

    def __init__(self, *args, **kwargs):
        self._id = self.COMPONENT_REGISTRIES_SCHEMASPACE_ID
        self._name = "Component Registries"
        self._description = "Schemaspace for instances of Elyra component resgistries configurations"
