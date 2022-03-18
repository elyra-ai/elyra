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
import json
from logging import Logger
import os
from pathlib import Path
from queue import Empty
from queue import Queue
from threading import Event
from threading import Thread
import time
from typing import Dict
from typing import List
from typing import Optional
from typing import Union

import entrypoints
from jinja2 import Environment
from jinja2 import PackageLoader
from jinja2 import Template
from jupyter_core.paths import jupyter_runtime_dir
from traitlets.config import SingletonConfigurable
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from elyra.metadata.manager import MetadataManager
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.pipeline.catalog_connector import ComponentCatalogConnector
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component_metadata import ComponentCatalogMetadata
from elyra.pipeline.runtime_type import RuntimeProcessorType

BLOCKING_TIMEOUT = 0.5
NONBLOCKING_TIMEOUT = 0.10
# Issue warnings if catalog update takes longer than this value in seconds
CATALOG_UPDATE_TIMEOUT = int(os.getenv("ELYRA_CATALOG_UPDATE_TIMEOUT", 15))
# Issue warnings when outstanding worker thread counts exceed this value
WORKER_THREAD_WARNING_THRESHOLD = int(os.getenv("ELYRA_WORKER_THREAD_WARNING_THRESHOLD", 10))


# Define custom type to describe the component cache
ComponentCacheType = Dict[str, Dict[str, Dict[str, Union[Component, Dict[str, Union[str, List[str]]]]]]]


