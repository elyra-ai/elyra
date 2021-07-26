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
import json
import os
import shutil
from typing import Any
from typing import List
from typing import Optional
import uuid

from kfp import components as components

from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.pipeline import Pipeline
from elyra.pipeline.processor import PipelineProcessor


def _read_pipeline_resource(pipeline_filename):
    root = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    pipeline_path = os.path.join(root, pipeline_filename)

    with open(pipeline_path, 'r') as f:
        pipeline_json = json.load(f)

    return pipeline_json


def _mock_cc_pipeline(processor, pipeline):
    target_ops = {}
    sorted_operations = PipelineProcessor._sort_operations(pipeline.operations)

    for operation in sorted_operations:

        if isinstance(operation, GenericOperation):
            continue

        # If operation is a "non-standard" component, load it's spec and create operation with factory function
        else:
            # Retrieve component from cache
            component = processor._component_registry.get_component(operation.classifier)

            # Get absolute path of component source
            component_path = component.source
            if component.source_type == "filename":
                component_path = os.path.join(os.path.dirname(__file__), "resources", component_path)

            component_source = {}
            component_source[component.source_type] = component_path

            # Build component task factory
            try:
                factory_function = components.load_component(**component_source)
            except Exception:
                raise RuntimeError(f"Error loading component spec for {operation.name}.")

            # Add factory function, which returns a ContainerOp task instance, to pipeline operation dict
            try:
                operation.component_params_as_dict.pop("inputs")
                operation.component_params_as_dict.pop("outputs")
                target_ops[operation.id] = factory_function(**operation.component_params_as_dict)
            except Exception:
                raise RuntimeError(f"Error constructing component {operation.name}.")

    return target_ops


class NodeBase(object):
    """Represents a node of a constructed pipeline based on files in resources/node_util. """
    id: str
    name: str
    outputs: List[str]
    dependencies: List[str]
    env_vars: List[str]
    image_name: str
    fail: bool
    # from subclasses
    classifier: str
    filename: str
    pipeline_name: str  # Set during pipeline construction

    def __init__(self, name: str, num_outputs: Optional[int] = 0,
                 input_nodes: Optional[List[Any]] = None,
                 image_name: Optional[str] = None,
                 fail: Optional[bool] = False):
        self.id = str(uuid.uuid4())
        self.name = name
        self.fail = fail
        self.image_name = image_name
        self.outputs = []
        for i in range(1, num_outputs + 1):
            self.outputs.append(f"{self.name}_{i}.out")

        self.inputs = []
        self.parent_operations = []
        if input_nodes:
            for node in input_nodes:
                self.inputs.extend(node.outputs)
                self.parent_operations.append(node.id)

        self.dependencies = ['node_util/*']

    def get_operation(self) -> GenericOperation:

        self.env_vars = []
        if self.fail:  # NODE_FILENAME is required, so skip if triggering failure
            if "NODE_FILENAME" in os.environ:  # remove entry if present
                os.environ.pop("NODE_FILENAME")
        else:
            self.env_vars.append(f"NODE_FILENAME={self.filename}")

        if self.inputs:
            self.env_vars.append(f"INPUT_FILENAMES={';'.join(self.inputs)}")
        if self.outputs:
            self.env_vars.append(f"OUTPUT_FILENAMES={';'.join(self.outputs)}")

        # Convey the pipeline name
        assert self.pipeline_name is not None, "Pipeline name has not been set during construction!"
        self.env_vars.append(f"PIPELINE_NAME={self.pipeline_name}")

        # Add system-owned here with bogus or no value...
        self.env_vars.append("ELYRA_RUNTIME_ENV=bogus_runtime")

        component_parameters = {
            'filename': self.filename,
            'runtime_image': self.image_name or "NA",
            'dependencies': self.dependencies,
            'env_vars': self.env_vars,
            'inputs': self.inputs,
            'outputs': self.outputs
        }
        return GenericOperation(self.id, 'execution_node', self.name, self.classifier,
                                parent_operation_ids=self.parent_operations,
                                component_params=component_parameters)


class NotebookNode(NodeBase):
    def __init__(self, name: str, num_outputs: Optional[int] = 0,
                 input_nodes: Optional[List[Any]] = None,
                 image_name: Optional[str] = None,
                 fail: Optional[bool] = False):

        super().__init__(name, num_outputs=num_outputs, input_nodes=input_nodes, image_name=image_name, fail=fail)
        self.classifier = 'execute-notebook-node'
        self.filename = f"{self.name}.ipynb"


class PythonNode(NodeBase):
    def __init__(self, name: str, num_outputs: Optional[int] = 0,
                 input_nodes: Optional[List[Any]] = None,
                 image_name: Optional[str] = None,
                 fail: Optional[bool] = False):

        super().__init__(name, num_outputs=num_outputs, input_nodes=input_nodes, image_name=image_name, fail=fail)
        self.classifier = 'execute-python-node'
        self.filename = f"{self.name}.py"


def construct_pipeline(name: str, nodes: List[NodeBase], location: str,
                       runtime_type: Optional[str] = 'local',
                       runtime_config: Optional[str] = 'local') -> Pipeline:
    """Returns an instance of a local Pipeline consisting of each node and populates the
       specified location with the necessary files to run the pipeline from that location.
    """
    pipeline = Pipeline(str(uuid.uuid4()), name, runtime_type, runtime_config)
    for node in nodes:
        node.pipeline_name = name
        pipeline.operations[node.id] = node.get_operation()
        # copy the node file into the "working directory"
        if isinstance(node, NotebookNode):
            src_file = os.path.join(os.path.dirname(__file__), 'resources/node_util/node.ipynb')
        elif isinstance(node, PythonNode):
            src_file = os.path.join(os.path.dirname(__file__), 'resources/node_util/node.py')
        else:
            assert False, f"Invalid node type detected: {node.__class__.__name__}"

        shutil.copy(src_file, os.path.join(location, node.filename))

    # copy the node_util directory into the "working directory"
    shutil.copytree(os.path.join(os.path.dirname(__file__), 'resources/node_util'), os.path.join(location, 'node_util'))

    return pipeline
