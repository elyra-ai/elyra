#
# Copyright 2018-2022 Elyra Authors
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
from pathlib import Path
import sys
from typing import Optional
import warnings

import click
from colorama import Fore
from colorama import Style
from kfp import Client as ArgoClient

from elyra._version import __version__
from elyra.metadata.manager import MetadataManager
from elyra.metadata.schema import SchemaManager
from elyra.metadata.schemaspaces import Runtimes
from elyra.pipeline.component_catalog import ComponentCache
from elyra.pipeline.kfp.kfp_authentication import AuthenticationError
from elyra.pipeline.kfp.kfp_authentication import KFPAuthenticator
from elyra.pipeline.parser import PipelineParser
from elyra.pipeline.pipeline_definition import Pipeline
from elyra.pipeline.pipeline_definition import PipelineDefinition
from elyra.pipeline.processor import PipelineProcessorManager
from elyra.pipeline.processor import PipelineProcessorResponse
from elyra.pipeline.runtime_type import RuntimeProcessorType
from elyra.pipeline.runtime_type import RuntimeTypeResources
from elyra.pipeline.runtimes_metadata import RuntimesMetadata
from elyra.pipeline.validation import PipelineValidationManager
from elyra.pipeline.validation import ValidationSeverity

if sys.stdout.isatty():
    from yaspin import yaspin as Spinner
else:
    from .pipeline_app_utils import StaticTextSpinner as Spinner

# custom exit code - a timeout occurred
EXIT_TIMEDOUT = 124

SEVERITY = {
    ValidationSeverity.Error: "Error",
    ValidationSeverity.Warning: "Warning",
    ValidationSeverity.Hint: "Hint",
    ValidationSeverity.Information: "Information",
}


def _get_runtime_config(runtime_config_name: Optional[str]) -> Optional[RuntimesMetadata]:
    """Fetch runtime configuration for the specified name"""
    if not runtime_config_name or runtime_config_name == "local":
        # No runtime configuration was specified or it is local.
        # Cannot use metadata manager to determine the runtime type.
        return None
    try:
        metadata_manager = MetadataManager(schemaspace=Runtimes.RUNTIMES_SCHEMASPACE_NAME)
        return metadata_manager.get(runtime_config_name)
    except Exception as e:
        raise click.ClickException(f"Invalid runtime configuration: {runtime_config_name}\n {e}")


def _get_runtime_type(runtime_config_name: Optional[str]) -> Optional[str]:
    """Get runtime type for the provided runtime configuration name"""
    runtime_config = _get_runtime_config(runtime_config_name)
    if runtime_config:
        return runtime_config.metadata.get("runtime_type")
    return None


def _get_runtime_schema_name(runtime_config_name: Optional[str]) -> Optional[str]:
    """Get runtime schema name for the provided runtime configuration name"""
    if not runtime_config_name or runtime_config_name == "local":
        # No runtime configuration was specified or it is local.
        # Cannot use metadata manager to determine the runtime type.
        return "local"
    runtime_config = _get_runtime_config(runtime_config_name)
    if runtime_config:
        return runtime_config.schema_name
    return None


def _get_runtime_display_name(schema_name: Optional[str]) -> Optional[str]:
    """Return the display name for the specified runtime schema_name"""
    if not schema_name or schema_name == "local":
        # No schame name was  specified or it is local.
        # Cannot use metadata manager to determine the display name.
        return schema_name

    try:
        schema_manager = SchemaManager.instance()
        schema = schema_manager.get_schema(Runtimes.RUNTIMES_SCHEMASPACE_NAME, schema_name)
        return schema["display_name"]
    except Exception as e:
        raise click.ClickException(f"Invalid runtime configuration: {schema_name}\n {e}")


def _get_pipeline_runtime_type(pipeline_definition: dict) -> Optional[str]:
    """Return the runtime type name associated with the given pipeline"""
    return pipeline_definition.get("pipelines", [{}])[0].get("app_data", {}).get("runtime_type")


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


def _preprocess_pipeline(
    pipeline_path: str, runtime: Optional[str] = None, runtime_config: Optional[str] = None
) -> dict:
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
                filename = node.get_component_parameter("filename")
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
        primary_pipeline.set("runtime_config", runtime_config)

    return pipeline_definition.to_dict()


