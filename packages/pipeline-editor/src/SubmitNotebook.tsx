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

import { NotebookParser } from '@elyra/application';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { Dialog, showDialog, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { JSONObject, JSONValue } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

import { dialogWidget } from './dialogWidget';
import NotebookSubmissionDialog from './NotebookSubmissionDialog';
import { PipelineService } from './PipelineService';
import Utils from './utils';

/**
 * Details about notebook submission configuration, including
 * details about the remote runtime and any other
 * user details required to access/start the job
 */
export interface ISubmitNotebookConfiguration extends JSONObject {
  runtime_config: string;
  framework: string;
  //cpus: number,
  //gpus: number,
  //memory: string,
  dependencies: string[];

  env: string[];
}

/**
 * Details about notebook submission task, includes the submission
 * configuration plus the notebook contents that is being submitted
 */
export interface ISubmitNotebookOptions extends ISubmitNotebookConfiguration {
  kernelspec: string;
  notebook_name: string;
  notebook_path: string;
  notebook: JSONValue;
}

/**
 * Submit notebook button extension
 *  - Attach button to notebook toolbar and launch a dialog requesting
 *  information about the remote location to where submit the notebook
 *  for execution
 */
export class SubmitNotebookButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private panel: NotebookPanel;

  constructor(app: JupyterFrontEnd) {
    this.app = app;
  }

  readonly app: JupyterFrontEnd;

  showWidget = async (): Promise<void> => {
    const envVars: string[] = NotebookParser.getEnvVars(
      this.panel.content.model.toString()
    );

    const runtimes = await PipelineService.getRuntimes();
    const runtimeImages = await PipelineService.getRuntimeImages();

    showDialog({
      title: 'Submit notebook',
      body: dialogWidget(
        <NotebookSubmissionDialog
          env={envVars}
          runtimes={runtimes}
          images={runtimeImages}
        />
      ),
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then(result => {
      if (result.value == null) {
        // When Cancel is clicked on the dialog, just return
        return;
      }

      // prepare notebook submission details
      const notebookOptions: ISubmitNotebookOptions = result.value as ISubmitNotebookOptions;
      const pipeline = Utils.generateNotebookPipeline(
        this.panel.context.path,
        notebookOptions
      );

      PipelineService.submitPipeline(
        pipeline,
        PipelineService.getDisplayName(result.value.runtime_config, runtimes)
      );
    });
  };

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    this.panel = panel;

    // Create the toolbar button
    const submitNotebookButton = new ToolbarButton({
      label: 'Submit Notebook ...',
      onClick: this.showWidget,
      tooltip: 'Submit Notebook ...'
    });

    // Add the toolbar button to the notebook
    panel.toolbar.insertItem(10, 'submitNotebook', submitNotebookButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitNotebookButton;
  }
}
