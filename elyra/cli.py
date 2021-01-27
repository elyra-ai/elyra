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
import os
import json
import asyncio
import warnings

import click
from yaspin import yaspin
from colorama import Fore, Style

from ._version import __version__
from .pipeline.parser import PipelineParser
from .pipeline.processor import PipelineProcessorManager
from .pipeline.pipeline import Pipeline


async def submit_pipeline(pipeline):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        response = await PipelineProcessorManager.instance().process(pipeline)

    return response.to_json()


def parse(pipeline_definitions, pipeline_object):
    if 'primary_pipeline' not in pipeline_definitions:
        raise ValueError("Invalid pipeline: Could not determine the primary pipeline.")
    if 'pipelines' not in pipeline_definitions:
        raise ValueError("Invalid pipeline: Pipeline definition not found.")

    primary_pipeline_id = pipeline_definitions['primary_pipeline']
    primary_pipeline = PipelineParser._get_pipeline_definition(pipeline_definitions, primary_pipeline_id)
    if not primary_pipeline:
        raise ValueError("Invalid pipeline: Primary pipeline '{}' not found.".format(primary_pipeline_id))

    PipelineParser()._nodes_to_operations(pipeline_definitions, pipeline_object, primary_pipeline['nodes'])
    return pipeline_object


def prepare_pipeline(pipeline_path, name=None, runtime='local', runtime_config='local'):
    pipeline_abs_path = os.path.join(os.getcwd(), pipeline_path)
    pipeline_dir = os.path.dirname(pipeline_abs_path)

    if name is None:
        name = os.path.splitext(os.path.basename(pipeline_abs_path))[0]

    with open(pipeline_abs_path) as f:
        pipeline_definition = json.load(f)

    for pipeline in pipeline_definition["pipelines"]:
        for node in pipeline["nodes"]:
            if node["app_data"]["filename"]:
                abs_path = os.path.join(os.getcwd(), pipeline_dir, node["app_data"]["filename"])
                node["app_data"]["filename"] = abs_path
    
    pipeline_object = Pipeline(id=id, name=name, runtime=runtime, runtime_config=runtime_config)

    pipeline = parse(pipeline_definition, pipeline_object)

    return pipeline


# # elyra add runtime
# # elyra get/list runtimes
# # elyra remove/delete runtime <runtime>
# # elyra replace runtime <runtime>
# # elyra set/use runtime <runtime>
# # elyra run <path-to.pipeline>
# # elyra submit <path-to.pipeline> [--name]


@click.group()
def cli():
    pass


@click.command()
@click.argument('resource')
# Runtime configuration settings
@click.option('--display_name', prompt=True)
@click.option('--name', prompt=True)
@click.option('--description', prompt=True)
@click.option('--tags', prompt=True)
# Kubeflow Pipelines settings
@click.option('--api_endpoint', prompt=True)
@click.option('--user_namespace', prompt=True)
@click.option('--api_username', prompt=True)
@click.option('--api_password', prompt=True)
@click.option('--engine', prompt=True)
# Cloud Storage settings
@click.option('--cos_endpoint', prompt=True)
@click.option('--cos_username', prompt=True)
@click.option('--cos_password', prompt=True)
@click.option('--cos_bucket', prompt=True)
def add(resource):
    """TODO: Description"""
    print("add")
    return


@click.command()
@click.argument('resource')
def get(resource):
    """TODO: Description"""
    print("get")
    return


@click.command()
@click.argument('resource')
@click.argument('name')
def remove(resource, name):
    """TODO: Description"""
    print("remove")
    return


@click.command()
@click.argument('resource')
@click.argument('name')
def replace(resource, name):
    """TODO: Description"""
    print("replace")
    return


@click.command()
@click.argument('resource')
@click.argument('name')
def use(resource, name):
    """TODO: Description"""
    print("use")
    return


@click.command()
@click.argument('pipeline_path', type=click.Path(exists=True))
@click.option('-n', '--name')
def submit(pipeline_path, name):
    """TODO: Description"""
    click.echo()

    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "  Elyra Pipeline Submission" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo()

    click.echo(Fore.CYAN + "❯ Version" + Style.RESET_ALL)
    click.echo("  elyra " + __version__)
    click.echo()
    
    pipeline = prepare_pipeline(pipeline_path, name=name, runtime='kfp', runtime_config='fun')

    click.echo(Fore.CYAN + "❯ Info" + Style.RESET_ALL)
    click.echo("  name: " + pipeline.name)
    click.echo()

    click.echo(Fore.CYAN + "❯ Runtime" + Style.RESET_ALL)
    click.echo("  type: " + pipeline.runtime)
    click.echo("  config: " + pipeline.runtime_config)
    click.echo()
    
    with yaspin(text="Submitting Pipeline..."):
        os.environ["ELYRA_METADATA_PATH"] = os.path.join(os.path.expanduser("~"), ".elyra")
        msg = asyncio.get_event_loop().run_until_complete(submit_pipeline(pipeline))

    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "  Elyra Pipeline Submission Complete" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo()

    click.echo(Fore.CYAN + "❯ Run Url" + Style.RESET_ALL)
    click.echo("  " + msg["run_url"])
    click.echo()

    click.echo(Fore.CYAN + "❯ Object Storage Output" + Style.RESET_ALL)
    click.echo("  " + msg["object_storage_path"])
    click.echo()


@click.command()
@click.argument('pipeline_path', type=click.Path(exists=True))
def run(pipeline_path):
    """TODO: Description"""
    click.echo()

    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "  Elyra Pipeline Local Run" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo()

    click.echo(Fore.CYAN + "❯ Version" + Style.RESET_ALL)
    click.echo("  elyra " + __version__)
    click.echo()

    pipeline = prepare_pipeline(pipeline_path)

    asyncio.get_event_loop().run_until_complete(submit_pipeline(pipeline))

    click.echo()
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "  Elyra Pipeline Local Run Complete" + Style.RESET_ALL)
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo()


cli.add_command(add)
cli.add_command(get)
cli.add_command(remove)
cli.add_command(replace)
cli.add_command(use)
cli.add_command(submit)
cli.add_command(run)