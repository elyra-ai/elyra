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

from .metadata import Metadata, MetadataManager
from .mixins import AppUtilMixin

from traitlets.config.application import Application
from jupyter_core.application import base_flags
from traitlets import Instance, Dict, Unicode, Bool
from elyra._version import __version__


class CodeSnippet(Metadata):
    namespace = 'code-snippets'


class ListCodeSnippets(AppUtilMixin, Application):
    version = __version__
    description = """List code snippet metadata."""

    metadata_namespace = CodeSnippet.namespace
    metadata_manager = Instance(MetadataManager)

    json_output = Bool(False, help='Output code snippet name and location as machine-readable json.', config=True)
    valid_only = Bool(False, help='Only display valid code snippet metadata.', config=True)

    flags = {'json': ({'ListCodeSnippets': {'json_output': True}},
                      "Output code snippet name and location as machine-readable json."),
             'valid-only': ({'ListCodeSnippets': {'valid_only': True}}, "Only display valid code snippets metadata."),
             'debug': base_flags['debug'],
             }

    def _metadata_manager_default(self):
        return MetadataManager(namespace=self.metadata_namespace)

    def start(self):
        include_invalid = not self.valid_only
        try:
            code_snippets = self.metadata_manager.get_all_metadata_summary(include_invalid=include_invalid)
        except KeyError:
            code_snippets = None

        if not code_snippets:
            print("No metadata available for code snippets at : '{}'"
                  .format(self.metadata_manager.get_metadata_location))
            return

        if self.json_output:
            [print('Code snippet: {} {}\n{}'
                   .format(rt.name, "**INVALID**" if rt.reason and len(rt.reason) > 0 else "", rt.to_json()))
             for rt in code_snippets]
        else:
            code_snippets = sorted(code_snippets, key=lambda code_snippet: code_snippet.name)
            # pad to width of longest code snippet name
            max_name_len = 0
            max_resource_len = 0
            for code in code_snippets:
                max_name_len = max(len(code.name), max_name_len)
                max_resource_len = max(len(code.resource), max_resource_len)

            print("Available metadata for code snippets:")
            for code in code_snippets:
                invalid = ""
                if code.reason and len(code.reason) > 0:
                    invalid = "**INVALID** ({})".format(code.reason)
                print("  %s  %s  %s" % (code.name.ljust(max_name_len),
                                        code.resource.ljust(max_resource_len),
                                        invalid))


class RemoveCodeSnippets(AppUtilMixin, Application):
    version = __version__
    description = """Remove external code-snippet metadata."""

    metadata_namespace = CodeSnippet.namespace
    metadata_manager = Instance(MetadataManager)

    name = Unicode(None, config=True, allow_none=True,
                   help="The name of the code-snippet metadata to remove.")

    aliases = {
        'name': 'RemoveCodeSnippets.name',
    }

    flags = {'debug': base_flags['debug']}

    def _metadata_manager_default(self):
        return MetadataManager(namespace=self.metadata_namespace)

    def start(self):
        self._validate_parameters()
        self.metadata_manager.remove(self.name)

    def _validate_parameters(self):
        self.confirm_required("name", self.name)


class CodeSnippetMetadataApp(AppUtilMixin, Application):
    version = __version__
    name = "jupyter code snippet"
    description = """Manage Jupyter metadata for code snippets."""

    subcommands = Dict({
        'list': (ListCodeSnippets, ListCodeSnippets.description.splitlines()[0]),
        'remove': (RemoveCodeSnippets, RemoveCodeSnippets.description.splitlines()[0]),
    })

    aliases = {}
    flags = {}

    def start(self):
        if self.subapp is None:
            print("No subcommand specified. Must specify one of: %s" % list(self.subcommands))
            print()
            self.print_description()
            self.print_subcommands()
            self.exit(1)
        else:
            return self.subapp.start()


if __name__ == '__main__':
    CodeSnippetMetadataApp.launch_instance()
