import json

from .metadata import Metadata, MetadataManager

from traitlets.config.application import Application
from jupyter_core.application import (
    JupyterApp, base_flags, base_aliases
)
from traitlets import Instance, Dict, Unicode, Bool, List
from ai_workspace._version import __version__


class Runtime(Metadata):
    namespace = 'runtime'


class ListRuntimes(JupyterApp):
    version = __version__
    description = """List installed external runtime metadata."""

    metadata_namespace = "runtime"
    metadata_manager = Instance(MetadataManager)

    json_output = Bool(False, help='output runtime name and location as machine-readable json.', config=True)

    flags = {'json': ({'ListRuntimes': {'json_output': True}},
                      "output runtime name and location as machine-readable json."),
             'debug': base_flags['debug'],
             }

    def _metadata_manager_default(self):
        return MetadataManager(namespace=self.metadata_namespace, data_dir=self.data_dir)

    def start(self):
        runtimes = self.metadata_manager.get_all_metadata_summary()

        if not runtimes:
            print("No metadata available for external runtimes at : '{}'"
                  .format(self.metadata_manager.get_metadata_location))
            return

        if self.json_output:
            print(json.dumps({'runtime': runtimes}, indent=2))
        else:
            # pad to width of longest runtime name
            name_len = 0
            for runtime in runtimes:
                current_name_len = len(runtime.name)
                if current_name_len > name_len:
                    name_len = current_name_len

            print("Available metadata for external runtimes:")
            for runtime in runtimes:
                print("  %s    %s" % (runtime.name.ljust(name_len), runtime.resource))

class RuntimeMetadataApp(Application):
    version = __version__
    name = "jupyter runtime"
    description = """Manage Jupyter metadata for external runtimes."""

    subcommands = Dict({
        'list': (ListRuntimes, ListRuntimes.description.splitlines()[0])
    })

    aliases = {}
    flags = {}

    def start(self):
        if self.subapp is None:
            print("No subcommand specified. Must specify one of: %s"% list(self.subcommands))
            print()
            self.print_description()
            self.print_subcommands()
            self.exit(1)
        else:
            return self.subapp.start()


if __name__ == '__main__':
    RuntimeMetadataApp.launch_instance()


