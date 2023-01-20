/*
 * Copyright 2018-2022 Elyra Authors
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
/*
 * Copyright 2018-2022 Elyra Authors
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

import { templateIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { Cell } from '@jupyterlab/cells';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { MarkdownDocument } from '@jupyterlab/markdownviewer';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';

import { TEMPLATE_SCHEMASPACE, TEMPLATE_SCHEMA } from './TemplateService';
import { TemplateWidget } from './TemplateWidget';

const TEMPLATE_EXTENSION_ID = 'elyra-template-extension';

const commandIDs = {
  saveAsTemp: 'template:save-as-temp'
};

/**
 * Initialization data for the template extension.
 */
export const template_extension: JupyterFrontEndPlugin<void> = {
  id: TEMPLATE_EXTENSION_ID,
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer, IEditorServices],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    editorServices: IEditorServices
  ) => {
    console.log('Elyra - template extension is activated!');

    const getCurrentWidget = (): Widget | null => {
      return app.shell.currentWidget;
    };

    const templateWidget = new TemplateWidget({
      app,
      display_name: 'Templates',
      schemaspace: TEMPLATE_SCHEMASPACE,
      schema: TEMPLATE_SCHEMA,
      icon: templateIcon,
      getCurrentWidget,
      editorServices,
      titleContext: 'template'
    });
    const templateWidgetId = `elyra-metadata:${TEMPLATE_SCHEMASPACE}`;
    templateWidget.id = templateWidgetId;
    templateWidget.title.icon = templateIcon;
    templateWidget.title.caption = 'Templates';

    restorer.add(templateWidget, templateWidgetId);

    // Rank has been chosen somewhat arbitrarily to give priority to the running
    // sessions widget in the sidebar.
    app.shell.add(templateWidget, 'left', { rank: 900 });

    app.commands.addCommand(commandIDs.saveAsTemp, {
      label: 'Save As Template',
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
          templateWidget.openMetadataEditor({
            schemaspace: TEMPLATE_SCHEMASPACE,
            schema: TEMPLATE_SCHEMA,
            code: selection.split('\n'),
            onSave: templateWidget.updateMetadata
          });
        } else {
          const selectedCells = getSelectedCellContents();
          const code = selectedCells.join('\n\n').split('\n');

          templateWidget.openMetadataEditor({
            schemaspace: TEMPLATE_SCHEMASPACE,
            schema: TEMPLATE_SCHEMA,
            code: code,
            onSave: templateWidget.updateMetadata
          });
        }
      }
    });

    app.contextMenu.addItem({
      command: commandIDs.saveAsTemp,
      selector: '.jp-Cell'
    });

    app.contextMenu.addItem({
      command: commandIDs.saveAsTemp,
      selector: '.jp-FileEditor'
    });

    app.contextMenu.addItem({
      command: commandIDs.saveAsTemp,
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

export default template_extension;
