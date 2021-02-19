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
import { RequestErrors, showFormDialog } from '@elyra/ui-components';
import { Dialog, ToolbarButton, WidgetTracker } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';

import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

import { PythonFileEditor } from '../../../node_modules/@elyra/python-editor-extension/lib';

import { FileSubmissionDialog } from './FileSubmissionDialog';
import { formDialogWidget } from './formDialogWidget';
import { PipelineService } from './PipelineService';
import Utils from './utils';

/**
 * Submit script button extension
 *  - Attach button to Python Editor toolbar and launch a dialog requesting
 *  information where submit the script for execution
 */
export class SubmitScriptButtonExtension
  implements
    DocumentRegistry.IWidgetExtension<
      PythonFileEditor,
      DocumentRegistry.ICodeModel
    > {
  // implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  // private panel: NotebookPanel;

  private widget: PythonFileEditor;
  private tracker: WidgetTracker<PythonFileEditor>;

  showWidget = async (): Promise<void> => {
    // TODO: get env variables from the file
    // const env = NotebookParser.getEnvVars(this.panel.content.model.toString());
    const env: string[] = [];
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
      title: 'Submit script',
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
      runtime_config,
      framework,
      dependency_include,
      dependencies,
      ...envObject
    } = dialogResult.value;

    // prepare submission details
    const pipeline = Utils.generateSingleFilePipeline(
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

  createNew(
    editor: PythonFileEditor,
    context: DocumentRegistry.CodeContext
  ): IDisposable {
    this.tracker = new WidgetTracker<PythonFileEditor>({
      namespace: 'elyra-python-editor-extension'
    });

    // Create the toolbar button
    const submitScriptButton = new ToolbarButton({
      label: 'Submit Script ...',
      onClick: this.showWidget,
      tooltip: 'Submit Script ...'
    });

    // Add the toolbar button to Python Editor
    // panel.toolbar.insertItem(10, 'submitScript', submitScriptButton);

    this.tracker.widgetAdded.connect((sender, widget) => {
      this.widget = widget;
      widget.context.toolbar.insertItem(10, 'submitScript', submitScriptButton);
    });

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitScriptButton;
  }
}
