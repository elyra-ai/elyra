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

import asyncio
from collections import OrderedDict
import json
from operator import itemgetter
import os
from typing import Optional
import warnings

import click
from colorama import Fore
from colorama import Style
from yaspin import yaspin

from elyra._version import __version__
from elyra.metadata.manager import MetadataManager
from elyra.metadata.schema import SchemaManager
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline_definition import Pipeline
from elyra.pipeline.pipeline_definition import PipelineDefinition
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.processor import PipelineProcessorResponse
from elyra.pipeline.validation import PipelineValidationManager
from elyra.pipeline.validation import ValidationSeverity


SEVERITY = {ValidationSeverity.Error: 'Error',
            ValidationSeverity.Warning: 'Warning',
            ValidationSeverity.Hint: 'Hint',
            ValidationSeverity.Information: 'Information'}


def _get_runtime_type(runtime_config: Optional[str]) -> Optional[str]:
    if not runtime_config or runtime_config == 'local':
        # No runtime configuration was  specified or it is local.
        # Cannot use metadata manager to determine the runtime type.
        return runtime_config

    if runtime_config == 'local':
        return runtime_config

    try:
        metadata_manager = MetadataManager(schemaspace='runtimes')
        metadata = metadata_manager.get(runtime_config)
        return metadata.schema_name
    except Exception as e:
        raise click.ClickException(f'Invalid runtime configuration: {runtime_config}\n {e}')


def _get_runtime_display_name(schema_name: Optional[str]) -> Optional[str]:
    if not schema_name or schema_name == 'local':
        # No schame name was  specified or it is local.
        # Cannot use metadata manager to determine the display name.
        return schema_name

    try:
        schema_manager = SchemaManager.instance()
        schema = schema_manager.get_schema('runtimes', schema_name)
        return schema['display_name']
    except Exception as e:
        raise click.ClickException(f'Invalid runtime configuration: {schema_name}\n {e}')


def _validate_pipeline_runtime(primary_pipeline: Pipeline, runtime: str) -> bool:
    """
    Generic pipelines do not have a persisted runtime type, and can be run on any runtime
    Runtime specific pipeline have a runtime type, and can only be run on matching runtime
    """
    is_valid = True
    if runtime:  # Only perform validation if a target runtime has been specified
        pipeline_runtime = primary_pipeline.runtime
        if pipeline_runtime and pipeline_runtime != runtime:
            is_valid = False

    return is_valid


def _validate_pipeline_file_extension(pipeline_file: str):
    extension = os.path.splitext(pipeline_file)[1]
    if extension != '.pipeline':
        raise click.ClickException('Pipeline file should be a [.pipeline] file.\n')


def _preprocess_pipeline(pipeline_path: str,
                         runtime: Optional[str] = None,
                         runtime_config: Optional[str] = None) -> dict:
    pipeline_path = os.path.expanduser(pipeline_path)
    pipeline_abs_path = os.path.join(os.getcwd(), pipeline_path)
    pipeline_dir = os.path.dirname(pipeline_abs_path)
    pipeline_name = os.path.splitext(os.path.basename(pipeline_abs_path))[0]

    if not os.path.exists(pipeline_abs_path):
        raise click.ClickException(f"Pipeline file not found: '{pipeline_abs_path}'\n")

    try:
        pipeline_definition = PipelineDefinition(pipeline_abs_path)
    except ValueError as ve:
        raise click.ClickException(f"Pipeline file is invalid: \n {ve}")

    try:
        primary_pipeline = pipeline_definition.primary_pipeline
    except Exception as e:
        raise click.ClickException(e)

    try:
        for pipeline in pipeline_definition.pipelines:
            for node in pipeline.nodes:
                filename = node.get_component_parameter('filename')
                if filename:
                    abs_path = os.path.join(pipeline_dir, filename)
                    node.set_component_parameter("filename", abs_path)

    except Exception as e:
        raise click.ClickException(f"Error pre-processing pipeline: \n {e}")

    # update pipeline transient fields
    primary_pipeline.set("name", pipeline_name)
    primary_pipeline.set("source", os.path.basename(pipeline_abs_path))
    # Only update the following if values were provided
    if runtime:
        primary_pipeline.set("runtime", runtime)
    if runtime_config:
        primary_pipeline.set("runtime-config", runtime_config)

    return pipeline_definition.to_dict()


