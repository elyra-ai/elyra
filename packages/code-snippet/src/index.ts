/*
 * Copyright 2018-2020 Elyra Authors
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
import { IEditorServices } from '@jupyterlab/codeeditor';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';

import { Widget } from '@lumino/widgets';

import {
  CODE_SNIPPET_NAMESPACE,
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

    const getCurrentWidget = (): Widget => {
      return app.shell.currentWidget;
    };

    const codeSnippetWidget = new CodeSnippetWidget({
      app,
      display_name: 'Code Snippets',
      namespace: CODE_SNIPPET_NAMESPACE,
      schema: CODE_SNIPPET_SCHEMA,
      icon: codeSnippetIcon,
      getCurrentWidget,
      editorServices
    });
    const codeSnippetWidgetId = `elyra-metadata:${CODE_SNIPPET_NAMESPACE}:${CODE_SNIPPET_SCHEMA}`;
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

        if (editor) {
          const selection = getTextSelection(editor);
          if (selection) {
            return true;
          }
          return false;
        }
        return false;
      },
      isVisible: () => true,
      execute: () => {
        const currentWidget = app.shell.currentWidget;
        const editor = getEditor(currentWidget);
        if (editor) {
          const selection = getTextSelection(editor);

          console.log('SAVING AS CODE SNIPPET...');
          console.log('SELECTION: ' + selection);
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

    const getTextSelection = (editor: any): any => {
      const selectionObj = editor.getSelection();
      const start = editor.getOffsetAt(selectionObj.start);
      const end = editor.getOffsetAt(selectionObj.end);
      const selection = editor.model.value.text.substring(start, end);

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

    const getEditor = (currentWidget: any): any => {
      if (isFileEditor(currentWidget)) {
        const documentWidget = currentWidget as DocumentWidget;
        return (documentWidget.content as FileEditor).editor;
      } else if (isNotebookEditor(currentWidget)) {
        const notebookWidget = currentWidget as NotebookPanel;
        const notebookCell = (notebookWidget.content as Notebook).activeCell;
        return notebookCell.editor;
      }
    };
  }
};

export default code_snippet_extension;
