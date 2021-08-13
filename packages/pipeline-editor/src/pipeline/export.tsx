/*
 * Copyright 2018-2021 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { validate } from '@elyra/pipeline-services';
import { RequestErrors, showFormDialog } from '@elyra/ui-components';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import * as React from 'react';

import { formDialogWidget } from '../formDialogWidget';
import { PipelineExportDialog } from '../PipelineExportDialog';
import { PipelineService } from '../PipelineService';
import { PipelineSubmissionDialog } from '../PipelineSubmissionDialog';

class NoMetadataError extends Error {}

/**
 * Flatten palette category into simple list of all possible node types.
 */
const getAllPaletteNodes = (palette: any): any[] => {
  if (palette.categories === undefined) {
    return [];
  }

  const nodes = [];
  for (const c of palette.categories) {
    if (c.node_types) {
      nodes.push(...c.node_types);
    }
  }

  return nodes;
};

// TODO: nick - How does this have the right runtime names and such...?
// oh I guess if we get the pipeline from context, it is properly formatted...
/**
 * Finalize pipeline adding special things the server needs
 */
const prepare = (
  pipeline: any,
  { pipelinePath, name, runtime, runtimeConfig, source }: any
): void => {
  PipelineService.setNodePathsRelativeToWorkspace(
    pipeline.pipelines[0],
    pipelinePath
  );

  cleanNullProperties();

  pipeline.pipelines[0].app_data.name = name;
  pipeline.pipelines[0].app_data.runtime = runtime;
  pipeline.pipelines[0].app_data['runtime-config'] = runtimeConfig;
  pipeline.pipelines[0].app_data.source = source;
};

// TODO: nick - Do we need to save? We already have the unsaved copy and the
// backend doesn't use the pipeline on disk
/**
 * Show a dialog asking the user to save their pipeline in order to proceed
 */
const askToSave = async (): Promise<boolean> => {
  const dialogResult = await showDialog({
    title:
      'This pipeline contains unsaved changes. To submit the pipeline the changes need to be saved.',
    buttons: [
      Dialog.cancelButton(),
      Dialog.okButton({ label: 'Save and Submit' })
    ]
  });
  return dialogResult.button?.accept === true;
};

/**
 * Make sure the pipeline is defined and valid
 */
const assertValidPipeline = (pipelineJson: any, palette: any): void => {
  if (!pipelineJson) {
    throw new Error('Failed export: Cannot export empty pipelines.');
  }

  const nodes = getAllPaletteNodes(palette);
  const errorMessages = validate(JSON.stringify(pipelineJson), nodes);

  if (errorMessages.length > 0) {
    const errorMessage = errorMessages.map(e => e.message).join('');
    throw new Error(`Failed export: ${errorMessage}`);
  }
};

const getRuntimes = async (runtimePlatform?: string): Promise<any> => {
  const runtimes = await PipelineService.getRuntimes(false);

  const filteredRuntimeOptions = runtimes.filter(
    (r: any) => !runtimePlatform || r.schema_name === runtimePlatform
  );

  if (filteredRuntimeOptions.length === 0) {
    throw new NoMetadataError();
  }

  return filteredRuntimeOptions;
};

/**
 * Export the pipeline
 *
 * tasks:
 *   - validate
 *   - ask to save
 *   - get available runtimes instances
 *   - show form asking for info
 *   - finalize pipeline
 */
