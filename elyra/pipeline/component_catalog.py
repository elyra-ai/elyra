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
from queue import Empty
from queue import Queue
from threading import Event
from threading import Thread
import time
from typing import Dict
from typing import List
from typing import Optional

import entrypoints
from jinja2 import Environment
from jinja2 import PackageLoader
from jinja2 import Template
import jupyter_core.paths
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

BLOCKING_TIMEOUT = 5
NONBLOCKING_TIMEOUT = 0.10
CATALOG_UPDATE_TIMEOUT = 15


class CacheUpdateManagerThread(Thread):
    def __init__(self,
                 log: Logger,
                 component_cache: Dict[str, Dict],
                 cache_queue: Queue,
                 manifest_queue: Queue,
                 manifest_filename: str):
        super().__init__()

        self.setDaemon(True)

        self.log = log
        self._component_cache = component_cache
        self._cache_queue = cache_queue
        self._manifest_queue = manifest_queue
        self._manifest_filename = manifest_filename

        self._threads: List[CacheUpdateThread] = []

        self.stop_event = Event()

    def run(self):
        while not self.stop_event.is_set():
            try:
                # Get a task from the manifest queue
                catalog_name, action, *errors = self._manifest_queue.get(timeout=NONBLOCKING_TIMEOUT)
            except Empty:
                # No task exists in the manifest queue, proceed to check for cache tasks
                pass
            else:
                # Make the required update to the manifest file
                if os.path.isfile(self._manifest_filename):
                    with open(self._manifest_filename, 'r') as f:
                        manifest = json.load(f)

                write_required = False
                if action == 'delete-manifest':
                    # A 'delete-manifest' action will remove the file, triggering a re-load
                    # of all catalogs from the watchdog. This action is only triggered by the
                    # catalog refresh API
                    os.remove(self._manifest_filename)

                elif action == 'cache':
                    # A 'cache' action means that updates to the component cache are required.
                    # These actions are only ever triggered by the manifest file watchdog

                    # Handle all pending actions in one batch
                    for catalog_name, cache_action in manifest['actions'].items():
                        write_required = True

                        if cache_action == 'delete':
                            # Remove status stanza from manifest
                            manifest['status'].pop(catalog_name, None)

                            # Fabricate a metadata instance that only includes catalog name
                            catalog_instance = ComponentCatalogMetadata(name=catalog_name)

                        else:  # cache_action == 'modify':
                            # Create or replace the status stanza to indicate status is current
                            errors = manifest['status'].get(catalog_name, {}).get('errors', [])
                            manifest['status'][catalog_name] = {
                                'action': 'current',
                                'errors': errors
                            }

                            # Fetch the catalog instance associated with this action
                            catalog_instance = MetadataManager(
                                schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID
                            ).get(name=catalog_name)

                        # Add action to the cache queue
                        self._cache_queue.put((catalog_instance, cache_action))

                    # Clear redundant actions from manifest queue and
                    # reset manifest actions to prepare for write out
                    self.clear_duplicate_cache_actions()
                    manifest['actions'] = {}

                elif action == 'error':
                    # An 'error' action means that a CacheUpdateThread has encountered an error
                    # while executing its task
                    if errors:
                        # Add errors to 'status' stanza of manifest and set action to 'error'.
                        # No modification to the 'actions' stanza of the manifest is necessary
                        # because the cache-based work has already been done
                        prior_errors = manifest['status'].get(catalog_name, {}).get('errors', [])
                        errors.extend(prior_errors)
                        manifest['status'][catalog_name] = {
                            'action': action,
                            'errors': errors
                        }

                        write_required = True

                else:
                    # Any action that is not a 'delete-manifest', 'cache', or 'error' action means
                    # that an update to the 'actions' stanza of the manifest is required.
                    if manifest['actions'].get('catalog_name') != action:
                        # Ensure this new action is not already present in manifest and add to 'actions'
                        manifest['actions'][catalog_name] = action
                        write_required = True

                if write_required:
                    with open(self._manifest_filename, 'w') as f:
                        json.dump(manifest, f, indent=2)

                self._manifest_queue.task_done()

            self.manage_cache_tasks()

    def clear_duplicate_cache_actions(self):
        """
        Remove redundant actions from the manifest queue. Because manifest 'cache' actions
        trigger batch processing of all pending cache updates, multiple 'cache' actions left
        in the queue after a batch processing event are redundant.
        """
        task_set = set()
        while True:
            try:
                task = self._manifest_queue.get(block=False)
            except Empty:
                break
            else:
                task_set.add(task)
        for task in task_set:
            self._manifest_queue.put(task)

    def manage_cache_tasks(self):
        """
        Check the cache queue for a cache update action and start
        a corresponding worker thread to complete the update
        """
        outstanding_threads = self.check_outstanding_threads()

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
            updater_thread = CacheUpdateThread(
                self._component_cache,
                self._cache_queue,
                self._manifest_queue,
                catalog,
                action
            )
            updater_thread.start()

            self._threads.append(updater_thread)

    def check_outstanding_threads(self) -> bool:
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
                # Thread has been joined and can be removed from the list
                self._threads.remove(thread)

                # Report successful join for threads that have previously logged a
                # cache update duration warning
                if thread.last_warn_time != thread.task_start_time:
                    self.log.info(f"Cache update for catalog '{thread.name}' has "
                                  f"completed after {cumulative_run_time} seconds")

        return outstanding_threads

    def stop(self):
        """
        Trigger completion of the manager thread.
        """
        self.stop_event.set()


