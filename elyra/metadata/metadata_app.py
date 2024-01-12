#
# Copyright 2018-2023 Elyra Authors
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
import json
import os
import sys
from typing import Dict
from typing import List

from jsonschema import ValidationError

from elyra.metadata.error import MetadataExistsError, MetadataNotFoundError
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
    """Simple attribute-only base class for the various schemaspace subcommand classes"""

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

    json_flag = Flag("--json", name="json", description="List complete instances as JSON", default_value=False)

    include_invalid_flag = Flag(
        "--include-invalid",
        name="include-invalid",
        description="Include invalid instances (default displays only valid instances)",
        default_value=False,
    )

    # 'List' flags
    options = [json_flag, include_invalid_flag]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.metadata_manager = MetadataManager(schemaspace=self.schemaspace)

    def start(self):
        super().start()  # process options

        try:
            metadata_instances = self.metadata_manager.get_all(include_invalid=self.include_invalid_flag.value)
        except MetadataNotFoundError:
            metadata_instances = None

        if self.json_flag.value:
            if metadata_instances is None:
                metadata_instances = []
            print(metadata_instances)
        else:
            if not metadata_instances:
                print(f"No metadata instances found for {self.schemaspace}")
                return

            validity_clause = " (includes invalid)" if self.include_invalid_flag.value else ""
            print(f"Available metadata instances for {self.schemaspace}{validity_clause}:")

            sorted_instances = sorted(metadata_instances, key=lambda inst: (inst.schema_name, inst.name))
            # pad to width of the longest instance
            max_schema_name_len = len("Schema")
            max_name_len = len("Instance")
            max_resource_len = len("Resource")
            for instance in sorted_instances:
                max_schema_name_len = max(len(instance.schema_name), max_schema_name_len)
                max_name_len = max(len(instance.name), max_name_len)
                max_resource_len = max(len(instance.resource), max_resource_len)

            print()
            print(
                f"{'Schema'.ljust(max_schema_name_len)}   {'Instance'.ljust(max_name_len)}  "
                f"{'Resource'.ljust(max_resource_len)}  "
            )
            print(
                f"{'------'.ljust(max_schema_name_len)}   {'--------'.ljust(max_name_len)}  "
                f"{'--------'.ljust(max_resource_len)}  "
            )
            for instance in sorted_instances:
                invalid = ""
                if instance.reason and len(instance.reason) > 0:
                    invalid = f"**INVALID** ({instance.reason})"
                print(
                    f"{instance.schema_name.ljust(max_schema_name_len)}   {instance.name.ljust(max_name_len)}  "
                    f"{instance.resource.ljust(max_resource_len)}  {invalid}"
                )


class SchemaspaceRemove(SchemaspaceBase):
    """Handles the 'remove' subcommand functionality for a specific schemaspace."""

    name_option = CliOption(
        "--name", name="name", description="The name of the metadata instance to remove", required=True
    )

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
        print(f"Metadata instance '{name}' removed from schemaspace '{self.schemaspace}'.")


