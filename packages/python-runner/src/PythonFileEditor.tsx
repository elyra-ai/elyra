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

import '../style/index.css';

import { ToolbarButton, showDialog, Dialog } from '@jupyterlab/apputils';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget
} from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { ScrollingWidget } from '@jupyterlab/logconsole';
import {
  OutputArea,
  OutputAreaModel,
  OutputPrompt
} from '@jupyterlab/outputarea';
import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories
} from '@jupyterlab/rendermime';
import {
  caretDownEmptyThinIcon,
  caretUpEmptyThinIcon,
  DockPanelSvg,
  pythonIcon,
  runIcon,
  saveIcon,
  stopIcon,
  TabBarSvg
} from '@jupyterlab/ui-components';
import { BoxLayout, PanelLayout, Widget } from '@lumino/widgets';

import { KernelDropdown } from './KernelDropdown';
import { PythonRunner } from './PythonRunner';

/**
 * The CSS class added to widgets.
 */
const PYTHON_FILE_EDITOR_CLASS = 'elyra-PythonEditor';
const OUTPUT_AREA_CLASS = 'elyra-PythonEditor-OutputArea';
const OUTPUT_AREA_ERROR_CLASS = 'elyra-PythonEditor-OutputArea-error';
const OUTPUT_AREA_CHILD_CLASS = 'elyra-PythonEditor-OutputArea-child';
const OUTPUT_AREA_OUTPUT_CLASS = 'elyra-PythonEditor-OutputArea-output';
const OUTPUT_AREA_PROMPT_CLASS = 'elyra-PythonEditor-OutputArea-prompt';
const RUN_BUTTON_CLASS = 'elyra-PythonEditor-Run';
const TOOLBAR_CLASS = 'elyra-PythonEditor-Toolbar';

/**
 * A widget for python editors.
 */
export class PythonFileEditor extends DocumentWidget<
  FileEditor,
  DocumentRegistry.ICodeModel
