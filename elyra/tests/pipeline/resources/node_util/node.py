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
"""
Pipeline PythonNode

This python script will represent a single node of a pipeline.  It will be completely
driven via the following environment variables configured on the node properties
dialog of the pipeline:
- `NODE_FILENAME`: (Required) The filename associated with the node.  The extension
  is used to validate that the node matches the associated file.  The basename portion
  represents the node name - and is used in producing the output files.
- `INPUT_FILENAMES`: (Optional) A SEMI-COLON-separated list of filenames.  Each entry
  can include a _relative_ path as a prefix to the filename.  Each file is expected
  to exist and contain content.  The content will be printed and should appear in the
  out of a cell.
- `OUTPUT_FILENAMES`: (Optional) A SEMI-COLON-separated list of filenames.  Each entry
  can include a _relative_ path as a prefix to the filename.  Each file is NOT expected
  to exist, but will be created as a function of the notebook's execution.
"""
import os
import requests  # noqa

from elyra.tests.pipeline.resources.node_util.node_util import PythonNode


# These getenv calls are here to help seed the environment variables
# dialog in the node properties of the pipeline editor
os.getenv("NODE_FILENAME")
os.getenv("INPUT_FILENAMES")
os.getenv("OUTPUT_FILENAMES")
os.getenv("ELYRA_RUNTIME_ENV")
# Execute the node
PythonNode().run()
