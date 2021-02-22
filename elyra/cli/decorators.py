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

import click
from elyra.metadata import SchemaManager


def options_from_schema():
    def decorator(f):
        namespace_schemas = SchemaManager.load_namespace_schemas()
        for namespace, schemas in namespace_schemas.items():
            for schema_name, schema in schemas.items():
                required_props = schema['properties']['metadata'].get('required')
                for name, value in schema['properties']['metadata']['properties'].items():
                    print(f'>>> processing parameter -> {name}')
                    param_decls = (f'--{name}')

                    attrs = dict()
                    if name in required_props:
                        attrs['required'] = True
                    else:
                        attrs['required'] = False

                    click.option(*param_decls, **attrs)(f)
        return f

    return decorator
