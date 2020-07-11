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
import time

from abc import ABC, abstractmethod
from traitlets import log
from typing import Optional, List

from .error import MetadataNotFoundError, MetadataExistsError


class MetadataStore(ABC):
    def __init__(self, namespace, **kwargs):
        self.namespace = namespace
        self.log = log.get_logger()

    @abstractmethod
    def namespace_exists(self) -> bool:
        """Returns True if the namespace for this instance exists"""
        pass

    @abstractmethod
    def fetch_instances(self, name: Optional[str] = None, include_invalid: bool = False) -> List[dict]:
        """Fetch metadata instances"""
        pass

    @abstractmethod
    def store_instance(self, name: str, metadata: dict, for_update: bool = False) -> dict:
        """Stores the named metadata instance."""
        pass

    @abstractmethod
    def delete_instance(self, metadata: dict) -> None:
        """Deletes the metadata instance corresponding to the given name."""
        pass


class FileMetadataStore(MetadataStore):

    def __init__(self, namespace: str, **kwargs):
        super(FileMetadataStore, self).__init__(namespace, **kwargs)
        self.metadata_paths = FileMetadataStore.metadata_path(self.namespace)
        self.preferred_metadata_dir = self.metadata_paths[0]
        self.log.debug("Namespace '{}' is using metadata directory: {} from list: {}".
                       format(self.namespace, self.preferred_metadata_dir, self.metadata_paths))

    def namespace_exists(self) -> bool:
        """Does the namespace exist in any of the dir paths?"""
        namespace_dir_exists = False
        for d in self.metadata_paths:
            if os.path.isdir(d):
                namespace_dir_exists = True
                break
        return namespace_dir_exists

    def fetch_instances(self, name: Optional[str] = None, include_invalid: bool = False) -> List[dict]:
        """Returns a list of metadata instances.

        If name is provided, the single instance will be returned in a list of one item.
        """
        if not self.namespace_exists():  # namespace doesn't exist - return empty list
            return []

        resources = {}
        all_metadata_dirs = reversed(self.metadata_paths)
        for metadata_dir in all_metadata_dirs:
            if os.path.isdir(metadata_dir):
                for f in os.listdir(metadata_dir):
                    path = os.path.join(metadata_dir, f)
                    if path.endswith(".json"):
                        if name:  # if looking for a specific instance, and this is not it, continue
                            if os.path.splitext(os.path.basename(path))[0] != name:
                                continue
                        try:
                            metadata = self._load_resource(path)
                        except Exception as ex:
                            if name:  # if we're looking for this instance, re-raise exception
                                raise ex from ex
                            # else create a dictionary from what we have if including invalid, else continue
                            if include_invalid:
                                metadata = {'name': os.path.splitext(os.path.basename(path))[0],
                                            'resource': path,
                                            'reason': ex.__class__.__name__}
                            else:
                                continue

                        if metadata.get('name') in resources.keys():
                            # If we're replacing an instance, let that be known via debug
                            self.log.debug("Replacing metadata instance '{}' from '{}' with '{}'."
                                           .format(metadata.get('name'),
                                                   resources[metadata.get('name')].get('resource'),
                                                   metadata.get('resource')))
                        resources[metadata.get('name')] = metadata

        if name:
            if name in resources.keys():  # check if we have a match.
                return [resources[name]]

            # If we're looking for a single metadata and we're here, then its not found
            raise MetadataNotFoundError(self.namespace, name)

        # We're here only if loading all resources, so only return list of values.
        return list(resources.values())

    def store_instance(self, name: str, metadata: dict, for_update: bool = False) -> dict:
        """Store the named metadata instance

        Create is the default behavior, while updates are performed when for_update is True.
        """
        metadata_resource_name = '{}.json'.format(name)
        resource = os.path.join(self.preferred_metadata_dir, metadata_resource_name)

        # If the preferred metadata directory is not present, create it and note it.
        if not os.path.exists(self.preferred_metadata_dir):
            self.log.debug("Creating metadata directory: {}".format(self.preferred_metadata_dir))
            os.makedirs(self.preferred_metadata_dir, mode=0o700, exist_ok=True)

        # Prepare for persistence, check existence, etc.
        renamed_resource = None
        if for_update:
            renamed_resource = self._prepare_update(name, resource)
        else:  # create
            self._prepare_create(name, resource)

        # Write out the instance
        try:
            with jupyter_core.paths.secure_write(resource) as f:
                f.write(json.dumps(metadata, indent=2))  # Only persist necessary items
        except Exception as ex:
            self._rollback(resource, renamed_resource)
            raise ex from ex
        else:
            self.log.debug("{action} metadata instance: {resource}".
                           format(action="Updated" if for_update else "Created", resource=resource))

        # Confirm persistence so in case there are issues, we can rollback
        metadata = self._confirm_persistence(resource, renamed_resource)

        return metadata

    def delete_instance(self, metadata: dict) -> None:
        """Delete the named instance"""
        name = metadata.get('name')
        resource = metadata.get('resource')
        if resource:
            # Since multiple folders are in play, we only allow removal if the resource is in
            # the first directory in the list (i.e., most "near" the user)
            if not self._remove_allowed(metadata):
                self.log.error("Removal of instance '{}' from the {} namespace is not permitted!  "
                               "Resource conflict at '{}' ".format(name, self.namespace, resource))
                raise PermissionError("Removal of instance '{}' from the {} namespace is not permitted!".
                                      format(name, self.namespace))
            os.remove(resource)

    def _prepare_create(self, name: str, resource: str) -> None:
        """Prepare to create resource, ensure it doesn't exist in the hierarchy."""
        if os.path.exists(resource):
            self.log.error("An instance named '{}' already exists in the {} namespace at {}.".
                           format(name, self.namespace, resource))
            raise MetadataExistsError(self.namespace, name)

        # Although the resource doesn't exist in the preferred dir, it may exist at other levels.
        # If creating, then existence at other levels should also prevent the operation.
        try:
            resources = self.fetch_instances(name)
            # Instance exists at other (protected) level and this is a create - throw exception
            self.log.error("An instance named '{}' already exists in the {} namespace at {}.".
                           format(name, self.namespace, resources[0].get('resource')))
            raise MetadataExistsError(self.namespace, name)
        except MetadataNotFoundError:  # doesn't exist elsewhere, so we're good.
            pass

    def _prepare_update(self, name: str, resource: str) -> str:
        """Prepare to update resource, rename current."""
        renamed_resource = None
        if os.path.exists(resource):
            # We're updating so we need to rename the current file to allow restore on errs
            renamed_resource = resource + str(time.time())
            os.rename(resource, renamed_resource)
            self.log.debug("Renamed resource for instance '{}' to: '{}'".format(name, renamed_resource))
        return renamed_resource

    @staticmethod
    def _rollback(resource: str, renamed_resource: str) -> None:
        """Rollback changes made during persistence (typically updates) and exceptions are encountered """
        if os.path.exists(resource):
            os.remove(resource)
        if renamed_resource:  # Restore the renamed file
            os.rename(renamed_resource, resource)

    def _confirm_persistence(self, resource: str, renamed_resource: str) -> dict:
        """Confirms persistence by loading the instance and cleans up renamed instance, if applicable."""
        try:
            metadata = self._load_resource(resource)
        except Exception as ex:
            self.log.error("Removing metadata instance '{}' due to previous error.".format(resource))
            self._rollback(resource, renamed_resource)
            raise ex from ex

        if renamed_resource:  # Remove the renamed file
            os.remove(renamed_resource)
        return metadata

    def _remove_allowed(self, metadata: dict) -> bool:
        """Determines if the resource of the given instance is allowed to be removed. """
        allowed_resource = os.path.join(self.preferred_metadata_dir, metadata.get('name'))
        current_resource = os.path.splitext(metadata.get('resource'))[0]
        return allowed_resource == current_resource

    def _load_resource(self, resource: str) -> dict:
        # This is always called with an existing resource (path) so no need to check existence.

        # Always take name from resource so resources can be copied w/o having to change content
        name = os.path.splitext(os.path.basename(resource))[0]

        self.log.debug("Loading metadata instance from: '{}'".format(resource))
        with io.open(resource, 'r', encoding='utf-8') as f:
            try:
                metadata_json = json.load(f)
            except ValueError as jde:  # JSONDecodeError is raised, but it derives from ValueError
                # If the JSON file cannot load, there's nothing we can do other than log and raise since
                # we aren't able to even instantiate an instance of Metadata.  Because errors are ignored
                # when getting multiple items, it's okay to raise.  The singleton searches (by handlers)
                # already catch ValueError and map to 400, so we're good there as well.
                self.log.error("JSON failed to load for resource '{}' in the {} namespace with error: {}.".
                               format(resource, self.namespace, jde))
                raise ValueError("JSON failed to load for instance '{}' in the {} namespace with error: {}.".
                                 format(name, self.namespace, jde)) from jde

            metadata_json['name'] = name
            metadata_json['resource'] = resource

        return metadata_json

    @staticmethod
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
