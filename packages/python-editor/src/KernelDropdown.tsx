/*
 * Copyright 2018-2020 Elyra Authors
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
import { HTMLSelect } from '@jupyterlab/ui-components';
import React from 'react';

import { PythonRunner } from './PythonRunner';

const DROPDOWN_CLASS = 'jp-Notebook-toolbarCellTypeDropdown bp3-minimal';

/**
 * Class: Holds properties for toolbar dropdown.
 */
class DropDownProps {
  runner: PythonRunner;
  updateKernel: (k: string) => any;
}

/**
 * Class: Holds kernel state property.
 */
class DropDownState {
  kernelSpecs: KernelSpec.ISpecModels;
}

/**
 * Class: A toolbar dropdown component populated with available kernel specs.
 */
class DropDown extends React.Component<DropDownProps, DropDownState> {
  private updateKernel: (k: string) => any;
  private kernelOptionElems: Record<string, any>[];

  /**
   * Construct a new dropdown widget.
   */
  constructor(props: DropDownProps) {
    super(props);
    this.state = { kernelSpecs: null };
    this.updateKernel = this.props.updateKernel;
    this.kernelOptionElems = [];
    this.getKernelSPecs();
  }

  /**
   * Function: Gets kernel specs and state.
   */
  private async getKernelSPecs(): Promise<void> {
    const specs: KernelSpec.ISpecModels = await this.props.runner.getKernelSpecs();
    this.filterPythonKernels(specs);

    // Set kernel to default
    this.updateKernel(specs.default);

    this.createOptionElems(specs);
    this.setState({ kernelSpecs: specs });
  }

  /**
   * Function: Filters for python kernel specs only.
   */
  private filterPythonKernels = (specs: KernelSpec.ISpecModels): void => {
    Object.entries(specs.kernelspecs)
      .filter(entry => entry[1].language.includes('python') === false)
      .forEach(entry => delete specs.kernelspecs[entry[0]]);
  };

  /**
   * Function: Creates drop down options with available python kernel specs.
   */
  private createOptionElems = (specs: KernelSpec.ISpecModels): void => {
    const kernelNames: string[] = Object.keys(specs.kernelspecs);
    kernelNames.forEach((specName: string, i: number) => {
      const elem = React.createElement(
        'option',
        { key: i, value: specName },
        specName
      );
      this.kernelOptionElems.push(elem);
    });
  };

  /**
   * Function: Handles kernel selection from dropdown options.
   */
  private handleSelection = (event: any): void => {
    const selection: string = event.target.value;
    this.updateKernel(selection);
  };

  render(): React.ReactElement {
    return this.state.kernelSpecs
      ? React.createElement(
          HTMLSelect,
          {
            className: DROPDOWN_CLASS,
            onChange: this.handleSelection.bind(this),
            defaultValue: this.state.kernelSpecs.default
          },
          this.kernelOptionElems
        )
      : React.createElement('span', null, 'Fetching kernel specs...');
  }
}

/**
 * Class: A CellTypeSwitcher widget that renders the Dropdown component.
 */
export class KernelDropdown extends ReactWidget {
  private runner: PythonRunner;
  private updateKernel: (k: string) => any;

  /**
   * Construct a new CellTypeSwitcher widget.
   */
  constructor(runner: PythonRunner, updateKernel: (k: string) => any) {
    super();
    this.runner = runner;
    this.updateKernel = updateKernel;
  }

  render(): React.ReactElement {
    return (
      <DropDown {...{ runner: this.runner, updateKernel: this.updateKernel }} />
    );
  }
}