def _print_issues(issues):
    # print validation issues

    for issue in sorted(issues, key=itemgetter("severity")):
        severity = f" [{SEVERITY[issue.get('severity')]}]"
        prefix = ""
        postfix = ""
        if issue.get("data"):
            if issue["data"].get("nodeName"):
                # issue is associated with a single node; display it
                prefix = f"[{issue['data'].get('nodeName')}]"
            if issue["data"].get("propertyName"):
                # issue is associated with a node property; display it
                prefix = f"{prefix}[{issue['data'].get('propertyName')}]"
            if issue["data"].get("value"):
                # issue is caused by the value of a node property; display it
                postfix = f"The current property value is '{issue['data'].get('value')}'."
            elif issue["data"].get("nodeNames") and isinstance(issue["data"]["nodeNames"], list):
                # issue is associated with multiple nodes
                postfix = "Nodes: "
                separator = ""
                for nn in issue["data"]["nodeNames"]:
                    postfix = f"{postfix}{separator}'{nn}'"
                    separator = ", "
        output = f"{severity}{prefix} - {issue['message']} {postfix}"
        click.echo(output)

    click.echo("")


def _validate_pipeline_definition(pipeline_definition: PipelineDefinition):
    """Validate pipeline definition and display issues"""

    click.echo("Validating pipeline...")
    # validate pipeline
    validation_response = asyncio.get_event_loop().run_until_complete(
        PipelineValidationManager.instance().validate(pipeline=pipeline_definition)
    )

    # print validation issues
    issues = validation_response.to_json().get("issues")
    _print_issues(issues)

    if validation_response.has_fatal:
        # raise an exception and let the caller decide what to do
        raise click.ClickException("Unable to continue due to pipeline validation issues.")


def _execute_pipeline(pipeline_definition) -> PipelineProcessorResponse:
    try:
        # parse pipeline
        pipeline_object = PipelineParser().parse(pipeline_definition)
        # process pipeline
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            response = asyncio.get_event_loop().run_until_complete(
                PipelineProcessorManager.instance().process(pipeline_object)
            )
            return response
    except ValueError as ve:
        raise click.ClickException(f"Error parsing pipeline: \n {ve}")
    except RuntimeError as re:
        raise click.ClickException(f"Error processing pipeline: \n {re} \n {re.__cause__}")


def _build_component_cache():
    """Initialize a ComponentCache instance and wait for it to complete all tasks"""
    with Spinner(text="Initializing the component cache..."):
        component_cache = ComponentCache.instance(emulate_server_app=True)
        component_cache.load()
        component_cache.wait_for_all_cache_tasks()


def validate_pipeline_path(ctx, param, value):
    """Callback for pipeline_path parameter"""
    if not value.is_file():
        raise click.BadParameter(f"'{value}' is not a file.")
    if value.suffix != ".pipeline":
        raise click.BadParameter(f"'{value}' is not a .pipeline file.")
    return value


def print_banner(title):
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo(f"{Fore.CYAN} {title}{Style.RESET_ALL}")
    click.echo(Fore.CYAN + "────────────────────────────────────────────────────────────────" + Style.RESET_ALL)
    click.echo()


def print_info(title, info_list):
    click.echo(f"{Fore.CYAN}❯ {title}{Style.RESET_ALL}")
    for info_item in info_list:
        if isinstance(info_item, str):
            click.echo(f"  {info_item}")
        else:
            click.echo(f"  {info_item[0]}: {info_item[1]}")
    click.echo()


def print_version():
    print_info("Version", [f"elyra {__version__}"])


@click.group()
@click.version_option(__version__, message="v%(version)s")
def pipeline():
    """
    Run Elyra pipelines in your local environment or submit them to an external service,
    such as Kubeflow Pipelines or Apache Airflow.

    Find more information at: https://elyra.readthedocs.io/en/v3.8.1/
    """
    pass


@click.command()
@click.option("--runtime-config", required=False, help="Runtime config where the pipeline should be processed")
@click.argument("pipeline_path", type=Path, callback=validate_pipeline_path)
def validate(pipeline_path, runtime_config="local"):
    """
    Validate pipeline
    """
    click.echo()

    print_banner("Elyra Pipeline Validation")

    runtime = _get_runtime_schema_name(runtime_config)

    pipeline_definition = _preprocess_pipeline(pipeline_path, runtime=runtime, runtime_config=runtime_config)

    pipeline_runtime_type = _get_pipeline_runtime_type(pipeline_definition)
    if pipeline_runtime_type:
        _build_component_cache()

    try:
        _validate_pipeline_definition(pipeline_definition)
    except Exception:
        raise click.ClickException("Pipeline validation FAILED.")


