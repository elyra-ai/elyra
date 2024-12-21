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
    language: string,
  ): Promise<KernelSpec.ISpecModels | null> => {
    const specs = await this.getKernelSpecs();
    Object.entries(specs?.kernelspecs ?? [])
      .filter((entry) => entry[1]?.language.includes(language) === false)
      .forEach((entry) => delete specs?.kernelspecs[entry[0]]);

    return specs;
  };

  /**
   * Get kernel specs by name.
   */
  getKernelSpecsByName = async (
    kernelName: string,
  ): Promise<KernelSpec.ISpecModels | null> => {
    const specs = await this.getKernelSpecs();
    Object.entries(specs?.kernelspecs ?? [])
      .filter((entry) => entry[1]?.name?.includes(kernelName) === false)
      .forEach((entry) => delete specs?.kernelspecs[entry[0]]);

    return specs;
  };

  /**
   * Get the default kernel name from a given language
   * or the name of the first kernel from the list of kernelspecs.
   */
  getDefaultKernel = async (language: string): Promise<string> => {
    const kernelSpecs: KernelSpec.ISpecModels | null =
      await this.getKernelSpecs();
    if (!kernelSpecs) {
      return '';
    }

    if (kernelSpecs.default?.includes(language)) {
      return kernelSpecs.default;
    }

    return this.getFirstKernelName(language);
  };

  getFirstKernelName = async (language: string): Promise<string> => {
    const specsByLang = await this.getKernelSpecsByLanguage(language);

    const empty = '';
    if (specsByLang && Object.keys(specsByLang.kernelspecs).length !== 0) {
      const [key, value]: any = Object.entries(specsByLang.kernelspecs)[0];
      return value.name ?? key;
    }
    return empty;
  };

  /**
   * Return value of debugger boolean property from the kernel spec of a given name.
   */
  debuggerAvailable = async (kernelName: string | ''): Promise<boolean> => {
    const specs = await this.getKernelSpecsByName(kernelName);
    return !!(specs?.kernelspecs[kernelName]?.metadata?.['debugger'] ?? false);
  };
}
