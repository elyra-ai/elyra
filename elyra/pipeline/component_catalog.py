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
from elyra.metadata.metadata import Metadata
from elyra.metadata.schemaspaces import ComponentCatalogs
from elyra.pipeline.catalog_connector import ComponentCatalogConnector
from elyra.pipeline.component import Component
from elyra.pipeline.component import ComponentParser
from elyra.pipeline.component_metadata import ComponentCatalogMetadata
from elyra.pipeline.properties import ComponentProperty
from elyra.pipeline.registry import PipelineProcessorRegistry
from elyra.pipeline.runtime_type import RuntimeProcessorType

BLOCKING_TIMEOUT = 0.5
NONBLOCKING_TIMEOUT = 0.10
# Issue warnings if catalog update takes longer than this value in seconds
CATALOG_UPDATE_TIMEOUT = int(os.getenv("ELYRA_CATALOG_UPDATE_TIMEOUT", 15))
# Issue warnings when outstanding worker thread counts exceed this value
WORKER_THREAD_WARNING_THRESHOLD = int(os.getenv("ELYRA_WORKER_THREAD_WARNING_THRESHOLD", 10))


# Define custom type to describe the component cache
ComponentCacheType = Dict[str, Dict[str, Dict[str, Dict[str, Union[Component, str, List[str]]]]]]


class RefreshInProgressError(Exception):
    def __init__(self):
        super().__init__("A catalog refresh is in progress.  Try the request later.")


class RefreshQueue(Queue):
    """Entries are associated with a complete refresh of the Component Cache."""

    _refreshing: bool

    def __init__(self):
        super().__init__()
        self._refreshing = False

    @property
    def refreshing(self) -> bool:
        return self._refreshing

    @refreshing.setter
    def refreshing(self, value: bool) -> None:
        self._refreshing = value

    def get(self, block: bool = True, timeout: Optional[float] = None):
        """Overrides the superclass method to set the refreshing property to false when empty."""
        try:
            entry = super().get(block=block, timeout=timeout)
        except Empty:
            self.refreshing = False
            raise
        return entry

    def put(self, item, block=True, timeout=None):
        """Overrides the superclass method to set the refreshing property to true."""
        super().put(item, block=block, timeout=timeout)
        self.refreshing = True


class UpdateQueue(Queue):
    """Entries are associated with a single update of the Component Cache.

    This class merely exists to distinguish it from the RefreshQueue instance.
    """

    pass


