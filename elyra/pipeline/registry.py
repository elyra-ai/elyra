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
import asyncio
import entrypoints
import os
import glob

from abc import abstractmethod
from elyra.util.path import get_expanded_path
from traitlets.config import SingletonConfigurable, LoggingConfigurable, Unicode, Bool


class ComponentParser(SingletonConfigurable):
    _properties: dict() = {}

    def __init__(self):
        super().__init__()

    def parse_component(self, processor_type):
        raise NotImplementedError


class KfpComponentParser(ComponentParser):
    def __init__(self):
        super().__init__()


class AirflowComponentParser(ComponentParser):
    def __init__(self):
        super().__init__()


class ComponentRegistry(SingletonConfigurable):
    _components: dict = {}

    component_parsers = {
        'kfp': KfpComponentParser(),
        'airflow': AirflowComponentParser(),
        None: ComponentParser()
    }

    def __init__(self):
        super().__init__()
        self.parser = None

    @abstractmethod
    def get_all_components(self, processor_type):
        """ Builds a palette.json in the form of a dictionary of components. """
        # raise NotImplementedError()

        self.parser = self.component_parsers.get(processor_type)
        for component in list_of_components:
            self._components[component] = self.get_component(component)

    def get_component(self, component):
        raise NotImplementedError()
