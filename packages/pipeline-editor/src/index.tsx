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
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import {
  ICommandPalette,
  showDialog,
  Dialog,
  ReactWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IconRegistry, IIconRegistry } from '@jupyterlab/ui-components';

import { toArray } from '@phosphor/algorithm';
import { IDragEvent } from '@phosphor/dragdrop';
import { Widget, PanelLayout } from '@phosphor/widgets';

import {
  CommonCanvas,
  CanvasController,
  CommonProperties
} from '@elyra/canvas';
import '@elyra/canvas/dist/common-canvas.min.css';
import { NotebookParser, SubmissionHandler } from '@elyra/application';
import 'carbon-components/css/carbon-components.min.css';
import '../style/index.css';

import * as palette from './palette.json';
import * as properties from './properties.json';
import * as i18nData from './en.json';
import * as React from 'react';

import { IntlProvider } from 'react-intl';

const PIPELINE_ICON_CLASS = 'jp-MaterialIcon elyra-PipelineIcon';
const PIPELINE_CLASS = 'elyra-PipelineEditor';
const PIPELINE_FACTORY = 'Pipeline Editor';
const PIPELINE = 'pipeline';
const PIPELINE_EDITOR_NAMESPACE = 'elyra-pipeline-editor-extension';

const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled'
};

/**
 * Class for dialog that pops up for pipeline submission
 */
class PipelineDialog extends Widget implements Dialog.IBodyWidget<any> {
  constructor(props: any) {
    super(props);

    const layout = (this.layout = new PanelLayout());
    const htmlContent = this.getHtml(props);
    // Set default runtime to kfp, since list is dynamically generated
    (htmlContent.getElementsByClassName(
      'elyra-form-runtime-config'
    )[0] as HTMLSelectElement).value = 'kfp';

    layout.addWidget(new Widget({ node: htmlContent }));
  }

  getValue() {
    return {
      pipeline_name: (document.getElementById(
        'pipeline_name'
      ) as HTMLInputElement).value,
      runtime_config: (document.getElementById(
        'runtime_config'
      ) as HTMLInputElement).value
    };
  }

  getHtml(props: any) {
    const htmlContent = document.createElement('div');
    const br = '<br/>';
    let runtime_options = '';
    const runtimes = props['runtimes'];

    for (const key in runtimes) {
      runtime_options =
        runtime_options +
        `<option value="${runtimes[key]['name']}">${runtimes[key]['display_name']}</option>`;
    }

    const content =
      '' +
      '<label for="pipeline_name">Pipeline Name:</label>' +
      br +
      '<input type="text" id="pipeline_name" name="pipeline_name" placeholder="Pipeline Name"/>' +
      br +
      br +
      '<label for="runtime_config">Runtime Config:</label>' +
      br +
      '<select id="runtime_config" name="runtime_config" class="elyra-form-runtime-config">' +
      runtime_options +
      '</select>';

    htmlContent.innerHTML = content;

    return htmlContent;
  }
}

/**
 * Class for Common Canvas React Component
 */
class Canvas extends ReactWidget {
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;
  context: DocumentRegistry.Context;
  iconRegistry: IconRegistry;

  constructor(props: any) {
    super(props);
    this.app = props.app;
    this.browserFactory = props.browserFactory;
    this.context = props.context;
    this.iconRegistry = props.iconRegistry;
  }

  render() {
    return (
      <Pipeline
        app={this.app}
        browserFactory={this.browserFactory}
        iconRegistry={this.iconRegistry}
        widgetContext={this.context}
      />
    );
  }
}

/**
 * A namespace for Pipeline.
 */
namespace Pipeline {
  /**
   * The props for Pipeline.
   */
  export interface Props {
    app: JupyterFrontEnd;
    browserFactory: IFileBrowserFactory;
    iconRegistry: IIconRegistry;
    widgetContext: DocumentRegistry.Context;
  }

  /**
   * The props for Pipeline.
   */
  export interface State {
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

class Pipeline extends React.Component<Pipeline.Props, Pipeline.State> {
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;
  iconRegistry: IconRegistry;
  canvasController: any;
  widgetContext: DocumentRegistry.Context;
  position = 10;
  node: React.RefObject<HTMLDivElement>;

