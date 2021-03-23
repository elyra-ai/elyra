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
import click
import json
import os

from yaspin import yaspin
from colorama import Fore, Style

from elyra import __version__
from elyra.pipeline import PipelineParser, PipelineProcessorManager


# TODO: Is there a place to get this version number already?
CURRENT_PIPELINE_VERSION = 3


def _validate_pipeline_file(pipeline_file):
    extension = os.path.splitext(pipeline_file)[1]
    if extension != '.pipeline':
        click.echo('Pipeline file should be a [.pipeline] file.\n')
        raise click.Abort()


def _validate_pipeline_contents(pipeline_contents):
    if 'primary_pipeline' not in pipeline_contents:
        click.echo("Pipeline file is invalid: \n Missing field 'primary_pipeline'")
        raise click.Abort()

    if not isinstance(pipeline_contents["primary_pipeline"], str):
        click.echo("Pipeline file is invalid: \n Field 'primary_pipeline' should be a string")
        raise click.Abort()

    if 'pipelines' not in pipeline_contents:
        click.echo("Pipeline file is invalid: \n Missing field 'pipelines'")
        raise click.Abort()

    if not isinstance(pipeline_contents["pipelines"], list):
        click.echo("Pipeline file is invalid: \n Field 'pipelines' should be a list")
        raise click.Abort()

    try:
        found_primary_pipeline = next(
            x for x in pipeline_contents["pipelines"] if x["id"] == pipeline_contents["primary_pipeline"])
    except StopIteration:
        click.echo("Pipeline file is invalid: \n Primary pipeline does not exist")
        raise click.Abort()

    if 'app_data' not in found_primary_pipeline:
        click.echo("Pipeline file is invalid: \n Primary pipeline is missing field 'app_data'")
        raise click.Abort()

    if 'version' not in found_primary_pipeline["app_data"]:
        click.echo("Pipeline file is invalid: \n Primary pipeline is missing field 'app_data.version'")
        raise click.Abort()

    if found_primary_pipeline["app_data"]["version"] != CURRENT_PIPELINE_VERSION:
        click.echo("Pipeline file is invalid: \n Primary pipeline version is incompatible")
        raise click.Abort()

    if 'nodes' not in found_primary_pipeline:
        click.echo("Pipeline file is invalid: \n Primary pipeline is missing field 'nodes'")
        raise click.Abort()

    if not isinstance(found_primary_pipeline["nodes"], list):
        click.echo("Pipeline file is invalid: \n Primary pipeline field 'nodes' should be a list")
        raise click.Abort()


def _preprocess_pipeline(pipeline_path, runtime, runtime_config):
    pipeline_path = os.path.expanduser(pipeline_path)
    pipeline_abs_path = os.path.join(os.getcwd(), pipeline_path)
    pipeline_dir = os.path.dirname(pipeline_abs_path)
    pipeline_name = os.path.splitext(os.path.basename(pipeline_abs_path))[0]

    if not os.path.exists(pipeline_abs_path):
        click.echo(f"Pipeline file not found: '{pipeline_abs_path}'\n")
        raise click.Abort()

    with open(pipeline_abs_path) as f:
        try:
            pipeline_definition = json.load(f)
        except ValueError as ve:
            click.echo(f"Pipeline file is invalid: \n {ve}")
            raise click.Abort()

    _validate_pipeline_contents(pipeline_definition)

    for pipeline in pipeline_definition["pipelines"]:
        for node in pipeline["nodes"]:
            if 'filename' in node["app_data"]:
                abs_path = os.path.join(pipeline_dir, node["app_data"]["filename"])
                node["app_data"]["filename"] = abs_path

    # NOTE: The frontend just set the info for first pipeline, but shouldn't it
    # search for the primary pipeline and set that?
    # Setting `pipeline_definition["pipelines"][0]` for consistency.
    pipeline_definition["pipelines"][0]["app_data"]["name"] = pipeline_name
    pipeline_definition["pipelines"][0]["app_data"]["runtime"] = runtime
    pipeline_definition["pipelines"][0]["app_data"]["runtime-config"] = runtime_config

    return pipeline_definition


def _execute_pipeline(pipeline_definition):
    try:
        with yaspin(text="Processing pipeline ..."):
            # parse pipeline
            pipeline_object = PipelineParser().parse(pipeline_definition)
            # process pipeline
            asyncio.get_event_loop().run_until_complete(PipelineProcessorManager.instance().process(pipeline_object))
    except ValueError as ve:
        click.echo(f'Error parsing pipeline: \n {ve}')
        raise click.Abort
    except RuntimeError as re:
        click.echo(f'Error processing pipeline: \n {re} \n {re.__cause__}')
        raise click.Abort


def print_banner(title):
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "  {}".format(title) + Style.RESET_ALL)
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
@click.option('--runtime',
              required=True,
              type=click.Choice(['kfp', 'airflow'], case_sensitive=False),
              help='Runtime type where the pipeline should be processed')
@click.option('--runtime-config',
              required=True,
              help='Runtime config where the pipeline should be processed')
def submit(pipeline_path, runtime, runtime_config):
    """
    Submit a pipeline to be executed on the server
    """

    click.echo()

    print_banner("Elyra Pipeline Submission")

    _validate_pipeline_file(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime=runtime, runtime_config=runtime_config)

    _execute_pipeline(pipeline_definition)

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

    _validate_pipeline_file(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime='local', runtime_config='local')

    _execute_pipeline(pipeline_definition)

    click.echo()

    print_banner("Elyra Pipeline Local Run Complete")


pipeline.add_command(submit)
pipeline.add_command(run)
