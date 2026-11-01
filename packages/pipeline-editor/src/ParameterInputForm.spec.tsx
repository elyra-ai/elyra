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
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { IParameterProps, ParameterInputForm } from './ParameterInputForm';

type DefaultValue = NonNullable<
  NonNullable<IParameterProps['parameters']>[number]['default_value']
>;

// Opt in to act() semantics so React flushes renders synchronously in tests.
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('ParameterInputForm', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const renderParamInput = (default_value: DefaultValue): HTMLInputElement => {
    act(() => {
      root.render(
        <ParameterInputForm parameters={[{ name: 'param', default_value }]} />
      );
    });
    return container.querySelector('#param-paramInput') as HTMLInputElement;
  };

  // See #3084: an Integer parameter must not accept a decimal value
  it('treats a decimal as invalid input for an Integer-type parameter', () => {
    const input = renderParamInput({ type: 'Integer', value: 1 });
    expect(input.type).toBe('number');
    input.value = '3.5';
    expect(input.checkValidity()).toBe(false);
    input.value = '3';
    expect(input.checkValidity()).toBe(true);
  });

  it('treats a decimal as valid input for a Float-type parameter', () => {
    const input = renderParamInput({ type: 'Float', value: 1.5 });
    expect(input.type).toBe('number');
    input.value = '0.25';
    expect(input.checkValidity()).toBe(true);
  });

  it('renders a String-type parameter as plain text', () => {
    const input = renderParamInput({ type: 'String', value: 'a' });
    expect(input.type).toBe('text');
    input.value = '3.5';
    expect(input.checkValidity()).toBe(true);
  });
});
