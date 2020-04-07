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

import { Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Kernel } from '@jupyterlab/services';

/**
 * Class: An enhanced Python Script Editor that enables developing and running the script
 */
export class PythonRunner {
  kernel: Kernel.IKernel;
  model: CodeEditor.IModel;
  kernelSettings: Kernel.IOptions;
  disableRun: Function;

  /**
   * Construct a new runner.
   */
  constructor(model: CodeEditor.IModel, disableRun: Function) {
    this.kernel = null;
    this.model = model;
    this.disableRun = disableRun;
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
   * Function: Starts a python kernel and executes code from file editor.
   */
  runPython = async (
    kernelSettings: Kernel.IOptions,
    handleKernelMsg: Function
  ): Promise<any> => {
    if (!this.kernel) {
      this.disableRun(true);
      const model = this.model;
      const code: string = model.value.text;

      try {
        this.kernel = await this.startKernel(kernelSettings);
      } catch (e) {
        return this.errorDialog(
          'Could not start kernel environment to execute script.'
        );
      }

      if (!this.kernel) {
        // kernel didn't get started
        return this.errorDialog(
          'Failed to start kernel environment to execute script.'
        );
      } else if (!this.kernel.ready) {
        // kernel started, but something is wrong and the kernel is not ready
        // shut down the kernel to unblock the start of a new kernel
        this.shutDownKernel();
        return this.errorDialog(
          'Kernel environment not ready to execute script.'
        );
      }

      const future = this.kernel.requestExecute({ code });

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
        this.shutDownKernel();
      } catch (e) {
        console.log('Exception: done = ' + JSON.stringify(e));
      }
    }
  };

  /**
   * Function: Gets available kernel specs.
   */
  getKernelSpecs = async (): Promise<Kernel.ISpecModels> => {
    const kernelSpecs = await Kernel.getSpecs();
    return kernelSpecs;
  };

  /**
   * Function: Starts new kernel.
   */
  startKernel = async (options: Kernel.IOptions): Promise<Kernel.IKernel> => {
    return Kernel.startNew(options);
  };

  /**
   * Function: Shuts down kernel.
   */
  shutDownKernel = async (): Promise<void> => {
    if (this.kernel) {
      const name = this.kernel.name;

      try {
        const tempKernel = this.kernel;
        this.kernel = null;
        this.disableRun(false);
        await tempKernel.shutdown();
        console.log(name + ' kernel shut down');
      } catch (e) {
        console.log('Exception: shutdown = ' + JSON.stringify(e));
      }
    }
  };
}
