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

import { ErrorDialogContent } from '@elyra/ui-components';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

import * as React from 'react';

export class RequestHandler {
  /**
   * displays an error Dialog with an optional stack trace
   */
  private static serverError(response: any): Promise<Dialog.IResult<any>> {
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

  /**
   * displays an error Dialog for a 404
   */
  private static server404(): Promise<Dialog.IResult<any>> {
    return showDialog({
      title: 'Error contacting server',
      body: <p>Elyra service endpoint not found.</p>,
      buttons: [Dialog.okButton()]
    });
  }

  /**
   * Make a GET request to the jupyterlab server.
   *
   * @param requestPath - The url for the request.
   *
   * @param longRequest - If the request is expected to take a long time.
   * If true, displays a dialog warning that the request may take time.
   *
   * @returns a Promise that resolves with either the response or a Dialog.
   */
  static async makeGetRequest(
    requestPath: string,
    longRequest: boolean
  ): Promise<any> {
    return this.makeServerRequest(requestPath, { method: 'GET' }, longRequest);
  }

  /**
   * Make a POST request to the jupyterlab server.
   *
   * @param requestPath - The url for the request.
   *
   * @param requestBody - The body of the request.
   *
   * @param longRequest - If the request is expected to take a long time.
   * If true, displays a dialog warning that the request may take time.
   *
   * @returns a Promise that resolves with either the response or a Dialog.
   */
  static async makePostRequest(
    requestPath: string,
    requestBody: any,
    longRequest: boolean
  ): Promise<any> {
    return this.makeServerRequest(
      requestPath,
      { method: 'POST', body: requestBody },
      longRequest
    );
  }

  /**
   * Make an request to the jupyterlab server.
   *
   * @param requestPath - The url for the request.
   *
   * @param requestOptions - The initialization options for the request.
   *
   * @param longRequest - If the request is expected to take a long time.
   * If true, displays a dialog warning that the request may take time.
   *
   * @returns a Promise that resolves with either the response or a Dialog.
   */
  static async makeServerRequest(
    requestPath: string,
    requestOptions: any,
    longRequest: boolean
  ): Promise<any> {
    // use ServerConnection utility to make calls to Jupyter Based services
    // which in this case are the in the extension installed by this package
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl, requestPath);

    console.log(`Sending a ${requestOptions.method} request to ${requestUrl}`);

    const waitDialog: Dialog<any> = new Dialog({
      title: 'Making server request...',
      body: 'This may take some time',
      buttons: [Dialog.okButton()]
    });

    if (longRequest) {
      waitDialog.launch();
    }

    const getServerResponse: Promise<any> = new Promise((resolve, reject) => {
      ServerConnection.makeRequest(requestUrl, requestOptions, settings).then(
        (response: any) => {
          if (longRequest) {
            waitDialog.resolve();
          }

          response.json().then(
            // handle cases where the server returns a valid response
            (result: any) => {
              if (response.status < 200 || response.status >= 300) {
                return this.serverError(result);
              }

              resolve(result);
            },
            // handle 404 if the server is not found
            (reason: any) => {
              return this.server404();
            }
          );
        },
        // something unexpected went wrong with the request
        (reason: any) => {
          console.error(reason);
          return this.serverError(reason);
        }
      );
    });

    const serverResponse: any = await getServerResponse;
    return serverResponse;
  }
}
