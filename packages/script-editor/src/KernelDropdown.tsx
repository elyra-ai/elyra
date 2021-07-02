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

import { ReactWidget } from '@jupyterlab/apputils';
import { KernelSpec } from '@jupyterlab/services';

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  RefObject
} from 'react';

const KERNEL_SELECT_CLASS = 'elyra-ScriptEditor-KernelSelector';

export interface ISelect {
  getSelection: () => string;
}

interface IProps {
  specs: KernelSpec.ISpecModels;
}

/**
 * A toolbar dropdown component populated with available kernel specs.
 */
// eslint-disable-next-line react/display-name
const DropDown = forwardRef<ISelect, IProps>(({ specs }, select) => {
  const initVal = Object.values(specs.kernelspecs ?? [])[0]?.name ?? '';
  const [selection, setSelection] = useState(initVal);

  // Note: It's normally best to avoid using an imperative handle if possible.
  // The better option would be to track state in the parent component and handle
  // the change events there as well, but I know this isn't always possible
  // alongside jupyter.
  useImperativeHandle(select, () => ({
    getSelection: (): string => selection
  }));

  const kernelOptions = !Object.keys(specs.kernelspecs).length ? (
    <option key="no-kernel" value="no-kernel">
      No Kernel
    </option>
  ) : (
    Object.entries(specs.kernelspecs).map(([key, val]) => (
      <option key={key} value={key}>
        {val?.display_name ?? key}
      </option>
    ))
  );

  return (
    <select
      className={KERNEL_SELECT_CLASS}
      onChange={(e): void => setSelection(e.target.value)}
      value={selection}
    >
      {kernelOptions}
    </select>
  );
});

/**
 * Wrap the dropDown into a React Widget in order to insert it into a Lab Toolbar Widget
 */
export class KernelDropdown extends ReactWidget {
  /**
   * Construct a new CellTypeSwitcher widget.
   */
  constructor(
    private specs: KernelSpec.ISpecModels,
    private ref: RefObject<ISelect>
  ) {
    super();
  }

  render(): React.ReactElement {
    return <DropDown ref={this.ref} specs={this.specs} />;
  }
}
