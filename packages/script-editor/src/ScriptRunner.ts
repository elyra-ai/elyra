/*
 * Copyright 2018-2023 Elyra Authors
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
  KernelAPI,
  KernelManager,
  KernelSpecManager,
  Session,
  SessionManager
} from '@jupyterlab/services';
import {
  IDisplayDataMsg,
  IErrorMsg,
  IExecuteResultMsg,
  IIOPubMessage,
  IStatusMsg,
  IStreamMsg
} from '@jupyterlab/services/lib/kernel/messages';

const KERNEL_ERROR_MSG =
  'Could not run script because no supporting kernel is defined.';
const SESSION_ERROR_MSG = 'Could not start session to execute script.';

export interface IScriptOutput {
  readonly type: string;
  readonly output: string;
}

/**
 * Utility class to enable running scripts in the context of a Kernel environment
 */
export class ScriptRunner {
  sessionManager: SessionManager;
  sessionConnection: Session.ISessionConnection | null;
  kernelSpecManager: KernelSpecManager;
  kernelManager: KernelManager;
  disableButton: (disabled: boolean) => void;

  /**
   * Construct a new runner.
   */
  constructor(disableButton: (disabled: boolean) => void) {
    this.disableButton = disableButton;

    this.kernelSpecManager = new KernelSpecManager();
    this.kernelManager = new KernelManager();
    this.sessionManager = new SessionManager({
      kernelManager: this.kernelManager
    });
    this.sessionConnection = null;
  }

  private errorDialog = (errorMsg: string): Promise<Dialog.IResult<string>> => {
    this.disableButton(false);
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
    kernelName: string | null,
    contextPath: string,
    code: string,
    handleKernelMsg: (msgOutput: any) => void
  ): Promise<any> => {
    if (!kernelName) {
      this.disableButton(true);
      return this.errorDialog(KERNEL_ERROR_MSG);
    }
    this.disableButton(true);

    try {
      await this.startSession(kernelName, contextPath);
    } catch (e) {
      return this.errorDialog(SESSION_ERROR_MSG);
    }

    if (!this.sessionConnection?.kernel) {
      // session didn't get started
      return this.errorDialog(SESSION_ERROR_MSG);
    }

    const future = this.sessionConnection.kernel.requestExecute({ code });

    future.onIOPub = (msg: IIOPubMessage): void => {
      const msgType = msg.header.msg_type;
      const msgOutput: any = {};

      if (msgType === 'error') {
        const errorMsg = msg as IErrorMsg;
        msgOutput.error = {
          type: errorMsg.content.ename,
          output: errorMsg.content.evalue
        };
      } else if (msgType === 'execute_result' || msgType === 'display_data') {
        const resultMsg = msg as IExecuteResultMsg | IDisplayDataMsg;
        if ('text/plain' in resultMsg.content.data) {
          msgOutput.output = resultMsg.content.data['text/plain'];
        } else {
          console.log('Ignoring received message ' + JSON.stringify(msg));
        }
      } else if (msgType === 'stream') {
        const streamMsg = msg as IStreamMsg;
        msgOutput.output = streamMsg.content.text;
      } else if (msgType === 'status') {
        const statusMsg = msg as IStatusMsg;
        msgOutput.status = statusMsg.content.execution_state;
      } else {
        // ignore other message types
      }

      // Notify UI
      handleKernelMsg(msgOutput);
    };

    try {
      await future.done;
      // TO DO: Keep session open but shut down kernel
      // this.interruptKernel(); // debugger is not triggered after this
      // this.shutdownKernel(); // also shuts down session for some reason
      this.disableButton(false);
    } catch (e) {
      console.log('Exception: done = ' + JSON.stringify(e));
    }
  };

  /**
   * Function: Starts new kernel session.
   */
  startSession = async (
    kernelName: string,
    contextPath: string
  ): Promise<void> => {
    const options: Session.ISessionOptions = {
      kernel: {
        name: kernelName
      },
      path: contextPath,
      type: 'file',
      name: contextPath
    };

    if (!this.sessionConnection || !this.sessionConnection.kernel) {
      try {
        this.sessionConnection = await this.sessionManager.startNew(options);
        this.sessionConnection.setPath(contextPath);
      } catch (e) {
        console.log('Exception: kernel start = ' + JSON.stringify(e));
      }
    }
  };

  /**
   * Function: Shuts down kernel session.
   */
  shutdownSession = async (): Promise<void> => {
    if (this.sessionConnection) {
      const name = this.sessionConnection.kernel?.name;

      try {
        await this.sessionConnection.shutdown();
        this.sessionConnection = null;
        console.log(name + ' kernel shut down');
      } catch (e) {
        console.log('Exception: session shutdown = ' + JSON.stringify(e));
      }
    }
  };

  /**
   * Function: Shuts down kernel.
   */
  shutdownKernel = async (): Promise<void> => {
    if (this.sessionConnection) {
      const kernel = this.sessionConnection.kernel;
      try {
        kernel && (await KernelAPI.shutdownKernel(kernel.id));
        console.log(kernel?.name + ' kernel shutdown');
      } catch (e) {
        console.log('Exception: kernel shutdown = ' + JSON.stringify(e));
      }
    }
  };

  /**
   * Function: Interrupts kernel.
   * TO DO: Interrupting kernel does not notify debugger service. Same behavior debugging notebooks.
   */
  interruptKernel = async (): Promise<void> => {
    if (this.sessionConnection) {
      const kernel = this.sessionConnection.kernel;
      try {
        kernel &&
          (await KernelAPI.interruptKernel(kernel.id, kernel.serverSettings));
        console.log(kernel?.name + ' kernel interrupted.');
        this.disableButton(false);
      } catch (e) {
        console.log('Exception: kernel interrupt = ' + JSON.stringify(e));
      }
    }
  };
}
