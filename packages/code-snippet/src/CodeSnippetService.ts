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

import { Dialog, showDialog } from '@jupyterlab/apputils';

export const CODE_SNIPPET_NAMESPACE = 'code-snippets';

export interface ICodeSnippet {
  name: string;
  displayName: string;
  description: string;
  language: string;
  code: string[];
}

export class CodeSnippetService {
  async findAll(): Promise<ICodeSnippet[]> {
    const codeSnippetsResponse = await FrontendServices.getMetadata(
      'code-snippets'
    );
    const allCodeSnippets: ICodeSnippet[] = [];

    for (const codeSnippetKey in codeSnippetsResponse) {
      const jsonCodeSnippet = codeSnippetsResponse[codeSnippetKey];
      const codeSnippet: ICodeSnippet = {
        name: jsonCodeSnippet.name,
        displayName: jsonCodeSnippet.display_name,
        description: jsonCodeSnippet.metadata.description,
        language: jsonCodeSnippet.metadata.language,
        code: jsonCodeSnippet.metadata.code
      };
      allCodeSnippets.push(codeSnippet);
    }

    return allCodeSnippets;
  }

  // TODO: Test this function
  async findByLanguage(language: string): Promise<ICodeSnippet[]> {
    const allCodeSnippets: ICodeSnippet[] = await this.findAll();
    const codeSnippetsByLanguage: ICodeSnippet[] = [];

    for (const codeSnippet of allCodeSnippets) {
      if (codeSnippet.language === language) {
        codeSnippetsByLanguage.push(codeSnippet);
      }
    }

    return codeSnippetsByLanguage;
  }

  deleteCodeSnippet(
    codeSnippet: ICodeSnippet,
    updateSnippets: () => void
  ): Promise<void> {
    return showDialog({
      title: `Delete snippet: ${codeSnippet.displayName}?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result: any) => {
      // Do nothing if the cancel button is pressed
      if (result.button.accept) {
        FrontendServices.deleteMetadata(
          CODE_SNIPPET_NAMESPACE,
          codeSnippet.name
        );
      }
    });
  }
}
