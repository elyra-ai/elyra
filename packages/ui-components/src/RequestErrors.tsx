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

import { showDialog, Dialog } from '@jupyterlab/apputils';

import * as React from 'react';

import { ExpandableErrorDialog } from './ExpandableErrorDialog';

/**
 * A class for handling errors when making requests to the jupyter lab server.
 */
export class RequestErrors {
  /**
   * Displays an error dialog showing error data and stacktrace, if available.
   *
   * @param response - The server response containing the error data
   *
   * @returns A promise that resolves with whether the dialog was accepted.
   */
  static serverError(response: any): Promise<Dialog.IResult<any>> {
    if (response.status == 404) {
      return this.server404(response.requestPath);
    }

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
          <ExpandableErrorDialog
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
   * Displays an error dialog for when a server request returns a 404.
   *
   * @returns A promise that resolves with whether the dialog was accepted.
   */
  private static server404(endpoint: string): Promise<Dialog.IResult<any>> {
    return showDialog({
      title: 'Error contacting server',
      body: (
        <p>
          Endpoint <code>{endpoint}</code> not found.
        </p>
      ),
      buttons: [Dialog.okButton()]
    });
  }

  /**
   * Displays a dialog for error cases during metadata calls.
   *
   * @param namespace - the metadata namespace that was being accessed when
   * the error occurred
   *
   * @param action (optional) - the pipeline action that required the metadata when
   * the error occurred
   * eg. run pipeline, export pipeline, run notebook as pipeline
   *
   * @returns A promise that resolves with whether the dialog was accepted.
   */
  static noMetadataError(
    namespace: string,
    action?: string
  ): Promise<Dialog.IResult<any>> {
    return showDialog({
      title: action ? `Cannot ${action}` : 'Error retrieving metadata',
      body: (
        <div>
          <p>No {namespace} configuration is defined.</p>
          <p>Please create one and try again.</p>
        </div>
      ),
      buttons:
        namespace === 'runtime'
          ? [Dialog.cancelButton(), Dialog.okButton({ label: `Open runtimes` })]
          : [Dialog.okButton()]
    });
  }
}
