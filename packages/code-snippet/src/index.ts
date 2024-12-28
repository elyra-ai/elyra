/*
 * Copyright 2018-2023 Elyra Authors
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

import { codeSnippetIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { Cell } from '@jupyterlab/cells';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { MarkdownDocument } from '@jupyterlab/markdownviewer';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';

import {
  CODE_SNIPPET_SCHEMASPACE,
  CODE_SNIPPET_SCHEMA
} from './CodeSnippetService';
import { CodeSnippetWidget } from './CodeSnippetWidget';

const CODE_SNIPPET_EXTENSION_ID = 'elyra-code-snippet-extension';

const commandIDs = {
  saveAsSnippet: 'codesnippet:save-as-snippet'
};

/**
 * Initialization data for the code-snippet extension.
 */
export const code_snippet_extension: JupyterFrontEndPlugin<void> = {
  id: CODE_SNIPPET_EXTENSION_ID,
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer, IEditorServices],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    editorServices: IEditorServices
  ) => {
    console.log('Elyra - code-snippet extension is activated!');

    const getCurrentWidget = (): Widget | null => {
      return app.shell.currentWidget;
    };

    const codeSnippetWidget = new CodeSnippetWidget({
      app,
      display_name: 'Code Snippets',
      schemaspace: CODE_SNIPPET_SCHEMASPACE,
      schema: CODE_SNIPPET_SCHEMA,
      icon: codeSnippetIcon,
      getCurrentWidget,
      editorServices,
      titleContext: '',
      addLabel: 'code snippet'
    });
    const codeSnippetWidgetId = `elyra-metadata:${CODE_SNIPPET_SCHEMASPACE}`;
    codeSnippetWidget.id = codeSnippetWidgetId;
    codeSnippetWidget.title.icon = codeSnippetIcon;
    codeSnippetWidget.title.caption = 'Code Snippets';

    restorer.add(codeSnippetWidget, codeSnippetWidgetId);

    // Rank has been chosen somewhat arbitrarily to give priority to the running
    // sessions widget in the sidebar.
    app.shell.add(codeSnippetWidget, 'left', { rank: 900 });

    app.commands.addCommand(commandIDs.saveAsSnippet, {
      label: 'Save As Code Snippet',
      isEnabled: () => {
        const currentWidget = app.shell.currentWidget;
        const editor = getEditor(currentWidget);
        let selection = '';

        if (editor) {
          selection = getTextSelection(editor);
        } else if (isMarkdownDocument(currentWidget)) {
          selection = document.getSelection()?.toString() ?? '';
        }

        if (selection.length > 0) {
          return true;
        }

        if (isNotebookEditor(currentWidget)) {
          if (getSelectedCellContents().length > 0) {
            return true;
          }
        }

        return false;
      },
      isVisible: () => true,
      execute: () => {
        const currentWidget = app.shell.currentWidget;
        const editor = getEditor(currentWidget);
        let selection = '';

        if (editor) {
          selection = getTextSelection(editor);
        } else if (isMarkdownDocument(currentWidget)) {
          selection = document.getSelection()?.toString() ?? '';
        }

        if (selection.length > 0) {
          codeSnippetWidget.openMetadataEditor({
            schemaspace: CODE_SNIPPET_SCHEMASPACE,
            schema: CODE_SNIPPET_SCHEMA,
            code: selection.split('\n'),
            onSave: codeSnippetWidget.updateMetadata
          });
        } else {
          const selectedCells = getSelectedCellContents();
          const code = selectedCells.join('\n\n').split('\n');

          codeSnippetWidget.openMetadataEditor({
            schemaspace: CODE_SNIPPET_SCHEMASPACE,
            schema: CODE_SNIPPET_SCHEMA,
            code: code,
            onSave: codeSnippetWidget.updateMetadata
          });
        }
      }
    });

    app.contextMenu.addItem({
      command: commandIDs.saveAsSnippet,
      selector: '.jp-Cell'
    });

    app.contextMenu.addItem({
      command: commandIDs.saveAsSnippet,
      selector: '.jp-FileEditor'
    });

    app.contextMenu.addItem({
      command: commandIDs.saveAsSnippet,
      selector: '.jp-MarkdownViewer'
    });

    const getTextSelection = (
      editor: CodeEditor.IEditor,
      markdownPreview?: boolean
    ): string => {
      const selectionObj = editor.getSelection();
      const start = editor.getOffsetAt(selectionObj.start);
      const end = editor.getOffsetAt(selectionObj.end);
      const source = editor.model.sharedModel.getSource();
      const selection = source.substring(start, end);

      if (!selection && source) {
        // Allow selections from a rendered notebook cell
        return document.getSelection()?.toString() ?? '';
      }

      return selection;
    };

    const getSelectedCellContents = (): string[] => {
      const currentWidget = app.shell.currentWidget;
      const notebookWidget = currentWidget as NotebookPanel;
      const notebook = notebookWidget.content as Notebook;
      const notebookCell = notebook.activeCell;
      const selectedCells: string[] = [];

      if (notebookCell) {
        const allCells = notebook.widgets;

        allCells.forEach((cell: Cell) => {
          if (notebook.isSelectedOrActive(cell)) {
            const contents: string = cell.model.toJSON().source.toString();

            if (contents.length > 0) selectedCells.push(contents);
          }
        });
      }

      return selectedCells;
    };

    const isFileEditor = (currentWidget: Widget | null): boolean => {
      return (
        currentWidget instanceof DocumentWidget &&
        (currentWidget as DocumentWidget).content instanceof FileEditor
      );
    };

    const isNotebookEditor = (currentWidget: Widget | null): boolean => {
      return currentWidget instanceof NotebookPanel;
    };

    const isMarkdownDocument = (currentWidget: Widget | null): boolean => {
      return currentWidget instanceof MarkdownDocument;
    };

    const getEditor = (
      currentWidget: Widget | null
    ): CodeEditor.IEditor | null | undefined => {
      if (isFileEditor(currentWidget)) {
        const documentWidget = currentWidget as DocumentWidget;
        return (documentWidget.content as FileEditor).editor;
      } else if (isNotebookEditor(currentWidget)) {
        const notebookWidget = currentWidget as NotebookPanel;
        const notebookCell = (notebookWidget.content as Notebook).activeCell;
        return notebookCell?.editor;
      }
      return undefined;
    };
  }
};

export default code_snippet_extension;
