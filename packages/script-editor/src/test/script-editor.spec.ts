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
      let runner: ScriptRunner;
      const testPath = 'test.py';

      beforeEach(() => {
        runner = new ScriptRunner((x: boolean): void => console.log(x));
      });

      it('should start a kernel session', async () => {
        const session = await runner.startSession(language, testPath);
        expect(session.id).toEqual(runner.sessionConnection?.id);
        expect(runner.sessionConnection?.kernel?.connectionStatus).toEqual(
          'connecting'
        );
        runner.shutdownSession();
      });

      it('should shut down a kernel session', async () => {
        await runner.startSession(language, 'test.py');
        await runner.shutdownSession();
        expect(runner.sessionConnection).toBeNull();
      });

      // Test should run script
      it('should run script', async () => {
        const code = 'print("Test")';
        await runner.startSession(language, 'test.py');
        const kernelMsg = async (msg: any): Promise<void> => {
          msg.output && expect(msg.output).toEqual('Test');
        };
        await runner.runScript(language, testPath, code, kernelMsg);
        await runner.shutdownSession();
      });

      // Test should receive error message when running a broken script
    });
  });
});
