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
import { RequestHandler } from '@elyra/application';
import { ExpandableComponent, trashIcon } from '@elyra/ui-components';

import { Clipboard, Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { copyIcon, addIcon, editIcon } from '@jupyterlab/ui-components';

import { Widget } from '@lumino/widgets';
import React from 'react';

import { ICodeSnippet } from './CodeSnippetService';
import { CODE_SNIPPET_ENDPOINT } from './CodeSnippetWidget';

const CODE_SNIPPET_ITEM = 'elyra-codeSnippet-item';

/**
 * CodeSnippetDisplay props.
 */
interface ICodeSnippetDisplayProps {
  codeSnippets: ICodeSnippet[];
  getCurrentWidget: () => Widget;
  editorFactory: CodeEditor.Factory;
  openCodeSnippetEditor: any;
  updateSnippets: any;
}

/**
 * A React Component for code-snippets display list.
 */
export class CodeSnippetDisplay extends React.Component<
  ICodeSnippetDisplayProps
> {
  editors: { [codeSnippetId: string]: CodeEditor.IEditor } = {};
  // TODO: Use code mirror to display code

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
      body:
        'Code snippet "' +
        snippetName +
        '" is incompatible with ' +
        editorLanguage +
        '. Continue?',
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

  private deleteSnippet = (codeSnippet: ICodeSnippet): void => {
    showDialog({
      title: 'Delete snippet?',
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result: any) => {
      if (result.button.label == 'Cancel') {
        // When Cancel is clicked on the dialog, just return
        return;
      }

      RequestHandler.makeServerRequest(
        CODE_SNIPPET_ENDPOINT + '/' + codeSnippet.name,
        { method: 'DELETE' },
        false
      ).then((response: any): void => {
        this.props.updateSnippets();
      });
    });
  };

  // Render display of code snippet list
  private renderCodeSnippet = (codeSnippet: ICodeSnippet): JSX.Element => {
    const displayName =
      '[' + codeSnippet.language + '] ' + codeSnippet.displayName;

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
        icon: addIcon,
        onClick: (): void => {
          this.insertCodeSnippet(codeSnippet);
        }
      },
      {
        title: 'Edit',
        icon: editIcon,
        onClick: (): void => {
          this.props.openCodeSnippetEditor(
            codeSnippet.displayName,
            codeSnippet.description,
            codeSnippet.language,
            codeSnippet.code.join('\n'),
            false
          );
        }
      },
      {
        title: 'Delete',
        icon: trashIcon,
        onClick: (): void => {
          this.deleteSnippet(codeSnippet);
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
