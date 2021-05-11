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

import {
  ContentParser,
  getRuntimeImages,
  getRuntimes,
  submitPipeline,
} from "@elyra/services";
import {
  RequestErrors,
  showFormDialog,
  showNoRuntimesError,
  showServerError,
} from "@elyra/ui-components";
import { showDialog, ToolbarButton } from "@jupyterlab/apputils";
import { PathExt } from "@jupyterlab/coreutils";
import { DocumentRegistry, DocumentWidget } from "@jupyterlab/docregistry";
import { nanoid } from "nanoid";

import { createSubmitFileDialog, unsavedChanges } from "../dialogs";

// TODO: this should be moved to the backend service so we can also submit files
// via the CLI
function createPipelineFromFile({
  filename,
  envObject,
  runtimeImage,
  dependencies,
  cpu,
  gpu,
  memory,
  runtime_platform,
  runtime_config,
}: any) {
  const pipeline = {
    id: nanoid(),
    nodes: [
      {
        id: nanoid(),
        app_data: {
          filename,
          runtime_image: runtimeImage,
          env_vars: Object.entries(envObject).map(
            ([key, val]) => `${key}=${val}`
          ),
          dependencies,
          cpu,
          gpu,
          memory,
        },
      },
    ],
    app_data: {
      name: PathExt.basename(filename, PathExt.extname(filename)),
      runtime: runtime_platform,
      "runtime-config": runtime_config,
      version: 3,
      source: PathExt.basename(filename),
      ui_data: {
        comments: [],
      },
    },
  };

  return {
    doc_type: "pipeline",
    version: "3.0",
    json_schema:
      "http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json",
    id: nanoid(),
    primary_pipeline: pipeline.id,
    pipelines: [pipeline],
    schemas: [],
  };
}

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
    let runtimes;
    let images;
    try {
      env = await ContentParser.getEnvVars(context.path);
      runtimes = await getRuntimes();
      images = await getRuntimeImages();
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

    let dependencyFileExtension = PathExt.extname(context.path);
    if (dependencyFileExtension === ".ipynb") {
      dependencyFileExtension = ".py";
    }

    const dialogResult = await showFormDialog(
      createSubmitFileDialog({
        env,
        images,
        runtimes,
        dependencyFileExtension,
      })
    );

    if (dialogResult.value == null) {
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
    const pipeline = createPipelineFromFile({
      filename: context.path,
      runtime_platform,
      runtime_config,
      runtimeImage: framework,
      dependencies: dependency_include ? dependencies : undefined,
      envObject,
      cpu,
      gpu,
      memory,
    });

    const displayName = runtimes.find((r) => r.name === runtime_config)
      ?.display_name;

    try {
      await submitPipeline(pipeline, displayName ?? "untitled");
    } catch (e) {
      await showServerError(e);
    }
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
