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

import {
  FrontendServices,
  IconUtil,
  NotebookParser,
  SubmissionHandler,
  clearPipelineIcon,
  dragDropIcon,
  newPipelineIcon,
  pipelineIcon,
  savePipelineIcon
} from '@elyra/application';
import {
  CommonCanvas,
  CanvasController,
  CommonProperties
} from '@elyra/canvas';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { showDialog, Dialog, ReactWidget } from '@jupyterlab/apputils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { NotebookPanel } from '@jupyterlab/notebook';
import { notebookIcon } from '@jupyterlab/ui-components';

import { toArray } from '@lumino/algorithm';
import { IDragEvent } from '@lumino/dragdrop';

import '@elyra/canvas/dist/common-canvas.min.css';

import '@elyra/canvas/dist/common-canvas.min.css';

import 'carbon-components/css/carbon-components.min.css';

import * as React from 'react';

import { IntlProvider } from 'react-intl';

import * as i18nData from './en.json';
import * as palette from './palette.json';
import { PipelineSubmissionDialog } from './PipelineSubmissionDialog';
import * as properties from './properties.json';

const PIPELINE_CLASS = 'elyra-PipelineEditor';

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled'
};

/**
 * Wrapper Class for Common Canvas React Component
 */
export class PipelineEditorWidget extends ReactWidget {
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;
  context: DocumentRegistry.Context;

  constructor(props: any) {
    super(props);
    this.app = props.app;
    this.browserFactory = props.browserFactory;
    this.context = props.context;
  }

  render(): React.ReactElement {
    return (
      <PipelineEditor
        app={this.app}
        browserFactory={this.browserFactory}
        widgetContext={this.context}
      />
    );
  }
}

/**
 * A namespace for Pipeline.
 */
export namespace PipelineEditor {
  /**
   * The props for PipelineEditor.
   */
  export interface IProps {
    app: JupyterFrontEnd;
    browserFactory: IFileBrowserFactory;
    widgetContext: DocumentRegistry.Context;
  }

  /**
   * The props for PipelineEditor.
   */
  export interface IState {
    /**
     * Whether the properties dialog is visible.
     */
    showPropertiesDialog: boolean;

    /**
     * The form contents of the properties dialog.
     */
    propertiesInfo: any;
  }
}

/**
 * Class for Common Canvas React Component
 */
export class PipelineEditor extends React.Component<
  PipelineEditor.IProps,
  PipelineEditor.IState
