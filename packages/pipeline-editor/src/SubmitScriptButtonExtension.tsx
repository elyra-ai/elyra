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
import { LabShell } from '@jupyterlab/application';
import { Dialog, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { IDisposable } from '@lumino/disposable';

import * as React from 'react';

import { FileSubmissionDialog } from './FileSubmissionDialog';
import { formDialogWidget } from './formDialogWidget';
import { PipelineService, RUNTIMES_NAMESPACE } from './PipelineService';
import Utils from './utils';

/**
 * Submit script button extension
 *  - Attach button to FileEditor toolbar and launch a dialog requesting
 *  information where submit the script for execution
 */
export class SubmitScriptButtonExtension
  implements
    DocumentRegistry.IWidgetExtension<
      DocumentWidget<FileEditor, DocumentRegistry.ICodeModel>,
      DocumentRegistry.ICodeModel
    > {
  private editor: DocumentWidget<FileEditor, DocumentRegistry.ICodeModel>;
  private shell: LabShell;

  showWidget = async (): Promise<void> => {
    /*
    // TODO: 
    // get environment variables from the editor
    // Rename NotebookParser to ContentParser in from '@elyra/services and adjust getEnvVars according to widget type
    */
    // const env = this.getEnvVars(this.editor.context.model.toString());
    const env: string[] = [];
    const action = 'submit Python script';
    const runtimes = await PipelineService.getRuntimes(
      true,
      action
    ).catch(error => RequestErrors.serverError(error));

    if (Utils.isNoRuntimeDialogResult(runtimes)) {
      if (runtimes.button.label.includes(RUNTIMES_NAMESPACE)) {
        // Open the runtimes widget
        this.shell = Utils.getLabShell(this.editor);
        this.shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
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
      this.editor.context.path,
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
    editor: DocumentWidget<FileEditor, DocumentRegistry.ICodeModel>,
    context: DocumentRegistry.IContext<DocumentRegistry.ICodeModel>
  ): IDisposable {
    this.editor = editor;

    // Create the toolbar button
    const submitScriptButton = new ToolbarButton({
      label: 'Submit Script ...',
      onClick: this.showWidget,
      tooltip: 'Run script as batch'
    });

    // Add the toolbar button to editor
    editor.toolbar.insertItem(10, 'submitScript', submitScriptButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitScriptButton;
  }
}
