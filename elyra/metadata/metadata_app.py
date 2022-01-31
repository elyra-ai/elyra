#
# Copyright 2018-2022 Elyra Authors
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
from typing import Dict
from typing import List

from jsonschema import ValidationError

from elyra.metadata.error import MetadataNotFoundError
from elyra.metadata.manager import MetadataManager
from elyra.metadata.metadata import Metadata
from elyra.metadata.metadata_app_utils import AppBase
from elyra.metadata.metadata_app_utils import CliOption
from elyra.metadata.metadata_app_utils import FileOption
from elyra.metadata.metadata_app_utils import Flag
from elyra.metadata.metadata_app_utils import JSONBasedOption
from elyra.metadata.metadata_app_utils import JSONOption
from elyra.metadata.metadata_app_utils import MetadataSchemaProperty
from elyra.metadata.metadata_app_utils import Option
from elyra.metadata.metadata_app_utils import SchemaProperty
from elyra.metadata.schema import SchemaManager


class SchemaspaceBase(AppBase):
    """Simple attribute-only base class for the various schemaspace subcommand classes """

    # These will be set on class creation when subcommand creates the schemaspace-specific class
    description = None
    schemaspace = None
    schemas = None
    options = []

    def print_help(self):
        super().print_help()
        print()
        print("Options")
        print("-------")
        print()
        for option in self.options:
            option.print_help()

    def start(self):
        # Process client options since all subclasses are option processor
        self.process_cli_options(self.options)


class SchemaspaceList(SchemaspaceBase):
    """Handles the 'list' subcommand functionality for a specific schemaspace."""

    json_flag = Flag("--json", name='json',
                     description='List complete instances as JSON', default_value=False)

    valid_only_flag = Flag("--valid-only", name='valid-only',
                           description='Only list valid instances (default includes invalid instances)',
                           default_value=False)

    # 'List' flags
    options = [json_flag, valid_only_flag]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.metadata_manager = MetadataManager(schemaspace=self.schemaspace)

    def start(self):
        super().start()  # process options

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
                print("No metadata instances found for {}".format(self.schemaspace))
                return

            validity_clause = "includes invalid" if include_invalid else "valid only"
            print("Available metadata instances for {} ({}):".format(self.schemaspace, validity_clause))

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


class SchemaspaceRemove(SchemaspaceBase):
    """Handles the 'remove' subcommand functionality for a specific schemaspace."""

    name_option = CliOption("--name", name='name',
                            description='The name of the metadata instance to remove', required=True)

    # 'Remove' options
    options = [name_option]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.metadata_manager = MetadataManager(schemaspace=self.schemaspace)

    def start(self):
        super().start()  # process options

        name = self.name_option.value
        try:
            self.metadata_manager.get(name)
        except MetadataNotFoundError as mnfe:
            self.log_and_exit(mnfe)
        except ValidationError:  # Probably deleting invalid instance
            pass

        self.metadata_manager.remove(name)
        print("Metadata instance '{}' removed from schemaspace '{}'.".format(name, self.schemaspace))


