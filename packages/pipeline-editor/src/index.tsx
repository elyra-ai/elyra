import {JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer} from '@jupyterlab/application';
import {IFileBrowserFactory} from '@jupyterlab/filebrowser';
import {ServerConnection} from '@jupyterlab/services';
import {URLExt} from '@jupyterlab/coreutils';
import {ICommandPalette, showDialog, Dialog, ReactWidget, WidgetTracker} from '@jupyterlab/apputils';
import {Widget, PanelLayout} from '@phosphor/widgets';
import {toArray} from '@phosphor/algorithm';
import {DocumentRegistry, ABCWidgetFactory, DocumentWidget} from '@jupyterlab/docregistry';
import {ILauncher} from '@jupyterlab/launcher';
import {CommonCanvas, CanvasController} from '@wdp/common-canvas';
import 'carbon-components/css/carbon-components.min.css';
import '@wdp/common-canvas/dist/common-canvas.min.css';
import * as palette from './palette.json' ;
import '../style/index.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const PIPELINE_ICON_CLASS = 'ewai-PipelineIcon';
const PIPELINE_CLASS = 'ewai-PipelineEditor';
const PIPELINE_FACTORY = 'pipelineEditorFactory';
const PIPELINE = 'pipeline';
const PIPELINE_EDITOR_NAMESPACE = 'pipeline-editor-extension';

const commandIDs = {
  openPipelineEditor : 'pipeline-editor:open',
  openDocManager : 'docmanager:open',
  newDocManager : 'docmanager:new-untitled'
};

/*
 * Class for dialog that pops up for pipeline submission
 */
class PipelineDialog extends Widget implements Dialog.IBodyWidget<any> {

  constructor(props: any) {
    super(props);

    let layout = (this.layout = new PanelLayout());
    let htmlContent = document.createElement('div');
    ReactDOM.render(
    	(<input
      	type='text'
      	id='pipeline_name'
      	name='pipeline_name'
      	placeholder='Pipeline Name'/>), htmlContent);

    layout.addWidget(new Widget( {node: htmlContent} ));
  }
  getValue() {
  	return {'pipeline_name': (document.getElementById('pipeline_name') as HTMLInputElement).value };
  }
 }

/*
 * Class for Common Canvas React Component
 */
class Canvas extends ReactWidget {
  jupyterFrontEnd: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;
  canvasController: any;
  context: DocumentRegistry.Context;
  position: number = 10;

  constructor(props: any) {
    super(props);
    this.jupyterFrontEnd = props.app;
    this.browserFactory = props.browserFactory;
    this.canvasController = new CanvasController();
    this.canvasController.setPipelineFlowPalette(palette);
    this.toolbarMenuActionHandler = this.toolbarMenuActionHandler.bind(this);
    this.contextMenuHandler = this.contextMenuHandler.bind(this);
    this.contextMenuActionHandler = this.contextMenuActionHandler.bind(this);
    this.editActionHandler = this.editActionHandler.bind(this);
    this.context = props.context;
    this.context.ready.then( () => {
      this.canvasController.setPipelineFlow(this.context.model.toJSON());
    });
  }

  render() {
    const style = { height: '100%' };
    const canvasConfig = { 
      enableInternalObjectModel: true,
      enablePaletteLayout: 'Modal',
      paletteInitialState: false
    };
    const toolbarConfig = [
       { action: 'add', label: 'Add Notebook to Pipeline', enable: true, iconEnabled: '/'},
       { divider: true },
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
       { action: 'arrangeHorizontally', label: 'Arrange Horizontally', enable: true },
       { action: 'arrangeVertically', label: 'Arrange Vertically', enable: true } ];
    return (
      <div style={style}>
        <CommonCanvas
        canvasController={this.canvasController}
        toolbarMenuActionHandler={this.toolbarMenuActionHandler}
        contextMenuHandler={this.contextMenuHandler}
        contextMenuActionHandler={this.contextMenuActionHandler}
        editActionHandler={this.editActionHandler}
        toolbarConfig={toolbarConfig}
        config={canvasConfig}
        />
      </div>
      );
  }

  contextMenuHandler(source: any, defaultMenu: any) {
    let customMenu = defaultMenu;
    if (source.type === 'node') {
      if (source.selectedObjectIds.length > 1) {
        customMenu = customMenu.concat({ action: 'openNotebook', label: 'Open Notebooks'});
      } else {
        customMenu = customMenu.concat({ action: 'openNotebook', label: 'Open Notebook'});
      }
    }
    return customMenu;
  }

  contextMenuActionHandler( action: any, source: any ) {
    if (action === 'openNotebook' && source.type === 'node') {
      let nodes = source.selectedObjectIds;
      for (let i = 0; i < nodes.length; i++) {
        let path = this.canvasController.getNode(nodes[i]).app_data.notebook;
        this.jupyterFrontEnd.commands.execute(commandIDs.openDocManager, {path});
      }
    }
  }

  /*
   * Handles creating new nodes in the canvas
   */
  editActionHandler(data: any) {
    this.context.model.fromJSON(this.canvasController.getPipelineFlow());
  }

  handleAdd() {
    toArray(this.browserFactory.defaultBrowser.selectedItems()).map(
      item => {
        // if the selected item is a file
        if (item.type != 'directory') {
          //add each selected notebook
          console.log('Adding ==> ' + item.path );

          this.position += 20;
          const nodeTemplate = this.canvasController.getPaletteNode('execute-notebook-node');
          if (nodeTemplate) {
            const data = {
              'editType': 'createNode',
              'offsetX': 75 + this.position,
              'offsetY': 85 + this.position,
              'nodeTemplate': this.canvasController.convertNodeTemplate(nodeTemplate)
            }

            data.nodeTemplate.label = item.path.replace(/^.*[\\\/]/, '');
            data.nodeTemplate.label = data.nodeTemplate.label.replace(/\.[^/.]+$/, '');
            data.nodeTemplate.app_data.notebook = item.path;
            data.nodeTemplate.app_data.docker_image = 'tensorflow/tensorflow:1.13.2-py3-jupyter';
            this.canvasController.editActionHandler(data);
          }
        }
      }
    )
  }

