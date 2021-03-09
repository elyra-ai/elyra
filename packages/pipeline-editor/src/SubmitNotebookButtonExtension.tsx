/*
 * Copyright 2018-2021 Elyra Authors
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

import { NotebookParser } from '@elyra/services';
import { RequestErrors, showFormDialog } from '@elyra/ui-components';
import { Dialog, showDialog, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

import { FileSubmissionDialog } from './FileSubmissionDialog';
import { formDialogWidget } from './formDialogWidget';
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
    if (this.panel.model.dirty) {
      const dialogResult = await showDialog({
        title: 'This notebook has unsaved changes. Save before submitting?',
        buttons: [
          Dialog.cancelButton({ label: "Don't submit" }),
          Dialog.okButton({ label: 'Save and Submit' })
        ]
      });
      if (dialogResult.button && dialogResult.button.accept === true) {
        await this.panel.context.save();
      } else {
        // Don't proceed if cancel button pressed
        return;
      }
    }

    const env = NotebookParser.getEnvVars(this.panel.content.model.toString());
    const runtimes = await PipelineService.getRuntimes().catch(error =>
      RequestErrors.serverError(error)
    );
    const images = await PipelineService.getRuntimeImages().catch(error =>
      RequestErrors.serverError(error)
    );
    const schema = await PipelineService.getRuntimesSchema().catch(error =>
      RequestErrors.serverError(error)
    );

    const dialogOptions = {
      title: 'Submit notebook',
      body: formDialogWidget(
        <FileSubmissionDialog
          env={env}
          runtimes={runtimes}
          images={images}
          schema={schema}
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
      runtime_platform,
      runtime_config,
      framework,
      dependency_include,
      dependencies,
      ...envObject
    } = dialogResult.value;

    // prepare notebook submission details
    const pipeline = Utils.generateSingleFilePipeline(
      this.panel.context.path,
      runtime_platform,
      runtime_config,
      framework,
      dependency_include ? dependencies : undefined,
      envObject
    );

    const displayName = PipelineService.getDisplayName(
      runtime_config,
      runtimes
    );

    PipelineService.submitPipeline(pipeline, displayName).catch(error =>
      RequestErrors.serverError(error)
    );
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
