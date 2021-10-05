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

import { MetadataWidget } from '@elyra/metadata-common';
import { PIPELINE_CURRENT_VERSION } from '@elyra/pipeline-editor';
import {
  containerIcon,
  pipelineIcon,
  RequestErrors,
  runtimesIcon,
  pipelineComponentsIcon
} from '@elyra/ui-components';

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
import { addIcon } from '@jupyterlab/ui-components';

import { getRuntimeIcon } from './pipeline-hooks';
import { PipelineEditorFactory, commandIDs } from './PipelineEditorWidget';
import { PipelineService, RUNTIMES_SCHEMASPACE } from './PipelineService';
import {
  RUNTIME_IMAGES_SCHEMASPACE,
  RuntimeImagesWidget
} from './RuntimeImagesWidget';
import { RuntimesWidget } from './RuntimesWidget';
import { SubmitNotebookButtonExtension } from './SubmitNotebookButtonExtension';
import { SubmitScriptButtonExtension } from './SubmitScriptButtonExtension';

import '../style/index.css';

const PIPELINE_FACTORY = 'Pipeline Editor';
const PIPELINE = 'pipeline';
const PIPELINE_EDITOR_NAMESPACE = 'elyra-pipeline-editor-extension';
const COMPONENT_REGISTRY_SCHEMASPACE = 'component-registries';

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
    themeManager?: IThemeManager
  ) => {
    console.log('Elyra - pipeline-editor extension is activated!');

    // Set up new widget Factory for .pipeline files
    const pipelineEditorFactory = new PipelineEditorFactory({
      name: PIPELINE_FACTORY,
      fileTypes: [PIPELINE],
      defaultFor: [PIPELINE],
      shell: app.shell,
      commands: app.commands,
      browserFactory: browserFactory,
      serviceManager: app.serviceManager
    });

    // Add the default behavior of opening the widget for .pipeline files
    app.docRegistry.addFileType({
      name: PIPELINE,
      displayName: 'Pipeline',
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

    // Add command to add file to pipeline
    const addFileToPipelineCommand: string = commandIDs.addFileToPipeline;
    app.commands.addCommand(addFileToPipelineCommand, {
      label: 'Add File to Pipeline',
      icon: addIcon,
      execute: args => {
        pipelineEditorFactory.addFileToPipelineSignal.emit(args);
      }
    });
    app.contextMenu.addItem({
      selector: '[data-file-type="notebook"]',
      command: addFileToPipelineCommand
    });
    app.contextMenu.addItem({
      selector: '[data-file-type="python"]',
      command: addFileToPipelineCommand
    });
    app.contextMenu.addItem({
      selector: '[data-file-type="r"]',
      command: addFileToPipelineCommand
    });

    // Add an application command
    const openPipelineEditorCommand: string = commandIDs.openPipelineEditor;
    app.commands.addCommand(openPipelineEditorCommand, {
      label: (args: any) => {
        return args['isPalette']
          ? 'New Pipeline Editor'
          : args.runtime?.display_name
          ? args.isMenu
            ? `${args.runtime?.display_name} Pipeline Editor`
            : 'Pipeline Editor'
          : 'Generic Pipeline Editor';
      },
      caption: (args: any) =>
        args.runtime?.display_name
          ? `${args.runtime?.display_name} Pipeline Editor`
          : 'Generic Pipeline Editor',
      iconLabel: (args: any) =>
        args['isPalette']
          ? ''
          : args.runtime?.display_name
          ? `${args.runtime?.display_name} Pipeline Editor`
          : 'Generic Pipeline Editor',
      icon: (args: any) => {
        if (args['isPalette']) {
          return undefined;
        } else {
          return getRuntimeIcon(args.runtime?.name);
        }
      },
      execute: (args: any) => {
        // Creates blank file, then opens it in a new window
        app.commands
          .execute(commandIDs.newDocManager, {
            type: 'file',
            path: browserFactory.defaultBrowser.model.path,
            ext: '.pipeline'
          })
          .then(async model => {
            const pipelineJson = {
              doc_type: 'pipeline',
              version: '3.0',
              json_schema:
                'http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json',
              id: 'elyra-auto-generated-pipeline',
              primary_pipeline: 'primary',
              pipelines: [
                {
                  id: 'primary',
                  nodes: [],
                  app_data: {
                    ui_data: {
                      comments: []
                    },
                    version: PIPELINE_CURRENT_VERSION,
                    runtime: args.runtime?.name
                  },
                  runtime_ref: ''
                }
              ],
              schemas: []
            };
            const newWidget = await app.commands.execute(
              commandIDs.openDocManager,
              {
                path: model.path,
                factory: PIPELINE_FACTORY
              }
            );
            newWidget.context.ready.then(() => {
              newWidget.context.model.fromJSON(pipelineJson);
              app.commands.execute(commandIDs.saveDocManager, {
                path: model.path
              });
            });
          });
      }
    });
    // Add the command to the palette.
    palette.addItem({
      command: openPipelineEditorCommand,
      args: { isPalette: true },
      category: 'Elyra'
    });

    PipelineService.getRuntimesSchema().then(
      (schema: any) => {
        // Add the command to the launcher
        if (launcher) {
          launcher.add({
            command: openPipelineEditorCommand,
            category: 'Elyra',
            rank: 1
          });
          for (const runtime of schema) {
            launcher.add({
              command: openPipelineEditorCommand,
              category: 'Elyra',
              args: { runtime },
              rank:
                runtime.name === 'kfp' ? 2 : runtime.name === 'airflow' ? 3 : 4
            });
          }
        }
        // Add new pipeline to the file menu
        menu.fileMenu.newMenu.addGroup(
          [{ command: openPipelineEditorCommand, args: { isMenu: true } }],
          30
        );
        for (const runtime of schema) {
          menu.fileMenu.newMenu.addGroup(
            [
              {
                command: openPipelineEditorCommand,
                args: { runtime, isMenu: true }
              }
            ],
            runtime.name === 'kfp' ? 31 : runtime.name === 'airflow' ? 32 : 33
          );
        }
      },
      (error: any) => RequestErrors.serverError(error)
    );

    // SubmitNotebookButtonExtension initialization code
    const notebookButtonExtension = new SubmitNotebookButtonExtension();
    app.docRegistry.addWidgetExtension('Notebook', notebookButtonExtension);
    app.contextMenu.addItem({
      selector: '.jp-Notebook',
      command: commandIDs.submitNotebook,
      rank: -0.5
    });

    // SubmitScriptButtonExtension initialization code
    const scriptButtonExtension = new SubmitScriptButtonExtension();
    app.docRegistry.addWidgetExtension('Python Editor', scriptButtonExtension);
    app.contextMenu.addItem({
      selector: '.elyra-ScriptEditor',
      command: commandIDs.submitScript,
      rank: -0.5
    });

    app.docRegistry.addWidgetExtension('R Editor', scriptButtonExtension);
    app.contextMenu.addItem({
      selector: '.elyra-ScriptEditor',
      command: commandIDs.submitScript,
      rank: -0.5
    });

    const runtimesWidget = new RuntimesWidget({
      app,
      themeManager,
      display_name: 'Runtimes',
      schemaspace: RUNTIMES_SCHEMASPACE,
      icon: runtimesIcon,
      schemaType: 'runtime'
    });
    const runtimesWidgetID = `elyra-metadata:${RUNTIMES_SCHEMASPACE}`;
    runtimesWidget.id = runtimesWidgetID;
    runtimesWidget.title.icon = runtimesIcon;
    runtimesWidget.title.caption = 'Runtimes';

    restorer.add(runtimesWidget, runtimesWidgetID);
    app.shell.add(runtimesWidget, 'left', { rank: 950 });

    const runtimeImagesWidget = new RuntimeImagesWidget({
      app,
      themeManager,
      display_name: 'Runtime Images',
      schemaspace: RUNTIME_IMAGES_SCHEMASPACE,
      icon: containerIcon
    });
    const runtimeImagesWidgetID = `elyra-metadata:${RUNTIME_IMAGES_SCHEMASPACE}`;
    runtimeImagesWidget.id = runtimeImagesWidgetID;
    runtimeImagesWidget.title.icon = containerIcon;
    runtimeImagesWidget.title.caption = 'Runtime Images';

    const componentRegistryWidget = new MetadataWidget({
      app,
      themeManager,
      display_name: 'Pipeline Components',
      schemaspace: COMPONENT_REGISTRY_SCHEMASPACE,
      icon: pipelineComponentsIcon
    });
    const componentRegistryWidgetID = `elyra-metadata:${COMPONENT_REGISTRY_SCHEMASPACE}`;
    componentRegistryWidget.id = componentRegistryWidgetID;
    componentRegistryWidget.title.icon = pipelineComponentsIcon;
    componentRegistryWidget.title.caption = 'Pipeline Components';

    restorer.add(runtimeImagesWidget, runtimeImagesWidgetID);
    app.shell.add(runtimeImagesWidget, 'left', { rank: 951 });
    app.shell.add(componentRegistryWidget, 'left', { rank: 961 });
  }
};
export default extension;
