#
# Copyright 2018-2025 Elyra Authors
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
import json
import logging
import os.path
import sys
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Set

from elyra.metadata.manager import MetadataManager

"""Utility functions and classes used for metadata applications and classes."""

logging.basicConfig(level=logging.INFO, format="[%(levelname)1.1s %(asctime)s.%(msecs).03d] %(message)s")


class Option(object):
    """Represents the base option class."""

    def __init__(
        self,
        cli_option: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        default_value: Optional[Any] = None,
        value: Optional[Any] = None,
        enum: Optional[List[Any]] = None,
        required: bool = False,
        type: str = "string",
    ):
        self.cli_option: str = cli_option
        self.name: Optional[str] = name
        self.description: Optional[str] = description
        self.default_value = default_value
        self.value: Optional[Any] = default_value
        self.enum: Optional[List[Any]] = enum
        self.required: bool = required
        self.type: str = type
        self.processed: bool = False
        self.bad_value: Optional[str] = None  # set_value() can set this to an error message

    def set_value(self, value: Any):
        try:
            if self.type == "string":
                self.value = value
            elif self.type == "array":
                self.value = Option.coerce_array_value(value)
            elif self.type == "object":
                self.value = self._get_object_value(value)
            elif self.type == "integer":
                self.value = int(value)
            elif self.type == "number":
                if "." in value:
                    self.value = float(value)
                else:
                    self.value = int(value)
            elif self.type == "boolean":
                if isinstance(value, bool):
                    self.value = value
                elif str(value).lower() in ("true", "1"):
                    self.value = True
                elif str(value).lower() in ("false", "0"):
                    self.value = False
                else:
                    self.value = value  # let it take its course
            elif self.type == "null":
                if str(value) in ("null", "None"):
                    self.value = None
                else:
                    self.value = value
            else:  # type is None, try special ast eval...
                try:
                    self.value = ast.literal_eval(value)
                except Exception:  # Just go with what they gave since type is undefined
                    self.value = value
        except (ValueError, SyntaxError):
            self.handle_value_error(value)

    def _get_object_value(self, value: str) -> Dict:
        """Checks if value is an existing filename, if so, it reads the file and loads its JSON,
        otherwise, it evaluates the string and ensures its evaluated as a dictionary.
        """
        object_value: Optional[Dict] = None
        if os.path.isfile(value):
            try:
                with open(value) as json_file:
                    try:
                        object_value = json.load(json_file)
                    except Exception as ex1:
                        self.bad_value = (
                            f"Parameter '{self.cli_option}' requires a JSON-formatted file or string "
                            f"and the following error occurred attempting to load {value}'s contents "
                            f"as JSON: '{ex1}'.  Try again with an appropriately formatted file."
                        )
            except Exception as ex:
                if self.bad_value is None:  # Error is file-related
                    self.bad_value = (
                        f"Parameter '{self.cli_option}' requires a JSON-formatted file or string "
                        f"and the following error occurred attempting to open file '{value}': '{ex}'.  "
                        f"Try again with an appropriately formatted file."
                    )

        else:  # not a file, so evaluate and ensure its of the right type
            try:
                object_value = ast.literal_eval(value)  # use ast over json.loads as its more forgiving
            except Exception as ex:
                self.bad_value = (
                    f"Parameter '{self.cli_option}' requires a JSON-formatted file or string and "
                    f"the following error occurred attempting to interpret the string as JSON: '{ex}'.  "
                    f"Try again with an appropriate value."
                )

            if type(object_value) is not dict:
                self.bad_value = (
                    f"Parameter '{self.cli_option}' requires a JSON-formatted file or string and "
                    f"could not interpret the string as a dictionary and got a {type(object_value)} "
                    f"instead.  Try again with an appropriate value."
                )
        return object_value

    @staticmethod
    def coerce_array_value(value: Any):
        new_value = value
        if value[0] != "[" and value[-1] != "]":  # attempt to coerce to list
            new_value = str(value.split(","))
        # The following assumes the array items should be strings and will break
        # non-quoted items like integers, numbers and booleans.  Its being left
        # here in case we want to support that scenario, which would likely mean
        # checking the entries to ensure they are expecting string values before
        # splitting.
        # elif value[0] == '[' and value[-1] == ']':
        #     # we have brackets.  If not internal quotes split within the brackets.
        #     # This handles the common (but invalid) "[item1,item2]" format.
        #     if value[1] not in ["'", '"'] and value[-2] not in ["'", '"']:
        #         new_value = str(value[1:-1].split(","))
        return ast.literal_eval(new_value)

    @staticmethod
    def get_article(type: str) -> str:
        vowels = ["a", "e", "i", "o", "u"]  # we'll deal with 'y' as needed
        if type[0] in vowels:
            return "an"
        return "a"

    def get_format_hint(self) -> str:
        if self.enum:
            msg = f"must be one of: {self.enum}"
        elif self.type == "array":
            msg = "\"['item1', 'item2']\" or \"item1,item2\""
        elif self.type == "object":
            msg = "\"{'str1': 'value1', 'int2': 2}\" or file containing JSON"
        elif self.type == "integer":
            msg = "'n' where 'n' is an integer"
        elif self.type == "number":
            msg = "'n.m' where 'n' and 'm' are integers"
        elif self.type == "boolean":
            msg = "'true' or 'false'"
        elif self.type == "null":
            msg = "'null' or 'None'"
        elif self.type == "string":
            msg = "sequence of characters"
        else:
            msg = "Can't be determined"

        return msg

    def handle_value_error(self, value: Any) -> None:
        pre_amble = f"Parameter '{self.cli_option}' requires {Option.get_article(self.type)} {self.type} with format:"
        post_amble = f'and "{value}" was given.  Try again with an appropriate value.'
        self.bad_value = f"{pre_amble} {self.get_format_hint()} {post_amble}"

    def get_additional_info(self) -> str:
        return ""

    def print_help(self):
        data_type = self.type if self.type is not None else "?"
        option_entry = f"{self.cli_option}=<{data_type}>"
        required_entry = ""
        if self.required:
            required_entry = "Required. "
        format_entry = f"Format: {self.get_format_hint()}"
        additional_info = self.get_additional_info()
        print(f"{option_entry} ({required_entry}{format_entry}) {additional_info}")
        self.print_description()

    def print_description(self):
        print(f"\t{self.description}")


