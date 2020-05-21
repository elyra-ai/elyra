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

import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';

import * as React from 'react';

const MESSAGE_DISPLAY = 'elyra-errorDialog-messageDisplay';
const ERROR_DISPLAY_BUTTON = 'elyra-errorDialog-errDisplayButton';
const ERROR_DETAILS = 'elyra-errorDialog-errDetails';
const ERROR_DETAILS_VISIBLE = 'elyra-errorDialog-error-visible';
const ERROR_DETAILS_HIDDEN = 'elyra-errorDialog-error-hidden';
const ERROR_DIALOG_WIDTH = 600;
const ERROR_DIALOG_HEIGHT = 400;
const JP_DIALOG_CONTENT = 'jp-Dialog-content';

interface IErrorDialogProps {
  reason: string;
  message: string;
  timestamp: string;
  traceback: string;
  default_msg: string;
}

export class ErrorDialogContent extends React.Component<
  IErrorDialogProps,
  any
> {
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
