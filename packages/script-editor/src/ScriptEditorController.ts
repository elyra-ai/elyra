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

import { KernelSpec, KernelSpecManager } from '@jupyterlab/services';

export class ScriptEditorController {
  kernelSpecManager: KernelSpecManager;

  constructor() {
    this.kernelSpecManager = new KernelSpecManager();
  }

  /**
   * Get available kernelspecs.
   */
  getKernelSpecs = async (): Promise<KernelSpec.ISpecModels | null> => {
    await this.kernelSpecManager.ready;
    const kernelSpecs = await this.kernelSpecManager.specs;
    return kernelSpecs;
  };

  /**
   * Get available kernelspecs by language.
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
}
