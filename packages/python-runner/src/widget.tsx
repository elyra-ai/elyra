/*
 * Copyright 2018-2019 IBM Corporation
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
import React from 'react';

import {FileEditor} from '@jupyterlab/fileeditor';
import {ABCWidgetFactory, DocumentRegistry, DocumentWidget} from '@jupyterlab/docregistry';
import {CodeEditor, IEditorServices} from '@jupyterlab/codeeditor';
import {ToolbarButton, ReactWidget, showDialog, Dialog} from '@jupyterlab/apputils';
import {HTMLSelect} from '@jupyterlab/ui-components';
import {Kernel} from '@jupyterlab/services';
import {OutputArea, OutputAreaModel, OutputPrompt} from '@jupyterlab/outputarea';
import {RenderMimeRegistry,standardRendererFactories as initialFactories} from '@jupyterlab/rendermime';
import {BoxLayout, PanelLayout, Widget, DockPanel, TabBar} from '@phosphor/widgets';

import {PythonRunner} from './PythonRunner';

/**
 * The CSS class added to widgets.
 */
const PYTHON_FILE_EDITOR_CLASS = 'elyra-PythonEditor';
const OUTPUT_AREA_CLASS = 'elyra-PythonEditor-OutputArea';
const OUTPUT_AREA_ERROR_CLASS = 'elyra-PythonEditor-OutputArea-error';
const OUTPUT_AREA_CHILD_CLASS = 'elyra-PythonEditor-OutputArea-child';
const OUTPUT_AREA_PROMPT_CLASS = 'elyra-PythonEditor-OutputArea-prompt';
// const COLLAPSE_ICON_CLASS = 'elyra-PythonEditor-CollapseIcon';
const RUN_ICON_CLASS = 'jp-RunIcon';
const STOP_ICON_CLASS = 'jp-StopIcon';
const DROPDOWN_CLASS = 'jp-Notebook-toolbarCellTypeDropdown';
const PYTHON_ICON_CLASS = 'jp-PythonIcon';
const SAVE_ICON_CLASS = 'jp-SaveIcon';

/**
 * A widget for python editors.
 */
export class PythonFileEditor extends DocumentWidget<FileEditor, DocumentRegistry.ICodeModel> {
  private runner: PythonRunner;
  private kernelSettings: Kernel.IOptions;
  private dockPanel: DockPanel;
  private outputAreaWidget: OutputArea;
  private model: any;

  /**
   * Construct a new editor widget.
   */
  constructor(options: DocumentWidget.IOptions<FileEditor, DocumentRegistry.ICodeModel>) {
    super(options);
    this.addClass(PYTHON_FILE_EDITOR_CLASS);
    this.model = this.content.model;
    this.runner = new PythonRunner(this.model);
    this.kernelSettings = {name: null};

    // Add python icon to main tab
    this.title.iconClass = PYTHON_ICON_CLASS;

    // Add toolbar widgets
    const saveButton = new ToolbarButton({
      iconClassName: SAVE_ICON_CLASS,
      onClick: this.saveFile,
      tooltip: 'Save file contents'
    });

    const dropDown = new CellTypeSwitcher(this.runner, this.updateSelectedKernel);

    const runButton = new ToolbarButton({
      iconClassName: RUN_ICON_CLASS,
      onClick: this.runPython,
      tooltip: 'Run'
    });

    const stopButton = new ToolbarButton({
      iconClassName: STOP_ICON_CLASS,
      onClick: this.runner.shutDownKernel,
      tooltip: 'Stop'
    });

    // Populate toolbar with button widgets
    const toolbar = this.toolbar;
    toolbar.addItem('save', saveButton);
    toolbar.addItem('select', dropDown);
    toolbar.addItem('run', runButton);
    toolbar.addItem('stop', stopButton);

    // Create output area widget
    this.createOutputAreaWidget();
  }

  /**
   * Function: Creates an OutputArea widget wrapped in a DockPanel.
   */
  private createOutputAreaWidget = () => {
    // Add dockpanel wrapper for output area
    this.dockPanel = new DockPanel();
    Widget.attach(this.dockPanel, document.body);
    window.addEventListener('resize', () => {
      this.dockPanel.fit();
    });

    // Create output area widget
    const model: OutputAreaModel = new OutputAreaModel();
    const renderMimeRegistry = new RenderMimeRegistry({ initialFactories });
    this.outputAreaWidget = new OutputArea({ rendermime: renderMimeRegistry, model });
    this.outputAreaWidget.addClass(OUTPUT_AREA_CLASS);

    const layout = this.layout as BoxLayout;
    // TODO: Investigate SplitLayout instead of BoxLayout, for layout resizing functionality
    // const layout = this.layout as SplitLayout;
    layout.addWidget(this.dockPanel);
  };

