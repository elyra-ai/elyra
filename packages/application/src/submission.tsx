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

import { showDialog, Dialog } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

import * as React from 'react';

export class SubmissionHandler {
  static handleError(
    response: any,
    submissionType: string
  ): Promise<Dialog.IResult<any>> {
    let res_body = response['message'] ? response['message'] : '';
    res_body = response['reason']
      ? res_body + ': ' + response['reason']
      : res_body;

    const default_body =
      'More details might be available in the JupyterLab console logs';

    return showDialog({
      title: 'Error submitting ' + submissionType,
      body: res_body ? (
        <p>
          {res_body}
          <br />
          {default_body}
        </p>
      ) : (
        <p>{default_body}</p>
      ),
      buttons: [Dialog.okButton()]
    });
  }

  static handle404(
    response: any,
    submissionType: string
  ): Promise<Dialog.IResult<any>> {
    const default_body = 'Elyra service endpoint not available';

    return showDialog({
      title: 'Error submitting ' + submissionType,
      body: response['message'] ? (
        <p>
          {default_body}
          <br />
          {response['message']}
        </p>
      ) : (
        <p>{default_body}</p>
      ),
      buttons: [Dialog.okButton()]
    });
  }

  static makeGetRequest(
    requestExt: string,
    submissionType: string,
    dialogCallback: (results: any) => void
  ): void {
    this.makeServerRequest(
      requestExt,
      { method: 'GET' },
      submissionType,
      dialogCallback
    );
  }

  static makePostRequest(
    requestExt: string,
    requestBody: any,
    submissionType: string,
    dialogCallback: (results: any) => void
  ): void {
    this.makeServerRequest(
      requestExt,
      { method: 'POST', body: requestBody },
      submissionType,
      dialogCallback
    );
  }

  static makeServerRequest(
    requestExt: string,
    requestOptions: any,
    submissionType: string,
    dialogCallback: (results: any) => void
  ): void {
    // use ServerConnection utility to make calls to Jupyter Based services
    // which in this case are the in the extension installed by this package
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl, requestExt);

    console.log(
      'Submitting a ' + requestOptions.method + ' request to ' + requestUrl
    );

    // Note: a button is required to resolve the dialog below
    const waitDialog = new Dialog({
      title: 'Submitting request...',
      body: 'This may take some time',
      buttons: [Dialog.okButton()]
    });
    waitDialog.launch();

    ServerConnection.makeRequest(requestUrl, requestOptions, settings).then(
      (response: any) => {
        waitDialog.resolve();

        response.json().then(
          (result: any) => {
            // handle 404 if elyra server extension returns a 404
            if (response.status === 404) {
              return this.handle404(result, submissionType);
            }

            if (response.status !== 200) {
              return this.handleError(result, submissionType);
            }

            return dialogCallback(result);
          },
          (reason: any) => {
            // handle 404 if elyra server extension is not found
            return this.handle404({}, submissionType);
          }
        );
      }
    );
  }

  static submitPipeline(
    pipeline: any,
    runtime_config: string,
    submissionType: string
  ): void {
    console.log('Pipeline definition:');
    console.log(pipeline);

    this.makePostRequest(
      'api/scheduler',
      JSON.stringify(pipeline),
      submissionType,
      (data: any) => {
        const dialogTitle: string =
          'Job submission to ' + runtime_config + ' succeeded';
        const dialogBody = (
          <p>
            Check the status of your run at{' '}
            <a href={data.url} target="_blank" rel="noopener noreferrer">
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
    );
  }
}
