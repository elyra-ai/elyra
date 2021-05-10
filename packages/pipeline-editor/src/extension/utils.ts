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
  ReactWidget,
  WidgetTracker,
} from "@jupyterlab/apputils";
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
} from "@jupyterlab/docregistry";
import { ILauncher } from "@jupyterlab/launcher";
import { LabIcon } from "@jupyterlab/ui-components";
import { Token } from "@lumino/coreutils";

import { commands, contextMenu, launcher, palette } from "./commands";

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
  const req = Object.values(required);
  const opt = Object.values(optional);
  return {
    ...rest,
    requires: req,
    optional: opt,
    activate: (...args) => {
      let context: any = {
        app: args.shift(),
      };
      for (const r of req) {
        context[r.name] = args.shift();
      }
      for (const o of opt) {
        context[o.name] = args.shift();
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

export function createEditor({ app, restorer }: AppContext & RestorerContext) {
  return <T extends ABCWidgetFactory<DocumentWidget>>(
    Factory: { new (o: any): T },
    { extensions, icon }: EditorOptions
  ) => {
    const factory = new Factory({});
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

export function registerCommand({ app }: AppContext) {
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
  for (const cm of contextMenu) {
    app.contextMenu.addItem(cm);
  }
}

export function registerPaletteCommands(c: PaletteContext) {
  for (const p of palette) {
    c.palette.addItem(p);
  }
}

export function registerLauncherCommands(c: LauncherContext) {
  for (const l of launcher) {
    c.launcher.add(l);
  }
}