export const handleExportPipeline = async (
  pipelineJson: any,
  palette: any,
  dirty: boolean,
  pipelinePath: string,
  platform?: {
    id: string;
    displayName: string;
  }
): Promise<void> => {
  assertValidPipeline(pipelineJson, palette);

  if (dirty) {
    const shouldSave = await askToSave();
    if (!shouldSave) {
      return; // bail
    }

    await savePipeline();
  }

  let schema, runtimes;
  try {
    runtimes = await getRuntimes(platform?.id);
    schema = await PipelineService.getRuntimesSchema();
  } catch (error) {
    if (error instanceof NoMetadataError) {
      const res = await RequestErrors.noMetadataError(
        'runtime',
        'export pipeline',
        platform?.displayName
      );
      // Open the runtimes widget
      if (res.button.label.includes(RUNTIMES_NAMESPACE)) {
        shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
      }
    } else {
      RequestErrors.serverError(error);
    }
    return; // bail
  }

  const title = platform
    ? `Export pipeline for ${platform.displayName}`
    : 'Export pipeline';

  const dialogOptions: Partial<Dialog.IOptions<any>> = {
    title,
    body: formDialogWidget(
      <PipelineExportDialog
        runtimes={runtimes}
        runtime={platform?.id}
        schema={schema}
      />
    ),
    buttons: [Dialog.cancelButton(), Dialog.okButton()],
    defaultButton: 1,
    focusNodeSelector: '#runtime_config'
  };
  const dialogResult = await showFormDialog(dialogOptions);

  if (dialogResult.value == null) {
    // When Cancel is clicked on the dialog, just return
    return;
  }

  // prepare pipeline submission details
  const pipeline_path = pipelinePath;

  const pipeline_name = PathExt.basename(
    pipeline_path,
    PathExt.extname(pipeline_path)
  );

  const overwrite = dialogResult.value.overwrite;
  const pipeline_export_format = dialogResult.value.pipeline_filetype;

  const pipeline_dir = PathExt.dirname(pipeline_path);
  let pipeline_export_path = pipeline_name + '.' + pipeline_export_format;
  // only prefix the '/' when pipeline_dir is non-empty
  if (pipeline_dir) {
    pipeline_export_path = pipeline_dir + '/' + pipeline_export_path;
  }

  const runtime_config = dialogResult.value.runtime_config;
  const runtime = PipelineService.getRuntimeName(runtime_config, runtimes);

  prepare(pipelineJson, {
    pipelinePath,
    name: pipeline_name,
    runtime,
    runtimeConfig: runtime_config,
    source: PathExt.basename(pipeline_path)
  });

  PipelineService.exportPipeline(
    pipelineJson,
    pipeline_export_format,
    pipeline_export_path,
    overwrite
  ).catch(error => RequestErrors.serverError(error));
};

/**
 * Submit the pipeline
 *
 * tasks:
 *   - validate
 *   - ask to save
 *   - get available runtimes instances
 *   - show form asking for info
 *   - finalize pipeline
 */
export const handleRunPipeline = async (
  pipelineJson: any,
  palette: any,
  dirty: boolean,
  pipelinePath: string,
  platform?: {
    id: string;
    displayName: string;
  }
): Promise<void> => {
  assertValidPipeline(pipelineJson, palette);

  if (dirty) {
    const shouldSave = await askToSave();
    if (!shouldSave) {
      return; // bail
    }

    await savePipeline();
  }

  const pipelineName = PathExt.basename(
    pipelinePath,
    PathExt.extname(pipelinePath)
  );

  let schema, runtimes;
  try {
    runtimes = await getRuntimes(platform?.id);
    schema = await PipelineService.getRuntimesSchema();
  } catch (error) {
    if (error instanceof NoMetadataError) {
      // TODO: nick - can't throw here because it can be local
      // const res = await RequestErrors.noMetadataError(
      //   'runtime',
      //   'run pipeline',
      //   platform?.displayName
      // );
      // // Open the runtimes widget
      // if (res.button.label.includes(RUNTIMES_NAMESPACE)) {
      //   shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
      // }
    } else {
      RequestErrors.serverError(error);
    }
  }

  runtimes.unshift({
    name: 'local',
    display_name: 'Run in-place locally',
    schema_name: 'local'
  });

  schema.unshift({
    name: 'local',
    display_name: 'Local Runtime'
  });

  const title = platform
    ? `Run pipeline on ${platform.displayName}`
    : 'Run pipeline';

  const dialogOptions: Partial<Dialog.IOptions<any>> = {
    title,
    body: formDialogWidget(
      <PipelineSubmissionDialog
        name={pipelineName}
        runtimes={runtimes}
        runtime={platform?.id}
        schema={schema}
      />
    ),
    buttons: [Dialog.cancelButton(), Dialog.okButton()],
    defaultButton: 1,
    focusNodeSelector: '#pipeline_name'
  };
  const dialogResult = await showFormDialog(dialogOptions);

  if (dialogResult.value === null) {
    // When Cancel is clicked on the dialog, just return
    return;
  }

  const runtime_config = dialogResult.value.runtime_config;
  const runtime =
    PipelineService.getRuntimeName(runtime_config, runtimes) || 'local';

  prepare(pipelineJson, {
    pipelinePath,
    name: dialogResult.value.pipeline_name,
    runtime,
    runtimeConfig: runtime_config,
    source: PathExt.basename(pipelinePath)
  });

  const displayName = PipelineService.getDisplayName(
    dialogResult.value.runtime_config,
    runtimes
  );

  try {
    await PipelineService.submitPipeline(pipelineJson, displayName);
  } catch (error) {
    RequestErrors.serverError(error);
  }
};
