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
from abc import ABC
from abc import abstractmethod
from collections import OrderedDict
import copy
import io
import json
import os
import time
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

import jupyter_core.paths
from traitlets import log  # noqa H306
from traitlets.config import LoggingConfigurable  # noqa H306
from traitlets.config import SingletonConfigurable
from traitlets.traitlets import Bool
from traitlets.traitlets import Integer
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from elyra.metadata.error import MetadataExistsError
from elyra.metadata.error import MetadataNotFoundError


class MetadataStore(ABC):
    def __init__(self, schemaspace, parent: Optional[LoggingConfigurable] = None, **kwargs):
        self.schemaspace = schemaspace
        self.log = parent.log if parent else log.get_logger()

    @abstractmethod
    def schemaspace_exists(self) -> bool:
        """Returns True if the schemaspace for this instance exists"""
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


def caching_enabled(func):
    """Checks if file store cache is enabled.  If not, just return None, else perform function."""

    def wrapped(self, *args, **kwargs):
        if not self.enabled:
            return None
        return func(self, *args, **kwargs)

    return wrapped


class FileMetadataCache(SingletonConfigurable):
    """FileMetadataCache is used exclusively by FileMetadataStore to cache file-based metadata instances.

    FileMetadataCache utilizes a watchdog handler to monitor directories corresponding to
    any files it contains.  The handler is primarily used to determine which cached entries
    to remove (on delete operations).

    The cache is implemented as a simple LRU cache using an OrderedDict.
    """

    max_size = Integer(
        min=1, max=1024, default_value=128, config=True, help="The maximum number of entries allowed in the cache."
    )

    enabled = Bool(default_value=True, config=True, help="Caching is enabled (True) or disabled (False).")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.hits: int = 0
        self.misses: int = 0
        self.trims: int = 0
        self._entries: OrderedDict = OrderedDict()
        if self.enabled:  # Only create and start an observer when enabled
            self.observed_dirs = set()  # Tracks which directories are being watched
            self.observer = Observer()
            self.observer.start()
        else:
            self.log.info(
                "The file metadata cache is currently disabled via configuration. "
                "Set FileMetadataCache.enabled=True to enable instance caching."
            )

    def __len__(self) -> int:
        """Return the number of running kernels."""
        return len(self._entries)

    def __contains__(self, path: str) -> bool:
        return path in self._entries

    @caching_enabled
    def add_item(self, path: str, entry: Dict[str, Any]) -> None:
        """Adds the named entry and its entry to the cache.

        If this causes the cache to grow beyond its max size, the least recently
        used entry is removed.
        """
        md_dir: str = os.path.dirname(path)
        if md_dir not in self.observed_dirs and os.path.isdir(md_dir):
            self.observer.schedule(FileChangeHandler(self), md_dir, recursive=True)
            self.observed_dirs.add(md_dir)
        self._entries[path] = copy.deepcopy(entry)
        self._entries.move_to_end(path)
        if len(self._entries) > self.max_size:
            self.trims += 1
            self._entries.popitem(last=False)  # pop LRU entry

    @caching_enabled
    def get_item(self, path: str) -> Optional[Dict[str, Any]]:
        """Gets the named entry and returns its value or None if not present."""
        if path in self._entries:
            self.hits += 1
            self._entries.move_to_end(path)
            return copy.deepcopy(self._entries[path])

        self.misses += 1
        return None

    @caching_enabled
    def remove_item(self, path: str) -> Optional[Dict[str, Any]]:
        """Removes the named entry and returns its value or None if not present."""
        if path in self._entries:
            return self._entries.pop(path)

        return None


class FileChangeHandler(FileSystemEventHandler):
    """Watchdog handler that filters on .json files within specific metadata directories."""

    def __init__(self, file_metadata_cache: FileMetadataCache, **kwargs):
        super(FileChangeHandler, self).__init__(**kwargs)
        self.file_metadata_cache = file_metadata_cache
        self.log = file_metadata_cache.log

    def dispatch(self, event):
        """Dispatches delete and modification events pertaining to watched metadata instances."""
        if event.src_path.endswith(".json"):
            super(FileChangeHandler, self).dispatch(event)

    def on_deleted(self, event):
        """Fires when a watched file is deleted, triggering a removal of the corresponding item from the cache."""
        self.file_metadata_cache.remove_item(event.src_path)

    def on_modified(self, event):
        """Fires when a watched file is modified.

        On updates, go ahead and remove the item from the cache.  It will be reloaded on next fetch.
        """
        self.file_metadata_cache.remove_item(event.src_path)


