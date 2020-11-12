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
  IMetadata,
  IMetadataActionButton,
  IMetadataDisplayProps,
  IMetadataDisplayState,
  IMetadataWidgetProps,
  MetadataDisplay,
  MetadataWidget,
  METADATA_ITEM
} from '@elyra/metadata-common';
import {
  ExpandableComponent,
  trashIcon,
  importIcon
} from '@elyra/ui-components';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { Clipboard, Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { copyIcon, editIcon, LabIcon } from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';

import React from 'react';

import {
  CodeSnippetService,
  CODE_SNIPPET_NAMESPACE,
  CODE_SNIPPET_SCHEMA
} from './CodeSnippetService';

const METADATA_EDITOR_ID = 'elyra-metadata-editor';

/**
 * CodeSnippetDisplay props.
 */
interface ICodeSnippetDisplayProps extends IMetadataDisplayProps {
  metadata: IMetadata[];
  openMetadataEditor: (args: any) => void;
  updateMetadata: () => void;
  namespace: string;
  schema: string;
  sortMetadata: boolean;
  getCurrentWidget: () => Widget;
  editorServices: IEditorServices;
  shell: JupyterFrontEnd.IShell;
}

/**
 * A React Component for code-snippets display list.
 */
class CodeSnippetDisplay extends MetadataDisplay<
  ICodeSnippetDisplayProps,
  IMetadataDisplayState
> {
  editors: { [codeSnippetId: string]: CodeEditor.IEditor } = {};

  // Handle code snippet insert into an editor
  private insertCodeSnippet = async (snippet: IMetadata): Promise<void> => {
    const widget: Widget = this.props.getCurrentWidget();
    const snippetStr: string = snippet.metadata.code.join('\n');

    if (
      widget instanceof DocumentWidget &&
      (widget as DocumentWidget).content instanceof FileEditor
    ) {
      const documentWidget = widget as DocumentWidget;
      const fileEditor = (documentWidget.content as FileEditor).editor;
      const markdownRegex = /^\.(md|mkdn?|mdown|markdown)$/;
      if (
        PathExt.extname(widget.context.path).match(markdownRegex) !== null &&
        snippet.metadata.language.toLowerCase() !== 'markdown'
      ) {
        // Wrap snippet into a code block when inserting it into a markdown file
        fileEditor.replaceSelection(
          '```' + snippet.metadata.language + '\n' + snippetStr + '\n```'
        );
      } else if (widget.constructor.name == 'PythonFileEditor') {
        this.verifyLanguageAndInsert(snippet, 'python', fileEditor);
      } else {
        fileEditor.replaceSelection(snippetStr);
      }
    } else if (widget instanceof NotebookPanel) {
      const notebookWidget = widget as NotebookPanel;
      const notebookCell = (notebookWidget.content as Notebook).activeCell;
      const notebookCellIndex = (notebookWidget.content as Notebook)
        .activeCellIndex;
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
        snippet.metadata.language.toLowerCase() !== 'markdown'
      ) {
        // Wrap snippet into a code block when inserting it into a markdown cell
        notebookCellEditor.replaceSelection(
          '```' + snippet.metadata.language + '\n' + snippetStr + '\n```'
        );
      } else {
        notebookCellEditor.replaceSelection(snippetStr);
      }
      const cell = notebookWidget.model.contentFactory.createCodeCell({});
      notebookWidget.model.cells.insert(notebookCellIndex + 1, cell);
    } else {
      this.showErrDialog('Code snippet insert failed: Unsupported widget');
    }
  };

  // Handle language compatibility between code snippet and editor
  private verifyLanguageAndInsert = async (
    snippet: IMetadata,
    editorLanguage: string,
    editor: CodeEditor.IEditor
  ): Promise<void> => {
    const snippetStr: string = snippet.metadata.code.join('\n');
    if (
      editorLanguage &&
      snippet.metadata.language.toLowerCase() !== editorLanguage.toLowerCase()
    ) {
      const result = await this.showWarnDialog(
        editorLanguage,
        snippet.display_name
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

  actionButtons = (metadata: IMetadata): IMetadataActionButton[] => {
    return [
      {
        title: 'Copy',
        icon: copyIcon,
        feedback: 'Copied!',
        onClick: (): void => {
          Clipboard.copyToSystem(metadata.metadata.code.join('\n'));
        }
      },
      {
        title: 'Insert',
        icon: importIcon,
        onClick: (): void => {
          this.insertCodeSnippet(metadata);
        }
      },
      {
        title: 'Edit',
        icon: editIcon,
        onClick: (): void => {
          this.props.openMetadataEditor({
            onSave: this.props.updateMetadata,
            namespace: CODE_SNIPPET_NAMESPACE,
            schema: CODE_SNIPPET_SCHEMA,
            name: metadata.name
          });
        }
      },
      {
        title: 'Delete',
        icon: trashIcon,
        onClick: (): void => {
          CodeSnippetService.deleteCodeSnippet(metadata).then(
            (deleted: any): void => {
              if (deleted) {
                this.props.updateMetadata();
                delete this.editors[metadata.name];
                const editorWidget = find(
                  this.props.shell.widgets('main'),
                  (value: Widget, index: number) => {
                    return (
                      value.id ==
                      `${METADATA_EDITOR_ID}:${CODE_SNIPPET_NAMESPACE}:${CODE_SNIPPET_SCHEMA}:${metadata.name}`
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
  };

  getDisplayName(metadata: IMetadata): string {
    return `[${metadata.metadata.language}] ${metadata.display_name}`;
  }

  sortMetadata(): void {
    this.props.metadata.sort((a, b) =>
      this.getDisplayName(a).localeCompare(this.getDisplayName(b))
    );
  }

  matchesSearch(searchValue: string, metadata: IMetadata): boolean {
    searchValue = searchValue.toLowerCase();
    // True if search string is in name, display_name, or language of snippet
    // or if the search string is empty
    return (
      metadata.name.toLowerCase().includes(searchValue) ||
      metadata.display_name.toLowerCase().includes(searchValue) ||
      metadata.metadata.language.toLowerCase().includes(searchValue)
    );
  }

  // Render display of a code snippet
  renderMetadata = (metadata: IMetadata): JSX.Element => {
    return (
      <div
        key={metadata.name}
        className={METADATA_ITEM}
        style={
          this.state.metadata.includes(metadata) ? {} : { display: 'none' }
        }
      >
        <ExpandableComponent
          displayName={this.getDisplayName(metadata)}
          tooltip={metadata.metadata.description}
          actionButtons={this.actionButtons(metadata)}
          onExpand={(): void => {
            this.editors[metadata.name].refresh();
          }}
        >
          <div id={metadata.name}></div>
        </ExpandableComponent>
      </div>
    );
  };

  componentDidUpdate(): void {
    const editorFactory = this.props.editorServices.factoryService
      .newInlineEditor;
    const getMimeTypeByLanguage = this.props.editorServices.mimeTypeService
      .getMimeTypeByLanguage;
    this.props.metadata.map((codeSnippet: IMetadata) => {
      if (codeSnippet.name in this.editors) {
        // Make sure code is up to date
        this.editors[
          codeSnippet.name
        ].model.value.text = codeSnippet.metadata.code.join('\n');
      } else {
        // Add new snippets
        this.editors[codeSnippet.name] = editorFactory({
          config: { readOnly: true },
          host: document.getElementById(codeSnippet.name),
          model: new CodeEditor.Model({
            value: codeSnippet.metadata.code.join('\n'),
            mimeType: getMimeTypeByLanguage({
              name: codeSnippet.metadata.language,
              codemirror_mode: codeSnippet.metadata.language
            })
          })
        });
      }
    });
  }
}

/**
 * CodeSnippetWidget props.
 */
export interface ICodeSnippetWidgetProps extends IMetadataWidgetProps {
  app: JupyterFrontEnd;
  display_name: string;
  namespace: string;
  schema: string;
  icon: LabIcon;
  getCurrentWidget: () => Widget;
  editorServices: IEditorServices;
}

/**
 * A widget for Code Snippets.
 */
export class CodeSnippetWidget extends MetadataWidget {
  props: ICodeSnippetWidgetProps;

  constructor(props: ICodeSnippetWidgetProps) {
    super(props);
  }

  // Request code snippets from server
  async fetchMetadata(): Promise<any> {
    return await CodeSnippetService.findAll();
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    return (
      <CodeSnippetDisplay
        metadata={metadata}
        openMetadataEditor={this.openMetadataEditor}
        updateMetadata={this.updateMetadata}
        namespace={CODE_SNIPPET_NAMESPACE}
        schema={CODE_SNIPPET_SCHEMA}
        getCurrentWidget={this.props.getCurrentWidget}
        editorServices={this.props.editorServices}
        shell={this.props.app.shell}
        sortMetadata={true}
      />
    );
  }
}