class CacheUpdateManager(Thread):
    """
    Primary thread for maintaining consistency of the component cache.

    The component cache manager maintains the cache queue, whose entries are a
    tuple of 'catalog' and 'action'.  The 'catalog' is a catalog instance against
    which the 'action' is applied. The 'action' is one of 'modify' or 'delete'.
    For 'delete' the components of the referenced catalog are removed. For 'modify'
    the components of the referenced catalog are inserted or updated (depending on
    its prior existence).
    """

    def __init__(
        self, log: Logger, component_cache: ComponentCacheType, refresh_queue: RefreshQueue, update_queue: UpdateQueue
    ):
        super().__init__()

        self.daemon = True
        self.name = "CacheUpdateManager"

        self.log: Logger = log
        self._component_cache: ComponentCacheType = component_cache
        self._refresh_queue: RefreshQueue = refresh_queue
        self._update_queue: UpdateQueue = update_queue
        self._check_refresh_queue = False
        self._threads: List[CacheUpdateWorker] = []

        self.stop_event: Event = Event()  # Set when server process stops

    def run(self):
        """Process queue queue entries until server is stopped."""
        while not self.stop_event.is_set():
            self.manage_cache_tasks()

    def manage_cache_tasks(self):
        """
        Check the cache queue for a cache update action and start
        a corresponding worker thread to complete the update
        """
        outstanding_threads = self._has_outstanding_threads()
        try:
            # Get a task from the cache queue, waiting less if we have active threads.
            timeout = NONBLOCKING_TIMEOUT if outstanding_threads else BLOCKING_TIMEOUT

            # Toggle between refresh and update queues so as to prevent starvation.
            self._check_refresh_queue = not self._check_refresh_queue
            if self._check_refresh_queue:
                catalog, action = self._refresh_queue.get(timeout=timeout)
            else:
                catalog, action = self._update_queue.get(timeout=timeout)

        except Empty:
            # No task exists in the cache queue, proceed to check for thread execution
            pass

        else:
            # Create and start a thread for the task
            updater_thread = CacheUpdateWorker(
                self._component_cache,
                self._refresh_queue if self._check_refresh_queue else self._update_queue,
                catalog,
                action,
            )
            updater_thread.start()
            queue_clause = "refreshing" if self._check_refresh_queue else "updating"
            self.log.debug(f"CacheUpdateWorker {queue_clause} catalog: '{updater_thread.name}', action: '{action}'...")
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
                    self.log.warning(
                        f"Cache update for catalog '{thread.name}' is still processing "
                        f"after {cumulative_run_time} seconds ..."
                    )

            else:
                self.log.debug(f"CacheUpdateWorker completed for catalog: '{thread.name}', action: '{thread.action}'.")
                # Thread has been joined and can be removed from the list
                self._threads.remove(thread)

                # Mark cache task as complete
                thread.queue.task_done()

                # Report successful join for threads that have previously logged a
                # cache update duration warning
                if thread.last_warn_time != thread.task_start_time:
                    self.log.info(
                        f"Cache update for catalog '{thread.name}' has "
                        f"completed after {cumulative_run_time} seconds"
                    )

            if len(self._threads) > WORKER_THREAD_WARNING_THRESHOLD:
                self.log.warning(
                    f"CacheUpdateWorker outstanding threads threshold "
                    f"({WORKER_THREAD_WARNING_THRESHOLD}) has been exceeded. "
                    f"{len(self._threads)} threads are outstanding.  This may "
                    f"indicate a possible issue."
                )

        return outstanding_threads

    def is_refreshing(self) -> bool:
        return self._refresh_queue.refreshing

    def init_refresh(self) -> None:
        self._refresh_queue.refreshing = True

    def stop(self):
        """Trigger completion of the manager thread."""
        self._refresh_queue.refreshing = False
        self.stop_event.set()
        self.log.debug("CacheUpdateManager stopped.")


