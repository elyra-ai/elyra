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
import warnings

from yaspin import yaspin
from colorama import Fore, Style

from elyra import __version__
from elyra.pipeline import PipelineParser, PipelineProcessorManager
from elyra.metadata import MetadataManager


def _get_runtime_type(runtime_config: str) -> str:
    try:
        metadata_manager = MetadataManager(namespace='runtimes')
        metadata = metadata_manager.get(runtime_config)
        return metadata.schema_name
    except Exception as e:
        raise click.ClickException(f'Invalid runtime configuration: {runtime_config}\n {e}')


def _validate_pipeline_file(pipeline_file):
    extension = os.path.splitext(pipeline_file)[1]
    if extension != '.pipeline':
        raise click.ClickException('Pipeline file should be a [.pipeline] file.\n')


def _preprocess_pipeline(pipeline_path, runtime, runtime_config):
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

    try:
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
    except Exception as e:
        raise click.ClickException(f"Error pre-processing pipeline: \n {e}")

    return pipeline_definition


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

    _validate_pipeline_file(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime=runtime, runtime_config=runtime_config)

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

    _validate_pipeline_file(pipeline_path)

    pipeline_definition = \
        _preprocess_pipeline(pipeline_path, runtime='local', runtime_config='local')

    _execute_pipeline(pipeline_definition)

    click.echo()

    print_banner("Elyra Pipeline Local Run Complete")


pipeline.add_command(submit)
pipeline.add_command(run)