class FileMetadataStore(MetadataStore):
    def __init__(self, schemaspace: str, **kwargs):
        super().__init__(schemaspace, **kwargs)
        self.cache = FileMetadataCache.instance()
        self.metadata_paths = FileMetadataStore.metadata_path(self.schemaspace.lower())
        self.preferred_metadata_dir = self.metadata_paths[0]
        self.log.debug(
            f"Schemaspace '{self.schemaspace}' is using metadata directory: "
            f"{self.preferred_metadata_dir} from list: {self.metadata_paths}"
        )

    def schemaspace_exists(self) -> bool:
        """Does the schemaspace exist in any of the dir paths?"""
        schemaspace_dir_exists = False
        for d in self.metadata_paths:
            if os.path.isdir(d):
                schemaspace_dir_exists = True
                break
        return schemaspace_dir_exists

    def fetch_instances(self, name: Optional[str] = None, include_invalid: bool = False) -> List[dict]:
        """Returns a list of metadata instances.

        If name is provided, the single instance will be returned in a list of one item.
        """
        if not self.schemaspace_exists():  # schemaspace doesn't exist - return empty list
            if name:  # If we're looking for a specific instance and there's no schemaspace, raise MetadataNotFound
                raise MetadataNotFoundError(self.schemaspace, name)
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
                                metadata = {
                                    "name": os.path.splitext(os.path.basename(path))[0],
                                    "resource": path,
                                    "reason": ex.__class__.__name__,
                                }
                            else:
                                continue

                        md_name = metadata.get("name")
                        if md_name in resources.keys():
                            # If we're replacing an instance, let that be known via debug
                            from_resource = resources[md_name].get("resource")
                            md_resource = metadata.get("resource")
                            self.log.debug(
                                f"Replacing metadata instance '{md_name}' from '{from_resource}' with '{md_resource}'."
                            )
                        resources[md_name] = metadata

        if name:
            if name in resources.keys():  # check if we have a match.
                return [resources[name]]

            # If we're looking for a single metadata and we're here, then its not found
            raise MetadataNotFoundError(self.schemaspace, name)

        # We're here only if loading all resources, so only return list of values.
        return list(resources.values())

    def store_instance(self, name: str, metadata: dict, for_update: bool = False) -> dict:
        """Store the named metadata instance

        Create is the default behavior, while updates are performed when for_update is True.
        """
        metadata_resource_name = f"{name}.json"
        resource = os.path.join(self.preferred_metadata_dir, metadata_resource_name)

        # If the preferred metadata directory is not present, create it and note it.
        if not os.path.exists(self.preferred_metadata_dir):
            self.log.debug(f"Creating metadata directory: {self.preferred_metadata_dir}")
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
                json.dump(metadata, f, indent=2)  # Only persist necessary items
        except Exception as ex:
            self._rollback(resource, renamed_resource)
            raise ex from ex
        else:
            self.log.debug(f"{'Updated' if for_update else 'Created'} metadata instance: {resource}")

        # Confirm persistence so in case there are issues, we can rollback
        metadata = self._confirm_persistence(resource, renamed_resource)

        return metadata

    def delete_instance(self, metadata: dict) -> None:
        """Delete the named instance"""
        name = metadata.get("name")
        resource = metadata.get("resource")
        if resource:
            # Since multiple folders are in play, we only allow removal if the resource is in
            # the first directory in the list (i.e., most "near" the user)
            if not self._remove_allowed(metadata):
                self.log.error(
                    f"Removal of instance '{name}' from the {self.schemaspace} schemaspace is not permitted!  "
                    f"Resource conflict at '{resource}' "
                )
                raise PermissionError(
                    f"Removal of instance '{name}' from the {self.schemaspace} schemaspace is not permitted!"
                )
            os.remove(resource)
            self.cache.remove_item(resource)

    def _prepare_create(self, name: str, resource: str) -> None:
        """Prepare to create resource, ensure it doesn't exist in the hierarchy."""
        if os.path.exists(resource):
            self.log.error(
                f"An instance named '{name}' already exists in the {self.schemaspace} schemaspace at {resource}."
            )
            raise MetadataExistsError(self.schemaspace, name)

        # Although the resource doesn't exist in the preferred dir, it may exist at other levels.
        # If creating, then existence at other levels should also prevent the operation.
        try:
            resources = self.fetch_instances(name)
            # Instance exists at other (protected) level and this is a create - throw exception
            self.log.error(
                f"An instance named '{name}' already exists in the {self.schemaspace} "
                f"schemaspace at {resources[0].get('resource')}."
            )
            raise MetadataExistsError(self.schemaspace, name)
        except MetadataNotFoundError:  # doesn't exist elsewhere, so we're good.
            pass

    def _prepare_update(self, name: str, resource: str) -> str:
        """Prepare to update resource, rename current."""
        renamed_resource = None
        if os.path.exists(resource):
            # We're updating so we need to rename the current file to allow restore on errs
            renamed_resource = resource + str(time.time())
            os.rename(resource, renamed_resource)
            self.log.debug(f"Renamed resource for instance '{name}' to: '{renamed_resource}'")
        return renamed_resource

    def _rollback(self, resource: str, renamed_resource: str) -> None:
        """Rollback changes made during persistence (typically updates) and exceptions are encountered"""
        self.cache.remove_item(resource)  # Clear the item from the cache, let it be re-added naturally
        if os.path.exists(resource):
            os.remove(resource)
        if renamed_resource:  # Restore the renamed file
            os.rename(renamed_resource, resource)

    def _confirm_persistence(self, resource: str, renamed_resource: str) -> dict:
        """Confirms persistence by loading the instance and cleans up renamed instance, if applicable."""

        # Prior to loading from the filesystem, REMOVE any associated cache entry (likely on updates)
        # so that _load_resource() hits the filesystem - then adds the item to the cache.
        self.cache.remove_item(resource)
        try:
            metadata = self._load_resource(resource)
        except Exception as ex:
            self.log.error(f"Removing metadata instance '{resource}' due to previous error.")
            self._rollback(resource, renamed_resource)
            raise ex from ex

        if renamed_resource:  # Remove the renamed file
            os.remove(renamed_resource)
        return metadata

    def _remove_allowed(self, metadata: dict) -> bool:
        """Determines if the resource of the given instance is allowed to be removed."""
        allowed_resource = os.path.join(self.preferred_metadata_dir, metadata.get("name"))
        current_resource = os.path.splitext(metadata.get("resource"))[0]
        return allowed_resource == current_resource

    def _load_resource(self, resource: str) -> Dict[str, Any]:
        # This is always called with an existing resource (path) so no need to check existence.

        metadata_json: Dict[str, Any] = self.cache.get_item(resource)
        if metadata_json is not None:
            self.log.debug(f"Loading metadata instance from cache: '{metadata_json['name']}'")
            return metadata_json

        # Always take name from resource so resources can be copied w/o having to change content
        name = os.path.splitext(os.path.basename(resource))[0]

        self.log.debug(f"Loading metadata instance from: '{resource}'")
        with io.open(resource, "r", encoding="utf-8") as f:
            try:
                metadata_json = json.load(f)
            except ValueError as jde:  # JSONDecodeError is raised, but it derives from ValueError
                # If the JSON file cannot load, there's nothing we can do other than log and raise since
                # we aren't able to even instantiate an instance of Metadata.  Because errors are ignored
                # when getting multiple items, it's okay to raise.  The singleton searches (by handlers)
                # already catch ValueError and map to 400, so we're good there as well.
                self.log.error(
                    f"JSON failed to load for resource '{resource}' in the "
                    f"{self.schemaspace} schemaspace with error: {jde}."
                )
                raise ValueError(
                    f"JSON failed to load for instance '{name}' in the "
                    f"{self.schemaspace} schemaspace with error: {jde}."
                ) from jde

            metadata_json["name"] = name
            metadata_json["resource"] = resource
            self.cache.add_item(resource, metadata_json)

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
        if os.environ.get("ELYRA_METADATA_PATH"):
            paths.extend(p.rstrip(os.sep) for p in os.environ["ELYRA_METADATA_PATH"].split(os.pathsep))
        # then user dir
        paths.append(jupyter_core.paths.jupyter_data_dir())

        system_path = jupyter_core.paths.SYSTEM_JUPYTER_PATH
        paths.extend(system_path)

        # then sys.prefix, where installed files will reside (factory data)
        env_path = jupyter_core.paths.ENV_JUPYTER_PATH
        for p in env_path:
            if p not in system_path:
                paths.append(p)

        # add subdir, if requested.
        # Note, the 'metadata' parent dir is automatically added.
        if subdirs:
            paths = [os.path.join(p, "metadata", *subdirs) for p in paths]
        return paths
