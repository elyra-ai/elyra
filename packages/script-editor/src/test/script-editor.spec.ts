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
jest.setTimeout(3 * 60 * 1000);

const server = new JupyterServer();
const language = 'python';

beforeAll(async () => {
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
      let kernelName: string;
      const testPath = 'test.py';

      beforeEach(async () => {
        runner = new ScriptRunner((x: boolean): void => console.log(x));
        const controller = new ScriptEditorController();
        const kernelSpecs = await controller.getKernelSpecsByLanguage(language);
        kernelName =
          Object.values(kernelSpecs?.kernelspecs ?? [])[0]?.name || '';
      });

      it('should start a kernel session', async () => {
        const session = await runner.startSession(kernelName, testPath);
        expect(session.id).toEqual(runner.sessionConnection?.id);
        expect(runner.sessionConnection?.kernel?.connectionStatus).toEqual(
          'connecting'
        );
        runner.shutdownSession();
      });

      it('should shut down a kernel session', async () => {
        await runner.startSession(kernelName, 'test.py');
        await runner.shutdownSession();
        expect(runner.sessionConnection).toBeNull();
      });

      it('should run script', async () => {
        const code = 'print("Test")';
        const testCallback = async (kernelMsg: any): Promise<void> =>
          kernelMsg.output && expect(kernelMsg.output).toMatch(/test/i);
        expect(kernelName).not.toBe('');
        await runner.runScript(kernelName, testPath, code, testCallback);
        await runner.shutdownSession();
      });

      it('should receive error message when running a broken script', async () => {
        const code = 'print(Broken Test)';
        const testCallback = async (kernelMsg: any): Promise<void> =>
          kernelMsg.error && expect(kernelMsg.error.type).toMatch(/error/i);
        expect(kernelName).not.toBe('');
        await runner.runScript(kernelName, testPath, code, testCallback);
        await runner.shutdownSession();
      });
    });
  });
});
