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

import * as path from 'path';

import { IDictionary } from '@elyra/application';
import {
  CommonCanvas,
  CanvasController,
  CommonProperties
} from '@elyra/canvas';
import {
  IconUtil,
  clearPipelineIcon,
  dragDropIcon,
  exportPipelineIcon,
  pipelineIcon,
  savePipelineIcon,
  runtimesIcon,
  showBrowseFileDialog,
  showFormDialog,
  errorIcon
} from '@elyra/ui-components';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { showDialog, Dialog, ReactWidget } from '@jupyterlab/apputils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ServiceManager } from '@jupyterlab/services';

import { toArray } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { IDragEvent } from '@lumino/dragdrop';
import { Signal } from '@lumino/signaling';
import { Collapse, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@material-ui/lab/Alert';
import { Color } from '@material-ui/lab/Alert';

import 'carbon-components/css/carbon-components.min.css';
import '@elyra/canvas/dist/styles/common-canvas.min.css';
import '../style/canvas.css';

import * as React from 'react';

import { IntlProvider } from 'react-intl';

import { CanvasManager } from './canvas';
import { PIPELINE_CURRENT_VERSION } from './constants';
import * as i18nData from './en.json';
import { formDialogWidget } from './formDialogWidget';
import * as palette from './palette.json';

import { PipelineExportDialog } from './PipelineExportDialog';
import {
  PipelineService,
  KFP_SCHEMA,
  RUNTIMES_NAMESPACE
} from './PipelineService';
import { PipelineSubmissionDialog } from './PipelineSubmissionDialog';

import * as properties from './properties.json';
import Utils from './utils';

const PIPELINE_CLASS = 'elyra-PipelineEditor';
const NODE_TOOLTIP_CLASS = 'elyra-PipelineNodeTooltip';

const TIP_TYPE_NODE = 'tipTypeNode';

const NodeProperties = (properties: any): React.ReactElement => {
  return (
    <dl className={NODE_TOOLTIP_CLASS}>
      {Object.keys(properties).map((key, idx) => {
        let value = properties[key];
        if (Array.isArray(value)) {
          value = value.join('\n');
        } else if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No';
        }
        let tooltipTextClass = '';
        if (key == 'Error') {
          tooltipTextClass = 'elyra-tooltipError';
        }
        return (
          <React.Fragment key={idx}>
            <dd className={tooltipTextClass}>{key}</dd>
            <dt className={tooltipTextClass}>{value}</dt>
          </React.Fragment>
        );
      })}
    </dl>
  );
};

interface IValidationError {
  errorMessage: string;
  errorSeverity: Color;
}

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openMetadata: 'elyra-metadata:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  submitNotebook: 'notebook:submit',
  addFileToPipeline: 'pipeline-editor:add-node'
};

/**
 * Wrapper Class for Common Canvas React Component
 */
export class PipelineEditorWidget extends ReactWidget {
  shell: JupyterFrontEnd.IShell;
  commands: CommandRegistry;
  browserFactory: IFileBrowserFactory;
  context: DocumentRegistry.Context;
  serviceManager: ServiceManager;
  addFileToPipelineSignal: Signal<PipelineEditorFactory, any>;

  constructor(props: any) {
    super(props);
    this.shell = props.shell;
    this.commands = props.commands;
    this.browserFactory = props.browserFactory;
    this.context = props.context;
    this.serviceManager = props.serviceManager;
    this.addFileToPipelineSignal = props.addFileToPipelineSignal;
  }

