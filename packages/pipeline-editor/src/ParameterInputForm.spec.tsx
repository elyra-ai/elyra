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
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { ParameterInputForm } from './ParameterInputForm';

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

  const getParamInput = (name: string): HTMLInputElement =>
    container.querySelector(`#${name}-paramInput`) as HTMLInputElement;

  it('restricts an Integer-type parameter to whole numbers via step="1"', () => {
    act(() => {
      root.render(
        <ParameterInputForm
          parameters={[
            { name: 'count', default_value: { type: 'Integer', value: 1 } }
          ]}
        />
      );
    });

    const input = getParamInput('count');
    expect(input.type).toBe('number');
    // `pattern` isn't supported on type="number" inputs, so `step` is what
    // actually prevents decimal input here -- this is the regression this
    // test pins (see #3088, fixed alongside #3417's Float coercion fix).
    expect(input.step).toBe('1');
  });

  it('does not restrict a Float-type parameter to whole numbers', () => {
    act(() => {
      root.render(
        <ParameterInputForm
          parameters={[
            { name: 'ratio', default_value: { type: 'Float', value: 1.5 } }
          ]}
        />
      );
    });

    const input = getParamInput('ratio');
    expect(input.type).toBe('number');
    expect(input.step).toBe('');
  });

  it('renders a String-type parameter as plain text with no step restriction', () => {
    act(() => {
      root.render(
        <ParameterInputForm
          parameters={[
            { name: 'label', default_value: { type: 'String', value: 'a' } }
          ]}
        />
      );
    });

    const input = getParamInput('label');
    expect(input.type).toBe('text');
    expect(input.step).toBe('');
  });
});
