/*
 * Copyright 2018-2023 Elyra Authors
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

import { ReactWidget, Dialog } from '@jupyterlab/apputils';
import { MessageLoop } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';

export const formDialogWidget = (
  dialogComponent: JSX.Element
): Dialog.IBodyWidget<any> => {
  const widget = ReactWidget.create(dialogComponent) as Dialog.IBodyWidget<any>;

  // Immediately update the body even though it has not yet attached in
  // order to trigger a render of the DOM nodes from the React element.
  MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);

  widget.getValue = (): any => {
    const form = widget.node.querySelector('form');
    const formValues: { [key: string]: any } = {};
    for (const element of Object.values(
      form?.elements ?? []
    ) as HTMLInputElement[]) {
      switch (element.type) {
        case 'checkbox':
          formValues[element.name] = element.checked;
          break;
        default:
          formValues[element.name] = element.value;
          break;
      }
    }
    return formValues;
  };

  return widget;
};
