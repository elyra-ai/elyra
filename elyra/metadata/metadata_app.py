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
import sys

from jsonschema import ValidationError

from .error import MetadataNotFoundError
from .metadata_app_utils import AppBase, CliOption, Flag, SchemaProperty, MetadataSchemaProperty
from .metadata import Metadata
from .manager import MetadataManager
from .schema import SchemaManager


class NamespaceBase(AppBase):
    """Simple attribute-only base class for the various namespace subcommand classes """

    # These will be set on class creation when subcommand creates the namespace-specific class
    description = None
    namespace = None
    schemas = None
    options = []

    def print_help(self):
        super(NamespaceBase, self).print_help()
        print()
        print("Options")
        print("-------")
        print()
        for option in self.options:
            option.print_help()

    def start(self):
        # Process client options since all subclasses are option processer
        self.process_cli_options(self.options)


class NamespaceList(NamespaceBase):
    """Handles the 'list' subcommand functionality for a specific namespace."""

    json_flag = Flag("--json", name='json',
                     description='List complete instances as JSON', default_value=False)

    valid_only_flag = Flag("--valid-only", name='valid-only',
                           description='Only list valid instances (default includes invalid instances)',
                           default_value=False)

    # 'List' flags
    options = [json_flag, valid_only_flag]

    def __init__(self, **kwargs):
        super(NamespaceList, self).__init__(**kwargs)
        self.metadata_manager = MetadataManager(namespace=self.namespace)

    def start(self):
        self.process_cli_options(self.options)  # process options

        include_invalid = not self.valid_only_flag.value
        try:
            metadata_instances = self.metadata_manager.get_all(include_invalid=include_invalid)
        except MetadataNotFoundError:
            metadata_instances = None

        if self.json_flag.value:
            if metadata_instances is None:
                metadata_instances = []
            print(metadata_instances)
        else:
            if not metadata_instances:
                print("No metadata instances found for {}".format(self.namespace))
                return

            validity_clause = "includes invalid" if include_invalid else "valid only"
            print("Available metadata instances for {} ({}):".format(self.namespace, validity_clause))

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


class NamespaceRemove(NamespaceBase):
    """Handles the 'remove' subcommand functionality for a specific namespace."""

    name_option = CliOption("--name", name='name',
                            description='The name of the metadata instance to remove', required=True)

    # 'Remove' options
    options = [name_option]

    def __init__(self, **kwargs):
        super(NamespaceRemove, self).__init__(**kwargs)
        self.metadata_manager = MetadataManager(namespace=self.namespace)

    def start(self):
        super(NamespaceRemove, self).start()  # process options

        name = self.name_option.value
        try:
            self.metadata_manager.get(name)
        except MetadataNotFoundError as mnfe:
            self.log_and_exit(mnfe)
        except ValidationError:  # Probably deleting invalid instance
            pass

        self.metadata_manager.remove(name)
        print("Metadata instance '{}' removed from namespace '{}'.".format(name, self.namespace))


class NamespaceInstall(NamespaceBase):
    """Handles the 'install' subcommand functionality for a specific namespace."""

    # Known options, others will be derived from schema based on schema_name...

    replace_flag = Flag("--replace", name='replace',
                        description='Replace existing instance', default_value=False)
    name_option = CliOption("--name", name='name',
                            description='The name of the metadata instance to install')

    # 'Install' options
    options = [replace_flag]  # defer name_option until after schema_option

    def __init__(self, **kwargs):
        super(NamespaceInstall, self).__init__(**kwargs)
        self.metadata_manager = MetadataManager(namespace=self.namespace)
        # First, process the schema_name option so we can then load the appropriate schema
        # file to build the schema-based options.  If help is requested, give it to them.

        # As an added benefit, if the namespace has one schema, got ahead and default that value.
        # If multiple, add the list so proper messaging can be applied.  As a result, we need to
        # to build the option here since this is where we have access to the schemas.
        schema_list = list(self.schemas.keys())
        if len(schema_list) == 1:
            self.schema_name_option = CliOption("--schema_name", name='schema_name',
                                                default_value=schema_list[0],
                                                description="The schema_name of the metadata instance to "
                                                            "install (defaults to '{}')".format(schema_list[0]),
                                                required=True)
        else:
            one_of = schema_list
            self.schema_name_option = CliOption("--schema_name", name='schema_name', one_of=one_of,
                                                description='The schema_name of the metadata instance to install.  '
                                                            'Must be one of: {}'.format(one_of),
                                                required=True)

        self.options.extend([self.schema_name_option, self.name_option])
        self.process_cli_option(self.schema_name_option, check_help=True)
        schema_name = self.schema_name_option.value

        # If schema is not registered in the set of schemas for this namespace, bail.
        if schema_name not in self.schemas:
            self.log_and_exit("Schema name '{}' not found in {} schemas!".format(schema_name, self.namespace))

        # Schema appears to be a valid name, convert its properties to options and continue
        schema = self.schemas[schema_name]
        self.schema_options = NamespaceInstall.schema_to_options(schema)
        self.options.extend(self.schema_options)

    def start(self):
        super(NamespaceInstall, self).start()  # process options

        # Get known options, then gather display_name and build metadata dict.
        name = self.name_option.value
        schema_name = self.schema_name_option.value
        display_name = None

        metadata = {}
        # Walk the options looking for SchemaProperty instances. Any MetadataSchemaProperty instances go
        # into the metadata dict.
        for option in self.options:
            if isinstance(option, SchemaProperty):
                if option.name == 'display_name':  # Be sure we have a display_name
                    display_name = option.value
                    continue
            if isinstance(option, MetadataSchemaProperty):
                # skip adding any non required properties that have no value (unless its a null type).
                if not option.required and not option.value and option.type != 'null':
                    continue
                metadata[option.name] = option.value

        if display_name is None:
            self.log_and_exit("Could not determine display_name from schema '{}'".format(schema_name))

        instance = Metadata(schema_name=schema_name, name=name,
                            display_name=display_name, metadata=metadata)

        ex_msg = None
        new_instance = None
        try:
            if self.replace_flag.value:
                new_instance = self.metadata_manager.update(name, instance)
            else:
                new_instance = self.metadata_manager.create(name, instance)
        except Exception as ex:
            ex_msg = str(ex)

        if new_instance:
            print("Metadata instance '{}' for schema '{}' has been written to: {}"
                  .format(new_instance.name, schema_name, new_instance.resource))
        else:
            if ex_msg:
                self.log_and_exit("The following exception occurred saving metadata instance for schema '{}': {}"
                                  .format(schema_name, ex_msg), display_help=True)
            else:
                self.log_and_exit("A failure occurred saving metadata instance '{}' for schema '{}'."
                                  .format(name, schema_name), display_help=True)


