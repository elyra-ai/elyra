/*
 * Copyright 2018-2023 Elyra Authors
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

import { ScriptEditorWidgetFactory, ScriptEditor } from '@elyra/script-editor';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';
import { WidgetTracker, ICommandPalette } from '@jupyterlab/apputils';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import {
  IDocumentWidget,
  DocumentRegistry,
  DocumentWidget,
} from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { FileEditor, IEditorTracker } from '@jupyterlab/fileeditor';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { pythonIcon } from '@jupyterlab/ui-components';

import { JSONObject } from '@lumino/coreutils';

import { PythonEditor } from './PythonEditor';

const PYTHON_FACTORY = 'Python Editor';
const PYTHON = 'python';
const PYTHON_EDITOR_NAMESPACE = 'elyra-python-editor-extension';

const commandIDs = {
  createNewPythonEditor: 'script-editor:create-new-python-editor',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
};

/**
 * Initialization data for the python-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: PYTHON_EDITOR_NAMESPACE,
  autoStart: true,
  requires: [
    IEditorServices,
    IEditorTracker,
    ICommandPalette,
    ISettingRegistry,
    IFileBrowserFactory,
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
    launcher: ILauncher | null,
  ) => {
    console.log('Elyra - python-editor extension is activated!');

    const factory = new ScriptEditorWidgetFactory({
      editorServices,
      factoryOptions: {
        name: PYTHON_FACTORY,
        fileTypes: [PYTHON],
        defaultFor: [PYTHON],
      },
      instanceCreator: (
        options: DocumentWidget.IOptions<
          FileEditor,
          DocumentRegistry.ICodeModel
        >,
      ): ScriptEditor => new PythonEditor(options),
    });

    app.docRegistry.addFileType({
      name: PYTHON,
      displayName: 'Python File',
      extensions: ['.py'],
      pattern: '.*\\.py$',
      mimeTypes: ['text/x-python'],
      icon: pythonIcon,
    });

    const { restored } = app;

    /**
     * Track PythonEditor widget on page refresh
     */
    const tracker = new WidgetTracker<ScriptEditor>({
      namespace: PYTHON_EDITOR_NAMESPACE,
    });

    let config: CodeEditor.IConfig = { ...CodeEditor.defaultConfig };

    if (restorer) {
      // Handle state restoration
      void restorer.restore(tracker, {
        command: commandIDs.openDocManager,
        args: (widget) => ({
          path: widget.context.path,
          factory: PYTHON_FACTORY,
        }),
        name: (widget) => widget.context.path,
      });
    }

    /**
     * Update the setting values. Adapted from fileeditor-extension.
     */
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      config = {
        ...CodeEditor.defaultConfig,
        ...(settings.get('editorConfig').composite as JSONObject),
      };

      // Trigger a refresh of the rendered commands
      app.commands.notifyCommandChanged();
    };

    /**
     * Update the settings of the current tracker instances. Adapted from fileeditor-extension.
     */
    const updateTracker = (): void => {
      tracker.forEach((widget) => {
        updateWidget(widget);
      });
    };

    /**
     * Update the settings of a widget. Adapted from fileeditor-extension.
     */
    const updateWidget = (widget: ScriptEditor): void => {
      if (!editorTracker.has(widget)) {
        (editorTracker as WidgetTracker<IDocumentWidget<FileEditor>>).add(
          widget,
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
      restored,
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
     * Create new python editor from launcher and file menu
     */

    // Add a python launcher
    if (launcher) {
      launcher.add({
        command: commandIDs.createNewPythonEditor,
        category: 'Elyra',
        rank: 4,
      });
    }

    if (menu) {
      // Add new python editor creation to the file menu
      menu.fileMenu.newMenu.addGroup(
        [{ command: commandIDs.createNewPythonEditor, args: { isMenu: true } }],
        92,
      );
    }

    // Function to create a new untitled python file, given the current working directory
    const createNew = (cwd: string): Promise<any> => {
      return app.commands
        .execute(commandIDs.newDocManager, {
          path: cwd,
          type: 'file',
          ext: '.py',
        })
        .then((model) => {
          return app.commands.execute(commandIDs.openDocManager, {
            path: model.path,
            factory: PYTHON_FACTORY,
          });
        });
    };

    // Add a command to create new Python editor
    app.commands.addCommand(commandIDs.createNewPythonEditor, {
      label: (args) =>
        args['isPalette'] ? 'New Python Editor' : 'Python Editor',
      caption: 'Create a new Python Editor',
      icon: (args) => (args['isPalette'] ? undefined : pythonIcon),
      execute: (args) => {
        const cwd = args['cwd'] || browserFactory.defaultBrowser.model.path;
        return createNew(cwd as string);
      },
    });

    palette.addItem({
      command: commandIDs.createNewPythonEditor,
      args: { isPalette: true },
      category: 'Elyra',
    });
  },
};

export default extension;
