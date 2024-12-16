#
# Copyright 2018-2025 Elyra Authors
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
import os
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

from requests import session
from requests.auth import HTTPBasicAuth

from elyra.pipeline.catalog_connector import AirflowEntryData
from elyra.pipeline.catalog_connector import ComponentCatalogConnector
from elyra.pipeline.catalog_connector import EntryData
from elyra.util.url import FileTransportAdapter
from elyra.util.url import get_verify_parm


class AirflowProviderPackageCatalogConnector(ComponentCatalogConnector):
    """
    Read component definitions from an Apache Airflow provider package archive
    """

    REQUEST_TIMEOUT = 30

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Download the user-defined Apache Airflow provider package and search for Python
        scripts that contain one or more operator definitions.

        :param catalog_metadata: Contains the catalog connector configuration information.
        :returns: List of Python scripts that contain one or more operator definitions.
        """

        # Return data structure contains a list of operators that are defined
        # in the referenced Apache Airflow provider package wheel
        operator_key_list = []

        # Read the user-defined 'airflow_provider_package_download_url', which is a required
        # input defined in the 'airflow-provider-package-catalog-catalog.json' schema file.
        # Example value: https://files.pythonhosted.org/packages/a3/57/443a4fb0a52dcfc93bcd410e5c661d5683a8a651914934e490613460713f/apache_airflow_providers_amazon-2.6.0-py3-none-any.whl # noqa: E501
        airflow_provider_package_download_url = catalog_metadata["airflow_provider_package_download_url"].strip()
        # extract the package name, e.g. 'apache_airflow_providers_amazon-2.6.0-py3-none-any.whl'
        airflow_provider_package_name = Path(urlparse(airflow_provider_package_download_url).path).name
        # extract the provider name, e.g. 'apache_airflow_providers_amazon'
        m = re.match("[^-]+", airflow_provider_package_name)
        if m:
            airflow_provider_name = m.group(0)
        else:
            airflow_provider_name = airflow_provider_package_name

        if not airflow_provider_name:
            self.log.error(
                f"Error. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                "is not configured properly. "
                f"The provider package download URL '{airflow_provider_package_download_url}' "
                "does not include a file name."
            )
            return operator_key_list

        pr = urlparse(airflow_provider_package_download_url)
        auth = None

        if pr.scheme != "file":
            # determine whether authentication needs to be performed
            auth_id = catalog_metadata.get("auth_id")
            auth_password = catalog_metadata.get("auth_password")
            if auth_id and auth_password:
                auth = HTTPBasicAuth(auth_id, auth_password)
            elif auth_id or auth_password:
                self.log.error(
                    f"Error. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                    "is not configured properly. "
                    "Authentication requires a user id and password or API key."
                )
                return operator_key_list

        # tmp_archive_dir is used to store the downloaded archive and as working directory
        if hasattr(self, "tmp_archive_dir"):
            # if the directory exists remove it in case the archive content has changed
            shutil.rmtree(self.tmp_archive_dir.name, ignore_errors=True)
        self.tmp_archive_dir = Path(mkdtemp())

        try:
            self.log.debug(f"Downloading provider package from '{airflow_provider_package_download_url}' ...")

            # download archive
            try:
                requests_session = session()
                if pr.scheme == "file":
                    requests_session.mount("file://", FileTransportAdapter())
                response = requests_session.get(
                    airflow_provider_package_download_url,
                    timeout=AirflowProviderPackageCatalogConnector.REQUEST_TIMEOUT,
                    allow_redirects=True,
                    auth=auth,
                    verify=get_verify_parm(),
                )
            except Exception as ex:
                self.log.error(
                    f"Error. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                    f"encountered an issue downloading '{airflow_provider_package_download_url}': {ex}"
                )
                return operator_key_list

            if response.status_code != 200:
                # download failed. Log error and abort processing
                self.log.error(
                    f"Error. The Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                    f"encountered an issue downloading '{airflow_provider_package_download_url}'. "
                    f"HTTP response code: {response.status_code}"
                )
                return operator_key_list

            # save downloaded archive
            archive = str(self.tmp_archive_dir / airflow_provider_package_name)
            self.log.debug(f"Saving downloaded archive in '{archive}' ...")
            with open(archive, "wb") as archive_fh:
                archive_fh.write(response.content)

            # extract archive
            self.log.debug(f"Extracting Airflow provider archive '{archive}' ...")
            try:
                with zipfile.ZipFile(archive, "r") as zip_ref:
                    zip_ref.extractall(self.tmp_archive_dir)
            except Exception as ex:
                self.log.error(
                    f"Error. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                    f"encountered an issue extracting downloaded archive '{archive}': "
                    f"{ex}"
                )
                os.remove(archive)
                return operator_key_list

            # delete archive
            self.log.debug(f"Deleting downloaded Airflow provider archive '{archive}' ...")
            os.remove(archive)

            # Locate 'get_provider_info.py' in the extracted archive.
            # It identifies Python modules that contain operator class definitions.
            pl = list(self.tmp_archive_dir.glob("**/get_provider_info.py"))
            if len(pl) != 1:
                # No such file or more than one file was found. Cannot proceed.
                self.log.error(
                    f"Error. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                    f"is not configured properly. The archive '{archive}' "
                    f"contains {len(pl)} file(s) named 'get_provider_info.py'."
                )
                # return empty list
                return operator_key_list
            get_provider_info_file_location = pl[0]

            # extract module names from get_provider_info.py
            with open(get_provider_info_file_location, "r") as gpi_file:
                f = gpi_file.read()
            namespace = {}
            exec(f, namespace)
            try:
                # try to run the 'get_provider_info' method
                return_dict = namespace["get_provider_info"]()
            except KeyError:
                # no method with this name is defined in get_provider_info.py
                self.log.error(
                    f"Error. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                    f"cannot invoke ' get_provider_info' method in '{get_provider_info_file_location}'."
                )
                return operator_key_list

            python_scripts = []
            for operator_entry in return_dict.get("operators", []):
                for m in operator_entry["python-modules"]:
                    python_scripts.append(f'{m.replace(".", sep)}.py')
            if len(python_scripts) == 0:
                self.log.warning(
                    f"Warning. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                    f"'{airflow_provider_package_name}' does not include any operator definitions."
                )
                return operator_key_list

            #
            # Identify Python scripts that define classes that extend the
            # airflow.models.BaseOperator class
            #
            scripts_with_operator_class: List[str] = []  # Python scripts that contain operator definitions
            extends_baseoperator: List[str] = []  # Classes that extend BaseOperator
            classes_to_analyze = {}
            imported_operator_classes: List[str] = []  # Imported operator classes
            # Process each Python script ...
            for script in python_scripts:
                self.log.debug(f"Parsing '{script}' ...")
                with open(self.tmp_archive_dir / script, "r") as source_code:
                    # parse source code
                    tree = ast.parse(source_code.read())
                    # Process imports and class definitions
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            # Ignore imports (e.g. 'import airflow') for now
                            # as they appear to be not used (based on a sampling
                            # of several provider packages)
                            pass
                        elif isinstance(node, ast.ImportFrom):
                            # example: 'from airflow.models import BaseOperator'
                            node_module = node.module
                            for name in node.names:
                                self.log.debug(f"Detected an IMPORT FROM: {node_module} -> {name.name}")
                                if "airflow.models" == node_module and name.name == "BaseOperator":
                                    imported_operator_classes.append(name.name)
                                else:
                                    # Look for package imports that match one of the following patters:
                                    #  - airflow.providers.*.operators.
                                    #  - airflow.operators.*
                                    # Add the associated class names to imported_operator_classes
                                    m_patterns = [r"airflow\.providers\.[a-z_]+\.operators", r"airflow\.operators\."]
                                    for pattern in m_patterns:
                                        match = re.match(pattern, node_module)
                                        if match:
                                            imported_operator_classes.append(name.name)
                                            break
                        elif isinstance(node, ast.ClassDef):
                            # Determine whether this class extends the BaseOperator class
                            # based on previously identified imports
                            class_node = node
                            self.log.debug(f"Analyzing class '{class_node.name}' in {script} ...")
                            # determine whether class extends one of the imported operator classes
                            if len(class_node.bases) == 0:
                                # This class does not extend other classes. It therefore cannot be
                                # an operator implementation. Proceed.
                                continue
                            extends = False
                            for base in class_node.bases:
                                if isinstance(base, ast.Name):
                                    key = base.id
                                elif isinstance(base, ast.Attribute):
                                    key = f"{base.value.id}.{base.attr}"
                                self.log.debug(f"Class {class_node.name} extends {key}")
                                if key in imported_operator_classes:
                                    # This class extends the Airflow BaseOperator.
                                    extends = True
                                    # Add class to list of classes that extend BaseOperator
                                    extends_baseoperator.append(class_node.name)
                                    if script not in scripts_with_operator_class:
                                        scripts_with_operator_class.append(script)
                                    break
                            if extends is False:
                                # Further analysis is required after all imports
                                # and classes were processed.
                                classes_to_analyze[class_node.name] = {"node": class_node, "file": script}

            # Initial analysis is completed. Repeat analysis for
            # for classes in 'classes_to_analyze', as they might extend
            # class that was previousl identified as an operator class.
            # For example:
            #  class MyBaseOperator(BaseOperator) -> identified in initial analysis
            #  class MyOperator(MyBaseOperator)
            analysis_complete = len(classes_to_analyze) == 0
            while analysis_complete is False:
                # assume that analysis is complete until proven otherwise
                analysis_complete = True
                for class_name in list(classes_to_analyze.keys()):
                    script_name = classes_to_analyze[class_name]["file"]
                    self.log.debug(f"Re-analyzing class '{class_name}' in " f"'{script_name}'... ")
                    for base in classes_to_analyze[class_name]["node"].bases:
                        if isinstance(base, ast.Name):
                            key = base.id
                        elif isinstance(base, ast.Attribute):
                            key = f"{base.value.id}.{base.attr}"
                        if key in extends_baseoperator:
                            # this class extends BaseOperator
                            extends_baseoperator.append(class_name)
                            if script_name not in scripts_with_operator_class:
                                scripts_with_operator_class.append(script_name)
                            # remove class from 'classes_to_analyze'
                            del classes_to_analyze[class_name]
                            # A new class was discovered that implements
                            # BaseOperator. Analysis needs to be repeated because
                            # OTHER classes might extend THIS class.
                            analysis_complete = False
                            break

            # Populate return data structure
            for script in scripts_with_operator_class:
                operator_key_list.append(
                    {
                        "provider_package": airflow_provider_package_name,
                        "provider": airflow_provider_name,
                        "file": script,
                    }
                )

            self.log.debug(f"Operator key list: {operator_key_list}")

            # Dump stats
            self.log.debug(
                f"Analysis of '{airflow_provider_package_download_url}' completed. "
                f"Located {len(extends_baseoperator)} operator class(es) "
                f"in {len(python_scripts)} Python script(s)."
            )

        except Exception as ex:
            self.log.error(
                f"Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                "encountered an issue processing operator list in "
                f"'{airflow_provider_package_download_url}': {ex}"
            )

        return operator_key_list

    def get_entry_data(
        self, catalog_entry_data: Dict[str, Any], catalog_metadata: Dict[str, Any]
    ) -> Optional[EntryData]:
        """
        Fetch the script identified by catalog_entry_data['file']

        :param catalog_entry_data: a dictionary that contains the information needed to read the content
                                   of the component definition
        :param catalog_metadata: the metadata associated with the catalog in which this catalog entry is
                                 stored; in addition to catalog_entry_data, catalog_metadata may also be
                                 needed to read the component definition for certain types of catalogs
        :returns: An AirflowEntryData containing the definition and metadata, if found
        """

        operator_file_name = catalog_entry_data["file"]

        if hasattr(self, "tmp_archive_dir") is False:
            # This method was invoked before 'get_catalog_entries'. Therefore
            # there is nothing that can be done. Log error and return None
            self.log.error(
                f"Error. Airflow provider package connector '{catalog_metadata.get('display_name')}' "
                "encountered an issue reading the operator source: The downloaded file was not found."
            )
            return None

        # Compose package name from operator_file_name, e.g.
        # 'airflow/providers/ssh/operators/ssh.py' => 'airflow.providers.ssh.operators.ssh'
        package = ".".join(Path(operator_file_name).with_suffix("").parts)

        # load operator source using the provided key
        operator_source = self.tmp_archive_dir / operator_file_name
        self.log.debug(f"Reading operator source '{operator_source}' ...")
        try:
            with open(operator_source, "r") as source:
                return AirflowEntryData(definition=source.read(), package_name=package)
        except Exception as ex:
            self.log.error(
                f"Error. Airflow package connector '{catalog_metadata.get('display_name')}' "
                f"encountered an issue reading operator source '{operator_source}': {ex}"
            )

        return None

    @classmethod
    def get_hash_keys(cls) -> List[Any]:
        """
        Instructs Elyra to use the specified keys to generate a unique
        hash value for item returned by get_catalog_entries

        :returns: a list of keys
        """
        # Example key values:
        # - provider: 'apache_airflow_providers_ssh'
        # - file: 'airflow/providers/ssh/operators/ssh.py'
        return ["provider", "file"]
