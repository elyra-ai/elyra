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

import { IDictionary, NotebookParser } from '@elyra/application';
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
import { notebookIcon } from '@jupyterlab/ui-components';

import { toArray } from '@lumino/algorithm';
import { IDragEvent } from '@lumino/dragdrop';
import { Collapse, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@material-ui/lab/Alert';
import { Color } from '@material-ui/lab/Alert';

import '@elyra/canvas/dist/common-canvas.min.css';
import 'carbon-components/css/carbon-components.min.css';
import '../style/canvas.css';

import * as React from 'react';

import { IntlProvider } from 'react-intl';

import { PIPELINE_CURRENT_VERSION } from './constants';
import * as i18nData from './en.json';
import * as palette from './palette.json';
import { PipelineExportDialog } from './PipelineExportDialog';
import { PipelineService } from './PipelineService';
import { PipelineSubmissionDialog } from './PipelineSubmissionDialog';
import * as properties from './properties.json';
import Utils from './utils';

const PIPELINE_CLASS = 'elyra-PipelineEditor';
const NODE_TOOLTIP_CLASS = 'elyra-PipelineNodeTooltip';

const TIP_TYPE_NODE = 'tipTypeNode';

const SAVE_ICON_ID = 'toolbar-icon-save';
const EXPORT_ICON_ID = 'toolbar-icon-export';
const CLEAR_ICON_ID = 'toolbar-icon-clear';

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
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  submitNotebook: 'notebook:submit'
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

  themeChanged(isLight: boolean): void {
    [SAVE_ICON_ID, EXPORT_ICON_ID, CLEAR_ICON_ID].forEach((id: string) => {
      const element = document.getElementById(id) as HTMLImageElement;
      if (element) {
        switch (element.id) {
          case SAVE_ICON_ID:
            element.src = Utils.getEncodedIcon(savePipelineIcon, !isLight);
            break;
          case EXPORT_ICON_ID:
            element.src = Utils.getEncodedIcon(exportPipelineIcon, !isLight);
            break;
          case CLEAR_ICON_ID:
            element.src = Utils.getEncodedIcon(clearPipelineIcon, !isLight);
            break;
        }
      }
    });
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
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;
  canvasController: any;
  widgetContext: DocumentRegistry.Context;
  position = 10;
  node: React.RefObject<HTMLDivElement>;
  propertiesInfo: any;

  constructor(props: any) {
    super(props);
    this.app = props.app;
    this.browserFactory = props.browserFactory;
    this.canvasController = new CanvasController();
    this.canvasController.setPipelineFlowPalette(palette);
    this.widgetContext = props.widgetContext;

    this.toolbarMenuActionHandler = this.toolbarMenuActionHandler.bind(this);
    this.contextMenuHandler = this.contextMenuHandler.bind(this);
    this.contextMenuActionHandler = this.contextMenuActionHandler.bind(this);
    this.clickActionHandler = this.clickActionHandler.bind(this);
    this.editActionHandler = this.editActionHandler.bind(this);
    this.tipHandler = this.tipHandler.bind(this);

    this.invalidLink = this.invalidLink.bind(this);
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

    this.initPropertiesInfo();

    this.applyPropertyChanges = this.applyPropertyChanges.bind(this);
    this.closePropertiesDialog = this.closePropertiesDialog.bind(this);
    this.openPropertiesDialog = this.openPropertiesDialog.bind(this);

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
    const darkmode = !!document.querySelector("[data-jp-theme-light='false']");
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
        iconEnabled: Utils.getEncodedIcon(savePipelineIcon, darkmode),
        iconDisabled: Utils.getEncodedIcon(savePipelineIcon, darkmode)
      },
      {
        action: 'export',
        label: 'Export Pipeline',
        enable: !this.state.emptyPipeline,
        iconEnabled: Utils.getEncodedIcon(exportPipelineIcon, darkmode),
        iconDisabled: Utils.getEncodedIcon(exportPipelineIcon, darkmode)
      },
      {
        action: 'clear',
        label: 'Clear Pipeline',
        enable: !this.state.emptyPipeline || !emptyCanvas,
        iconEnabled: Utils.getEncodedIcon(clearPipelineIcon, darkmode),
        iconDisabled: Utils.getEncodedIcon(clearPipelineIcon, darkmode)
      },
      { divider: true },
      { action: 'undo', label: 'Undo' },
      { action: 'redo', label: 'Redo' },
      { action: 'cut', label: 'Cut' },
      { action: 'copy', label: 'Copy' },
      { action: 'paste', label: 'Paste' },
      { action: 'addComment', label: 'Add Comment', enable: true },
      { action: 'delete', label: 'Delete' },
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
        {validationAlert}
        <CommonCanvas
          canvasController={this.canvasController}
          toolbarMenuActionHandler={this.toolbarMenuActionHandler}
          contextMenuHandler={this.contextMenuHandler}
          contextMenuActionHandler={this.contextMenuActionHandler}
          clickActionHandler={this.clickActionHandler}
          editActionHandler={this.editActionHandler}
          tipHandler={this.tipHandler}
          toolbarConfig={toolbarConfig}
          config={canvasConfig}
        />
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
    const app_data = this.canvasController.getNode(node_id).app_data;

    const node_props = this.propertiesInfo;
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
    const node = this.canvasController.getNode(appData.id);
    const app_data = node.app_data;

    app_data.runtime_image = propertySet.runtime_image;
    app_data.outputs = propertySet.outputs;
    app_data.env_vars = propertySet.env_vars;
    app_data.dependencies = propertySet.dependencies;
    app_data.include_subdirectories = propertySet.include_subdirectories;
    this.invalidPipeline();
    this.updateModel();
  }

  closePropertiesDialog(): void {
    console.log('Closing properties dialog');
    this.setState({ showPropertiesDialog: false, propertiesInfo: {} });
  }

  /*
   * Add options to the node context menu
   * Pipeline specific context menu items are:
   *  - Enable opening selected notebook(s)
   *  - Enable node properties for single node
   */
  contextMenuHandler(source: any, defaultMenu: any): any {
    let customMenu = defaultMenu;
    // Remove option to create super node
    customMenu.splice(4, 2);
    if (source.type === 'node') {
      if (source.selectedObjectIds.length > 1) {
        // multiple nodes selected
        customMenu = customMenu.concat({
          action: 'openNotebook',
          label: 'Open Notebooks'
        });
      } else {
        // single node selected
        customMenu = customMenu.concat(
          {
            action: 'openNotebook',
            label: 'Open Notebook'
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
   * Handles context menu actions
   * Pipeline specific actions are:
   *  - Open the associated Notebook
   *  - Open node properties dialog
   */
  contextMenuActionHandler(action: any, source: any): void {
    if (action === 'openNotebook' && source.type === 'node') {
      this.handleOpenNotebook(source.selectedObjectIds);
    } else if (action === 'properties' && source.type === 'node') {
      if (this.state.showPropertiesDialog) {
        this.closePropertiesDialog();
      } else {
        this.openPropertiesDialog(source);
      }
    }
  }

  /*
   * Handles mouse click actions
   */
  clickActionHandler(source: any): void {
    // opens the Jupyter Notebook associated with a given node
    if (source.clickType === 'DOUBLE_CLICK' && source.objectType === 'node') {
      this.handleOpenNotebook(source.selectedObjectIds);
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

  /**
   * Validates the new link before adding it.
   *
   * @param data: data struct given by the canvas controller handler
   *
   * @returns boolean indicating if given data is valid. (true if invalid)
   *
   * TODO: when we update canvas to 8, we can change the name of
   * this function to beforeEditActionHandler and use it as a handler
   * instead of calling this function in editActionHandler.
   */
  invalidLink(data: any): boolean {
    if (data.editType == 'linkNodes') {
      // Remove the link that was just added for the purposes of checking validity
      const links = this.canvasController
        .getLinks()
        .filter((value: any, index: number) => {
          return value.id != data.linkIds[0];
        });
      return this.nodesConnected(
        data.targetNodes[0].id,
        data.nodes[0].id,
        links
      );
    } else {
      return false;
    }
  }

  /*
   * Handles creating new nodes in the canvas
   */
  editActionHandler(data: any): void {
    // Checks validity of links before adding
    if (this.invalidLink(data)) {
      this.canvasController.deleteLink(
        this.canvasController.getLink(data.linkIds[0]),
        data.pipelineId
      );
      this.setState({
        validationError: {
          errorMessage: 'Invalid operation: circular references in pipeline.',
          errorSeverity: 'error'
        },
        showValidationError: true
      });
      // If you're performing a valid edit, dismiss the validation error
    } else {
      this.setState({
        showValidationError: false
      });
    }
    this.updateModel();
  }

  /*
   * Handles displaying node properties
   */
  tipHandler(tipType: string, data: any): any {
    if (tipType === TIP_TYPE_NODE) {
      const appData = this.canvasController.getNode(data.node.id).app_data;
      const propsInfo = this.propertiesInfo.parameterDef.uihints.parameter_info;
      const tooltipProps: any = {};

      if (appData.invalidNodeError != null) {
        tooltipProps['Error'] = appData.invalidNodeError;
      }

      propsInfo.forEach(
        (info: { parameter_ref: string; label: { default: string } }) => {
          tooltipProps[info.label.default] = appData[info.parameter_ref] || '';
        }
      );

      return <NodeProperties {...tooltipProps} />;
    }
  }

  handleAddFileToPipelineCanvas(x?: number, y?: number): Promise<any> {
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
      // if the selected item is a notebook file
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

          const env_vars = NotebookParser.getEnvVars(notebookStr).map(
            str => str + '='
          );

          data.nodeTemplate.label = item.path.replace(/^.*[\\/]/, '');
          data.nodeTemplate.label = data.nodeTemplate.label.replace(
            /\.[^/.]+$/,
            ''
          );
          data.nodeTemplate.image = IconUtil.encode(notebookIcon);
          data.nodeTemplate.app_data['filename'] = item.path;
          data.nodeTemplate.app_data[
            'runtime_image'
          ] = this.propertiesInfo.parameterDef.current_parameters.runtime_image;
          data.nodeTemplate.app_data['env_vars'] = env_vars;
          data.nodeTemplate.app_data[
            'include_subdirectories'
          ] = this.propertiesInfo.parameterDef.current_parameters.include_subdirectories;

          this.canvasController.editActionHandler(data);
          this.setState({ showValidationError: false });

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

  /*
   * Open node associated notebook
   */
  handleOpenNotebook(selectedNodes: any): void {
    for (let i = 0; i < selectedNodes.length; i++) {
      const path = this.canvasController.getNode(selectedNodes[i]).app_data
        .filename;
      this.app.commands.execute(commandIDs.openDocManager, { path });
    }
  }

  async handleExportPipeline(): Promise<void> {
    const runtimes = await PipelineService.getRuntimes();
    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title: 'Export pipeline',
      body: new PipelineExportDialog({ runtimes }),
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

    pipelineFlow.pipelines[0]['app_data']['name'] = pipeline_name;
    pipelineFlow.pipelines[0]['app_data']['runtime'] = 'kfp';
    pipelineFlow.pipelines[0]['app_data']['runtime-config'] =
      dialogResult.value.runtime_config;

    PipelineService.exportPipeline(
      pipelineFlow,
      pipeline_export_format,
      pipeline_export_path,
      overwrite
    );
  }

  async handleOpenPipeline(): Promise<void> {
    this.widgetContext.ready.then(() => {
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
            });
            this.handleClosePipeline();
            return;
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
                pipelineJson = PipelineService.convertPipeline(pipelineJson);
                this.canvasController.setPipelineFlow(pipelineJson);
              } else {
                this.handleClosePipeline();
              }
            });
          }
        }
      }
      this.setState({ emptyPipeline: Utils.isEmptyPipeline(pipelineJson) });
      this.canvasController.setPipelineFlow(pipelineJson);
      this.invalidPipeline();
    });
  }

  // Adds an error decoration if a node has any invalid properties.
  // Returns true if the node is valid.
  updateDecorations(node: any): boolean {
    node.app_data.invalidNodeError = this.invalidProperties(node);
    if (node.app_data.invalidNodeError != null) {
      this.canvasController.setNodeDecorations(node.id, [
        {
          id: 'error',
          image: IconUtil.encode(errorIcon),
          outline: false,
          class_name: 'elyra-canvasErrorIcon',
          position: 'topLeft',
          x_pos: 20,
          y_pos: 3
        }
      ]);
      const pipelineId = this.canvasController.getPrimaryPipelineId();
      const stylePipelineObj: any = {};
      stylePipelineObj[pipelineId] = [node.id];
      const styleSpec = {
        body: { default: 'stroke: #d32f2f;' },
        label: { default: 'fill: #d32f2f;' }
      };
      this.canvasController.setObjectsStyle(stylePipelineObj, styleSpec, true);
      return false;
    } else {
      this.canvasController.setNodeDecorations(node.id, []);
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
  invalidProperties(node: any): string {
    if (
      node.app_data.runtime_image == null ||
      node.app_data.runtime_image == ''
    ) {
      return 'no runtime image.';
    } else {
      return null;
    }
  }

  /**
   * Validates the properties of all nodes in the pipeline.
   * Updates the decorations / style of all nodes.
   *
   * @returns true if the pipeline is invalid.
   */
  invalidPipeline(): boolean {
    let invalidPipeline = false;
    // Reset any existing flagged nodes' style
    this.canvasController.removeAllStyles(true);
    const pipelineId = this.canvasController.getPrimaryPipelineId();
    for (const node of this.canvasController.getNodes(pipelineId)) {
      if (!this.updateDecorations(node)) {
        invalidPipeline = true;
      }
    }
    return invalidPipeline;
  }

  async handleRunPipeline(): Promise<void> {
    // Check that all nodes are valid
    if (this.invalidPipeline()) {
      this.setState({
        showValidationError: true,
        validationError: {
          errorMessage:
            'Invalid pipeline: some nodes have incomplete properties.',
          errorSeverity: 'error'
        }
      });
      return;
    }

    const runtimes = await PipelineService.getRuntimes();
    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title: 'Run pipeline',
      body: new PipelineSubmissionDialog({ runtimes }),
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

    pipelineFlow.pipelines[0]['app_data']['name'] =
      dialogResult.value.pipeline_name;

    // TODO: Be more flexible and remove hardcoded runtime type
    pipelineFlow.pipelines[0]['app_data']['runtime'] = 'kfp';
    pipelineFlow.pipelines[0]['app_data']['runtime-config'] =
      dialogResult.value.runtime_config;

    PipelineService.submitPipeline(
      pipelineFlow,
      dialogResult.value.runtime_config
    );
  }

  handleSavePipeline(): void {
    this.updateModel();
    this.widgetContext.save();
  }

  handleClearPipeline(): Promise<any> {
    return showDialog({
      title: 'Clear Pipeline?',
      body: 'Are you sure you want to clear? You can not undo this.',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        this.canvasController.clearPipelineFlow();
        this.updateModel();
        this.position = 10;
      }
    });
  }

  handleClosePipeline(): void {
    if (this.app.shell.currentWidget) {
      this.app.shell.currentWidget.close();
    }
  }

  /**
   * Handles submitting pipeline runs
   */
  toolbarMenuActionHandler(action: any, source: any): void {
    console.log('Handling action: ' + action);
    if (action == 'run') {
      // When executing the pipeline
      this.handleRunPipeline();
    } else if (action == 'export') {
      this.handleExportPipeline();
    } else if (action == 'save') {
      this.handleSavePipeline();
    } else if (action == 'clear') {
      this.handleClearPipeline();
    } else if (['undo', 'redo', 'delete', 'addComment'].includes(action)) {
      this.updateModel();
    }
  }

  componentDidMount(): void {
    const node = this.node.current!;
    node.addEventListener('dragenter', this.handleEvent);
    node.addEventListener('dragover', this.handleEvent);
    node.addEventListener('lm-dragenter', this.handleEvent);
    node.addEventListener('lm-dragover', this.handleEvent);
    node.addEventListener('lm-drop', this.handleEvent);

    this.handleOpenPipeline();
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