class Flag(Option):
    """Represents a command-line flag.  When present, the value used is `not default_value`."""

    def __init__(self, flag: str, **kwargs):
        super().__init__(flag, type="boolean", **kwargs)

    def print_help(self):
        print(self.cli_option)
        self.print_description()


class CliOption(Option):
    """Represents a command-line option."""

    def __init__(self, cli_option: str, **kwargs):
        super().__init__(cli_option, **kwargs)


class SchemaProperty(CliOption):
    """Represents the necessary information to handle a property from the schema.
    No validation is performed on corresponding instance values since the
    schema validation in the metadata service applies that.
    SchemaProperty instances are initialized from the corresponding property stanza
    from the schema
    """

    # The following keywords are not supported. If encountered, an exception will be
    # raised indicating that --file or --json be used, or, if an object-valued property
    unsupported_keywords = {"$ref", "$defs", "$anchor", "oneOf", "anyOf", "allOf"}

    # Skip the following keywords when building the description.  We will already
    # have description and type and the others are difficult to display in a succinct manner.
    # Schema validation will still enforce these.
    skipped_keywords = {
        "description",
        "type",
        "items",
        "additionalItems",
        "properties" "propertyNames",
        "dependencies",
        "examples",
        "contains",
        "additionalProperties",
        "patternProperties",
    }.union(unsupported_keywords)
    # Turn off the inclusion of meta-property information in the printed help messages  (Issue #837)
    print_meta_properties = False

    def __init__(self, name: str, schema_property: Dict):
        self.schema_property = schema_property
        cli_option = "--" + name

        super().__init__(
            cli_option=cli_option,
            name=name,
            description=schema_property.get("description"),
            default_value=schema_property.get("default"),
            enum=schema_property.get("enum"),
            type=schema_property.get("type"),
        )

    def print_description(self):
        additional_clause = ""
        if self.print_meta_properties:  # Only if enabled
            for meta_prop, value in self.schema_property.items():
                if meta_prop in self.skipped_keywords:
                    continue
                additional_clause = self._build_clause(additional_clause, meta_prop, value)

        description = self.description or ""
        print(f"\t{description}{additional_clause}")

    def _build_clause(self, additional_clause, meta_prop, value):
        if len(additional_clause) == 0:
            additional_clause = additional_clause + "; "
        else:
            additional_clause = additional_clause + ", "
        additional_clause = additional_clause + meta_prop + ": " + str(value)
        return additional_clause