> {
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;
  canvasController: any;
  widgetContext: DocumentRegistry.Context;
  position = 10;
  node: React.RefObject<HTMLDivElement>;

  constructor(props: any) {
    super(props);
    this.app = props.app;
    this.browserFactory = props.browserFactory;
    this.canvasController = new CanvasController();
    this.canvasController.setPipelineFlowPalette(palette);
    this.widgetContext = props.widgetContext;
    this.widgetContext.ready.then(() => {
      this.canvasController.setPipelineFlow(this.widgetContext.model.toJSON());
    });
    this.toolbarMenuActionHandler = this.toolbarMenuActionHandler.bind(this);
    this.contextMenuHandler = this.contextMenuHandler.bind(this);
    this.contextMenuActionHandler = this.contextMenuActionHandler.bind(this);
    this.editActionHandler = this.editActionHandler.bind(this);

    this.state = { showPropertiesDialog: false, propertiesInfo: {} };

    this.applyPropertyChanges = this.applyPropertyChanges.bind(this);
    this.closePropertiesDialog = this.closePropertiesDialog.bind(this);
    this.openPropertiesDialog = this.openPropertiesDialog.bind(this);

    this.node = React.createRef();
    this.handleEvent = this.handleEvent.bind(this);
  }

  render(): any {
    const style = { height: '100%' };
    const emptyCanvasContent = (
      <div>
        <dragDropIcon.react tag="div" elementPosition="center" height="120px" />
        <h1>
          {' '}
          Start your new pipeline by dragging files from the file browser pane.{' '}
        </h1>
      </div>
    );
    const canvasConfig = {
      enableInternalObjectModel: true,
      emptyCanvasContent: emptyCanvasContent,
      enablePaletteLayout: 'Modal',
      paletteInitialState: false
    };
    const toolbarConfig = [
      { action: 'run', label: 'Run Pipeline', enable: true },
      { divider: true },
      {
        action: 'save',
        label: 'Save Pipeline',
        enable: true,
        iconEnabled: IconUtil.encode(savePipelineIcon),
        iconDisabled: IconUtil.encode(savePipelineIcon)
      },
      { divider: true },
      {
        action: 'new',
        label: 'New Pipeline',
        enable: true,
        iconEnabled: IconUtil.encode(newPipelineIcon),
        iconDisabled: IconUtil.encode(newPipelineIcon)
      },
      { divider: true },
      {
        action: 'clear',
        label: 'Clear Pipeline',
        enable: true,
        iconEnabled: IconUtil.encode(clearPipelineIcon),
        iconDisabled: IconUtil.encode(clearPipelineIcon)
      },
      { divider: true },
      { action: 'undo', label: 'Undo', enable: true },
      { action: 'redo', label: 'Redo', enable: true },
      { action: 'cut', label: 'Cut', enable: false },
      { action: 'copy', label: 'Copy', enable: false },
      { action: 'paste', label: 'Paste', enable: false },
      { action: 'addComment', label: 'Add Comment', enable: true },
      { action: 'delete', label: 'Delete', enable: true },
      {
        action: 'arrangeHorizontally',
        label: 'Arrange Horizontally',
        enable: true
      },
      { action: 'arrangeVertically', label: 'Arrange Vertically', enable: true }
    ];

    const propertiesCallbacks = {
      applyPropertyChanges: this.applyPropertyChanges,
      closePropertiesDialog: this.closePropertiesDialog
    };

    const commProps = this.state.showPropertiesDialog ? (
      <IntlProvider
        key="IntlProvider2"
        locale={'en'}
        messages={i18nData.messages}
      >
        <CommonProperties
          propertiesInfo={this.propertiesInfo}
          propertiesConfig={{}}
          callbacks={propertiesCallbacks}
        />
      </IntlProvider>
    ) : null;

    return (
      <div style={style} ref={this.node}>
        <CommonCanvas
          canvasController={this.canvasController}
          toolbarMenuActionHandler={this.toolbarMenuActionHandler}
          contextMenuHandler={this.contextMenuHandler}
          contextMenuActionHandler={this.contextMenuActionHandler}
          editActionHandler={this.editActionHandler}
          toolbarConfig={toolbarConfig}
          config={canvasConfig}
        />
        {commProps}
      </div>
    );
  }

  propertiesInfo = {
    parameterDef: this.addDockerImages(properties),
    appData: { id: '' }
  };

  addDockerImages(properties: any): any {
    let firstImage = true;
    const dockerImages = FrontendServices.getDockerImages();
    const imageEnum = [];

    for (const image in dockerImages) {
      if (firstImage) {
        properties.current_parameters.image = image;
        firstImage = false;
      }
      imageEnum.push(image);
      properties.resources['image.' + image + '.label'] = dockerImages[image];
    }
    properties.parameters[0].enum = imageEnum;
    return properties;
  }

  openPropertiesDialog(source: any): void {
    console.log('Opening properties dialog');
    const node_id = source.targetObject.id;
    const app_data = this.canvasController.getNode(node_id).app_data;

    const node_props = this.propertiesInfo;
    node_props.appData.id = node_id;

    node_props.parameterDef.current_parameters.image = app_data.image;
    node_props.parameterDef.current_parameters.outputs = app_data.outputs;
    node_props.parameterDef.current_parameters.vars = app_data.vars;
    node_props.parameterDef.current_parameters.dependencies =
      app_data.dependencies;
    node_props.parameterDef.current_parameters.recursive_dependencies =
      app_data.recursive_dependencies;

    this.setState({ showPropertiesDialog: true, propertiesInfo: node_props });
  }

  applyPropertyChanges(propertySet: any, appData: any): void {
    console.log('Applying changes to properties');
    const app_data = this.canvasController.getNode(appData.id).app_data;

    app_data.image = propertySet.image;
    app_data.outputs = propertySet.outputs;
    app_data.vars = propertySet.vars;
    app_data.dependencies = propertySet.dependencies;
    app_data.recursive_dependencies = propertySet.recursive_dependencies;
  }

  closePropertiesDialog(): void {
    console.log('Closing properties dialog');
    this.setState({ showPropertiesDialog: false, propertiesInfo: {} });
  }

  contextMenuHandler(source: any, defaultMenu: any): any {
    let customMenu = defaultMenu;
    if (source.type === 'node') {
      if (source.selectedObjectIds.length > 1) {
        customMenu = customMenu.concat({
          action: 'openNotebook',
          label: 'Open Notebooks'
        });
      } else {
        customMenu = customMenu.concat({
          action: 'openNotebook',
          label: 'Open Notebook'
        });
      }
      customMenu = customMenu.concat({
        action: 'properties',
        label: 'Properties'
      });
    }
    return customMenu;
  }

  contextMenuActionHandler(action: any, source: any): void {
    if (action === 'openNotebook' && source.type === 'node') {
      const nodes = source.selectedObjectIds;
      for (let i = 0; i < nodes.length; i++) {
        const path = this.canvasController.getNode(nodes[i]).app_data.artifact;
        this.app.commands.execute(commandIDs.openDocManager, { path });
      }
    } else if (action === 'properties' && source.type === 'node') {
      if (this.state.showPropertiesDialog) {
        this.closePropertiesDialog();
      } else {
        this.openPropertiesDialog(source);
      }
    }
  }

  /*
   * Handles creating new nodes in the canvas
   */
  editActionHandler(data: any): void {
    this.widgetContext.model.fromJSON(this.canvasController.getPipelineFlow());
  }

  handleAdd(x?: number, y?: number): Promise<any> {
    let failedAdd = 0;
    let position = 0;
    const missingXY = !(x && y);

    // if either x or y is undefined use the default coordinates
    if (missingXY) {
      position = this.position;
      x = 75;
      y = 85;
    }

    const fileBrowser = this.browserFactory.defaultBrowser;

    toArray(fileBrowser.selectedItems()).map(item => {
      // if the selected item is a file
      if (item.type == 'notebook') {
        //add each selected notebook
        console.log('Adding ==> ' + item.path);

        const nodeTemplate = this.canvasController.getPaletteNode(
          'execute-notebook-node'
        );
        if (nodeTemplate) {
          const data = {
            editType: 'createNode',
            offsetX: x + position,
            offsetY: y + position,
            nodeTemplate: this.canvasController.convertNodeTemplate(
              nodeTemplate
            )
          };

          // create a notebook widget to get a string with the node content then dispose of it
          const notebookWidget = fileBrowser.model.manager.open(item.path);
          const notebookStr = (notebookWidget as NotebookPanel).content.model.toString();
          notebookWidget.dispose();

          const vars = NotebookParser.getEnvVars(notebookStr).map(
            str => str + '='
          );

          data.nodeTemplate.label = item.path.replace(/^.*[\\/]/, '');
          data.nodeTemplate.label = data.nodeTemplate.label.replace(
            /\.[^/.]+$/,
            ''
          );
          data.nodeTemplate.image = IconUtil.encode(notebookIcon);
          data.nodeTemplate.app_data['artifact'] = item.path;
          data.nodeTemplate.app_data[
            'image'
          ] = this.propertiesInfo.parameterDef.current_parameters.image;
          data.nodeTemplate.app_data['vars'] = vars;

          this.canvasController.editActionHandler(data);

          position += 20;
        }
      } else {
        failedAdd++;
      }
    });

    // update position if the default coordinates were used
    if (missingXY) {
      this.position = position;
    }

    if (failedAdd) {
      return showDialog({
        title: 'Unsupported File(s)',
        body:
          'Currently, only selected notebook files can be added to a pipeline',
        buttons: [Dialog.okButton()]
      });
    }
  }

  handleRun(): void {
    SubmissionHandler.makeGetRequest(
      'api/metadata/runtimes',
      'pipeline',
      (response: any) => {
        if (Object.keys(response.runtimes).length === 0) {
          return SubmissionHandler.noMetadataError('runtimes');
        }

        showDialog({
          title: 'Run pipeline',
          body: new PipelineSubmissionDialog({ runtimes: response.runtimes }),
          buttons: [Dialog.cancelButton(), Dialog.okButton()],
          focusNodeSelector: '#pipeline_name'
        }).then(result => {
          if (result.value == null) {
            // When Cancel is clicked on the dialog, just return
            return;
          }

          // prepare pipeline submission details
          const pipelineFlow = this.canvasController.getPipelineFlow();
          pipelineFlow.pipelines[0]['app_data']['title'] =
            result.value.pipeline_name;
          // TODO: Be more flexible and remove hardcoded runtime type
          pipelineFlow.pipelines[0]['app_data']['runtime'] = 'kfp';
          pipelineFlow.pipelines[0]['app_data']['runtime-config'] =
            result.value.runtime_config;

          SubmissionHandler.submitPipeline(
            pipelineFlow,
            result.value.runtime_config,
            'pipeline'
          );
        });
      }
    );
  }

  handleSave(): void {
    this.widgetContext.model.fromJSON(this.canvasController.getPipelineFlow());
    this.widgetContext.save();
  }

  handleOpen(): void {
    toArray(this.browserFactory.defaultBrowser.selectedItems()).map(item => {
      // if the selected item is a file
      if (item.type != 'directory') {
        console.log('Opening ==> ' + item.path);
        this.app.commands.execute(commandIDs.openDocManager, {
          path: item.path
        });
      }
    });
  }

  handleNew(): void {
    // Clears the canvas, then creates a new file and sets the pipeline_name field to the new name.
    this.app.commands.execute(commandIDs.openPipelineEditor);
  }

  handleClear(): Promise<any> {
    return showDialog({
      title: 'Clear Pipeline?',
      body: 'Are you sure you want to clear? You can not undo this.',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        this.canvasController.clearPipelineFlow();
        this.widgetContext.model.fromJSON(
          this.canvasController.getPipelineFlow()
        );
        this.position = 10;
      }
    });
  }

  /**
   * Handles submitting pipeline runs
   */
  toolbarMenuActionHandler(action: any, source: any): void {
    console.log('Handling action: ' + action);
    if (action == 'run') {
      // When executing the pipeline
      this.handleRun();
    } else if (action == 'save') {
      this.handleSave();
    } else if (action == 'open') {
      this.handleOpen();
    } else if (action == 'new') {
      this.handleNew();
    } else if (action == 'clear') {
      this.handleClear();
    }
  }

  componentDidMount(): void {
    const node = this.node.current!;
    node.addEventListener('dragenter', this.handleEvent);
    node.addEventListener('dragover', this.handleEvent);
    node.addEventListener('lm-dragenter', this.handleEvent);
    node.addEventListener('lm-dragover', this.handleEvent);
    node.addEventListener('lm-drop', this.handleEvent);
  }

  componentWillUnmount(): void {
    const node = this.node.current!;
    node.removeEventListener('lm-drop', this.handleEvent);
    node.removeEventListener('lm-dragover', this.handleEvent);
    node.removeEventListener('lm-dragenter', this.handleEvent);
    node.removeEventListener('dragover', this.handleEvent);
    node.removeEventListener('dragenter', this.handleEvent);
  }

  /**
   * Handle the DOM events.
   *
   * @param event - The DOM event.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'dragenter':
        event.preventDefault();
        break;
      case 'dragover':
        event.preventDefault();
        break;
      case 'lm-dragenter':
        event.preventDefault();
        break;
      case 'lm-dragover':
        event.preventDefault();
        event.stopPropagation();
        (event as IDragEvent).dropAction = (event as IDragEvent).proposedAction;
        break;
      case 'lm-drop':
        event.preventDefault();
        event.stopPropagation();
        this.handleAdd(
          (event as IDragEvent).offsetX,
          (event as IDragEvent).offsetY
        );
        break;
      default:
        break;
    }
  }
}

export class PipelineEditorFactory extends ABCWidgetFactory<DocumentWidget> {
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;

  constructor(options: any) {
    super(options);
    this.app = options.app;
    this.browserFactory = options.browserFactory;
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    // Creates a blank widget with a DocumentWidget wrapper
    const props = {
      app: this.app,
      browserFactory: this.browserFactory,
      context: context
    };
    const content = new PipelineEditorWidget(props);
    const widget = new DocumentWidget({
      content,
      context,
      node: document.createElement('div')
    });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
