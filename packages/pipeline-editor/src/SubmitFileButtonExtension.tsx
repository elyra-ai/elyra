/*
 * Copyright 2018-2025 Elyra Authors
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

import { ContentParser } from '@elyra/services';
import {
  GenericObjectType,
  IErrorResponse,
  RequestErrors,
  showFormDialog
} from '@elyra/ui-components';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { ToolbarButton } from '@jupyterlab/ui-components';
import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

import { FileSubmissionDialog } from './FileSubmissionDialog';
import { formDialogWidget } from './formDialogWidget';
import { PipelineService, RUNTIMES_SCHEMASPACE } from './PipelineService';
import { createRuntimeData, getConfigDetails } from './runtime-utils';
import Utils from './utils';

/**
 * Submit file button extension
 *  - Attach button to editor toolbar and launch a dialog requesting
 *  information about the remote location to where submit the file
 *  for execution
 */

export class SubmitFileButtonExtension<
  T extends DocumentWidget,
  U extends DocumentRegistry.IModel
> implements DocumentRegistry.IWidgetExtension<T, U>
{
  showWidget = async (document: T): Promise<void> => {
    const { context } = document;
    if (context.model.dirty) {
      const dialogResult = await showDialog({
        title:
          'This file contains unsaved changes. To run the file as pipeline the changes need to be saved.',
        buttons: [
          Dialog.cancelButton(),
          Dialog.okButton({ label: 'Save and Submit' })
        ]
      });
      if (dialogResult.button.accept === false) {
        return;
      }
      await context.save();
    }

    try {
      const env = await ContentParser.getEnvVars(context.path);

      const runtimeTypes = await PipelineService.getRuntimeTypes();
      const runtimes = await PipelineService.getRuntimes().then(
        (runtimeList) => {
          return runtimeList?.filter((runtime) => {
            return (
              !runtime.metadata.runtime_enabled &&
              !!runtimeTypes.find((r) => runtime.metadata.runtime_type === r.id)
            );
          });
        }
      );

      if (!runtimes) {
        await RequestErrors.noMetadataError('runtime');
        return;
      }

      const images = await PipelineService.getRuntimeImages();
      const schema = await PipelineService.getRuntimesSchema();

      if (!schema) {
        await RequestErrors.noMetadataError('schema');
        return;
      }

      if (!images) {
        await RequestErrors.noMetadataError('runtime images');
        return;
      }

      const runtimeData = createRuntimeData({ schema, runtimes });

      if (!runtimeData.platforms.find((p) => p.configs.length > 0)) {
        const res = await RequestErrors.noMetadataError(
          'runtime',
          `run file as pipeline.`
        );

        if (res.button.label.includes(RUNTIMES_SCHEMASPACE)) {
          // Open the runtimes widget
          Utils.getLabShell(document)?.activateById(
            `elyra-metadata:${RUNTIMES_SCHEMASPACE}`
          );
        }
        return;
      }

      let dependencyFileExtension = PathExt.extname(context.path);
      if (dependencyFileExtension === '.ipynb') {
        dependencyFileExtension = '.py';
      }

      const dialogOptions: Partial<Dialog.IOptions<GenericObjectType>> = {
        title: 'Run file as pipeline',
        body: formDialogWidget(
          <FileSubmissionDialog
            env={env}
            dependencyFileExtension={dependencyFileExtension}
            images={images}
            runtimeData={runtimeData}
          />
        ),
        buttons: [Dialog.cancelButton(), Dialog.okButton()]
      };

      const dialogResult = await showFormDialog(dialogOptions);

      if (dialogResult.value === null) {
        // When Cancel is clicked on the dialog, just return
        return;
      }

      const {
        runtime_config,
        framework,
        cpu,
        cpu_limit,
        gpu,
        memory,
        memory_limit,
        dependency_include,
        dependencies,
        ...envObject
      } = dialogResult.value;

      const configDetails = getConfigDetails(runtimeData, runtime_config);

      // prepare file submission details
      const pipeline = Utils.generateSingleFilePipeline(
        context.path,
        configDetails,
        framework,
        dependency_include ? dependencies.split(',') : undefined,
        envObject,
        cpu,
        cpu_limit,
        gpu,
        memory,
        memory_limit
      );

      PipelineService.submitPipeline(
        pipeline,
        configDetails?.platform.displayName ?? ''
      );
    } catch (error) {
      await RequestErrors.serverError(error as IErrorResponse);
    }
  };

  createNew(editor: T): IDisposable {
    // Create the toolbar button
    const submitFileButton = new ToolbarButton({
      label: 'Run as Pipeline',
      onClick: () => this.showWidget(editor),
      tooltip: 'Run file as batch'
    });

    // Add the toolbar button to the editor
    editor.toolbar.insertItem(10, 'submitFile', submitFileButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitFileButton;
  }
}