def validate_timeout_option(ctx, param, value):
    """Callback for monitor-timeout parameter validation"""
    try:
        value = int(value)
        if value <= 0:
            raise ValueError()
    except ValueError:
        raise click.BadParameter(f"'{value}' is not a positive integer.")
    else:
        return value


@click.command()
@click.argument("pipeline_path", type=Path, callback=validate_pipeline_path)
@click.option("--json", "json_option", is_flag=True, required=False, help="Display pipeline summary in JSON format")
@click.option(
    "--runtime-config",
    "runtime_config_name",
    required=True,
    help="Runtime config where the pipeline should be processed",
)
@click.option(
    "--monitor",
    "monitor_option",
    is_flag=True,
    required=False,
    help="Monitor the pipeline run (Supported for Kubeflow Pipelines only)",
)
@click.option(
    "--monitor-timeout",
    "timeout_option",
    type=int,
    default=60,
    show_default=True,
    required=False,
    help="Monitoring timeout in minutes.",
    callback=validate_timeout_option,
)
def submit(json_option, pipeline_path, runtime_config_name, monitor_option, timeout_option):
    """
    Submit a pipeline to be executed on the server
    """

    click.echo()

    print_banner("Elyra Pipeline Submission")

    runtime_config = _get_runtime_config(runtime_config_name)

    runtime_schema = runtime_config.schema_name

    pipeline_definition = _preprocess_pipeline(
        pipeline_path, runtime=runtime_schema, runtime_config=runtime_config_name
    )

    pipeline_runtime_type = _get_pipeline_runtime_type(pipeline_definition)
    if pipeline_runtime_type:
        _build_component_cache()

    try:
        _validate_pipeline_definition(pipeline_definition)
    except Exception:
        raise click.ClickException("Pipeline validation FAILED. The pipeline was not submitted for execution.")

    with Spinner(text="Submitting pipeline..."):
        response: PipelineProcessorResponse = _execute_pipeline(pipeline_definition)

    if not json_option:
        if response:
            msg = []
            # If there's a git_url attr, assume Apache Airflow DAG repo.
            # TODO: this will need to be revisited once front-end is decoupled from runtime platforms.
            if hasattr(response, "git_url"):
                msg.append(f"Apache Airflow DAG has been pushed to: {response.git_url}")
            msg.append(f"Check the status of your job at: {response.run_url}")
            if response.object_storage_path is not None and response.object_storage_url is not None:
                msg.append(
                    f"The results and outputs are in the {response.object_storage_path} "
                    f"working directory in {response.object_storage_url}"
                )
            print_info("Job submission succeeded", msg)
        click.echo()
        print_banner("Elyra Pipeline Submission Complete")
    else:
        if response:
            click.echo()
            print(json.dumps(response.to_json(), indent=4))

    # Start pipeline run monitoring, if requested
    if runtime_schema == "kfp" and monitor_option:
        minute_str = "minutes" if timeout_option > 1 else "minute"
        try:
            msg = (
                f"Monitoring status of pipeline run '{response.run_id}' for up to " f"{timeout_option} {minute_str}..."
            )
            with Spinner(text=msg):
                status = _monitor_kfp_submission(runtime_config, runtime_config_name, response.run_id, timeout_option)
        except TimeoutError:
            click.echo(
                "Monitoring was stopped because the timeout threshold "
                f"({timeout_option} {minute_str}) was exceeded. The pipeline is still running."
            )
            sys.exit(EXIT_TIMEDOUT)
        else:
            # The following are known KFP states: 'succeeded', 'failed', 'skipped',
            # 'error'. Treat 'unknown' as error. Exit with appropriate status code.
            click.echo(f"Monitoring ended with run status: {status}")
            if status.lower() not in ["succeeded", "skipped"]:
                # Click appears to use non-zero exit codes 1 (ClickException)
                # and 2 (UsageError). Terminate.
                sys.exit(click.ClickException.exit_code)