class SchemaspaceInstall(SchemaspaceBase):
    """Handles the 'install' subcommand functionality for a specific schemaspace."""

    # Known options, others will be derived from schema based on schema_name...

    replace_flag = Flag("--replace", name='replace',
                        description='Replace existing instance', default_value=False)
    name_option = CliOption("--name", name='name',
                            description='The name of the metadata instance to install')
    file_option = FileOption("--file", name='file',
                             description='The filename containing the metadata instance to install. '
                                         'Can be used to bypass individual property arguments.')
    json_option = JSONOption("--json", name='json',
                             description='The JSON string containing the metadata instance to install. '
                                         'Can be used to bypass individual property arguments.')
    # 'Install' options
    options: List[Option] = [replace_flag, file_option, json_option]  # defer name option until after schema

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.complex_properties: List[str] = []
        self.metadata_manager = MetadataManager(schemaspace=self.schemaspace)
        # First, process the schema_name option so we can then load the appropriate schema
        # file to build the schema-based options.  If help is requested, give it to them.

        # As an added benefit, if the schemaspace has one schema, got ahead and default that value.
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
            enum = schema_list
            self.schema_name_option = CliOption("--schema_name", name='schema_name', enum=enum,
                                                description='The schema_name of the metadata instance to install.  '
                                                            'Must be one of: {}'.format(enum),
                                                required=True)

        self.options.extend([self.schema_name_option, self.name_option])

        # Since we need to know if the replace option is in use prior to normal option processing,
        # go ahead and check for its existence on the command-line and process if present.
        if self.replace_flag.cli_option in self.argv_mappings.keys():
            self.process_cli_option(self.replace_flag)

        # Determine if --json, --file, or --replace are in use and relax required properties if so.
        bulk_metadata = self._process_json_based_options()
        relax_required = bulk_metadata or self.replace_flag.value

        # This needs to occur following json-based options since they may add it as an option
        self.process_cli_option(self.schema_name_option, check_help=True)

        # Schema appears to be a valid name, convert its properties to options and continue
        schema = self.schemas[self.schema_name_option.value]

        # Convert schema properties to options, gathering complex property names
        schema_options = self._schema_to_options(schema, relax_required)
        self.options.extend(schema_options)

    def start(self):
        super().start()  # process options

        # Get known options, then gather display_name and build metadata dict.
        name = self.name_option.value
        schema_name = self.schema_name_option.value
        display_name = None

        metadata = {}
        # Walk the options looking for SchemaProperty instances. Any MetadataSchemaProperty instances go
        # into the metadata dict.  Note that we process JSONBasedOptions (--json or --file) prior to
        # MetadataSchemaProperty types since the former will set the base metadata stanza and individual
        # values can be used to override the former's content (like BYO authentication OVPs, for example).
        for option in self.options:
            if isinstance(option, MetadataSchemaProperty):
                # skip adding any non required properties that have no value (unless its a null type).
                if not option.required and not option.value and option.type != 'null':
                    continue
                metadata[option.name] = option.value
            elif isinstance(option, SchemaProperty):
                if option.name == 'display_name':  # Be sure we have a display_name
                    display_name = option.value
                    continue
            elif isinstance(option, JSONBasedOption):
                metadata.update(option.metadata)

        if display_name is None and self.replace_flag.value is False:  # Only require
            self.log_and_exit("Could not determine display_name from schema '{}'".format(schema_name))

        ex_msg = None
        new_instance = None
        try:
            if self.replace_flag.value:  # if replacing, fetch the instance so it can be updated
                updated_instance = self.metadata_manager.get(name)
                updated_instance.schema_name = schema_name
                if display_name:
                    updated_instance.display_name = display_name
                updated_instance.metadata.update(metadata)
                new_instance = self.metadata_manager.update(name, updated_instance)
            else:  # create a new instance
                instance = Metadata(schema_name=schema_name, name=name,
                                    display_name=display_name, metadata=metadata)
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

    def _process_json_based_options(self) -> bool:
        """Process the file and json options to see if they have values (and those values can be loaded as JSON)
           Then check payloads for schema_name, display_name and derive name options and add to argv mappings
           if currently not specified.

           If either option is set, indicate that the metadata stanza should be skipped (return True)
        """
        bulk_metadata = False

        self.process_cli_option(self.file_option, check_help=True)
        self.process_cli_option(self.json_option, check_help=True)

        # if both are set, raise error
        if self.json_option.value is not None and self.file_option.value is not None:
            self.log_and_exit("At most one of '--json' or '--file' can be set at a time.", display_help=True)
        elif self.json_option.value is not None:
            bulk_metadata = True
            self.json_option.transfer_names_to_argvs(self.argv, self.argv_mappings)
        elif self.file_option.value is not None:
            bulk_metadata = True
            self.file_option.transfer_names_to_argvs(self.argv, self.argv_mappings)

        # else, neither is set so metadata stanza will be considered
        return bulk_metadata

    def _schema_to_options(self, schema: Dict, relax_required: bool = False) -> List[Option]:
        """Takes a JSON schema and builds a list of SchemaProperty instances corresponding to each
           property in the schema.  There are two sections of properties, one that includes
           schema_name and display_name and another within the metadata container - which
           will be separated by class type - SchemaProperty vs. MetadataSchemaProperty.

           If relax_required is true, a --json or --file option is in use and the primary metadata
           comes from those options OR the --replace option is in use, in which case the primary
           metadata comes from the existing instance (being replaced).  In such cases, skip setting
           required values since most will come from the JSON-based option or already be present
           (in the case of replace).  This allows CLI-specified metadata properties to override the
           primary metadata (either in the JSON options or from the existing instance).
        """
        options = {}
        properties = schema['properties']
        for name, value in properties.items():
            if name == 'schema_name':  # already have this option, skip
                continue
            if name != 'metadata':
                options[name] = SchemaProperty(name, value)
            else:  # convert first-level metadata properties to options...
                metadata_properties = properties['metadata']['properties']
                for md_name, md_value in metadata_properties.items():
                    msp = MetadataSchemaProperty(md_name, md_value)
                    # skip if this property was not specified on the command line and its a replace/bulk op
                    if msp.cli_option not in self.argv_mappings and relax_required:
                        continue
                    if msp.unsupported_meta_props:  # if this option includes complex meta-props, note that.
                        self.complex_properties.append(md_name)
                    options[md_name] = msp

        # Now set required-ness on MetadataProperties, but only when creation is using fine-grained property options
        if not relax_required:
            required_props = properties['metadata'].get('required')
            for required in required_props:
                options.get(required).required = True

        # ...  and top-level (schema) Properties if we're not replacing (updating)
        if self.replace_flag.value is False:
            required_props = set(schema.get('required')) - {'schema_name', 'metadata'}  # skip schema_name & metadata
            for required in required_props:
                options.get(required).required = True
        return list(options.values())

    def print_help(self):
        super().print_help()
        # If we gathered any complex properties, go ahead and note how behaviors might be affected, etc.
        if self.complex_properties:
            print(f"Note: The following properties in this schema contain JSON keywords that are not supported "
                  f"by the tooling: {self.complex_properties}.")
            print("This can impact the tool's ability to derive context from the schema, including a property's "
                  "type, description, or behaviors included in complex types like 'oneOf'.")
            print("It is recommended that options corresponding to these properties be set after understanding "
                  "the schema or indirectly using `--file` or `--json` options.")
            print("If the property is of type \"object\" it can be set using a file containing only that property's "
                  "JSON.")
            print(f"The following are considered unsupported keywords: {SchemaProperty.unsupported_keywords}")


