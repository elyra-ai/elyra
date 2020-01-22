/*
 * Copyright 2018-2019 IBM Corporation
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

import {Kernel, KernelManager, KernelSpecManager } from '@jupyterlab/services';
import {CodeEditor} from '@jupyterlab/codeeditor';
import {Dialog, showDialog} from "@jupyterlab/apputils";

/**
 * Class: An enhanced Python Script Editor that enables developing and running the script
 */
export class PythonRunner {
    kernelSpecManager: KernelSpecManager;
    kernelManager: KernelManager;
    kernel : Kernel.IKernelConnection;
    model: CodeEditor.IModel;

  /**
   * Construct a new runner.
   */
    constructor(model: CodeEditor.IModel){
        this.kernelSpecManager = new KernelSpecManager();
        this.kernelManager = new KernelManager();
        this.model = model;
    }

    /**
     * Function: Starts a python kernel and executes code from file editor.
     */
    runPython = async (kernelName: string, handleKernelMsg: Function) => {
      if (!this.kernel) {
        const model = this.model;
        const code: string = model.value.text;

        try {
          this.kernel = await this.kernelManager.startNew({ name: kernelName });
        } catch (e) {
          return showDialog({
            title: 'Error',
            body: 'Could not start kernel environment to execute script.',
            buttons: [Dialog.okButton()]
          });
        }

        if (!this.kernel) {
          // kernel didn't get started
          return showDialog({
            title: 'Error',
            body: 'Could not start kernel environment to execute script.',
            buttons: [Dialog.okButton()]
          });
        }

        const future = this.kernel.requestExecute({code});

        future.onIOPub = (msg: any) => {
          let msgOutput: any = {};

          if (msg.msg_type === 'error') {
            msgOutput.error = {
              type: msg.content.ename,
              output: msg.content.evalue
            }
          } else if (msg.msg_type === 'execute_result') {
            if ('text/plain' in msg.content.data) {
              msgOutput.output = msg.content.data['text/plain'];
            } else {
              // ignore
              console.log('Ignoring received message ' + msg)
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
    getKernelSpecs = async () => {
      await this.kernelSpecManager.ready;
      const kernelSpecs = await this.kernelSpecManager.specs;
      return kernelSpecs;
    };

  /**
   * Function: Starts new kernel.
   */
    startKernel = async (options: Kernel.IKernelOptions) => {
      return this.kernelManager.startNew(options);
    };

  /**
   * Function: Shuts down kernel.
   */
    shutDownKernel = async () => {
      if (this.kernel) {
        const name = this.kernel.name;

        try {
          const tempKernel = this.kernel;
          // @ts-ignore
          this.kernel = null;
          await tempKernel.shutdown();
          console.log(name + ' kernel shut down');
        } catch (e) {
          console.log('Exception: shutdown = ' + JSON.stringify(e));
        }
      }
    }
}
