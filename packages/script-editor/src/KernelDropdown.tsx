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

import { ReactWidget } from '@jupyterlab/apputils';
import { KernelSpec } from '@jupyterlab/services';

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
  RefObject,
} from 'react';

const KERNEL_SELECT_CLASS = 'elyra-ScriptEditor-KernelSelector';

export interface ISelect {
  getSelection: () => string;
}

interface IProps {
  specs: KernelSpec.ISpecModels;
  defaultKernel: string | null;
  callback: (selectedKernel: string) => void;
}

/**
 * A toolbar dropdown component populated with available kernel specs.
 */
// eslint-disable-next-line react/display-name
const DropDown = forwardRef<ISelect, IProps>(
  ({ specs, defaultKernel, callback }, select) => {
    const kernelspecs = useMemo(() => ({ ...specs.kernelspecs }), [specs]);
    const [selection, setSelection] = useState(defaultKernel || '');

    // Note: It's normally best to avoid using an imperative handle if possible.
    // The better option would be to track state in the parent component and handle
    // the change events there as well, but I know this isn't always possible
    // alongside jupyter.
    useImperativeHandle(select, () => ({
      getSelection: (): string => selection,
    }));

    const kernelOptions = !Object.keys(kernelspecs).length ? (
      <option key="no-kernel" value="no-kernel">
        No Kernel
      </option>
    ) : (
      Object.entries(kernelspecs).map(([key, val]) => (
        <option key={key} value={key}>
          {val?.display_name ?? key}
        </option>
      ))
    );

    const handleSelection = (e: any): void => {
      const selection = e.target.value;
      setSelection(selection);
      callback(selection);
    };

    return (
      <select
        className={KERNEL_SELECT_CLASS}
        onChange={handleSelection}
        value={selection}
      >
        {kernelOptions}
      </select>
    );
  },
);

/**
 * Wrap the dropDown into a React Widget in order to insert it into a Lab Toolbar Widget
 */
export class KernelDropdown extends ReactWidget {
  callback: (selectedKernel: string) => void;

  /**
   * Construct a new CellTypeSwitcher widget.
   */
  constructor(
    private specs: KernelSpec.ISpecModels,
    private defaultKernel: string | null,
    private ref: RefObject<ISelect>,
    callback: (selectedKernel: string) => void,
  ) {
    super();
    this.callback = callback;
    this.defaultKernel = defaultKernel;
  }

  render(): React.ReactElement {
    return (
      <DropDown
        ref={this.ref}
        specs={this.specs}
        defaultKernel={this.defaultKernel}
        callback={this.callback}
      />
    );
  }
}
