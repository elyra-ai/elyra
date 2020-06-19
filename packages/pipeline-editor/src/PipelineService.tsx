/*
 * Copyright 2018-2020 IBM Corporation
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

import {
  FrontendServices,
  IDictionary,
  RequestHandler
} from '@elyra/application';

import { showDialog, Dialog } from '@jupyterlab/apputils';
import * as React from 'react';

import Utils from './utils';

export class PipelineService {
  static async getRuntimes(): Promise<any> {
    const runtimes = await FrontendServices.getMetadata('runtimes');

    if (Object.keys(runtimes).length === 0) {
      return FrontendServices.noMetadataError('runtimes');
    }

    return runtimes;
  }

  static async getRuntimeImages(): Promise<any> {
    const runtimeImages = await FrontendServices.getMetadata('runtime-images');

    if (Object.keys(runtimeImages).length === 0) {
      return FrontendServices.noMetadataError('runtime-images');
    }

    const images: IDictionary<string> = {};
    for (const image in runtimeImages) {
      const imageName: string = runtimeImages[image]['metadata']['image_name'];
      images[imageName] = runtimeImages[image]['display_name'];
    }
    return images;
  }

  static async submitPipeline(
    pipeline: any,
    runtime_config: string
  ): Promise<any> {
    console.log('Pipeline definition:');
    console.log(pipeline);

    const response = await RequestHandler.makePostRequest(
      'elyra/pipeline/schedule',
      JSON.stringify(pipeline),
      true
    );

    const dialogTitle = 'Job submission to ' + runtime_config + ' succeeded';
    const dialogBody = (
      <p>
        Check the status of your pipeline at{' '}
        <a href={response['run_url']} target="_blank" rel="noopener noreferrer">
          Run Details.
        </a>
        <br />
        The results and outputs are in the {
          response['object_storage_path']
        }{' '}
        working directory in{' '}
        <a
          href={response['object_storage_url']}
          target="_blank"
          rel="noopener noreferrer"
        >
          object storage
        </a>
        .
      </p>
    );
    return showDialog({
      title: dialogTitle,
      body: dialogBody,
      buttons: [Dialog.okButton()]
    });
  }

  static async exportPipeline(
    pipeline: any,
    pipeline_export_format: string,
    pipeline_export_path: string,
    overwrite: boolean
  ): Promise<any> {
    console.log('Pipeline definition:');
    console.log(pipeline);

    console.log(
      'Exporting pipeline to [' + pipeline_export_format + '] format'
    );

    console.log('Overwriting existing file: ' + overwrite);

    const body = {
      pipeline: pipeline,
      export_format: pipeline_export_format,
      export_path: pipeline_export_path,
      overwrite: overwrite
    };

    await RequestHandler.makePostRequest(
      'elyra/pipeline/export',
      JSON.stringify(body),
      true
    );

    return showDialog({
      title: 'Pipeline export succeeded',
      body: <p></p>,
      buttons: [Dialog.okButton()]
    });
  }

  static convertPipeline(pipelineDefinition: any): any {
    const pipelineJSON = JSON.parse(JSON.stringify(pipelineDefinition));

    const currentVersion: number =
      +Utils.hasPipelineAppdataField(pipelineJSON.pipelines[0], 'version') || 0;
    if (currentVersion < 1) {
      // original pipeline definition without a version
      console.log('Migrating pipeline to version 1');
      return this.convertPipelineV0toV1(pipelineJSON);
    }
  }

  private static convertPipelineV0toV1(pipelineJSON: any): any {
    Utils.renamePipelineAppdataField(
      pipelineJSON.pipelines[0],
      'title',
      'name'
    );
    Utils.deletePipelineAppdataField(pipelineJSON.pipelines[0], 'export');
    Utils.deletePipelineAppdataField(
      pipelineJSON.pipelines[0],
      'export_format'
    );
    Utils.deletePipelineAppdataField(pipelineJSON.pipelines[0], 'export_path');

    // look into nodes
    for (const nodeKey in pipelineJSON.pipelines[0]['nodes']) {
      const node = pipelineJSON.pipelines[0]['nodes'][nodeKey];
      Utils.renamePipelineAppdataField(node, 'artifact', 'filename');
      Utils.renamePipelineAppdataField(node, 'image', 'runtime_image');
      Utils.renamePipelineAppdataField(node, 'vars', 'env_vars');
      Utils.renamePipelineAppdataField(
        node,
        'file_dependencies',
        'dependencies'
      );
      Utils.renamePipelineAppdataField(
        node,
        'recursive_dependencies',
        'include_subdirectories'
      );
    }

    pipelineJSON.pipelines[0]['app_data']['version'] = 1;
    return pipelineJSON;
  }
}
