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
 * - Expect required fields in dialog body to contain attribute: data-form-required
 * - NOTE: The Dialog widget will skip any validation upon pressing 'enter' key and resolve the dialog as is
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
  formValidationFunction: any
): Promise<Dialog.IResult<any>> => {
  const dialogBody = options.body;
  const dialog = new Dialog(options);

  if (formValidationFunction && typeof formValidationFunction === 'function') {
    formValidationFunction(dialog);
  } else {
    if (typeof dialogBody !== 'string') {
      const requiredFields = (dialogBody as Widget).node.querySelectorAll(
        '[data-form-required]'
      );

      if (requiredFields && requiredFields.length > 0) {
        // Keep track of all fields already validated. Start with an empty set.
        let fieldsValidated = new Set();

        // Override Dialog.handleEvent to prevent user from bypassing validation upon pressing the 'Enter' key
        const dialogHandleEvent = dialog.handleEvent;
        dialog.handleEvent = (event: Event): void => {
          if (
            event.type === 'keydown' &&
            (event as KeyboardEvent).keyCode === 13 &&
            fieldsValidated.size !== requiredFields.length
          ) {
            // prevent action since Enter key is pressed and all fields are not validated
            event.stopPropagation();
            event.preventDefault();
          } else {
            dialogHandleEvent.call(dialog, event);
          }
        };

        // Get dialog default action button
        const defaultButtonIndex =
          options.defaultButton || options.buttons.length - 1;
        const defaultButton = dialog.node
          .querySelector('.jp-Dialog-footer')
          .getElementsByTagName('button')[defaultButtonIndex];

        requiredFields.forEach((element: any) => {
          // First deal with the case the field has already been pre-populated
          handleSingleFieldValidation(element, fieldsValidated);
          handleAllFieldsValidation(
            fieldsValidated,
            requiredFields,
            defaultButton
          );

          const fieldType = element.tagName.toLowerCase();

          if (fieldType === 'select') {
            element.addEventListener('change', (event: Event) => {
              handleSingleFieldValidation(event.target, fieldsValidated);
              handleAllFieldsValidation(
                fieldsValidated,
                requiredFields,
                defaultButton
              );
            });
          } else if (fieldType === 'input' || fieldType === 'textarea') {
            element.addEventListener('keyup', (event: Event) => {
              handleSingleFieldValidation(event.target, fieldsValidated);
              handleAllFieldsValidation(
                fieldsValidated,
                requiredFields,
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

// Update set of validated fields according to element value
const handleSingleFieldValidation = (
  element: any,
  fieldsValidated: Set<any>
): void => {
  element.value.trim()
    ? fieldsValidated.add(element)
    : fieldsValidated.delete(element);
};

// Only enable dialog button if all required fields are validated
const handleAllFieldsValidation = (
  fieldsValidated: Set<any>,
  requiredFields: NodeListOf<any>,
  button: HTMLButtonElement
): void => {
  fieldsValidated.size === requiredFields.length
    ? enableDialogButton(button)
    : disableDialogButton(button);
};
