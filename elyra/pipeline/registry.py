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
import os
from typing import Dict
from typing import List
from typing import Optional
from typing import Set

import entrypoints
from traitlets.config import default
from traitlets.config import List as ListTrait
from traitlets.config import SingletonConfigurable

from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.pipeline.runtime_type import RuntimeTypeResources
from elyra.util.path import get_expanded_path


class PipelineProcessorRegistry(SingletonConfigurable):
    _processors: Dict[str, object]  # Map processor name to pipeline processor instance

    # Runtimes
    runtimes_env = "ELYRA_PROCESSOR_RUNTIMES"
    runtimes = ListTrait(
        default_value=None,
        config=True,
        allow_none=True,
        help="""The runtimes to use during this Elyra instance.  (env ELYRA_PROCESSOR_RUNTIMES)""",
    )

    @default("runtimes")
    def _runtimes_default(self) -> Optional[List[str]]:
        env_value = os.getenv(self.runtimes_env)
        if env_value:
            return env_value.replace(" ", "").split(",")
        return None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        root_dir: Optional[str] = kwargs.pop("root_dir", None)
        self.root_dir = get_expanded_path(root_dir)
        self._processors = {}
        # Register all known processors based on entrypoint configuration
        for processor in entrypoints.get_group_all("elyra.pipeline.processors"):
            try:
                # instantiate an actual instance of the processor
                if not self.runtimes or processor.name in self.runtimes:
                    processor_instance = processor.load()(root_dir=self.root_dir, parent=kwargs.get("parent"))
                    self._add_processor(processor_instance)
                else:
                    self.log.info(
                        f"Although runtime '{processor.name}' is installed, it is not in the set of "
                        f"configured runtimes {self.runtimes} and will not be available."
                    )
            except Exception as err:
                # log and ignore initialization errors
                self.log.error(
                    f"Error registering {processor.name} processor "
                    f'"{processor.module_name}.{processor.object_name}" - {err}'
                )

    def _add_processor(self, processor_instance):
        self.log.info(
            f"Registering {processor_instance.name} processor "
            f"'{processor_instance.__class__.__module__}.{processor_instance.__class__.__name__}'..."
        )
        self._processors[processor_instance.name] = processor_instance

    def get_processor(self, processor_name: str):
        if self.is_valid_processor(processor_name):
            return self._processors[processor_name]
        else:
            raise RuntimeError(f"Could not find pipeline processor '{processor_name}'")

    def get_all_processors(self) -> List:
        return list(self._processors.values())

    def is_valid_processor(self, processor_name: str) -> bool:
        return processor_name in self._processors.keys()

    def is_valid_runtime_type(self, runtime_type_name: str) -> bool:
        for processor in self._processors.values():
            if processor.type.name == runtime_type_name.upper():
                return True
        return False

    def get_runtime_types_resources(self) -> List[RuntimeTypeResources]:
        """Returns the set of resource instances for each active runtime type"""

        # Build set of active runtime types, then build list of resources instances
        runtime_types: Set[RuntimeProcessorType] = set()
        enabled_runtimes: Set[RuntimeProcessorType] = set()  # Track which runtimes are enabled
        for name, processor in self._processors.items():
            runtime_types.add(processor.type)
            enabled_runtimes.add(processor.type)

        # Unconditionally include "generic" resources since, to this point, all non-local runtimes
        # also support generic components, so we need their resources on the frontend, despite the
        # fact that the "local runtime" may not be enabled.  When it is not enabled, it won't be in
        # the runtime_types list, so, in that case, we add it, but not mark it as an enabled runtime.
        if RuntimeProcessorType.LOCAL not in runtime_types:
            runtime_types.add(RuntimeProcessorType.LOCAL)

        resources: List[RuntimeTypeResources] = list()
        for runtime_type in runtime_types:
            resources.append(
                RuntimeTypeResources.get_instance_by_type(
                    runtime_type, runtime_enabled=(runtime_type in enabled_runtimes)
                )
            )

        return resources
