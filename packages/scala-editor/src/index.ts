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
import { scalaIcon } from '@elyra/ui-components';

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

import { JSONObject } from '@lumino/coreutils';

import { ScalaEditor } from './ScalaEditor';

const SCALA_FACTORY = 'Scala Editor';
const SCALA = 'scala';
const SCALA_EDITOR_NAMESPACE = 'elyra-scala-editor-extension';

const commandIDs = {
  createNewScalaEditor: 'script-editor:create-new-scala-editor',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
};

/**
 * Initialization data for the scala-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: SCALA_EDITOR_NAMESPACE,
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
    console.log('Elyra - scala-editor extension is activated!');

    const factory = new ScriptEditorWidgetFactory({
      editorServices,
      factoryOptions: {
        name: SCALA_FACTORY,
        fileTypes: [SCALA],
        defaultFor: [SCALA],
      },
      instanceCreator: (
        options: DocumentWidget.IOptions<
          FileEditor,
          DocumentRegistry.ICodeModel
        >,
      ): ScriptEditor => new ScalaEditor(options),
    });

    app.docRegistry.addFileType({
      name: SCALA,
      displayName: 'Scala File',
      extensions: ['.scala'],
      pattern: '.*\\.scala$',
      mimeTypes: ['text/x-scala'],
      icon: scalaIcon,
    });

    const { restored } = app;

    /**
     * Track ScalaEditor widget on page refresh
     */
    const tracker = new WidgetTracker<ScriptEditor>({
      namespace: SCALA_EDITOR_NAMESPACE,
    });

    //no default config so we set it to an empty object
    let config: CodeEditor.IOptions['config'] = {};

    if (restorer) {
      // Handle state restoration
      void restorer.restore(tracker, {
        command: commandIDs.openDocManager,
        args: (widget) => ({
          path: widget.context.path,
          factory: SCALA_FACTORY,
        }),
        name: (widget) => widget.context.path,
      });
    }

    /**
     * Update the setting values. Adapted from fileeditor-extension.
     */
    
    //replaced default Config 
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      config = {
        ...(settings.get('editorConfig').composite as JSONObject),
      };
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
        (editorTracker as WidgetTracker<IDocumentWidget<FileEditor>>).add(widget);
      }
    
      const editor = widget.content.editor;
      const editorConfigOptions = config || {}; 
      
      Object.keys(editorConfigOptions).forEach((key) => {
        const optionValue = editorConfigOptions[key];
        if (optionValue !== undefined) {
          editor.setOption(key, optionValue);
        }
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
     * Create new scala editor from launcher and file menu
     */

    // Add an scala launcher
    if (launcher) {
      launcher.add({
        command: commandIDs.createNewScalaEditor,
        category: 'Elyra',
        rank: 4,
      });
    }

    if (menu) {
      // Add new scala editor creation to the file menu
      menu.fileMenu.newMenu.addGroup(
        [{ command: commandIDs.createNewScalaEditor, args: { isMenu: true } }],
        92,
      );
    }

    // Function to create a new untitled scala file, given the current working directory
    const createNew = (cwd: string): Promise<any> => {
      return app.commands
        .execute(commandIDs.newDocManager, {
          path: cwd,
          type: 'file',
          ext: '.scala',
        })
        .then((model) => {
          return app.commands.execute(commandIDs.openDocManager, {
            path: model.path,
            factory: SCALA_FACTORY,
          });
        });
    };

    // Add a command to create new scala editor
    app.commands.addCommand(commandIDs.createNewScalaEditor, {
      label: (args) =>
        args['isPalette'] ? 'New Scala Editor' : 'Scala Editor',
      caption: 'Create a new Scala Editor',
      icon: (args) => (args['isPalette'] ? undefined : scalaIcon),
      execute: (args) => {
        //Use file browser's current path instead of defaultBrowser.model.path
        const fileBrowser = browserFactory.createFileBrowser('myFileBrowser');
        const cwd = args['cwd'] ? String(args['cwd']) : fileBrowser.model.path;
        return createNew(cwd);
      },
    });
    

    palette.addItem({
      command: commandIDs.createNewScalaEditor,
      args: { isPalette: true },
      category: 'Elyra',
    });
  },
};

export default extension;