def _monitor_kfp_submission(runtime_config: dict, runtime_config_name: str, run_id: str, timeout: int) -> str:
    """Monitor the status of a Kubeflow Pipelines run"""

    try:
        # Authenticate with the KFP server
        auth_info = KFPAuthenticator().authenticate(
            runtime_config.metadata["api_endpoint"].rstrip("/"),
            auth_type_str=runtime_config.metadata.get("auth_type"),
            runtime_config_name=runtime_config_name,
            auth_parm_1=runtime_config.metadata.get("api_username"),
            auth_parm_2=runtime_config.metadata.get("api_password"),
        )
    except AuthenticationError as ae:
        if ae.get_request_history() is not None:
            click.echo("An authentication error was raised. Diagnostic information follows.")
            click.echo(ae.request_history_to_string())
        raise click.ClickException(f"Kubeflow authentication failed: {ae}")

    try:
        # Create a Kubeflow Pipelines client. There is no need to use a Tekton client,
        # because the monitoring API is agnostic.
        client = ArgoClient(
            host=runtime_config.metadata["api_endpoint"].rstrip("/"),
            cookies=auth_info.get("cookies", None),
            credentials=auth_info.get("credentials", None),
            existing_token=auth_info.get("existing_token", None),
            namespace=runtime_config.metadata.get("user_namespace"),
        )
        # wait for the run to complete or timeout (API uses seconds as unit - convert)
        run_details = client.wait_for_run_completion(run_id, timeout * 60)
    except TimeoutError:
        # pipeline processing did not finish yet, stop monitoring
        raise
    except Exception as ex:
        # log error and return 'unknown' status
        click.echo(f"Monitoring failed: {type(ex)}: {ex}")
        return "unknown"
    else:
        return run_details.run.status


@click.command()
@click.option("--json", "json_option", is_flag=True, required=False, help="Display pipeline summary in JSON format")
@click.argument("pipeline_path", type=Path, callback=validate_pipeline_path)
def run(json_option, pipeline_path):
    """
    Run a pipeline in your local environment
    """
    click.echo()

    print_banner("Elyra Pipeline Local Run")

    pipeline_definition = _preprocess_pipeline(pipeline_path, runtime="local", runtime_config="local")

    try:
        _validate_pipeline_definition(pipeline_definition)
    except Exception:
        raise click.ClickException("Pipeline validation FAILED. The pipeline was not run.")

    response = _execute_pipeline(pipeline_definition)

    if not json_option:
        click.echo()
        print_banner("Elyra Pipeline Local Run Complete")
    else:
        click.echo()
        if response:
            print(json.dumps(response.to_json(), indent=4))


@click.command()
@click.option("--json", "json_option", is_flag=True, required=False, help="Display pipeline summary in JSON format")
@click.argument("pipeline_path", type=Path, callback=validate_pipeline_path)
def describe(json_option, pipeline_path):
    """
    Display pipeline summary
    """

    click.echo()

    print_banner("Elyra Pipeline details")

    indent_length = 4
    blank_field = "Not Specified"
    blank_list = ["None Listed"]
    pipeline_keys = ["name", "description", "type", "version", "nodes", "file_dependencies", "component_dependencies"]
    iter_keys = {"file_dependencies", "component_dependencies"}

    pipeline_definition = _preprocess_pipeline(pipeline_path, runtime="local", runtime_config="local")

    primary_pipeline = PipelineDefinition(pipeline_definition=pipeline_definition).primary_pipeline

    describe_dict = OrderedDict()

    describe_dict["name"] = primary_pipeline.name
    describe_dict["description"] = primary_pipeline.get_property("description")
    describe_dict["type"] = primary_pipeline.type
    describe_dict["version"] = primary_pipeline.version
    describe_dict["nodes"] = len(primary_pipeline.nodes)
    describe_dict["file_dependencies"] = set()
    describe_dict["component_dependencies"] = set()
    for node in primary_pipeline.nodes:
        # collect information about file dependencies
        for dependency in node.get_component_parameter("dependencies", []):
            describe_dict["file_dependencies"].add(f"{dependency}")
        # collect information about component dependencies
        if node.component_source is not None:
            describe_dict["component_dependencies"].add(node.component_source)

    if not json_option:
        for key in pipeline_keys:
            readable_key = " ".join(key.title().split("_"))
            if key in iter_keys:
                click.echo(f"{readable_key}:")
                if describe_dict.get(key, set()) == set():
                    click.echo(f"{' ' * indent_length}{blank_list[0]}")
                else:
                    for item in describe_dict.get(key, blank_list):
                        click.echo(f"{' ' * indent_length}- {item}")
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


