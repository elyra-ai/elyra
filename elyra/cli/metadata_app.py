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
# import json
# import os
from elyra.metadata import MetadataManager, MetadataNotFoundError, SchemaManager
from jsonschema import ValidationError

from elyra.cli import log_and_exit, options_from_schema

# from elyra.metadata.metadata_app import NamespaceBase


@click.group()
def metadata():  # *args, **kwargs
    pass


@click.command(help='List metadata instances for a given namespace.')
@click.argument('namespace', type=str, required=False)
@click.option('--valid-only',
              type=bool,
              required=False,
              default=False,
              help='Only list valid instances (default includes invalid instances')
@click.option('--json', type=bool, required=False, default=False, help='List complete instances as JSON')
def list(namespace, valid_only, json):
    _validate_namespace(namespace)
    include_invalid = not valid_only

    metadata_instances = None
    try:
        metadata_manager = MetadataManager(namespace=namespace)
        metadata_instances = metadata_manager.get_all(include_invalid=include_invalid)
    except MetadataNotFoundError:
        pass

    if json:
        if metadata_instances is None:
            metadata_instances = []
        print(metadata_instances)
    else:
        if not metadata_instances:
            print("No metadata instances found for {}".format(namespace))
            return

        validity_clause = "includes invalid" if include_invalid else "valid only"
        print("Available metadata instances for {} ({}):".format(namespace, validity_clause))

        sorted_instances = sorted(metadata_instances, key=lambda inst: (inst.schema_name, inst.name))
        # pad to width of longest instance
        max_schema_name_len = len('Schema')
        max_name_len = len('Instance')
        max_resource_len = len('Resource')
        for instance in sorted_instances:
            max_schema_name_len = max(len(instance.schema_name), max_schema_name_len)
            max_name_len = max(len(instance.name), max_name_len)
            max_resource_len = max(len(instance.resource), max_resource_len)

        print()
        print("%s   %s  %s  " % ('Schema'.ljust(max_schema_name_len),
                                 'Instance'.ljust(max_name_len),
                                 'Resource'.ljust(max_resource_len)))
        print("%s   %s  %s  " % ('------'.ljust(max_schema_name_len),
                                 '--------'.ljust(max_name_len),
                                 '--------'.ljust(max_resource_len)))
        for instance in sorted_instances:
            invalid = ""
            if instance.reason and len(instance.reason) > 0:
                invalid = "**INVALID** ({})".format(instance.reason)
            print("%s   %s  %s  %s" % (instance.schema_name.ljust(max_schema_name_len),
                                       instance.name.ljust(max_name_len),
                                       instance.resource.ljust(max_resource_len),
                                       invalid))


@click.command(help='Remove a metadata instance from a given namespace.')
@click.argument('namespace', type=str, required=False)
@click.option('--name', type=str, required=True, help='The name of the metadata instance to remove')
def remove(namespace, name):
    _validate_namespace(namespace)
    try:
        metadata_manager = MetadataManager(namespace=namespace)
        metadata_manager.get(name)
        metadata_manager.remove(name)
        print("Metadata instance '{}' removed from namespace '{}'.".format(name, namespace))

    except MetadataNotFoundError as mnfe:
        log_and_exit(mnfe)
    except ValidationError:  # Probably deleting invalid instance
        pass


@click.command(help='Install a metadata instance into a given namespace.')
@click.argument('namespace', type=str, required=False)
@click.option('--name', type=str, required=True, help='The name of the metadata instance to add')
@click.option('--replace', type=bool, required=False, default=False, help='Replace existing instance')
@options_from_schema()
def install(namespace, name, replace, *args, **kwargs):
    _validate_namespace(namespace)


def _get_namespaces():
    namespaces = []
    namespace_schemas = SchemaManager.load_namespace_schemas()
    for namespace, schemas in namespace_schemas.items():
        namespaces.append(namespace)
        print('>>>')
        print(namespace)
        print(schemas)
        print()
    return namespaces


def _validate_namespace(namespace):
    msg = None
    if not namespace:
        msg = f'No namespace specified. Must specify one of: {_get_namespaces()}'
    elif namespace not in _get_namespaces():
        msg = f'No namespace specified. Must specify one of: {_get_namespaces()}'

    if msg:
        log_and_exit(msg)




# def _schema_to_options(schema):
#     """
#     Takes a JSON schema and builds a list of SchemaProperty instances corresponding to each
#     property in the schema.  There are two sections of properties, one that includes
#     schema_name and display_name and another within the metadata container - which
#     will be separated by class type - SchemaProperty vs. MetadataSchemaProperty.
#     """
#     options = {}
#     properties = schema['properties']
#     for name, value in properties.items():
#         if name == 'schema_name':  # already have this option, skip
#             continue
#         if name != 'metadata':
#             options[name] = SchemaProperty(name, value)
#         else:  # process metadata properties...
#             metadata_properties = properties['metadata']['properties']
#             for md_name, md_value in metadata_properties.items():
#                 options[md_name] = MetadataSchemaProperty(md_name, md_value)
#
#     # Now set required-ness on MetadataProperties and top-level Properties
#     required_props = properties['metadata'].get('required')
#     for required in required_props:
#         options.get(required).required = True
#
#     required_props = schema.get('required')
#     for required in required_props:
#         # skip schema_name & metadata, already required, and metadata is not an option to be presented
#         if required not in ['schema_name', 'metadata']:
#             options.get(required).required = True
#     return list(options.values())


metadata.add_command(list)
metadata.add_command(remove)
metadata.add_command(install)
