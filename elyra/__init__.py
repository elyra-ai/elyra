#
# Copyright 2018-2020 IBM Corporation
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
from notebook.utils import url_path_join

from .api.handlers import JsonSpecHandler, YamlSpecHandler
from .scheduler.handler import SchedulerHandler
from .metadata.handlers import MetadataHandler, MetadataNamespaceHandler
from .metadata import MetadataManager

namespace_regex = r"(?P<namespace>[\w\.\-]+)"
resource_regex = r"(?P<target>[\w\.\-]+)"

def _jupyter_server_extension_paths():
    return [{
        "module": "elyra"
    }]


def load_jupyter_server_extension(nb_server_app):
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    web_app.add_handlers(host_pattern, [
        (url_path_join(web_app.settings['base_url'], r'/api/{}'.format(JsonSpecHandler.get_resource_metadata()[0])),
         JsonSpecHandler),
        (url_path_join(web_app.settings['base_url'], r'/api/{}'.format(YamlSpecHandler.get_resource_metadata()[0])),
         YamlSpecHandler),
        (url_path_join(web_app.settings['base_url'], r'/api/scheduler'), SchedulerHandler),
        (url_path_join(web_app.settings['base_url'], r'/api/metadata/%s' % (namespace_regex)), MetadataHandler),
        (url_path_join(web_app.settings['base_url'], r'/api/metadata/%s/%s' % (namespace_regex, resource_regex)),
         MetadataNamespaceHandler),
    ])

