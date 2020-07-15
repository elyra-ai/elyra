/*
 * Copyright 2018-2020 IBM Corporation
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

import { historyIcon, pipelineIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import {
  ICommandPalette,
  IThemeManager,
  WidgetTracker
} from '@jupyterlab/apputils';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';

import { PipelineEditorFactory, commandIDs } from './PipelineEditorWidget';
import { RuntimesWidget } from './RuntimesWidget';
import { SubmitNotebookButtonExtension } from './SubmitNotebook';

import '../style/index.css';

const PIPELINE_FACTORY = 'Pipeline Editor';
const PIPELINE = 'pipeline';
const PIPELINE_EDITOR_NAMESPACE = 'elyra-pipeline-editor-extension';
const RUNTIMES_WIDGET_ID = 'elyra-pipeline-runtimes';

/**
 * Initialization data for the pipeline-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: PIPELINE,
  autoStart: true,
  requires: [
    ICommandPalette,
    ILauncher,
    IFileBrowserFactory,
    ILayoutRestorer,
    IMainMenu
  ],
  optional: [IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    launcher: ILauncher,
    browserFactory: IFileBrowserFactory,
    restorer: ILayoutRestorer,
    menu: IMainMenu,
    themeManager: IThemeManager | null
  ) => {
    console.log('Elyra - pipeline-editor extension is activated!');

    // Set up new widget Factory for .pipeline files
    const pipelineEditorFactory = new PipelineEditorFactory({
      name: PIPELINE_FACTORY,
      fileTypes: [PIPELINE],
      defaultFor: [PIPELINE],
      app: app,
      browserFactory: browserFactory
    });

    // Add the default behavior of opening the widget for .pipeline files
    app.docRegistry.addFileType({
      name: PIPELINE,
      extensions: ['.pipeline'],
      icon: pipelineIcon
    });
    app.docRegistry.addWidgetFactory(pipelineEditorFactory);

    const tracker = new WidgetTracker<DocumentWidget>({
      namespace: PIPELINE_EDITOR_NAMESPACE
    });

    pipelineEditorFactory.widgetCreated.connect((sender, widget) => {
      void tracker.add(widget);

      // Notify the widget tracker if restore data needs to update
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
    });

    // Handle state restoration
    void restorer.restore(tracker, {
      command: commandIDs.openDocManager,
      args: widget => ({
        path: widget.context.path,
        factory: PIPELINE_FACTORY
      }),
      name: widget => widget.context.path
    });

    // Add an application command
    const openPipelineEditorCommand: string = commandIDs.openPipelineEditor;
    app.commands.addCommand(openPipelineEditorCommand, {
      label: args =>
        args['isPalette'] ? 'New Pipeline Editor' : 'Pipeline Editor',
      icon: args => (args['isPalette'] ? undefined : pipelineIcon),
      execute: () => {
        // Creates blank file, then opens it in a new window
        app.commands
          .execute(commandIDs.newDocManager, {
            type: 'file',
            path: browserFactory.defaultBrowser.model.path,
            ext: '.pipeline'
          })
          .then(model => {
            return app.commands.execute(commandIDs.openDocManager, {
              path: model.path,
              factory: PIPELINE_FACTORY
            });
          });
      }
    });
    // Add the command to the palette.
    palette.addItem({
      command: openPipelineEditorCommand,
      args: { isPalette: true },
      category: 'Extensions'
    });
    // Add the command to the launcher
    if (launcher) {
      launcher.add({
        command: openPipelineEditorCommand,
        category: 'Other',
        rank: 3
      });
    }
    // Add new pipeline to the file menu
    menu.fileMenu.newMenu.addGroup(
      [{ command: openPipelineEditorCommand }],
      30
    );

    // SubmitNotebookButtonExtension initialization code
    const buttonExtension = new SubmitNotebookButtonExtension(app);
    app.docRegistry.addWidgetExtension('Notebook', buttonExtension);
    app.contextMenu.addItem({
      selector: '.jp-Notebook',
      command: commandIDs.submitNotebook,
      rank: -0.5
    });

    // RuntimesWidget initalization
    const runtimesWidget = new RuntimesWidget(app);
    runtimesWidget.id = RUNTIMES_WIDGET_ID;
    runtimesWidget.title.icon = historyIcon;
    runtimesWidget.title.caption = 'Runtimes';
    runtimesWidget.addClass('elyra-CodeSnippets');

    const openRuntimesCommand: string = commandIDs.openRuntimes;
    app.commands.addCommand(openRuntimesCommand, {
      label: args => (args['isPalette'] ? 'Open Runtimes' : 'Runtimes'),
      icon: args => (args['isPalette'] ? undefined : historyIcon),
      execute: () => {
        // Rank has been chosen somewhat arbitrarily to give priority
        // to the running sessions widget in the sidebar.
        app.shell.add(runtimesWidget, 'left', { rank: 950 });
        app.shell.activateById(RUNTIMES_WIDGET_ID);
      }
    });

    const updateTheme = (widget: any): void => {
      widget.content.themeChanged(themeManager.isLight(themeManager.theme));
    };

    if (themeManager) {
      themeManager.themeChanged.connect((): void => {
        tracker.forEach(widget => updateTheme(widget));
      });
    }
  }
};
export default extension;
