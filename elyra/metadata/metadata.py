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
import io
import json
import jupyter_core.paths
import os
import re
import shutil
import warnings

from abc import ABC, abstractmethod
from jsonschema import validate, ValidationError, draft7_format_checker
from traitlets import Type, log
from traitlets.config import SingletonConfigurable, LoggingConfigurable


METADATA_TEST_NAMESPACE = "metadata-tests"  # exposed via METADATA_TESTING env


def metadata_path(*subdirs):
    """Return a list of directories to search for metadata files.

    ELYRA_METADATA_PATH environment variable has highest priority.

    This is based on jupyter_core.paths.jupyter_path, but where the python
    env-based directory is last in the list, preceded by the system shared
    locations with the user's home-based directory still first in the list.

    The first directory in the list (data_dir, if env is not set) is where files
    will be written, although files can reside at other levels as well, with
    SYSTEM_JUPYTER_PATH representing shared data and ENV_JUPYTER_PATH representing
    the location of factory data (created during installation).

    If ``*subdirs`` are given, that subdirectory will be added to each element.
    """

    paths = []
    # highest priority is env
    if os.environ.get('ELYRA_METADATA_PATH'):
        paths.extend(
            p.rstrip(os.sep)
            for p in os.environ['ELYRA_METADATA_PATH'].split(os.pathsep)
        )
    # then user dir
    paths.append(jupyter_core.paths.jupyter_data_dir())

    # then system, where shared files will reside
    # Note, we're using getattr for these, since tests adjust the value of these
    # and we need to pull them at runtime, rather than during load.
    system_path = getattr(jupyter_core.paths, 'SYSTEM_JUPYTER_PATH')
    paths.extend(system_path)

    # then sys.prefix, where installed files will reside (factory data)
    env_path = getattr(jupyter_core.paths, 'ENV_JUPYTER_PATH')
    for p in env_path:
        if p not in system_path:
            paths.append(p)

    # add subdir, if requested.
    # Note, the 'metadata' parent dir is automatically added.
    if subdirs:
        paths = [os.path.join(p, 'metadata', *subdirs) for p in paths]
    return paths


class Metadata(object):
    name = None
    resource = None
    display_name = None
    schema_name = None
    metadata = {}
    reason = None

    def __init__(self, **kwargs):
        self.name = kwargs.get('name')
        self.display_name = kwargs.get('display_name')
        self.schema_name = kwargs.get('schema_name')
        self.metadata = kwargs.get('metadata', {})
        self.resource = kwargs.get('resource')
        self.reason = kwargs.get('reason')

    def to_dict(self, trim=False):
        # Exclude resource, and reason only if trim is True since we don't want to persist that information.
        # Only include schema_name if it has a value (regardless of trim). Method prepare_write will be used
        # to trim out name prior to writes.
        d = dict(name=self.name, display_name=self.display_name, metadata=self.metadata, schema_name=self.schema_name)
        if not trim:
            if self.resource:
                d['resource'] = self.resource
            if self.reason:
                d['reason'] = self.reason

        return d

    def to_json(self, trim=False):
        return json.dumps(self.to_dict(trim=trim), indent=2)

    def prepare_write(self):
        """Prepares this instance for writes, stripping name, reason, and resource"""
        prepared = self.to_dict(trim=True)  # we should also trim 'name' when writing
        prepared.pop('name', None)
        return json.dumps(prepared, indent=2)