def _print_issues(issues):
    # print validation issues

    for issue in sorted(issues, key=itemgetter('severity')):
        severity = f" [{SEVERITY[issue.get('severity')]}]"
        prefix = ''
        postfix = ''
        if issue.get('data'):
            if issue['data'].get('nodeName'):
                # issue is associated with a single node; display it
                prefix = f"[{issue['data'].get('nodeName')}]"
            if issue['data'].get('propertyName'):
                # issue is associated with a node property; display it
                prefix = f"{prefix}[{issue['data'].get('propertyName')}]"
            if issue['data'].get('value'):
                # issue is caused by the value of a node property; display it
                postfix = f"The current property value is '{issue['data'].get('value')}'."
            elif issue['data'].get('nodeNames') and isinstance(issue['data']['nodeNames'], list):
                # issue is associated with multiple nodes
                postfix = 'Nodes: '
                separator = ''
                for nn in issue['data']['nodeNames']:
                    postfix = f"{postfix}{separator}'{nn}'"
                    separator = ', '
        output = f"{severity}{prefix} - {issue['message']} {postfix}"
        click.echo(output)

    click.echo("")


def _validate_pipeline_definition(pipeline_definition):

    click.echo("Validating pipeline...")
    # validate pipeline
    validation_response = asyncio.get_event_loop().run_until_complete(
        PipelineValidationManager.instance().validate(pipeline=pipeline_definition))

    # print validation issues
    issues = validation_response.to_json().get('issues')
    _print_issues(issues)

    if validation_response.has_fatal:
        raise click.ClickException("Pipeline validation FAILED. The pipeline was not submitted for execution.")


def _execute_pipeline(pipeline_definition) -> PipelineProcessorResponse:
    try:
        # parse pipeline
        pipeline_object = PipelineParser().parse(pipeline_definition)
        # process pipeline
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            response = asyncio.get_event_loop().run_until_complete(
                PipelineProcessorManager.instance().process(pipeline_object))
            return response
    except ValueError as ve:
        raise click.ClickException(f'Error parsing pipeline: \n {ve}')
    except RuntimeError as re:
        raise click.ClickException(f'Error processing pipeline: \n {re} \n {re.__cause__}')


def print_banner(title):
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo(Fore.CYAN + " {}".format(title) + Style.RESET_ALL)
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo()


def print_info(title, info_list):
    click.echo(Fore.CYAN + "❯ {}".format(title) + Style.RESET_ALL)
    for info_item in info_list:
        if isinstance(info_item, str):
            click.echo("  {}".format(info_item))
        else:
            click.echo("  {}: {}".format(info_item[0], info_item[1]))
    click.echo()


def print_version():
    print_info("Version", ["elyra {}".format(__version__)])


@click.group()
@click.version_option(__version__, message='v%(version)s')
def pipeline():
    """
    Run Elyra pipelines in your local environment or submit them to an external service,
    such as Kubeflow Pipelines or Apache Airflow.

    Find more information at: https://elyra.readthedocs.io/en/latest/
    """
    pass


@click.command()
@click.option('--runtime-config',
              required=False,
              help='Runtime config where the pipeline should be processed')
@click.argument('pipeline_path')
def validate(pipeline_path, runtime_config='local'):
    """
    Validate pipeline
    """
    click.echo()

    print_banner("Elyra Pipeline Validation")

    runtime = _get_runtime_type(runtime_config)

    _validate_pipeline_file_extension(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime=runtime, runtime_config=runtime_config)

    _validate_pipeline_definition(pipeline_definition)


@click.command()
@click.argument('pipeline_path')
@click.option('--json',
              'json_option',
              is_flag=True,
              required=False,
              help='Display pipeline summary in JSON format')
@click.option('--runtime-config',
              required=True,
              help='Runtime config where the pipeline should be processed')
