import {FileEditor} from '@jupyterlab/fileeditor';
import {ABCWidgetFactory, DocumentRegistry, DocumentWidget} from '@jupyterlab/docregistry';
import {CodeEditor, IEditorServices} from '@jupyterlab/codeeditor';
import {ToolbarButton, ReactWidget} from '@jupyterlab/apputils';
import {PythonRunner} from './PythonRunner';
import {HTMLSelect} from '@jupyterlab/ui-components';
import {Kernel} from '@jupyterlab/services';
import {OutputArea, OutputAreaModel} from '@jupyterlab/outputarea';
import {RenderMimeRegistry,standardRendererFactories as initialFactories} from '@jupyterlab/rendermime';
import {BoxLayout} from '@phosphor/widgets';
import React from 'react';

/**
 * The CSS class added to widgets
 */
const PYTHON_FILE_EDITOR_CLASS = 'jp-PythonFileEditor';
const PYTHON_EDITOR_OUTPUT_AREA_CLASS = 'jp-PythonEditorOutputArea';
const OUTPUT_AREA_ERROR_CLASS = 'jp-OutputArea-Error';
const RUN_ICON_CLASS = 'jp-RunIcon';
const STOP_ICON_CLASS = 'jp-StopIcon';
const DROPDOWN_CLASS = 'jp-Notebook-toolbarCellTypeDropdown';
const PYTHON_ICON_CLASS = 'jp-PythonIcon';

/**
 * A widget for python editors.
 */
export class PythonFileEditor extends DocumentWidget<FileEditor, DocumentRegistry.ICodeModel> {
  private runner: PythonRunner;
  private kernelSettings: Kernel.IOptions;
  // private editorWidget: any;
  private outputAreaWidget: OutputArea;

  /**
   * Construct a new editor widget.
   */
  constructor(options: DocumentWidget.IOptions<FileEditor, DocumentRegistry.ICodeModel>) {
    super(options);
    this.addClass(PYTHON_FILE_EDITOR_CLASS);
    this.runner = new PythonRunner(this.content.model);
    this.kernelSettings = {name: null};

    // Add python icon to main tab
    this.title.iconClass = PYTHON_ICON_CLASS;

    // Add toolbar widgets
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

    const toolbar = this.toolbar;
    toolbar.addItem('select', dropDown);
    toolbar.addItem('run', runButton);
    toolbar.addItem('stop', stopButton);

    // Add output area
    const model: OutputAreaModel = new OutputAreaModel();
    const rendermime = new RenderMimeRegistry({ initialFactories });
    this.outputAreaWidget = new OutputArea({ rendermime, model });
    this.outputAreaWidget.addClass(PYTHON_EDITOR_OUTPUT_AREA_CLASS);

    const layout = this.layout as BoxLayout;
    layout.addWidget(this.outputAreaWidget);
  }

  private handleKernelMsg = async (msg: any) => {
    let output = "";

    if (msg.error) {
      output = 'Error : ' + msg.error.type + ' - ' + msg.error.output;
      this.outputAreaWidget.addClass(OUTPUT_AREA_ERROR_CLASS);
    } else if (msg.output) {
      output = msg.output;
    }

    this.displayOutput(output);
  };

  private runPython = async () => {
    this.resetOutputArea();
    this.runner.runPython(this.kernelSettings, this.handleKernelMsg);
  };

  private updateSelectedKernel = (selection: string) => {
    this.kernelSettings.name = selection;
  };

  private resetOutputArea = () => {
    this.outputAreaWidget.model.clear();
    BoxLayout.setStretch(this.outputAreaWidget, 0);
    this.outputAreaWidget.removeClass(OUTPUT_AREA_ERROR_CLASS);
  };

  private displayOutput = (output: string) => {
    if (output) {
      BoxLayout.setStretch(this.outputAreaWidget, 1);

      this.outputAreaWidget.model.add({
        name: 'stdout',
        output_type: 'stream',
        text: [output]
      });
    }
  };
}

class DropDownProps {
  runner: PythonRunner;
  updateKernel: Function;
};

class DropDownState {
  kernelSpecs: Kernel.ISpecModels;
};

/**
 * A toolbar dropdown widget populated with available kernel specs
 */
class DropDown extends React.Component<DropDownProps, DropDownState> {
  private updateKernel: Function;
  private kernelOptionElems: Object[];

  constructor(props: DropDownProps) {
    super(props);
    this.state = {kernelSpecs: null};
    this.updateKernel = this.props.updateKernel;
    this.kernelOptionElems = [];
    this.getKernelSPecs();
  }

  private async getKernelSPecs() {
    const specs: Kernel.ISpecModels = await this.props.runner.getKernelSpecs();
    this.filterPythonKernels(specs);

    // Set kernel to default
    this.updateKernel(specs.default);

    this.createOptionElems(specs);
    this.setState({kernelSpecs: specs});
  }

  private filterPythonKernels = (specs: Kernel.ISpecModels) => {
    Object.entries(specs.kernelspecs)
      .filter(entry => entry[1].language !== 'python')
      .forEach(entry => delete specs.kernelspecs[entry[0]]);
  }

  private createOptionElems  = (specs: Kernel.ISpecModels) => {
    const kernelNames : string[] = Object.keys(specs.kernelspecs);
    kernelNames.forEach((specName: string, i: number) => {
      const elem = React.createElement('option', {key: i, value: specName}, specName);
      this.kernelOptionElems.push(elem);
    });
  }

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

export class CellTypeSwitcher extends ReactWidget {
  private runner: PythonRunner;
  private updateKernel: Function;

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