  render(): React.ReactElement {
    return (
      <PipelineEditor
        shell={this.shell}
        commands={this.commands}
        browserFactory={this.browserFactory}
        widgetContext={this.context}
        widgetId={this.parent.id}
        serviceManager={this.serviceManager}
        addFileToPipelineSignal={this.addFileToPipelineSignal}
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
    shell: JupyterFrontEnd.IShell;
    commands: CommandRegistry;
    browserFactory: IFileBrowserFactory;
    widgetContext: DocumentRegistry.Context;
    serviceManager: ServiceManager;
    addFileToPipelineSignal: Signal<PipelineEditorFactory, any>;
    widgetId: string;
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

    /*
     * Whether the warning for invalid operations is visible.
     */
    showValidationError: boolean;

    /*
     * Error to present for an invalid operation
     */
    validationError: IValidationError;

    /**
     * Whether pipeline is empty.
     */
    emptyPipeline: boolean;
  }
}

/**
 * Class for Common Canvas React Component
 */
export class PipelineEditor extends React.Component<
  PipelineEditor.IProps,
  PipelineEditor.IState
> {
  shell: JupyterFrontEnd.IShell;
  commands: CommandRegistry;
  browserFactory: IFileBrowserFactory;
  canvasManager: CanvasManager;
  serviceManager: ServiceManager;
  canvasController: any;
  widgetContext: DocumentRegistry.Context;
  widgetId: string;
  addFileToPipelineSignal: Signal<PipelineEditorFactory, any>;
  position = 10;
  node: React.RefObject<HTMLDivElement>;
  propertiesInfo: any;
  propertiesController: any;

  constructor(props: any) {
    super(props);
    this.shell = props.shell;
    this.commands = props.commands;
    this.browserFactory = props.browserFactory;
    this.serviceManager = props.serviceManager;
    this.canvasController = new CanvasController();
    this.canvasController.setPipelineFlowPalette(palette);
    this.widgetContext = props.widgetContext;
    this.canvasManager = new CanvasManager(
      this.widgetContext,
      this.canvasController
    );
    this.widgetId = props.widgetId;
    this.addFileToPipelineSignal = props.addFileToPipelineSignal;

    this.contextMenuHandler = this.contextMenuHandler.bind(this);
    this.clickActionHandler = this.clickActionHandler.bind(this);
    this.editActionHandler = this.editActionHandler.bind(this);
    this.beforeEditActionHandler = this.beforeEditActionHandler.bind(this);
    this.tipHandler = this.tipHandler.bind(this);

    this.nodesConnected = this.nodesConnected.bind(this);

    this.state = {
      showPropertiesDialog: false,
      propertiesInfo: {},
      showValidationError: false,
      validationError: {
        errorMessage: '',
        errorSeverity: 'error'
      },
      emptyPipeline: Utils.isEmptyPipeline(
        this.canvasController.getPipelineFlow()
      )
    };

    this.applyPropertyChanges = this.applyPropertyChanges.bind(this);
    this.closePropertiesDialog = this.closePropertiesDialog.bind(this);
    this.openPropertiesDialog = this.openPropertiesDialog.bind(this);
    this.propertiesActionHandler = this.propertiesActionHandler.bind(this);
    this.propertiesControllerHandler = this.propertiesControllerHandler.bind(
      this
    );

    this.addFileToPipelineSignal.connect((args: any): any => {
      this.handleAddFileToPipelineCanvas();
    });

    this.node = React.createRef();
    this.handleEvent = this.handleEvent.bind(this);
  }

  render(): React.ReactElement {
    const style = { height: '100%' };
    const validationAlert = (
      <Collapse in={this.state.showValidationError}>
        <Alert
          severity={this.state.validationError.errorSeverity}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={(): void => {
                this.setState({ showValidationError: false });
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {this.state.validationError.errorMessage}
        </Alert>
      </Collapse>
    );
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
      enablePaletteLayout: 'None',
      paletteInitialState: false,
      enableInsertNodeDroppedOnLink: true,
      enableNodeFormatType: 'Horizontal'
    };
    const contextMenuConfig = {
      enableCreateSupernodeNonContiguous: true,
      defaultMenuEntries: {
        saveToPalette: false,
        createSupernode: true
      }
    };
    const pipelineDefinition = this.canvasController.getPipelineFlow();
    const emptyCanvas = Utils.isEmptyCanvas(pipelineDefinition);
    const toolbarConfig = [
      {
        action: 'run',
        label: 'Run Pipeline',
        enable: !this.state.emptyPipeline
      },
      {
        action: 'save',
        label: 'Save Pipeline',
        enable: true,
        iconEnabled: IconUtil.encode(savePipelineIcon),
        iconDisabled: IconUtil.encode(savePipelineIcon)
      },
      {
        action: 'export',
        label: 'Export Pipeline',
        enable: !this.state.emptyPipeline,
        iconEnabled: IconUtil.encode(exportPipelineIcon),
        iconDisabled: IconUtil.encode(exportPipelineIcon)
      },
      {
        action: 'clear',
        label: 'Clear Pipeline',
        enable: !this.state.emptyPipeline || !emptyCanvas,
        iconEnabled: IconUtil.encode(clearPipelineIcon),
        iconDisabled: IconUtil.encode(clearPipelineIcon)
      },
      {
        action: 'openRuntimes',
        label: 'Open Runtimes',
        enable: true,
        iconEnabled: IconUtil.encode(runtimesIcon),
        iconDisabled: IconUtil.encode(runtimesIcon)
      },
      { divider: true },
      { action: 'undo', label: 'Undo' },
      { action: 'redo', label: 'Redo' },
      { action: 'cut', label: 'Cut' },
      { action: 'copy', label: 'Copy' },
      { action: 'paste', label: 'Paste' },
      { action: 'createAutoComment', label: 'Add Comment', enable: true },
      { action: 'deleteSelectedObjects', label: 'Delete' },
      {
        action: 'arrangeHorizontally',
        label: 'Arrange Horizontally',
        enable: !this.state.emptyPipeline
      },
      {
        action: 'arrangeVertically',
        label: 'Arrange Vertically',
        enable: !this.state.emptyPipeline
      }
    ];

    const propertiesCallbacks = {
      actionHandler: this.propertiesActionHandler,
      controllerHandler: this.propertiesControllerHandler,
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
          propertiesInfo={this.state.propertiesInfo}
          propertiesConfig={{}}
          callbacks={propertiesCallbacks}
        />
      </IntlProvider>
    ) : null;

    return (
      <div style={style} ref={this.node}>
        {validationAlert}
        <IntlProvider
          key="IntlProvider1"
          locale={'en'}
          messages={i18nData.messages}
        >
          <CommonCanvas
            canvasController={this.canvasController}
            contextMenuHandler={this.contextMenuHandler}
            clickActionHandler={this.clickActionHandler}
            editActionHandler={this.editActionHandler}
            beforeEditActionHandler={this.beforeEditActionHandler}
            tipHandler={this.tipHandler}
            toolbarConfig={toolbarConfig}
            config={canvasConfig}
            notificationConfig={{ enable: false }}
            contextMenuConfig={contextMenuConfig}
          />
        </IntlProvider>
        {commProps}
      </div>
    );
  }

  updateModel(): void {
    const pipelineFlow = this.canvasController.getPipelineFlow();

    this.widgetContext.model.fromString(JSON.stringify(pipelineFlow, null, 2));

    this.setState({ emptyPipeline: Utils.isEmptyPipeline(pipelineFlow) });
  }

  async initPropertiesInfo(): Promise<void> {
    const runtimeImages = await PipelineService.getRuntimeImages();

    const imageEnum = [];
    for (const runtimeImage in runtimeImages) {
      imageEnum.push(runtimeImage);
      (properties.resources as IDictionary<string>)[
        'runtime_image.' + runtimeImage + '.label'
      ] = runtimeImages[runtimeImage];
    }
    properties.parameters[1].enum = imageEnum;

    this.propertiesInfo = {
      parameterDef: properties,
      appData: { id: '' }
    };
  }

  openPropertiesDialog(source: any): void {
    console.log('Opening properties dialog');
    const node_id = source.targetObject.id;
    const app_data = source.targetObject.app_data;

    const node_props = JSON.parse(JSON.stringify(this.propertiesInfo));
    node_props.appData.id = node_id;

    node_props.parameterDef.current_parameters.filename = app_data.filename;
    node_props.parameterDef.current_parameters.runtime_image =
      app_data.runtime_image;
    node_props.parameterDef.current_parameters.outputs = app_data.outputs;
    node_props.parameterDef.current_parameters.env_vars = app_data.env_vars;
    node_props.parameterDef.current_parameters.dependencies =
      app_data.dependencies;
    node_props.parameterDef.current_parameters.include_subdirectories =
      app_data.include_subdirectories;

    this.setState({
      showValidationError: false,
      showPropertiesDialog: true,
      propertiesInfo: node_props
    });
  }

  applyPropertyChanges(propertySet: any, appData: any): void {
    console.log('Applying changes to properties');
    const pipelineId = this.canvasController.getPrimaryPipelineId();
    let node = this.canvasController.getNode(appData.id, pipelineId);
    // If the node is in a supernode, search supernodes for it
    if (!node) {
      const superNodes = this.canvasController.getSupernodes(pipelineId);
      for (const superNode of superNodes) {
        node = this.canvasController.getNode(
          appData.id,
          superNode.subflow_ref.pipeline_id_ref
        );
        if (node) {
          break;
        }
      }
    }
    const app_data = node.app_data;

    if (app_data.filename !== propertySet.filename) {
      app_data.filename = propertySet.filename;
      node.label = path.basename(
        propertySet.filename,
        path.extname(propertySet.filename)
      );
    }

    app_data.runtime_image = propertySet.runtime_image;
    app_data.outputs = propertySet.outputs;
    app_data.env_vars = propertySet.env_vars;
    app_data.dependencies = propertySet.dependencies;
    app_data.include_subdirectories = propertySet.include_subdirectories;
    this.validateAllNodes();
    this.updateModel();
  }

  closePropertiesDialog(): void {
    console.log('Closing properties dialog');
    const propsInfo = JSON.parse(JSON.stringify(this.propertiesInfo));
    this.setState({ showPropertiesDialog: false, propertiesInfo: propsInfo });
  }

  propertiesControllerHandler(propertiesController: any): void {
    this.propertiesController = propertiesController;
  }

  propertiesActionHandler(id: string, appData: any, data: any): void {
    const propertyId = { name: data.parameter_ref };
    const filename = PipelineService.getWorkspaceRelativeNodePath(
      this.widgetContext.path,
      this.propertiesController.getPropertyValue('filename')
    );

    if (id === 'browse_file') {
      const currentExt = path.extname(filename);
      showBrowseFileDialog(this.browserFactory.defaultBrowser.model.manager, {
        startPath: path.dirname(filename),
        filter: (model: any): boolean => {
          const ext = path.extname(model.path);
          return currentExt === ext;
        }
      }).then((result: any) => {
        if (result.button.accept && result.value.length) {
          this.propertiesController.updatePropertyValue(
            propertyId,
            PipelineService.getPipelineRelativeNodePath(
              this.widgetContext.path,
              result.value[0].path
            )
          );
        }
      });
    } else if (id === 'add_dependencies') {
      showBrowseFileDialog(this.browserFactory.defaultBrowser.model.manager, {
        multiselect: true,
        includeDir: true,
        rootPath: path.dirname(filename),
        filter: (model: any): boolean => {
          // do not include the notebook itself
          return model.path !== filename;
        }
      }).then((result: any) => {
        if (result.button.accept && result.value.length) {
          const dependenciesSet = new Set(
            this.propertiesController.getPropertyValue(propertyId)
          );
          result.value.forEach((val: any) => {
            dependenciesSet.add(val.path);
          });

          this.propertiesController.updatePropertyValue(propertyId, [
            ...dependenciesSet
          ]);
        }
      });
    }
  }

  /*
   * Add options to the node context menu
   * Pipeline specific context menu items are:
   *  - Enable opening selected notebook(s)
   *  - Enable node properties for single node
   */
  contextMenuHandler(source: any, defaultMenu: any): any {
    let customMenu = defaultMenu;
    if (source.type === 'node') {
      if (source.selectedObjectIds.length > 1) {
        // multiple nodes selected
        customMenu = customMenu.concat({
          action: 'openFile',
          label: 'Open Files'
        });
      } else if (source.targetObject.type == 'execution_node') {
        // single node selected
        customMenu = customMenu.concat(
          {
            action: 'openFile',
            label: 'Open File'
          },
          {
            action: 'properties',
            label: 'Properties'
          }
        );
      }
    }
    return customMenu;
  }

  /*
   * Handles mouse click actions
   */
  clickActionHandler(source: any): void {
    // opens the Jupyter Notebook associated with a given node
    if (source.clickType === 'DOUBLE_CLICK' && source.objectType === 'node') {
      this.handleOpenFile(source.selectedObjectIds);
    }
  }

  /*
   * Checks if there is a path from sourceNode to targetNode in the graph.
   */
  nodesConnected(
    sourceNode: string,
    targetNode: string,
    links: any[]
  ): boolean {
    if (
      links.find((value: any, index: number) => {
        return value.srcNodeId == sourceNode && value.trgNodeId == targetNode;
      })
    ) {
      return true;
    } else {
      for (const link of links) {
        if (
          link.srcNodeId == sourceNode &&
          this.nodesConnected(link.trgNodeId, targetNode, links)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  beforeEditActionHandler(data: any): any {
    // Checks validity of links before adding
    if (
      data.editType == 'linkNodes' &&
      this.nodesConnected(
        data.targetNodes[0].id,
        data.nodes[0].id,
        this.canvasController.getLinks()
      )
    ) {
      this.setState({
        validationError: {
          errorMessage: 'Invalid operation: circular references in pipeline.',
          errorSeverity: 'error'
        },
        showValidationError: true
      });
      // Don't proceed with adding the link if invalid.
      return null;
    } else {
      return data;
    }
  }

  /*
   * Handles creating new nodes in the canvas
   */
  editActionHandler(data: any): void {
    this.setState({
      showValidationError: false
    });
    if (data && data.editType) {
      console.log(`Handling action: ${data.editType}`);

      switch (data.editType) {
        case 'run':
          this.handleRunPipeline();
          break;
        case 'export':
          this.handleExportPipeline();
          break;
        case 'save':
          this.handleSavePipeline();
          break;
        case 'clear':
          this.handleClearPipeline(data);
          break;
        case 'openRuntimes':
          this.handleOpenRuntimes();
          break;
        case 'openFile':
          if (data.type === 'node') {
            this.handleOpenFile(data.selectedObjectIds);
          }
          break;
        case 'properties':
          if (data.type === 'node') {
            this.state.showPropertiesDialog
              ? this.closePropertiesDialog()
              : this.openPropertiesDialog(data);
          }
          break;
      }
    }

    this.validateAllLinks();
    this.updateModel();
  }

  /*
   * Handles displaying node properties
   */
  tipHandler(tipType: string, data: any): any {
    if (tipType === TIP_TYPE_NODE) {
      const appData = data.node.app_data;
      const propsInfo = this.propertiesInfo.parameterDef.uihints.parameter_info;
      const tooltipProps: any = {};

      if (appData != null && appData.invalidNodeError != null) {
        tooltipProps['Error'] = appData.invalidNodeError;
      }

      if (data.node.type == 'execution_node') {
        propsInfo.forEach(
          (info: { parameter_ref: string; label: { default: string } }) => {
            tooltipProps[info.label.default] =
              appData[info.parameter_ref] || '';
          }
        );
      }

      return <NodeProperties {...tooltipProps} />;
    }
  }

  handleAddFileToPipelineCanvas(x?: number, y?: number): Promise<any> {
    // Only add file to pipeline if it is currently in focus
    if (this.shell.currentWidget.id !== this.widgetId) {
      return;
    }

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
      if (this.canvasManager.isSupportedNode(item)) {
        // read the file contents
        // create a notebook widget to get a string with the node content then dispose of it
        let itemContent: string;
        if (item.type == 'notebook') {
          const fileWidget = fileBrowser.model.manager.open(item.path);
          itemContent = (fileWidget as NotebookPanel).content.model.toString();
          fileWidget.dispose();
        }

        const success = this.canvasManager.addNode(
          item,
          itemContent,
          x + position,
          y + position
        );

        if (success) {
          position += 20;
          this.setState({ showValidationError: false });
        } else {
          // handle error
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
          'Currently, only selected notebook and python script files can be added to a pipeline',
        buttons: [Dialog.okButton()]
      });
    }
  }

  /*
   * Open node associated notebook
   */
  handleOpenFile(selectedNodes: any): void {
    for (let i = 0; i < selectedNodes.length; i++) {
      const path = PipelineService.getWorkspaceRelativeNodePath(
        this.widgetContext.path,
        this.canvasController.getNode(selectedNodes[i]).app_data.filename
      );
      this.commands.execute(commandIDs.openDocManager, { path });
    }
  }

  async handleExportPipeline(): Promise<void> {
    // Warn user if the pipeline has invalid nodes
    const errorMessage = await this.validatePipeline();
    if (errorMessage) {
      this.setState({
        showValidationError: true,
        validationError: {
          errorMessage: errorMessage,
          errorSeverity: 'error'
        }
      });
      return;
    }
    const runtimes = await PipelineService.getRuntimes();

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title: 'Export pipeline',
      body: formDialogWidget(<PipelineExportDialog runtimes={runtimes} />),
      buttons: [Dialog.cancelButton(), Dialog.okButton()],
      defaultButton: 1,
      focusNodeSelector: '#runtime_config'
    };
    const dialogResult = await showFormDialog(dialogOptions);

    if (dialogResult.value == null) {
      // When Cancel is clicked on the dialog, just return
      return;
    }

    // prepare pipeline submission details
    const pipelineFlow = this.canvasController.getPipelineFlow();
    const pipeline_path = this.widgetContext.path;

    const pipeline_dir = path.dirname(pipeline_path);
    const pipeline_name = path.basename(
      pipeline_path,
      path.extname(pipeline_path)
    );
    const pipeline_export_format = dialogResult.value.pipeline_filetype;
    const pipeline_export_path =
      pipeline_dir + '/' + pipeline_name + '.' + pipeline_export_format;

    const overwrite = dialogResult.value.overwrite;

    const runtime_config = dialogResult.value.runtime_config;
    const runtime = PipelineService.getRuntimeName(runtime_config, runtimes);

    PipelineService.setNodePathsRelativeToWorkspace(
      pipelineFlow.pipelines[0],
      this.widgetContext.path
    );

    pipelineFlow.pipelines[0]['app_data']['name'] = pipeline_name;
    pipelineFlow.pipelines[0]['app_data']['runtime'] = runtime;
    pipelineFlow.pipelines[0]['app_data']['runtime-config'] = runtime_config;

    PipelineService.exportPipeline(
      pipelineFlow,
      pipeline_export_format,
      pipeline_export_path,
      overwrite
    );
  }

  async handleOpenPipeline(): Promise<void> {
    this.widgetContext.ready.then(async () => {
      let pipelineJson: any = this.widgetContext.model.toJSON();
      if (pipelineJson == null) {
        // creating new pipeline
        pipelineJson = this.canvasController.getPipelineFlow();
        if (Utils.isEmptyPipeline(pipelineJson)) {
          pipelineJson.pipelines[0]['app_data'][
            'version'
          ] = PIPELINE_CURRENT_VERSION;
          this.canvasController.setPipelineFlow(pipelineJson);
        }
      } else {
        // opening an existing pipeline
        const pipelineVersion: number = +Utils.getPipelineVersion(pipelineJson);

        if (pipelineVersion !== PIPELINE_CURRENT_VERSION) {
          // pipeline version and current version are divergent
          if (pipelineVersion > PIPELINE_CURRENT_VERSION) {
            // in this case, pipeline was last edited in a "more recent release" and
            // the user should update his version of Elyra to consume the pipeline
            showDialog({
              title: 'Load pipeline failed!',
              body: (
                <p>
                  This pipeline corresponds to a more recent version of Elyra
                  and cannot be used until Elyra has been upgraded.
                </p>
              ),
              buttons: [Dialog.okButton()]
            }).then(() => {
              this.handleClosePipeline();
            });
          } else {
            // in this case, pipeline was last edited in a "old" version of Elyra and
            // it needs to be updated/migrated.
            showDialog({
              title: 'Migrate pipeline?',
              body: (
                <p>
                  This pipeline corresponds to an older version of Elyra and
                  needs to be migrated.
                  <br />
                  Although the pipeline can be further edited and/or submitted
                  after its update,
                  <br />
                  the migration will not be completed until the pipeline has
                  been saved within the editor.
                  <br />
                  <br />
                  Proceed with migration?
                </p>
              ),
              buttons: [Dialog.cancelButton(), Dialog.okButton()]
            }).then(result => {
              if (result.button.accept) {
                // proceed with migration
                pipelineJson = PipelineService.convertPipeline(
                  pipelineJson,
                  this.widgetContext.path
                );
                this.setAndVerifyPipelineFlow(pipelineJson);
              } else {
                this.handleClosePipeline();
              }
            });
          }
        } else {
          await this.setAndVerifyPipelineFlow(pipelineJson);
        }
      }
    });
  }

  async setAndVerifyPipelineFlow(pipelineJson: any): Promise<void> {
    this.canvasController.setPipelineFlow(pipelineJson);
    const errorMessage = await this.validatePipeline();

    if (errorMessage) {
      this.setState({
        emptyPipeline: Utils.isEmptyPipeline(pipelineJson),
        showValidationError: true,
        validationError: {
          errorMessage: errorMessage,
          errorSeverity: 'error'
        }
      });
    } else {
      this.setState({
        emptyPipeline: Utils.isEmptyPipeline(pipelineJson),
        showValidationError: false
      });
    }
  }

  /**
   * Adds an error decoration if a node has any invalid properties.
   *
   * @param node - canvas node object to validate
   *
   * @returns true if the node is valid.
   */
  async validateNode(node: any, pipelineId: string): Promise<boolean> {
    let validNode = true;
    let indicatorXPos;
    let indicatorYPos;

    // Check if node is valid
    if (node.type == 'super_node') {
      for (const childNode of this.canvasController.getNodes(
        node.subflow_ref.pipeline_id_ref
      )) {
        validNode =
          (await this.validateNode(
            childNode,
            node.subflow_ref.pipeline_id_ref
          )) && validNode;
      }
      if (validNode) {
        node.app_data.invalidNodeError = null;
      } else {
        if (!node.app_data) {
          node.app_data = {};
        }
        node.app_data.invalidNodeError = 'Supernode contains invalid nodes.';
      }
      indicatorXPos = 15;
      indicatorYPos = 0;
    } else if (node.type == 'execution_node') {
      node.app_data.invalidNodeError = await this.validateProperties(node);
      indicatorXPos = 20;
      indicatorYPos = 3;
    } else {
      return true;
    }

    // Add or remove decorations
    if (node.app_data != null && node.app_data.invalidNodeError != null) {
      this.canvasController.setNodeDecorations(
        node.id,
        [
          {
            id: 'error',
            image: IconUtil.encode(errorIcon),
            outline: false,
            position: 'topLeft',
            x_pos: indicatorXPos,
            y_pos: indicatorYPos
          }
        ],
        pipelineId
      );
      const stylePipelineObj: any = {};
      stylePipelineObj[pipelineId] = [node.id];
      const styleSpec = {
        body: { default: 'stroke: var(--jp-error-color1);' },
        selection_outline: { default: 'stroke: var(--jp-error-color1);' },
        label: { default: 'fill: var(--jp-error-color1);' }
      };
      this.canvasController.setObjectsStyle(stylePipelineObj, styleSpec, true);
      return false;
    } else {
      // Remove any existing decorations if valid
      const stylePipelineObj: any = {};
      stylePipelineObj[pipelineId] = [node.id];
      const styleSpec = {
        body: { default: '' },
        selection_outline: { default: '' },
        label: { default: '' }
      };
      this.canvasController.setObjectsStyle(stylePipelineObj, styleSpec, true);
      this.canvasController.setNodeDecorations(node.id, [], pipelineId);
      return true;
    }
  }

  /**
   * Validates the properties of a given node.
   *
   * @param node: node to check properties for
   *
   * @returns a warning message to display in the tooltip
   * if there are invalid properties. If there are none,
   * returns null.
   */
  async validateProperties(node: any): Promise<string> {
    const validationErrors: string[] = [];
    const notebookValidationErr = await this.serviceManager.contents
      .get(
        PipelineService.getWorkspaceRelativeNodePath(
          this.widgetContext.path,
          node.app_data.filename
        )
      )
      .then((result: any): any => {
        return null;
      })
      .catch((err: any): any => {
        return 'notebook does not exist';
      });
    if (notebookValidationErr) {
      validationErrors.push(notebookValidationErr);
    }
    if (
      node.app_data.runtime_image == null ||
      node.app_data.runtime_image == ''
    ) {
      validationErrors.push('no runtime image');
    }
    return validationErrors.length == 0 ? null : validationErrors.join('\n');
  }

  /**
   * Validates the properties of all nodes in the pipeline.
   * Updates the decorations / style of all nodes.
   *
   * @returns null if all nodes are valid, error message if
   * invalid.
   */
  async validateAllNodes(): Promise<string> {
    let errorMessage = null;
    // Reset any existing flagged nodes' style
    const pipelineId = this.canvasController.getPrimaryPipelineId();
    for (const node of this.canvasController.getNodes(pipelineId)) {
      const validNode = await this.validateNode(node, pipelineId);
      if (!validNode) {
        errorMessage = 'Some nodes have missing or invalid properties. ';
      }
    }
    return errorMessage;
  }

  /**
   * Validates all links in the pipeline.
   * Updates the decorations / style of links.
   *
   * @returns null if pipeline is valid, error message if not.
   */
  validateAllLinks(): string {
    let validPipeline = null;
    const links = this.canvasController.getLinks();
    for (const link of links) {
      if (this.nodesConnected(link.trgNodeId, link.srcNodeId, links)) {
        validPipeline = 'Circular references in pipeline. ';
        const pipelineId = this.canvasController.getPrimaryPipelineId();
        const stylePipelineObj: any = {};
        stylePipelineObj[pipelineId] = [link.id];
        const styleSpec = {
          line: {
            default: 'stroke-dasharray: 13; stroke: var(--jp-error-color1);'
          }
        };
        this.canvasController.setLinksStyle(stylePipelineObj, styleSpec, true);
      } else {
        // If valid, remove any extra styling
        const pipelineId = this.canvasController.getPrimaryPipelineId();
        const stylePipelineObj: any = {};
        stylePipelineObj[pipelineId] = [link.id];
        const styleSpec = {
          line: { default: '' }
        };
        this.canvasController.setLinksStyle(stylePipelineObj, styleSpec, true);
      }
    }
    return validPipeline;
  }

  /**
   * Validates all links and nodes in the pipeline.
   * Updates the decorations / style of links and nodes.
   *
   * @returns null if pipeline is valid, error message if not.
   */
  async validatePipeline(): Promise<string> {
    const nodeErrorMessage = await this.validateAllNodes();
    const linkErrorMessage = this.validateAllLinks();
    if (nodeErrorMessage || linkErrorMessage) {
      return (
        'Invalid pipeline: ' +
        (nodeErrorMessage == null ? '' : nodeErrorMessage) +
        (linkErrorMessage == null ? '' : linkErrorMessage)
      );
    } else {
      return null;
    }
  }

  async handleRunPipeline(): Promise<void> {
    // Check that all nodes are valid
    const errorMessage = await this.validatePipeline();
    if (errorMessage) {
      this.setState({
        showValidationError: true,
        validationError: {
          errorMessage: errorMessage,
          errorSeverity: 'error'
        }
      });
      return;
    }

    const pipelineName = path.basename(
      this.widgetContext.path,
      path.extname(this.widgetContext.path)
    );

    const runtimes = await PipelineService.getRuntimes(false);
    const local_runtime: any = {
      name: 'local',
      display_name: 'Run in-place locally'
    };
    runtimes.unshift(JSON.parse(JSON.stringify(local_runtime)));

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title: 'Run pipeline',
      body: formDialogWidget(
        <PipelineSubmissionDialog name={pipelineName} runtimes={runtimes} />
      ),
      buttons: [Dialog.cancelButton(), Dialog.okButton()],
      defaultButton: 1,
      focusNodeSelector: '#pipeline_name'
    };
    const dialogResult = await showFormDialog(dialogOptions);

    if (dialogResult.value == null) {
      // When Cancel is clicked on the dialog, just return
      return;
    }

    // prepare pipeline submission details
    const pipelineFlow = this.canvasController.getPipelineFlow();

    const runtime_config = dialogResult.value.runtime_config;
    const runtime =
      PipelineService.getRuntimeName(runtime_config, runtimes) || 'local';

    PipelineService.setNodePathsRelativeToWorkspace(
      pipelineFlow.pipelines[0],
      this.widgetContext.path
    );

    pipelineFlow.pipelines[0]['app_data']['name'] =
      dialogResult.value.pipeline_name;
    pipelineFlow.pipelines[0]['app_data']['runtime'] = runtime;
    pipelineFlow.pipelines[0]['app_data']['runtime-config'] = runtime_config;

    PipelineService.submitPipeline(
      pipelineFlow,
      PipelineService.getDisplayName(
        dialogResult.value.runtime_config,
        runtimes
      )
    );
  }

  handleSavePipeline(): void {
    this.updateModel();
    this.widgetContext.save();
  }

  handleClearPipeline(data: any): Promise<any> {
    return showDialog({
      title: 'Clear Pipeline',
      body: 'Are you sure you want to clear the pipeline?',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        // select all canvas elements
        this.canvasController.selectAll();

        // trigger delete of all selected canvas elements
        this.canvasController.editActionHandler({
          editType: 'deleteSelectedObjects',
          editSource: data.editSource,
          pipelineId: data.pipelineId
        });
      }
    });
  }

  handleOpenRuntimes(): void {
    this.shell.activateById(
      `elyra-metadata:${RUNTIMES_NAMESPACE}:${KFP_SCHEMA}`
    );
  }

  handleClosePipeline(): void {
    if (this.shell.currentWidget) {
      this.shell.currentWidget.close();
    }
  }

  componentDidMount(): void {
    const node = this.node.current!;
    node.addEventListener('dragenter', this.handleEvent);
    node.addEventListener('dragover', this.handleEvent);
    node.addEventListener('lm-dragenter', this.handleEvent);
    node.addEventListener('lm-dragover', this.handleEvent);
    node.addEventListener('lm-drop', this.handleEvent);

    this.initPropertiesInfo().finally(() => {
      this.handleOpenPipeline();
    });
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
        this.handleAddFileToPipelineCanvas(
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
  shell: JupyterFrontEnd.IShell;
  commands: CommandRegistry;
  browserFactory: IFileBrowserFactory;
  serviceManager: ServiceManager;
  addFileToPipelineSignal: Signal<this, any>;

  constructor(options: any) {
    super(options);
    this.shell = options.shell;
    this.commands = options.commands;
    this.browserFactory = options.browserFactory;
    this.serviceManager = options.serviceManager;
    this.addFileToPipelineSignal = new Signal<this, any>(this);
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    // Creates a blank widget with a DocumentWidget wrapper
    const props = {
      shell: this.shell,
      commands: this.commands,
      browserFactory: this.browserFactory,
      context: context,
      addFileToPipelineSignal: this.addFileToPipelineSignal,
      serviceManager: this.serviceManager
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