class CacheUpdateManager(Thread):
    """Primary thread for maintaining consistency of the component cache.

    The component cache manager maintains two queues, a "manifest queue"
    and a "cache queue".  The manifest queue entries are a tuple of 'source'
    and 'action'.  The 'source' indicates the target aainst which the 'action'
    is applied.  The 'action' provides an indication of what action to take.

    Actions of 'modify' and 'delete' will have a 'source' of the catalog name
    to add to the manifest (along with that action).  These queue entries are
    inserted by the metadata persistence hooks when a component catalog instance
    is created, updated, or deleted.
    An 'action' of 'delete-manifest' will have a 'source' placeholder value of 'API'
    which prompts the deletion of the manifest file that, for server processes
    triggers the complete reload of the component cache by deleting the manifest
    file entirely.
    An 'action' of 'cache' will have a source indicating the absolute path of
    the manifest file.  This triggers a cache worker thread to read the manifest
    and perform the necessary actions relative to each of the catalogs referenced.

    The manifest file itself is a JSON file (dictionary) consisting of catalog name
    and cache-relative action ('delete', 'modify') indicating the kind of update
    to make to the component cache relative to the catalog.  For 'delete' the components
    of the referenced catalog are removed.  For 'modify' the components of the referenced
    catalog are inserted or updated (depending on its prior existence).
    """
    def __init__(self,
                 log: Logger,
                 component_cache: ComponentCacheType,
                 cache_queue: Queue,
                 manifest_queue: Queue,
                 manifest_filename: str):
        super().__init__()

        self.setDaemon(True)
        self.name = "CacheUpdateManager"

        self.log: Logger = log
        self._component_cache: ComponentCacheType = component_cache
        self._cache_queue: Queue = cache_queue
        self._manifest_queue: Queue = manifest_queue
        self._manifest_filename: str = manifest_filename

        # All values indicate a non-server process. This attribute will be changed
        # to true for the process that loads the cache.
        self.is_server_process: bool = False

        # Create a new manifest file for this process
        self._write_manifest()

        self._threads: List[CacheUpdateWorker] = []

        self.stop_event: Event = Event()  # Set when server process stops

    def run(self):
        """Process manifest queue entries.  If queue is empty or after processing one manifest
        entry, the cache queue entries are processed.
        """
        while not self.stop_event.is_set():

            try:
                # Get a task from the manifest queue
                source, action = self._manifest_queue.get(timeout=NONBLOCKING_TIMEOUT)
                self.log.debug(f"CacheUpdateManager processing manifest queue entry for "
                               f"action: '{action}', source: '{source}'...")
            except Empty:
                # No task exists in the manifest queue, proceed to check for cache tasks
                pass
            else:
                # Process the manifest queue entry

                if action == 'delete-manifest':
                    # TODO test this
                    # Clear the manifest queue of all tasks so that any prior
                    # queued updates do not occur unnecessarily
                    self._manifest_queue.queue.clear()

                    # A 'delete-manifest' action will remove the manifest files, triggering re-load
                    # of all catalogs from the watchdog. This action is only triggered by the
                    # catalog refresh API
                    self.remove_all_manifest_files()

                    # Build a new manifest file if this is not a server process. The pending
                    # cache load will create a manifest relative to the server process.
                    if not self.is_server_process:
                        self._write_manifest()

                elif action == 'cache':
                    # A 'cache' action means that updates to the component cache are required.
                    # These actions are only ever triggered by the manifest file watchdog and
                    # are only ever completed by the server process

                    # Load manifest in order to perform cache actions in-process
                    pending_actions = self._read_manifest(filename=source)

                    # Handle all pending actions in one batch (last update wins)
                    for catalog_name, cache_action in pending_actions.items():
                        if cache_action == 'delete':
                            # Fabricate a metadata instance that only includes catalog name
                            catalog_instance = ComponentCatalogMetadata(name=catalog_name)

                        else:  # cache_action == 'modify':
                            # Fetch the catalog instance associated with this action
                            catalog_instance = MetadataManager(
                                schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID
                            ).get(name=catalog_name)

                        # Add action to the cache queue
                        self._cache_queue.put((catalog_instance, cache_action))

                    # Reset manifest actions since they're complete
                    if pending_actions:
                        self._write_manifest(filename=source)

                    # 'cache' actions can be marked as done immediately as the tasks are
                    # handed off to a cache worker thread
                    if self._manifest_queue.unfinished_tasks:
                        self._manifest_queue.task_done()

                else:
                    # Any action that is not a 'delete-manifest' or 'cache' action means that
                    # an update to the manifest is required (ultimately prompting the watchdog
                    # of the server process's ComponentCache instance to trigger a 'cache' action)
                    manifest = self._read_manifest()

                    catalog_name = source
                    self.log.debug(f"CacheUpdateManager read manifest entry with catalog_name: '{source}, "
                                   f"action: '{manifest.get(catalog_name)}', expected_action: '{action}'")

                    # Add action to manifest (or over-write prior action)
                    manifest[catalog_name] = action

                    # Write to file so that this entry gets repurposed as a 'cache' action.
                    self._write_manifest(manifest=manifest)

                    # If this update is occurring out-of-process, the task can be
                    # marked as done because out-of-process updates do not work
                    # on cache updates. If the update is the server process, however,
                    # a cache update is pending and the manifest task will not be
                    # marked as complete until its corresponding cache task joins
                    if not self.is_server_process:
                        self._manifest_queue.task_done()

                self.log.debug(f"CacheUpdateManager processed manifest queue entry for "
                               f"action: '{action}', source: '{source}'.")
            self.manage_cache_tasks()

    def _read_manifest(self, filename: Optional[str] = None) -> Dict[str, str]:
        """Read and return the contents of a manifest file.

        If 'filename' is not provided, this process's manifest file will be read.
        """
        file: str = filename or self._manifest_filename
        with open(file, 'r') as f:
            manifest: Dict[str, str] = json.load(f)
        self.log.debug(f"Reading manifest '{manifest}' from file '{file}'")
        return manifest

    def _write_manifest(self, filename: Optional[str] = None, manifest: Optional[Dict[str, str]] = None) -> None:
        """Write the given manifest to the given manifest file.

        If the filename is None, the current process's manifest is written.
        If the manifest is None, an empty manifest will be written.
        """
        filename = filename or self._manifest_filename
        manifest: Dict[str, str] = manifest or {}

        self.log.debug(f"Writing manifest '{manifest}' to file '{filename}'")
        with open(filename, 'w') as f:
            json.dump(manifest, f, indent=2)

    def remove_all_manifest_files(self, delete_own: bool = False):
        """
        Remove all existing manifest files in the Jupyter runtimes directory.
        """
        manifest_files = Path(os.path.dirname(self._manifest_filename)).glob('**/elyra-component-manifest-*.json')
        for file in manifest_files:
            if not delete_own and self.is_server_process and str(file) == self._manifest_filename:
                # Ensure that we do not remove the manifest file for this process
                continue
            os.remove(str(file))

    def manage_cache_tasks(self):
        """
        Check the cache queue for a cache update action and start
        a corresponding worker thread to complete the update
        """
        outstanding_threads = self._has_outstanding_threads()

        try:
            # Get a task from the cache queue
            timeout = BLOCKING_TIMEOUT
            if outstanding_threads or not self._manifest_queue.empty():
                timeout = NONBLOCKING_TIMEOUT

            catalog, action = self._cache_queue.get(timeout=timeout)

        except Empty:
            # No task exists in the cache queue, proceed to check for thread execution
            pass

        else:
            # Create and start a thread for the task
            updater_thread = CacheUpdateWorker(
                self._component_cache,
                catalog,
                action
            )
            updater_thread.start()
            self.log.debug(f"CacheUpdateWorker started for catalog: '{updater_thread.name}', action: '{action}'...")

            self._threads.append(updater_thread)

    def _has_outstanding_threads(self) -> bool:
        """
        Join finished threads and report on long-running threads as needed.
        """
        outstanding_threads = False
        for thread in self._threads:
            # Attempt to join thread within the given amount of time
            thread.join(timeout=NONBLOCKING_TIMEOUT)

            cumulative_run_time = int(time.time() - thread.task_start_time)
            if thread.is_alive():
                # Thread is still running (thread join timed out)
                outstanding_threads = True

                # Report on a long-running thread if CATALOG_UPDATE_TIMEOUT is exceeded
                time_since_last_check = int(time.time() - thread.last_warn_time)
                if time_since_last_check > CATALOG_UPDATE_TIMEOUT:
                    thread.last_warn_time = time.time()
                    self.log.warning(f"Cache update for catalog '{thread.name}' is still processing "
                                     f"after {cumulative_run_time} seconds ...")

            else:
                self.log.debug(f"CacheUpdateWorker completed for catalog: '{thread.name}', action: '{thread.action}'.")
                # Thread has been joined and can be removed from the list
                self._threads.remove(thread)

                # Mark cache task as complete
                self._cache_queue.task_done()

                # Mark the corresponding manifest 'modify' task that prompted this
                # cache task as complete
                if self._manifest_queue.unfinished_tasks:
                    self._manifest_queue.task_done()

                # Report successful join for threads that have previously logged a
                # cache update duration warning
                if thread.last_warn_time != thread.task_start_time:
                    self.log.info(f"Cache update for catalog '{thread.name}' has "
                                  f"completed after {cumulative_run_time} seconds")

            if len(self._threads) > WORKER_THREAD_WARNING_THRESHOLD:
                self.log.warning(f"CacheUpdateWorker outstanding threads threshold "
                                 f"({WORKER_THREAD_WARNING_THRESHOLD}) has been exceeded. "
                                 f"{len(self._threads)} threads are outstanding.  This may "
                                 f"indicate a possible issue.")

        return outstanding_threads

    def stop(self):
        """
        Trigger completion of the manager thread.
        """
        self.stop_event.set()
        self.remove_all_manifest_files(delete_own=True)


