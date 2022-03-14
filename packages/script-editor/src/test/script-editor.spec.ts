/*
 * Copyright 2018-2022 Elyra Authors
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

import { ScriptEditorController } from '../ScriptEditorController';
import { ScriptRunner } from '../ScriptRunner';

const server = new JupyterServer();
const language = 'python';

beforeAll(async () => {
  jest.setTimeout(20000);
  await server.start();
});

afterAll(async () => {
  await server.shutdown();
});

describe('@elyra/script-editor', () => {
  describe('ScriptEditorController', () => {
    describe('#getKernelSpecs', () => {
      it('should get Python kernel specs', async () => {
        const controller = new ScriptEditorController();
        const kernelSpecs = await controller.getKernelSpecsByLanguage(language);
        for (const [key, value] of Object.entries(
          kernelSpecs?.kernelspecs ?? []
        )) {
          expect(key).toContain(language);
          expect(value?.language).toContain(language);
        }
      });
    });
  });

  describe('KernelManager', () => {
    describe('#startSession', () => {
      it('should start a kernel session', async () => {
        const dummyFunc = (x: boolean): void => console.log(x);
        const runner = new ScriptRunner(dummyFunc);
        const session = await runner.startSession(language, 'test.py');
        expect(session.id).toBeTruthy();
        expect(session.id).toEqual(runner.sessionConnection?.id);
      });
    });
  });
});
