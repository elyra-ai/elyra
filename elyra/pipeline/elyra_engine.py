#
# Copyright 2018-2023 Elyra Authors
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
"""Papermill Engine that configures a KernelManager to hit a Gateway Server."""

from papermill.clientwrap import PapermillNotebookClient
from papermill.engines import NBClientEngine
from papermill.log import logger
from papermill.utils import merge_kwargs
from papermill.utils import remove_args


class ElyraEngine(NBClientEngine):
    """
    A notebook engine representing an nbclient process that runs local pipeline notebooks.

    This can execute a notebook document and update the `nb_man.nb` object with the results.
    """

    @classmethod
    def execute_managed_notebook(
        cls,
        nb_man,
        kernel_name,
        log_output=False,
        stdout_file=None,
        stderr_file=None,
        start_timeout=60,
        execution_timeout=None,
        **kwargs,
    ):
        """
        Performs the actual execution of the parameterized notebook.  Note that kwargs may
        specify an alternate 'kernel_manager_class' for nbclient to use, and 'kernel_env'
        and 'kernel_cwd' to pass to the kernel process's environment.

        Args:
            nb (NotebookNode): Executable notebook object.
            kernel_name (str): Name of kernel to execute the notebook against.
            log_output (bool): Flag for whether or not to write notebook output to the
                               configured logger.
            startup_timeout (int): Duration to wait for kernel start-up.
            execution_timeout (int): Duration to wait before failing execution (default: never).
            kernel_env (dict): Passed as the kernel 'env' parameter to the execute() method
            kernel_cwd (str): Passed as the kernel 'cwd' parameter to the execute() method
            kernel_manager_class: (str) If set, specifies the use of an alternate kernel manager.
        """

        # Exclude parameters that named differently downstream
        safe_kwargs = remove_args(["timeout", "startup_timeout", "kernel_env", "kernel_cwd", "input_path"], **kwargs)

        # Nicely handle preprocessor arguments prioritizing values set by engine
        final_kwargs = merge_kwargs(
            safe_kwargs,
            timeout=execution_timeout or kwargs.get("timeout"),
            startup_timeout=start_timeout,
            kernel_name=kernel_name,
            log=logger,
            log_output=log_output,
            stdout_file=stdout_file,
            stderr_file=stderr_file,
        )

        kernel_kwargs = {"env": kwargs.get("kernel_env", {})}
        # Only include kernel_name and set path if GatewayKernelManager will be used
        kernel_manager_class = final_kwargs.get("kernel_manager_class")
        if kernel_manager_class == "jupyter_server.gateway.managers.GatewayKernelManager":
            kernel_kwargs["kernel_name"] = kernel_name
            kernel_kwargs["path"] = kwargs.get("kernel_cwd")

        return PapermillNotebookClient(nb_man, **final_kwargs).execute(**kernel_kwargs)
