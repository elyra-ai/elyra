/*
 * Copyright 2018-2019 IBM Corporation
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

import {showDialog, Dialog} from '@jupyterlab/apputils';
import {URLExt} from '@jupyterlab/coreutils';
import {ServerConnection} from '@jupyterlab/services';

import * as React from "react";

export class SubmissionHanlder {

  static handleError(response: any, submissionType: string) {
    let res_body = response['message'] ? response['message'] : '';
    res_body = response['reason'] ? res_body + ': ' + response['reason'] : res_body;

    let default_body = 'More details might be available in the JupyterLab console logs';

    return showDialog({
      title: 'Error submitting ' + submissionType,
      body: res_body ? <p>{res_body}<br/>{default_body}</p> : <p>{default_body}</p>,
      buttons: [Dialog.okButton()]
    });
  }

  static handle404(submissionType: string) {
    return showDialog({
      title: 'Error submitting ' + submissionType,
      body: 'AI workspace service endpoint not available',
      buttons: [Dialog.okButton()]
    });
  }

  static submitPipeline(requestBody: string, platform: string, submissionType: string) {
    let settings = ServerConnection.makeSettings();
    let url = URLExt.join(settings.baseUrl, 'scheduler');
    console.log('Submitting pipeline to -> ' + url);

    let waitDialog = new Dialog({ title: 'Submitting pipeline...', buttons: [] });
    waitDialog.launch();

    ServerConnection.makeRequest(url, {method: 'POST', body: requestBody}, settings)
      .then((scheduler_response: any) => {
        waitDialog.resolve();
        console.log('>>>');
        console.log(scheduler_response);
        // handle 404 if ai workspace server extension is not found
        if (scheduler_response.status === 404) {
          return this.handle404(submissionType);
        }

        scheduler_response.json().then((data: any) => {
          console.log('>>>');
          console.log(data);
          if (scheduler_response.status !== 200) {
            return this.handleError(data, submissionType);
          }

          let dialogTitle: string = 'Job submission to ' + platform + ' succeeded';
          let dialogBody = <p>Check the status of your run at <a href={data.url} target='_blank'>Run Details</a>
          </p>;
          return showDialog({
            title: dialogTitle,
            body: dialogBody,
            buttons: [Dialog.okButton()]
          });
        });
      });
  }
}
