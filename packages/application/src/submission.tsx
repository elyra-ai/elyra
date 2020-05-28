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
import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';

import * as React from 'react';

const MESSAGE_DISPLAY = 'elyra-pipelineSubmission-messageDisplay';
const ERROR_DISPLAY_BUTTON = 'elyra-pipelineSubmission-errDisplayButton';
const ERROR_DETAILS = 'elyra-pipelineSubmission-errDetails';
const ERROR_DETAILS_VISIBLE = 'elyra-pipelineSubmission-error-visible';
const ERROR_DETAILS_HIDDEN = 'elyra-pipelineSubmission-error-hidden';
const ERROR_DIALOG_WIDTH = 600;
const ERROR_DIALOG_HEIGHT = 400;
const JP_DIALOG_CONTENT = 'jp-Dialog-content';

export class SubmissionHandler {
  static handleError(
    response: any,
    submissionType: string
  ): Promise<Dialog.IResult<any>> {
    const reason = response.reason ? response.reason : '';
    const message = response.message ? response.message : '';
    const timestamp = response.timestamp ? response.timestamp : '';
    const traceback = response.traceback ? response.traceback : '';
    const default_body = response.timestamp
      ? 'Check the JupyterLab log for more details at ' + response.timestamp
      : 'Check the JupyterLab log for more details';

    return showDialog({
      title: 'Error submitting ' + submissionType,
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

  static handle404(submissionType: string): Promise<Dialog.IResult<any>> {
    return showDialog({
      title: 'Error submitting ' + submissionType,
      body: <p>Elyra service endpoint not found.</p>,
      buttons: [Dialog.okButton()]
    });
  }

  static noMetadataError(metadataName: string): Promise<Dialog.IResult<any>> {
    return showDialog({
      title: 'Error retrieving metadata',
      body: <p>No {metadataName} metadata has been configured.</p>,
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
    let waitDialog: Dialog<any> = null;
    // TODO: @ajbozarth will address this during coming refactor
    // which will turn the showing of this dialog controlled by a flag
    if (requestUrl.includes('schedule') || requestUrl.includes('export')) {
      waitDialog = new Dialog({
        title: 'Making server request...',
        body: 'This may take some time',
        buttons: [Dialog.okButton()]
      });
      waitDialog.launch();
    }

    ServerConnection.makeRequest(requestUrl, requestOptions, settings).then(
      (response: any) => {
        if (waitDialog) {
          waitDialog.resolve();
        }

        response.json().then(
          (result: any) => {
            if (response.status !== 200 && response.status !== 201) {
              return this.handleError(result, submissionType);
            }
            return dialogCallback(result);
          },
          (reason: any) => {
            // handle 404 if elyra server extension is not found
            return this.handle404(submissionType);
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
      'api/pipeline/schedule',
      JSON.stringify(pipeline),
      submissionType,
      (data: any) => {
        const exporting = pipeline.pipelines[0]['app_data']['export'];
        let dialogTitle = '';
        let dialogBody = <p></p>;
        if (exporting) {
          dialogTitle = 'Pipeline export succeeded';
        } else {
          dialogTitle = 'Job submission to ' + runtime_config + ' succeeded';
          dialogBody = (
            <p>
              Check the status of your pipeline at{' '}
              <a
                href={data['run-url']}
                target="_blank"
                rel="noopener noreferrer"
              >
                Run Details.
              </a>
              <br />
              The results and outputs are in the [{data['object-storage-path']}]
              working directory in{' '}
              <a
                href={data['object-storage-url']}
                target="_blank"
                rel="noopener noreferrer"
              >
                object storage.
              </a>{' '}
            </p>
          );
        }
        return showDialog({
          title: dialogTitle,
          body: dialogBody,
          buttons: [Dialog.okButton()]
        });
      }
    );
  }
}

interface IErrorDialogProps {
  reason: string;
  message: string;
  timestamp: string;
  traceback: string;
  default_msg: string;
}

class ErrorDialogContent extends React.Component<IErrorDialogProps, any> {
  dialogNode: HTMLDivElement;

  constructor(props: any) {
    super(props);
    this.state = { expanded: false };
  }

  updateDialogSize(expanded: boolean): void {
    if (!this.dialogNode) {
      this.dialogNode = document.querySelector('.' + JP_DIALOG_CONTENT);
    }

    const width = this.dialogNode.clientWidth;
    const height = this.dialogNode.clientHeight;

    if (
      expanded &&
      (width < ERROR_DIALOG_WIDTH || height < ERROR_DIALOG_HEIGHT)
    ) {
      this.dialogNode.style.width = ERROR_DIALOG_WIDTH + 'px';
      this.dialogNode.style.height = ERROR_DIALOG_HEIGHT + 'px';
    }
  }

  toggleMsgDisplay(): void {
    // Switch expanded flag
    const expanded = !this.state.expanded;
    this.updateDialogSize(expanded);
    this.setState({ expanded: expanded });
  }

  render(): React.ReactElement {
    const details = this.props.traceback ? (
      <div className={ERROR_DETAILS}>
        <div>
          <button
            className={ERROR_DISPLAY_BUTTON}
            onClick={(): void => {
              this.toggleMsgDisplay();
            }}
          >
            {this.state.expanded ? (
              <caretDownIcon.react tag="span" elementPosition="center" />
            ) : (
              <caretRightIcon.react tag="span" elementPosition="center" />
            )}
          </button>
          {'Error details: '}
        </div>
        <div
          className={
            this.state.expanded ? ERROR_DETAILS_VISIBLE : ERROR_DETAILS_HIDDEN
          }
        >
          <pre>{this.props.traceback}</pre>
        </div>
      </div>
    ) : null;

    return (
      <div className={MESSAGE_DISPLAY}>
        <div>{this.props.message}</div>
        {details}
        <div>{this.props.default_msg}</div>
      </div>
    );
  }
}
