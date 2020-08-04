/*
 * Copyright 2018-2020 IBM Corporation
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

import { FrontendServices } from '@elyra/application';
import { IMetadata } from '@elyra/metadata-common';

import { Dialog, showDialog } from '@jupyterlab/apputils';

export const CODE_SNIPPET_NAMESPACE = 'code-snippets';
export const CODE_SNIPPET_SCHEMA = 'code-snippet';

export class CodeSnippetService {
  static async findAll(): Promise<IMetadata[]> {
    const codeSnippetsResponse = await FrontendServices.getMetadata(
      CODE_SNIPPET_NAMESPACE
    );

    return codeSnippetsResponse;
  }

  // TODO: Test this function
  static async findByLanguage(language: string): Promise<IMetadata[]> {
    const allCodeSnippets: IMetadata[] = await this.findAll();
    const codeSnippetsByLanguage: IMetadata[] = [];

    for (const codeSnippet of allCodeSnippets) {
      if (codeSnippet.metadata.language === language) {
        codeSnippetsByLanguage.push(codeSnippet);
      }
    }

    return codeSnippetsByLanguage;
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
  static deleteCodeSnippet(codeSnippet: IMetadata): Promise<boolean> {
    return showDialog({
      title: `Delete snippet: ${codeSnippet.display_name}?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result: any) => {
      // Do nothing if the cancel button is pressed
      if (result.button.accept) {
        FrontendServices.deleteMetadata(
          CODE_SNIPPET_NAMESPACE,
          codeSnippet.name
        );
        return true;
      } else {
        return false;
      }
    });
  }
}
