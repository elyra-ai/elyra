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

import {
  ExpandableComponent,
  trashIcon,
  importIcon
} from '@elyra/ui-components';

import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  Clipboard,
  Dialog,
  showDialog,
  ReactWidget,
  UseSignal
} from '@jupyterlab/apputils';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { addIcon, copyIcon, editIcon } from '@jupyterlab/ui-components';

import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import React from 'react';

import {
  CodeSnippetService,
  ICodeSnippet,
  CODE_SNIPPET_NAMESPACE
} from './CodeSnippetService';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_CLASS = 'elyra-CodeSnippets';
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPETS_HEADER_BUTTON_CLASS = 'elyra-codeSnippetHeader-button';
const CODE_SNIPPET_ITEM = 'elyra-codeSnippet-item';

export const defaultLanguageChoices = [
  'Python',
  'Java',
  'R',
  'Julia',
  'Matlab',
  'Octave',
  'Scheme',
  'Processing'
];

const METADATA_EDITOR_ID = 'elyra-metadata-editor';

/**
 * CodeSnippetDisplay props.
 */
interface ICodeSnippetDisplayProps {
  codeSnippets: ICodeSnippet[];
  getCurrentWidget: () => Widget;
  editorFactory: CodeEditor.Factory;
  openCodeSnippetEditor: any;
  updateSnippets: any;
  codeSnippetManager: CodeSnippetService;
}

/**
 * A React Component for code-snippets display list.
 */
export class CodeSnippetDisplay extends React.Component<
  ICodeSnippetDisplayProps
