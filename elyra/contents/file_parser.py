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
            pass
            # return ROperatorParser(filepath)
        else:
            raise ValueError('Unsupported file type: {}'.format(filepath))

    _type = None

    def __init__(self):
        # self._operation_filepath = operation_filepath
        # self._model = None

        self.log = log.get_logger()

    @property
    @abstractmethod
    def type(self):
        pass

    '''
    Removing below due to stateless implementation of FileParser class
    @property
    def model(self):
        if not self._model:
            self._model = self.build_model()
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
    def file_as_code_chunks(self) -> List[str]:
        # A list of code `chunks` to look through. The size and length of the `chunks` is determined
        # usually by the language. For now the concrete implementations below is by line-by-line in file
        pass

    @abstractmethod
    def get_next_code_chunk(self, filepath):
        # Implements a generator for lines of code for the specified operation type
        pass

    def get_environment_variables(self, filepath):
        pass
        '''
        model = dict()
        model['env_list'] = []
        for chunk in self.get_next_code_chunk():
            if chunk and type(chunk) is list:
                for line in chunk:
                    match_found = self.parser.parse_environment_variables(line)
                    if match_found:
                        model["env_list"].append(match_found)
            elif chunk:
                match_found = self.parser.parse_environment_variables(chunk)
                if match_found:
                    model["env_list"].append(match_found)
        return model
        '''

    def build_model(self, filepath):
        """
        Builds a model dictionary of all the regex matches it for each key in the regex dictionary
        :return:
        """
        model = dict()
        model['env_list'] = self.get_environment_variables(filepath)
        # model['inputs'] = get_file_dependencies()
        # model['outputs'] = get_file_outputs()

        return model


class NotebookFileParser(FileParser):

    _type = "notebook"

    def __init__(self):
        # super().__init__(operation_filepath)
        # self.language = None
        self.parser = None

    def type(self):
        return self._type

    def file_as_code_chunks(self) -> List[str]:
        code_chunks = []
        for cell in self.notebook.cells:
            if cell.source and cell.cell_type == "code":
                code_chunks.append(cell.source.split('\n'))
        return [item for subchunk in code_chunks for item in subchunk]

    def get_next_code_chunk(self, filepath):
        # with open(self.operation_filepath) as f:
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

    def get_environment_variables(self, filepath):
        key = "env_list"
        env_list = []
        for chunk in self.get_next_code_chunk(filepath):
            if chunk:
                for line in chunk:
                    match_found = self.parser.parse_environment_variables(key, line)
                    if match_found and match_found not in env_list:
                        env_list.append(match_found)
        return env_list


class PythonFileParser(FileParser):

    _type = "python"

    def __init__(self):
        # super().__init__(operation_filepath)
        self.parser = PythonScriptParser()

    def type(self):
        return self._type

    def file_as_code_chunks(self) -> List[str]:
        with open(self.operation_filepath) as f:
            code_chunks = f.readlines()
        return [c.strip() for c in code_chunks]

    def get_next_code_chunk(self, filepath):
        # with open(self.operation_filepath) as f:
        with open(filepath) as f:
            for line in f:
                yield line.strip()

    def get_environment_variables(self, filepath):
        key = "env_list"
        env_list = []
        for line in self.get_next_code_chunk(filepath):
            if line:
                match_found = self.parser.parse_environment_variables(key, line)
                if match_found and match_found not in env_list:
                    env_list.append(match_found)
        return env_list


class PythonScriptParser:
    def search_expressions(self, key) -> List:
        regex_dict = dict()
        # regex_dict[envs][0] matches envvar assignments of form os.environ["name"] = value
        # regex_dict[envs][1] matches envvar assignments that use os.getenv("name",) with default provided
        # regex_dict[envs][2] matches envvar assignments that use os.environ.get("name",) with default provided
        # Captures only the environment variable, not the value
        regex_dict["env_list"] = [r"os\.environ\[[\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\]\s*=",
                                  r"os\.getenv\([\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\s*\,",
                                  r"os\.environ\.get\([\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\s*\,"]
        return regex_dict[key]

    def parse_environment_variables(self, key, code_chunk):
        for pattern in self.search_expressions(key):
            # for pattern in value:
            # for chunk in code_chunks:
            match_found = re.search(pattern, code_chunk)
            if match_found:
                return match_found.group(1)
        return None


class RScriptParser:
    def search_expressions(self, key) -> List:
        pass

    def parse_environment_variables(self, code_chunk):
        pass
