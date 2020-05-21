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

export class SubmissionHandler {
  static async getRuntimeImages(): Promise<IDictionary<string>> {
    const runtimeImages = await FrontendServices.getMetadata('runtime-images');
    const images: { [key: string]: string } = {};
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
      'api/scheduler',
      JSON.stringify(pipeline),
      true
    );

    const dialogTitle = 'Job submission to ' + runtime_config + ' succeeded';
    const dialogBody = (
      <p>
        Check the status of your run at{' '}
        <a href={response.url} target="_blank" rel="noopener noreferrer">
          Run Details
        </a>
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
      'api/pipeline/export',
      JSON.stringify(body),
      true
    );

    return showDialog({
      title: 'Pipeline export succeeded',
      body: <p></p>,
      buttons: [Dialog.okButton()]
    });
  }
}
