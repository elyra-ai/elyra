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

import '../style/index.css';

import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

const DEFAULT_BUTTON_CLASS = 'elyra-DialogDefaultButton';
/*
 * Validate dialog fields upon display
 * - Provides a generic validation by checking if required form fields are populated
 * - Expects required fields in dialog body to contain attribute: data-form-required
 * - Validates non-required numeric fields to only accept positive values
 *
 * @params
 *
 * options - The dialog setup options
 * formValidationFunction - Optional custom validation function
 *
 * returns a call to dialog display
 */
export const showFormDialog = async (
  options: Partial<Dialog.IOptions<any>>,
  formValidationFunction?: (dialog: Dialog<any>) => void,
): Promise<Dialog.IResult<any>> => {
  const dialogBody = options.body;
  const dialog = new Dialog(options);

  // Get dialog default action button
  const defaultButton = getDefaultButton(options, dialog.node);
  defaultButton.className += ' ' + DEFAULT_BUTTON_CLASS;

  if (formValidationFunction) {
    formValidationFunction(dialog);
  } else {
    if (dialogBody instanceof Widget) {
      const fieldsToBeValidated = new Set();
      const validateDialogButton = (): void =>
        isFormValid(fieldsToBeValidated)
          ? enableButton(defaultButton)
          : disableButton(defaultButton);

      // Get elements that require validation and add event listeners
      dialogBody.node
        .querySelectorAll('select, input, textarea')
        .forEach((element: any) => {
          if (element.hasAttribute('data-form-required')) {
            const elementTagName = element.tagName.toLowerCase();

            if (elementTagName === 'select' || element.type === 'number') {
              element.addEventListener('change', (event: Event) =>
                validateDialogButton(),
              );
            }
            if (['input', 'textarea'].includes(elementTagName)) {
              element.addEventListener('keyup', (event: Event) =>
                validateDialogButton(),
              );
            }

            fieldsToBeValidated.add(element);
          }
        });

      preventDefaultDialogHandler(
        () => isFormValid(fieldsToBeValidated),
        dialog,
      );
      validateDialogButton();
    }
  }
  return dialog.launch();
};

export const disableButton = (button: HTMLButtonElement): void => {
  button.setAttribute('disabled', 'disabled');
};

export const enableButton = (button: HTMLButtonElement): void => {
  button.removeAttribute('disabled');
};

const getDefaultButton = (
  options: Partial<Dialog.IOptions<any>>,
  node: HTMLElement,
): HTMLButtonElement => {
  const defaultButtonIndex =
    options.defaultButton ?? (options.buttons?.length ?? 0) - 1;
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  return node
    .querySelector('.jp-Dialog-footer')
    ?.getElementsByTagName('button')[defaultButtonIndex]!;
};

// Prevent user from bypassing validation upon pressing the 'Enter' key
const preventDefaultDialogHandler = (
  isFormValidFn: () => boolean,
  dialog: Dialog<any>,
): void => {
  const dialogHandleEvent = dialog.handleEvent;
  dialog.handleEvent = (event: Event): void => {
    if (
      event instanceof KeyboardEvent &&
      event.type === 'keydown' &&
      event.keyCode === 13
    ) {
      // Prevent action when form dialog is not valid
      if (!isFormValidFn()) {
        event.stopPropagation();
        event.preventDefault();
      } else {
        dialogHandleEvent.call(dialog, event);
      }
    } else {
      dialogHandleEvent.call(dialog, event);
    }
  };
};

// Returns true if given element is valid
const isFieldValid = (element: any): boolean => {
  return element.value.trim() ? true : false;
};

// Returns true if form dialog has all fields validated
const isFormValid = (fieldToBeValidated: Set<any>): boolean => {
  for (const field of fieldToBeValidated.values()) {
    if (!isFieldValid(field)) {
      return false;
    }
  }
  return true;
};
