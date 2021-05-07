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
  containerIcon,
  pipelineIcon,
  runtimesIcon,
} from "@elyra/ui-components";
import { ILayoutRestorer } from "@jupyterlab/application";
import { ICommandPalette, IThemeManager } from "@jupyterlab/apputils";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { ILauncher } from "@jupyterlab/launcher";
import { IMainMenu } from "@jupyterlab/mainmenu";

import {
  PipelineEditorFactory,
  RuntimeImagesWidget,
  RuntimesWidget,
  SubmitNotebookButtonExtension,
  SubmitScriptButtonExtension,
} from "../widgets";
import {
  createEditorWidget,
  createExtension,
  createLeftPanelWidget,
  registerCommand,
  registerContextMenuCommands,
  registerLauncherCommands,
  registerPaletteCommands,
} from "./utils";

export default createExtension({
  id: "pipeline",
  autoStart: true,
  required: {
    palette: ICommandPalette,
    launcher: ILauncher,
    browserFactory: IFileBrowserFactory,
    restorer: ILayoutRestorer,
    menu: IMainMenu,
  },
  optional: {
    themeManager: IThemeManager,
  },
  activate: (ctx) => {
    console.log("Elyra - pipeline-editor extension is activated!");

    // Set up new widget Factory for .pipeline files
    const pipelineEditorFactory = new PipelineEditorFactory({});

    createEditorWidget(ctx)(pipelineEditorFactory, {
      extensions: [".pipeline"],
      icon: pipelineIcon,
    });

    registerCommand(ctx)("pipeline-editor:add-node", (args) => {
      pipelineEditorFactory.addFileToPipelineSignal.emit(args);
    });

    registerCommand(ctx)("pipeline-editor:open", () => {
      ctx.app.commands
        .execute("docmanager:new-untitled", {
          type: "file",
          path: ctx.browserFactory.defaultBrowser.model.path,
          ext: ".pipeline",
        })
        .then((model) => {
          return ctx.app.commands.execute("docmanager:open", {
            path: model.path,
            // factory: PIPELINE_FACTORY
          });
        });
    });

    registerContextMenuCommands(ctx);
    registerPaletteCommands(ctx);
    registerLauncherCommands(ctx);

    // Add new pipeline to the file menu
    ctx.menu.fileMenu.newMenu.addGroup(
      [{ command: "pipeline-editor:open" }],
      30
    );

    // SubmitNotebookButtonExtension initialization code
    const notebookButtonExtension = new SubmitNotebookButtonExtension();
    ctx.app.docRegistry.addWidgetExtension("Notebook", notebookButtonExtension);

    // SubmitScriptButtonExtension initialization code
    const scriptButtonExtension = new SubmitScriptButtonExtension();
    ctx.app.docRegistry.addWidgetExtension(
      "Python Editor",
      scriptButtonExtension
    );
    ctx.app.docRegistry.addWidgetExtension("R Editor", scriptButtonExtension);

    const runtimesWidget = new RuntimesWidget({
      app: ctx.app,
      themeManager: ctx.themeManager,
      display_name: "Runtimes",
      namespace: RUNTIMES_NAMESPACE,
      icon: runtimesIcon,
    });

    createLeftPanelWidget(ctx)(runtimesWidget, {
      id: `elyra-metadata:${RUNTIMES_NAMESPACE}`,
      icon: runtimesIcon,
      caption: "Runtimes",
      rank: 950,
    });

    const runtimeImagesWidget = new RuntimeImagesWidget({
      app: ctx.app,
      themeManager: ctx.themeManager,
      display_name: "Runtime Images",
      namespace: RUNTIME_IMAGES_NAMESPACE,
      icon: containerIcon,
    });

    createLeftPanelWidget(ctx)(runtimeImagesWidget, {
      id: `elyra-metadata:${RUNTIME_IMAGES_NAMESPACE}`,
      icon: containerIcon,
      caption: "Runtime Images",
      rank: 951,
    });
  },
});
