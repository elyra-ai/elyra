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
import errno
import io
import json
import os

from jsonschema import ValidationError

valid_metadata_json = {
    'schema_name': 'test',
    'display_name': 'valid runtime',
    'metadata': {
        'api_endpoint': 'http://localhost:31823/v1/models?version=2017-02-13',
        'foo': 8
    }
}

another_metadata_json = {
    'schema_name': 'test',
    'name': 'another_foo',
    'display_name': 'Another Runtime (2)',
    'metadata': {
        'api_endpoint': 'http://localhost:8081/'
    }
}

invalid_metadata_json = {
    'schema_name': 'test',
    'display_name': 'Invalid Runtime',
    'metadata': {
        'api_endpoint_missing': 'http://localhost:8081/'
    }
}


def create_json_file(location, file_name, content):
    try:
        os.makedirs(location)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    resource = os.path.join(location, file_name)
    with open(resource, 'w', encoding='utf-8') as f:
        f.write(json.dumps(content))


def get_schema(schema_name):
    schema_file = os.path.join(os.path.dirname(__file__), '..', 'schemas', schema_name + '.json')
    if not os.path.exists(schema_file):
        raise ValidationError("Metadata schema file '{}' is missing!".format(schema_file))

    with io.open(schema_file, 'r', encoding='utf-8') as f:
        schema_json = json.load(f)

    return schema_json
