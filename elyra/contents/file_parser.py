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
from typing import Any, Type, TypeVar, List, Dict
from traitlets import log


# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
F = TypeVar('F', bound='FileParser')


class FileParser(ABC):
    _operation_parser_registry: Dict

    @classmethod
    def get_instance(cls: Type[F], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the extension of the filepath"""
        filepath = kwargs['filepath']

        if '.ipynb' in filepath:
            return NotebookFileParser(filepath)
        elif '.py' in filepath:
            return PythonFileParser(filepath)
        elif '.r' in filepath:
            pass
            # return ROperatorParser(filepath)
        else:
            raise ValueError('Unsupported file type: {}'.format(filepath))

    _type = None

    def __init__(self, operation_filepath):
        self._operation_filepath = operation_filepath
        self._model = None

        self.log = log.get_logger()

    @property
    @abstractmethod
    def type(self):
        pass

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

    @abstractmethod
    def file_as_code_chunks(self) -> List[str]:
        # A list of code `chunks` to look through. The size and length of the `chunks` is determined
        # usually by the language. For now the concrete implementations below is by line-by-line in file
        pass

    def get_environment_variables(self):
        pass

    def build_model(self):
        """
        Builds a model dictionary of all the regex matches it for each key in the regex dictionary
        :return:
        """
        model = dict()
        # model['env_list'] = get_environment_variables()

        self.log.info("Log some stuff")

        for chunk in self.file_as_code_chunks():
            for key in self.search_expressions.keys():
                regex_list = self.search_expressions[key]
                for pattern in regex_list:
                    match_found = re.search(pattern, chunk)
                    if match_found and match_found.group(1) not in model[key]:
                        model[key].append(match_found.group(1))

        return model


class NotebookFileParser(FileParser):

    _type = "notebook"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)
        self.notebook = nbformat.read(open(self.operation_filepath), as_version=4)
        self.language = self.notebook['metadata']['kernelspec']['language']

    def type(self):
        return self._type

    def file_as_code_chunks(self) -> List[str]:
        file_by_line = []
        for cell in self.notebook.cells:
            if cell.source:
                file_by_line.append(cell.source.split('\n'))
        return file_by_line

    def search_expressions(self) -> Dict[str, List]:
        if self.language == 'python':
            return PythonFileParser(self.operation_filepath).search_expressions()
        elif self.language == 'r':
            pass
            # return ROperationParser.regex_dict()


class PythonFileParser(FileParser):

    _type = "python"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)
        self.python_file = open(self.operation_filepath)

    def type(self):
        return self._type

    def file_as_code_chunks(self) -> List[str]:
        file_by_line = self.python_file.readlines()
        return file_by_line

    def search_expressions(self) -> Dict[str, List]:
        regex_dict = dict()
        # Parsing for ENVs e.g. regex_dict['JSON_STANZA'] = ['REGEX_EXP_1', 'REGEX_EXP_2']
        regex_dict['env_list'] = [r"os\.environ\[[\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\]\s+=\s+[\"'](.*)[\"']"]

        return regex_dict
