/*
 * Copyright 2018-2022 Elyra Authors
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
import { Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { KernelSpec, KernelSpecManager } from '@jupyterlab/services';

export class ScriptEditorController {
  kernelSpecManager: KernelSpecManager;

  constructor() {
    this.kernelSpecManager = new KernelSpecManager();
  }

  /**
   * Get available kernel specs.
   */
  getKernelSpecs = async (): Promise<KernelSpec.ISpecModels | null> => {
    await this.kernelSpecManager.ready;
    const specs = this.kernelSpecManager.specs;

    // return a deep copy of the object preserving the original type
    return JSON.parse(JSON.stringify(specs)) as typeof specs;
  };

  /**
   * Get available kernel specs by language.
   */
  getKernelSpecsByLanguage = async (
    language: string
  ): Promise<KernelSpec.ISpecModels | null> => {
    const specs = await this.getKernelSpecs();
    Object.entries(specs?.kernelspecs ?? [])
      .filter(entry => entry[1]?.language.includes(language) === false)
      .forEach(entry => delete specs?.kernelspecs[entry[0]]);

    return specs;
  };

  /**
   * Get kernel specs by name.
   */
  getKernelSpecsByName = async (
    kernelName: string
  ): Promise<KernelSpec.ISpecModels | null> => {
    const specs = await this.getKernelSpecs();
    Object.entries(specs?.kernelspecs ?? [])
      .filter(entry => entry[1]?.name?.includes(kernelName) === false)
      .forEach(entry => delete specs?.kernelspecs[entry[0]]);

    return specs;
  };

  /**
   * Get the default kernel name from a given language.
   */
  getDefaultKernel = async (language: string): Promise<string | null> => {
    const kernelSpecs = await this.getKernelSpecs();
    if (!kernelSpecs) {
      return null;
    }
    return kernelSpecs.default.includes(language) ? kernelSpecs.default : null;
  };

  /**
   * Return value of debugger boolean property from the kernel spec of a given name.
   */
  debuggerAvailable = async (kernelName: string | ''): Promise<boolean> => {
    const specs = await this.getKernelSpecsByName(kernelName);
    return !!(specs?.kernelspecs[kernelName]?.metadata?.['debugger'] ?? false);
  };

  /**
   * Return true if debugger state is enabled.
   * TODO: Implement a better way to check this state that is not through the UI.
   */
  debuggerEnabled = (toolbar: Toolbar): boolean => {
    const childrenIt = toolbar.children();
    for (let child = childrenIt.next(); child; child = childrenIt.next()) {
      const button = child as ToolbarButton;
      if (
        button.node.children[0]?.className?.match(/debugger/i) &&
        button.pressed
      ) {
        // debugger is enabled
        return true;
      }
    }
    return false;
  };
}
