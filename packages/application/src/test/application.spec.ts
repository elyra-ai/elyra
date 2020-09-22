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

import { JupyterServer } from '@jupyterlab/testutils';

import { FrontendServices } from '../services';

const server = new JupyterServer();

beforeAll(async () => {
  await server.start();
});

afterAll(async () => {
  await server.shutdown();
});

describe('@elyra/application', () => {
  describe('FrontendServices', () => {
    describe('#getSchema', () => {
      it('should get schema', async () => {
        expect(await FrontendServices.getSchema('code-snippets')).toEqual([
          {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'Code Snippet',
            name: 'code-snippet',
            display_name: 'Code Snippet',
            namespace: 'code-snippets',
            uihints: {
              title: 'Code Snippets',
              icon: 'elyra:code-snippet'
            },
            properties: {
              schema_name: {
                title: 'Schema Name',
                description: 'The schema associated with this instance',
                type: 'string',
                pattern: '^[a-z][a-z0-9-_]*[a-z0-9]$',
                minLength: 1
              },
              display_name: {
                title: 'Display Name',
                description: 'The display name of the Code Snippet',
                type: 'string',
                minLength: 1
              },
              metadata: {
                description: 'Additional data specific to this Code Snippet',
                type: 'object',
                properties: {
                  description: {
                    title: 'Description',
                    description: 'Code snippet description',
                    type: 'string'
                  },
                  language: {
                    title: 'Language',
                    description: 'Code snippet implementation language',
                    type: 'string',
                    uihints: {
                      field_type: 'dropdown',
                      default_choices: [
                        'Python',
                        'Java',
                        'R',
                        'Scala',
                        'Markdown'
                      ]
                    },
                    minLength: 1
                  },
                  code: {
                    title: 'Code',
                    description: 'Code snippet code lines',
                    type: 'array',
                    uihints: {
                      field_type: 'code'
                    }
                  }
                },
                required: ['language', 'code']
              }
            },
            required: ['schema_name', 'display_name', 'metadata']
          }
        ]);
      });
    });
    describe('#getAllSchema', () => {
      it('should get all schema', async () => {
        const schemas = await FrontendServices.getAllSchema();
        expect(schemas).toHaveLength(3);
      });
    });
  });
});
