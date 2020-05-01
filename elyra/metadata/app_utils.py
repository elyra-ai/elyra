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
import ast
import io
import json
import logging
import os
import sys
import warnings

"""Utility functions and classes used for metadata applications and classes."""

logging.basicConfig(level=logging.INFO, format='[%(levelname)1.1s %(asctime)s.%(msecs).03d] %(message)s')

def load_namespaces(schema_dir=None):
    """Loads the static schema files into a dictionary indexed by namespace.
       If schema_dir is not specified, the static location relative to this
       file will be used.

       Note: The schema file must have a top-level string-valued attribute
       named 'namespace' to be included in the resulting dictionary.
    """
    namespace_schemas = {}

    if schema_dir is None:
        schema_dir = os.path.join(os.path.dirname(__file__), 'schemas')
    if not os.path.exists(schema_dir):
        raise RuntimeError("Metadata schema directory '{}' was not found!".format(schema_dir))

    schema_files = [json_file for json_file in os.listdir(schema_dir) if json_file.endswith('.json')]
    for json_file in schema_files:
        schema_file = os.path.join(schema_dir, json_file)
        with io.open(schema_file, 'r', encoding='utf-8') as f:
            schema_json = json.load(f)
        namespace = schema_json.get('namespace')
        if namespace is None:
            warnings.warn("Schema file '{}' is missing its namespace attribute!  Skipping...".format(schema_file))
            continue
        if namespace not in namespace_schemas:  # Create the namespace dict
            namespace_schemas[namespace] = {}
        # Add the schema file indexed by name within the namespace
        name = schema_json.get('name')
        if name is None:
            # If schema is missing a name attribute, use file's basename.
            name = os.path.splitext(os.path.basename(schema_file))[0]
        namespace_schemas[namespace][name] = schema_json

    return namespace_schemas


class Option(object):
    """Represents a command-line option.
    The name represents an attribute on the object of the calling class.
    """
    cli_option = None
    name = None
    description = None
    default_value = None
    required = False
    value = None
    type = None  # Only used by Property instances for now
    processed = False

    def __init__(self, cli_option, name=None, description=None, default_value=None, required=False, type=None):
        self.cli_option = cli_option
        self.name = name
        self.description = description
        self.default_value = default_value
        self.value = default_value
        self.required = required
        self.type = type

    def set_value(self, value):
        if self.type == 'array':
            self.value = ast.literal_eval(value)
        else:
            self.value = value


class Flag(Option):
    """Represents a command-line flag."""

    option = None

    def __init__(self, flag, option=None, **kwargs):
        super(Flag, self).__init__(flag, **kwargs)
        self.option = option


class Property(Option):
    """Represents the necessary information to handle a property from the schema.
       No validation is performed on corresponding instance values since the
       schema validation in the metadata service applies that.
       Property instances are initialized from the corresponding property stanza
       from the schema
    """
    def __init__(self, name, schema_property):
        cli_option = '--' + name
        super(Property, self).__init__(cli_option=cli_option, name=name,
                                       description=schema_property.get('description'),
                                       default_value=schema_property.get('default'),
                                       type=schema_property.get('type'))


class MetadataProperty(Property):
    """Represents the property from the schema that resides in the Metadata stanza.
    """

    def __init__(self, name, schema_property):
        super(MetadataProperty, self).__init__(name, schema_property)


