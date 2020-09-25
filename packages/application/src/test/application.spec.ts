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

import { RequestHandler } from '../requests';
import { FrontendServices } from '../services';

const server = new JupyterServer();
const codeSnippetSchema = {
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
            default_choices: ['Python', 'Java', 'R', 'Scala', 'Markdown']
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
};

const codeSnippetMetadata = {
  schema_name: 'code-snippet',
  display_name: 'tester',
  name: 'tester',
  metadata: {
    language: 'Python',
    code: ['hello_world']
  }
};

const updatedCodeSnippetMetadata = {
  schema_name: 'code-snippet',
  display_name: 'tester',
  name: 'tester',
  metadata: {
    language: 'Python',
    code: ['testing']
  }
};

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
          codeSnippetSchema
        ]);
      });
    });
    describe('#getAllSchema', () => {
      it('should get all schema', async () => {
        const schemas = await FrontendServices.getAllSchema();
        expect(schemas).toHaveLength(3);
      });
    });
    describe('metadata requests', () => {
      it('should create metadata instance', async () => {
        expect(
          await FrontendServices.postMetadata(
            'code-snippets',
            JSON.stringify(codeSnippetMetadata)
          )
        ).toMatchObject(codeSnippetMetadata);
      });

      it('should get the correct metadata instance', async () => {
        expect(
          await FrontendServices.getMetadata('code-snippets')
        ).toMatchObject([codeSnippetMetadata]);
      });

      it('should update the metadata instance', async () => {
        expect(
          await FrontendServices.putMetadata(
            'code-snippets',
            'tester',
            JSON.stringify(updatedCodeSnippetMetadata)
          )
        ).toMatchObject(updatedCodeSnippetMetadata);
      });

      it('should delete the metadata instance', async () => {
        await FrontendServices.deleteMetadata('code-snippets', 'tester');
        const snippets = await FrontendServices.getMetadata('code-snippets');
        expect(snippets).toHaveLength(0);
      });
    });
  });

  describe('RequestHandler', () => {
    describe('#makeGetRequest', () => {
      it('should make get request', async () => {
        expect(
          await RequestHandler.makeGetRequest(
            '/elyra/schema/code-snippets',
            false
          )
        ).toMatchObject({
          'code-snippets': [codeSnippetSchema]
        });
      });
    });
    describe('#makePostRequest', () => {
      it('should make post request', async () => {
        expect(
          await RequestHandler.makePostRequest(
            '/elyra/metadata/code-snippets',
            JSON.stringify(codeSnippetMetadata),
            false
          )
        ).toMatchObject(codeSnippetMetadata);
      });
    });
    describe('#makePutRequest', () => {
      it('should make put request', async () => {
        expect(
          await RequestHandler.makePutRequest(
            '/elyra/metadata/code-snippets/tester',
            JSON.stringify(updatedCodeSnippetMetadata),
            false
          )
        ).toMatchObject(updatedCodeSnippetMetadata);
      });
    });
    describe('#makeDeleteRequest', () => {
      it('should make delete request', async () => {
        await RequestHandler.makeDeleteRequest(
          '/elyra/metadata/code-snippets/tester',
          false
        );
        expect(
          await RequestHandler.makeGetRequest(
            'elyra/metadata/code-snippets',
            false
          )
        ).toMatchObject({ 'code-snippets': [] });
      });
    });
  });
});
