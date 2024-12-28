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
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Chainable {
    installRuntimeConfig(options?: {
      type?: 'kfp' | 'airflow';
    }): Chainable<void>;
    createRuntimeConfig(options?: {
      type: 'kfp' | 'airflow' | 'invalid';
    }): Chainable<void>;
    createExampleComponentCatalog(options?: {
      type: 'kfp' | 'airflow';
    }): Chainable<void>;
    deleteFile(fileName: string): Chainable<void>;
    openDirectory(fileName: string): Chainable<void>;
    addFileToPipeline(fileName: string): Chainable<void>;
    dragAndDropFileToPipeline(fileName: string): Chainable<void>;
    createPipeline(options?: {
      name?: string;
      type?: 'kfp' | 'airflow' | 'generic';
    }): Chainable<void>;
    savePipeline(): Chainable<void>;
    openFile(fileName: string): Chainable<void>;
    bootstrapFile(fileName: string): Chainable<void>;
    resetJupyterLab(): Chainable<void>;
    checkTabMenuOptions(fileType: string): Chainable<void>;
    closeTab(index: number): Chainable<void>;
    createNewScriptEditor(language: string): Chainable<void>;
    checkScriptEditorToolbarContent(): Chainable<void>;
    checkRightClickTabContent(fileType: string): Chainable<void>;
    openFileAndCheckContent(fileExtension: string): Chainable<void>;
    openHelloWorld(fileExtension: string): Chainable<void>;
    dismissAssistant(fileType: string): Chainable<void>;
  }
}