class SchemaspaceCreate(SchemaspaceBase):
    """Handles the 'create' subcommand functionality for a specific schemaspace."""

    # Known options, others will be derived from schema based on schema_name...

    name_option = CliOption("--name", name="name", description="The name of the metadata instance.")
    file_option = FileOption(
        "--file",
        name="file",
        description="The filename containing the metadata instance. "
        "Can be used to bypass individual property arguments.",
    )
    json_option = JSONOption(
        "--json",
        name="json",
        description="The JSON string containing the metadata instance. "
        "Can be used to bypass individual property arguments.",
    )
    # 'create' options
    options: List[Option] = [file_option, json_option]  # defer name option until after schema

    update_mode = False

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
            self.schema_name_option = CliOption(
                "--schema_name",
                name="schema_name",
                default_value=schema_list[0],
                description="The schema_name of the metadata instance " f"(defaults to '{schema_list[0]}')",
                required=True,
            )
        else:
            enum = schema_list
            self.schema_name_option = CliOption(
                "--schema_name",
                name="schema_name",
                enum=enum,
                description="The schema_name of the metadata instance " f"Must be one of: {enum}",
                required=True,
            )

        self.options.extend([self.schema_name_option, self.name_option])

        # Determine if --json, --file, or --replace are in use and relax required properties if so.
        bulk_metadata = self._process_json_based_options()
        relax_required = bulk_metadata or self.update_mode

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
                if not option.required and not option.value and option.type != "null":
                    continue
                metadata[option.name] = option.value
            elif isinstance(option, SchemaProperty):
                if option.name == "display_name":  # Be sure we have a display_name
                    display_name = option.value
                    continue
            elif isinstance(option, JSONBasedOption):
                metadata.update(option.metadata)

        if display_name is None and self.update_mode is False:  # Only require on create
            self.log_and_exit(f"Could not determine display_name from schema '{schema_name}'")

        ex_msg = None
        new_instance = None
        try:
            if self.update_mode:  # if replacing, fetch the instance so it can be updated
                updated_instance = self.metadata_manager.get(name)
                updated_instance.schema_name = schema_name
                if display_name:
                    updated_instance.display_name = display_name
                updated_instance.metadata.update(metadata)
                new_instance = self.metadata_manager.update(name, updated_instance)
            else:  # create a new instance
                instance = Metadata(schema_name=schema_name, name=name, display_name=display_name, metadata=metadata)
                new_instance = self.metadata_manager.create(name, instance)
        except Exception as ex:
            ex_msg = str(ex)

        if new_instance:
            print(
                f"Metadata instance '{new_instance.name}' for schema '{schema_name}' has been written "
                f"to: {new_instance.resource}"
            )
        else:
            if ex_msg:
                self.log_and_exit(
                    f"The following exception occurred saving metadata instance "
                    f"for schema '{schema_name}': {ex_msg}",
                    display_help=False,
                )
            else:
                self.log_and_exit(
                    f"A failure occurred saving metadata instance '{name}' for " f"schema '{schema_name}'.",
                    display_help=False,
                )

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
        properties = schema["properties"]
        for name, value in properties.items():
            if name == "schema_name":  # already have this option, skip
                continue
            if name != "metadata":
                options[name] = SchemaProperty(name, value)
            else:  # convert first-level metadata properties to options...
                metadata_properties = properties["metadata"]["properties"]
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
            required_props = properties["metadata"].get("required")
            for required in required_props:
                options.get(required).required = True

        # ...  and top-level (schema) Properties if we're not replacing (updating)
        if self.update_mode is False:
            required_props = set(schema.get("required")) - {"schema_name", "metadata"}  # skip schema_name & metadata
            for required in required_props:
                options.get(required).required = True
        return list(options.values())

    def print_help(self):
        super().print_help()
        # If we gathered any complex properties, go ahead and note how behaviors might be affected, etc.
        if self.complex_properties:
            print(
                f"Note: The following properties in this schema contain JSON keywords that are not supported "
                f"by the tooling: {self.complex_properties}."
            )
            print(
                "This can impact the tool's ability to derive context from the schema, including a property's "
                "type, description, or behaviors included in complex types like 'oneOf'."
            )
            print(
                "It is recommended that options corresponding to these properties be set after understanding "
                "the schema or indirectly using `--file` or `--json` options."
            )
            print(
                'If the property is of type "object" it can be set using a file containing only that property\'s '
                "JSON."
            )
            print(f"The following are considered unsupported keywords: {SchemaProperty.unsupported_keywords}")


class SchemaspaceUpdate(SchemaspaceCreate):
    """Handles the 'update' subcommand functionality for a specific schemaspace."""

    update_mode = True


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


