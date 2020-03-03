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

from traitlets.config.application import Application
from jupyter_core.application import base_flags
from traitlets import Instance, Dict, Unicode, Bool
from elyra._version import __version__


SUPPORTED_TYPES = ['kfp']


class Runtime(Metadata):
    namespace = 'runtimes'


class AppUtilMixin:

    def _log_and_exit(self, msg, exit_status=1, display_help=False):
        self.log.error(msg)
        if display_help:
            print()
            self.print_help()
        self.exit(exit_status)

    def _confirm_required(self, name, value):
        if value is None or len(value) == 0:
            self._log_and_exit("'{}' is a required parameter.".format(name), display_help=True)


class ListRuntimes(Application, AppUtilMixin):
    version = __version__
    description = """List installed external runtime metadata."""

    metadata_namespace = Runtime.namespace
    metadata_manager = Instance(MetadataManager)

    json_output = Bool(False, help='Output runtime name and location as machine-readable json.', config=True)
    valid_only = Bool(False, help='Only display valid runtime metadata.', config=True)

    flags = {'json': ({'ListRuntimes': {'json_output': True}},
                      "Output runtime name and location as machine-readable json."),
             'valid-only': ({'ListRuntimes': {'valid_only': True}}, "Only display valid runtime metadata."),
             'debug': base_flags['debug'],
             }

    def _metadata_manager_default(self):
        return MetadataManager(namespace=self.metadata_namespace)

    def start(self):
        include_invalid = not self.valid_only
        runtimes = self.metadata_manager.get_all_metadata_summary(include_invalid=include_invalid)

        if not runtimes:
            print("No metadata available for external runtimes at : '{}'"
                  .format(self.metadata_manager.get_metadata_location))
            return

        if self.json_output:
            [print('Runtime: {} {}\n{}'.
                   format(rt.name, "**INVALID**" if rt.reason and len(rt.reason) > 0 else "", rt.to_json()))
             for rt in runtimes]
        else:
            sorted_runtimes = sorted(runtimes, key=lambda runtime: runtime.name)
            # pad to width of longest runtime name
            max_name_len = 0
            max_resource_len = 0
            for runtime in sorted_runtimes:
                max_name_len = max(len(runtime.name), max_name_len)
                max_resource_len = max(len(runtime.resource), max_resource_len)

            print("Available metadata for external runtimes:")
            for runtime in sorted_runtimes:
                invalid = ""
                if runtime.reason and len(runtime.reason) > 0:
                    invalid = "**INVALID** ({})".format(runtime.reason)
                print("  %s  %s  %s" % (runtime.name.ljust(max_name_len),
                                        runtime.resource.ljust(max_resource_len),
                                        invalid))


class RemoveRuntime(Application, AppUtilMixin):
    version = __version__
    description = """Remove external runtime metadata."""

    metadata_namespace = Runtime.namespace
    metadata_manager = Instance(MetadataManager)

    name = Unicode(None, config=True, allow_none=True,
                   help="The name of the runtime metadata to remove.")

    aliases = {
        'name': 'RemoveRuntime.name',
    }

    flags = {'debug': base_flags['debug']}

    def _metadata_manager_default(self):
        return MetadataManager(namespace=self.metadata_namespace)

    def start(self):
        self._validate_parameters()
        self.metadata_manager.remove(self.name)

    def _validate_parameters(self):
        self._confirm_required("name", self.name)