class MetadataSchemaProperty(SchemaProperty):
    """Represents the property from the schema that resides in the Metadata stanza."""

    def __init__(self, name: str, schema_property: Dict):
        super().__init__(name, schema_property)
        self.unsupported_meta_props = self._get_unsupported_keywords()

    def get_additional_info(self) -> str:
        if self.unsupported_meta_props:
            return f"*** References unsupported keywords: {self.unsupported_meta_props}.  See note below."
        return super().get_additional_info()

    def _get_unsupported_keywords(self) -> Set[str]:
        """Returns the set of unsupported keywords found at the top-level of this property's schema."""
        # Gather top-level property names from schema into a set and return the intersection
        # with the unsupported keywords.
        schema_props = set(self.schema_property.keys())
        return schema_props & SchemaProperty.unsupported_keywords


class JSONBasedOption(CliOption):
    """Represents a command-line option representing a JSON string."""

    def __init__(self, cli_option: str, **kwargs):
        super().__init__(cli_option, type="object", **kwargs)
        self._schema_name_arg = None
        self._display_name_arg = None
        self._name_arg = None
        self._metadata = None

    @property
    def schema_name_arg(self) -> str:
        if self._schema_name_arg is None:
            if self.value is not None:
                self._schema_name_arg = self.value.get("schema_name")
        return self._schema_name_arg

    @property
    def display_name_arg(self) -> str:
        if self._display_name_arg is None:
            if self.value is not None:
                self._display_name_arg = self.value.get("display_name")
        return self._display_name_arg

    @property
    def name_arg(self) -> str:  # Overridden in base class
        return self._name_arg

    @property
    def metadata(self) -> Dict:
        """Returns the metadata stanza in the JSON.  If not present, it considers
        the complete JSON to be the "metadata stanza", allowing applications to
        create instances more easily.
        """
        if self._metadata is None:
            if self.value is not None:
                self._metadata = self.value.get("metadata")
                # This stanza may not be present.  If not, set to the
                # entire json since this could be the actual user data (feature)
                if self._metadata is None:
                    self._metadata = self.value
            if self._metadata is None:
                self._metadata = {}

        return self._metadata

    def transfer_names_to_argvs(self, argv: List[str], argv_mappings: Dict[str, str]):
        """Transfers the values for schema_name, display_name and name to the argv sets if not currently set
        via command line.  This can simplify the command line when already specified in the JSON.  It also
        enables a way for these values to override the values in the JSON by setting them on the command line.
        """
        for option in ["schema_name", "display_name", "name"]:
            arg: str = f"--{option}"
            if arg not in argv_mappings.keys():
                if option == "schema_name":
                    name = self.schema_name_arg
                elif option == "display_name":
                    name = self.display_name_arg
                else:
                    name = self.name_arg
                if name is not None:  # Only include if we have a value
                    argv_mappings[arg] = name
                    argv.append(f"{arg}={name}")


class JSONOption(JSONBasedOption):
    """Represents a command-line option representing a JSON string."""

    @property
    def name_arg(self):
        # Name can be derived from display_name using normalization method.
        if self._name_arg is None:
            if self.value is not None and self.display_name_arg is not None:
                self._name_arg = MetadataManager.get_normalized_name(self.display_name_arg)
        return self._name_arg

    def get_format_hint(self) -> str:
        return (
            "A JSON-formatted string consisting of at least the 'metadata' stanza "
            "(e.g., --json=\"{'metadata': { 'value1', 'int2': 2 }}\""
        )

    def set_value(self, value: str):
        """Take the given value (json), and load it into a dictionary to ensure it parses as JSON."""
        # Confirm that value a) is not None and b) specifies an existing file
        if value is None:
            self.bad_value = (
                "Parameter '--json' requires a value with format JSON and no value was provided.  "
                "Try again with an appropriate value."
            )
        else:
            super().set_value(value)


