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

import { pyIcon } from '@elyra/ui-components';

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
  runIcon,
  saveIcon,
  stopIcon
} from '@jupyterlab/ui-components';
import { BoxLayout, PanelLayout, Widget } from '@lumino/widgets';
import React, { RefObject } from 'react';

import { KernelDropdown, ISelect } from './KernelDropdown';
import { ScriptEditorController } from './ScriptEditorController';
import { ScriptRunner } from './ScriptRunner';

/**
 * The CSS class added to widgets.
 */
const SCRIPT_EDITOR_CLASS = 'elyra-ScriptEditor';
const OUTPUT_AREA_CLASS = 'elyra-ScriptEditor-OutputArea';
const OUTPUT_AREA_ERROR_CLASS = 'elyra-ScriptEditor-OutputArea-error';
const OUTPUT_AREA_CHILD_CLASS = 'elyra-ScriptEditor-OutputArea-child';
const OUTPUT_AREA_OUTPUT_CLASS = 'elyra-ScriptEditor-OutputArea-output';
const OUTPUT_AREA_PROMPT_CLASS = 'elyra-ScriptEditor-OutputArea-prompt';
const RUN_BUTTON_CLASS = 'elyra-ScriptEditor-Run';
const TOOLBAR_CLASS = 'elyra-ScriptEditor-Toolbar';
const PYTHON = 'python';
const R = 'R';

/**
 * A widget for script editors.
 */
export class ScriptEditor extends DocumentWidget<
  FileEditor,
  DocumentRegistry.ICodeModel