  /**
   * Function: Updates kernel settings as per drop down selection.
   */
  private updateSelectedKernel = (selection: string) => {
    this.kernelSettings.name = selection;
  };

  /**
   * Function: Clears existing output area and runs python code from file editor.
   */
  private runPython = async () => {
    this.resetOutputArea();
    this.displayOutputArea();
    this.runner.runPython(this.kernelSettings, this.handleKernelMsg);
  };

  /**
   * Function: Clears existing output area.
   */
  private resetOutputArea = () => {
    // TODO: hide this.layout(), or set its height to 0
    this.dockPanel.hide();
    this.outputAreaWidget.model.clear();
    this.outputAreaWidget.removeClass(OUTPUT_AREA_ERROR_CLASS); // if no error class is found, command is ignored
  };

  /**
   * Function: Call back function passed to runner, that handles messages coming from the kernel.
   */
  private handleKernelMsg = async (msg: any) => {
    let output = '';

    if (msg.status){
      this.displayKernelStatus(msg.status);
      return;
    } else if (msg.error) {
      output = 'Error : ' + msg.error.type + ' - ' + msg.error.output;
      this.getOutputAreaChildWidget().addClass(OUTPUT_AREA_ERROR_CLASS);
    } else if (msg.output) {
      output = msg.output;
    }
    this.displayOutput(output);
  };

  /**
   * Function: Displays output area widget.
   */
  private displayOutputArea = () => {
    this.dockPanel.show();

    // TODO: Set layout height to be flexible
    BoxLayout.setStretch(this.dockPanel, 1);

    if ( !this.hasOutputTab() ){
      // Add a tab to dockPanel
      this.dockPanel.addWidget(this.outputAreaWidget, { mode: 'split-bottom' });

      let outputTab: TabBar<Widget> = this.dockPanel.tabBars().next();
      outputTab.id = 'tab-python-editor-output';
      outputTab.currentTitle.label = 'Python Console Output';
      outputTab.currentTitle.closable = true;
      this.addCollapseButton();
    }
  };

  /**
   * Function: Displays kernel status, similar to notebook.
   */
  private displayKernelStatus = (status: string) => {
    if (status === 'busy') {
      // TODO: Use a character that does not take any space, also not an empty string
      this.displayOutput(' ');
      this.updatePromptText('*');
    }
    else if (status === 'idle'){
      this.updatePromptText(' ');
    }
  };

  /**
   * Function: Displays python code in OutputArea widget.
   */
  private displayOutput = (output: string) => {
    if (output) {
      let options = {
        name: 'stdout',
        output_type: 'stream',
        text: [output]
      };
      this.outputAreaWidget.model.add(options);

      this.getOutputAreaChildWidget().addClass(OUTPUT_AREA_CHILD_CLASS);
      this.getOutputAreaPromptWidget().addClass(OUTPUT_AREA_PROMPT_CLASS);
    }
  };

  /**
   * Function: Gets OutputArea child widget, where output and kernel status are displayed.
   */
  private getOutputAreaChildWidget = () => {
    const outputAreaChildLayout = this.outputAreaWidget.layout as PanelLayout;
    return outputAreaChildLayout.widgets[0];
  };

  /**
   * Function: Gets OutputArea prompt widget, where kernel status is displayed.
   */
  private getOutputAreaPromptWidget = () => {
    const outputAreaChildLayout = this.getOutputAreaChildWidget().layout as PanelLayout;
    return outputAreaChildLayout.widgets[0] as OutputPrompt;
  };

  /**
   * Function: Updates OutputArea prompt widget to display kernel status.
   */
  private updatePromptText = (kernelStatusFlag: string) => {
    this.getOutputAreaPromptWidget().node.innerText = '[' + kernelStatusFlag + ']:';
  };

  /**
   * Function: Returns a boolean representing if the DockPanel instance has a TabBar.
   */
  private hasOutputTab = () => {
    return Object.entries(this.dockPanel.tabBars()).length !== 0;
  }

  //  TODO: Add collapse button to tab
  private addCollapseButton = () => {
    // Commented code below swaps close icon to collapse icon. We want both.
    // const tabBar = this.dockPanel.tabBars().next();
    // let closeIconElem = tabBar.contentNode.getElementsByClassName('p-TabBar-tabCloseIcon')[0];
    // if (closeIconElem){
    //   closeIconElem.classList.add(COLLAPSE_ICON_CLASS);
    // }
  };

