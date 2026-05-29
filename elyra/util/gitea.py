import base64
import os

import giteapy
from giteapy.rest import ApiException


class GiteaClient:
    """
    Gitea client using official giteapy SDK.
    Automatically appends /api/v1 to server URL.
    Compatible with Elyra's expected method signatures.
    """

    def __init__(self, server_url: str, token: str, repo: str, branch: str = "main"):
        """
        :param server_url: Base Gitea server URL, WITHOUT /api/v1.
                          Example: http://192.168.1.64/gitea
                          User should NOT include /api/v1.
        :param token: Gitea personal access token
        :param repo: Repository in owner/repo format
        :param branch: Target branch name
        """

        # Normalize URL
        cleaned = server_url.rstrip("/")

        # Remove /api/v1 if user mistakenly enters it
        if cleaned.endswith("/api/v1"):
            cleaned = cleaned.rsplit("/api/v1", 1)[0]

        # Final API URL
        self.api_url = cleaned + "/api/v1"

        # Parse repo input
        owner_repo = repo.split("/")
        if len(owner_repo) != 2:
            raise ValueError("Repo must be in format owner/repo")

        self.owner = owner_repo[0]
        self.repo = owner_repo[1]
        self.branch = branch

        # Configure Gitea SDK
        config = giteapy.Configuration()
        config.host = self.api_url
        config.api_key["access_token"] = token  # correct Gitea usage

        client = giteapy.ApiClient(config)
        self.repo_api = giteapy.RepositoryApi(client)

    def upload_dag(self, pipeline_filepath: str, pipeline_name: str):
        """
        Create or update a file inside the repository's /dags folder.
        """

        filename = os.path.basename(pipeline_filepath)
        path = f"dags/{filename}"

        # Read file content
        with open(pipeline_filepath, "rb") as f:
            content_b64 = base64.b64encode(f.read()).decode()

        message = f"Upload DAG for pipeline: {pipeline_name}"

        # Determine if file exists
        sha = None
        try:
            existing = self.repo_api.repo_get_contents(self.owner, self.repo, path, ref=self.branch)
            sha = existing.sha
            file_exists = True
        except ApiException as e:
            if e.status == 404:
                file_exists = False
            else:
                raise RuntimeError(f"Error checking file existence: {e}")

        # Upload or update the file using Gitea SDK
        try:
            if file_exists:
                # Update existing file
                req = giteapy.UpdateFileOptions(
                    branch=self.branch,
                    message=message,
                    content=content_b64,
                    sha=sha,
                )
                result = self.repo_api.repo_update_file(self.owner, self.repo, path, req)
            else:
                # Create new file
                req = giteapy.CreateFileOptions(
                    branch=self.branch,
                    message=message,
                    content=content_b64,
                )
                result = self.repo_api.repo_create_file(self.owner, self.repo, path, req)

            return result

        except ApiException as e:
            raise RuntimeError(f"Failed to upload DAG to Gitea: {e.status} - {e.reason}")

    def verify_repo_access(self) -> bool:
        """
        Verify repository access using Gitea SDK.
        """
        try:
            self.repo_api.repo_get(self.owner, self.repo)
            return True
        except Exception:
            return False

    # IMPORTANT: Keep EXACT Elyra signature
    @staticmethod
    def get_git_url(api_url: str, repository_name: str, repository_branch: str) -> str:
        """
        Elyra calls:
            get_git_url(api_url=..., repository_name=..., repository_branch=...)

        Convert API URL → Repo browsing URL.
        Example:
            API: http://host/gitea/api/v1
            Web: http://host/gitea/<owner>/<repo>/src/branch/main/dags
        """

        # Remove /api/v1 to get base UI URL
        base = api_url.replace("/api/v1", "").rstrip("/")

        return f"{base}/{repository_name}/src/branch/{repository_branch}/dags"
