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

import '../style/index.css';

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
import { pythonIcon, rKernelIcon } from '@jupyterlab/ui-components';

import { JSONObject } from '@lumino/coreutils';

import { PythonFileEditorFactory, PythonFileEditor } from './PythonFileEditor';
import { REditorFactory, REditor } from './REditor';

const PYTHON_FACTORY = 'Python Editor';
const R_FACTORY = 'R Editor';
const PYTHON = 'python';
const R = 'r';
const PYTHON_EDITOR_NAMESPACE = 'elyra-python-editor-extension';
const R_EDITOR_NAMESPACE = 'elyra-r-editor-extension';
const SCRIPT_EDITOR_NAMESPACE = 'elyra-python-editor-extension';

const commandIDs = {
  createNewPythonFile: 'python-editor:create-new-file',
  createNewRFile: 'r-editor:create-new-file',
  openPythonFile: 'python-editor:open',
  openRFile: 'r-editor:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled'
};

/**
 * Initialization data for the script editor extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: SCRIPT_EDITOR_NAMESPACE,
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
    console.log('Elyra - script-editor extension is activated!');

    const pythonFactory = new PythonFileEditorFactory({
      editorServices,
      factoryOptions: {
        name: PYTHON_FACTORY,
        fileTypes: [PYTHON],
        defaultFor: [PYTHON]
      }
    });

    const rFactory = new REditorFactory({
      editorServices,
      factoryOptions: {
        name: R_FACTORY,
        fileTypes: [R],
        defaultFor: [R]
      }
    });

    const { restored } = app;

    /**
     * Track Editor widget on page refresh
     */
    const pythonEditorTracker = new WidgetTracker<PythonFileEditor>({
      namespace: PYTHON_EDITOR_NAMESPACE
    });

    const rEditorTracker = new WidgetTracker<REditor>({
      namespace: R_EDITOR_NAMESPACE
    });

    let config: CodeEditor.IConfig = { ...CodeEditor.defaultConfig };

    if (restorer) {
      // Handle state restoration
      void restorer.restore(pythonEditorTracker, {
        command: commandIDs.openDocManager,
        args: widget => ({
          path: widget.context.path,
          pythonFactory: PYTHON_FACTORY
        }),
        name: widget => widget.context.path
      });

      void restorer.restore(rEditorTracker, {
        command: commandIDs.openDocManager,
        args: widget => ({
          path: widget.context.path,
          pythonFactory: R_FACTORY
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
      pythonEditorTracker.forEach(widget => {
        updateWidget(widget);
      });

      rEditorTracker.forEach(widget => {
        updateWidget(widget);
      });
    };

    /**
     * Update the settings of a widget. Adapted from fileeditor-extension.
     */
    const updateWidget = (widget: any): void => {
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

    // Notify the widget tracker if restore data needs to update
    const handleWidgetRestore = (widget: any, tracker: any): void => {
      void tracker.add(widget);

      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      updateWidget(widget);
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

    app.docRegistry.addWidgetFactory(pythonFactory);
    app.docRegistry.addWidgetFactory(rFactory);

    pythonFactory.widgetCreated.connect((sender, widget) => {
      handleWidgetRestore(widget, pythonEditorTracker);
    });
    rFactory.widgetCreated.connect((sender, widget) => {
      handleWidgetRestore(widget, rEditorTracker);
    });

    // Handle the settings of new widgets. Adapted from fileeditor-extension.
    pythonEditorTracker.widgetAdded.connect((sender, widget) => {
      updateWidget(widget);
    });
    rEditorTracker.widgetAdded.connect((sender, widget) => {
      updateWidget(widget);
    });

    /**
     * Create new script file from launcher and file menu
     */

    if (launcher) {
      launcher.add({
        command: commandIDs.createNewPythonFile,
        category: 'Elyra',
        rank: 2
      });

      launcher.add({
        command: commandIDs.createNewRFile,
        category: 'Elyra',
        rank: 3
      });
    }

    if (menu) {
      menu.fileMenu.newMenu.addGroup(
        [{ command: commandIDs.createNewPythonFile }],
        30
      );

      menu.fileMenu.newMenu.addGroup(
        [{ command: commandIDs.createNewRFile }],
        31
      );
    }

    // Function to create a new untitled script file, given the current working directory
    const createNew = async (
      cwd: string,
      ext: string,
      factory: any
    ): Promise<any> => {
      const model = await app.commands.execute(commandIDs.newDocManager, {
        path: cwd,
        type: 'file',
        ext: ext
      });
      return app.commands.execute(commandIDs.openDocManager, {
        path: model.path,
        factory: factory
      });
    };

    // Add a command to create new Python file
    app.commands.addCommand(commandIDs.createNewPythonFile, {
      label: args => (args['isPalette'] ? 'New Python File' : 'Python File'),
      caption: 'Create a new Python file',
      icon: args => (args['isPalette'] ? undefined : pythonIcon),
      execute: args => {
        const cwd = args['cwd'] || browserFactory.defaultBrowser.model.path;
        return createNew(cwd as string, '.py', PYTHON_FACTORY);
      }
    });

    palette.addItem({
      command: commandIDs.createNewPythonFile,
      args: { isPalette: true },
      category: 'Elyra'
    });

    // Add a command to create new R file
    app.commands.addCommand(commandIDs.createNewRFile, {
      label: args => (args['isPalette'] ? 'New R File' : 'R File'),
      caption: 'Create a new R file',
      icon: args => (args['isPalette'] ? undefined : rKernelIcon),
      execute: args => {
        const cwd = args['cwd'] || browserFactory.defaultBrowser.model.path;
        return createNew(cwd as string, '.r', R_FACTORY);
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