class SchemaspaceExport(SchemaspaceBase):
    """Handles the 'export' subcommand functionality for a specific schemaspace."""

    schema_name_option = CliOption(
        "--schema_name",
        name="schema_name",
        description="The schema name of the metadata instances to export",
        required=False,
    )

    include_invalid_flag = Flag(
        "--include-invalid",
        name="include-invalid",
        description="Export valid and invalid instances. " "By default only valid instances are exported.",
        default_value=False,
    )

    clean_flag = Flag(
        "--clean", name="clean", description="Clear out contents of the export directory", default_value=False
    )

    directory_option = CliOption(
        "--directory",
        name="directory",
        description="The local file system path where the exported metadata will be stored",
        required=True,
    )

    # 'Export' flags
    options: List[Option] = [schema_name_option, include_invalid_flag, clean_flag, directory_option]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.metadata_manager = MetadataManager(schemaspace=self.schemaspace)

    def start(self):
        super().start()  # process options

        schema_name = self.schema_name_option.value
        if schema_name:
            schema_list = sorted(list(self.schemas.keys()))
            if schema_name not in schema_list:
                print(
                    f"Schema name '{schema_name}' is invalid. For the '{self.schemaspace}' schemaspace, "
                    f"the schema name must be one of {schema_list}"
                )
                self.exit(1)

        include_invalid = self.include_invalid_flag.value
        directory = self.directory_option.value
        clean = self.clean_flag.value

        try:
            if self.schema_name_option is not None:
                metadata_instances = self.metadata_manager.get_all(
                    include_invalid=include_invalid, of_schema=schema_name
                )
            else:
                metadata_instances = self.metadata_manager.get_all(include_invalid=include_invalid)
        except MetadataNotFoundError:
            metadata_instances = None

        if not metadata_instances:
            print(
                f"No metadata instances found for schemaspace '{self.schemaspace}'"
                + (f" and schema '{schema_name}'" if schema_name else "")
            )
            print(f"Nothing exported to '{directory}'")
            return

        dest_directory = os.path.join(directory, self.schemaspace)

        if not os.path.exists(dest_directory):
            try:
                print(f"Creating directory structure for '{dest_directory}'")
                os.makedirs(dest_directory)
            except OSError as e:
                print(f"Error creating directory structure for '{dest_directory}': {e.strerror}: '{e.filename}'")
                self.exit(1)
        else:
            if clean:
                files = [os.path.join(dest_directory, f) for f in os.listdir(dest_directory)]
                if len(files) > 0:
                    print(f"Cleaning out all files in '{dest_directory}'")
                    [os.remove(f) for f in files if os.path.isfile(f)]

        print(
            f"Exporting metadata instances for schemaspace '{self.schemaspace}'"
            + (f" and schema '{schema_name}'" if schema_name else "")
            + (" (includes invalid)" if include_invalid else " (valid only)")
            + f" to '{dest_directory}'"
        )
        num_valid_exported = 0
        num_invalid_exported = 0
        for instance in metadata_instances:
            dict_metadata = instance.to_dict()
            output_file = os.path.join(dest_directory, f'{dict_metadata["name"]}.json')
            if "reason" in dict_metadata and len(dict_metadata["reason"]) > 0:
                num_invalid_exported += 1
            else:
                num_valid_exported += 1
            with open(output_file, mode="w") as output_file:
                json.dump(dict_metadata, output_file, indent=4)

        total_exported = num_valid_exported + num_invalid_exported
        print(
            f"Exported {total_exported} "
            + ("instances" if total_exported > 1 else "instance")
            + f" ({num_invalid_exported} of which "
            + ("is" if num_invalid_exported == 1 else "are")
            + " invalid)"
        )


class SchemaspaceImport(SchemaspaceBase):
    """Handles the 'import' subcommand functionality for a specific schemaspace."""

    directory_option = CliOption(
        "--directory",
        name="directory",
        description="The local file system path from where the metadata will be imported",
        required=True,
    )

    overwrite_flag = Flag(
        "--overwrite",
        name="overwrite",
        description="Overwrite existing metadata instance with the same name",
        default_value=False,
    )

    # 'Import' flags
    options: List[Option] = [directory_option, overwrite_flag]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.metadata_manager = MetadataManager(schemaspace=self.schemaspace)

    def start(self):
        super().start()  # process options

        src_directory = self.directory_option.value

        try:
            json_files = [f for f in os.listdir(src_directory) if f.endswith(".json")]
        except OSError as e:
            print(f"Unable to reach the '{src_directory}' directory: {e.strerror}: '{e.filename}'")
            self.exit(1)

        if len(json_files) == 0:
            print(f"No instances for import found in the '{src_directory}' directory")
            return

        metadata_file = None
        non_imported_files = []

        for file in json_files:
            filepath = os.path.join(src_directory, file)
            try:
                with open(filepath) as f:
                    metadata_file = json.loads(f.read())
            except OSError as e:
                non_imported_files.append([file, e.strerror])
                continue

            name = os.path.splitext(file)[0]
            try:
                schema_name = metadata_file["schema_name"]
                display_name = metadata_file["display_name"]
                metadata = metadata_file["metadata"]
            except KeyError as e:
                non_imported_files.append([file, f"Could not find '{e.args[0]}' key in the import file '{filepath}'"])
                continue

            try:
                if self.overwrite_flag.value:  # if overwrite flag is true
                    try:  # try updating the existing instance
                        updated_instance = self.metadata_manager.get(name)
                        updated_instance.schema_name = schema_name
                        if display_name:
                            updated_instance.display_name = display_name
                        if name:
                            updated_instance.name = name
                        updated_instance.metadata.update(metadata)
                        self.metadata_manager.update(name, updated_instance)
                    except MetadataNotFoundError:  # no existing instance - create new
                        instance = Metadata(
                            schema_name=schema_name, name=name, display_name=display_name, metadata=metadata
                        )
                        self.metadata_manager.create(name, instance)
                else:
                    instance = Metadata(
                        schema_name=schema_name, name=name, display_name=display_name, metadata=metadata
                    )
                    self.metadata_manager.create(name, instance)
            except Exception as e:
                if isinstance(e, MetadataExistsError):
                    non_imported_files.append([file, f"{str(e)} Use '--overwrite' to update."])
                else:
                    non_imported_files.append([file, str(e)])

        instance_count_not_imported = len(non_imported_files)
        instance_count_imported = len(json_files) - instance_count_not_imported

        print(f"Imported {instance_count_imported} " + ("instance" if instance_count_imported == 1 else "instances"))

        if instance_count_not_imported > 0:
            print(
                f"{instance_count_not_imported} "
                + ("instance" if instance_count_not_imported == 1 else "instances")
                + " could not be imported"
            )

            non_imported_files.sort(key=lambda x: x[0])
            print("\nThe following files could not be imported: ")

            # pad to width of longest file and reason
            max_file_name_len = len("File")
            max_reason_len = len("Reason")
            for file in non_imported_files:
                max_file_name_len = max(len(file[0]), max_file_name_len)
                max_reason_len = max(len(file[1]), max_reason_len)

            print(f"{'File'.ljust(max_file_name_len)}   {'Reason'.ljust(max_reason_len)}")
            print(f"{'----'.ljust(max_file_name_len)}   {'------'.ljust(max_reason_len)}")
            for file in non_imported_files:
                print(f"{file[0].ljust(max_file_name_len)}   {file[1].ljust(max_reason_len)}")