@click.command()
@click.argument("pipeline_path", type=Path, callback=validate_pipeline_path)
@click.option("--runtime-config", required=True, help="Runtime configuration name.")
@click.option(
    "--output",
    required=False,
    type=Path,
    help="Exported file name (including optional path). Defaults to " " the current directory and the pipeline name.",
)
@click.option("--overwrite", is_flag=True, help="Overwrite output file if it already exists.")
def export(pipeline_path, runtime_config, output, overwrite):
    """
    Export a pipeline to a runtime-specific format
    """

    click.echo()
    print_banner("Elyra pipeline export")

    rtc = _get_runtime_config(runtime_config)
    runtime_schema = rtc.schema_name
    runtime_type = rtc.metadata.get("runtime_type")

    pipeline_definition = _preprocess_pipeline(pipeline_path, runtime=runtime_schema, runtime_config=runtime_config)

    # Verify that the pipeline's runtime type is compatible with the
    # runtime configuration
    pipeline_runtime_type = _get_pipeline_runtime_type(pipeline_definition)
    if pipeline_runtime_type and pipeline_runtime_type != "Generic" and pipeline_runtime_type != runtime_type:
        raise click.BadParameter(
            f"The runtime configuration type '{runtime_type}' does not match "
            f"the pipeline's runtime type '{pipeline_runtime_type}'.",
            param_hint="--runtime-config",
        )

    resources = RuntimeTypeResources.get_instance_by_type(RuntimeProcessorType.get_instance_by_name(runtime_type))
    supported_export_formats = resources.get_export_extensions()
    if len(supported_export_formats) == 0:
        raise click.ClickException(f"Runtime type '{runtime_type}' does not support export.")

    # If, in the future, a runtime supports multiple export output formats,
    # the user can choose one. For now, choose the only option.
    selected_export_format = supported_export_formats[0]
    selected_export_format_suffix = f".{selected_export_format}"

    # generate output file name from the user-provided input
    if output is None:
        # user did not specify an output; use current directory
        # and derive the file name from the pipeline file name
        output_path = Path.cwd()
        filename = f"{Path(pipeline_path).stem}{selected_export_format_suffix}"
    else:
        if output.suffix == selected_export_format_suffix:
            # user provided a file name
            output_path = output.parent
            filename = output.name
        else:
            # user provided a directory
            output_path = output
            filename = f"{Path(pipeline_path).stem}{selected_export_format_suffix}"
    output_file = output_path.resolve() / filename

    # verify that the output path meets the prerequisites
    if not output_file.parent.is_dir():
        try:
            output_file.parent.mkdir(parents=True, exist_ok=True)
        except Exception as ex:
            raise click.BadParameter(f"Cannot create output directory: {ex}", param_hint="--output")

    # handle output overwrite
    if output_file.exists() and not overwrite:
        raise click.ClickException(
            f"Output file '{str(output_file)}' exists and " "option '--overwrite' was not specified."
        )

    if pipeline_runtime_type:
        _build_component_cache()

    # validate the pipeline
    try:
        _validate_pipeline_definition(pipeline_definition)
    except Exception:
        raise click.ClickException("Pipeline validation FAILED. The pipeline was not exported.")

    with Spinner(text="Exporting pipeline ..."):
        try:
            # parse pipeline
            pipeline_object = PipelineParser().parse(pipeline_definition)
            # process pipeline
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                asyncio.get_event_loop().run_until_complete(
                    PipelineProcessorManager.instance().export(
                        pipeline_object, selected_export_format, str(output_file), True
                    )
                )
        except ValueError as ve:
            raise click.ClickException(f"Error parsing pipeline: \n {ve}")
        except RuntimeError as re:
            raise click.ClickException(f"Error exporting pipeline: \n {re} \n {re.__cause__}")

    click.echo(f"Pipeline was exported to '{str(output_file)}'.")


pipeline.add_command(describe)
pipeline.add_command(validate)
pipeline.add_command(submit)
pipeline.add_command(run)
pipeline.add_command(export)
