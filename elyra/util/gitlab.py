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

from typing import Optional

# this may raise an ImportError if the python-gitlab package is not installed
from gitlab import Gitlab

# this may raise an ImportError if the python-gitlab package is not installed
from gitlab.exceptions import GitlabError  # noqa H306
from traitlets.config import LoggingConfigurable
from urllib3.util import parse_url


class GitLabClient(LoggingConfigurable):
    def __init__(
        self,
        token: str,
        project: str,
        branch: Optional[str] = None,
        server_url: Optional[str] = "https://gitlab.com",
        **kwargs,
    ):
        """
        Creates a GitLab client for Elyra
        :param token: Personal Access Token for use with GitLab
        :param project: GitLab project to use. Use format [namespace]/[project] e.g. elyra/examples
        :param branch: Project branch to use. If not provided, this will use the default branch configured in the
                       target project
        :param server_url:  GitLab API endpoint to use for the client. This is can be an Enterprise
                          GitLab instance. By default the client will attempt to connect to the main GitLab API at
                          https://www.gitlab.com'
        """

        super().__init__(**kwargs)

        # Remove trailing slash(es) from server URL to prevent failure
        self.server_url = server_url.rstrip("/")
        self.project_name = project
        self.branch = branch

        try:
            self.client = Gitlab(self.server_url, private_token=token)
            self.gitlab_project = self.client.projects.get(self.project_name)
        except GitlabError as gle:
            self.log.error(f"Error accessing project {self.project_name}: {gle}")
            raise RuntimeError(
                f"Error accessing repository {self.project_name}: {gle}. "
                "Please validate your runtime configuration details and retry."
            ) from gle

    def upload_dag(self, pipeline_filepath: str, pipeline_name: str) -> None:
        """
        Push a DAG to a gitlab project
        :param pipeline_filepath: filepath to the location of the DAG in the local filesystem
        :param pipeline_name: the name of the file to be created in the gitlab project
        :return:
        """
        try:
            # Upload DAG to gitlab project
            with open(pipeline_filepath) as input_file:
                content = input_file.read()

                git_file_name = f"{pipeline_name}.py"

                self.gitlab_project.files.create(
                    {
                        "file_path": git_file_name,
                        "branch": self.branch,
                        "content": content,
                        "commit_message": f"Pushed DAG {pipeline_name}",
                    }
                )

            self.log.info(f"DAG file {git_file_name} was successfully uploaded to branch {self.branch}.")

        except FileNotFoundError as fnfe:
            self.log.error(f"Unable to locate local DAG file to upload: {pipeline_filepath}: " + str(fnfe))
            raise RuntimeError(f"Unable to locate local DAG file to upload: {pipeline_filepath}: {str(fnfe)}") from fnfe
        except GitlabError as gle:
            self.log.error(f"Error uploading DAG to branch {self.branch}: {gle}")
            raise RuntimeError(
                f"Error uploading DAG to branch {self.branch}: {gle} "
                "Please validate your runtime configuration details and try again."
            ) from gle

    @staticmethod
    def get_git_url(api_url: str, repository_name: str, repository_branch: str) -> str:
        """
        Generates the URL to the location of the pushed DAG
        :param api_url: git API endpoint URL
        :param project_name: name of the GitLab project in the form [namespace]/[project]
        :param project_branch: name of the project branch
        :return: a URL in string format
        """
        parsed_url = parse_url(api_url)
        scheme = f"{parsed_url.scheme}://"
        host = parsed_url.host
        port = ""

        if parsed_url.host.split(".")[0] == "api":
            host = ".".join(parsed_url.host.split(".")[1:])

        if parsed_url.port:
            port = f":{parsed_url.port}"

        return f"{scheme}{host}{port}/{repository_name}/tree/{repository_branch}"
