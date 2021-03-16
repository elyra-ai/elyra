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

import asyncio
import json
import nbformat
import os
import re

from abc import ABC, abstractmethod
from jupyter_server.base.handlers import APIHandler
from tornado import web
from traitlets.config import SingletonConfigurable
from typing import Any, Type, TypeVar, List
from ..util.http import HttpErrorMixin


class OperationParserHandler(HttpErrorMixin, APIHandler):
    """Handler to expose REST API to parse envs from Jupyter Notebook"""

    @web.authenticated
    async def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    @web.authenticated
    async def post(self, *args, **kwargs):
        payload = self.get_json_body()

        self.log.debug("Parsing environmental variables from notebook: %s", payload['notebook_path'])
        self.log.debug("JSON payload: %s", json.dumps(payload, sort_keys=True, indent=2, separators=(',', ': ')))

        notebook_path = payload['notebook_path']

        response = await ParsingProcessorManager.operation_parser(notebook_path)
        json_msg = json.dumps({"env_list": response})

        self.set_status(200)
        self.set_header("Content-Type", 'application/json')
        self.finish(json_msg)
        self.flush()


class ParsingProcessorManager(SingletonConfigurable):

    async def operation_parser(self, notebook_path):
        res = await asyncio.get_event_loop().run_in_executor(
            None, self.parse_operation_envs, notebook_path)
        return res

    @staticmethod
    def parse_operation_envs(operation_filepath: str) -> List:
        """
        Given the path to a Jupyter Notebook, will return a list of parsed environmental variables
        found in the cells of the notebook
        :param operation_filepath: absolute path to a python file to be parsed
        :return: a list of environmental variables
        """
        operation = OperationParser.get_instance(filepath=operation_filepath)
        env_list = operation.env_list()

        return env_list

# Setup forward reference for type hint on return from class factory method.  See
# https://stackoverflow.com/questions/39205527/can-you-annotate-return-type-when-value-is-instance-of-cls/39205612#39205612
F = TypeVar('F', bound='OperationParser')


class OperationParser(ABC):

    @classmethod
    def get_instance(cls: Type[F], **kwargs: Any) -> F:
        """Creates an appropriate subclass instance based on the extension of the filepath"""
        filepath = kwargs['filepath']
        if '.ipynb' in filepath:
            notebook = json.loads(open(filepath).read())
            language = notebook['metadata']['kernelspec']['language']
            if language == 'python':
                return PythonOperationParser(filepath)
            elif language == 'r':
                pass
                # return ROperatorParser(filepath)
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
    def operation_filepath(self):
        # TODO : Ensure this is getting the abs path
        return self._operation_filepath

    @property
    @abstractmethod
    def env_list(self):
        raise NotImplementedError()


class PythonOperationParser(OperationParser):

    _type = "python"

    def __init__(self, operation_filepath):
        super().__init__(operation_filepath)

    def type(self):
        return self._type

    def env_list(self) -> List:
        list_of_envs = []
        filename, file_extension = os.path.splitext(self.operation_filepath)

        if file_extension == ".py":
            file_by_line = open(self.operation_filepath).readlines()
            self.add_env_list(list_of_envs, file_by_line)
        elif file_extension == ".ipynb":
            notebook = nbformat.read(open(self.operation_filepath), as_version=4)
            for cell in notebook.cells:
                if cell.source:
                    file_by_line = cell.source.split('\n')
                    self.add_env_list(list_of_envs, file_by_line)

        return list_of_envs

    def regex_patterns(self) -> List:
        # Matches os.environ
        pattern_list = [r"os\.environ\[[\"']([a-zA-Z_]+[A-Za-z0-9_]*)[\"']\]\s+=\s+[\"'](.*)[\"']"]
        # Matches os.getenv
        # TODO

        return pattern_list

    def add_env_list(self, list_of_envs, file_by_line):
        for line in file_by_line:
            for pattern in self.regex_patterns():
                match_found = re.search(pattern, line)
                if match_found and match_found.group(1) not in list_of_envs:
                    list_of_envs.append(match_found.group(1))
