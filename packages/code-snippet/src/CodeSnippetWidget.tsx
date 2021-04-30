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
  importIcon,
  RequestErrors,
  trashIcon
} from '@elyra/ui-components';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { Clipboard, Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import * as nbformat from '@jupyterlab/nbformat';
import { Notebook, NotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { copyIcon, editIcon, LabIcon } from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { MimeData } from '@lumino/coreutils';
import { Drag } from '@lumino/dragdrop';
import { Widget } from '@lumino/widgets';

import React from 'react';

import {
  CodeSnippetService,
  CODE_SNIPPET_NAMESPACE,
  CODE_SNIPPET_SCHEMA
} from './CodeSnippetService';

const METADATA_EDITOR_ID = 'elyra-metadata-editor';
const SNIPPET_DRAG_IMAGE_CLASS = 'elyra-codeSnippet-drag-image';
const CODE_SNIPPETS_METADATA_CLASS = 'elyra-metadata-code-snippets';

/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;

/**
 * The mimetype used for Jupyter cell data.
 */
const JUPYTER_CELL_MIME = 'application/vnd.jupyter.cells';

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
  className: string;
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

  constructor(props: ICodeSnippetDisplayProps) {
    super(props);
    this._drag = null;
    this._dragData = null;
    this.handleDragMove = this.handleDragMove.bind(this);
    this._evtMouseUp = this._evtMouseUp.bind(this);
  }

  // Handle code snippet insertion into an editor
  private insertCodeSnippet = async (snippet: IMetadata): Promise<void> => {
    const widget = this.props.getCurrentWidget();
    const snippetStr = snippet.metadata.code.join('\n');

    if (this.isFileEditor(widget)) {
      const fileEditor = widget.content.editor;
      const markdownRegex = /^\.(md|mkdn?|mdown|markdown)$/;
      if (
        PathExt.extname(widget.context.path).match(markdownRegex) !== null &&
        snippet.metadata.language.toLowerCase() !== 'markdown'
      ) {
        fileEditor.replaceSelection(
          this.addMarkdownCodeBlock(snippet.metadata.language, snippetStr)
        );
      } else if (widget.constructor.name === 'ScriptEditor') {
        const editorLanguage =
          widget.context.sessionContext.kernelPreference.language;
        this.verifyLanguageAndInsert(snippet, editorLanguage, fileEditor);
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
        notebookCellEditor.replaceSelection(
          this.addMarkdownCodeBlock(snippet.metadata.language, snippetStr)
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

  // Verify if a given widget is a FileEditor
  private isFileEditor = (
    widget: Widget
  ): widget is DocumentWidget<FileEditor> => {
    return (widget as DocumentWidget).content instanceof FileEditor;
  };

  // Return the given code wrapped in a markdown code block
  private addMarkdownCodeBlock = (language: string, code: string): string => {
    return '```' + language + '\n' + code + '\n```';
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

  // Initial setup to handle dragging a code snippet
  private handleDragSnippet(
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    metadata: IMetadata
  ): void {
    const { button } = event;

    // do nothing if left mouse button is clicked
    if (button !== 0) {
      return;
    }

    this._dragData = {
      pressX: event.clientX,
      pressY: event.clientY,
      dragImage: null
    };

    const mouseUpListener = (event: MouseEvent): void => {
      this._evtMouseUp(event, metadata, mouseMoveListener);
    };
    const mouseMoveListener = (event: MouseEvent): void => {
      this.handleDragMove(event, metadata, mouseMoveListener, mouseUpListener);
    };

    const target = event.target as HTMLElement;
    target.addEventListener('mouseup', mouseUpListener, {
      once: true,
      capture: true
    });
    target.addEventListener('mousemove', mouseMoveListener, true);

    // since a browser has its own drag'n'drop support for images and some other elements.
    target.ondragstart = (): boolean => false;
  }

  private _evtMouseUp(
    event: MouseEvent,
    metadata: IMetadata,
    mouseMoveListener: (event: MouseEvent) => void
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    target.removeEventListener('mousemove', mouseMoveListener, true);
  }

  private handleDragMove(
    event: MouseEvent,
    metadata: IMetadata,
    mouseMoveListener: (event: MouseEvent) => void,
    mouseUpListener: (event: MouseEvent) => void
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const data = this._dragData;

    if (
      data &&
      this.shouldStartDrag(
        data.pressX,
        data.pressY,
        event.clientX,
        event.clientY
      )
    ) {
      // Create drag image
      const element = document.createElement('div');
      element.innerHTML = this.getDisplayName(metadata);
      element.classList.add(SNIPPET_DRAG_IMAGE_CLASS);
      data.dragImage = element;

      // Remove mouse listeners and start the drag.
      const target = event.target as HTMLElement;
      target.removeEventListener('mousemove', mouseMoveListener, true);
      target.removeEventListener('mouseup', mouseUpListener, true);

      void this.startDrag(
        data.dragImage,
        metadata,
        event.clientX,
        event.clientY
      );
    }
  }

  /**
   * Detect if a drag event should be started. This is down if the
   * mouse is moved beyond a certain distance (DRAG_THRESHOLD).
   *
   * @param prevX - X Coordinate of the mouse pointer during the mousedown event
   * @param prevY - Y Coordinate of the mouse pointer during the mousedown event
   * @param nextX - Current X Coordinate of the mouse pointer
   * @param nextY - Current Y Coordinate of the mouse pointer
   */
  private shouldStartDrag(
    prevX: number,
    prevY: number,
    nextX: number,
    nextY: number
  ): boolean {
    const dx = Math.abs(nextX - prevX);
    const dy = Math.abs(nextY - prevY);
    return dx >= 0 || dy >= DRAG_THRESHOLD;
  }

  private async startDrag(
    dragImage: HTMLElement,
    metadata: IMetadata,
    clientX: number,
    clientY: number
  ): Promise<void> {
    const contentFactory = new NotebookModel.ContentFactory({});
    const language = metadata.metadata.language;
    const model =
      language.toLowerCase() !== 'markdown'
        ? contentFactory.createCodeCell({})
        : contentFactory.createMarkdownCell({});
    const content = metadata.metadata.code.join('\n');
    model.value.text = content;

    this._drag = new Drag({
      mimeData: new MimeData(),
      dragImage: dragImage,
      supportedActions: 'copy-move',
      proposedAction: 'copy',
      source: this
    });

    const selected: nbformat.ICell[] = [model.toJSON()];
    this._drag.mimeData.setData(JUPYTER_CELL_MIME, selected);
    this._drag.mimeData.setData('text/plain', content);

    return this._drag.start(clientX, clientY).then(() => {
      this._drag = null;
      this._dragData = null;
    });
  }

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
          CodeSnippetService.deleteCodeSnippet(metadata)
            .then((deleted: any): void => {
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
            })
            .catch(error => RequestErrors.serverError(error));
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
        data-item-id={metadata.display_name}
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
          onMouseDown={(event: any): void => {
            this.handleDragSnippet(event, metadata);
          }}
        >
          <div id={metadata.name}></div>
        </ExpandableComponent>
      </div>
    );
  };

  createPreviewEditors = (): void => {
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
  };

  componentDidMount(): void {
    this.createPreviewEditors();
  }

  componentDidUpdate(): void {
    this.createPreviewEditors();
  }

  private _drag: Drag;
  private _dragData: { pressX: number; pressY: number; dragImage: HTMLElement };
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
    return CodeSnippetService.findAll().catch(error =>
      RequestErrors.serverError(error)
    );
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    if (Array.isArray(metadata) && !metadata.length) {
      // Empty metadata
      return (
        <div>
          <br />
          <h6 className="elyra-no-metadata-msg">
            Click the + button to add a new Code Snippet
          </h6>
        </div>
      );
    }

    return (
      <CodeSnippetDisplay
        metadata={metadata}
        openMetadataEditor={this.openMetadataEditor}
        updateMetadata={this.updateMetadata}
        namespace={CODE_SNIPPET_NAMESPACE}
        schema={CODE_SNIPPET_SCHEMA}
        getCurrentWidget={this.props.getCurrentWidget}
        className={CODE_SNIPPETS_METADATA_CLASS}
        editorServices={this.props.editorServices}
        shell={this.props.app.shell}
        sortMetadata={true}
      />
    );
  }
}
