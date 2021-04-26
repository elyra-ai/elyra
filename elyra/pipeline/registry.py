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
from typing import Any, Type, TypeVar


F = TypeVar('F', bound='ComponentParser')


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
        self._parser = None

    def parse_component(self, component):
        raise NotImplementedError


class KfpComponentParser(ComponentParser):
    def __init__(self):
        super().__init__()


class AirflowComponentParser(ComponentParser):
    def __init__(self):
        super().__init__()


class ComponentRegistry(SingletonConfigurable):
    _components: dict = {}

    def __init__(self):
        super().__init__()
        self.parser = None

    @abstractmethod
    def get_all_components(self, processor_type):
        """ Builds a palette.json in the form of a dictionary of components. """
        # raise NotImplementedError()

        self.parser = ComponentParser.get_instance(processor=processor_type)
        for component in list_of_components:
            self._components[component] = self.get_component(component)

    def get_component(self, component):
        raise NotImplementedError()
