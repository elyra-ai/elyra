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

import { pipelineIcon, runtimesIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';

import { PipelineEditorFactory, commandIDs } from './PipelineEditorWidget';
import {
  RuntimesWidget,
  KFP_SCHEMA,
  RUNTIMES_NAMESPACE
} from './RuntimesWidget';
import { SubmitNotebookButtonExtension } from './SubmitNotebook';

import '../style/index.css';

const PIPELINE_FACTORY = 'Pipeline Editor';
const PIPELINE = 'pipeline';
const PIPELINE_EDITOR_NAMESPACE = 'elyra-pipeline-editor-extension';

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
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    launcher: ILauncher,
    browserFactory: IFileBrowserFactory,
    restorer: ILayoutRestorer,
    menu: IMainMenu
  ) => {
    console.log('Elyra - pipeline-editor extension is activated!');

    // Set up new widget Factory for .pipeline files
    const pipelineEditorFactory = new PipelineEditorFactory({
      name: PIPELINE_FACTORY,
      fileTypes: [PIPELINE],
      defaultFor: [PIPELINE],
      shell: app.shell,
      commands: app.commands,
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
        category: 'Elyra',
        rank: 1
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

    const runtimesWidget = new RuntimesWidget({
      app,
      display_name: 'Runtimes',
      namespace: RUNTIMES_NAMESPACE,
      schema: KFP_SCHEMA,
      icon: runtimesIcon
    });
    const runtimesWidgetID = `elyra-metadata:${RUNTIMES_NAMESPACE}:${KFP_SCHEMA}`;
    runtimesWidget.id = runtimesWidgetID;
    runtimesWidget.title.icon = runtimesIcon;
    runtimesWidget.title.caption = 'Runtimes';

    restorer.add(runtimesWidget, runtimesWidgetID);
    app.shell.add(runtimesWidget, 'left', { rank: 950 });
  }
};
export default extension;
