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

# import json
import nbformat
import re

from abc import ABC, abstractmethod

from typing import Any, Type, TypeVar, List
from traitlets import log

# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
F = TypeVar('F', bound='FileParser')


class FileParser(ABC):

    @classmethod
    def get_instance(cls: Type[F], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the extension of the filepath"""
        filepath = kwargs['filepath']
        if '.ipynb' in filepath:
            return NotebookFileParser()
        elif '.py' in filepath:
            return PythonFileParser()
        elif '.r' in filepath:
            return RFileParser()
        else:
            raise ValueError('Unsupported file type: {}'.format(filepath))

    _type = None

    def __init__(self):
        # self._operation_filepath = operation_filepath
        # self._model = None

        self.parser = None
        self.log = log.get_logger()

    @property
    @abstractmethod
    def type(self):
        pass

    '''
    Removing below to keep FileParser stateless
    @property
    def model(self):
        if not self._model:
            self._model = self.get_resources()
        return self._model

    @property
    def operation_filepath(self):
        # TODO : Ensure this is getting the abs path
        return self._operation_filepath

    @property
    @abstractmethod
    def search_expressions(self) -> Dict[str, List]:
        # a dictionary of matching regex expressions to use keyed to the json stanza
        # Parsing for ENVs e.g. search_expressions['NAME_OF_JSON_STANZA'] = ['REGEX_EXP_1', 'REGEX_EXP_2']
        pass
    '''

    @abstractmethod
    def file_as_list_of_code_chunks(self) -> List[str]:
        # A list of code `chunks` to look through. The size and length of the `chunks` is determined
        # usually by the language. For now the concrete implementations below is by line-by-line in file
        pass

    @abstractmethod
    def get_next_code_chunk(self, filepath):
        # Implements a generator for lines of code for the specified operation type
        pass

    @abstractmethod
    def get_resources(self, filepath):
        # Returns a model dictionary of all the regex matches for each key in the regex dictionary
        pass


class NotebookFileParser(FileParser):

    _type = "notebook"

    def __init__(self):
        # super().__init__(operation_filepath)
        # self.language = None
        self.parser = None

    def type(self):
        return self._type

    def file_as_list_of_code_chunks(self, filepath) -> List[str]:
        code_chunks = []
        with open(filepath) as f:
            self.notebook = nbformat.read(f, as_version=4)
            language = self.notebook['metadata']['kernelspec']['language']

            if language == 'python':
                self.parser = PythonScriptParser()
            elif language == 'r':
                self.parser = RScriptParser()

            for cell in self.notebook.cells:
                if cell.source and cell.cell_type == "code":
                    code_chunks.append(cell.source.split('\n'))
        return [item for subchunk in code_chunks for item in subchunk]

    def get_next_code_chunk(self, filepath):
        with open(filepath) as f:
            self.notebook = nbformat.read(f, as_version=4)
            language = self.notebook['metadata']['kernelspec']['language']

            if language == 'python':
                self.parser = PythonScriptParser()
            elif language == 'r':
                self.parser = RScriptParser()

            for cell in self.notebook.cells:
                if cell.source and cell.cell_type == "code":
                    yield cell.source.split('\n')

    def get_resources(self, filepath):
        model = dict()
        model["env_list"] = dict()
        model["inputs"] = dict()
        model["outputs"] = dict()

        for chunk in self.get_next_code_chunk(filepath):
            if chunk:
                # Notebook cells must be further split into individual lines
                for line in chunk:
                    matches = self.parser.parse_environment_variables(line)
                    for key, match in matches:
                        model[key][match.group(1)] = match.group(2)

        return model


class PythonFileParser(FileParser):

    _type = "python"

    '''
    def __init__(self):
        # super().__init__(operation_filepath)
    '''

    def type(self):
        return self._type

    def file_as_list_of_code_chunks(self, filepath) -> List[str]:
        with open(filepath) as f:
            code_chunks = f.readlines()
        return [c.strip() for c in code_chunks]

    def get_next_code_chunk(self, filepath):
        with open(filepath) as f:
            for line in f:
                yield line.strip()

    def get_resources(self, filepath):
        model = dict()
        model["env_list"] = dict()
        model["inputs"] = dict()
        model["outputs"] = dict()

        for line in self.get_next_code_chunk(filepath):
            if line:
                matches = PythonScriptParser().parse_environment_variables(line)
                for key, match in matches:
                    model[key][match.group(1)] = match.group(2)

        return model


class RFileParser(FileParser):

    _type = "r"

    '''
    def __init__(self):
        # super().__init__(operation_filepath)
    '''

    def type(self):
        return self._type

    def file_as_list_of_code_chunks(self, filepath) -> List[str]:
        with open(filepath) as f:
            code_chunks = f.readlines()
        return [c.strip() for c in code_chunks]

    def get_next_code_chunk(self, filepath):
        with open(filepath) as f:
            for line in f:
                yield line.strip()

    def get_resources(self, filepath):
        model = dict()
        model["env_list"] = dict()
        model["inputs"] = dict()
        model["outputs"] = dict()

        for line in self.get_next_code_chunk(filepath):
            if line:
                matches = RScriptParser().parse_environment_variables(line)
                for key, match in matches:
                    model[key][match.group(1)] = match.group(2)

        return model


class PythonScriptParser:
    def search_expressions(self) -> List:
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

    def parse_environment_variables(self, line):
        # Currently the same implementation as for R files, but keeping separate in case change of approach needed

        # Parse a line fed from Python file and match each regex in regex dictionary
        matches = []
        for key, value in self.search_expressions().items():
            for pattern in value:
                regex = re.compile(pattern)
                for match in regex.finditer(line):
                    matches.append((key, match))
        return matches


class RScriptParser:
    def search_expressions(self) -> List:
        # TODO: add more key:list-of-regex pairs to parse for additional resources
        regex_dict = dict()

        # Tests for matches of the form Sys.setenv("key" = "value")
        envs = [r"Sys.setenv\([\"']*([a-zA-Z_]+[A-Za-z0-9_]*)\s*=\s*[\"'](.[^\"']*)?[\"']"]
        regex_dict["env_list"] = envs
        return regex_dict

    def parse_environment_variables(self, line):
        # Currently the same implementation as for Python files, but keeping separate in case change of approach needed

        # Parse a line fed from R file and match each regex in regex dictionary
        matches = []
        for key, value in self.search_expressions().items():
            for pattern in value:
                regex = re.compile(pattern)
                for match in regex.finditer(line):
                    matches.append((key, match))
        return matches
