/*
 * Copyright 2018-2025 Elyra Authors
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
import { GenericObjectType } from '@rjsf/utils';

type DialogBodyElement =
  | HTMLSelectElement
  | HTMLInputElement
  | HTMLTextAreaElement;

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
export const showFormDialog = async <T extends GenericObjectType>(
  options: Partial<Dialog.IOptions<T>>,
  formValidationFunction?: (dialog: Dialog<T>) => void
): Promise<Dialog.IResult<T>> => {
  const dialogBody = options.body;
  const dialog = new Dialog(options);

  // Get dialog default action button
  const defaultButton = getDefaultButton<T>(options, dialog.node);
  defaultButton.className += ' ' + DEFAULT_BUTTON_CLASS;

  if (formValidationFunction) {
    formValidationFunction(dialog);
  } else {
    if (dialogBody instanceof Widget) {
      const fieldsToBeValidated = new Set<DialogBodyElement>();
      const validateDialogButton = (): void =>
        isFormValid(fieldsToBeValidated)
          ? enableButton(defaultButton)
          : disableButton(defaultButton);

      // Get elements that require validation and add event listeners
      dialogBody.node
        .querySelectorAll<DialogBodyElement>('select, input, textarea')
        .forEach((element) => {
          if (element.hasAttribute('data-form-required')) {
            const elementTagName = element.tagName.toLowerCase();

            if (
              elementTagName === 'select' ||
              (element as HTMLInputElement).type === 'number'
            ) {
              element.addEventListener('change', () => validateDialogButton());
            }
            if (['input', 'textarea'].includes(elementTagName)) {
              element.addEventListener('keyup', () => validateDialogButton());
            }

            fieldsToBeValidated.add(element);
          }
        });

      preventDefaultDialogHandler<T>(
        () => isFormValid(fieldsToBeValidated),
        dialog
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

const getDefaultButton = <T extends GenericObjectType>(
  options: Partial<Dialog.IOptions<T>>,
  node: HTMLElement
): HTMLButtonElement => {
  const defaultButtonIndex =
    options.defaultButton ?? (options.buttons?.length ?? 0) - 1;
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  return node
    .querySelector('.jp-Dialog-footer')
    ?.getElementsByTagName('button')[defaultButtonIndex]!;
};

// Prevent user from bypassing validation upon pressing the 'Enter' key
const preventDefaultDialogHandler = <T extends GenericObjectType>(
  isFormValidFn: () => boolean,
  dialog: Dialog<T>
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
const isFieldValid = (element: DialogBodyElement): boolean => {
  return element.value.trim() ? true : false;
};

// Returns true if form dialog has all fields validated
const isFormValid = (fieldToBeValidated: Set<DialogBodyElement>): boolean => {
  for (const field of fieldToBeValidated.values()) {
    if (!isFieldValid(field)) {
      return false;
    }
  }
  return true;
};