class CacheUpdateWorker(Thread):
    """Spawned by the CacheUpdateManager to perform work against the component cache."""

    def __init__(
        self,
        component_cache: ComponentCacheType,
        queue: Queue,
        catalog: ComponentCatalogMetadata,
        action: Optional[str] = None,
    ):
        super().__init__()

        self.daemon = True
        self.name = catalog.name  # Let the name of the thread reflect the catalog being managed

        self._component_cache: ComponentCacheType = component_cache

        # Task-specific properties
        self.queue: Queue = queue
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
        """Apply the relative action to the given catalog entry in the cache."""
        if self.action == "delete":
            # Check all runtime types in cache for an entry of the given name.
            # If found, remove only the components from this catalog
            for runtime_type in self._component_cache:
                if self.catalog.name in self._component_cache[runtime_type]:
                    self._component_cache[runtime_type].pop(self.catalog.name, None)
                    break
        else:  # 'modify' - replace (or add) components from the given catalog an update its status
            runtime_type = self.catalog.runtime_type.name
            catalog_state = self._component_cache[runtime_type][self.catalog.name].get("status")
            try:
                # Replace all components for the given catalog
                self._component_cache[runtime_type][self.catalog.name][
                    "components"
                ] = ComponentCache.instance().read_component_catalog(self.catalog)
                catalog_state["state"] = "current"
                catalog_state["errors"] = []  # reset any errors that may have been present
            except Exception as e:
                # Update state with an 'error' action and the relevant message
                catalog_state["state"] = "error"
                catalog_state["errors"].append(str(e))

    def prepare_cache_for_catalog(self, runtime_type: Optional[str] = None):
        """
        Add entries to the component cache for the runtime type and/or catalog
        of focus for this thread, and set the catalog state to 'updating'.
        """
        if self.action == "delete":
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
                "status": {"state": "updating", "errors": []},
            }
        else:  # Set state to 'updating' for an existing entry
            self._component_cache[runtime_type][self.catalog.name]["status"]["state"] = "updating"


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
        "notebook": Component(
            id="notebook",
            name="Notebook",
            description="Run notebook file",
            op="execute-notebook-node",
            catalog_type="elyra",
            component_reference="elyra",
            extensions=[".ipynb"],
            categories=[_generic_category_label],
        ),
        "python-script": Component(
            id="python-script",
            name="Python Script",
            description="Run Python script",
            op="execute-python-node",
            catalog_type="elyra",
            component_reference="elyra",
            extensions=[".py"],
            categories=[_generic_category_label],
        ),
        "r-script": Component(
            id="r-script",
            name="R Script",
            description="Run R script",
            op="execute-r-node",
            catalog_type="elyra",
            component_reference="elyra",
            extensions=[".r"],
            categories=[_generic_category_label],
        ),
    }

    def __init__(self, **kwargs):
        emulate_server_app: bool = kwargs.pop("emulate_server_app", False)
        super().__init__(**kwargs)
        self._component_cache = {}
        self.is_server_process = ComponentCache._determine_server_process(emulate_server_app, **kwargs)
        self.manifest_dir = jupyter_runtime_dir()
        # Ensure queue attribute exists for non-server instances as well.
        self.refresh_queue: Optional[RefreshQueue] = None
        self.update_queue: Optional[UpdateQueue] = None
        if self.is_server_process:
            self.refresh_queue = RefreshQueue()
            self.update_queue = UpdateQueue()

            # Set up watchdog for manifest file for out-of-process updates
            self.observer = Observer()
            self.observer.schedule(ManifestFileChangeHandler(self), self.manifest_dir)

            # Start a thread to manage updates to the component cache
            manager = CacheUpdateManager(self.log, self._component_cache, self.refresh_queue, self.update_queue)
            self.cache_manager = manager
            self.cache_manager.start()
            self.log.debug("CacheUpdateManager started...")
        else:
            self.manifest_filename = os.path.join(self.manifest_dir, f"elyra-component-manifest-{os.getpid()}.json")

    @staticmethod
    def _determine_server_process(emulate_server_app: bool, **kwargs) -> bool:
        """Determines if this process is a server (extension) process."""
        app_names = ["ServerApp", "ElyraApp"]
        is_server_process = False
        if "parent" in kwargs and kwargs["parent"].__class__.__name__ in app_names:
            is_server_process = True
        elif emulate_server_app:  # Used in unittests
            is_server_process = True

        return is_server_process

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
            if self.is_server_process:
                # Remove all existing manifest files from previous processes
                self._remove_all_manifest_files()

                # Start the watchdog if it's not alive, prevents redundant starts
                if not self.observer.is_alive():
                    self.observer.start()

                # Fetch all component catalog instances and trigger their add to the
                # component cache if this is not already happening (it seems some server
                # test fixtures could be loading the server extensions multiple times).
                if not self.cache_manager.is_refreshing():
                    self.refresh()

    def refresh(self):
        """Triggers a refresh of all catalogs in the component cache.

        Raises RefreshInProgressError if a complete refresh is in progress.
        Note that we do not preclude non-server processes from performing a
        complete refresh.  In such cases, each of the catalog entries will be
        written to the manifest, which will be placed into the update queue.
        As a result, non-server applications could by-pass the "refresh in progress"
        constraint, but we're assuming a CLI application won't be as likely to
        "pound" refresh like a UI application can.
        """
        if self.is_server_process and self.cache_manager.is_refreshing():
            raise RefreshInProgressError()
        catalogs = MetadataManager(schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID).get_all()
        for catalog in catalogs:
            self._insert_request(self.refresh_queue, catalog, "modify")

    def update(self, catalog: Metadata, action: str):
        """
        Triggers an update of the component cache for the given catalog name.  If this is a non-server
        process, the entry is written to the manifest file where it will be "processed" by the watchdog
        and inserted into the component cache queue, otherwise we update the cache queue directly.
        """
        self._insert_request(self.update_queue, catalog, action)

    def _insert_request(self, queue: Queue, catalog: ComponentCatalogMetadata, action: str):
        """
        If running as a server process, the request is submitted to the desired queue, otherwise
        it is posted to the manifest where the server process (if running) can detect the manifest
        file update and send the request to the update queue.

        Note that any calls to ComponentCache.refresh() from non-server processes will still
        perform the refresh, but via the update queue rather than the refresh queue.  We could,
        instead, raise NotImplementedError in such cases, but we may want the ability to refresh
        the entire component cache from a CLI utility and the current implementation would allow that.
        """
        # Ensure referenced runtime is available
        if not PipelineProcessorRegistry.instance().is_valid_runtime_type(catalog.runtime_type.name):
            return

        if self.is_server_process:
            queue.put((catalog, action))
        else:
            manifest: Dict[str, str] = self._load_manifest()
            manifest[catalog.name] = action
            self.update_manifest(manifest=manifest)

    def _remove_all_manifest_files(self):
        """
        Remove all existing manifest files in the Jupyter runtimes directory.
        """
        manifest_files = Path(self.manifest_dir).glob("**/elyra-component-manifest-*.json")
        for file in manifest_files:
            os.remove(str(file))

    def _load_manifest(self, filename: Optional[str] = None) -> Dict[str, str]:
        """Read and return the contents of a manifest file.

        If 'filename' is not provided, this process's manifest file will be read.
        """
        filename = filename or self.manifest_filename
        if not os.path.isfile(filename):
            self.log.debug(f"Manifest file '{filename}' doesn't exist and will be created.")
            return {}
        with open(filename, "r") as f:
            manifest: Dict[str, str] = json.load(f)
        self.log.debug(f"Reading manifest '{manifest}' from file '{filename}'")
        return manifest

    def update_manifest(self, filename: Optional[str] = None, manifest: Optional[Dict[str, str]] = None) -> None:
        """Update the manifest file with the given entry."""
        filename = filename or self.manifest_filename
        manifest = manifest or {}
        self.log.debug(f"Updating manifest '{manifest}' to file '{filename}'")
        with open(filename, "w") as f:
            json.dump(manifest, f, indent=2)

    def wait_for_all_cache_tasks(self):
        """
        Block execution and wait for all tasks in the cache task update queue to complete.
        Primarily used for testing.
        """
        if self.is_server_process:
            self.update_queue.join()
            self.refresh_queue.join()

    def get_all_components(self, platform: RuntimeProcessorType) -> List[Component]:
        """
        Retrieve all components from component catalog cache
        """
        components: List[Component] = []

        catalogs = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_properties in catalogs.items():
            components.extend(list(catalog_properties.get("components", {}).values()))

        if not components and platform != RuntimeProcessorType.LOCAL:
            self.log.error(f"No components could be found in any catalog for platform type '{platform.name}'.")

        return components

    def get_component(self, platform: RuntimeProcessorType, component_id: str) -> Optional[Component]:
        """
        Retrieve the component with a given component_id from component catalog cache
        """
        component: Optional[Component] = None

        catalogs = self._component_cache.get(platform.name, {})
        for catalog_name, catalog_properties in catalogs.items():
            component = catalog_properties.get("components", {}).get(component_id)
            if component:
                break

        if not component:
            self.log.error(f"Component with ID '{component_id}' could not be found in any catalog.")

        return component

    def _load_catalog_reader_class(
        self, catalog: ComponentCatalogMetadata, file_types: List[str]
    ) -> Optional[ComponentCatalogConnector]:
        """
        Load the appropriate entrypoint class based on the schema name indicated in
        the ComponentCatalogMetadata instance and the file types associated with the component
        parser in use
        """
        try:
            catalog_reader = entrypoints.get_group_named("elyra.component.catalog_types").get(catalog.schema_name)
            if not catalog_reader:
                self.log.error(
                    f"No entrypoint with name '{catalog.schema_name}' was found in group "
                    f"'elyra.component.catalog_types' to match the 'schema_name' given in catalog "
                    f"'{catalog.display_name}'. Skipping..."
                )
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

        # Ensure referenced runtime is available
        if not PipelineProcessorRegistry.instance().is_valid_runtime_type(catalog.runtime_type.name):
            return components

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
            try:
                parsed_components = parser.parse(catalog_entry) or []
            except Exception as e:
                self.log.warning(
                    f"Could not parse definition for component with identifying information: "
                    f"'{catalog_entry.entry_reference}' -> {str(e)}"
                )
            else:
                for component in parsed_components:
                    components[component.id] = component

        return components

    @staticmethod
    def get_generic_components() -> List[Component]:
        return list(ComponentCache._generic_components.values())

    @staticmethod
    def get_generic_component(component_id: str) -> Optional[Component]:
        return ComponentCache._generic_components.get(component_id)

    @staticmethod
    def get_generic_component_from_op(component_op: str) -> Optional[Component]:
        for component in ComponentCache.get_generic_components():
            if component.op == component_op:
                return component
        return None

    @staticmethod
    def get_generic_component_ops() -> List[str]:
        return [component.op for component in ComponentCache.get_generic_components()]

    @staticmethod
    def load_jinja_template(template_name: str) -> Template:
        """
        Loads the jinja template of the given name from the
        elyra/templates/components folder
        """
        loader = PackageLoader("elyra", "templates/components")
        template_env = Environment(loader=loader)
        template_env.policies["json.dumps_kwargs"] = {"sort_keys": False}  # prevent automatic key sort on 'tojson'

        return template_env.get_template(template_name)

    @staticmethod
    def to_canvas_palette(components: List[Component]) -> Dict:
        """
        Converts catalog components into appropriate canvas palette format
        """
        template = ComponentCache.load_jinja_template("canvas_palette_template.jinja2")

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
        Converts catalog components into appropriate canvas properties format.

        If component_id is one of the generic set, generic template is rendered,
        otherwise, the  runtime-specific property template is rendered.
        """
        if ComponentCache.get_generic_component(component.id) is not None:
            template = ComponentCache.load_jinja_template("generic_properties_template.jinja2")
        else:
            template = ComponentCache.load_jinja_template("canvas_properties_template.jinja2")

        template_vars = {
            "elyra_owned_properties": component.get_elyra_properties(),
            "render_property_details": ComponentProperty.render_property_details,
        }
        template.globals.update(template_vars)
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

    def on_modified(self, event):
        """Fires when the component manifest file is modified."""
        self.log.debug(f"ManifestFileChangeHandler: file '{event.src_path}' has been modified.")
        manifest = self.component_cache._load_manifest(filename=event.src_path)
        if manifest:  # only update the manifest if there is work to do
            for catalog, action in manifest.items():
                self.log.debug(f"ManifestFileChangeHandler: inserting ({catalog},{action}) into update queue...")
                if action == "delete":
                    # The metadata instance has already been deleted, so we must
                    # fabricate an instance that only consists of a catalog name
                    catalog_instance = ComponentCatalogMetadata(name=catalog)

                else:  # cache_action == 'modify':
                    # Fetch the catalog instance associated with this action
                    catalog_instance = MetadataManager(
                        schemaspace=ComponentCatalogs.COMPONENT_CATALOGS_SCHEMASPACE_ID
                    ).get(name=catalog)

                self.component_cache.update(catalog=catalog_instance, action=action)
            self.component_cache.update_manifest(filename=event.src_path)  # clear the manifest
