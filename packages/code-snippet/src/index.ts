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

import '../style/index.css';

import { codeSnippetIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { ICommandPalette, IThemeManager } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
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
  optional: [IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    editorServices: IEditorServices,
    themeManager?: IThemeManager
  ) => {
    console.log('Elyra - code-snippet extension is activated!');

    const getCurrentWidget = (): Widget | null => {
      return app.shell.currentWidget;
    };

    const codeSnippetWidget = new CodeSnippetWidget({
      app,
      themeManager,
      display_name: 'Code Snippets',
      schemaspace: CODE_SNIPPET_SCHEMASPACE,
      schema: CODE_SNIPPET_SCHEMA,
      icon: codeSnippetIcon,
      getCurrentWidget,
      editorServices
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

        if (selection) {
          return true;
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

        if (selection) {
          codeSnippetWidget.openMetadataEditor({
            schemaspace: CODE_SNIPPET_SCHEMASPACE,
            schema: CODE_SNIPPET_SCHEMA,
            code: selection.split('\n'),
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
      editor: any,
      markdownPreview?: boolean
    ): string => {
      const selectionObj = editor.getSelection();
      const start = editor.getOffsetAt(selectionObj.start);
      const end = editor.getOffsetAt(selectionObj.end);
      const selection = editor.model.value.text.substring(start, end);

      if (!selection && editor.model.value.text) {
        // Allow selections from a rendered notebook cell
        return document.getSelection()?.toString() ?? '';
      }

      return selection;
    };

    const isFileEditor = (currentWidget: any): boolean => {
      return (
        currentWidget instanceof DocumentWidget &&
        (currentWidget as DocumentWidget).content instanceof FileEditor
      );
    };

    const isNotebookEditor = (currentWidget: any): boolean => {
      return currentWidget instanceof NotebookPanel;
    };

    const isMarkdownDocument = (currentWidget: any): boolean => {
      return currentWidget instanceof MarkdownDocument;
    };

    const getEditor = (currentWidget: any): any => {
      if (isFileEditor(currentWidget)) {
        const documentWidget = currentWidget as DocumentWidget;
        return (documentWidget.content as FileEditor).editor;
      } else if (isNotebookEditor(currentWidget)) {
        const notebookWidget = currentWidget as NotebookPanel;
        const notebookCell = (notebookWidget.content as Notebook).activeCell;
        return notebookCell?.editor;
      }
    };
  }
};

export default code_snippet_extension;
