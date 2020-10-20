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

import * as nbformat from '@jupyterlab/nbformat';
import { NotebookModel } from '@jupyterlab/notebook';
import { JupyterServer, NBTestUtils } from '@jupyterlab/testutils';

import { NotebookParser } from '../parsing';
import { RequestHandler } from '../requests';
import { FrontendServices } from '../services';

const server = new JupyterServer();
const notebookWithEnvVars: any = {
  cells: [
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        'import os\n',
        "print(os.environ['HOME'])\n",
        'print(os.getenv("HOME2"))\n',
        "print(os.getenvb('HOME3'))\n",
        'print(os.getenvb("HOME4"))\n',
        "print(os.environb['HOME5'))\n",
        'print(os.environb["HOME6"])\n'
      ]
    }
  ],
  metadata: {
    kernelspec: {
      display_name: 'Python 3',
      language: 'python',
      name: 'python3'
    },
    language_info: {
      codemirror_mode: {
        name: 'ipython',
        version: 3
      },
      file_extension: '.py',
      mimetype: 'text/x-python',
      name: 'python',
      nbconvert_exporter: 'python',
      pygments_lexer: 'ipython3',
      version: '3.7.6'
    }
  },
  nbformat: 4,
  nbformat_minor: 4
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
        const schemaResponse = await FrontendServices.getSchema(
          'code-snippets'
        );
        expect(schemaResponse[0]).toHaveProperty(
          'properties.schema_name.description',
          'The schema associated with this instance'
        );
      });
    });
    describe('#getAllSchema', () => {
      it('should get all schema', async () => {
        const schemas = await FrontendServices.getAllSchema();
        const schemaNames = schemas.map((schema: any) => {
          return schema.name;
        });
        const knownSchemaNames = ['code-snippet', 'runtime-image', 'kfp'];
        for (const schemaName of knownSchemaNames) {
          expect(schemaNames).toContain(schemaName);
        }
        expect(schemas.length).toBeGreaterThanOrEqual(knownSchemaNames.length);
      });
    });
    describe('metadata requests', () => {
      beforeAll(async () => {
        const existingSnippets = await FrontendServices.getMetadata(
          'code-snippets'
        );
        if (
          existingSnippets.find((snippet: any) => {
            return snippet.name === 'tester';
          })
        ) {
          await FrontendServices.deleteMetadata('code-snippet', 'tester');
        }
      });

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
        ).toContainEqual(codeSnippetMetadata);
      });

      it('should update the metadata instance', async () => {
        codeSnippetMetadata.metadata.code = ['testing'];
        expect(
          await FrontendServices.putMetadata(
            'code-snippets',
            'tester',
            JSON.stringify(codeSnippetMetadata)
          )
        ).toHaveProperty('metadata.code', ['testing']);
      });

      it('should delete the metadata instance', async () => {
        await FrontendServices.deleteMetadata('code-snippets', 'tester');
        const snippets = await FrontendServices.getMetadata('code-snippets');
        expect(snippets).not.toContain(codeSnippetMetadata);
      });
    });
  });

  describe('RequestHandler', () => {
    describe('#makeGetRequest', () => {
      it('should make get request', async () => {
        const schemaResponse = await RequestHandler.makeGetRequest(
          '/elyra/schema/code-snippets',
          false
        );
        expect(schemaResponse).toHaveProperty('code-snippets');
        expect(schemaResponse['code-snippets'].length).toBeGreaterThanOrEqual(
          1
        );
        expect(schemaResponse['code-snippets'][0]).toHaveProperty(
          'properties.schema_name.description',
          'The schema associated with this instance'
        );
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
      codeSnippetMetadata.metadata.language = 'R';
      it('should make put request', async () => {
        expect(
          await RequestHandler.makePutRequest(
            '/elyra/metadata/code-snippets/tester',
            JSON.stringify(codeSnippetMetadata),
            false
          )
        ).toHaveProperty('metadata.language', 'R');
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

  describe('NotebookParser', () => {
    describe('getEnvVars', () => {
      it('should find no env vars where there are none', () => {
        const notebook = NBTestUtils.createNotebook();
        NBTestUtils.populateNotebook(notebook);
        expect(
          NotebookParser.getEnvVars(notebook.model.toString())
        ).toMatchObject([]);
      });

      it('should find env vars', () => {
        const notebook = NBTestUtils.createNotebook();
        const model = new NotebookModel();
        model.fromJSON(notebookWithEnvVars as nbformat.INotebookContent);
        notebook.model = model;
        const foundEnvVars = NotebookParser.getEnvVars(
          notebook.model.toString()
        );
        expect(foundEnvVars).toContain('HOME');
        expect(foundEnvVars).toContain('HOME2');
        expect(foundEnvVars).toContain('HOME3');
        expect(foundEnvVars).toContain('HOME4');
        expect(foundEnvVars).toContain('HOME5');
        expect(foundEnvVars).toContain('HOME6');
      });
    });
  });
});
