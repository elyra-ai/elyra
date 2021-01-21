/*
 * Copyright 2018-2020 Elyra Authors
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

import { Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  KernelManager,
  KernelSpec,
  KernelSpecManager,
  Session,
  SessionManager
} from '@jupyterlab/services';

/**
 * Class: An enhanced Python Script Editor that enables developing and running the script
 */
export class PythonRunner {
  sessionManager: SessionManager;
  sessionConnection: Session.ISessionConnection;
  kernelSpecManager: KernelSpecManager;
  kernelManager: KernelManager;
  model: CodeEditor.IModel;
  context: DocumentRegistry.Context;
  disableRun: (x: boolean) => any;

  /**
   * Construct a new runner.
   */
  constructor(
    model: CodeEditor.IModel,
    context: DocumentRegistry.Context,
    disableRun: (x: boolean) => any
  ) {
    this.model = model;
    this.context = context;
    this.disableRun = disableRun;

    this.kernelSpecManager = new KernelSpecManager();
    this.kernelManager = new KernelManager();
    this.sessionManager = new SessionManager({
      kernelManager: this.kernelManager
    });
    this.sessionConnection = null;
  }

  private errorDialog = (errorMsg: string): Promise<Dialog.IResult<string>> => {
    this.disableRun(false);
    return showDialog({
      title: 'Error',
      body: errorMsg,
      buttons: [Dialog.okButton()]
    });
  };

  /**
   * Function: Starts a session with a python kernel and executes code from file editor.
   */
  runPython = async (
    kernelName: string,
    handleKernelMsg: (x: any) => any
  ): Promise<any> => {
    if (!this.sessionConnection) {
      this.disableRun(true);
      const model = this.model;
      const code: string = model.value.text;

      try {
        await this.startSession(kernelName);
      } catch (e) {
        return this.errorDialog('Could not start session to execute script.');
      }

      if (!this.sessionConnection) {
        // session didn't get started
        return this.errorDialog('Failed to start session to execute script.');
      }

      const future = this.sessionConnection.kernel.requestExecute({ code });

      future.onIOPub = (msg: any): void => {
        const msgOutput: any = {};

        if (msg.msg_type === 'error') {
          msgOutput.error = {
            type: msg.content.ename,
            output: msg.content.evalue
          };
        } else if (msg.msg_type === 'execute_result') {
          if ('text/plain' in msg.content.data) {
            msgOutput.output = msg.content.data['text/plain'];
          } else {
            // ignore
            console.log('Ignoring received message ' + msg);
          }
        } else if (msg.msg_type === 'stream') {
          msgOutput.output = msg.content.text;
        } else if (msg.msg_type === 'status') {
          msgOutput.status = msg.content.execution_state;
        } else {
          // ignore other message types
        }

        // Notify UI
        handleKernelMsg(msgOutput);
      };

      try {
        await future.done;
        this.shutdownSession();
      } catch (e) {
        console.log('Exception: done = ' + JSON.stringify(e));
      }
    }
  };

  /**
   * Function: Gets available kernel specs.
   */
  getKernelSpecs = async (): Promise<KernelSpec.ISpecModels> => {
    await this.kernelSpecManager.ready;
    const kernelSpecs = await this.kernelSpecManager.specs;
    return kernelSpecs;
  };

  /**
   * Function: Starts new kernel.
   */
  startSession = async (
    kernelName: string
  ): Promise<Session.ISessionConnection> => {
    const options: Session.ISessionOptions = {
      kernel: {
        name: kernelName
      },
      path: this.context.path,
      type: 'file',
      name: this.context.path
    };

    this.sessionConnection = await this.sessionManager.startNew(options);
    this.sessionConnection.setPath(this.context.path);

    return this.sessionConnection;
  };

  /**
   * Function: Shuts down kernel.
   */
  shutdownSession = async (): Promise<void> => {
    if (this.sessionConnection) {
      const name = this.sessionConnection.kernel.name;

      try {
        this.disableRun(false);
        await this.sessionConnection.shutdown();
        this.sessionConnection = null;
        console.log(name + ' kernel shut down');
      } catch (e) {
        console.log('Exception: shutdown = ' + JSON.stringify(e));
      }
    }
  };
}