class MetadataManager(LoggingConfigurable):

    # System-owned namespaces
    NAMESPACE_RUNTIMES = "runtimes"
    NAMESPACE_CODE_SNIPPETS = "code-snippets"
    NAMESPACE_RUNTIME_IMAGES = "runtime-images"

    metadata_class = Type(Metadata, config=True,
                          help="""The metadata class.  This is configurable to allow subclassing of
                          the MetadataManager for customized behavior.""")

    def __init__(self, namespace, store=None, **kwargs):
        """
        Generic object to read Notebook related metadata
        :param namespace: the partition where it is stored, this might have
        a unique meaning for each of the supported metadata storage
        :param store: the metadata store to be used
        :param kwargs: additional arguments to be used to instantiate a metadata store
        """
        super(MetadataManager, self).__init__(**kwargs)

        self.namespace = namespace
        if store:
            self.metadata_store = store
        else:
            self.metadata_store = FileMetadataStore(namespace, **kwargs)

    def namespace_exists(self):
        return self.metadata_store.namespace_exists()

    @property
    def get_metadata_locations(self):
        return self.metadata_store.get_metadata_locations

    def get_all_metadata_summary(self, include_invalid=False):
        return self.metadata_store.get_all_metadata_summary(include_invalid=include_invalid)

    def get_all(self):
        return self.metadata_store.get_all()

    def get(self, name):
        return self.metadata_store.read(name)

    def add(self, name, metadata, replace=False):
        return self.metadata_store.save(name, metadata, replace)

    def remove(self, name):
        return self.metadata_store.remove(name)


class MetadataStore(ABC):
    def __init__(self, namespace, **kwargs):
        self.schema_mgr = SchemaManager.instance()
        if not self.schema_mgr.is_valid_namespace(namespace):
            raise ValueError("Namespace '{}' is not in the list of valid namespaces: {}".
                             format(namespace, self.schema_mgr.get_namespaces()))

        self.namespace = namespace
        self.log = log.get_logger()

    @abstractmethod
    def namespace_exists(self):
        pass

    @abstractmethod
    def get_metadata_locations(self):
        pass

    @abstractmethod
    def get_all_metadata_summary(self):
        pass

    @abstractmethod
    def get_all(self):
        pass

    @abstractmethod
    def read(self, name):
        pass

    @abstractmethod
    def save(self, name, metadata, replace=False):
        pass

    @abstractmethod
    def remove(self, name):
        pass

    # FIXME - we should rework this area so that its more a function of the processor provider
    # since its the provider that knows what is 'valid' or not.  Same goes for _get_schema() below.
    def validate(self, name, schema_name, schema, metadata):
        """Ensure metadata is valid based on its schema.  If invalid, ValidationError will be raised. """
        self.log.debug("Validating metadata resource '{}' against schema '{}'...".format(name, schema_name))
        try:
            validate(instance=metadata, schema=schema, format_checker=draft7_format_checker)
        except ValidationError as ve:
            # Because validation errors are so verbose, only provide the first line.
            first_line = str(ve).partition('\n')[0]
            msg = "Schema validation failed for metadata '{}' in namespace '{}' with error: {}.".\
                format(name, self.namespace, first_line)
            self.log.error(msg)
            raise ValidationError(msg)


