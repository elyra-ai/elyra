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

import json
import nbformat
import re

from abc import ABC, abstractmethod
from jupyter_server.base.handlers import APIHandler
from tornado import web
from typing import Any, Type, TypeVar, List, Dict
from ..util.http import HttpErrorMixin


class OperationParserHandler(HttpErrorMixin, APIHandler):
    """Handler to expose REST API to parse envs from a File"""

    @web.authenticated
    async def post(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    @web.authenticated
    async def get(self, path=''):
        path = path or ''

        # TODO: Query and verify file type
        # type = self.get_query_argument('type', default=None)
        # if type not in {None, 'file', 'notebook'}:
        #     raise web.HTTPError(400, u'Type %r is invalid' % type)

        self.log.debug("Parsing file: %s", path)

        model = await self.operation_parser(path)

        self.set_status(200)
        # TODO: Validation of model
        self._finish_model(model)

    async def operation_parser(self, operation_filepath):
        """
        Given the path to a File, will return a dictionary model
        :param operation_filepath: absolute path to a File to be parsed
        :return: a model dict
        """
        operation = OperationParser.get_instance(filepath=operation_filepath)
        model = operation.model

        return model

    def _finish_model(self, model):
        """Finish a JSON request with a model, setting relevant headers, etc."""
        self.set_header('Last-Modified', model['last_modified'])
        self.set_header('Content-Type', 'application/json')
        self.finish(json.dumps(model))


# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
F = TypeVar('F', bound='OperationParser')


class OperationParser(ABC):

    @classmethod
    def get_instance(cls: Type[F], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the extension of the filepath"""
        filepath = kwargs['filepath']
        if '.ipynb' in filepath:
            return NotebookOperationParser(filepath)
        elif '.py' in filepath:
            return PythonOperationParser(filepath)
        elif '.r' in filepath:
            pass
            # return ROperatorParser(filepath)
        else:
            raise ValueError('Unsupported file type: {}'.format(filepath))

    _type = None

    def __init__(self, operation_filepath):
        self._operation_filepath = operation_filepath

    @property
    def type(self):
        raise NotImplementedError()

    @property
    def model(self):
        return self.build_model()

    @property
    def operation_filepath(self):
        # TODO : Ensure this is getting the abs path
        return self._operation_filepath

    @property
    @abstractmethod
    def regex_dict(self) -> Dict[str, List]:
        # a dictionary of matching regex expressions to use keyed to the json stanza
        # Parsing for ENVs e.g. regex_dict['NAME_OF_JSON_STANZA'] = ['REGEX_EXP_1', 'REGEX_EXP_2']
        raise NotImplementedError()

    @abstractmethod
    def file_as_code_chunks(self) -> List[str]:
        # A list of code `chunks` to look through. The size and length of the `chunks` is determined
        # usually by the language. For now the concrete implementations below is by line-by-line in file
        raise NotImplementedError()

    def build_model(self):
        """
        Builds a model dictionary of all the regex matches it for each key in the regex dictionary
        :return:
        """
        model = dict()
        for chunk in self.file_as_code_chunks():
            for key in self.regex_dict.keys():
                regex_list = self.regex_dict[key]
                for pattern in regex_list:
                    match_found = re.search(pattern, chunk)
                    if match_found and match_found.group(1) not in model[key]:
                        model[key].append(match_found.group(1))

        return model


class NotebookOperationParser(OperationParser):

    _type = "notebook"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)
        self.notebook = nbformat.read(open(self.operation_filepath), as_version=4)
        self.language = self.notebook['metadata']['kernelspec']['language']

    def type(self):
        return self._type

    def file_as_code_chunks(self) -> List[str]:
        for cell in self.notebook.cells:
            if cell.source:
                file_by_line = cell.source.split('\n')
                return file_by_line

    def regex_dict(self) -> Dict[str, List]:
        if self.language == 'python':
            return PythonOperationParser(self.operation_filepath).regex_dict()
        elif self.language == 'r':
            pass
            # return ROperationParser.regex_dict()


class PythonOperationParser(OperationParser):

    _type = "python"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)
        self.python_file = open(self.operation_filepath)

    def type(self):
        return self._type

    def file_as_code_chunks(self) -> List[str]:
        file_by_line = self.python_file.readlines()
        return file_by_line

    def regex_dict(self) -> Dict[str, List]:
        regex_dict = dict()
        # Parsing for ENVs e.g. regex_dict['JSON_STANZA'] = ['REGEX_EXP_1', 'REGEX_EXP_2']
        regex_dict['env_list'] = [r"os\.environ\[[\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\]\s+=\s+[\"'](.*)[\"']"]

        return regex_dict
