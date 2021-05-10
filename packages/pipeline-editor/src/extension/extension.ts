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
} from "../widgets";
import {
  createEditor,
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

    const pipelineEditor = createEditor(ctx)(PipelineEditorFactory, {
      extensions: [".pipeline"],
      icon: pipelineIcon,
    });

    // createWidgetExtension(ctx)(SubmitNotebookButtonExtension, {
    //   widgets: ["Notebook"],
    // });

    // createWidgetExtension(ctx)(SubmitScriptButtonExtension, {
    //   widgets: ["Python Editor", "R Editor"],
    // });

    createLeftPanelWidget(ctx)(RuntimesWidget, {
      id: "elyra-metadata:runtimes",
      caption: "Runtimes",
      icon: runtimesIcon,
      rank: 950,
    });

    createLeftPanelWidget(ctx)(RuntimeImagesWidget, {
      id: "elyra-metadata:runtime-images",
      caption: "Runtime Images",
      icon: containerIcon,
      rank: 951,
    });

    registerCommand(ctx)("pipeline-editor:add-node", (args) => {
      pipelineEditor.addFileToPipelineSignal.emit(args);
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

    ctx.menu.fileMenu.newMenu.addGroup(
      [{ command: "pipeline-editor:open" }],
      30
    );
  },
});
