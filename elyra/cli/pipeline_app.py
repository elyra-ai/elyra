#
# Copyright 2018-2020 Elyra Authors
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
import json
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
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.validate import PipelineValidationManager
from elyra.pipeline.validate import ValidationSeverity

# TODO: Make pipeline version available more widely
# as today is only available on the pipeline editor
PIPELINE_CURRENT_VERSION = 4


def _get_runtime_type(runtime_config: Optional[str]) -> Optional[str]:
    if not runtime_config:
        return None

    try:
        metadata_manager = MetadataManager(namespace='runtimes')
        metadata = metadata_manager.get(runtime_config)
        return metadata.schema_name
    except Exception as e:
        raise click.ClickException(f'Invalid runtime configuration: {runtime_config}\n {e}')


def _get_runtime_display_name(runtime_config: Optional[str]) -> Optional[str]:
    if not runtime_config:
        return None

    try:
        schema_manager = SchemaManager.instance()
        schema_name = _get_runtime_type(runtime_config)
        schema = schema_manager.get_schema('runtimes', schema_name)
        return schema['display_name']
    except Exception as e:
        raise click.ClickException(f'Invalid runtime configuration: {runtime_config}\n {e}')


def _validate_pipeline_runtime(primary_pipeline: dict, runtime: str) -> bool:
    """
    Generic pipelines do not have a persisted runtime type, and can be run on any runtime
    Runtime specific pipeline have a runtime type, and con only be run on matching runtime
    """
    is_valid = False
    pipeline_runtime = primary_pipeline["app_data"].get("runtime")
    if not pipeline_runtime:
        is_valid = True
    else:
        if runtime and pipeline_runtime == runtime:
            is_valid = True

    return is_valid


def _validate_pipeline_file_extension(pipeline_file: str):
    extension = os.path.splitext(pipeline_file)[1]
    if extension != '.pipeline':
        raise click.ClickException('Pipeline file should be a [.pipeline] file.\n')


def _preprocess_pipeline(pipeline_path: str, runtime: str, runtime_config: str) -> dict:
    pipeline_path = os.path.expanduser(pipeline_path)
    pipeline_abs_path = os.path.join(os.getcwd(), pipeline_path)
    pipeline_dir = os.path.dirname(pipeline_abs_path)
    pipeline_name = os.path.splitext(os.path.basename(pipeline_abs_path))[0]

    if not os.path.exists(pipeline_abs_path):
        raise click.ClickException(f"Pipeline file not found: '{pipeline_abs_path}'\n")

    with open(pipeline_abs_path) as f:
        try:
            pipeline_definition = json.load(f)
        except ValueError as ve:
            raise click.ClickException(f"Pipeline file is invalid: \n {ve}")

    if 'pipelines' not in pipeline_definition:
        raise click.ClickException("Pipeline is missing 'pipelines' field.")
    if len(pipeline_definition['pipelines']) == 0:
        raise click.ClickException("Pipeline has zero length 'pipelines' field.")

    # Find primary pipeline
    primary_pipeline_key = pipeline_definition['primary_pipeline']
    primary_pipeline = None

    for pipeline in pipeline_definition["pipelines"]:
        if pipeline['id'] == primary_pipeline_key:
            primary_pipeline = pipeline

    assert primary_pipeline is not None, f"No primary pipeline was found in {pipeline_path}"

    pipeline_version = int(primary_pipeline["app_data"]["version"])
    if pipeline_version < PIPELINE_CURRENT_VERSION:
        # Pipeline needs to be migrated
        raise click.ClickException(f'Pipeline version {pipeline_version} is out of date and needs to be migrated '
                                   f'using the Elyra pipeline editor.')
    elif pipeline_version > PIPELINE_CURRENT_VERSION:
        # New version of Elyra is needed
        raise click.ClickException('Pipeline was last edited in a newer version of Elyra. '
                                   'Update Elyra to use this pipeline.')

    try:
        for pipeline in pipeline_definition["pipelines"]:
            for node in pipeline["nodes"]:
                if 'filename' in node["app_data"]["component_parameters"]:
                    abs_path = os.path.join(pipeline_dir, node["app_data"]["component_parameters"]["filename"])
                    node["app_data"]["component_parameters"]["filename"] = abs_path

    except Exception as e:
        raise click.ClickException(f"Error pre-processing pipeline: \n {e}")

    if not _validate_pipeline_runtime(primary_pipeline, runtime):
        runtime_description = primary_pipeline['app_data']['ui_data']['runtime']['display_name']
        runtime_config_display_name = _get_runtime_display_name(runtime_config)
        raise click.ClickException(
            f"This pipeline requires an instance of {runtime_description} runtime configuration.\n"
            f"The specified configuration '{runtime_config}' is for {runtime_config_display_name} runtime.")

    # update pipeline transient fields
    primary_pipeline["app_data"]["name"] = pipeline_name
    primary_pipeline["app_data"]["runtime"] = runtime
    primary_pipeline["app_data"]["runtime-config"] = runtime_config
    primary_pipeline["app_data"]["source"] = os.path.basename(pipeline_abs_path)

    return pipeline_definition


def _print_issues(issues):
    # print validation issues
    for issue in issues:
        if issue.get('severity') == ValidationSeverity.Error:
            click.echo(
                f'- (Fatal error on node \'{issue["data"]["nodeName"]}\' property \'{issue["data"]["propertyName"]}\') '
                f'- {issue["message"]}')
        else:
            # TODO check warning nodeNames are empty
            click.echo(
                f'- (Warning) - {issue["message"]}')

    click.echo("")


def _validate_pipeline_definition(pipeline_definition):
    # validate pipeline
    validation_response = asyncio.get_event_loop().run_until_complete(
        PipelineValidationManager.instance().validate(pipeline=pipeline_definition))

    if validation_response.has_fatal:
        click.echo('Pipeline validation FAILED:')

        # print validation issues
        issues = validation_response.to_json().get('issues')
        _print_issues(issues)

        raise click.ClickException("Error validating pipeline.")
    else:
        click.echo('Pipeline validation WARNINGS:')

        # print validation issues
        issues = validation_response.to_json().get('issues')
        _print_issues(issues)


def _execute_pipeline(pipeline_definition):
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
@click.argument('pipeline_path')
@click.option('--runtime-config',
              required=True,
              help='Runtime config where the pipeline should be processed')
def submit(pipeline_path, runtime_config):
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
        response = _execute_pipeline(pipeline_definition)

    if response:
        print_info("Job submission succeeded",
                   [
                       f"Check the status of your job at: {response._run_url}",
                       f"The results and outputs are in the {response._object_storage_path} ",
                       f"working directory in {response._object_storage_url}"
                   ])

    click.echo()

    print_banner("Elyra Pipeline Submission Complete")


@click.command()
@click.argument('pipeline_path')
def run(pipeline_path):
    """
    Run a pipeline in your local environment
    """

    click.echo()

    print_banner("Elyra Pipeline Local Run")

    _validate_pipeline_file_extension(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime='local', runtime_config='local')

    _validate_pipeline_definition(pipeline_definition)

    _execute_pipeline(pipeline_definition)

    click.echo()

    print_banner("Elyra Pipeline Local Run Complete")


pipeline.add_command(submit)
pipeline.add_command(run)
