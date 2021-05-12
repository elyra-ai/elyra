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

export const ExpandableErrorDialog: React.FC<IErrorDialogProps> = props => {
  const [collapsedSize, setCollapsedSize] = React.useState(null);

  const updateDialogSize = React.useCallback(
    (expanded: boolean): void => {
      const dialogNode: HTMLDivElement = document.querySelector(
        '.' + JP_DIALOG_CONTENT
      );
      const width = dialogNode.clientWidth;
      const height = dialogNode.clientHeight;

      if (
        expanded &&
        (width < ERROR_DIALOG_WIDTH || height < ERROR_DIALOG_HEIGHT)
      ) {
        setCollapsedSize({ width, height });
        dialogNode.style.width = Math.max(width, ERROR_DIALOG_WIDTH) + 'px';
        dialogNode.style.height = Math.max(height, ERROR_DIALOG_HEIGHT) + 'px';
      } else if (!expanded && collapsedSize) {
        dialogNode.style.width = collapsedSize.width + 'px';
        dialogNode.style.height = collapsedSize.height + 'px';
      }
    },
    [collapsedSize, setCollapsedSize]
  );

  const details = props.traceback ? (
    <ExpandableComponent
      displayName={'Error details: '}
      tooltip={'Error stack trace'}
      onBeforeExpand={updateDialogSize}
    >
      <pre>{props.traceback}</pre>
    </ExpandableComponent>
  ) : null;

  return (
    <div className={MESSAGE_DISPLAY}>
      <div>{props.message}</div>
      {details}
      <div>{props.default_msg}</div>
    </div>
  );
};
