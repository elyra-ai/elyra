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

import { ScriptEditorFactory, ScriptEditor } from '@elyra/script-editor';
import { rIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { WidgetTracker, ICommandPalette } from '@jupyterlab/apputils';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { IDocumentWidget } from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { FileEditor, IEditorTracker } from '@jupyterlab/fileeditor';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { JSONObject } from '@lumino/coreutils';

const R_FACTORY = 'R Editor';
const R = 'r';
const R_EDITOR_NAMESPACE = 'elyra-r-script-editor-extension';

const commandIDs = {
  createNewRFile: 'script-editor:create-new-r-file',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled'
};

/**
 * Initialization data for the r-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: R_EDITOR_NAMESPACE,
  autoStart: true,
  requires: [
    IEditorServices,
    IEditorTracker,
    ICommandPalette,
    ISettingRegistry,
    IFileBrowserFactory
  ],
  optional: [ILayoutRestorer, IMainMenu, ILauncher],
  activate: (
    app: JupyterFrontEnd,
    editorServices: IEditorServices,
    editorTracker: IEditorTracker,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry,
    browserFactory: IFileBrowserFactory,
    restorer: ILayoutRestorer | null,
    menu: IMainMenu | null,
    launcher: ILauncher | null
  ) => {
    console.log('Elyra - r-editor extension is activated!');

    const factory = new ScriptEditorFactory({
      editorServices,
      factoryOptions: {
        name: R_FACTORY,
        fileTypes: [R],
        defaultFor: [R]
      }
    });

    app.docRegistry.addFileType({
      name: R,
      displayName: 'R File',
      extensions: ['.r'],
      pattern: '.*\\.r$',
      mimeTypes: ['text/x-rsrc'],
      icon: rIcon
    });

    const { restored } = app;

    /**
     * Track ScriptEditor widget on page refresh
     */
    const tracker = new WidgetTracker<ScriptEditor>({
      namespace: R_EDITOR_NAMESPACE
    });

    let config: CodeEditor.IConfig = { ...CodeEditor.defaultConfig };

    if (restorer) {
      // Handle state restoration
      void restorer.restore(tracker, {
        command: commandIDs.openDocManager,
        args: widget => ({
          path: widget.context.path,
          factory: R_FACTORY
        }),
        name: widget => widget.context.path
      });
    }

    /**
     * Update the setting values. Adapted from fileeditor-extension.
     */
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      config = {
        ...CodeEditor.defaultConfig,
        ...(settings.get('editorConfig').composite as JSONObject)
      };

      // Trigger a refresh of the rendered commands
      app.commands.notifyCommandChanged();
    };

    /**
     * Update the settings of the current tracker instances. Adapted from fileeditor-extension.
     */
    const updateTracker = (): void => {
      tracker.forEach(widget => {
        updateWidget(widget);
      });
    };

    /**
     * Update the settings of a widget. Adapted from fileeditor-extension.
     */
    const updateWidget = (widget: ScriptEditor): void => {
      if (!editorTracker.has(widget)) {
        (editorTracker as WidgetTracker<IDocumentWidget<FileEditor>>).add(
          widget
        );
      }

      const editor = widget.content.editor;
      Object.keys(config).forEach((keyStr: string) => {
        const key = keyStr as keyof CodeEditor.IConfig;
        editor.setOption(key, config[key]);
      });
    };

    // Fetch the initial state of the settings. Adapted from fileeditor-extension.
    Promise.all([
      settingRegistry.load('@jupyterlab/fileeditor-extension:plugin'),
      restored
    ])
      .then(([settings]) => {
        updateSettings(settings);
        updateTracker();
        settings.changed.connect(() => {
          updateSettings(settings);
          updateTracker();
        });
      })
      .catch((reason: Error) => {
        console.error(reason.message);
        updateTracker();
      });

    app.docRegistry.addWidgetFactory(factory);

    factory.widgetCreated.connect((sender, widget) => {
      void tracker.add(widget);

      // Notify the widget tracker if restore data needs to update
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      updateWidget(widget);
    });

    // Handle the settings of new widgets. Adapted from fileeditor-extension.
    tracker.widgetAdded.connect((sender, widget) => {
      updateWidget(widget);
    });

    /**
     * Create new r file from launcher and file menu
     */

    // Add a r launcher
    if (launcher) {
      launcher.add({
        command: commandIDs.createNewRFile,
        category: 'Elyra',
        rank: 5
      });
    }

    if (menu) {
      // Add new r file creation to the file menu
      menu.fileMenu.newMenu.addGroup(
        [{ command: commandIDs.createNewRFile, args: { isMenu: true } }],
        34
      );
    }

    // Function to create a new untitled r file, given the current working directory
    const createNew = (cwd: string): Promise<any> => {
      return app.commands
        .execute(commandIDs.newDocManager, {
          path: cwd,
          type: 'file',
          ext: '.r'
        })
        .then(model => {
          return app.commands.execute(commandIDs.openDocManager, {
            path: model.path,
            factory: R_FACTORY
          });
        });
    };

    // Add a command to create new R file
    app.commands.addCommand(commandIDs.createNewRFile, {
      label: args =>
        args['isPalette']
          ? 'New R Editor'
          : args.isMenu
          ? 'R File'
          : 'R Editor',
      caption: 'Create a new R file',
      icon: args => (args['isPalette'] ? undefined : rIcon),
      execute: args => {
        const cwd = args['cwd'] || browserFactory.defaultBrowser.model.path;
        return createNew(cwd as string);
      }
    });

    palette.addItem({
      command: commandIDs.createNewRFile,
      args: { isPalette: true },
      category: 'Elyra'
    });
  }
};

export default extension;
