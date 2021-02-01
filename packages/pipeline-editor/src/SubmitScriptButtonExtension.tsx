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

// import { NotebookParser } from '@elyra/services';
import { PythonFileEditor } from '@elyra/python-editor-extension';
import { RequestErrors, showFormDialog } from '@elyra/ui-components';
import { Dialog, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
// import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

// import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

import { formDialogWidget } from './formDialogWidget';
import { FileSubmissionDialog } from './FileSubmissionDialog';
import { PipelineService } from './PipelineService';
import Utils from './utils';

/**
 * Submit script button extension
 *  - Attach button to Python Editor toolbar and launch a dialog requesting
 *  information about the remote location to where submit the script
 *  for execution
 */

export class SubmitScriptButtonExtension extends PythonFileEditor {
  // private panel: NotebookPanel;
  private widget: PythonFileEditor;

  showWidget = async (): Promise<void> => {
    // const env = NotebookParser.getEnvVars(this.panel.content.model.toString());
    const env: string[] = null;
    const runtimes = await PipelineService.getRuntimes().catch(error =>
      RequestErrors.serverError(error)
    );
    const images = await PipelineService.getRuntimeImages().catch(error =>
      RequestErrors.serverError(error)
    );

    const dialogOptions = {
      title: 'Submit script',
      body: formDialogWidget(
        <FileSubmissionDialog env={env} runtimes={runtimes} images={images} />
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

    // prepare submission details
    const pipeline = Utils.generateNotebookPipeline(
      this.widget.context.path,
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

  // createNew(
  //   panel: NotebookPanel,
  //   context: DocumentRegistry.IContext<INotebookModel>
  // ): IDisposable {
  //   this.panel = panel;

  createNew(
    widget: PythonFileEditor,
    context: DocumentRegistry.ICodeModel
  ): any {
    this.widget = widget;

    // Create the toolbar button
    const submitScriptButton = new ToolbarButton({
      label: 'Submit Script ...',
      onClick: this.showWidget,
      tooltip: 'Submit Script ...'
    });

    // Add the toolbar button to Python Editor
    widget.toolbar.insertItem(20, 'submitScript', submitScriptButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitScriptButton;
  }
}