> {
  private runner: PythonRunner;
  private kernelName: string;
  private dockPanel: DockPanelSvg;
  private outputAreaWidget: OutputArea;
  private scrollingWidget: ScrollingWidget<OutputArea>;
  private model: any;
  private emptyOutput: boolean;
  private runDisabled: boolean;

  /**
   * Construct a new editor widget.
   */
  constructor(
    options: DocumentWidget.IOptions<FileEditor, DocumentRegistry.ICodeModel>
  ) {
    super(options);
    this.addClass(PYTHON_FILE_EDITOR_CLASS);
    this.model = this.content.model;
    this.runner = new PythonRunner(this.model, this.disableRun);
    this.kernelName = null;
    this.emptyOutput = true;
    this.runDisabled = false;

    // Add python icon to main tab
    this.title.icon = pythonIcon;

    // Add toolbar widgets
    const saveButton = new ToolbarButton({
      icon: saveIcon,
      onClick: this.saveFile,
      tooltip: 'Save file contents'
    });

    const dropDown = new KernelDropdown(this.runner, this.updateSelectedKernel);

    const runButton = new ToolbarButton({
      className: RUN_BUTTON_CLASS,
      icon: runIcon,
      onClick: this.runPython,
      tooltip: 'Run'
    });

    const stopButton = new ToolbarButton({
      icon: stopIcon,
      onClick: this.stopRun,
      tooltip: 'Stop'
    });

    // Populate toolbar with button widgets
    const toolbar = this.toolbar;
    toolbar.addItem('save', saveButton);
    toolbar.addItem('run', runButton);
    toolbar.addItem('stop', stopButton);
    toolbar.addItem('select', dropDown);

    this.toolbar.addClass(TOOLBAR_CLASS);

    // Create output area widget
    this.createOutputAreaWidget();
  }

  /**
   * Function: Creates an OutputArea widget wrapped in a DockPanel.
   */
  private createOutputAreaWidget = (): void => {
    // Add dockpanel wrapper for output area
    this.dockPanel = new DockPanelSvg({ tabsMovable: false });
    Widget.attach(this.dockPanel, document.body);
    window.addEventListener('resize', () => {
      this.dockPanel.fit();
    });

    // Create output area widget
    const model: OutputAreaModel = new OutputAreaModel();
    const renderMimeRegistry = new RenderMimeRegistry({ initialFactories });
    this.outputAreaWidget = new OutputArea({
      rendermime: renderMimeRegistry,
      model
    });
    this.outputAreaWidget.addClass(OUTPUT_AREA_CLASS);

    const layout = this.layout as BoxLayout;
    // TODO: Investigate SplitLayout instead of BoxLayout, for layout resizing functionality
    // const layout = this.layout as SplitLayout;
    layout.addWidget(this.dockPanel);
  };

  /**
   * Function: Updates kernel settings as per drop down selection.
   */
  private updateSelectedKernel = (selection: string): void => {
    this.kernelName = selection;
  };

  /**
   * Function: Clears existing output area and runs python code from file editor.
   */
  private runPython = async (): Promise<void> => {
    if (!this.runDisabled) {
      this.resetOutputArea();
      this.displayOutputArea();
      this.runner.runPython(this.kernelName, this.handleKernelMsg);
    }
  };

  private stopRun = async (): Promise<void> => {
    this.runner.shutDownKernel();
    if (!this.dockPanel.isEmpty) {
      this.updatePromptText(' ');
    }
  };

  private disableRun = (disabled: boolean): void => {
    this.runDisabled = disabled;
    (document.querySelector(
      '#' + this.id + ' .' + RUN_BUTTON_CLASS
    ) as HTMLInputElement).disabled = disabled;
  };

  /**
   * Function: Clears existing output area.
   */
  private resetOutputArea = (): void => {
    // TODO: hide this.layout(), or set its height to 0
    this.dockPanel.hide();
    this.outputAreaWidget.model.clear();
    this.outputAreaWidget.removeClass(OUTPUT_AREA_ERROR_CLASS); // if no error class is found, command is ignored
  };

  /**
   * Function: Call back function passed to runner, that handles messages coming from the kernel.
   */
  private handleKernelMsg = async (msg: any): Promise<void> => {
    let output = '';

    if (msg.status) {
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

  private createScrollButtons = (
    scrollingWidget: ScrollingWidget<OutputArea>
  ): void => {
    const scrollUpButton = document.createElement('button');
    const scrollDownButton = document.createElement('button');
    scrollUpButton.className = 'elyra-PythonEditor-scrollTop';
    scrollDownButton.className = 'elyra-PythonEditor-scrollBottom';
    scrollUpButton.onclick = function(): void {
      scrollingWidget.node.scrollTop = 0;
    };
    scrollDownButton.onclick = function(): void {
      scrollingWidget.node.scrollTop = scrollingWidget.node.scrollHeight;
    };
    caretUpEmptyThinIcon.element({
      container: scrollUpButton,
      elementPosition: 'center'
    });
    caretDownEmptyThinIcon.element({
      container: scrollDownButton,
      elementPosition: 'center'
    });
    this.dockPanel.node.appendChild(scrollUpButton);
    this.dockPanel.node.appendChild(scrollDownButton);
  };

  /**
   * Function: Displays output area widget.
   */
  private displayOutputArea = (): void => {
    this.dockPanel.show();

    // TODO: Set layout height to be flexible
    BoxLayout.setStretch(this.dockPanel, 1);

    if (this.dockPanel.isEmpty) {
      // Add a tab to dockPanel
      this.scrollingWidget = new ScrollingWidget({
        content: this.outputAreaWidget
      });
      this.createScrollButtons(this.scrollingWidget);
      this.dockPanel.addWidget(this.scrollingWidget, { mode: 'split-bottom' });

      const outputTab: TabBarSvg<Widget> = this.dockPanel.tabBars().next();
      outputTab.id = 'tab-python-editor-output';
      outputTab.currentTitle.label = 'Python Console Output';
      outputTab.currentTitle.closable = true;
      outputTab.disposed.connect((sender, args) => {
        this.stopRun();
        this.resetOutputArea();
      }, this);
    }

    const options = {
      name: 'stdout',
      output_type: 'stream',
      text: ['Waiting for kernel to start...']
    };
    this.outputAreaWidget.model.add(options);
    this.updatePromptText(' ');
    this.setOutputAreaClasses();
  };

  /**
   * Function: Displays kernel status, similar to notebook.
   */
  private displayKernelStatus = (status: string): void => {
    if (status === 'busy') {
      // TODO: Use a character that does not take any space, also not an empty string
      this.emptyOutput = true;
      this.displayOutput(' ');
      this.updatePromptText('*');
    } else if (status === 'idle') {
      this.updatePromptText(' ');
    }
  };

  /**
   * Function: Displays python code in OutputArea widget.
   */
  private displayOutput = (output: string): void => {
    if (output) {
      const options = {
        name: 'stdout',
        output_type: 'stream',
        text: [output]
      };
      // Stream output doesn't instantiate correctly without an initial output string
      if (this.emptyOutput) {
        // Clears the "Waiting for kernel" message immediately
        this.outputAreaWidget.model.clear(false);
        this.outputAreaWidget.model.add(options);
        this.emptyOutput = false;
        // Clear will wait until the first output from the kernel to clear the initial string
        this.outputAreaWidget.model.clear(true);
      } else {
        this.outputAreaWidget.model.add(options);
      }
      this.updatePromptText('*');
      this.setOutputAreaClasses();
    }
  };

  private setOutputAreaClasses = (): void => {
    this.getOutputAreaChildWidget().addClass(OUTPUT_AREA_CHILD_CLASS);
    this.getOutputAreaOutputWidget().addClass(OUTPUT_AREA_OUTPUT_CLASS);
    this.getOutputAreaPromptWidget().addClass(OUTPUT_AREA_PROMPT_CLASS);
  };

  /**
   * Function: Gets OutputArea child widget, where output and kernel status are displayed.
   */
  private getOutputAreaChildWidget = (): Widget => {
    const outputAreaChildLayout = this.outputAreaWidget.layout as PanelLayout;
    return outputAreaChildLayout.widgets[0];
  };

  /**
   * Function: Gets OutputArea prompt widget, where kernel status is displayed.
   */
  private getOutputAreaOutputWidget = (): Widget => {
    const outputAreaChildLayout = this.getOutputAreaChildWidget()
      .layout as PanelLayout;
    return outputAreaChildLayout.widgets[1];
  };

  /**
   * Function: Gets OutputArea prompt widget, where kernel status is displayed.
   */
  private getOutputAreaPromptWidget = (): OutputPrompt => {
    const outputAreaChildLayout = this.getOutputAreaChildWidget()
      .layout as PanelLayout;
    return outputAreaChildLayout.widgets[0] as OutputPrompt;
  };

  /**
   * Function: Updates OutputArea prompt widget to display kernel status.
   */
  private updatePromptText = (kernelStatusFlag: string): void => {
    this.getOutputAreaPromptWidget().node.innerText =
      '[' + kernelStatusFlag + ']:';
  };

  /**
   * Function: Saves file editor content.
   */
  private saveFile = (): Promise<any> => {
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
 * A widget factory for python editors.
 */
export class PythonFileEditorFactory extends ABCWidgetFactory<
  PythonFileEditor,
  DocumentRegistry.ICodeModel
> {
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
  protected createNewWidget(
    context: DocumentRegistry.CodeContext
  ): PythonFileEditor {
    const func = this._services.factoryService.newDocumentEditor;
    const factory: CodeEditor.Factory = options => {
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