class SchemaspaceMigrate(SchemaspaceBase):
    """Handles the 'migrate' subcommand functionality for a specific schemaspace."""

    # 'Migrate' options
    options = []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def start(self):
        super().start()  # process options

        # Regardless of schemaspace, call migrate.  If the schemaspace implementation doesn't
        # require migration, an appropriate log statement will be produced.
        schemaspace = SchemaManager.instance().get_schemaspace(self.schemaspace)
        migrated = schemaspace.migrate()
        if migrated:
            print(f"The following {self.schemaspace} instances were migrated: {migrated}")
        else:
            print(f"No instances of schemaspace {self.schemaspace} were migrated.")


class SubcommandBase(AppBase):
    """Handles building the appropriate subcommands based on existing schemaspaces."""

    subcommand_description = None  # Overridden in subclass
    schemaspace_base_class = None  # Overridden in subclass

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.schemaspace_schemas = kwargs['schemaspace_schemas']

        # For each schemaspace in current schemas, add a corresponding subcommand
        # This requires a new subclass of the SchemaspaceList class with an appropriate description
        self.subcommands = {}
        for schemaspace, schemas in self.schemaspace_schemas.items():
            subcommand_description = self.subcommand_description.format(schemaspace=schemaspace)
            # Create the appropriate schemaspace class, initialized with its description,
            # schemaspace, and corresponding schemas as attributes,
            schemaspace_class = type(schemaspace, (self.schemaspace_base_class,),
                                     {'description': subcommand_description,
                                      'schemaspace': schemaspace,
                                      'schemas': schemas})
            self.subcommands[schemaspace] = (schemaspace_class, schemaspace_class.description)

    def start(self):
        subcommand = self.get_subcommand()
        if subcommand is None:
            self.exit_no_subcommand()

        subinstance = subcommand[0](argv=self.argv, schemaspace_schemas=self.schemaspace_schemas)
        return subinstance.start()

    def print_help(self):
        super().print_help()
        self.print_subcommands()


class List(SubcommandBase):
    """Lists a metadata instances of a given schemaspace."""

    description = "List metadata instances for a given schemaspace."
    subcommand_description = "List installed metadata for {schemaspace}."
    schemaspace_base_class = SchemaspaceList

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class Remove(SubcommandBase):
    """Removes a metadata instance from a given schemaspace."""

    description = "Remove a metadata instance from a given schemaspace."
    subcommand_description = "Remove a metadata instance from schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceRemove

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class Install(SubcommandBase):
    """Installs a metadata instance into a given schemaspace."""

    description = "Install a metadata instance into a given schemaspace."
    subcommand_description = "Install a metadata instance into schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceInstall

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class Migrate(SubcommandBase):
    """Migrates metadata instances in a given schemaspace."""

    description = "Migrate metadata instances in a given schemaspace."
    subcommand_description = "Migrate metadata instance in schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceMigrate

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class MetadataApp(AppBase):
    """Lists, installs and removes metadata for a given schemaspace."""

    name = "elyra-metadata"
    description = """Manage Elyra metadata."""

    subcommands = {
        'list': (List, List.description.splitlines()[0]),
        'install': (Install, Install.description.splitlines()[0]),
        'remove': (Remove, Remove.description.splitlines()[0]),
        'migrate': (Migrate, Migrate.description.splitlines()[0]),
    }

    @classmethod
    def main(cls):
        elyra_metadata = cls(argv=sys.argv[1:])
        elyra_metadata.start()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.schemaspace_schemas = {}
        schema_mgr = SchemaManager.instance()
        # Migration should include deprecated schemaspaces
        include_deprecated = False
        args = kwargs.get('argv', [])
        if len(args) > 0:
            include_deprecated = args[0] != 'install'  # Only install will not operate against a deprecated schemaspace
        schemaspace_names = schema_mgr.get_schemaspace_names(include_deprecated=include_deprecated)
        for name in schemaspace_names:
            self.schemaspace_schemas[name] = schema_mgr.get_schemaspace_schemas(name)

    def start(self):
        subcommand = self.get_subcommand()
        if subcommand is None:
            self.exit_no_subcommand()

        subinstance = subcommand[0](argv=self.argv, schemaspace_schemas=self.schemaspace_schemas)
        return subinstance.start()

    def print_help(self):
        super().print_help()
        self.print_subcommands()


if __name__ == '__main__':
    MetadataApp.main()
