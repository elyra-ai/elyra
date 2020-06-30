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

import '../style/index.css';

import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

const DEFAULT_BUTTON_CLASS = 'elyra-DialogDefaultButton';
/*
 * Validate required dialog fields upon display
 * - Provides a generic validation by checking if required form fields are populated
 * - Expect required fields in dialog body to contain attribute: data-required
 *
 * @params
 *
 * options - The dialog setup options
 * formValidationFunction - Optional validation function
 *
 * returns a call to dialog display
 */
export const showFormDialog = async (
  options: Partial<Dialog.IOptions<any>>,
  formValidationFunction: any
): Promise<Dialog.IResult<any>> => {
  const dialogBody = options.body;
  const dialog = new Dialog(options);

  if (formValidationFunction && typeof formValidationFunction === 'function') {
    formValidationFunction(dialog);
  } else {
    if (typeof dialogBody !== 'string') {
      const requiredFields = (dialogBody as Widget).node.querySelectorAll(
        '[data-required]'
      );

      if (requiredFields && requiredFields.length > 0) {
        // TODO: deal with the case a defaultButton is not passed on dialog options, and the last button added to buttons array is a cancelButton
        const defaultButtonIndex =
          options.defaultButton || options.buttons.length - 1;
        const defaultButton = dialog.node
          .querySelector('.jp-Dialog-footer')
          .getElementsByTagName('button')[defaultButtonIndex];

        disableDialogButton(defaultButton);

        // Keep track of all validated elements tagged as required
        const validatedFields = new Set();

        requiredFields.forEach((element: any) => {
          // First deal with the case the field has already been pre-selected
          validateField(element, validatedFields);

          const fieldType = element.tagName;

          // Update extra fieldType handlers as needed.
          if (fieldType == 'SELECT') {
            // Add appropriate change event listener to each required field
            element.addEventListener('change', (event: any) => {
              validateField(event.target, validatedFields);
              handleAllValidated(
                requiredFields,
                validatedFields,
                defaultButton
              );
            });
          } else if (fieldType == 'INPUT') {
            element.addEventListener('keyup', (event: any) => {
              // TODO: Filter valid key codes and do basic input validation
              // (NOTE: Dialog will skip anything upon pressing 'enter' and resolve the dialog as is)
              // console.log(event.which || event.keyCode);

              validateField(event.target, validatedFields);
              handleAllValidated(
                requiredFields,
                validatedFields,
                defaultButton
              );
            });
          }
        });
      }
    }
  }
  return dialog.launch();
};

export const disableDialogButton = (button: HTMLButtonElement): void => {
  button.setAttribute('disabled', 'disabled');
  button.className += ' ' + DEFAULT_BUTTON_CLASS;
};

export const enableDialogButton = (button: HTMLButtonElement): void => {
  button.removeAttribute('disabled');
};

// Update validatedFields according to element value
const validateField = (element: any, validatedFields: Set<any>): void => {
  if (element.value) {
    validatedFields.add(element);
  } else {
    validatedFields.delete(element);
  }
};

// Only enable dialog action button when all required fields have been validated
const handleAllValidated = (
  required: any,
  validated: any,
  button: HTMLButtonElement
): void => {
  if (required.length === validated.size) {
    enableDialogButton(button);
  } else {
    disableDialogButton(button);
  }
};
