/*
 * Copyright 2018-2020 Elyra Authors
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

import * as React from 'react';

import { ExpandableComponent } from './ExpandableComponent';

const MESSAGE_DISPLAY = 'elyra-errorDialog-messageDisplay';
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

export class ExpandableErrorDialog extends React.Component<
  IErrorDialogProps,
  any
> {
  dialogNode: HTMLDivElement;
  collapsedDimensions: number[];

  constructor(props: any) {
    super(props);
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
      this.collapsedDimensions = [width, height];
      this.dialogNode.style.width = Math.max(width, ERROR_DIALOG_WIDTH) + 'px';
      this.dialogNode.style.height =
        Math.max(height, ERROR_DIALOG_HEIGHT) + 'px';
    } else if (!expanded && this.collapsedDimensions) {
      this.dialogNode.style.width = this.collapsedDimensions[0] + 'px';
      this.dialogNode.style.height = this.collapsedDimensions[1] + 'px';
    }
  }

  render(): React.ReactElement {
    const details = this.props.traceback ? (
      <ExpandableComponent
        displayName={'Error details: '}
        tooltip={'Error stack trace'}
        onBeforeExpand={(expanded: boolean): void => {
          this.updateDialogSize(expanded);
        }}
      >
        <pre>{this.props.traceback}</pre>
      </ExpandableComponent>
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