class FileOption(JSONBasedOption):
    """Represents a command-line option representing a file containing JSON."""

    def __init__(self, cli_option: str, **kwargs):
        super().__init__(cli_option, **kwargs)
        self.filename = ""

    @property
    def name_arg(self):
        # Name can be derived from the filename
        if self._name_arg is None:
            if self.value is not None:
                self._name_arg = os.path.splitext(os.path.basename(self.filename))[0]
        return self._name_arg

    def get_format_hint(self) -> str:
        return "An existing file containing valid JSON consisting of at least the 'metadata' stanza"

    def set_value(self, value: str):
        """Take the given value (file), open the file and load it into a dictionary to ensure it parses as JSON."""
        # Confirm that value a) is not None and b) specifies an existing file
        if value is None:
            self.bad_value = (
                "Parameter '--file' requires a file with format JSON and no value was provided.  "
                "Try again with an appropriate value."
            )
        else:
            if not os.path.isfile(value):
                self.bad_value = (
                    f"Parameter '--file' requires a file with format JSON and {value} is not a file.  "
                    "Try again with an appropriate value."
                )
            else:
                self.filename = value
                super().set_value(value)

    def handle_value_error(self, value: Any) -> None:
        pre_amble = "Parameter '--file' requires a file with format: JSON "
        post_amble = f'and "{value}" was given.  Try again with an appropriate value.'
        self.bad_value = f"{pre_amble} {self.get_format_hint()} {post_amble}"


