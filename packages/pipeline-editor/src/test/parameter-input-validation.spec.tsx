/*
 * Copyright 2018-2026 Elyra Authors
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
import { showFormDialog } from '@elyra/ui-components';
import { Dialog } from '@jupyterlab/apputils';
import React, { act } from 'react';

import { formDialogWidget } from '../formDialogWidget';
import { IParameterProps, ParameterInputForm } from '../ParameterInputForm';

type Parameter = NonNullable<IParameterProps['parameters']>[number];

// Opt in to act() semantics so React flushes renders synchronously in tests.
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const integerParam = (name: string, value: number | ''): Parameter => ({
  name,
  required: value === '',
  default_value: { type: 'Integer', value: value as number }
});

const floatParam = (name: string, value: number | ''): Parameter => ({
  name,
  required: value === '',
  default_value: { type: 'Float', value: value as number }
});

/**
 * Launch the parameter form inside the same dialog machinery used for
 * pipeline submit/export, and return helpers to drive and inspect it.
 */
const launchParameterDialog = async (
  parameters: Parameter[]
): Promise<{
  okButton: HTMLButtonElement;
  type: (name: string, value: string) => void;
}> => {
  let body!: ReturnType<typeof formDialogWidget>;
  act(() => {
    body = formDialogWidget(
      <form>
        <ParameterInputForm parameters={parameters} />
      </form>
    );
  });
  // The dialog stays open for the whole test; Dialog.flush() in afterEach
  // rejects the pending launch promise, which is expected.
  showFormDialog({
    title: 'Parameters',
    body,
    buttons: [Dialog.cancelButton(), Dialog.okButton()]
  }).catch(() => undefined);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const okButton = document.querySelector<HTMLButtonElement>(
    '.elyra-DialogDefaultButton'
  )!;
  const type = (name: string, value: string): void => {
    const input = document.querySelector<HTMLInputElement>(
      `#${name}-paramInput`
    )!;
    act(() => {
      input.value = value;
      input.dispatchEvent(new Event('change'));
      input.dispatchEvent(new KeyboardEvent('keyup'));
    });
  };
  return { okButton, type };
};

describe('pipeline parameter input validation', () => {
  afterEach(() => {
    act(() => Dialog.flush());
    document.body.innerHTML = '';
  });

  describe('Integer parameters', () => {
    it('blocks submission when a required value is not a whole number', async () => {
      const { okButton, type } = await launchParameterDialog([
        integerParam('count', '')
      ]);
      type('count', '3.5');
      expect(okButton.disabled).toBe(true);
    });

    it('blocks submission when an optional value is not a whole number', async () => {
      const { okButton, type } = await launchParameterDialog([
        integerParam('count', 1)
      ]);
      type('count', '9.99');
      expect(okButton.disabled).toBe(true);
    });

    it('allows submission of a whole number', async () => {
      const { okButton, type } = await launchParameterDialog([
        integerParam('count', '')
      ]);
      type('count', '7');
      expect(okButton.disabled).toBe(false);
    });
  });

  describe('Float parameters', () => {
    it('treats a decimal value as valid input', async () => {
      await launchParameterDialog([floatParam('ratio', 1.5)]);
      const input =
        document.querySelector<HTMLInputElement>('#ratio-paramInput')!;
      input.value = '1.5';
      expect(input.checkValidity()).toBe(true);
    });

    it('allows submission of a decimal value', async () => {
      const { okButton, type } = await launchParameterDialog([
        floatParam('ratio', '')
      ]);
      type('ratio', '1.5');
      expect(okButton.disabled).toBe(false);
    });
  });

  it('blocks submission while a required value is empty', async () => {
    const { okButton } = await launchParameterDialog([
      integerParam('count', '')
    ]);
    expect(okButton.disabled).toBe(true);
  });
});