class CacheUpdateWorker(Thread):
    """Spawned by the CacheUpdateManager to perform work against the component cache."""
    def __init__(self,
                 component_cache: ComponentCacheType,
                 catalog: ComponentCatalogMetadata,
                 action: Optional[str] = None):

        super().__init__()

        self.setDaemon(True)
        self.name = catalog.name  # Let the name of the thread reflect the catalog being managed

        self._component_cache: ComponentCacheType = component_cache

        # Task-specific properties
        self.catalog: ComponentCatalogMetadata = catalog
        self.action: str = action

        # Thread metadata
        self.task_start_time = time.time()
        self.last_warn_time = self.task_start_time

        # Prepare component cache for modification
        runtime_type = None
        if self.catalog.metadata:
            runtime_type = self.catalog.runtime_type.name
        self.prepare_cache_for_catalog(runtime_type)

    def run(self):
        if self.action == 'delete':
            # Check all runtime types in cache for an entry of the given name.
            # If found, remove only the components from this catalog
            for runtime_type in self._component_cache:
                if self.catalog.name in self._component_cache[runtime_type]:
                    self._component_cache[runtime_type].pop(self.catalog.name, None)
                    break
        else:  # 'modify' - replace (or add) components from the given catalog an update its status
            runtime_type = self.catalog.runtime_type.name
            catalog_state = self._component_cache[runtime_type][self.catalog.name].get('status')
            try:
                # Replace all components for the given catalog
                self._component_cache[runtime_type][self.catalog.name]['components'] = \
                    ComponentCache.instance().read_component_catalog(self.catalog)
                catalog_state['state'] = "current"
                catalog_state['errors'] = []  # reset any errors that may have been present
            except Exception as e:
                # Update manifest queue with an 'error' action and the relevant message
                catalog_state['state'] = "error"
                catalog_state['errors'].append(str(e))

            self._component_cache[runtime_type][self.catalog.name]['status'] = catalog_state

    def prepare_cache_for_catalog(self, runtime_type: Optional[str] = None):
        """
        Add entries to the component cache for the runtime type and/or catalog
        of focus for this thread, and set the catalog state to 'updating'.
        """
        if self.action == 'delete':
            # On 'delete' the runtime_type parameter will be None and since catalog names
            # are essentially unique across runtime types, we can break out of this loop
            # on first occurrence and let _that_ runtime type be used in the following code.
            for runtime_type in self._component_cache:
                if self.catalog.name in self._component_cache[runtime_type]:
                    break

        # Add sub-dictionary for this runtime type if not present
        if not self._component_cache.get(runtime_type):
            self._component_cache[runtime_type] = {}

        # Add sub-dictionary for this catalog if not present - this will occur when
        # a catalog instance is created, so we're essentially adding a placeholder.
        if not self._component_cache[runtime_type].get(self.catalog.name):
            self._component_cache[runtime_type][self.catalog.name] = {
                "components": {},
                "status": {
                    "state": "current",
                    "errors": []
                }
            }

        # Set state to 'updating'
        self._component_cache[runtime_type][self.catalog.name]['status']['state'] = 'updating'


