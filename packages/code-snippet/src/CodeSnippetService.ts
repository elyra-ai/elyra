/*
 * Copyright 2018-2025 Elyra Authors
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

import { IMetadataResource, MetadataService } from '@elyra/services';

import { Dialog, showDialog } from '@jupyterlab/apputils';

export const CODE_SNIPPET_SCHEMASPACE = 'code-snippets';
export const CODE_SNIPPET_SCHEMA = 'code-snippet';

export class CodeSnippetService {
  static async findAll(): Promise<IMetadataResource[]> {
    return (await MetadataService.getMetadata(CODE_SNIPPET_SCHEMASPACE)) ?? [];
  }

  // TODO: Test this function
  static async findByLanguage(language: string): Promise<IMetadataResource[]> {
    try {
      const allCodeSnippets = await this.findAll();
      const codeSnippetsByLanguage: IMetadataResource[] = [];

      for (const codeSnippet of allCodeSnippets) {
        if (codeSnippet.metadata.language === language) {
          codeSnippetsByLanguage.push(codeSnippet);
        }
      }

      return codeSnippetsByLanguage;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Opens a dialog to confirm that the given code snippet
   * should be deleted, then sends a delete request to the metadata server.
   *
   * @param codeSnippet: code snippet to be deleted
   *
   * @returns A boolean promise that is true if the dialog confirmed
   * the deletion, and false if the deletion was cancelled.
   */
  static deleteCodeSnippet(codeSnippet: IMetadataResource): Promise<boolean> {
    return showDialog({
      title: `Delete snippet '${codeSnippet.display_name}'?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result) => {
      // Do nothing if the cancel button is pressed
      if (result.button.accept) {
        return MetadataService.deleteMetadata(
          CODE_SNIPPET_SCHEMASPACE,
          codeSnippet.name
        ).then(() => true);
      } else {
        return false;
      }
    });
  }
}
