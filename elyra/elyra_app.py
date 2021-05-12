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
import os

from jupyter_server.extension.application import ExtensionApp
from jupyter_server.extension.application import ExtensionAppJinjaMixin

from elyra._version import __version__
from elyra.api.handlers import YamlSpecHandler
from elyra.contents.handlers import ContentHandler
from elyra.metadata.handlers import MetadataHandler
from elyra.metadata.handlers import MetadataResourceHandler
from elyra.metadata.handlers import NamespaceHandler
from elyra.metadata.handlers import SchemaHandler
from elyra.metadata.handlers import SchemaResourceHandler
from elyra.metadata.manager import MetadataManager
from elyra.metadata.schema import SchemaManager
from elyra.metadata.storage import FileMetadataCache
from elyra.pipeline.handlers import PipelineComponentHandler
from elyra.pipeline.handlers import PipelineComponentPropertiesHandler
from elyra.pipeline.handlers import PipelineExportHandler
from elyra.pipeline.handlers import PipelineSchedulerHandler
from elyra.pipeline.handlers import PipelineValidationHandler
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.processor import PipelineProcessorRegistry
from elyra.pipeline.validate import PipelineValidationManager


DEFAULT_STATIC_FILES_PATH = os.path.join(os.path.dirname(__file__), "static")
DEFAULT_TEMPLATE_FILES_PATH = os.path.join(os.path.dirname(__file__), "templates")


class ElyraApp(ExtensionAppJinjaMixin, ExtensionApp):

    # The name of the extension.
    name = "elyra"
    version = __version__
    description = "Elyra Server"
    extension_url = '/lab'
    load_other_extensions = True

    classes = [FileMetadataCache, MetadataManager, PipelineProcessor]

    # Local path to static files directory.
    # static_paths = [
    #     DEFAULT_STATIC_FILES_PATH
    # ]

    # Local path to templates directory.
    # template_paths = [
    #     DEFAULT_TEMPLATE_FILES_PATH
    # ]

    # Define ElyraApp configurables here..

    def initialize_handlers(self):
        namespace_regex = r"(?P<namespace>[\w\.\-]+)"
        resource_regex = r"(?P<resource>[\w\.\-]+)"
        path_regex = r"(?P<path>[\w\.\/\-\%]+)"
        processor_regex = r"(?P<processor>[\w]+)"
        component_regex = r"(?P<component_id>[\w\.\-]+)"

        self.handlers.extend([
            (f'/{self.name}/{YamlSpecHandler.get_resource_metadata()[0]}', YamlSpecHandler),
            (f'/{self.name}/metadata/{namespace_regex}', MetadataHandler),
            (f'/{self.name}/metadata/{namespace_regex}/{resource_regex}', MetadataResourceHandler),
            (f'/{self.name}/schema/{namespace_regex}', SchemaHandler),
            (f'/{self.name}/schema/{namespace_regex}/{resource_regex}', SchemaResourceHandler),
            (f'/{self.name}/namespace', NamespaceHandler),
            (f'/{self.name}/pipeline/schedule', PipelineSchedulerHandler),
            (f'/{self.name}/pipeline/export', PipelineExportHandler),
            (f'/{self.name}/pipeline/components/{processor_regex}', PipelineComponentHandler),
            (f'/{self.name}/pipeline/components/{processor_regex}/{component_regex}/properties',
             PipelineComponentPropertiesHandler),
            (f'/{self.name}/contents/properties/{path_regex}', ContentHandler),
            (f'/{self.name}/elyra/pipeline/validate', PipelineValidationHandler),
        ])

    def initialize_settings(self):
        self.log.info('Config {}'.format(self.config))
        # Instantiate singletons with appropriate parent to enable configurability, and convey
        # root_dir to PipelineProcessorManager.
        PipelineProcessorRegistry.instance(root_dir=self.settings['server_root_dir'], parent=self)
        PipelineProcessorManager.instance(root_dir=self.settings['server_root_dir'], parent=self)
        PipelineValidationManager.instance(root_dir=self.settings['server_root_dir'], parent=self)
        FileMetadataCache.instance(parent=self)
        SchemaManager.instance(parent=self)

    def initialize_templates(self):
        pass


launch_instance = ElyraApp.launch_instance