class FileMetadataStore(MetadataStore):

    def __init__(self, namespace, **kwargs):
        super(FileMetadataStore, self).__init__(namespace, **kwargs)
        self.metadata_paths = metadata_path(self.namespace)
        self.preferred_metadata_dir = self.metadata_paths[0]
        self.log.debug("Namespace '{}' is using metadata directory: {} from list: {}".
                       format(self.namespace, self.preferred_metadata_dir, self.metadata_paths))

    @property
    def get_metadata_locations(self):
        return self.metadata_paths

    def namespace_exists(self):
        """Does the namespace exist in any of the dir paths?"""
        namespace_dir_exists = False
        for d in self.metadata_paths:
            if os.path.isdir(d):
                namespace_dir_exists = True
                break
        return namespace_dir_exists

    def get_all_metadata_summary(self, include_invalid=False):
        metadata_list = self._load_metadata_resources(include_invalid=include_invalid)
        metadata_summary = {}
        for metadata in metadata_list:
            metadata_summary.update(
                {
                    'name': metadata.name,
                    'display_name': metadata.display_name,
                    'location': metadata.resource
                }
            )
        return metadata_list

    def get_all(self):
        return self._load_metadata_resources()

    def read(self, name):
        if not name:
            raise ValueError('Name of metadata was not provided')
        return self._load_metadata_resources(name=name)

    def save(self, name, metadata, replace=False):
        if not name:
            raise ValueError('Name of metadata was not provided.')

        match = re.search("^[a-z][a-z0-9-_]*[a-z,0-9]$", name)
        if match is None:
            raise ValueError("Name of metadata must be lowercase alphanumeric, beginning with alpha and can include "
                             "embedded hyphens ('-') and underscores ('_').")

        if not metadata:
            raise ValueError("An instance of class 'Metadata' was not provided.")

        if not isinstance(metadata, Metadata):
            raise TypeError("'metadata' is not an instance of class 'Metadata'.")

        metadata_resource_name = '{}.json'.format(name)
        resource = os.path.join(self.preferred_metadata_dir, metadata_resource_name)

        # Handle replacement behavior for hierarchy.
        if os.path.exists(resource):
            if replace:
                os.remove(resource)
            else:
                msg = "Metadata resource '{}' already exists.".format(resource)
                self.log.error(msg)
                raise FileExistsError(msg)

        # Although the resource doesn't exist in the preferred dir, it may exist at other levels.
        # If replacement is not enabled, then existence at other levels should also prevent the update.
        elif not replace:
            try:
                self._load_metadata_resources(name, validate_metadata=False)
                # Instance exists at other (protected) level and replacement was not request
                msg = "Metadata instance '{}' already exists.".format(name)
                self.log.error(msg)
                raise FileExistsError(msg)
            except FileNotFoundError:  # doesn't exist elsewhere, so we're good.
                pass

        created_namespace_dir = False
        # If the preferred metadata directory is not present, create it and note it.
        if not os.path.exists(self.preferred_metadata_dir):
            self.log.debug("Creating metadata directory: {}".format(self.preferred_metadata_dir))
            os.makedirs(self.preferred_metadata_dir, mode=0o700, exist_ok=True)
            created_namespace_dir = True

        try:
            with io.open(resource, 'w', encoding='utf-8') as f:
                f.write(metadata.prepare_write())  # Only persist necessary items
        except Exception:
            if created_namespace_dir:
                shutil.rmtree(self.preferred_metadata_dir)
        else:
            self.log.debug("Created metadata resource: {}".format(resource))

        # Now that its written, attempt to load it so, if a schema is present, we can validate it.
        try:
            metadata = self._load_from_resource(resource)
        except (ValidationError, ValueError, FileNotFoundError) as ve:
            self.log.error("Removing metadata resource '{}' due to previous error.".format(resource))
            # If we just created the directory, include that during cleanup
            if created_namespace_dir:
                shutil.rmtree(self.preferred_metadata_dir)
            else:
                os.remove(resource)
            raise ve

        return metadata

    def remove(self, name):
        self.log.info("Removing metadata resource '{}' from namespace '{}'.".format(name, self.namespace))

        # Let exceptions (FileNotFound) propagate
        metadata = self._load_metadata_resources(name=name, validate_metadata=False)  # Don't validate on remove

        resource = metadata.resource
        if resource:
            # Since multiple folders are in play, we only allow removal if the resource is in
            # the first directory in the list (i.e., most "near" the user)
            if not self._remove_allowed(metadata):
                raise PermissionError("Removal of metadata resource '{}' in namespace '{}' is not permitted!".
                                      format(resource, self.namespace))
            os.remove(resource)

        return metadata

    def _remove_allowed(self, metadata):
        """Determines if the resource of the given instance is allowed to be removed. """
        allowed_resource = os.path.join(self.preferred_metadata_dir, metadata.name)
        current_resource = os.path.splitext(metadata.resource)[0]
        return allowed_resource == current_resource

    def _load_metadata_resources(self, name=None, validate_metadata=True, include_invalid=False):
        """Loads metadata files with .json suffix and return requested items.
           if 'name' is provided, the single file is loaded and returned, else
           all files ending in '.json' are loaded and returned in a list.
        """
        namespace_dir_exists = False
        saved_ex = None
        resources = {}
        all_metadata_dirs = reversed(self.metadata_paths)
        for metadata_dir in all_metadata_dirs:
            if os.path.isdir(metadata_dir):
                namespace_dir_exists = True
                for f in os.listdir(metadata_dir):
                    path = os.path.join(metadata_dir, f)
                    if path.endswith(".json"):
                        metadata = None
                        if name:  # if looking for a specific resource, and this is it, continue
                            if os.path.splitext(os.path.basename(path))[0] != name:
                                continue
                        try:
                            metadata = self._load_from_resource(path, validate_metadata=validate_metadata,
                                                                include_invalid=include_invalid)
                            saved_ex = None
                        except Exception as ex:
                            # Ignore ValidationError and others when loading all resources
                            if name:
                                # we may need to raise this exception if, at the end we don't find a valid instance
                                saved_ex = ex

                        if metadata is not None:
                            if metadata.name in resources.keys():
                                # If we're replacing an instance, let that be known via debug
                                self.log.debug("Replacing metadata resource '{}' from '{}' with '{}'."
                                               .format(metadata.name,
                                                       resources[metadata.name].resource,
                                                       metadata.resource))
                            resources[metadata.name] = metadata
        if not namespace_dir_exists:  # namespace doesn't exist, treat as FileNotFoundError
            raise FileNotFoundError("Metadata namespace '{}' was not found!".format(self.namespace))

        if name:
            if saved_ex:  # the instance that we're looking for raised
                raise saved_ex

            if name in resources.keys():  # check if we have a match.
                return resources[name]

            # If we're looking for a single metadata and we're here, then its not found
            raise FileNotFoundError("Metadata '{}' in namespace '{}' was not found!".format(name, self.namespace))

        # We're here only if loading all resources, so only return list of values.
        return list(resources.values())

    def _get_schema(self, schema_name):
        """Loads the schema based on the schema_name and returns the loaded schema json.
           Throws ValidationError if schema file is not present.
        """

        schema_json = self.schema_mgr.get_schema(self.namespace, schema_name)
        if schema_json is None:
            schema_file = os.path.join(os.path.dirname(__file__), 'schemas', schema_name + '.json')
            if not os.path.exists(schema_file):
                raise ValidationError("Metadata schema file '{}' is missing!".format(schema_file))

            self.log.debug("Loading metadata schema from: '{}'".format(schema_file))
            with io.open(schema_file, 'r', encoding='utf-8') as f:
                schema_json = json.load(f)
            self.schema_mgr.add_schema(self.namespace, schema_name, schema_json)

        return schema_json

    def _load_from_resource(self, resource, validate_metadata=True, include_invalid=False):
        # This is always called with an existing resource (path) so no need to check existence.

        # Always take name from resource so resources can be copied w/o having to change content
        name = os.path.splitext(os.path.basename(resource))[0]

        self.log.debug("Loading metadata resource from: '{}'".format(resource))
        with io.open(resource, 'r', encoding='utf-8') as f:
            try:
                metadata_json = json.load(f)
            except ValueError as jde:  # JSONDecodeError is raised, but it derives from ValueError
                # If the JSON file cannot load, there's nothing we can do other than log and raise since
                # we aren't able to even instantiate an instance of Metadata.  Because errors are ignored
                # when getting multiple items, it's okay to raise.  The singleton searches (by handlers)
                # already catch ValueError and map to 404, so we're good there as well.
                self.log.error("JSON failed to load for metadata '{}' in namespace '{}' with error: {}.".
                               format(name, self.namespace, jde))
                raise jde

        reason = None
        if validate_metadata:
            schema_name = metadata_json.get('schema_name')
            if schema_name:
                schema = self._get_schema(schema_name)  # returns a value or throws
                try:
                    self.validate(name, schema_name, schema, metadata_json)
                except ValidationError as ve:
                    if include_invalid:
                        reason = ve.__class__.__name__
                    else:
                        raise ve
            else:
                self.log.debug("No schema found in metadata resource '{}' - skipping validation.".format(resource))

        metadata = Metadata(name=name,
                            display_name=metadata_json.get('display_name'),
                            schema_name=metadata_json.get('schema_name'),
                            resource=resource,
                            metadata=metadata_json.get('metadata'),
                            reason=reason)
        return metadata


