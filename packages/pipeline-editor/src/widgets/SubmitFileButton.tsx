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

import { ContentParser } from "@elyra/services";
import {
  RequestErrors,
  showFormDialog,
  showNoRuntimesError,
  showServerError,
} from "@elyra/ui-components";
import { showDialog, ToolbarButton } from "@jupyterlab/apputils";
import { PathExt } from "@jupyterlab/coreutils";
import { DocumentRegistry, DocumentWidget } from "@jupyterlab/docregistry";

import { submitFile, unsavedChanges } from "../dialogs";

/**
 * Submit script button extension
 *  - Attach button to FileEditor toolbar and launch a dialog requesting
 *  information where submit the script for execution
 */
export class SubmitFileButtonExtension<
  T extends DocumentWidget,
  U extends DocumentRegistry.IModel
> implements DocumentRegistry.IWidgetExtension<T, U> {
  showWidget = async (document: T) => {
    const { context } = document;
    if (context.model.dirty) {
      const dialogResult = await showDialog(unsavedChanges);
      if (dialogResult.button.accept === false) {
        return;
      }
      await context.save();
    }

    let env;
    try {
      env = await ContentParser.getEnvVars(context.path);
    } catch (e) {
      await showServerError(e);
      return;
    }

    let runtimes;
    try {
      runtimes = await PipelineService.getRuntimes();
    } catch (e) {
      await showServerError(e);
      return;
    }

    if (runtimes.length === 0) {
      const result = await showNoRuntimesError("Cannot run file as pipeline");
      if (result.button.accept === true) {
        // TODO: Open the runtimes widget
        // Utils.getLabShell(document).activateById(
        //   `elyra-metadata:${RUNTIMES_NAMESPACE}`
        // );
      }
      return;
    }

    let images;
    try {
      images = await PipelineService.getRuntimeImages();
    } catch (e) {
      await showServerError(e);
      return;
    }

    const fileExtension = PathExt.extname(context.path);

    const dialogOptions = submitFile({
      env,
      dependencyFileExtension: fileExtension,
      images,
      runtimes,
    });

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

    // prepare submission details
    const pipeline = Utils.generateSingleFilePipeline(
      context.path,
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

    PipelineService.submitPipeline(pipeline, displayName).catch((error) =>
      RequestErrors.serverError(error)
    );
  };

  createNew(editor: T) {
    // Create the toolbar button
    const submitFileButton = new ToolbarButton({
      label: "Run as Pipeline",
      onClick: (): any => this.showWidget(editor),
      tooltip: "Run file as batch",
    });

    // Add the toolbar button to editor
    editor.toolbar.insertItem(10, "submitFile", submitFileButton);

    return submitFileButton;
  }
}
