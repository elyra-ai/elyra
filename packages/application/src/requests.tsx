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

import { ErrorDialogContent } from './ErrorDialogContent';

const HTML_STATUS_SUCCESS = [200, 201];

export class RequestHandler {
  static serverError(response: any): Promise<Dialog.IResult<any>> {
    const reason = response.reason ? response.reason : '';
    const message = response.message ? response.message : '';
    const timestamp = response.timestamp ? response.timestamp : '';
    const traceback = response.traceback ? response.traceback : '';
    const default_body = response.timestamp
      ? 'Check the JupyterLab log for more details at ' + response.timestamp
      : 'Check the JupyterLab log for more details';

    return showDialog({
      title: 'Error making request',
      body:
        reason || message ? (
          <ErrorDialogContent
            reason={reason}
            message={message}
            timestamp={timestamp}
            traceback={traceback}
            default_msg={default_body}
          />
        ) : (
          <p>{default_body}</p>
        ),
      buttons: [Dialog.okButton()]
    });
  }

  static server404(): Promise<Dialog.IResult<any>> {
    return showDialog({
      title: 'Error contacting server',
      body: <p>Elyra service endpoint not found.</p>,
      buttons: [Dialog.okButton()]
    });
  }

  static async makeGetRequest(
    requestExt: string,
    displayWaitDialog: boolean
  ): Promise<any> {
    return this.makeServerRequest(
      requestExt,
      { method: 'GET' },
      displayWaitDialog
    );
  }

  static async makePostRequest(
    requestExt: string,
    requestBody: any,
    displayWaitDialog: boolean
  ): Promise<any> {
    return this.makeServerRequest(
      requestExt,
      { method: 'POST', body: requestBody },
      displayWaitDialog
    );
  }

  static async makeServerRequest(
    requestExt: string,
    requestOptions: any,
    displayWaitDialog: boolean
  ): Promise<any> {
    // use ServerConnection utility to make calls to Jupyter Based services
    // which in this case are the in the extension installed by this package
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl, requestExt);

    console.log(`Sending a ${requestOptions.method} request to ${requestUrl}`);

    const waitDialog: Dialog<any> = new Dialog({
      title: 'Making server request...',
      body: 'This may take some time',
      buttons: [Dialog.okButton()]
    });

    if (displayWaitDialog) {
      waitDialog.launch();
    }

    const getServerResponse: Promise<any> = new Promise((resolve, reject) => {
      ServerConnection.makeRequest(requestUrl, requestOptions, settings).then(
        (response: any) => {
          if (displayWaitDialog) {
            waitDialog.resolve();
          }

          response.json().then(
            (result: any) => {
              if (!HTML_STATUS_SUCCESS.includes(response.status)) {
                return this.serverError(result);
              }

              resolve(result);
            },
            (reason: any) => {
              // handle 404 if elyra server extension is not found
              return this.server404();
            }
          );
        }
      );
    });

    const serverResponse: any = await getServerResponse;
    return serverResponse;
  }
}
