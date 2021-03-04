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
import requests

from yaspin import yaspin
from colorama import Fore, Style

from elyra import __version__
from elyra.pipeline import PipelineParser, PipelineProcessorManager
from jupyter_server.serverapp import list_running_servers


def _preprocess_pipeline(pipeline_path, runtime, runtime_config, work_dir):
    pipeline_path = os.path.expanduser(pipeline_path)
    working_dir = os.path.expanduser(work_dir)
    pipeline_abs_path = os.path.join(working_dir, pipeline_path)
    pipeline_dir = os.path.dirname(pipeline_abs_path)
    pipeline_name = os.path.splitext(os.path.basename(pipeline_abs_path))[0]

    with open(pipeline_abs_path) as f:
        pipeline_definition = json.load(f)

    for pipeline in pipeline_definition["pipelines"]:
        for node in pipeline["nodes"]:
            if node["app_data"]["filename"]:
                abs_path = os.path.join(os.getcwd(), pipeline_dir, node["app_data"]["filename"])
                node["app_data"]["filename"] = abs_path

    # NOTE: The frontend just set the info for first pipeline, but shouldn't it
    # search for the primary pipeline and set that?
    # Setting `pipeline_definition["pipelines"][0]` for consistency.
    pipeline_definition["pipelines"][0]["app_data"]["name"] = pipeline_name
    pipeline_definition["pipelines"][0]["app_data"]["runtime"] = runtime
    pipeline_definition["pipelines"][0]["app_data"]["runtime-config"] = runtime_config

    return pipeline_definition


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
@click.argument('pipeline')
@click.option('--runtime',
              required=False,
              type=click.Choice(['local', 'kfp', 'airflow'], case_sensitive=False),
              default='local',
              help='Runtime type where the pipeline should be processed')
@click.option('--runtime-config',
              required=False,
              default='local',
              help='Runtime config where the pipeline should be processed')
@click.option('--work-dir',
              required=False,
              default=os.getcwd(),
              help='Base working directory for finding pipeline dependencies')
def submit(pipeline, runtime, runtime_config, work_dir):
    """
    Submit a pipeline to be executed on the server
    """

    click.echo()

    print_banner("Elyra Pipeline Submission")

    pipeline_definition = \
        _preprocess_pipeline(pipeline, runtime=runtime, runtime_config=runtime_config, work_dir=work_dir)

    try:
        running_servers = list(list_running_servers())
        if len(running_servers) == 0:
            click.echo('Could not discover a running Jupyter Notebook server\n')
            return

        serverinfo = running_servers[0]
        server_url = f'{serverinfo["url"]}?token={serverinfo["token"]}'
        server_api_url = f'{serverinfo["url"]}elyra/pipeline/schedule'

        with requests.Session() as session:
            session.get(server_url)
            xsfr_header = {'X-XSRFToken': session.cookies.get('_xsrf')}
            with yaspin(text="Executing pipeline on the server..."):
                session.post(url=server_api_url,
                             data=json.dumps(pipeline_definition),
                             headers=xsfr_header)
    except RuntimeError as re:
        click.echo(f'Error parsing pipeline: \n {re} \n {re.__cause__}')
        click.echo(re)
        if re.__cause__:
            click.echo("  - {}".format(re.__cause__))
        return

    print_banner("Elyra pipeline execution complete")


@click.command()
@click.argument('pipeline')
@click.option('--work-dir',
              required=False,
              default=os.getcwd(),
              help='Base working directory for finding pipeline dependencies')
def run(pipeline, work_dir):
    """
    Run a pipeline in your local environment
    """
    click.echo()

    print_banner("Elyra Pipeline Local Run")

    pipeline_definition = \
        _preprocess_pipeline(pipeline, runtime='local', runtime_config='local', work_dir=work_dir)

    try:
        pipeline_object = PipelineParser().parse(pipeline_definition)

        asyncio.get_event_loop().run_until_complete(PipelineProcessorManager.instance().process(pipeline_object))
    except ValueError as ve:
        print(f'Error parsing pipeline: \n {ve}')
        raise ve
    except RuntimeError as re:
        print(f'Error parsing pipeline: \n {re} \n {re.__cause__}')
        raise re

    click.echo()

    print_banner("Elyra Pipeline Local Run Complete")


pipeline.add_command(submit)
pipeline.add_command(run)
