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
import os
import yaml
import urllib

from traitlets.config import SingletonConfigurable, LoggingConfigurable

from elyra.pipeline.component import ComponentParser


class ComponentReader(SingletonConfigurable):
    _type = 'local'

    def get_component_body(self, component_path, parser_type):
        raise NotImplementedError()


class FilesystemComponentReader(ComponentReader):
    _type = 'filename'
    _dir_path: str = ''

    def get_component_body(self, component_path, parser_type):
        component_file = os.path.join(os.path.dirname(__file__), component_path)
        component_extension = os.path.splitext(component_path)[-1]

        with open(component_file, 'r') as f:
            if parser_type == "kfp":
                assert component_extension == '.yaml'
                try:
                    return yaml.safe_load(f)
                except yaml.YAMLError as e:
                    raise RuntimeError from e
            elif parser_type == "airflow":
                assert component_extension == '.py'
                # TODO: Is there a better way to read in files? Can we assume operator files are always
                # small enough to be read into memory? Reading and yielding by line likely won't
                # work because multiple lines need to be checked at once (or multiple times).
                return f.readlines()
            else:
                raise ValueError(f'File type {component_extension} is not supported.')


class UrlComponentReader(ComponentReader):
    _type = 'url'
    _url_path: str

    def get_component_body(self, component_path, parser_type):
        parsed_path = urllib.parse.urlparse(component_path).path

        component_extension = os.path.splitext(parsed_path)[-1]
        component_body = urllib.request.urlopen(component_path)

        if parser_type == "kfp":
            assert component_extension == ".yaml"
            try:
                return yaml.safe_load(component_body)
            except yaml.YAMLError as e:
                raise RuntimeError from e
        elif parser_type == "airflow":
            assert component_extension == ".py"
            return component_body.readlines()
        else:
            raise ValueError(f'File type {component_extension} is not supported.')


class ComponentRegistry(LoggingConfigurable):
    readers = {
        FilesystemComponentReader._type: FilesystemComponentReader(),
        UrlComponentReader._type: UrlComponentReader()
    }

    def __init__(self, component_catalog_location: str, parser: ComponentParser):
        super().__init__()
        self._component_catalog_location = component_catalog_location
        self._parser = parser
        self.log.info(f'Creating new registry using {component_catalog_location}')

    @property
    def catalog_location(self) -> str:
        return self._component_catalog_location

    def get_all_components(self, processor_type):
        """
        Builds a component palette in the form of a dictionary of components.
        """

        print(f'Retrieving components for {processor_type} using parser {self._parser._type}')
        # Get parser for this processor
        assert processor_type == self._parser._type

        # Get components common to all runtimes
        components = {}
        components['categories'] = list()

        # Loop through all the component definitions for the given registry type
        reader = None
        for component in self._parser.list_all_components():
            self.log.debug(f"Component registry found component {component['name']}")

            # Get appropriate reader in order to read component definition
            if reader is None or reader._type != list(component['path'].keys())[0]:
                reader = self._get_reader(component)

            component_body = reader.get_component_body(component['path'][reader._type], self._parser._type)

            # Parse the component definition in order to add to palette
            component_json = self._parser.parse_component_details(component_body, component['name'])
            if component_json is None:
                continue
            components['categories'].append(component_json)

        return components

    def get_properties(self, processor_type, component_id):
        """
        Return the properties JSON for a given component.
        """

        # Find component with given id in component catalog
        component = self._parser.return_component_if_exists(component_id)
        if component is None:
            self.log.error(f"Component with ID '{component_id}' could not be found in the " +
                           f"{self._component_catalog_location} component catalog.")
            raise ValueError(f"Component with ID '{component_id}' could not be found in the " +
                             f"{self._component_catalog_location} component catalog.")

        # Get appropriate reader in order to read component definition
        reader = self._get_reader(component)

        component_path = component['path'][reader._type]
        if reader._type == "filename":
            component_path = os.path.join(os.path.dirname(__file__), component_path)

        component_body = reader.get_component_body(component_path, self._parser._type)
        properties = self._parser.parse_component_properties(component_body, component_path)
        properties['current_parameters']['component_source_type'] = reader._type

        return properties

    def add_component(self, processor_type, request_body):
        """
        Add a component based on the provided definition. Definition will be provided in POST body
        in the format {"name": "desired_name", path": {"file/url": "filepath/urlpath"}}.
        """

        parser = self._get_parser(processor_type)
        parser.add_component(request_body)  # Maybe make this async to prevent reading issues in get_all_components()

        components = self.get_all_components(parser._type)
        return components

    def _get_reader(self, component):
        """
        Find the proper reader based on the given registry component.
        """
        try:
            component_type = list(component['path'].keys())[0]
            return self.readers.get(component_type)
        except Exception:
            raise ValueError("Unsupported registry type.")
