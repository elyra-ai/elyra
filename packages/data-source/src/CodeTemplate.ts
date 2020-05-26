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

import { SubmissionHandler } from '@elyra/application';

export interface ICodeTemplate {
  language: string;
  framework: string;
  format: string;
  code: string[];
}

export class CodeTemplateManager {
  readonly codeTemplateEndpoint = 'api/metadata/code-template';

  async findAll(): Promise<ICodeTemplate[]> {
    const getCodeTemplates: Promise<ICodeTemplate[]> = new Promise(
      (resolve, reject) => {
        const allCodeTemplates: ICodeTemplate[] = [];
        SubmissionHandler.makeGetRequest(
          this.codeTemplateEndpoint,
          'code templates',
          (response: any) => {
            const codeTemplatesResponse = response['code-template'];

            for (const codeTemplatesKey in codeTemplatesResponse) {
              const jsonCodeTemplate = codeTemplatesResponse[codeTemplatesKey];
              const codeTemplate: ICodeTemplate = {
                framework: jsonCodeTemplate.metadata.framework,
                format: jsonCodeTemplate.metadata.format,
                language: jsonCodeTemplate.metadata.language,
                code: jsonCodeTemplate.metadata.code
              };
              allCodeTemplates.push(codeTemplate);
            }
            resolve(allCodeTemplates);
          }
        );
      }
    );
    const codeTemplates = await getCodeTemplates;

    console.log(codeTemplates);
    return codeTemplates;
  }
}
