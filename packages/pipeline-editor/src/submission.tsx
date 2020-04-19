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

import { SubmissionHandler } from '@elyra/application';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import * as React from 'react';

export class PipelineSubmissionHandler extends SubmissionHandler {
  static exportPipeline(pipeline: any, pipeline_export_format: string): void {
    console.log('Pipeline definition:');
    console.log(pipeline);

    console.log(
      'Exporting pipeline to [' + pipeline_export_format + '] format'
    );

    const body = {
      pipeline: pipeline,
      export_format: pipeline_export_format
    };

    this.makePostRequest(
      'api/pipeline/export',
      JSON.stringify(body),
      'export pipeline',
      (data: any) => {
        const dialogTitle = 'Pipeline export succeeded';
        const dialogBody = <p></p>;
        return showDialog({
          title: dialogTitle,
          body: dialogBody,
          buttons: [Dialog.okButton()]
        });
      }
    );
  }
}