class SchemaManager(SingletonConfigurable):
    """Singleton used to store all schemas for all metadata types.
       Note: we currently don't refresh these entries.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # namespace_schemas is a dict of namespace keys to dict of schema_name keys of JSON schema
        self.namespace_schemas = SchemaManager.load_namespace_schemas()

    def is_valid_namespace(self, namespace):
        return namespace in self.namespace_schemas.keys()

    def get_namespaces(self):
        return list(self.namespace_schemas.keys())

    def get_namespace_schemas(self, namespace):
        self.log.debug("SchemaManager: Fetching all schemas from namespace '{}'".format(namespace))
        if not self.is_valid_namespace(namespace):
            raise ValueError("Namespace '{}' is not in the list of valid namespaces: '{}'".
                             format(namespace, self.get_namespaces()))
        schemas = self.namespace_schemas.get(namespace)
        return schemas

    def get_schema(self, namespace, schema_name):
        schema_json = None
        self.log.debug("SchemaManager: Fetching schema '{}' from namespace '{}'".format(schema_name, namespace))
        if not self.is_valid_namespace(namespace):
            raise ValueError("Namespace '{}' is not in the list of valid namespaces: '{}'".
                             format(namespace, self.get_namespaces()))
        schemas = self.namespace_schemas.get(namespace)
        if schema_name not in schemas.keys():
            raise FileNotFoundError("Schema '{}' in namespace '{}' was not found!".format(schema_name, namespace))
        schema_json = schemas.get(schema_name)

        return schema_json

    def add_schema(self, namespace, schema_name, schema):
        """Adds (updates) schema to set of stored schemas. """
        if not self.is_valid_namespace(namespace):
            raise ValueError("Namespace '{}' is not in the list of valid namespaces: '{}'".
                             format(namespace, self.get_namespaces()))
        self.log.debug("SchemaManager: Adding schema '{}' to namespace '{}'".format(schema_name, namespace))
        self.namespace_schemas[namespace][schema_name] = schema

    def clear_all(self):
        """Primarily used for testing, this method reloads schemas from initial values. """
        self.log.debug("SchemaManager: Reloading all schemas for all namespaces.")
        self.namespace_schemas = SchemaManager.load_namespace_schemas()

    def remove_schema(self, namespace, schema_name):
        """Removes the schema entry associated with namespace & schema_name. """
        self.log.debug("SchemaManager: Removing schema '{}' from namespace '{}'".format(schema_name, namespace))
        if not self.is_valid_namespace(namespace):
            raise ValueError("Namespace '{}' is not in the list of valid namespaces: '{}'".
                             format(namespace, self.get_namespaces()))
        self.namespace_schemas[namespace].pop(schema_name)

    @classmethod
    def load_namespace_schemas(cls, schema_dir=None):
        """Loads the static schema files into a dictionary indexed by namespace.
           If schema_dir is not specified, the static location relative to this
           file will be used.
           Note: The schema file must have a top-level string-valued attribute
           named 'namespace' to be included in the resulting dictionary.
        """
        # The following exposes the metadata-test namespace if true or 1.
        # Metadata testing will enable this env.  Note: this cannot be globally
        # defined, else the file could be loaded before the tests have enable the env.
        metadata_testing_enabled = bool(os.getenv("METADATA_TESTING", 0))

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

            # Elyra schema files are required to have a namespace property (see test_validate_factory_schema)
            namespace = schema_json.get('namespace')
            if namespace is None:
                warnings.warn("Schema file '{}' is missing its namespace attribute!  Skipping...".format(schema_file))
                continue
            # Skip test namespace unless we're testing metadata
            if namespace == METADATA_TEST_NAMESPACE and not metadata_testing_enabled:
                continue
            if namespace not in namespace_schemas:  # Create the namespace dict
                namespace_schemas[namespace] = {}
            # Add the schema file indexed by name within the namespace
            name = schema_json.get('name')
            if name is None:
                # If schema is missing a name attribute, use file's basename.
                name = os.path.splitext(os.path.basename(schema_file))[0]
            namespace_schemas[namespace][name] = schema_json

        return namespace_schemas.copy()
