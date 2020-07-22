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
  codeSnippetIcon,
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
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { addIcon, copyIcon, editIcon } from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import React from 'react';

import { CodeSnippetService, ICodeSnippet } from './CodeSnippetService';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPETS_HEADER_BUTTON_CLASS = 'elyra-codeSnippetHeader-button';
const CODE_SNIPPET_ITEM = 'elyra-codeSnippet-item';

const METADATA_EDITOR_ID = 'elyra-metadata-editor';
const commands = {
  OPEN_METADATA_EDITOR: `${METADATA_EDITOR_ID}:open`
};
const CODE_SNIPPET_NAMESPACE = 'code-snippets';
const CODE_SNIPPET_SCHEMA = 'code-snippet';

/**
 * CodeSnippetDisplay props.
 */
interface ICodeSnippetDisplayProps {
  codeSnippets: ICodeSnippet[];
  getCurrentWidget: () => Widget;
  editorServices: IEditorServices;
  openCodeSnippetEditor: (args: any) => void;
  updateSnippets: () => void;
  shell: JupyterFrontEnd.IShell;
}

/**
 * A React Component for code-snippets display list.
 */
class CodeSnippetDisplay extends React.Component<ICodeSnippetDisplayProps> {
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
      if (
        PathExt.extname(widget.context.path).match(markdownRegex) !== null &&
        snippet.language.toLowerCase() !== 'markdown'
      ) {
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
      } else if (
        notebookCell instanceof MarkdownCell &&
        snippet.language.toLowerCase() !== 'markdown'
      ) {
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
            onSave: this.props.updateSnippets,
            namespace: CODE_SNIPPET_NAMESPACE,
            schema: CODE_SNIPPET_SCHEMA,
            name: codeSnippet.name
          });
        }
      },
      {
        title: 'Delete',
        icon: trashIcon,
        onClick: (): void => {
          CodeSnippetService.deleteCodeSnippet(codeSnippet).then(
            (deleted: any): void => {
              if (deleted) {
                this.props.updateSnippets();
                delete this.editors[codeSnippet.name];
                const editorWidget = find(
                  this.props.shell.widgets('main'),
                  (value: Widget, index: number) => {
                    return (
                      value.id ==
                      `${METADATA_EDITOR_ID}:${CODE_SNIPPET_NAMESPACE}:${CODE_SNIPPET_SCHEMA}:${codeSnippet.name}`
                    );
                  }
                );
                if (editorWidget) {
                  editorWidget.dispose();
                }
              }
            }
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
    const editorFactory = this.props.editorServices.factoryService
      .newInlineEditor;
    const getMimeTypeByLanguage = this.props.editorServices.mimeTypeService
      .getMimeTypeByLanguage;
    this.props.codeSnippets.map((codeSnippet: ICodeSnippet) => {
      if (codeSnippet.name in this.editors) {
        // Make sure code is up to date
        this.editors[codeSnippet.name].model.value.text = codeSnippet.code.join(
          '\n'
        );
      } else {
        // Add new snippets
        this.editors[codeSnippet.name] = editorFactory({
          config: { readOnly: true },
          host: document.getElementById(codeSnippet.name),
          model: new CodeEditor.Model({
            value: codeSnippet.code.join('\n'),
            mimeType: getMimeTypeByLanguage({
              name: codeSnippet.language,
              codemirror_mode: codeSnippet.language
            })
          })
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
  renderCodeSnippetsSignal: Signal<this, ICodeSnippet[]>;
  getCurrentWidget: () => Widget;
  app: JupyterFrontEnd;
  editorServices: IEditorServices;

  constructor(
    getCurrentWidget: () => Widget,
    app: JupyterFrontEnd,
    editorServices: IEditorServices
  ) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.renderCodeSnippetsSignal = new Signal<this, ICodeSnippet[]>(this);
    this.app = app;
    this.editorServices = editorServices;

    this.fetchData = this.fetchData.bind(this);
    this.updateSnippets = this.updateSnippets.bind(this);
    this.openCodeSnippetEditor = this.openCodeSnippetEditor.bind(this);
  }

  // Request code snippets from server
  async fetchData(): Promise<ICodeSnippet[]> {
    return await CodeSnippetService.findAll();
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
      onSave: this.updateSnippets,
      namespace: CODE_SNIPPET_NAMESPACE,
      schema: CODE_SNIPPET_SCHEMA
    });
  }

  openCodeSnippetEditor(args: any): void {
    this.app.commands.execute(commands.OPEN_METADATA_EDITOR, args);
  }

  render(): React.ReactElement {
    return (
      <div>
        <header className={CODE_SNIPPETS_HEADER_CLASS}>
          <div style={{ display: 'flex' }}>
            <codeSnippetIcon.react
              tag="span"
              width="24px"
              height="auto"
              verticalAlign="middle"
              marginRight="5px"
              paddingBottom="2px"
            />
            <p> Code Snippets </p>
          </div>
          <button
            className={CODE_SNIPPETS_HEADER_BUTTON_CLASS}
            onClick={this.addCodeSnippet.bind(this)}
            title="Create new Code Snippet"
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
              editorServices={this.editorServices}
              updateSnippets={this.updateSnippets}
              shell={this.app.shell}
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