  /**
   * Function: Saves file editor content.
   */
  private saveFile = () => {
    if (this.model.readOnly) {
      return showDialog({
          title: 'Cannot Save',
          body: 'Document is read-only',
          buttons: [Dialog.okButton()]
      });
    }
    void this.context.save();
    // Future reference for creating a checkpoint

    // .then(() => {
    //     if (!this.isDisposed) {
    //         return this.context.createCheckpoint();
    //     }
    // });
  };
}

/**
 * Class: Holds properties for toolbar dropdown.
 */
class DropDownProps {
  runner: PythonRunner;
  updateKernel: Function;
};

/**
 * Class: Holds kernel state property.
 */
class DropDownState {
  kernelSpecs: Kernel.ISpecModels;
};

/**
 * Class: A toolbar dropdown component populated with available kernel specs.
 */
class DropDown extends React.Component<DropDownProps, DropDownState> {
  private updateKernel: Function;
  private kernelOptionElems: Object[];

  /**
   * Construct a new dropdown widget.
   */
  constructor(props: DropDownProps) {
    super(props);
    this.state = {kernelSpecs: null};
    this.updateKernel = this.props.updateKernel;
    this.kernelOptionElems = [];
    this.getKernelSPecs();
  }

  /**
   * Function: Gets kernel specs and state.
   */
  private async getKernelSPecs() {
    const specs: Kernel.ISpecModels = await this.props.runner.getKernelSpecs();
    this.filterPythonKernels(specs);

    // Set kernel to default
    this.updateKernel(specs.default);

    this.createOptionElems(specs);
    this.setState({kernelSpecs: specs});
  }

  /**
   * Function: Filters for python kernel specs only.
   */
  private filterPythonKernels = (specs: Kernel.ISpecModels) => {
    Object.entries(specs.kernelspecs)
      .filter(entry => entry[1].language !== 'python')
      .forEach(entry => delete specs.kernelspecs[entry[0]]);
  }

  /**
   * Function: Creates drop down options with available python kernel specs.
   */
  private createOptionElems  = (specs: Kernel.ISpecModels) => {
    const kernelNames : string[] = Object.keys(specs.kernelspecs);
    kernelNames.forEach((specName: string, i: number) => {
      const elem = React.createElement('option', {key: i, value: specName}, specName);
      this.kernelOptionElems.push(elem);
    });
  }

  /**
   * Function: Handles kernel selection from dropdown options.
   */
  private handleSelection = (event: any) => {
    const selection: string = event.target.value;
    this.updateKernel(selection);
  }

  render(){
      return (
        this.state.kernelSpecs ?
        React.createElement(HTMLSelect, {
          className: DROPDOWN_CLASS,
          onChange: this.handleSelection.bind(this),
          defaultValue: this.state.kernelSpecs.default
        }, this.kernelOptionElems) :
        React.createElement('span', null, 'Fetching kernel specs...')
      );
  }
}

/**
 * Class: A CellTypeSwitcher widget that renders the Dropdown component.
 */
export class CellTypeSwitcher extends ReactWidget {
  private runner: PythonRunner;
  private updateKernel: Function;

  /**
   * Construct a new CellTypeSwitcher widget.
   */
  constructor(runner: PythonRunner, updateKernel: Function) {
    super();
    this.runner = runner;
    this.updateKernel = updateKernel;
  }

  render() {
    return (<DropDown {...{runner: this.runner, updateKernel: this.updateKernel}}/>);
  }
}

/**
 * A widget factory for python editors.
 */
export class PythonFileEditorFactory extends ABCWidgetFactory<PythonFileEditor, DocumentRegistry.ICodeModel> {
  /**
   * Construct a new editor widget factory.
   */
  constructor(options: PythonFileEditorFactory.IOptions) {
    super(options.factoryOptions);
    this._services = options.editorServices;
  }

  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.CodeContext): PythonFileEditor {
    let func = this._services.factoryService.newDocumentEditor;
    let factory: CodeEditor.Factory = options => {
      return func(options);
    };
    const content = new FileEditor({
      factory,
      context,
      mimeTypeService: this._services.mimeTypeService
    });
    return new PythonFileEditor({ content, context });
  }

  private _services: IEditorServices;
}

/**
 * The namespace for `PythonFileEditorFactory` class statics.
 */
export namespace PythonFileEditorFactory {
  /**
   * The options used to create an editor widget factory.
   */
  export interface IOptions {
    /**
     * The editor services used by the factory.
     */
    editorServices: IEditorServices;

    /**
     * The factory options associated with the factory.
     */
    factoryOptions: DocumentRegistry.IWidgetFactoryOptions<PythonFileEditor>;
  }
}