  handleRun() {
    // request name to publish pipeline
    showDialog({
      body: new PipelineDialog({})
    }).then( result => {
      console.log(result);
      if( result.value == null) {
        // When Cancel is clicked on the dialog, just return
        return;
      }

      // prepare notebook submission details
      console.log(this.canvasController.getPipelineFlow());
      let notebookTask = {'pipeline_data': this.canvasController.getPipelineFlow().pipelines[0],
                          'pipeline_name': result.value.pipeline_name};
      let requestBody = JSON.stringify(notebookTask);

      // use ServerConnection utility to make calls to Jupyter Based services
      // which in this case is the scheduler extension installed by this package
      let settings = ServerConnection.makeSettings();
      let url = URLExt.join(settings.baseUrl, 'scheduler');

      console.log('Submitting pipeline to -> ' + url);
      ServerConnection.makeRequest(url, { method: 'POST', body: requestBody }, settings)
      .then(response => {
        if (response.status === 404) {
            showDialog({
              title: "Error submitting pipeline !",
              body: "Service endpoint '"+ url +"'not found",
              buttons: [Dialog.okButton()]
            });
        } else if (response.status !== 200) {
          return response.json().then(data => {
            showDialog({
              title: 'Error submitting Notebook !',
              body: data.message,
              buttons: [Dialog.okButton()]
            })
          });
        }
        return response.json();
      })
      .then(data => {
        if( data ) {
          let dialogTitle: string = 'Job submission to ' + result.value;
          let dialogBody: string = '';
          if (data['status'] == 'ok') {
            dialogTitle =  dialogTitle + ' succeeded !';
            dialogBody = 'Check details on submitted jobs at : <br> <a href=' + data['url'].replace('/&', '&') + ' target="_blank">Console & Job Status</a>';
          } else {
            dialogTitle =  dialogTitle + ' failed !';
            dialogBody = data['message'];
          }
          showDialog({
            title: dialogTitle,
            body: dialogBody,
            buttons: [Dialog.okButton()]
          })
        }
      });
    });
  }

  handleSave() {
    this.context.model.fromJSON(this.canvasController.getPipelineFlow());
    this.context.save();
  }

  handleOpen() {
    toArray(this.browserFactory.defaultBrowser.selectedItems()).map(
      item => {
        // if the selected item is a file
        if (item.type != 'directory') {
          console.log('Opening ==> ' + item.path );
          this.jupyterFrontEnd.commands.execute(commandIDs.openDocManager, { path: item.path });
        }
      }
    )
  }

  handleNew() {
    // Clears the canvas, then creates a new file and sets the pipeline_name field to the new name. 
    this.jupyterFrontEnd.commands.execute(commandIDs.openPipelineEditor);
  }

  handleClear() {
    this.canvasController.clearPipelineFlow();
    this.context.model.fromJSON(this.canvasController.getPipelineFlow());
  }

  /*
   * Handles submitting pipeline runs
   */
  toolbarMenuActionHandler(action: any, source: any) {
  	console.log('Handling action: ' + action);
  	if(action == 'add') { // When adding a new node to the pipeline
  	  this.handleAdd();
    } else if (action == 'run') { // When executing the pipeline
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
}

class PipelineEditorFactory extends ABCWidgetFactory<DocumentWidget> {
  app: JupyterFrontEnd;
  browserFactory: IFileBrowserFactory;

  constructor(options: any) {
    super(options);
    this.app = options.app;
    this.browserFactory = options.browserFactory;
  }

  protected createNewWidget(
    context: DocumentRegistry.Context
  ): DocumentWidget {
    // Creates a blank widget with a DocumentWidget wrapper
    let props = {
      app: this.app,
      browserFactory: this.browserFactory,
      context: context
    }
    const content = new Canvas(props);
    const widget = new DocumentWidget({ content, context, node: document.createElement('div') });
    widget.addClass(PIPELINE_CLASS);
    return widget;
  }
}

/**
 * Initialization data for the pipeline-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: PIPELINE,
  autoStart: true,
  requires: [ICommandPalette, ILauncher, IFileBrowserFactory, ILayoutRestorer],

  activate: (app: JupyterFrontEnd,
             palette: ICommandPalette,
             launcher: ILauncher,
             browserFactory: IFileBrowserFactory,
             restorer: ILayoutRestorer) => {
    // Set up new widget Factory for .pipeline files
    const pipelineEditorFactory = new PipelineEditorFactory({
      name: PIPELINE_FACTORY,
      fileTypes: [PIPELINE],
      defaultFor: [PIPELINE],
      app: app,
      browserFactory: browserFactory
    });

    // Add the default behavior of opening the widget for .pipeline files
    app.docRegistry.addFileType({ name: PIPELINE, extensions: ['.pipeline']});
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
    void restorer.restore(tracker, 
    {
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
      label: 'Pipeline Editor',
      iconClass: PIPELINE_ICON_CLASS,
      execute: () => {
        // Creates blank file, then opens it in a new window
        app.commands.execute(commandIDs.newDocManager, {
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
    palette.addItem({command: openPipelineEditorCommand, category: 'Extensions'});
    if (launcher) {
      launcher.add({
        command: openPipelineEditorCommand,
        category: 'Other',
        rank: 3
      });
    }
  }
 };
 export default extension;