> {
  private runner: ScriptRunner;
  private kernelName?: string;
  private dockPanel?: DockPanelSvg;
  private outputAreaWidget?: OutputArea;
  private scrollingWidget?: ScrollingWidget<OutputArea>;
  private model: any;
  private emptyOutput: boolean;
  private runDisabled: boolean;
  private kernelSelectorRef: RefObject<ISelect> | null;
  private controller: ScriptEditorController;
  private editorLanguage: string;

  /**
   * Construct a new editor widget.
   */
  constructor(
    options: DocumentWidget.IOptions<FileEditor, DocumentRegistry.ICodeModel>
  ) {
    super(options);
    this.addClass(SCRIPT_EDITOR_CLASS);
    this.model = this.content.model;
    this.runner = new ScriptRunner(this.disableRun);
    this.kernelSelectorRef = null;
    this.kernelName = options.context.sessionContext.kernelPreference.language;
    this.emptyOutput = true;
    this.runDisabled = false;
    this.controller = new ScriptEditorController();
    this.editorLanguage = this.kernelName?.toLowerCase().includes(PYTHON)
      ? PYTHON
      : R;

    // Add icon to main tab
    this.title.icon = this.editorLanguage === PYTHON ? pyIcon : 'rIcon';

    // Add toolbar widgets
    const saveButton = new ToolbarButton({
      icon: saveIcon,
      onClick: this.saveFile,
      tooltip: 'Save file contents'
    });

    const runButton = new ToolbarButton({
      className: RUN_BUTTON_CLASS,
      icon: runIcon,
      onClick: this.runScript,
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

    this.toolbar.addClass(TOOLBAR_CLASS);

    // Create output area widget
    this.createOutputAreaWidget();

    this.initializeKernelSpecs();
  }

  initializeKernelSpecs = async (): Promise<void> => {
    const kernelSpecs = await this.controller.getKernelSpecsByLanguage(
      this.editorLanguage
    );

    this.kernelName = Object.values(kernelSpecs?.kernelspecs ?? [])[0]?.name;

    this.kernelSelectorRef = React.createRef<ISelect>();

    if (kernelSpecs !== null) {
      const kernelDropDown = new KernelDropdown(
        kernelSpecs,
        this.kernelSelectorRef
      );
      this.toolbar.insertItem(3, 'select', kernelDropDown);
    }
  };

  /**
   * Function: Creates an OutputArea widget wrapped in a DockPanel.
   */
  private createOutputAreaWidget = (): void => {
    // Add dockpanel wrapper for output area
    this.dockPanel = new DockPanelSvg({ tabsMovable: false });
    Widget.attach(this.dockPanel, document.body);
    window.addEventListener('resize', () => {
      this.dockPanel?.fit();
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
   * Function: Clears existing output area and runs script
   * code from file editor in the selected kernel context.
   */
  private runScript = async (): Promise<void> => {
    if (!this.runDisabled) {
      this.kernelName = this.kernelSelectorRef?.current?.getSelection();
      this.resetOutputArea();
      this.kernelName && this.displayOutputArea();
      await this.runner.runScript(
        this.kernelName,
        this.context.path,
        this.model.value.text,
        this.handleKernelMsg
      );
    }
  };

  private stopRun = async (): Promise<void> => {
    await this.runner.shutdownSession();
    if (!this.dockPanel?.isEmpty) {
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
    this.dockPanel?.hide();
    this.outputAreaWidget?.model.clear();
    this.outputAreaWidget?.removeClass(OUTPUT_AREA_ERROR_CLASS); // if no error class is found, command is ignored
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
    scrollUpButton.className = 'elyra-ScriptEditor-scrollTop';
    scrollDownButton.className = 'elyra-ScriptEditor-scrollBottom';
    scrollUpButton.onclick = function(): void {
      scrollingWidget.node.scrollTop = 0;
    };
    scrollDownButton.onclick = function(): void {
      scrollingWidget.node.scrollTop = scrollingWidget.node.scrollHeight;
    };
    caretUpEmptyThinIcon.element({
      container: scrollUpButton,
      elementPosition: 'center',
      title: 'Top'
    });
    caretDownEmptyThinIcon.element({
      container: scrollDownButton,
      elementPosition: 'center',
      title: 'Bottom'
    });
    this.dockPanel?.node.appendChild(scrollUpButton);
    this.dockPanel?.node.appendChild(scrollDownButton);
  };

  /**
   * Function: Displays output area widget.
   */
  private displayOutputArea = (): void => {
    if (this.outputAreaWidget === undefined) {
      return;
    }

    this.dockPanel?.show();

    // TODO: Set layout height to be flexible
    if (this.dockPanel !== undefined) {
      BoxLayout.setStretch(this.dockPanel, 1);
    }

    if (this.dockPanel?.isEmpty) {
      // Add a tab to dockPanel
      this.scrollingWidget = new ScrollingWidget({
        content: this.outputAreaWidget
      });
      this.createScrollButtons(this.scrollingWidget);
      this.dockPanel?.addWidget(this.scrollingWidget, { mode: 'split-bottom' });

      const outputTab = this.dockPanel?.tabBars().next();
      if (outputTab !== undefined) {
        outputTab.id = 'tab-ScriptEditor-output';
        if (outputTab.currentTitle !== null) {
          outputTab.currentTitle.label = 'Console Output';
          outputTab.currentTitle.closable = true;
        }
        outputTab.disposed.connect((sender, args) => {
          this.stopRun();
          this.resetOutputArea();
        }, this);
      }
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
        this.outputAreaWidget?.model.clear(false);
        this.outputAreaWidget?.model.add(options);
        this.emptyOutput = false;
        // Clear will wait until the first output from the kernel to clear the initial string
        this.outputAreaWidget?.model.clear(true);
      } else {
        this.outputAreaWidget?.model.add(options);
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
    const outputAreaChildLayout = this.outputAreaWidget?.layout as PanelLayout;
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
  private saveFile = async (): Promise<any> => {
    if (this.model.readOnly) {
      return showDialog({
        title: 'Cannot Save',
        body: 'Document is read-only',
        buttons: [Dialog.okButton()]
      });
    }
    void this.context.save().then(() => {
      if (!this.isDisposed) {
        return this.context.createCheckpoint();
      }
      return;
    });
  };
}

/**
 * A widget factory for script editors.
 */
export class ScriptEditorFactory extends ABCWidgetFactory<
  ScriptEditor,
  DocumentRegistry.ICodeModel
> {
  /**
   * Construct a new editor widget factory.
   */
  constructor(options: ScriptEditorFactory.IOptions) {
    super(options.factoryOptions);
    this._services = options.editorServices;
  }

  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(
    context: DocumentRegistry.CodeContext
  ): ScriptEditor {
    const newDocumentEditor = this._services.factoryService.newDocumentEditor;
    const factory: CodeEditor.Factory = options => {
      return newDocumentEditor(options);
    };
    const content = new FileEditor({
      factory,
      context,
      mimeTypeService: this._services.mimeTypeService
    });
    return new ScriptEditor({ content, context });
  }

  private _services: IEditorServices;
}

/**
 * The namespace for `ScriptEditorFactory` class statics.
 */
export namespace ScriptEditorFactory {
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
    factoryOptions: DocumentRegistry.IWidgetFactoryOptions<ScriptEditor>;
  }
}
