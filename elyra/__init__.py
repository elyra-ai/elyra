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
from jupyter_server.utils import url_path_join

from elyra.api.handlers import YamlSpecHandler
from elyra.contents.handlers import ContentHandler
from elyra.metadata.storage import FileMetadataCache
from elyra.metadata.schema import SchemaManager
from elyra.metadata.handlers import MetadataHandler
from elyra.metadata.handlers import MetadataResourceHandler
from elyra.metadata.handlers import NamespaceHandler
from elyra.metadata.handlers import SchemaHandler
from elyra.metadata.handlers import SchemaResourceHandler
from elyra.pipeline.handlers import PipelineComponentHandler
from elyra.pipeline.handlers import PipelineComponentPropertiesHandler
from elyra.pipeline.handlers import PipelineExportHandler
from elyra.pipeline.handlers import PipelineProcessorManager
from elyra.pipeline.handlers import PipelineSchedulerHandler

namespace_regex = r"(?P<namespace>[\w\.\-]+)"
resource_regex = r"(?P<resource>[\w\.\-]+)"
path_regex = r"(?P<path>[\w\.\/\-\%]+)"
processor_regex = r"(?P<processor>[\w]+)"
component_regex = r"(?P<component_id>[\w\.\-]+)"


def _jupyter_server_extension_points():
    return [{
        "module": "elyra"
    }]


def _load_jupyter_server_extension(nb_server_app):
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    web_app.add_handlers(host_pattern, [
        (url_path_join(web_app.settings['base_url'], r'/elyra/{}'.format(YamlSpecHandler.get_resource_metadata()[0])),
         YamlSpecHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/metadata/%s' % (namespace_regex)), MetadataHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/metadata/%s/%s' % (namespace_regex, resource_regex)),
         MetadataResourceHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/schema/%s' % (namespace_regex)), SchemaHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/schema/%s/%s' % (namespace_regex, resource_regex)),
         SchemaResourceHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/namespace'), NamespaceHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/pipeline/schedule'), PipelineSchedulerHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/pipeline/export'), PipelineExportHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/pipeline/components/%s' % (processor_regex)),
        PipelineComponentHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/pipeline/components/%s/%s/properties' % (processor_regex, \
            component_regex)), PipelineComponentPropertiesHandler),
        (url_path_join(web_app.settings['base_url'], r'/elyra/contents/properties/%s' % (path_regex)),
         ContentHandler),

    ])
    # Instantiate singletons with appropriate parent to enable configurability, and convey
    # root_dir to PipelineProcessorManager.
    PipelineProcessorManager.instance(root_dir=web_app.settings['server_root_dir'], parent=nb_server_app)
    FileMetadataCache.instance(parent=nb_server_app)
    SchemaManager.instance(parent=nb_server_app)


# For backward compatibility
load_jupyter_server_extension = _load_jupyter_server_extension
