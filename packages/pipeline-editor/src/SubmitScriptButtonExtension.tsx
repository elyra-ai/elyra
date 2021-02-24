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
import { Dialog, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';

import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

import { FileSubmissionDialog } from './FileSubmissionDialog';
import { formDialogWidget } from './formDialogWidget';
import { PipelineService } from './PipelineService';
import Utils from './utils';

/**
 * Submit script button extension
 *  - Attach button to FileEditor toolbar and launch a dialog requesting
 *  information where submit the script for execution
 */
export class SubmitScriptButtonExtension
  implements
    // DocumentRegistry.IWidgetExtension<
    //   DocumentWidget,
    //   DocumentRegistry.ICodeModel
    // > {
    DocumentRegistry.IWidgetExtension<
      DocumentWidget<FileEditor, DocumentRegistry.ICodeModel>,
      DocumentRegistry.ICodeModel
    > {
  // DocumentRegistry.IWidgetExtension<FileEditor, DocumentRegistry.ICodeModel> {
  // implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  // private panel: NotebookPanel;

  // private widget: PythonFileEditor;
  // private editor: FileEditor;
  private widget: DocumentWidget<FileEditor, DocumentRegistry.ICodeModel>;
  // private widget: DocumentWidget;

  showWidget = async (): Promise<void> => {
    // TODO: get env variables from the file
    const env = this.getEnvVars(this.widget.context.model.toString());
    // const env: string[] = [];
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
      runtime_platform,
      runtime_config,
      framework,
      dependency_include,
      dependencies,
      ...envObject
    } = dialogResult.value;

    // prepare submission details
    const pipeline = Utils.generateSingleFilePipeline(
      this.widget.context.path,
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

  // TODO: Rename NotebookParser to ContentParser and adjust getEnvVars according to widget type
  /**
   * @param editorContent Raw FileEditor JSON in string format
   * @returns A string array of the env vars accessed in the given editor
   */
  getEnvVars = (editorContent: string): string[] => {
    const envVars: string[] = [];
    // const content = JSON.parse(editorContent);
    // const match_regex = /os\.(?:environb?(?:\["([^"]+)|\['([^']+)|\.get\("([^"]+)|\.get\('([^']+))|getenvb?\("([^"]+)|getenvb?\('([^']+))/;

    console.log(editorContent);
    // for (const cell of notebook['cells']) {
    //   if (cell['cell_type'] == 'code') {
    //     const matchedEnv: string[][] = this.findInCode(
    //       cell['source'],
    //       match_regex
    //     );
    //     for (const match of matchedEnv) {
    //       for (let i = 1; i < match.length; i++) {
    //         if (match[i]) {
    //           envVars.push(match[i]);
    //         }
    //       }
    //     }
    //   }
    // }
    return [...new Set(envVars)];
  };

  createNew(
    widget: DocumentWidget<FileEditor, DocumentRegistry.ICodeModel>,
    // widget: DocumentWidget,
    context: DocumentRegistry.IContext<DocumentRegistry.ICodeModel>
  ): IDisposable {
    // Create the toolbar button
    const submitScriptButton = new ToolbarButton({
      label: 'Submit Script ...',
      onClick: this.showWidget,
      tooltip: 'Submit Script ...'
    });

    // Add the toolbar button to Python Editor
    // panel.toolbar.insertItem(10, 'submitScript', submitScriptButton);
    console.log('TEST: createNew');
    widget.toolbar.insertItem(10, 'submitScript', submitScriptButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitScriptButton;
  }
}