class AppBase(object):
    """Base class for application-level classes.  Provides logging, arguments handling,
    help methods, and anything common to its derived classes.
    """

    subcommands = {}
    description = None
    argv = []
    argv_mappings = {}  # Contains separation of argument name to value

    def __init__(self, **kwargs):
        self.argv = kwargs["argv"]
        self._get_argv_mappings()
        self.log = logging.getLogger()  # setup logger so that metadata service logging is displayed

    def _get_argv_mappings(self):
        """Walk argv and build mapping from argument to value for later processing."""
        check_next_parameter: bool = False
        log_option: Optional[str] = None
        option: str = ""  # set to empty to satsify linter in check_next_parameter logic below
        value: Optional[str]
        for arg in self.argv:
            if check_next_parameter:
                check_next_parameter = False
                if not arg.startswith("--"):
                    # if this doesn't specify a new argument,
                    # set this value as the previous option's value
                    self.argv_mappings[option] = arg
                    continue
            if "=" in arg:
                option, value = arg.split("=", 1)
            else:
                option, value = arg, None
            # Check for --debug or --log-level option.  if found set, appropriate
            # log-level and skip.  Note this so we can alter self.argv after processing.
            if option == "--debug":
                log_option = arg
                logging.getLogger().setLevel(logging.DEBUG)
                continue
            elif option == "--log-level":
                log_option = arg
                logging.getLogger().setLevel(value)
                continue
            # Handle case where an argument specifies its parameter w/o an `=`
            # to enable better flexibility and compatibility with other CLI tools.
            if option.startswith("--") and value is None:
                check_next_parameter = True

            self.argv_mappings[option] = value
        if log_option:
            self.argv.remove(log_option)

    def log_and_exit(self, msg: Optional[str] = None, exit_status: int = 1, display_help: bool = False):
        if msg:
            # Prefix message with 'ERROR: ' if we're going to follow it up with full usage so
            # the error is not lost amongst the usage.
            full_msg = f"ERROR: {msg}" if display_help else msg
            print(full_msg)

        if display_help:
            print()
            self.print_help()

        AppBase.exit(exit_status)

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

            if arg in ["--help", "-h"]:
                self.log_and_exit(display_help=True)

            msg = f"Subcommand '{self.argv[0]}' is invalid."
        else:
            msg = "No subcommand specified."
        self.exit_no_subcommand(msg)

    def exit_no_subcommand(self, msg: str):
        print(f"{msg}  One of: {list(self.subcommands)} must be specified.")
        print()
        self.print_subcommands()
        self.exit(1)

    def process_cli_option(self, cli_option: Option, check_help: bool = False):
        """Check if the given option exists in the current arguments.  If found set its
        the Option instance's value to that of the argv.  Once processed, update the
        argv lists by removing the option.  If the option is a required property and
        is not in the argv lists or does not have a value, exit.
        """
        # if check_help is enabled, check the arguments for help options and
        # exit if found. This is only necessary when processing individual options.
        if check_help and self.has_help():
            self.log_and_exit(display_help=True)

        if cli_option.processed:
            return
        option = cli_option.cli_option
        if option in self.argv_mappings.keys():
            if isinstance(cli_option, Flag):  # flags set their value opposite their default
                cli_option.value = not cli_option.default_value
            else:  # this is a regular option, just set value
                cli_option.set_value(self.argv_mappings.get(option))
                if cli_option.bad_value:
                    self.log_and_exit(cli_option.bad_value, display_help=True)
                if cli_option.required:
                    if not cli_option.value:
                        self.log_and_exit(f"Parameter '{cli_option.cli_option}' requires a value.", display_help=True)
                    elif cli_option.enum:  # ensure value is in set
                        if cli_option.value not in cli_option.enum:
                            self.log_and_exit(
                                f"Parameter '{cli_option.cli_option}' requires one of the "
                                f"following values: {cli_option.enum}",
                                display_help=True,
                            )
            self._remove_argv_entry(option)
        elif cli_option.required and cli_option.value is None:
            if cli_option.enum is None:
                self.log_and_exit(f"'{cli_option.cli_option}' is a required parameter.", display_help=True)
            else:
                self.log_and_exit(
                    f"'{cli_option.cli_option}' is a required parameter and must be one of the "
                    f"following values: {cli_option.enum}.",
                    display_help=True,
                )

        cli_option.processed = True

    def process_cli_options(self, cli_options: List[Option]):
        """For each Option instance in the list, process it according to the argv lists.
        After traversal, if arguments still remain, log help and exit.
        """
        # Since we're down to processing options (no subcommands), scan the arguments
        # for help entries and, if found, exit with the help message.
        if self.has_help():
            self.log_and_exit(display_help=True)

        for option in cli_options:
            self.process_cli_option(option)

        # Check if there are still unprocessed arguments.  If so, and fail_unexpected is true,
        # log and exit, else issue warning and continue.
        if len(self.argv) > 0:
            msg = f"The following arguments were unexpected: {self.argv}"
            self.log_and_exit(msg, display_help=True)

    def has_help(self):
        """Checks the arguments to see if any match the help options.
        We do this by converting two lists to sets and checking if
        there's an intersection.
        """
        helps = {"--help", "-h"}
        args = set(self.argv_mappings.keys())
        help_list = list(helps & args)
        return len(help_list) > 0

    def _remove_argv_entry(self, cli_option: str):
        """Removes the argument entry corresponding to cli_option in both
        self.argv and self.argv_mappings
        """
        # build the argv entry from the mappings since it must be located with name=value
        if cli_option not in self.argv_mappings.keys():
            self.log_and_exit(f"Can't find option '{cli_option}' in argv!")

        entry = cli_option
        value = self.argv_mappings.get(cli_option)
        if value:
            # Determine if this value is associated with the option via '=' or
            # a "floating" option/value pair
            entry = entry + "=" + value
            if entry in self.argv:
                self.argv.remove(entry)
            else:  # remove both of the "floating" option/value pair
                self.argv.remove(cli_option)
                self.argv.remove(value)
        else:
            self.argv.remove(entry)
        self.argv_mappings.pop(cli_option)

    def print_help(self):
        self.print_description()

    def print_description(self):
        print(self.description or "")

    def print_subcommands(self):
        print()
        print("Subcommands")
        print("-----------")
        print("Subcommands are launched as `elyra-metadata cmd [args]`. For information on")
        print("using subcommand 'cmd', run: `elyra-metadata cmd -h` or `elyra-metadata cmd --help`.")
        print("\nFind more information at https://elyra.readthedocs.io/en/v4.0.0rc2/")
        print()
        for subcommand, desc in self.subcommands.items():
            print(f"{subcommand:<10}{desc[1]:>10}")

    @staticmethod
    def exit(status: int):
        sys.exit(status)