class SubcommandBase(AppBase):
    """Handles building the appropriate subcommands based on existing namespaces."""

    subcommand_desciption = None  # Overridden in subclass
    namespace_base_class = None  # Overridden in subclass

    def __init__(self, **kwargs):
        super(SubcommandBase, self).__init__(**kwargs)
        self.namespace_schemas = kwargs['namespace_schemas']

        # For each namespace in current schemas, add a corresponding subcommand
        # This requires a new subclass of the NamespaceList class with an appropriate description
        self.subcommands = {}
        for namespace, schemas in self.namespace_schemas.items():
            subcommand_desciption = self.subcommand_desciption.format(namespace=namespace)
            # Create the appropriate namespace class, initialized with its description,
            # namespace, and corresponding schemas as attributes,
            namespace_class = type(namespace, (self.namespace_base_class,),
                                   {'description': subcommand_desciption,
                                    'namespace': namespace,
                                    'schemas': schemas})
            self.subcommands[namespace] = (namespace_class, namespace_class.description)

    def start(self):
        subcommand = self.get_subcommand()
        if subcommand is None:
            self.exit_no_subcommand()

        subinstance = subcommand[0](argv=self.argv, namespace_schemas=self.namespace_schemas)
        return subinstance.start()

    def print_help(self):
        super(SubcommandBase, self).print_help()
        self.print_subcommands()


class List(SubcommandBase):
    """Lists a metadata instances of a given namespace."""

    description = "List metadata instances for a given namespace."
    subcommand_desciption = "List installed metadata for {namespace}."
    namespace_base_class = NamespaceList

    def __init__(self, **kwargs):
        super(List, self).__init__(**kwargs)


class Remove(SubcommandBase):
    """Removes a metadata instance from a given namespace."""

    description = "Remove a metadata instance from a given namespace."
    subcommand_desciption = "Remove a metadata instance from namespace '{namespace}'."
    namespace_base_class = NamespaceRemove

    def __init__(self, **kwargs):
        super(Remove, self).__init__(**kwargs)


class Install(SubcommandBase):
    """Installs a metadata instance into a given namespace."""

    description = "Install a metadata instance into a given namespace."
    subcommand_desciption = "Install a metadata instance into namespace '{namespace}'."
    namespace_base_class = NamespaceInstall

    def __init__(self, **kwargs):
        super(Install, self).__init__(**kwargs)


class MetadataApp(AppBase):
    """Lists, installs and removes metadata for a given namespace."""

    name = "elyra-metadata"
    description = """Manage Elyra metadata."""

    subcommands = {
        'list': (List, List.description.splitlines()[0]),
        'install': (Install, Install.description.splitlines()[0]),
        'remove': (Remove, Remove.description.splitlines()[0]),
    }

    @classmethod
    def main(cls):
        elyra_metadata = cls(argv=sys.argv[1:])
        elyra_metadata.start()

    def __init__(self, **kwargs):
        super(MetadataApp, self).__init__(**kwargs)
        self.namespace_schemas = SchemaManager.load_namespace_schemas()

    def start(self):
        subcommand = self.get_subcommand()
        if subcommand is None:
            self.exit_no_subcommand()

        subinstance = subcommand[0](argv=self.argv, namespace_schemas=self.namespace_schemas)
        return subinstance.start()

    def print_help(self):
        super(MetadataApp, self).print_help()
        self.print_subcommands()


if __name__ == '__main__':
    MetadataApp.main()