class Kfp(Application, AppUtilMixin):
    version = __version__
    description = """Install runtime metadata for Kubeflow pipelines."""

    schema_name = "kfp"

    replace = Bool(False, help='Replace existing runtime metadata with this instance.', config=True)

    name = Unicode(None, config=True, allow_none=True,
                   help="The canonical name of this kfp runtime.  Must be lowercase alphanumeric, beginning with "
                        "alpha and can include embedded hyphens ('-') and underscores ('_'). Required.")

    display_name = Unicode(None, config=True, allow_none=True,
                           help="The display name of this kfp runtime. Required.")

    api_endpoint = Unicode(None, config=True, allow_none=True,
                           help="The http url specifying the API endpoint corresponding to this kfp runtime. Required.")

    cos_endpoint = Unicode(None, config=True, allow_none=True,
                           help="The http url specifying the COS endpoint corresponding to this kfp runtime. Required.")

    cos_username = Unicode(None, config=True, allow_none=True,
                           help="The COS username corresponding to this kfp runtime. Required.")

    cos_password = Unicode(None, config=True, allow_none=True,  # FIXME - password!
                           help="The COS user password corresponding to this kfp runtime. Required.")

    cos_bucket = Unicode(None, config=True, allow_none=True,
                         help="The COS bucket name corresponding to this kfp runtime. Required.")

    metadata_namespace = Runtime.namespace
    metadata_manager = Instance(MetadataManager)

    def _metadata_manager_default(self):
        return MetadataManager(namespace=self.metadata_namespace)

    aliases = {
        'name': 'Kfp.name',
        'display_name': 'Kfp.display_name',
        'api_endpoint': 'Kfp.api_endpoint',
        'cos_endpoint': 'Kfp.cos_endpoint',
        'cos_username': 'Kfp.cos_username',
        'cos_password': 'Kfp.cos_password',
        'cos_bucket': 'Kfp.cos_bucket',
    }

    flags = {'replace': ({'Kfp': {'replace': True}}, "Replace existing runtime metadata with this instance."),
             'debug': base_flags['debug'],
             }

    def start(self):
        self._validate_parameters()

        # init with required, conditionally add optional  # TODO - drive from metadata?  Will need better
        metadata = dict(
            api_endpoint=self.api_endpoint,
            cos_endpoint=self.cos_endpoint,
            cos_username=self.cos_username,
            cos_password=self.cos_password,
            cos_bucket=self.cos_bucket)

        runtime = Runtime(schema_name=self.schema_name, name=self.name,
                          display_name=self.display_name, metadata=metadata)

        ex_msg = None
        resource = None
        try:
            resource = self.metadata_manager.add(self.name, runtime, replace=self.replace)
        except Exception as ex:
            ex_msg = str(ex)

        if resource:
            print("Metadata for {} runtime '{}' has been written to: {}".format(self.schema_name, self.name, resource))
        else:
            if ex_msg:
                self._log_and_exit("The following exception occurred while saving metadata '{}' for {} runtime: {}"
                                   .format(self.name, self.schema_name, ex_msg), display_help=True)
            else:
                self._log_and_exit("A failure occurred while saving metadata '{}' for {} runtime.  Check log output."
                                   .format(self.name, self.schema_name), display_help=True)

    def _validate_parameters(self):
        self._confirm_required("name", self.name)
        self._confirm_required("display_name", self.display_name)
        self._confirm_required("api_endpoint", self.api_endpoint)
        self._confirm_required("cos_endpoint", self.cos_endpoint)
        self._confirm_required("cos_username", self.cos_username)
        self._confirm_required("cos_password", self.cos_password)
        self._confirm_required("cos_bucket", self.cos_bucket)


class Airflow(Application, AppUtilMixin):
    version = __version__
    description = """Install runtime metadata for Airflow pipelines."""
    flags = {}

    schema_name = "airflow"

    name = Unicode(config=True,
                   help='The canonical name of this airflow runtime.  Only alpha-numeric, - and _ are permitted.')

    display_name = Unicode(config=True,
                           help='The display name of this airflow runtime.')

    aliases = {
        'name': 'Airflow.name',
        'display_name': 'Airflow.display_name',
    }

    def start(self):
        self._log_and_exit("Support for airflow pipelines is not implemented at this time.")


class InstallRuntime(Application):
    version = __version__
    description = """Install runtime metadata for pipeline processors."""

    subcommands = Dict({
        'kfp': (Kfp, Kfp.description.splitlines()[0]),
        'airflow': (Airflow, Airflow.description.splitlines()[0]),
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


class RuntimeMetadataApp(Application):
    version = __version__
    name = "jupyter runtimes"
    description = """Manage Jupyter metadata for external runtimes."""

    subcommands = Dict({
        'list': (ListRuntimes, ListRuntimes.description.splitlines()[0]),
        'install': (InstallRuntime, InstallRuntime.description.splitlines()[0]),
        'remove': (RemoveRuntime, RemoveRuntime.description.splitlines()[0]),
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
    RuntimeMetadataApp.launch_instance()
