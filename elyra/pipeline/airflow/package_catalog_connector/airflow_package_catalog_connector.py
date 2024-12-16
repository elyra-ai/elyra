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
from pathlib import Path
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


class AirflowPackageCatalogConnector(ComponentCatalogConnector):
    """
    Provides access to operators that are defined in Apache Airflow wheel archives.
    """

    REQUEST_TIMEOUT = 30

    def get_catalog_entries(self, catalog_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns a list containing an entry for each Apache Airflow operator that was
        detected in the specified Apache Airflow wheel archive.

        :param catalog_metadata: contains information needed to download the archive using an HTTP GET request
        """

        # Return data structure contains a list of Python scripts in the referenced
        # Apache Airflow wheel that appear to implement at least one operator
        # Each entry defines two keys:
        #  - 'airflow_package': The name of the Airflow package the user specified.
        #    This is included for informational purposes only.
        #  - 'file': Python script name
        operator_key_list = []

        # Read the user-supplied 'airflow_package_download_url', which is a required
        # input defined in the 'airflow-package-catalog-catalog.json' schema file.
        # Example value: https://archive.apache.org/dist/airflow/1.10.15/apache_airflow-1.10.15-py2.py3-none-any.whl
        airflow_package_download_url = catalog_metadata["airflow_package_download_url"]
        # extract the package name, e.g. 'apache_airflow-1.10.15-py2.py3-none-any.whl'
        airflow_package_name = Path(urlparse(airflow_package_download_url).path).name

        if not airflow_package_name:
            self.log.error(
                f"Error. Airflow package connector '{catalog_metadata.get('display_name')}' "
                "is not configured properly. "
                f"The package download URL '{airflow_package_download_url}' "
                "does not include a file name."
            )
            return operator_key_list

        pr = urlparse(airflow_package_download_url)
        auth = None

        if pr.scheme != "file":
            # determine whether authentication needs to be performed
            auth_id = catalog_metadata.get("auth_id")
            auth_password = catalog_metadata.get("auth_password")
            if auth_id and auth_password:
                auth = HTTPBasicAuth(auth_id, auth_password)
            elif auth_id or auth_password:
                self.log.error(
                    f"Error. Airflow connector '{catalog_metadata.get('display_name')}' "
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
            self.log.debug(f"Downloading Apache Airflow package from '{airflow_package_download_url}' ...")

            # download archive; abort after 30 seconds
            try:
                requests_session = session()
                if pr.scheme == "file":
                    requests_session.mount("file://", FileTransportAdapter())
                response = requests_session.get(
                    airflow_package_download_url,
                    timeout=AirflowPackageCatalogConnector.REQUEST_TIMEOUT,
                    allow_redirects=True,
                    auth=auth,
                    verify=get_verify_parm(),
                )
            except Exception as ex:
                self.log.error(
                    f"Error. Airflow package connector '{catalog_metadata.get('display_name')}' "
                    f"encountered an issue downloading '{airflow_package_download_url}': {ex}"
                )
                return operator_key_list
            if response.status_code != 200:
                # download failed. Log error and abort processing
                self.log.error(
                    f"Error. The Airflow package connector '{catalog_metadata.get('display_name')}' "
                    f"encountered an issue downloading '{airflow_package_download_url}'. "
                    f"HTTP response code: {response.status_code}"
                )
                return operator_key_list

            # save downloaded archive
            archive = str(self.tmp_archive_dir / airflow_package_name)
            self.log.debug(f"Saving downloaded archive in '{archive}' ...")
            with open(archive, "wb") as archive_fh:
                archive_fh.write(response.content)

            # extract archive
            self.log.debug(f"Extracting Airflow archive '{archive}' ...")
            try:
                with zipfile.ZipFile(archive, "r") as zip_ref:
                    zip_ref.extractall(self.tmp_archive_dir)
            except Exception as ex:
                self.log.error(
                    f"Error. Airflow package connector '{catalog_metadata.get('display_name')}' "
                    f"encountered an issue extracting downloaded archive '{archive}': "
                    f"{ex}"
                )
                os.remove(archive)
                return operator_key_list

            # delete archive
            self.log.debug(f"Deleting downloaded Airflow archive '{archive}' ...")
            os.remove(archive)

            # Locate Python scripts that are stored in the 'airflow/operators' directory
            python_scripts = [s for s in self.tmp_archive_dir.glob("airflow/operators/*.py")]

            # If requested, also locate Python scripts that are stored in the 'airflow/contrib/operators' directory
            if catalog_metadata.get("search_contrib"):
                python_scripts.extend([s for s in self.tmp_archive_dir.glob("airflow/contrib/operators/*.py")])

            #
            # Identify Python scripts that define classes that extend the
            # airflow.models.BaseOperator class
            #
            scripts_with_operator_class: List[str] = []  # Python scripts that contain operator definitions
            extends_baseoperator: List[str] = []  # Classes that extend BaseOperator
            classes_to_analyze = {}
            imported_operator_classes: List[str] = []  # Imported operator classes
            offset = len(str(self.tmp_archive_dir)) + 1
            script_count = 0  # used for stats collection
            # process each Python script ...
            for script in python_scripts:
                if script.name == "__init__.py":
                    continue
                script_id = str(script)[offset:]
                script_count += 1
                self.log.debug(f"Parsing '{script}' ...")
                with open(script, "r") as source_code:
                    # parse source code
                    tree = ast.parse(source_code.read())
                    # identify imports and class definitions
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            # Need to handle 'import airflow' in the future,
                            # should this ever surface in operator source code files
                            pass
                        elif isinstance(node, ast.ImportFrom):
                            node_module = node.module
                            for name in node.names:
                                if "airflow.models" == node_module and name.name == "BaseOperator":
                                    imported_operator_classes.append(name.name)
                        elif isinstance(node, ast.ClassDef):
                            # determine whether this class extends the BaseOperator class
                            self.log.debug(f"Analyzing class '{node.name}' in {script_id} ...")
                            self.log.debug(f" Class {node.name} extends {[n.id for n in node.bases]}")
                            # determine whether class extends one of the imported operator classes
                            if len(node.bases) == 0:
                                # class does not extend other classes; it therefore does
                                # not extend the Airflow BaseOperator; skip class
                                continue
                            for base in node.bases:
                                extends = False
                                if base.id in imported_operator_classes:
                                    # class extends Airflow BaseOperator
                                    extends = True
                                    extends_baseoperator.append(node.name)
                                    if script_id not in scripts_with_operator_class:
                                        scripts_with_operator_class.append(script_id)
                                    break
                            if extends is False:
                                # need to further analyze whether this class
                                # extends Airflow BaseOperator
                                classes_to_analyze[node.name] = {"node": node, "file": script_id}

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
                    self.log.debug(
                        f"Re-analyzing class '{class_name}' in " f"'{classes_to_analyze[class_name]['file']}'... "
                    )
                    for base in classes_to_analyze[class_name]["node"].bases:
                        if base.id in extends_baseoperator:
                            # this class extends BaseOperator
                            extends_baseoperator.append(class_name)
                            if classes_to_analyze[class_name]["file"] not in scripts_with_operator_class:
                                scripts_with_operator_class.append(classes_to_analyze[class_name]["file"])
                            # remove class from todo list
                            del classes_to_analyze[class_name]
                            # A new class was discovered that implements
                            # BaseOperator. Analysis needs to be repeated because
                            # OTHER classes might extend THIS class.
                            analysis_complete = False
                            break

            # Populate return data structure
            for script in scripts_with_operator_class:
                operator_key_list.append({"airflow_package": airflow_package_name, "file": script})

            # Dump stats
            self.log.info(
                f"Analysis of '{airflow_package_download_url}' completed. "
                f"Located {len(extends_baseoperator)} operator classes "
                f"in {len(scripts_with_operator_class)} Python scripts."
            )
            self.log.debug(f"Operator key list: {operator_key_list}")
        except Exception as ex:
            self.log.error(
                f"Error. Airflow package connector '{catalog_metadata.get('display_name')}' "
                "encountered an issue processing operator list in Airflow package "
                f"'{airflow_package_download_url}': {ex}"
            )

        return operator_key_list

    def get_entry_data(
        self, catalog_entry_data: Dict[str, Any], catalog_metadata: Dict[str, Any]
    ) -> Optional[EntryData]:
        """
        Fetch the component that is identified by catalog_entry_data from
        the downloaded Apache Airflow package.

        :param catalog_entry_data: a dictionary that contains the information needed to read the content
                                   of the component definition
        :param catalog_metadata: the metadata associated with the catalog in which this catalog entry is
                                 stored; in addition to catalog_entry_data, catalog_metadata may also be
                                 needed to read the component definition for certain types of catalogs

        :returns: An AirflowEntryData containing the definition and metadata, if found
        """
        operator_file_name = catalog_entry_data.get("file")

        if hasattr(self, "tmp_archive_dir") is False:
            # Log error and return None
            self.log.error(
                f"Error. Airflow package connector '{catalog_metadata.get('display_name')}' "
                "encountered an issue reading the operator source: The downloaded file was not found."
            )
            return None

        # Compose package name from operator_file_name, e.g.
        # 'airflow/operators/papermill_operator.py' => 'airflow.operators.papermill_operator'
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
                f"encountered an issue reading the operator source '{operator_source}': {ex}"
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
        # - file: operators/bash_operator.py
        return ["file"]