def submit(json_option, pipeline_path, runtime_config):
    """
    Submit a pipeline to be executed on the server
    """

    click.echo()

    print_banner("Elyra Pipeline Submission")

    runtime = _get_runtime_type(runtime_config)

    _validate_pipeline_file_extension(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime=runtime, runtime_config=runtime_config)

    _validate_pipeline_definition(pipeline_definition)

    with yaspin(text="Submitting pipeline..."):
        response: PipelineProcessorResponse = _execute_pipeline(pipeline_definition)

    if not json_option:
        if response:
            msg = []
            # If there's a git_url attr, assume Apache Airflow DAG repo.
            # TODO: this will need to be revisited once front-end is decoupled from runtime platforms.
            if hasattr(response, 'git_url'):
                msg.append(f"Apache Airflow DAG has been pushed to: {response.git_url}")
            msg.extend(
                [
                    f"Check the status of your job at: {response.run_url}",
                    f"The results and outputs are in the {response.object_storage_path} ",
                    f"working directory in {response.object_storage_url}"
                ]
            )
            print_info("Job submission succeeded", msg)
        click.echo()
        print_banner("Elyra Pipeline Submission Complete")
    else:
        if response:
            click.echo()
            print(json.dumps(response.to_json(), indent=4))


@click.command()
@click.option('--json',
              'json_option',
              is_flag=True,
              required=False,
              help='Display pipeline summary in JSON format')
@click.argument('pipeline_path')
def run(json_option, pipeline_path):
    """
    Run a pipeline in your local environment
    """
    click.echo()

    print_banner("Elyra Pipeline Local Run")

    _validate_pipeline_file_extension(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime='local', runtime_config='local')

    _validate_pipeline_definition(pipeline_definition)

    response = _execute_pipeline(pipeline_definition)

    if not json_option:
        click.echo()
        print_banner("Elyra Pipeline Local Run Complete")
    else:
        click.echo()
        if response:
            print(json.dumps(response.to_json(), indent=4))


@click.command()
@click.option('--json',
              'json_option',
              is_flag=True,
              required=False,
              help='Display pipeline summary in JSON format')
@click.argument('pipeline_path')
def describe(json_option, pipeline_path):
    """
    Display pipeline summary
    """

    click.echo()

    print_banner("Elyra Pipeline details")

    indent_length = 4
    blank_field = "Not Specified"
    blank_list = ["None Listed"]
    pipeline_keys = ["name", "description", "type", "version", "nodes", "file_dependencies"]
    iter_keys = {"file_dependencies"}

    _validate_pipeline_file_extension(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime='local', runtime_config='local')

    primary_pipeline = PipelineDefinition(pipeline_definition=pipeline_definition).primary_pipeline

    describe_dict = OrderedDict()

    describe_dict["name"] = primary_pipeline.name
    describe_dict["description"] = primary_pipeline.get_property('description')
    describe_dict["type"] = primary_pipeline.type
    describe_dict["version"] = primary_pipeline.version
    describe_dict["nodes"] = len(primary_pipeline.nodes)
    describe_dict["file_dependencies"] = set()
    for node in primary_pipeline.nodes:
        for dependency in node.get_component_parameter("dependencies", []):
            describe_dict["file_dependencies"].add(f"{dependency}")

    if not json_option:
        for key in pipeline_keys:
            readable_key = ' '.join(key.title().split('_'))
            if key in iter_keys:
                click.echo(f"{readable_key}:")
                if describe_dict.get(key, set()) == set():
                    click.echo(f"{' ' * indent_length}{blank_list[0]}")
                else:
                    for item in describe_dict.get(key, blank_list):
                        click.echo(f"{' ' * indent_length}{item}")
            else:
                click.echo(f"{readable_key}: {describe_dict.get(key, blank_field)}")
    else:
        for key in iter_keys:
            describe_dict[key] = list(describe_dict[key])
        for key in pipeline_keys:
            value = describe_dict.get(key)
            if value is None or (key in iter_keys and len(value) == 0):
                describe_dict.pop(key)
        click.echo(json.dumps(describe_dict, indent=indent_length))


pipeline.add_command(describe)
pipeline.add_command(validate)
pipeline.add_command(submit)
pipeline.add_command(run)
