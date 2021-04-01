#
# Copyright 2018-2021 Elyra Authors
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

import os
import nbformat
import re

from abc import ABC, abstractmethod

from typing import Any, Type, TypeVar, List, Dict
from traitlets import log
from ..util import get_expanded_path, get_absolute_path

# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
F = TypeVar('F', bound='FileParser')


class FileParser(ABC):

    @classmethod
    def get_instance(cls: Type[F], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the extension of the filepath"""
        filepath = kwargs['filepath']

        if '.ipynb' in filepath:
            return NotebookFileParser(filepath)
        elif '.py' in filepath:
            return PythonFileParser(filepath)
        elif '.r' in filepath:
            return RFileParser(filepath)
        else:
            raise ValueError('Unsupported file type: {}'.format(filepath))

    _type = None

    def __init__(self, operation_filepath):
        self._operation_filepath = operation_filepath
        self.parser = None

        # Consider removing or add log messages
        self.log = log.get_logger()

    @property
    @abstractmethod
    def type(self):
        pass

    @property
    def operation_filepath(self):
        # Retrieve the absolute path
        root_dir = get_expanded_path()
        abs_path = get_absolute_path(root_dir, self._operation_filepath)

        if not os.path.exists(abs_path):
            raise FileNotFoundError(f'Could not find {abs_path}')
        if not os.path.isfile(abs_path):
            raise ValueError(f'Not a file: {abs_path}')

        self._operation_filepath = abs_path
        return self._operation_filepath

    @abstractmethod
    def get_next_code_chunk(self) -> List[str]:
        # Implements a generator for lines of code for the specified operation type
        with open(self.operation_filepath) as f:
            for line in f:
                yield [line.strip()]

    def get_resources(self):
        # Returns a model dictionary of all the regex matches for each key in the regex dictionary
        model = dict()
        model["env_list"] = dict()
        model["inputs"] = dict()
        model["outputs"] = dict()

        for chunk in self.get_next_code_chunk():
            if chunk:
                for line in chunk:
                    if not self.parser:
                        raise RuntimeError(f'Could not find appropriate language parser for {self.operation_filepath}')
                    matches = self.parser.parse_environment_variables(line)
                    for key, match in matches:
                        model[key][match.group(1)] = match.group(2)

        return model


class NotebookFileParser(FileParser):

    _type = "notebook"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)

        with open(self.operation_filepath) as f:
            self.notebook = nbformat.read(f, as_version=4)
            language = self.notebook['metadata']['kernelspec']['language']

            if language == 'python':
                self.parser = PythonScriptParser()
            elif language == 'r':
                self.parser = RScriptParser()

    def type(self):
        return self._type

    def get_next_code_chunk(self) -> List[str]:
        for cell in self.notebook.cells:
            if cell.source and cell.cell_type == "code":
                yield cell.source.split('\n')


class PythonFileParser(FileParser):

    _type = "python"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)
        self.parser = PythonScriptParser()

    def type(self):
        return self._type

    def get_next_code_chunk(self) -> List[str]:
        return super().get_next_code_chunk()


class RFileParser(FileParser):

    _type = "r"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)
        self.parser = RScriptParser()

    def type(self):
        return self._type

    def get_next_code_chunk(self) -> List[str]:
        return super().get_next_code_chunk()


class ScriptParser():
    def parse_environment_variables(self, line):
        # Parse a line fed from file and match each regex in regex dictionary
        matches = []
        for key, value in self.search_expressions().items():
            for pattern in value:
                regex = re.compile(pattern)
                for match in regex.finditer(line):
                    matches.append((key, match))
        return matches


class PythonScriptParser(ScriptParser):
    def search_expressions(self) -> Dict[str, List]:
        # TODO: add more key:list-of-regex pairs to parse for additional resources
        regex_dict = dict()

        # First regex matches envvar assignments of form os.environ["name"] = value
        # Second regex matches envvar assignments that use os.getenv("name", "value") with default provided
        # Third regex matches envvar assignments that use os.environ.get("name", "value") with default provided
        # Both name and value are captured if possible
        envs = [r"os\.environ\[[\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\]\s*=(?:\s*[\"'](.[^\"']*)?[\"'])?",
                r"os\.getenv\([\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\s*\,(?:\s*[\"'](.[^\"']*)?[\"'])?",
                r"os\.environ\.get\([\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\s*\,(?:\s*[\"'](.[^\"']*)?[\"'])?"]
        regex_dict["env_list"] = envs
        return regex_dict


class RScriptParser(ScriptParser):
    def search_expressions(self) -> Dict[str, List]:
        # TODO: add more key:list-of-regex pairs to parse for additional resources
        regex_dict = dict()

        # Tests for matches of the form Sys.setenv("key" = "value")
        envs = [r"Sys.setenv\([\"']*([a-zA-Z_]+[A-Za-z0-9_]*)\s*=\s*[\"'](.[^\"']*)?[\"']"]
        regex_dict["env_list"] = envs
        return regex_dict
