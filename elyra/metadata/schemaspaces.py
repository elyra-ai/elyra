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

from elyra.metadata.schemaspace import Schemaspace


class Runtimes(Schemaspace):
    RUNTIMES_SCHEMASPACE_ID = "ce74fbbb-6953-4c23-869e-c0d50a33edb9"

    def __init__(self, *args, **kwargs):
        super().__init__(schemaspace_id=self.RUNTIMES_SCHEMASPACE_ID,
                         name="Runtimes",
                         description="Schemaspace for instances of Elyra runtime configurations")


class RuntimeImages(Schemaspace):
    RUNTIME_IMAGES_SCHEMASPACE_ID = "119c9740-d73f-48c6-a97a-599d3acaf41d"

    def __init__(self, *args, **kwargs):
        super().__init__(schemaspace_id=self.RUNTIME_IMAGES_SCHEMASPACE_ID,
                         name="Runtimes",
                         description="Schemaspace for instances of Elyra runtime images configurations")


class CodeSnippets(Schemaspace):
    CODE_SNIPPETS_SCHEMASPACE_ID = "aa60988f-8f7c-4d09-a243-c54ef9c2f7fb"

    def __init__(self, *args, **kwargs):
        def __init__(self, *args, **kwargs):
            super().__init__(schemaspace_id=self.CODE_SNIPPETS_SCHEMASPACE_ID,
                             name="Code Snippets",
                             description="Schemaspace for instances of Elyra code snippets configurations")


class ComponentRegistries(Schemaspace):
    COMPONENT_REGISTRIES_SCHEMASPACE_ID = "ae79159a-489d-4656-83a6-1adfbc567c70"

    def __init__(self, *args, **kwargs):
        def __init__(self, *args, **kwargs):
            super().__init__(schemaspace_id=self.COMPONENT_REGISTRIES_SCHEMASPACE_ID,
                             name="Component Registries",
                             description="Schemaspace for instances of Elyra component registries configurations")
