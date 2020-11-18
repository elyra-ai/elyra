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

import { MetadataService } from '../MetadataService';

const server = new JupyterServer();

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

describe('@elyra/metadata-common', () => {
  describe('MetadataService', () => {
    describe('#getSchema', () => {
      it('should get schema', async () => {
        const schemaResponse = await MetadataService.getSchema('code-snippets');
        expect(schemaResponse[0]).toHaveProperty(
          'properties.schema_name.description',
          'The schema associated with this instance'
        );
      });
    });
    describe('#getAllSchema', () => {
      it('should get all schema', async () => {
        const schemas = await MetadataService.getAllSchema();
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
        const existingSnippets = await MetadataService.getMetadata(
          'code-snippets'
        );
        if (
          existingSnippets.find((snippet: any) => {
            return snippet.name === 'tester';
          })
        ) {
          await MetadataService.deleteMetadata('code-snippet', 'tester');
        }
      });

      it('should create metadata instance', async () => {
        expect(
          await MetadataService.postMetadata(
            'code-snippets',
            JSON.stringify(codeSnippetMetadata)
          )
        ).toMatchObject(codeSnippetMetadata);
      });

      it('should get the correct metadata instance', async () => {
        expect(
          await MetadataService.getMetadata('code-snippets')
        ).toContainEqual(codeSnippetMetadata);
      });

      it('should update the metadata instance', async () => {
        codeSnippetMetadata.metadata.code = ['testing'];
        expect(
          await MetadataService.putMetadata(
            'code-snippets',
            'tester',
            JSON.stringify(codeSnippetMetadata)
          )
        ).toHaveProperty('metadata.code', ['testing']);
      });

      it('should delete the metadata instance', async () => {
        await MetadataService.deleteMetadata('code-snippets', 'tester');
        const snippets = await MetadataService.getMetadata('code-snippets');
        expect(snippets).not.toContain(codeSnippetMetadata);
      });
    });
  });
});
