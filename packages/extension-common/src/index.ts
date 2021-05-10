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
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from "@jupyterlab/application";
import {
  ICommandPalette,
  IPaletteItem,
  ReactWidget,
  WidgetTracker,
} from "@jupyterlab/apputils";
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
} from "@jupyterlab/docregistry";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { ILauncher } from "@jupyterlab/launcher";
import { LabIcon } from "@jupyterlab/ui-components";
import { Token } from "@lumino/coreutils";
import { ContextMenu } from "@lumino/widgets";

type GetTypeOfToken<T> = T extends Token<infer Type> ? Type : never;

type Context<R = {}, O = {}> = {
  app: JupyterFrontEnd;
} & {
  [P in keyof R]: GetTypeOfToken<R[P]>;
} &
  {
    [P in keyof O]?: GetTypeOfToken<O[P]>;
  };

interface Options<R, O> {
  id: string;
  autoStart?: boolean;
  required: R;
  optional: O;
  activate: (context: Context<R, O>) => any;
}

interface TokenSet {
  [key: string]: Token<any>;
}

export function createExtension<R extends TokenSet, O extends TokenSet>({
  activate,
  required,
  optional,
  ...rest
}: Options<R, O>): JupyterFrontEndPlugin<void> {
  const req = Object.entries(required);
  const opt = Object.entries(optional);
  return {
    ...rest,
    requires: req.map(([_k, v]) => v),
    optional: opt.map(([_k, v]) => v),
    activate: (...args) => {
      let context: any = {
        app: args.shift(),
      };
      for (const [k] of req) {
        context[k] = args.shift();
      }
      for (const [k] of opt) {
        context[k] = args.shift();
      }
      activate(context);
    },
  };
}

interface AppContext {
  app: JupyterFrontEnd;
}

interface RestorerContext {
  restorer: ILayoutRestorer;
}

interface FileBrowserFactoryContext {
  browserFactory: IFileBrowserFactory;
}

interface PaletteContext {
  palette: ICommandPalette;
}

interface LauncherContext {
  launcher: ILauncher;
}

interface EditorOptions {
  extensions: string[];
  icon: LabIcon;
}

export function createEditor({
  app,
  restorer,
  browserFactory,
}: AppContext & RestorerContext & FileBrowserFactoryContext) {
  return <T extends ABCWidgetFactory<DocumentWidget>>(
    Factory: { new (o: any): T },
    { extensions, icon }: EditorOptions
  ) => {
    const factory = new Factory({
      name: "Pipeline Editor",
      fileTypes: ["pipeline"],
      defaultFor: ["pipeline"],
      shell: app.shell,
      commands: app.commands,
      browserFactory: browserFactory,
      serviceManager: app.serviceManager,
    });
    // Add the default behavior of opening the widget for .pipeline files
    app.docRegistry.addFileType({
      name: "pipeline",
      extensions,
      icon,
    });

    app.docRegistry.addWidgetFactory(factory);

    const tracker = new WidgetTracker<DocumentWidget>({
      namespace: "elyra-pipeline-editor-extension",
    });

    factory.widgetCreated.connect((sender, widget) => {
      tracker.add(widget);

      // Notify the widget tracker if restore data needs to update
      widget.context.pathChanged.connect(() => {
        tracker.save(widget);
      });
    });

    // Handle state restoration
    restorer.restore(tracker, {
      command: "docmanager:open",
      args: (widget) => ({
        path: widget.context.path,
        // factory: "Pipeline Editor",
      }),
      name: (widget) => widget.context.path,
    });

    return factory;
  };
}

interface ExtensionOptions {
  widgets: string[];
}

export function createWidgetExtension(ctx: AppContext) {
  return <T extends DocumentRegistry.IWidgetExtension<any, any>>(
    Extension: { new (): T },
    { widgets }: ExtensionOptions
  ) => {
    const extension = new Extension();
    for (const widget of widgets) {
      ctx.app.docRegistry.addWidgetExtension(widget, extension);
    }
    return extension;
  };
}

interface WidgetOptions {
  id: string;
  icon: LabIcon;
  caption: string;
  rank: number;
}

export function createLeftPanelWidget(ctx: AppContext & RestorerContext) {
  return <T extends ReactWidget>(
    Widget: { new (ctx: any, o: any): T },
    { id, icon, caption, rank, ...rest }: WidgetOptions
  ) => {
    const { restorer, app } = ctx;
    const widget = new Widget(ctx, { id, caption, icon, ...rest });
    widget.id = id;
    widget.title.icon = icon;
    widget.title.caption = caption;

    restorer.add(widget, id);
    app.shell.add(widget, "left", { rank });
    return widget;
  };
}

interface Command {
  command: string;
  label: string;
  icon: LabIcon;
}

export function registerCommand({ app }: AppContext, commands: Command[]) {
  return (command: string, callback: (...args: any[]) => any) => {
    const cmd = commands.find((c) => c.command === command);

    if (cmd === undefined) {
      throw new Error("invalid command");
    }

    app.commands.addCommand(cmd.command, {
      label: cmd.label,
      icon: cmd.icon,
      execute: callback,
    });
  };
}

export function registerContextMenuCommands({ app }: AppContext) {
  return (contextMenu: ContextMenu.IItemOptions[]) => {
    for (const cm of contextMenu) {
      app.contextMenu.addItem(cm);
    }
  };
}

export function registerPaletteCommands(c: PaletteContext) {
  return (palette: IPaletteItem[]) => {
    for (const p of palette) {
      c.palette.addItem(p);
    }
  };
}

export function registerLauncherCommands(c: LauncherContext) {
  return (launcher: ILauncher.IItemOptions[]) => {
    for (const l of launcher) {
      c.launcher.add(l);
    }
  };
}
