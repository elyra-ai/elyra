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
from abc import ABC
from abc import abstractmethod
import json
import os
from typing import List


class NodeFile(object):
    """Base class for input and output node files"""

    def __init__(self, filename: str) -> None:
        self.filename = filename


class InputNodeFile(NodeFile):
    """Given a filename, it ensures the file exists and can read its contents."""

    def __init__(self, filename: str) -> None:
        super().__init__(filename)
        self.data = None

        if not os.path.exists(self.filename):
            raise FileNotFoundError(f"File '{self.filename}' does not exist!")

    def read(self) -> str:
        with open(self.filename) as f:
            self.data = f.read()
        return self.data

    def data(self) -> str:
        return self.data


class OutputNodeFile(NodeFile):
    """Given a filename, it ensures the file does not exist and will write data to that file."""

    def __init__(self, filename: str) -> None:
        super().__init__(filename)

        # Don't enforce output file existence here - break idempotency
        # if os.path.exists(self.filename):
        #    raise FileExistsError(f"File '{self.filename}' already exists!")

    def write(self, data) -> None:
        with open(self.filename, "w+") as f:
            f.write(data)


class ExecutionNode(ABC):
    """Represents an excutable node of a pipeline.  This class must be subclassed."""

    node_name = None
    filename = None
    extension = None

    def __init__(self) -> None:
        self.filename = os.getenv("NODE_FILENAME")
        if not self.filename:
            raise ValueError("NODE_FILENAME environment variable must be set!")

        node_file_splits = os.path.basename(self.filename).split(".")
        self.node_name = node_file_splits[0]
        self.extension = node_file_splits[1]
        self.validate()

    def validate(self) -> None:
        """Validate the filename as best as possible, depending on subclass."""

        # Validate its extension and that the file exists.
        self.validate_extension()
        if not os.path.exists(self.filename):
            raise FileNotFoundError(f"ExecutionNode filename '{self.filename}' does not exist!")

    def run(self) -> None:
        self.process_inputs("INPUT_FILENAMES")
        self.perform_experiment()
        self.process_outputs("OUTPUT_FILENAMES")

    def perform_experiment(self) -> None:
        """Emulates the experiment to run."""
        print(f"NODE_NAME: {self.node_name}")

        runtime_env = os.getenv("ELYRA_RUNTIME_ENV")
        assert runtime_env == "local", "ELYRA_RUNTIME_ENV has not been set to 'local'!"
        print(f"ELYRA_RUNTIME_ENV: {runtime_env}")

        run_name = os.getenv("ELYRA_RUN_NAME")
        assert run_name is not None, "ELYRA_RUN_NAME is not set!"
        print(f"ELYRA_RUN_NAME: {run_name}")

        pipeline_name = os.getenv("PIPELINE_NAME")
        print(f"PIPELINE_NAME: {pipeline_name}")
        assert pipeline_name is not None, "PIPELINE_NAME is not set!"

        assert run_name.startswith(pipeline_name), "ELYRA_RUN_NAME does not start with pipeline name!"

    def process_inputs(self, env_var: str) -> List[InputNodeFile]:
        """Given an environment variable `env_var`, that contains a SEMI-COLON-separated
        list of filenames, it processes each entry by instantiating an instance of
        InputNodeFile corresponding to each entry and returns the list of instances.
        """
        inputs = []
        filenames = os.getenv(env_var, "").split(";")

        for filename in filenames:
            if filename:
                inputs.append(InputNodeFile(filename))

        for input_file in inputs:
            payload = json.loads(input_file.read())
            print(f"FROM: {payload.get('node')}")
            assert payload.get("run_name") == os.getenv("ELYRA_RUN_NAME")

        return inputs

    def process_outputs(self, env_var: str) -> List[OutputNodeFile]:
        """Given an environment variable `env_var`, that contains a SEMI-COLON-separated
        list of filenames, it processes each entry by instantiating an instance of
        OutputNodeFile corresponding to each entry and returns the list of instances.
        """
        outputs = []
        filenames = os.getenv(env_var, "").split(";")

        for filename in filenames:
            if filename:
                outputs.append(OutputNodeFile(filename))

        # Include ELYRA_RUN_NAME in all outputs - which are verified when used as inputs
        payload = {"node": self.node_name, "run_name": os.getenv("ELYRA_RUN_NAME")}
        for output_file in outputs:
            output_file.write(json.dumps(payload))

        return outputs

    @abstractmethod
    def expected_extension(self) -> str:
        raise NotImplementedError(
            f"Method 'expected_extension()' must be implemented by subclass '{self.__class__.__name__}'!"
        )

    def validate_extension(self) -> None:
        if self.expected_extension() != self.extension:
            raise ValueError(
                f"Filename '{self.filename}' does not have a proper extension: '{self.expected_extension()}'"
            )


class NotebookNode(ExecutionNode):
    """Represents a Notebook execution node of a pipeline."""

    def expected_extension(self) -> str:
        return "ipynb"

    def validate(self) -> None:
        """For notebooks, we can also ensure the file can be loaded as JSON."""
        super().validate()

        # Confirm file can be loaded as JSON
        with open(self.filename) as f:
            json.load(f)


class PythonNode(ExecutionNode):
    """Represents a Python file execution node of a pipeline."""

    def expected_extension(self) -> str:
        return "py"
