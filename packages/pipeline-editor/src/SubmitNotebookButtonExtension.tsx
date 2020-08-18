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
import { showFormDialog } from '@elyra/ui-components';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { Dialog, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

import { formDialogWidget } from './formDialogWidget';
import NotebookSubmissionDialog from './NotebookSubmissionDialog';
import { PipelineService } from './PipelineService';
import Utils from './utils';

/**
 * Submit notebook button extension
 *  - Attach button to notebook toolbar and launch a dialog requesting
 *  information about the remote location to where submit the notebook
 *  for execution
 */
export class SubmitNotebookButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private panel: NotebookPanel;

  showWidget = async (): Promise<void> => {
    const env = NotebookParser.getEnvVars(this.panel.content.model.toString());
    const runtimes = await PipelineService.getRuntimes();
    const images = await PipelineService.getRuntimeImages();

    const dialogOptions = {
      title: 'Submit notebook',
      body: formDialogWidget(
        <NotebookSubmissionDialog
          env={env}
          runtimes={runtimes}
          images={images}
        />
      ),
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    };

    const dialogResult = await showFormDialog(dialogOptions);

    if (dialogResult.value == null) {
      // When Cancel is clicked on the dialog, just return
      return;
    }

    const {
      runtime_config,
      framework,
      dependency_include,
      dependencies,
      ...envObject
    } = dialogResult.value;

    // prepare notebook submission details
    const pipeline = Utils.generateNotebookPipeline(
      this.panel.context.path,
      runtime_config,
      framework,
      dependency_include ? dependencies : undefined,
      envObject
    );

    const displayName = PipelineService.getDisplayName(
      runtime_config,
      runtimes
    );

    PipelineService.submitPipeline(pipeline, displayName);
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
