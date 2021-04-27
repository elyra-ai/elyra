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
'''
import asyncio
import entrypoints
import glob
'''
import os
import io
import json
import yaml

from abc import abstractmethod
# from elyra.util.path import get_expanded_path
from traitlets.config import SingletonConfigurable  # , LoggingConfigurable, Unicode, Bool
from typing import Any, Type, TypeVar


F = TypeVar('F', bound='ComponentParser')
R = TypeVar('R', bound='ComponentRegistry')


class ComponentParser(SingletonConfigurable):
    _properties: dict() = {}

    @classmethod
    def get_instance(cls: Type[F], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the processor type"""

        processor = kwargs['processor']

        if processor == 'kfp':
            return KfpComponentParser()
        elif processor == 'airflow':
            return AirflowComponentParser()
        elif processor == 'local':
            return ComponentParser()
        else:
            raise ValueError(f"Unsupported processor type: {processor}")

    def __init__(self):
        super().__init__()

    def get_common_components(self):
        common_component_dir = os.path.join(os.path.dirname(__file__), 'resources')
        common_component_file = os.path.join(common_component_dir, "palette.json")
        with io.open(common_component_file, 'r', encoding='utf-8') as f:
            common_component_json = json.load(f)
        return common_component_json

    def parse_component_details(self, component):
        """Get component name, id, description for palette JSON"""
        pass

    def parse_component_properties(self, component):
        """Get component properties for properties JSON"""
        raise NotImplementedError


class KfpComponentParser(ComponentParser):
    _type = "kfp"

    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_filename):
        component_id = ""
        palette_json = {}

        with open(component_filename, 'r') as f:
            try:
                yaml_obj = yaml.safe_load(f)
                component_id = ' '.join(yaml_obj['name'].lower().replace('-', '').split()).replace(' ', '-')

                palette_json['name'] = yaml_obj['name']
                palette_json['description'] = yaml_obj['description'].strip()
            except yaml.YAMLError as e:
                raise RuntimeError from e

        return component_id, palette_json

    def parse_component_properties(self, component):
        component_id = ""
        properties_json = {}

        with open(component + ".yaml", 'r') as f:
            try:
                yaml_obj = yaml.safe_load(f)
                component_id = ' '.join(yaml_obj['name'].lower().replace('-', '').split()).replace(' ', '-')

                # Add additional properties to properties_json
            except yaml.YAMLError as e:
                raise RuntimeError from e

        return component_id, properties_json


class AirflowComponentParser(ComponentParser):
    def __init__(self):
        super().__init__()

    def parse_component_details(self, component_filename):
        return None, {}

    def parse_component_properties(self, component):
        return None, {}


class ComponentRegistry(SingletonConfigurable):

    @classmethod
    def get_instance(cls: Type[R], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the registry type"""

        registry_type = kwargs["registry_type"]
        processor_type = kwargs["processor_type"]

        if registry_type == 'file':
            return FilesystemComponentRegistry(processor_type)
        elif registry_type == 'url':
            return UrlComponentRegistry(processor_type)
        else:
            raise ValueError(f"Unsupported registry type: {registry_type}")

    def __init__(self, processor_type):
        super().__init__()
        self._components: dict = {}
        self.parser = ComponentParser.get_instance(processor=processor_type)

    @abstractmethod
    def get_all_components(self):
        """Builds a palette.json in the form of a dictionary of components."""

        # First get the components common to all runtimes
        # TODO: decide on normalized format between these common components and the 'new' ones
        self._components['common'] = self.parser.get_common_components()

        # Loop through all the component definitions for the given registry
        for component in self._list_all_components():
            component_id, component_details = self.parser.parse_component_details(component)
            if component_id is None:
                continue
            self._components[component_id] = component_details

        return self._components

    def _list_all_components(self):
        """
        Returns a list of names of components. Implementation will depend on where the components
        are accessed from. Local implementations should return none. Parser attribute can determine
        things like the filepath/directory name of where to look for the files with the names or
        the URL from where to grab names. May want to move to the parser class instead.
        """
        return []

    def add_component(self, processor_type, component_json):
        pass

    def component_exists(self, processor_type, component):
        pass


class FilesystemComponentRegistry(ComponentRegistry):
    _dir_path: str

    def __init__(self, processor_type):
        super().__init__(processor_type)

    def _list_all_components(self):
        # Relative to jupyter work_dir right now
        return ["examples/example1.yaml", "examples/example2.yaml"]

    def add_component(self, processor_type, component_json):
        pass

    def component_exists(self, processor_type, component):
        pass


class UrlComponentRegistry(ComponentRegistry):
    _url_path: str

    def __init__(self, processor_type):
        super().__init__(processor_type)
