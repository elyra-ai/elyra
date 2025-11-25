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
import logging

from enum import Enum
from typing import List

logger = logging.getLogger(__name__)

class SupportedGitTypes(Enum):
    GITHUB = "GitHub"
    GITLAB = "GitLab"
    GITEA = "Gitea"

    @staticmethod
    def get_default_type() -> "SupportedGitTypes":
        """
        Returns the "default" enum member
        :return: default enum member
        :rtype: str
        """
        return SupportedGitTypes.GITHUB

    @staticmethod
    def get_enabled_types() -> List["SupportedGitTypes"]:
        enabled_types = [SupportedGitTypes.GITHUB]

        # Enable GitLab (if python-gitlab installed)
        try:
            from elyra.util.gitlab import GitLabClient  # noqa: F401
            enabled_types.append(SupportedGitTypes.GITLAB)
        except ImportError as e:
            logger.debug(f"GitLab client not available: {e}")

        # Enable Gitea (if your gitea.py exists)
        try:
            from elyra.util.gitea import GiteaClient  # noqa: F401
            enabled_types.append(SupportedGitTypes.GITEA)
        except ImportError as e:
            logger.debug(f"Gitea client not available: {e}")
        return enabled_types

    @staticmethod
    def is_enabled(git_type: "SupportedGitTypes") -> bool:
        """
        :param git_type: A member of SupportedGitTypes
        :type git_type: SupportedGitTypes
        :return: True if git_type is enabled
        :rtype: bool
        """
        return git_type in SupportedGitTypes.get_enabled_types()

    @staticmethod
    def get_instance_by_name(name: str) -> "SupportedGitTypes":
        """
        Returns an enumeration member of SupportedGitTypes
        corresponding to the given name.
        :raises ValueError: name is not a valid enum member name
        :return: An enum member of SupportedGitTypes
        :rtype: SupportedGitTypes
        """
        try:
            return SupportedGitTypes[name]
        except KeyError:
            raise ValueError(f"'{name}' is not a valid {SupportedGitTypes.__name__}")
