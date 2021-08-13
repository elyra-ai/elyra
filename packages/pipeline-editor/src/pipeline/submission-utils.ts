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
import { Dialog, showDialog } from '@jupyterlab/apputils';

import { PipelineService } from '../PipelineService';

import { preparePipelineForStorage } from './conversion-utils';

export class NoMetadataError extends Error {}

const cleanNullProperties = (pipeline: any): void => {
  // Delete optional fields that have null value
  for (const node of pipeline?.pipelines[0].nodes) {
    if (node.app_data.component_parameters.cpu === null) {
      delete node.app_data.component_parameters.cpu;
    }
    if (node.app_data.component_parameters.memory === null) {
      delete node.app_data.component_parameters.memory;
    }
    if (node.app_data.component_parameters.gpu === null) {
      delete node.app_data.component_parameters.gpu;
    }
  }
};

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
export const prepare = (
  pipelineJson: any,
  // TODO: nick - don't use any
  { pipelinePath, runtimeImages, name, runtime, runtimeConfig, source }: any
): void => {
  const pipelineString = preparePipelineForStorage(pipelineJson, runtimeImages);
  const pipeline = JSON.parse(pipelineString);

  PipelineService.setNodePathsRelativeToWorkspace(
    pipeline.pipelines[0],
    pipelinePath
  );

  cleanNullProperties(pipeline);

  pipeline.pipelines[0].app_data.name = name;
  pipeline.pipelines[0].app_data.runtime = runtime;
  pipeline.pipelines[0].app_data['runtime-config'] = runtimeConfig;
  pipeline.pipelines[0].app_data.source = source;

  return pipeline;
};

// TODO: nick - Do we need to save? We already have the unsaved copy and the
// backend doesn't use the pipeline on disk
/**
 * Show a dialog asking the user to save their pipeline in order to proceed
 */
export const askToSave = async (): Promise<boolean> => {
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
export const assertValidPipeline = (pipelineJson: any, palette: any): void => {
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

export const getRuntimes = async (runtimePlatform?: string): Promise<any> => {
  const runtimes = await PipelineService.getRuntimes(false);

  const filteredRuntimeOptions = runtimes.filter(
    (r: any) => !runtimePlatform || r.schema_name === runtimePlatform
  );

  if (filteredRuntimeOptions.length === 0) {
    throw new NoMetadataError();
  }

  return filteredRuntimeOptions;
};