class AppBase(object):
    """Base class for application-level classes.  Provides logging, arguments handling,
       help methods, and anything common to its derived classes.
    """
    subcommands = {}
    description = None
    argv = []
    argv_mappings = {}  # Contains separation of argument name to value

    def __init__(self, **kwargs):
        self.argv = kwargs['argv']
        self._get_argv_mappings()
        self.log = logging.getLogger()

    def _get_argv_mappings(self):
        """Walk argv and build mapping from argument to value for later processing. """
        log_option = None
        for arg in self.argv:
            if '=' in arg:
                option, value = arg.split('=', 1)
            else:
                option, value = arg, None
            # Check for --debug or --log-level option.  if cound set, appropriate
            # log-level and skip.  Note this so we can alter self.argv after processing.
            if option == '--debug':
                log_option = arg
                logging.getLogger().setLevel(logging.DEBUG)
                continue
            elif option == '--log-level':
                log_option = arg
                logging.getLogger().setLevel(value)
                continue
            self.argv_mappings[option] = value
        if log_option:
            self.argv.remove(log_option)

    def log_and_exit(self, msg, exit_status=1, display_help=False):
        self.log.error(msg)
        if display_help:
            print()
            self.print_help()
        self.exit(exit_status)

    def get_subcommand(self):
        """Checks argv[0] to see if it matches one of the expected subcommands. If so,
           that item is removed from argv and that subcommand tuple (class, description)
           is returned.  If no an expected subcommand is not found (None, None) is returned.
        """
        if len(self.argv) > 0:
            arg = self.argv[0]
            if arg in self.subcommands.keys():
                subcommand = self.subcommands.get(arg)
                self._remove_argv_entry(arg)
                return subcommand

            if not arg.startswith('--help'):
                self.log.error("Subcommand '{}' is invalid.".format(self.argv[0]))
        return None

    def exit_no_subcommand(self):
        print("No subcommand specified. Must specify one of: %s" % list(self.subcommands))
        print()
        self.print_description()
        self.print_subcommands()
        self.exit(1)

    @staticmethod
    def schema_to_options(schema):
        """Takes a JSON schema and builds a list of Property instances corresponding to each
           property in the schema.  There are two section of properties, one that includes
           schema_name and display_name and another within the metadata container - which
           will be separated by class type - Property vs. MetadataProperty.
        """
        options = {}
        properties = schema['properties']
        for name, value in properties.items():
            if name == 'schema_name':  # already have this option, skip
                continue
            if name != 'metadata':
                options[name] = Property(name, value)
            else:  # process metadata properties...
                metadata_properties = properties['metadata']['properties']
                for md_name, md_value in metadata_properties.items():
                    options[md_name] = MetadataProperty(md_name, md_value)

        # Now set required-ness on MetadataProperties and top-level Properties
        required_props = properties['metadata'].get('required')
        for required in required_props:
            options.get(required).required = True

        required_props = schema.get('required')
        for required in required_props:
            if required != 'schema_name':  # skip schema_name, already required
                options.get(required).required = True
        return list(options.values())

    def process_cli_option(self, option):
        """Check if the given option exists in the current arguments.  If found set its
           the Option instance's value to that of the argv.  Once processed, update the
           argv lists by removing the option.  If the option is a required property and
           is not in the argv lists or does not have a value, exit.
        """
        if option.processed:
            return
        cli_option = option.cli_option
        if cli_option in self.argv_mappings.keys():
            if isinstance(option, Flag):  # flags set their option object from their value
                flag = option
                # Only if flag is associated with an option should we transfer the value,
                # else just use what's there.
                if flag.option:
                    flag.option.value = flag.value
            else:  # this is a regular option, just set value
                option.set_value(self.argv_mappings.get(cli_option))
                if option.required and not option.value:
                    self.log_and_exit("'{}' is a required parameter.".format(option.cli_option), display_help=True)
            self._remove_argv_entry(cli_option)
        elif option.required:
            self.log_and_exit("'{}' is a required parameter.".format(option.cli_option), display_help=True)
        option.processed = True

    def process_cli_options(self, cli_options):
        """For each Option instance in the list, process it according to the argv lists.
           After traversal, if arguments still remain, log help and exit.
        """
        for option in cli_options:
            self.process_cli_option(option)

        # Check if there are still unprocessed arguments.  If so, and fail_unexpected is true,
        # log and exit, else issue warning and continue.  Prior to doing so, check if --help
        # is one of the options and process accordingly.
        if len(self.argv) > 0:
            # check for help options here and print help, then exit
            need_help = 0
            help_arg = None
            for arg in self.argv:
                if arg.startswith('--help'):
                    help_arg = arg
                    need_help += 1

            if need_help > 0 and need_help < len(self.argv):  # help was with other invalid args.
                self.argv.remove(help_arg)
                msg = "The following arguments were unexpected: {}".format(self.argv)
                self.log_and_exit(msg, display_help=True)
            else:
                self.print_help()
                self.exit(1)

    def _remove_argv_entry(self, cli_option):
        """Removes the argument entry corresponding to cli_option in both
           self.argv and self.argv_mappings
        """
        # build the argv entry from the mappings since it must be located with name=value
        if cli_option not in self.argv_mappings.keys():
            self.log.error("Can't find option '{}' in argv!".format(cli_option))
            exit(1)

        entry = cli_option
        value = self.argv_mappings.get(cli_option)
        if value:
            entry = entry + '=' + value
        self.argv.remove(entry)
        self.argv_mappings.pop(cli_option)

    def print_help(self):
        self.print_description()

    def print_description(self):
        print(self.description)

    def print_subcommands(self):
        print()
        print("Subcommands")
        print("-----------")
        print("Subcommands are launched as `elyra metadata cmd [args]`. For information on")
        print("using subcommand 'cmd', do: `elyra metadata cmd -h`.")
        print()
        for subcommand, desc in self.subcommands.items():
            print(subcommand)
            print("    {}".format(desc[1]))

    def exit(self, status):
        sys.exit(status)
