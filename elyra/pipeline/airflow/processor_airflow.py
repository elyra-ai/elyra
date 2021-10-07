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
from collections import OrderedDict
from datetime import datetime
import json
import os
import re
import tempfile
import time
from typing import Dict
from typing import List
from typing import Union

import autopep8
from jinja2 import Environment
from jinja2 import PackageLoader

from elyra._version import __version__
from elyra.airflow.operator import BootscriptBuilder
from elyra.metadata.schemaspaces import RuntimeImages
from elyra.metadata.schemaspaces import Runtimes
from elyra.pipeline.airflow.component_parser_airflow import AirflowComponentParser
from elyra.pipeline.pipeline import GenericOperation
from elyra.pipeline.processor import PipelineProcessor
from elyra.pipeline.processor import PipelineProcessorResponse
from elyra.pipeline.processor import RuntimePipelineProcessor
from elyra.util.git import GithubClient
from elyra.util.path import get_absolute_path


class AirflowPipelineProcessor(RuntimePipelineProcessor):
    _type = 'airflow'

    # Provide users with the ability to identify a writable directory in the
    # running container where the notebook | script is executed. The location
    # must exist and be known before the container is started.
    # Defaults to `/tmp`
    WCD = os.getenv('ELYRA_WRITABLE_CONTAINER_DIR', '/tmp').strip().rstrip('/')

    @property
    def type(self):
        return self._type

    def __init__(self, root_dir, **kwargs):
        super().__init__(root_dir, component_parser=AirflowComponentParser(), **kwargs)

    def process(self, pipeline):
        t0_all = time.time()
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = f'{pipeline.name}-{timestamp}'

        runtime_configuration = self._get_metadata_configuration(schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID,
                                                                 name=pipeline.runtime_config)
        api_endpoint = runtime_configuration.metadata.get('api_endpoint')
        cos_endpoint = runtime_configuration.metadata.get('cos_endpoint')
        cos_bucket = runtime_configuration.metadata.get('cos_bucket')

        github_api_endpoint = runtime_configuration.metadata.get('github_api_endpoint')
        github_repo_token = runtime_configuration.metadata.get('github_repo_token')
        github_repo = runtime_configuration.metadata.get('github_repo')
        github_branch = runtime_configuration.metadata.get('github_branch')

        self.log_pipeline_info(pipeline_name, "Submitting pipeline")
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline_export_path = os.path.join(temp_dir, f'{pipeline_name}.py')

            self.log.debug("Creating temp directory %s", temp_dir)

            pipeline_filepath = self.create_pipeline_file(pipeline=pipeline,
                                                          pipeline_export_format="py",
                                                          pipeline_export_path=pipeline_export_path,
                                                          pipeline_name=pipeline_name)

            self.log.debug("Uploading pipeline file: %s", pipeline_filepath)

            try:
                github_client = GithubClient(server_url=github_api_endpoint,
                                             token=github_repo_token,
                                             repo=github_repo,
                                             branch=github_branch)

            except BaseException as e:
                raise RuntimeError(f'Unable to create a connection to {github_api_endpoint}: {str(e)}') from e

            github_client.upload_dag(pipeline_filepath, pipeline_name)

            self.log.info('Waiting for Airflow Scheduler to process and start the pipeline')

            github_url = github_client.get_github_url(api_url=github_api_endpoint,
                                                      repository_name=github_repo,
                                                      repository_branch=github_branch)

            self.log_pipeline_info(pipeline_name,
                                   f"pipeline pushed to git: {github_url}",
                                   duration=(time.time() - t0_all))

            return AirflowPipelineProcessorResponse(
                git_url=f'{github_url}',
                run_url=f'{api_endpoint}',
                object_storage_url=f'{cos_endpoint}',
                object_storage_path=f'/{cos_bucket}/{pipeline_name}',
            )

    def export(self, pipeline, pipeline_export_format, pipeline_export_path, overwrite):
        if pipeline_export_format not in ["py"]:
            raise ValueError("Pipeline export format {} not recognized.".format(pipeline_export_format))

        timestamp = datetime.now().strftime("%m%d%H%M%S")
        pipeline_name = f'{pipeline.name}-{timestamp}'

        absolute_pipeline_export_path = get_absolute_path(self.root_dir, pipeline_export_path)

        if os.path.exists(absolute_pipeline_export_path) and not overwrite:
            raise ValueError("File " + absolute_pipeline_export_path + " already exists.")

        self.log_pipeline_info(pipeline_name, f"exporting pipeline as a .{pipeline_export_format} file")

        new_pipeline_file_path = self.create_pipeline_file(pipeline=pipeline,
                                                           pipeline_export_format="py",
                                                           pipeline_export_path=absolute_pipeline_export_path,
                                                           pipeline_name=pipeline_name)

        return new_pipeline_file_path

    def _cc_pipeline(self, pipeline, pipeline_name):

        runtime_configuration = self._get_metadata_configuration(schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID,
                                                                 name=pipeline.runtime_config)
        image_namespace = self._get_metadata_configuration(schemaspace=RuntimeImages.RUNTIME_IMAGES_SCHEMASPACE_ID)

        cos_endpoint = runtime_configuration.metadata['cos_endpoint']
        cos_username = runtime_configuration.metadata['cos_username']
        cos_password = runtime_configuration.metadata['cos_password']
        cos_secret = runtime_configuration.metadata.get('cos_secret')
        cos_directory = pipeline_name
        cos_bucket = runtime_configuration.metadata['cos_bucket']

        # Create dictionary that maps component Id to its ContainerOp instance
        target_ops = []

        self.log_pipeline_info(pipeline_name,
                               f"processing pipeline dependencies to: {cos_endpoint} "
                               f"bucket: {cos_bucket} folder: {pipeline_name}")

        t0_all = time.time()

        # Sort operations based on dependency graph (topological order)
        sorted_operations = PipelineProcessor._sort_operations(pipeline.operations)

        # All previous operation outputs should be propagated throughout the pipeline.
        # In order to process this recursively, the current operation's inputs should be combined
        # from its parent's inputs (which, themselves are derived from the outputs of their parent)
        # and its parent's outputs.

        PipelineProcessor._propagate_operation_inputs_outputs(pipeline, sorted_operations)

        for operation in sorted_operations:

            if isinstance(operation, GenericOperation):
                operation_artifact_archive = self._get_dependency_archive_name(operation)

                self.log.debug("Creating pipeline component:\n {op} archive : {archive}".format(
                    op=operation, archive=operation_artifact_archive))

                # Collect env variables
                pipeline_envs = self._collect_envs(operation,
                                                   cos_secret=cos_secret,
                                                   cos_username=cos_username,
                                                   cos_password=cos_password)

                # Generate unique ELYRA_RUN_NAME value and expose it as an
                # environment variable in the container.
                # Notebook | script nodes are implemented using the kubernetes_pod_operator
                # (https://airflow.apache.org/docs/apache-airflow/1.10.12/_api/airflow/contrib/operators/kubernetes_pod_operator/index.html)
                # Environment variables that are passed to this operator are
                # pre-processed by Airflow at runtime and placeholder values (expressed as '{{ xyz }}'
                #  - see https://airflow.apache.org/docs/apache-airflow/1.10.12/macros-ref#default-variables)
                # replaced.
                if pipeline_envs is None:
                    pipeline_envs = {}
                pipeline_envs['ELYRA_RUN_NAME'] = f'{pipeline_name}-{{{{ ts_nodash }}}}'

                image_pull_policy = None
                runtime_image_pull_secret = None
                for image_instance in image_namespace:
                    if image_instance.metadata['image_name'] == operation.runtime_image:
                        if image_instance.metadata.get('pull_policy'):
                            image_pull_policy = image_instance.metadata['pull_policy']
                        if image_instance.metadata.get('pull_secret'):
                            runtime_image_pull_secret = image_instance.metadata['pull_secret']
                        break

                bootscript = BootscriptBuilder(filename=operation.filename,
                                               cos_endpoint=cos_endpoint,
                                               cos_bucket=cos_bucket,
                                               cos_directory=cos_directory,
                                               cos_dependencies_archive=operation_artifact_archive,
                                               inputs=operation.inputs,
                                               outputs=operation.outputs)

                unique_operation_name = self._get_unique_operation_name(operation_name=operation.name,
                                                                        operation_list=target_ops)

                target_op = {'notebook': unique_operation_name,
                             'id': operation.id,
                             'argument_list': bootscript.container_cmd,
                             'runtime_image': operation.runtime_image,
                             'pipeline_envs': pipeline_envs,
                             'parent_operation_ids': operation.parent_operation_ids,
                             'image_pull_policy': image_pull_policy,
                             'cpu_request': operation.cpu,
                             'mem_request': operation.memory,
                             'gpu_request': operation.gpu,
                             'operator_source': operation.component_params['filename'],
                             'is_generic_operator': True
                             }

                if runtime_image_pull_secret is not None:
                    target_op['runtime_image_pull_secret'] = runtime_image_pull_secret

                target_ops.append(target_op)

                self.log_pipeline_info(pipeline_name,
                                       f"processing operation dependencies for id: {operation.id}",
                                       operation_name=operation.name)

                self._upload_dependencies_to_object_store(runtime_configuration,
                                                          pipeline_name,
                                                          operation)

            else:
                # Retrieve component from cache
                component = self._component_registry.get_component(operation.classifier)

                # Convert the user-entered value of certain properties according to their type
                for component_property in component.properties:
                    # Skip properties for which no value was given
                    if component_property.ref not in operation.component_params.keys():
                        continue

                    # Get corresponding property's value from parsed pipeline
                    property_value = operation.component_params.get(component_property.ref)

                    self.log.debug(f"Processing component parameter '{component_property.name}' "
                                   f"of type '{component_property.data_type}'")

                    if component_property.data_type == "string":
                        # Add surrounding quotation marks to string value for correct rendering
                        # in jinja DAG template
                        operation.component_params[component_property.ref] = json.dumps(property_value)
                    elif component_property.data_type == 'dictionary':
                        processed_value = self._process_dictionary_value(property_value)
                        operation.component_params[component_property.ref] = processed_value
                    elif component_property.data_type == 'list':
                        processed_value = self._process_list_value(property_value)
                        operation.component_params[component_property.ref] = processed_value

                # Remove inputs and outputs from params dict until support for data exchange is provided
                operation.component_params_as_dict.pop("inputs")
                operation.component_params_as_dict.pop("outputs")

                # Get component class from operation name
                component_class = operation.classifier.split('_')[-1]

                unique_operation_name = self._get_unique_operation_name(operation_name=operation.name,
                                                                        operation_list=target_ops)

                target_op = {'notebook': unique_operation_name,
                             'id': operation.id,
                             'module_name': component.location.rsplit('/', 1)[-1].split('.')[0],
                             'class_name': component_class,
                             'parent_operation_ids': operation.parent_operation_ids,
                             'component_params': operation.component_params_as_dict,
                             'operator_source': component.location,
                             'is_generic_operator': False
                             }
                if operation.classifier in ['spark-submit-operator', 'spark-jdbc-operator',
                                            'spark-sql-operator', 'ssh-operator']:
                    target_op['is_contrib_operator'] = True

                target_ops.append(target_op)

        ordered_target_ops = OrderedDict()

        while target_ops:
            for i in range(len(target_ops)):
                target_op = target_ops.pop(0)
                if not target_op['parent_operation_ids']:
                    ordered_target_ops[target_op['id']] = target_op
                    self.log.debug("Root Node added : %s", ordered_target_ops[target_op['id']])
                elif all(deps in ordered_target_ops.keys() for deps in target_op['parent_operation_ids']):
                    ordered_target_ops[target_op['id']] = target_op
                    self.log.debug("Dependent Node added : %s", ordered_target_ops[target_op['id']])
                else:
                    target_ops.append(target_op)

        self.log_pipeline_info(pipeline_name, "pipeline dependencies processed", duration=(time.time() - t0_all))

        return ordered_target_ops

    def create_pipeline_file(self, pipeline, pipeline_export_format, pipeline_export_path, pipeline_name):

        self.log.info('Creating pipeline definition as a .' + pipeline_export_format + ' file')
        if pipeline_export_format == "json":
            with open(pipeline_export_path, 'w', encoding='utf-8') as file:
                json.dump(pipeline_export_path, file, ensure_ascii=False, indent=4)
        else:
            # Load template from installed elyra package
            loader = PackageLoader('elyra', 'templates/airflow')
            template_env = Environment(loader=loader)

            template_env.filters['regex_replace'] = lambda string: re.sub("[-!@#$%^&*(){};:,/<>?|`~=+ ]",
                                                                          "_",
                                                                          string)  # nopep8 E731

            template = template_env.get_template('airflow_template.jinja2')

            target_ops = self._cc_pipeline(pipeline, pipeline_name)
            runtime_configuration = self._get_metadata_configuration(schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_ID,
                                                                     name=pipeline.runtime_config)
            user_namespace = runtime_configuration.metadata.get('user_namespace') or 'default'
            cos_secret = runtime_configuration.metadata.get('cos_secret')

            pipeline_description = pipeline.description
            if pipeline_description is None:
                pipeline_description = f"Created with Elyra {__version__} pipeline editor using `{pipeline.source}`."

            python_output = template.render(operations_list=target_ops,
                                            pipeline_name=pipeline_name,
                                            namespace=user_namespace,
                                            cos_secret=cos_secret,
                                            kube_config_path=None,
                                            is_paused_upon_creation='False',
                                            in_cluster='True',
                                            pipeline_description=pipeline_description)

            # Write to python file and fix formatting
            with open(pipeline_export_path, "w") as fh:
                # Defer the import to postpone logger messages: https://github.com/psf/black/issues/2058
                import black
                autopep_output = autopep8.fix_code(python_output)
                output_to_file = black.format_str(autopep_output, mode=black.FileMode())
                fh.write(output_to_file)

        return pipeline_export_path

    def _get_unique_operation_name(self, operation_name: str, operation_list: list) -> str:
        unique_name_counter = 1
        unique_operation_name = operation_name
        names = [op['notebook'] for op in operation_list]
        while unique_operation_name in names:
            unique_name_counter += 1
            unique_operation_name = ''.join([operation_name, '_', str(unique_name_counter)])

        return unique_operation_name

    def _process_dictionary_value(self, value: str) -> Union[Dict, str]:
        """
        For component parameters of type dictionary, if a string value is returned from the superclass
        method, it must be converted to include surrounding quotation marks for correct rendering
        in jinja DAG template.
        """
        converted_value = super()._process_dictionary_value(value)
        if isinstance(converted_value, str):
            converted_value = json.dumps(converted_value)
        return converted_value

    def _process_list_value(self, value: str) -> Union[List, str]:
        """
        For component parameters of type list, if a string value is returned from the superclass
        method, it must be converted to include surrounding quotation marks for correct rendering
        in jinja DAG template.
        """
        converted_value = super()._process_list_value(value)
        if isinstance(converted_value, str):
            converted_value = json.dumps(converted_value)
        return converted_value


class AirflowPipelineProcessorResponse(PipelineProcessorResponse):

    _type = 'airflow'

    def __init__(self, git_url, run_url, object_storage_url, object_storage_path):
        super().__init__(run_url, object_storage_url, object_storage_path)
        self.git_url = git_url

    @property
    def type(self):
        return self._type

    def to_json(self):
        response = super().to_json()
        response['git_url'] = self.git_url
        return response
