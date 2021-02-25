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

from github import Github, GithubException
from traitlets.config import LoggingConfigurable
from typing import Optional


class GithubClient(LoggingConfigurable):

    def __init__(self,
                 token: str,
                 repo: str,
                 branch: Optional[str] = None,
                 server_url: Optional[str] = "https://api.github.com"):
        """
        Creates a Github Client for Elyra
        :param token: Personal Access Token for use with Github
                      See https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token
        :param repo: Github Repository to use. Use Form : [Github Username/Org]/[Repository Name]
                     e.g. elyra/examples
        :param branch: Branch in the 'repo' to use. If not provided, this will use the default branch configured in the
                       target repository
        :param server_url:  Github API endpoint to use for the client. This is can be an Enterprise
                          Github instance. By default the client will attempt to connect to the main Github API at
                          https://api.github.com'
        """

        super().__init__()

        self.client = Github(login_or_token=token, base_url=server_url)

        try:
            self.repo = self.client.get_repo(repo)
        except GithubException as e:
            self.log.error(f'Error accessing repository {repo}: ' + str(e))
            raise RuntimeError(f'Error accessing repository {repo}: {str(e)}') from e

        self.branch = branch

    def upload_dag(self,
                   pipeline_filepath: str,
                   pipeline_name: str) -> None:
        """
        Push a DAG to a remote Github Repository
        :param pipeline_filepath: filepath to the location of the DAG in the local filesystem
        :param pipeline_name: the name of the file to be created in the remote Github Repository
        :return:
        """

        try:
            # Upload to github
            with open(pipeline_filepath) as input_file:
                content = input_file.read()

                self.repo.create_file(path=pipeline_name + ".py",
                                      message="Pushed DAG " + pipeline_name,
                                      content=content,
                                      branch=self.branch)

            self.log.info('Pipeline successfully added to the git queue')

        except FileNotFoundError as fnfe:
            self.log.error(f'Unable to locate local DAG file to upload: {pipeline_filepath}: ' + str(fnfe))
            raise RuntimeError(f'Unable to locate local DAG file to upload: {pipeline_filepath}: {str(fnfe)}') from fnfe
        except GithubException as e:
            self.log.error(f'Error uploading DAG to branch {self.branch}: ' + str(e))
            raise RuntimeError(f'Error uploading DAG to branch {self.branch}: {str(e)}') from e
