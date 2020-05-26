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
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';

import { Widget } from '@lumino/widgets';

// Handle code snippet insert into an editor
export const insertCodeSnippet = async (
  snippetLanguage: string,
  snippetStr: string,
  getCurrentWidget: () => Widget
): Promise<void> => {
  const widget: Widget = getCurrentWidget();

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
        '```' + snippetLanguage + '\n' + snippetStr + '\n```'
      );
    } else if (widget.constructor.name == 'PythonFileEditor') {
      verifyLanguageAndInsert(
        snippetLanguage,
        snippetStr,
        'python',
        fileEditor
      );
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
      verifyLanguageAndInsert(
        snippetLanguage,
        snippetStr,
        kernelLanguage,
        notebookCellEditor
      );
    } else if (notebookCell instanceof MarkdownCell) {
      // Wrap snippet into a code block when inserting it into a markdown cell
      notebookCellEditor.replaceSelection(
        '```' + snippetLanguage + '\n' + snippetStr + '\n```'
      );
    } else {
      notebookCellEditor.replaceSelection(snippetStr);
    }
  } else {
    showErrDialog('Code snippet insert failed: Unsupported widget');
  }
};

// Handle language compatibility between code snippet and editor
export const verifyLanguageAndInsert = async (
  snippetLanguage: string,
  snippetStr: string,
  editorLanguage: string,
  editor: CodeEditor.IEditor
): Promise<void> => {
  if (
    editorLanguage &&
    snippetLanguage.toLowerCase() !== editorLanguage.toLowerCase()
  ) {
    const result = await showWarnDialog(editorLanguage);
    if (result.button.accept) {
      editor.replaceSelection(snippetStr);
    }
  } else {
    // Language match or editorLanguage is unavailable
    editor.replaceSelection(snippetStr);
  }
};

// Display warning dialog when inserting a code snippet incompatible with editor's language
export const showWarnDialog = async (
  editorLanguage: string
): Promise<Dialog.IResult<string>> => {
  return showDialog({
    title: 'Warning',
    body: 'Code snippet is incompatible with ' + editorLanguage + '. Continue?',
    buttons: [Dialog.cancelButton(), Dialog.okButton()]
  });
};

// Display error dialog when inserting a code snippet into unsupported widget (i.e. not an editor)
export const showErrDialog = (
  errMsg: string
): Promise<Dialog.IResult<string>> => {
  return showDialog({
    title: 'Error',
    body: errMsg,
    buttons: [Dialog.okButton()]
  });
};
