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
import { PipelineService, RUNTIMES_NAMESPACE } from './PipelineService';
import Utils from './utils';

/**
 * Submit notebook button extension
 *  - Attach button to notebook toolbar and launch a dialog requesting
 *  information about the remote location to where submit the notebook
 *  for execution
 */
export class SubmitNotebookButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  showWidget = async (panel: NotebookPanel): Promise<void> => {
    if (panel.model.dirty) {
      const dialogResult = await showDialog({
        title:
          'This notebook contains unsaved changes. To run the notebook as pipeline the changes need to be saved.',
        buttons: [
          Dialog.cancelButton(),
          Dialog.okButton({ label: 'Save and Submit' })
        ]
      });
      if (dialogResult.button && dialogResult.button.accept === true) {
        await panel.context.save();
      } else {
        // Don't proceed if cancel button pressed
        return;
      }
    }

    const env = NotebookParser.getEnvVars(panel.content.model.toString());
    const action = 'run notebook as pipeline';
    const runtimes = await PipelineService.getRuntimes(
      true,
      action
    ).catch(error => RequestErrors.serverError(error));

    if (Utils.isDialogResult(runtimes)) {
      if (runtimes.button.label.includes(RUNTIMES_NAMESPACE)) {
        // Open the runtimes widget
        Utils.getLabShell(panel).activateById(
          `elyra-metadata:${RUNTIMES_NAMESPACE}`
        );
      }
      return;
    }

    const images = await PipelineService.getRuntimeImages().catch(error =>
      RequestErrors.serverError(error)
    );
    const schema = await PipelineService.getRuntimesSchema().catch(error =>
      RequestErrors.serverError(error)
    );

    const dialogOptions = {
      title: 'Run notebook as pipeline',
      body: formDialogWidget(
        <FileSubmissionDialog
          env={env}
          dependencyFileExtension=".py"
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
      cpu,
      gpu,
      memory,
      dependency_include,
      dependencies,
      ...envObject
    } = dialogResult.value;

    // prepare notebook submission details
    const pipeline = Utils.generateSingleFilePipeline(
      panel.context.path,
      runtime_platform,
      runtime_config,
      framework,
      dependency_include ? dependencies : undefined,
      envObject,
      cpu,
      gpu,
      memory
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
    // Create the toolbar button
    const submitNotebookButton = new ToolbarButton({
      label: 'Run as Pipeline',
      onClick: (): any => this.showWidget(panel),
      tooltip: 'Run notebook as batch'
    });

    // Add the toolbar button to the notebook
    panel.toolbar.insertItem(10, 'submitNotebook', submitNotebookButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitNotebookButton;
  }
}
