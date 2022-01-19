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

import { Dialog, showDialog } from '@jupyterlab/apputils';
import {
  KernelManager,
  KernelSpecManager,
  Session,
  SessionManager
} from '@jupyterlab/services';

const KERNEL_ERROR_MSG =
  'Could not run script because no supporting kernel is defined.';
const SESSION_ERROR_MSG = 'Could not start session to execute script.';

export interface IScriptOutput {
  readonly type: string;
  readonly output: string;
}

/**
 * Utility class to enable running scripts files in the context of a Kernel environment
 */
export class ScriptRunner {
  sessionManager: SessionManager;
  sessionConnection: Session.ISessionConnection | null;
  kernelSpecManager: KernelSpecManager;
  kernelManager: KernelManager;
  disableRun: (disabled: boolean) => void;

  /**
   * Construct a new runner.
   */
  constructor(disableRun: (disabled: boolean) => void) {
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
   * Function: Starts a session with a proper kernel and executes code from file editor.
   */
  runScript = async (
    kernelName: string | undefined,
    contextPath: string,
    code: string,
    handleKernelMsg: (msgOutput: any) => void
  ): Promise<any> => {
    if (!kernelName) {
      this.disableRun(true);
      return this.errorDialog(KERNEL_ERROR_MSG);
    }

    if (!this.sessionConnection) {
      this.disableRun(true);

      try {
        await this.startSession(kernelName, contextPath);
      } catch (e) {
        return this.errorDialog(SESSION_ERROR_MSG);
      }

      // This is a bit weird, seems like typescript doesn't believe that `startSession`
      // can set `sessionConnection`
      this.sessionConnection = this
        .sessionConnection as Session.ISessionConnection | null;
      if (!this.sessionConnection?.kernel) {
        // session didn't get started
        return this.errorDialog(SESSION_ERROR_MSG);
      }

      const future = this.sessionConnection.kernel.requestExecute({ code });

      future.onIOPub = (msg: any): void => {
        const msgOutput: any = {};

        if (msg.msg_type === 'error') {
          msgOutput.error = {
            type: msg.content.ename,
            output: msg.content.evalue
          };
        } else if (
          msg.msg_type === 'execute_result' ||
          msg.msg_type === 'display_data'
        ) {
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
   * Function: Starts new kernel.
   */
  startSession = async (
    kernelName: string,
    contextPath: string
  ): Promise<Session.ISessionConnection> => {
    const options: Session.ISessionOptions = {
      kernel: {
        name: kernelName
      },
      path: contextPath,
      type: 'file',
      name: contextPath
    };

    this.sessionConnection = await this.sessionManager.startNew(options);
    this.sessionConnection.setPath(contextPath);

    return this.sessionConnection;
  };

  /**
   * Function: Shuts down kernel.
   */
  shutdownSession = async (): Promise<void> => {
    if (this.sessionConnection) {
      const name = this.sessionConnection.kernel?.name;

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