class CacheUpdateThread(Thread):
    def __init__(self,
                 component_cache: Dict[str, Dict],
                 cache_queue: Queue,
                 manifest_queue: Queue,
                 catalog: ComponentCatalogMetadata,
                 action: Optional[str] = None):

        super().__init__()

        self.setDaemon(True)
        self.name = catalog.name

        self._component_cache = component_cache
        self._cache_queue = cache_queue
        self._manifest_queue = manifest_queue

        # Task-specific properties
        self.catalog = catalog
        self.action = action

        # Thread metadata
        self.task_start_time = time.time()
        self.last_warn_time = self.task_start_time

    def run(self):
        if self.action == 'delete':
            # Check all runtime types in cache for an entry of the given name.
            # If found, remove only the components from this catalog
            for runtime_type in self._component_cache:
                if self.catalog.name in self._component_cache[runtime_type]:
                    self._component_cache[runtime_type].pop(self.catalog.name, None)
                    break
        else:
            runtime_type = self.catalog.runtime_type.name

            # Add sub-dictionary for this runtime type if not present
            if not self._component_cache.get(runtime_type):
                self._component_cache[runtime_type] = {}

            try:
                # Replace all components for the given catalog
                self._component_cache[runtime_type][self.catalog.name] = \
                    ComponentCache.instance().read_component_catalog(self.catalog)
            except Exception as e:
                # Update manifest queue with an 'error' action and the relevant message
                self._manifest_queue.put((self.catalog.name, 'error', str(e)))

        self._cache_queue.task_done()


class ComponentCache(SingletonConfigurable):
    # The component_cache is indexed at the top level by runtime type name, e.g. 'APACHE_AIRFLOW',
    # and has as its value another dictionary. At the second level, each sub-dictionary is indexed by
    # a ComponentCatalogMetadata instance name and its value is also a sub-dictionary. This lowest
    # level dictionary is indexed by component id and maps to the corresponding Component object.
    _component_cache: Dict[str, Dict[str, Dict[str, Component]]] = {}

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

        self._cache_queue = Queue()
        self._manifest_queue = Queue()

        manifest_dir = jupyter_core.paths.jupyter_runtime_dir()
        self.manifest_filename = os.path.join(manifest_dir, "elyra-component-manifest.json")

        # Set up watchdog for manifest
        self.observer = Observer()
        self.observer.schedule(ManifestFileChangeHandler(self), manifest_dir)

        # Start a thread to manage updates to the component cache and manifest
        self._cache_manager = CacheUpdateManagerThread(
            self.log,
            self._component_cache,
            self._cache_queue,
            self._manifest_queue,
            self.manifest_filename
        )
        self._cache_manager.name = "CacheUpdateManager"
        self._cache_manager.start()

    def load(self):
        """
        Completes a series of actions during system startup, such as creating
        the component manifest file and triggering the build of the component
        cache for existing ComponentCatalog metadata instances.
        """
        # Proceed only if singleton instance has been created
        if self.initialized:
            # Create/overwrite manifest file and start its watchdog
            self.set_up_manifest_file()
            if not self.observer.is_alive():
                self.observer.start()

            # Fetch all component catalog instances and trigger their add to
            # the component manifest, and consequently, the component cache
            catalogs = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID).get_all()
            for catalog in catalogs:
                self.update_manifest_queue(action='modify', catalog_name=catalog.name)

    def set_up_manifest_file(self):
        """
        Build an empty manifest and overwrite or create the file. After this point,
        only the CacheUpdateManagerThread is able to touch this file.
        """
        empty_manifest: Dict[str, Dict] = {
            "actions": {},  # value of the form "<catalog_name>": "<action>"
            "status": {}  # value of the form "<catalog_name>": {"action": "<action>", "errors": ["<err1>", ...]}
        }

        with open(self.manifest_filename, 'w') as f:
            f.write(json.dumps(empty_manifest, indent=2))

    def update_manifest_queue(self, action: str, catalog_name: Optional[str] = None):
        """
        Triggers an update of the component manifest for the given catalog name.
        """
        self._manifest_queue.put((catalog_name, action))

        # CLI processes will never start their watchdog. For these out-of-process updates,
        # we want to wait for the manifest update to complete before exiting
        if not self.observer.is_alive():
            self._manifest_queue.join()

    def wait_for_all_cache_updates(self):
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

        platform_components = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_components in platform_components.items():
            components.extend(list(catalog_components.values()))

        if not components:
            self.log.error(f"No components could be found in any catalog for platform type '{platform.name}'.")

        return components

    def get_component(self, platform: RuntimeProcessorType, component_id: str) -> Optional[Component]:
        """
        Retrieve the component with a given component_id from component catalog cache
        """
        component: Optional[Component] = None

        platform_components = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_components in platform_components.items():
            component = catalog_components.get(component_id)
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
        self.manifest_filename = component_cache.manifest_filename
        self.log = component_cache.log

    def dispatch(self, event):
        """Dispatches delete and modification events pertaining to the manifest filename"""
        if event.src_path.endswith(os.path.basename(self.manifest_filename)):
            super().dispatch(event)

    def on_deleted(self, event):
        """
        Fires when the component manifest file is deleted, triggering a re-load of the
        manifest and, ultimately, the component cache.
        """
        ComponentCache.instance().load()

    def on_modified(self, event):
        """Fires when the component manifest file is modified."""
        self.component_cache.update_manifest_queue(action='cache')
