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

import {SubmissionHandler} from "@elyra/application";

export interface ICodeSnippet {
    /*
    {
      "bloh": {
        "display_name": "blah",
        "metadata": {
          "language": "python",
          "code": [
            "def create_project_temp_dir():",
            "   temp_dir = tempfile.gettempdir()",
            "   project_temp_dir = os.path.join(temp_dir, 'elyra')",
            "   if not os.path.exists(project_temp_dir):",
            "     os.mkdir(project_temp_dir)",
            "   return project_temp_dir"
          ]
        },
        "schema_name": "code-snippet",
        "name": "bloh",
        "resource": "/Users/lresende/Library/Jupyter/metadata/code-snippet/bloh.json"
      }
    }*/

    name: string;
    displayName: string;
    language: string;
    code: string[];
}


export class CodeSnippetManager {
    readonly codeSnippetEndpoint = 'api/metadata/code-snippets';

    constructor() {

    }

    async findAll(): Promise<ICodeSnippet[]> {
        let allCodeSnippets: ICodeSnippet[] = [];
        SubmissionHandler.makeGetRequest(this.codeSnippetEndpoint, 'code-snippets', (response: any) => {
            const codeSnippetsResponse = response['code-snippets'];

            for(let codeSnippetKey in codeSnippetsResponse) {
                let jsonCodeSnippet = (codeSnippetsResponse[codeSnippetKey]);
                const codeSnippet: ICodeSnippet = {
                    name: jsonCodeSnippet.name,
                    displayName: jsonCodeSnippet.display_name,
                    language: jsonCodeSnippet.metadata.language,
                    code: jsonCodeSnippet.metadata.code
                };
                allCodeSnippets.push(codeSnippet);
            }
        });
        return allCodeSnippets;
    }

    async findByLanguage(language: string): Promise<ICodeSnippet[]> {
        let allCodeSnippets : ICodeSnippet[] = await this.findAll();
        let codeSnippetsByLanguage : ICodeSnippet[] = [];

        for (let codeSnippet of allCodeSnippets) {
            if (codeSnippet.language === language) {
                codeSnippetsByLanguage.push(codeSnippet);
            }
        }

        return codeSnippetsByLanguage;
    }
}