> {
  editors: { [codeSnippetId: string]: CodeEditor.IEditor } = {};
  // Handle code snippet insert into an editor
  private insertCodeSnippet = async (snippet: ICodeSnippet): Promise<void> => {
    const widget: Widget = this.props.getCurrentWidget();
    const snippetStr: string = snippet.code.join('\n');

    if (
      widget instanceof DocumentWidget &&
      (widget as DocumentWidget).content instanceof FileEditor
    ) {
      const documentWidget = widget as DocumentWidget;
      const fileEditor = (documentWidget.content as FileEditor).editor;
      const markdownRegex = /^\.(md|mkdn?|mdown|markdown)$/;
      if (PathExt.extname(widget.context.path).match(markdownRegex) !== null) {
        // Wrap snippet into a code block when inserting it into a markdown file
        fileEditor.replaceSelection(
          '```' + snippet.language + '\n' + snippetStr + '\n```'
        );
      } else if (widget.constructor.name == 'PythonFileEditor') {
        this.verifyLanguageAndInsert(snippet, 'python', fileEditor);
      } else {
        fileEditor.replaceSelection(snippetStr);
      }
    } else if (widget instanceof NotebookPanel) {
      const notebookWidget = widget as NotebookPanel;
      const notebookCell = (notebookWidget.content as Notebook).activeCell;
      const notebookCellEditor = notebookCell.editor;

      if (notebookCell instanceof CodeCell) {
        const kernelInfo = await notebookWidget.sessionContext.session?.kernel
          ?.info;
        const kernelLanguage: string = kernelInfo?.language_info.name || '';
        this.verifyLanguageAndInsert(
          snippet,
          kernelLanguage,
          notebookCellEditor
        );
      } else if (notebookCell instanceof MarkdownCell) {
        // Wrap snippet into a code block when inserting it into a markdown cell
        notebookCellEditor.replaceSelection(
          '```' + snippet.language + '\n' + snippetStr + '\n```'
        );
      } else {
        notebookCellEditor.replaceSelection(snippetStr);
      }
    } else {
      this.showErrDialog('Code snippet insert failed: Unsupported widget');
    }
  };

  // Handle language compatibility between code snippet and editor
  private verifyLanguageAndInsert = async (
    snippet: ICodeSnippet,
    editorLanguage: string,
    editor: CodeEditor.IEditor
  ): Promise<void> => {
    const snippetStr: string = snippet.code.join('\n');
    if (
      editorLanguage &&
      snippet.language.toLowerCase() !== editorLanguage.toLowerCase()
    ) {
      const result = await this.showWarnDialog(
        editorLanguage,
        snippet.displayName
      );
      if (result.button.accept) {
        editor.replaceSelection(snippetStr);
      }
    } else {
      // Language match or editorLanguage is unavailable
      editor.replaceSelection(snippetStr);
    }
  };

  // Display warning dialog when inserting a code snippet incompatible with editor's language
  private showWarnDialog = async (
    editorLanguage: string,
    snippetName: string
  ): Promise<Dialog.IResult<string>> => {
    return showDialog({
      title: 'Warning',
      body: `Code snippet "${snippetName}" is incompatible with ${editorLanguage}. Continue?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    });
  };

  // Display error dialog when inserting a code snippet into unsupported widget (i.e. not an editor)
  private showErrDialog = (errMsg: string): Promise<Dialog.IResult<string>> => {
    return showDialog({
      title: 'Error',
      body: errMsg,
      buttons: [Dialog.okButton()]
    });
  };

  // Render display of code snippet list
  private renderCodeSnippet = (codeSnippet: ICodeSnippet): JSX.Element => {
    const displayName = `[${codeSnippet.language}] ${codeSnippet.displayName}`;

    const actionButtons = [
      {
        title: 'Copy',
        icon: copyIcon,
        onClick: (): void => {
          Clipboard.copyToSystem(codeSnippet.code.join('\n'));
        }
      },
      {
        title: 'Insert',
        icon: importIcon,
        onClick: (): void => {
          this.insertCodeSnippet(codeSnippet);
        }
      },
      {
        title: 'Edit',
        icon: editIcon,
        onClick: (): void => {
          this.props.openCodeSnippetEditor({
            metadata: [
              {
                label: 'Name',
                value: codeSnippet.displayName,
                type: 'TextInput',
                schemaField: 'display_name'
              },
              {
                label: 'Description',
                value: codeSnippet.description,
                type: 'TextInput',
                schemaField: 'description'
              },
              {
                label: 'Language',
                value: {
                  choice: codeSnippet.language,
                  defaultChoices: defaultLanguageChoices
                },
                type: 'DropDown',
                schemaField: 'language'
              },
              {
                label: 'Code',
                value: codeSnippet.code.join('\n'),
                type: 'Code',
                schemaField: 'code'
              }
            ],
            newFile: false,
            namespace: CODE_SNIPPET_NAMESPACE,
            updateSignal: this.props.updateSnippets,
            fileName: codeSnippet.name
          });
        }
      },
      {
        title: 'Delete',
        icon: trashIcon,
        onClick: (): void => {
          this.props.codeSnippetManager.deleteCodeSnippet(
            codeSnippet,
            this.props.updateSnippets
          );
        }
      }
    ];

    return (
      <div key={codeSnippet.name} className={CODE_SNIPPET_ITEM}>
        <ExpandableComponent
          displayName={displayName}
          tooltip={codeSnippet.description}
          actionButtons={actionButtons}
          onExpand={(): void => {
            this.editors[codeSnippet.name].refresh();
          }}
        >
          <div id={codeSnippet.name}></div>
        </ExpandableComponent>
      </div>
    );
  };

  componentDidUpdate(): void {
    this.props.codeSnippets.map((codeSnippet: ICodeSnippet) => {
      if (codeSnippet.name in this.editors) {
        // Make sure code is up to date
        this.editors[codeSnippet.name].model.value.text = codeSnippet.code.join(
          '\n'
        );
      } else {
        // Add new snippets
        this.editors[codeSnippet.name] = this.props.editorFactory({
          host: document.getElementById(codeSnippet.name),
          model: new CodeEditor.Model({ value: codeSnippet.code.join('\n') })
        });
      }
    });
  }

  render(): React.ReactElement {
    return (
      <div>
        <div id="codeSnippets">
          <div>{this.props.codeSnippets.map(this.renderCodeSnippet)}</div>
        </div>
      </div>
    );
  }
}

/**
 * A widget for Code Snippets.
 */
export class CodeSnippetWidget extends ReactWidget {
  codeSnippetManager: CodeSnippetService;
  renderCodeSnippetsSignal: Signal<this, ICodeSnippet[]>;
  getCurrentWidget: () => Widget;
  app: JupyterFrontEnd;
  editorFactory: CodeEditor.Factory;

  constructor(
    getCurrentWidget: () => Widget,
    app: JupyterFrontEnd,
    editorFactory: CodeEditor.Factory
  ) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.codeSnippetManager = new CodeSnippetService();
    this.renderCodeSnippetsSignal = new Signal<this, ICodeSnippet[]>(this);
    this.openCodeSnippetEditor = this.openCodeSnippetEditor.bind(this);
    this.app = app;
    this.editorFactory = editorFactory;

    this.fetchData = this.fetchData.bind(this);
    this.updateSnippets = this.updateSnippets.bind(this);
  }

  // Request code snippets from server
  async fetchData(): Promise<ICodeSnippet[]> {
    return await this.codeSnippetManager.findAll();
  }

  updateSnippets(): void {
    this.fetchData().then((codeSnippets: ICodeSnippet[]) => {
      this.renderCodeSnippetsSignal.emit(codeSnippets);
    });
  }

  // Triggered when the widget button on side panel is clicked
  onAfterShow(msg: Message): void {
    this.updateSnippets();
  }

  addCodeSnippet(): void {
    this.openCodeSnippetEditor({
      metadata: [
        {
          label: 'Name',
          value: '',
          type: 'TextInput',
          schemaField: 'display_name'
        },
        {
          label: 'Description',
          value: '',
          type: 'TextInput',
          schemaField: 'description'
        },
        {
          label: 'Language',
          value: {
            defaultChoices: defaultLanguageChoices
          },
          type: 'DropDown',
          schemaField: 'language'
        },
        {
          label: 'Code',
          value: '',
          type: 'Code',
          schemaField: 'code'
        }
      ],
      newFile: true,
      metadataLabel: '',
      namespace: CODE_SNIPPET_NAMESPACE,
      updateSignal: this.updateSnippets
    });
  }

  openCodeSnippetEditor(args: any): void {
    this.app.commands.execute(`${METADATA_EDITOR_ID}:open`, args);
  }

  render(): React.ReactElement {
    return (
      <div className={CODE_SNIPPETS_CLASS}>
        <header className={CODE_SNIPPETS_HEADER_CLASS}>
          <p> {'</> Code Snippets'} </p>
          <button
            className={CODE_SNIPPETS_HEADER_BUTTON_CLASS}
            onClick={this.addCodeSnippet.bind(this)}
          >
            <addIcon.react tag="span" elementPosition="center" width="16px" />
          </button>
        </header>
        <UseSignal signal={this.renderCodeSnippetsSignal} initialArgs={[]}>
          {(_, codeSnippets): React.ReactElement => (
            <CodeSnippetDisplay
              codeSnippets={codeSnippets}
              openCodeSnippetEditor={this.openCodeSnippetEditor}
              getCurrentWidget={this.getCurrentWidget}
              editorFactory={this.editorFactory}
              updateSnippets={this.updateSnippets}
              codeSnippetManager={this.codeSnippetManager}
            />
          )}
        </UseSignal>
      </div>
    );
  }
}

/**
 * A namespace for CodeSnippet statics.
 */
export namespace CodeSnippetWidget {
  /**
   * Interface describing table of contents widget options.
   */
  export interface IOptions {
    /**
     * Application document manager.
     */
    docmanager: IDocumentManager;

    /**
     * Application rendered MIME type.
     */
    rendermime: IRenderMimeRegistry;
  }
}
