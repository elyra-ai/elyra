#
# Copyright 2018-2022 Elyra Authors
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

import ast
from os.path import sep
from pathlib import Path
import re
import shutil
from tempfile import mkdtemp
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from urllib.parse import urlparse
import zipfile

import requests

from elyra.pipeline.catalog_connector import ComponentCatalogConnector


class AirflowProviderPackageCatalogConnector(ComponentCatalogConnector):
    """
    Read component definitions from an Apache Airflow provider package archive
    """

    REQUEST_TIMEOUT = 30

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:

        """
        Returns a list of component_metadata instances, one per component found in the given registry.
        The form that component_metadata takes is determined by requirements of the reader class.

        :param registry_metadata: the dictionary-form of the Metadata instance for a single registry
        """

        # Return data structure contains a list of operators that are defined
        # in the referenced Apache Airflow provider package wheel
        operator_key_list = []

        # Read the user-supplied 'airflow_provider_package_download_url', which is a required
        # input defined in the 'airflow-provider-package-catalog-catalog.json' schema file.
        # Example value: https://files.pythonhosted.org/packages/a3/57/443a4fb0a52dcfc93bcd410e5c661d5683a8a651914934e490613460713f/apache_airflow_providers_amazon-2.6.0-py3-none-any.whl # noqa: E501
        airflow_provider_package_download_url = catalog_metadata['airflow_provider_package_download_url']
        # extract the package name, e.g. 'apache_airflow_providers_amazon-2.6.0-py3-none-any.whl'
        airflow_provider_package_name = Path(urlparse(airflow_provider_package_download_url).path).name
        # extract the provider name, e.g. 'apache_airflow_providers_amazon'
        m = re.match('[^-]+', airflow_provider_package_name)
        if m:
            airflow_provider_name = m.group(0)
        else:
            airflow_provider_name = airflow_provider_package_name

        # tmp_archive_dir is used to store the downloaded archive and as working directory
        if hasattr(self, 'tmp_archive_dir'):
            # if the directory exists remove it in case the archive content has changed
            shutil.rmtree(self.tmp_archive_dir.name, ignore_errors=True)
        self.tmp_archive_dir = Path(mkdtemp())

        try:
            self.log.warning(f'Downloading provider package from \'{airflow_provider_package_download_url}\' ...')

            # download archive
            response = requests.get(airflow_provider_package_download_url,
                                    timeout=AirflowProviderPackageCatalogConnector.REQUEST_TIMEOUT,
                                    allow_redirects=True)

            if response.status_code != 200:
                # download failed. Log error and abort processing
                self.log.error(f'Download of archive \'{airflow_provider_package_download_url}\' '
                               'failed. HTTP response code: {response.status_code}')
                return operator_key_list

            # save downloaded archive
            archive = str(self.tmp_archive_dir / airflow_provider_package_name)
            self.log.warning(f'Saving downloaded archive in \'{archive}\' ...')
            with open(archive, 'wb') as archive_fh:
                archive_fh.write(response.content)

            # extract archive
            self.log.warning(f'Extracting Airflow provider archive \'{archive}\' ...')
            with zipfile.ZipFile(archive, 'r') as zip_ref:
                zip_ref.extractall(self.tmp_archive_dir)

            # Locate 'get_provider_info.py' in the extracted archive.
            # It identifies Python modules that contain operator class definitions.
            pl = list(self.tmp_archive_dir.glob('**/get_provider_info.py'))
            if len(pl) != 1:
                # No such file or more than one file was found. Cannot proceed.
                self.log.error(f'Error. Provider archive \'{archive}\' '
                               'contains {len(pl)} '
                               'file(s) named get_provider_info.py.')
                # return empty list
                return operator_key_list
            get_provider_info_file_location = pl[0]

            # extract module names from get_provider_info.py
            with open(get_provider_info_file_location, 'r') as gpi_file:
                f = gpi_file.read()
            namespace = {}
            exec(f, namespace)
            try:
                # try to run the 'get_provider_info' method
                return_dict = namespace['get_provider_info']()
            except KeyError:
                # no method with this name is defined in get_provider_info.py
                self.log.error('Error. Cannot invoke get_provider_info method '
                               f'in \'{get_provider_info_file_location}\'.')
                return operator_key_list

            python_scripts = []
            for operator_entry in return_dict.get('operators', []):
                for m in operator_entry['python-modules']:
                    python_scripts.append(f'{m.replace(".", sep)}.py')
            if len(python_scripts) == 0:
                self.log.info(f'Airflow provider package \'{airflow_provider_package_name}\' '
                              'does not include any operator definitions.')
                return operator_key_list

            #
            # Identify Python scripts that define classes that extend the
            # airflow.models.BaseOperator class
            #
            extends_baseoperator = []  # list of str, containing classes that extend BaseOperator
            classes_to_analyze = {}
            imported_operator_classes = []  # list of str, identifying imported operator classes
            script_count = 0  # used for stats collection
            class_count = 0   # used for stats collection
            operator_class_count = 0  # used for stats collection
            # process each Python script ...
            for script in python_scripts:
                script_count += 1
                self.log.warning(f'Parsing \'{script}\' ...')
                with open(self.tmp_archive_dir / script, 'r') as source_code:
                    # parse source code
                    tree = ast.parse(source_code.read())
                    # identify imports and class definitions
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            pass
                            # for name in node.names:
                            #    self.log.warning(f'Detected an IMPORT: {name.name}')
                        elif isinstance(node, ast.ImportFrom):
                            node_module = node.module
                            for name in node.names:
                                self.log.warning(f'Detected an IMPORT FROM: {node_module} -> {name.name}')
                                if 'airflow.models' == node_module and name.name == 'BaseOperator':
                                    imported_operator_classes.append(name.name)
                                else:
                                    # Look for package imports that match one of the following patters:
                                    # airflow.providers.*.operators.
                                    # airflow.operators.*
                                    patterns = [r'airflow\.providers\.[a-z_]+\.operators',
                                                r'airflow\.operators\.']
                                    for pattern in patterns:
                                        match = re.match(pattern, node_module)
                                        if match:
                                            imported_operator_classes.append(name.name)
                                            break
                        elif isinstance(node, ast.ClassDef):
                            # determine whether this class extends the BaseOperator class
                            class_count += 1
                            self.log.warning(f'Analyzing class \'{node.name}\' in {script} ...')
                            self.log.warning(f' Class {node.name} extends {[n.id for n in node.bases]}')
                            # determine whether class extends one of the imported operator classes
                            if len(node.bases) == 0:
                                # class does not extend other classes; it therefore does
                                # not extend the Airflow BaseOperator; proceed with next class
                                continue
                            for base in node.bases:
                                extends = False
                                if base.id in imported_operator_classes:
                                    # class extends Airflow BaseOperator
                                    operator_class_count += 1
                                    extends = True
                                    extends_baseoperator.append(node.name)
                                    operator_key_list.append(
                                        {'provider_package': airflow_provider_package_name,
                                         'provider': airflow_provider_name,
                                         'file': script,
                                         'class': node.name})
                                    break
                            if extends is False:
                                # need to further analyze whether this class
                                # extends Airflow BaseOperator
                                classes_to_analyze[node.name] = {
                                    'node': node,
                                    'file': script
                                }

            # Identify classes that extend BaseOperator by extending
            # classes that were identified as extending BaseOperator
            # Example:
            #  class MyBaseOperator(BaseOperator)
            #  class MyOperator(MyBaseOperator)
            analysis_complete = len(classes_to_analyze) == 0
            while analysis_complete is False:
                # assume that analysis is complete until proven otherwise
                analysis_complete = True
                for class_name in list(classes_to_analyze.keys()):
                    self.log.warning(f'Re-analyzing class \'{class_name}\' in '
                                     f"'{classes_to_analyze[class_name]['file']}\'... ")
                    for base in classes_to_analyze[class_name]['node'].bases:
                        if base.id in extends_baseoperator:
                            # this class extends BaseOperator
                            operator_class_count += 1
                            extends_baseoperator.append(class_name)
                            operator_key_list.append({
                                'provider_package': airflow_provider_package_name,
                                'provider': airflow_provider_name,
                                'file': classes_to_analyze[class_name]['file'],
                                'class': class_name})
                            # remove class from todo list
                            del classes_to_analyze[class_name]
                            # A new class was discovered that implements
                            # BaseOperator. Analysis needs to be repeated because
                            # OTHER classes might extend THIS class.
                            analysis_complete = False
                            break

            # Dump stats
            self.log.info(f'Analysis of \'{airflow_provider_package_download_url}\' completed. '
                          f'Located {operator_class_count} operator classes '
                          f'in {script_count} Python scripts.')
            # Dump results for debugging
            if len(classes_to_analyze) > 0:
                self.log.warning(f'{len(classes_to_analyze)} classes don\'t implement BaseOperator: '
                                 f'{list(classes_to_analyze.keys())}. Note that some of these '
                                 ' might be false negatives if they extend classes that are not '
                                 ' defined in the analyzed archive. ')
            self.log.warning(f'Operator key list: {operator_key_list}')

        except Exception as ex:
            self.log.error('Error retrieving operator list from Airflow provider package '
                           f'{airflow_provider_package_download_url}: {ex}')

        return operator_key_list

    def read_catalog_entry(self,
                           catalog_entry_data: Dict[str, Any],
                           catalog_metadata: Dict[str, Any]) -> Optional[str]:
        """
        Fetch the component that is identified by catalog_entry_data from
        the downloaded Apache Airflow provider package.

        :param catalog_entry_data: a dictionary that contains the information needed to read the content
                                   of the component definition
        :param catalog_metadata: the metadata associated with the catalog in which this catalog entry is
                                 stored; in addition to catalog_entry_data, catalog_metadata may also be
                                 needed to read the component definition for certain types of catalogs

        :returns: the content of the given catalog entry's definition in string form
        """

        operator_file_name = catalog_entry_data.get('file')

        if hasattr(self, 'tmp_archive_dir') is False:
            # Log error and return None
            self.log.error('Error. Cannot fetch operator definition. The '
                           ' downloaded Airflow provider package archive was not found.')
            return None

        # load operator source using the provided key
        operator_source = self.tmp_archive_dir / operator_file_name
        self.log.warning(f'Reading operator source \'{operator_source}\' ...')
        with open(operator_source, 'r') as source:
            return source.read()

        return None

    def get_hash_keys(self) -> List[Any]:
        """
        Instructs Elyra to use the specified keys to generate a unique
        hash value for item returned by get_catalog_entries

        :returns: a list of keys
      """
        # Example key values:
        # - provider: 'apache_airflow_providers_ssh'
        # - file: 'airflow/providers/ssh/operators/ssh.py'
        # - class: 'SSHOperator'
        return ['provider', 'file', 'class']
