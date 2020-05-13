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

import { SubmissionHandler } from '@elyra/apputils';

export interface ICodeSnippet {
  name: string;
  displayName: string;
  description: string;
  language: string;
  code: string[];
}

export class CodeSnippetManager {
  readonly codeSnippetEndpoint = 'api/metadata/code-snippets';

  async findAll(): Promise<ICodeSnippet[]> {
    const getCodeSnippets: Promise<ICodeSnippet[]> = new Promise(
      (resolve, reject) => {
        const allCodeSnippets: ICodeSnippet[] = [];
        SubmissionHandler.makeGetRequest(
          this.codeSnippetEndpoint,
          'code snippets',
          (response: any) => {
            const codeSnippetsResponse = response['code-snippets'];

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
            resolve(allCodeSnippets);
          }
        );
      }
    );
    const codeSnippets = await getCodeSnippets;

    return codeSnippets;
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
}