class SubcommandBase(AppBase):
    """Handles building the appropriate subcommands based on existing schemaspaces."""

    subcommand_description = None  # Overridden in subclass
    schemaspace_base_class = None  # Overridden in subclass

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.schemaspace_schemas = kwargs["schemaspace_schemas"]

        # For each schemaspace in current schemas, add a corresponding subcommand
        # This requires a new subclass of the SchemaspaceList class with an appropriate description
        self.subcommands = {}
        for schemaspace, schemas in self.schemaspace_schemas.items():
            subcommand_description = self.subcommand_description.format(schemaspace=schemaspace)
            # Create the appropriate schemaspace class, initialized with its description,
            # schemaspace, and corresponding schemas as attributes,
            schemaspace_class = type(
                schemaspace,
                (self.schemaspace_base_class,),
                {"description": subcommand_description, "schemaspace": schemaspace, "schemas": schemas},
            )
            self.subcommands[schemaspace] = (schemaspace_class, schemaspace_class.description)

    def start(self):
        subcommand = self.get_subcommand()
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


class Remove(SubcommandBase):
    """Removes a metadata instance from a given schemaspace."""

    description = "Remove a metadata instance from a given schemaspace."
    subcommand_description = "Remove a metadata instance from schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceRemove


class Create(SubcommandBase):
    """Creates a metadata instance in a given schemaspace."""

    description = "Create a metadata instance in a given schemaspace."
    subcommand_description = "Create a metadata instance in schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceCreate


class Update(SubcommandBase):
    """Updates a metadata instance in a given schemaspace."""

    description = "Update a metadata instance in a given schemaspace."
    subcommand_description = "Update a metadata instance in schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceUpdate


class Migrate(SubcommandBase):
    """Migrates metadata instances in a given schemaspace."""

    description = "Migrate metadata instances in a given schemaspace."
    subcommand_description = "Migrate metadata instance in schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceMigrate


class Export(SubcommandBase):
    """Exports metadata instances in a given schemaspace."""

    description = "Export metadata instances in a given schemaspace."
    subcommand_description = "Export installed metadata in schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceExport


class Import(SubcommandBase):
    """Imports metadata instances into a given schemaspace."""

    description = "Import metadata instances into a given schemaspace."
    subcommand_description = "Import metadata instances into schemaspace '{schemaspace}'."
    schemaspace_base_class = SchemaspaceImport


class MetadataApp(AppBase):
    """Lists, creates, updates, removes, migrates, exports and imports metadata for a given schemaspace."""

    name = "elyra-metadata"
    description = """Manage Elyra metadata."""

    subcommands = {
        "list": (List, List.description.splitlines()[0]),
        "create": (Create, Create.description.splitlines()[0]),
        "update": (Update, Update.description.splitlines()[0]),
        "remove": (Remove, Remove.description.splitlines()[0]),
        "migrate": (Migrate, Migrate.description.splitlines()[0]),
        "export": (Export, Export.description.splitlines()[0]),
        "import": (Import, Import.description.splitlines()[0]),
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
        args = kwargs.get("argv", [])
        if len(args) > 0:
            # identify commands that can operate on deprecated schemaspaces
            include_deprecated = args[0] not in ["install", "create", "update", "import"]
        schemaspace_names = schema_mgr.get_schemaspace_names(include_deprecated=include_deprecated)
        for name in schemaspace_names:
            self.schemaspace_schemas[name] = schema_mgr.get_schemaspace_schemas(name)

    def start(self):
        subcommand = self.get_subcommand()
        subinstance = subcommand[0](argv=self.argv, schemaspace_schemas=self.schemaspace_schemas)
        return subinstance.start()

    def print_help(self):
        super().print_help()
        self.print_subcommands()


if __name__ == "__main__":
    MetadataApp.main()