class ComponentCache(SingletonConfigurable):
    """Represents the cache of component definitions indexed by runtime-type, then by catalog name."""

    # The component_cache is indexed at the top level by runtime type name, e.g. 'APACHE_AIRFLOW',
    # and has as its value another dictionary. At the second level, each sub-dictionary is indexed by
    # a ComponentCatalogMetadata instance name; its value is also a sub-dictionary. This sub-dictionary
    # consists of two additional dictionaries: 1.) one with key "components" whose dictionary is
    # indexed by component id and maps to the corresponding Component object, and 2.) one with key
    # "status" and value of a final sub-dictionary with key-value pairs "state":"<current/updating/errors>"
    # and "errors":["<error1>", "<error2>", ...] to dynamically indicate the status of this catalog instance
    _component_cache: ComponentCacheType = {}

    _generic_category_label = "Elyra"
    _generic_components: Dict[str, Component] = {
        "notebook": Component(id="notebook",
                              name="Notebook",
                              description="Run notebook file",
                              op="execute-notebook-node",
                              catalog_type="elyra",
                              component_reference="elyra",
                              extensions=[".ipynb"],
                              categories=[_generic_category_label]),
        "python-script": Component(id="python-script",
                                   name="Python Script",
                                   description="Run Python script",
                                   op="execute-python-node",
                                   catalog_type="elyra",
                                   component_reference="elyra",
                                   extensions=[".py"],
                                   categories=[_generic_category_label]),
        "r-script": Component(id="r-script",
                              name="R Script",
                              description="Run R script",
                              op="execute-r-node",
                              catalog_type="elyra",
                              component_reference="elyra",
                              extensions=[".r"],
                              categories=[_generic_category_label])}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self._cache_queue: Queue = Queue()
        self._manifest_queue: Queue = Queue()

        manifest_dir = jupyter_runtime_dir()
        self.manifest_filename = os.path.join(manifest_dir, f"elyra-component-manifest-{os.getpid()}.json")

        # Set up watchdog for manifest file
        self.observer = Observer()
        self.observer.schedule(ManifestFileChangeHandler(self), manifest_dir)

        # Start a thread to manage updates to the component cache and manifest
        self.cache_manager = CacheUpdateManager(
            self.log,
            self._component_cache,
            self._cache_queue,
            self._manifest_queue,
            self.manifest_filename
        )
        self.cache_manager.start()
        self.log.debug("CacheUpdateManager started...")

    def load(self):
        """
        Completes a series of actions during system startup, such as creating
        the component manifest file and triggering the build of the component
        cache for existing ComponentCatalog metadata instances.
        """
        # Proceed only if singleton instance has been created
        if self.initialized:
            # The cache manager will work on manifest and cache tasks on an
            # in-process basis as load() is only called during startup from
            # the server process.
            self.cache_manager.is_server_process = True

            # Remove all existing manifest files from previous processes
            self.cache_manager.remove_all_manifest_files()

            # Start the watchdog if its not alive, prevents redundant starts
            if not self.observer.is_alive():
                self.observer.start()

            # Fetch all component catalog instances and trigger their add to the component cache
            catalogs = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID).get_all()
            for catalog in catalogs:
                self._cache_queue.put((catalog, 'modify'))

    def update_manifest_queue(self, source: str, action: str):
        """
        Triggers an update of the component manifest for the given catalog name.
        """
        manifest_task = (source, action)
        if manifest_task not in list(self._manifest_queue.queue):
            self._manifest_queue.put(manifest_task)

        # CLI processes will never start their watchdog. For these out-of-process updates,
        # we want to wait for the manifest update to complete before exiting
        if not self.cache_manager.is_server_process:
            self.wait_for_all_tasks()

    def wait_for_all_tasks(self):
        """
        Block execution and wait for all tasks on the manifest and cache queues.
        """
        self.wait_for_all_manifest_tasks()
        self.wait_for_all_cache_tasks()

    def wait_for_all_manifest_tasks(self):
        """
        Block execution and wait for all tasks in the manifest update queue to complete. This
        is used by tests and out-of-process updates/deletes that should exit after their manifest
        file is updated.
        """
        self._manifest_queue.join()

    def wait_for_all_cache_tasks(self):
        """
        Block execution and wait for all tasks in the cache task update queue to complete.
        Primarily used for testing.
        """
        self._cache_queue.join()

    def get_all_components(self, platform: RuntimeProcessorType) -> List[Component]:
        """
        Retrieve all components from component catalog cache
        """
        components: List[Component] = []

        catalogs = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_properties in catalogs.items():
            components.extend(list(catalog_properties.get('components', {}).values()))

        if not components:
            self.log.error(f"No components could be found in any catalog for platform type '{platform.name}'.")

        return components

    def get_component(self, platform: RuntimeProcessorType, component_id: str) -> Optional[Component]:
        """
        Retrieve the component with a given component_id from component catalog cache
        """
        component: Optional[Component] = None

        catalogs = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_properties in catalogs.items():
            component = catalog_properties.get('components', {}).get(component_id)
            if component:
                break

        if not component:
            self.log.error(f"Component with ID '{component_id}' could not be found in any catalog.")

        return component

    def _load_catalog_reader_class(self, catalog: ComponentCatalogMetadata, file_types: List[str]) \
            -> Optional[ComponentCatalogConnector]:
        """
        Load the appropriate entrypoint class based on the schema name indicated in
        the ComponentCatalogMetadata instance and the file types associated with the component
        parser in use
        """
        try:
            catalog_reader = entrypoints.get_group_named('elyra.component.catalog_types').get(catalog.schema_name)
            if not catalog_reader:
                self.log.error(f"No entrypoint with name '{catalog.schema_name}' was found in group "
                               f"'elyra.component.catalog_types' to match the 'schema_name' given in catalog "
                               f"'{catalog.display_name}'. Skipping...")
                return None

            catalog_reader = catalog_reader.load()(file_types, parent=self.parent)
        except Exception as e:
            self.log.error(f"Could not load appropriate ComponentCatalogConnector class: {e}. Skipping...")
            return None

        return catalog_reader

    def read_component_catalog(self, catalog: ComponentCatalogMetadata) -> Dict[str, Component]:
        """
        Read a component catalog and return a dictionary of components indexed by component_id.

        :param catalog: a metadata instances from which to read and construct Component objects

        :returns: a dictionary of component id to Component object for all read/parsed components
        """
        components: Dict[str, Component] = {}

        # Assign component parser based on the runtime platform type
        parser = ComponentParser.create_instance(platform=catalog.runtime_type)

        # Assign reader based on the type of the catalog (the 'schema_name')
        catalog_reader = self._load_catalog_reader_class(catalog, parser.file_types)
        if not catalog_reader:
            return components

        # Get content of component definition file for each component in this catalog
        self.log.debug(f"Processing components in catalog '{catalog.display_name}'")
        catalog_entries = catalog_reader.read_component_definitions(catalog)
        if not catalog_entries:
            return components

        for catalog_entry in catalog_entries:
            # Parse the entry to get a fully qualified Component object
            parsed_components = parser.parse(catalog_entry) or []
            for component in parsed_components:
                components[component.id] = component

        return components

    @staticmethod
    def get_generic_components() -> List[Component]:
        return list(ComponentCache._generic_components.values())

    @staticmethod
    def get_generic_component(component_id: str) -> Component:
        return ComponentCache._generic_components.get(component_id)

    @staticmethod
    def load_jinja_template(template_name: str) -> Template:
        """
        Loads the jinja template of the given name from the
        elyra/templates/components folder
        """
        loader = PackageLoader('elyra', 'templates/components')
        template_env = Environment(loader=loader)

        return template_env.get_template(template_name)

    @staticmethod
    def to_canvas_palette(components: List[Component]) -> Dict:
        """
        Converts catalog components into appropriate canvas palette format
        """
        template = ComponentCache.load_jinja_template('canvas_palette_template.jinja2')

        # Define a fallback category for components with no given categories
        fallback_category_name = "No Category"

        # Convert the list of all components into a dictionary of
        # component lists keyed by category
        category_to_components: Dict[str, List[Component]] = {}
        for component in components:
            categories = component.categories

            # Assign a fallback category so that component is not
            # lost during palette render
            if not categories:
                categories = [fallback_category_name]

            for category in categories:
                if category not in category_to_components.keys():
                    category_to_components[category] = []

                if component.id not in [comp.id for comp in category_to_components[category]]:
                    category_to_components[category].append(component)

        # Render template
        canvas_palette = template.render(category_dict=category_to_components)
        return json.loads(canvas_palette)

    @staticmethod
    def to_canvas_properties(component: Component) -> Dict:
        """
        Converts catalog components into appropriate canvas properties format

        If component_id is one of the generic set, generic template is rendered,
        otherwise, the  runtime-specific property template is rendered
        """
        if component.id in ('notebook', 'python-script', 'r-script'):
            template = ComponentCache.load_jinja_template('generic_properties_template.jinja2')
        else:
            template = ComponentCache.load_jinja_template('canvas_properties_template.jinja2')

        canvas_properties = template.render(component=component)
        return json.loads(canvas_properties)


class ManifestFileChangeHandler(FileSystemEventHandler):
    """Watchdog handler that filters on .json files within specific metadata directories."""

    def __init__(self, component_cache: ComponentCache, **kwargs):
        super().__init__(**kwargs)
        self.component_cache = component_cache
        self.log = component_cache.log

    def dispatch(self, event):
        """Dispatches delete and modification events pertaining to the manifest filename"""
        if "elyra-component-manifest" in event.src_path:
            super().dispatch(event)

    def on_deleted(self, event):
        """
        Fires when the component manifest file is deleted, triggering a re-load of the
        manifest and, ultimately, the component cache.
        """
        self.log.debug(f"ManifestFileChangeHandler: file '{event.src_path}' has been deleted.")
        ComponentCache.instance().load()

    def on_modified(self, event):
        """Fires when the component manifest file is modified."""
        self.log.debug(f"ManifestFileChangeHandler: file '{event.src_path}' has been modified.")
        self.component_cache.update_manifest_queue(source=event.src_path, action='cache')