  constructor(props: any) {
    super(props);
    this.app = props.app;
    this.browserFactory = props.browserFactory;
    this.iconRegistry = props.iconRegistry;
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

  render() {
    const style = { height: '100%' };
    const emptyCanvasContent = (
      <div>
        <div className="dragdrop" />
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
      { action: 'save', label: 'Save Pipeline', enable: true },
      { divider: true },
      // { action: 'open', label: 'Open Pipeline', enable: true },
      // { divider: true },
      { action: 'new', label: 'New Pipeline', enable: true },
      { divider: true },
      { action: 'clear', label: 'Clear Pipeline', enable: true },
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

  propertiesInfo = { parameterDef: properties, appData: { id: '' } };

  openPropertiesDialog(source: any) {
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

  applyPropertyChanges(propertySet: any, appData: any) {
    console.log('Applying changes to properties');
    const app_data = this.canvasController.getNode(appData.id).app_data;

    app_data.image = propertySet.image;
    app_data.outputs = propertySet.outputs;
    app_data.vars = propertySet.vars;
    app_data.dependencies = propertySet.dependencies;
    app_data.recursive_dependencies = propertySet.recursive_dependencies;
  }

  closePropertiesDialog() {
    console.log('Closing properties dialog');
    this.setState({ showPropertiesDialog: false, propertiesInfo: {} });
  }

  contextMenuHandler(source: any, defaultMenu: any) {
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

  contextMenuActionHandler(action: any, source: any) {
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
  editActionHandler(data: any) {
    this.widgetContext.model.fromJSON(this.canvasController.getPipelineFlow());
  }

  handleAdd(x?: number, y?: number) {
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

          data.nodeTemplate.label = item.path.replace(/^.*[\\\/]/, '');
          data.nodeTemplate.label = data.nodeTemplate.label.replace(
            /\.[^/.]+$/,
            ''
          );
          data.nodeTemplate.image =
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(this.iconRegistry.svg('notebook'));
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

  handleRun() {
    SubmissionHandler.makeGetRequest(
      'api/metadata/runtimes',
      'pipeline',
      (response: any) =>
        showDialog({
          title: 'Run pipeline',
          body: new PipelineDialog({ runtimes: response.runtimes }),
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
        })
    );
  }

  handleSave() {
    this.widgetContext.model.fromJSON(this.canvasController.getPipelineFlow());
    this.widgetContext.save();
  }

  handleOpen() {
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

  handleNew() {
    // Clears the canvas, then creates a new file and sets the pipeline_name field to the new name.
    this.app.commands.execute(commandIDs.openPipelineEditor);
  }

  handleClear() {
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
  toolbarMenuActionHandler(action: any, source: any) {
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
    node.addEventListener('p-dragover', this.handleEvent);
    node.addEventListener('p-drop', this.handleEvent);
  }

  componentWillUnmount(): void {
    const node = this.node.current!;
    node.removeEventListener('p-drop', this.handleEvent);
    node.removeEventListener('p-dragover', this.handleEvent);
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
      case 'p-dragover':
        event.preventDefault();
        event.stopPropagation();
        (event as IDragEvent).dropAction = (event as IDragEvent).proposedAction;
        break;
      case 'p-drop':
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

class PipelineEditorFactory extends ABCWidgetFactory<DocumentWidget> {
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;
  iconRegistry: IconRegistry;

  constructor(options: any) {
    super(options);
    this.app = options.app;
    this.browserFactory = options.browserFactory;
    this.iconRegistry = options.iconRegistry;
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    // Creates a blank widget with a DocumentWidget wrapper
    const props = {
      app: this.app,
      browserFactory: this.browserFactory,
      iconRegistry: this.iconRegistry,
      context: context
    };
    const content = new Canvas(props);
    const widget = new DocumentWidget({
      content,
      context,
      node: document.createElement('div')
    });
    widget.addClass(PIPELINE_CLASS);
    widget.title.iconClass = PIPELINE_ICON_CLASS;
    return widget;
  }
}

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
    IMainMenu,
    IIconRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    launcher: ILauncher,
    browserFactory: IFileBrowserFactory,
    restorer: ILayoutRestorer,
    menu: IMainMenu,
    iconRegistry: IIconRegistry
  ) => {
    console.log('Elyra - pipeline-editor extension is activated!');

    // Set up new widget Factory for .pipeline files
    const pipelineEditorFactory = new PipelineEditorFactory({
      name: PIPELINE_FACTORY,
      fileTypes: [PIPELINE],
      defaultFor: [PIPELINE],
      app: app,
      browserFactory: browserFactory,
      iconRegistry: iconRegistry
    });

    // Add the default behavior of opening the widget for .pipeline files
    app.docRegistry.addFileType({
      name: PIPELINE,
      extensions: ['.pipeline'],
      iconClass: PIPELINE_ICON_CLASS
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
      iconClass: args => (args['isPalette'] ? '' : PIPELINE_ICON_CLASS),
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
  }
};
export default extension;
