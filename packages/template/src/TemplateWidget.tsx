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

import {
  IMetadata,
  IMetadataActionButton,
  IMetadataDisplayProps,
  IMetadataDisplayState,
  IMetadataWidgetProps,
  MetadataCommonService,
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
import {
  copyIcon,
  editIcon,
  pasteIcon,
  LabIcon
} from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { MimeData } from '@lumino/coreutils';
import { Drag } from '@lumino/dragdrop';
import { Widget } from '@lumino/widgets';

import React from 'react';

import {
  TemplateService,
  TEMPLATE_SCHEMASPACE,
  TEMPLATE_SCHEMA
} from './TemplateService';

const METADATA_EDITOR_ID = 'elyra-metadata-editor';
const TEMP_DRAG_IMAGE_CLASS = 'elyra-template-drag-image';
const TEMPLATES_METADATA_CLASS = 'elyra-metadata-templates';

/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;

/**
 * The mimetype used for Jupyter cell data.
 */
const JUPYTER_CELL_MIME = 'application/vnd.jupyter.cells';

/**
 * TemplateDisplay props.
 */
interface ITemplateDisplayProps extends IMetadataDisplayProps {
  metadata: IMetadata[];
  openMetadataEditor: (args: any) => void;
  updateMetadata: () => void;
  schemaspace: string;
  schema: string;
  sortMetadata: boolean;
  className: string;
  getCurrentWidget: () => Widget | null;
  editorServices: IEditorServices;
  shell: JupyterFrontEnd.IShell;
}

/**
 * A React Component for templates display list.
 */
class TemplateDisplay extends MetadataDisplay<
  ITemplateDisplayProps,
  IMetadataDisplayState
> {
  editors: { [templateId: string]: CodeEditor.IEditor } = {};

  constructor(props: ITemplateDisplayProps) {
    super(props);
    this._drag = null;
    this._dragData = null;
    this.handleDragMove = this.handleDragMove.bind(this);
    this._evtMouseUp = this._evtMouseUp.bind(this);
  }

  // Handle template insertion into an editor
  private insertTemplate = async (temp: IMetadata): Promise<void> => {
    const widget = this.props.getCurrentWidget();
    const template = temp.metadata.code.join('\n');
    const tempLanguage = temp.metadata.language;

    if (widget === null) {
      return;
    }

    if (this.isFileEditor(widget)) {
      const fileEditor = widget.content.editor;
      const markdownRegex = /^\.(md|mkdn?|mdown|markdown)$/;
      const editorLanguage = this.getEditorLanguage(widget);

      if (
        PathExt.extname(widget.context.path).match(markdownRegex) !== null &&
        tempLanguage.toLowerCase() !== 'markdown'
      ) {
        fileEditor.replaceSelection?.(
          this.addMarkdownCodeBlock(tempLanguage, template)
        );
      } else if (editorLanguage) {
        this.verifyLanguageAndInsert(temp, editorLanguage, fileEditor);
      } else {
        fileEditor.replaceSelection?.(template);
      }
    } else if (widget instanceof NotebookPanel) {
      const notebookWidget = widget as NotebookPanel;
      const notebookCell = (notebookWidget.content as Notebook).activeCell;
      const notebookCellIndex = (notebookWidget.content as Notebook)
        .activeCellIndex;

      if (notebookCell === null) {
        return;
      }

      const notebookCellEditor = notebookCell.editor;

      if (notebookCell instanceof CodeCell) {
        const kernelInfo = await notebookWidget.sessionContext.session?.kernel
          ?.info;
        const kernelLanguage: string = kernelInfo?.language_info.name || '';
        this.verifyLanguageAndInsert(temp, kernelLanguage, notebookCellEditor);
      } else if (
        notebookCell instanceof MarkdownCell &&
        tempLanguage.toLowerCase() !== 'markdown'
      ) {
        notebookCellEditor.replaceSelection?.(
          this.addMarkdownCodeBlock(tempLanguage, template)
        );
      } else {
        notebookCellEditor.replaceSelection?.(template);
      }
      const cell = notebookWidget.model?.contentFactory.createCodeCell({});
      if (cell === undefined) {
        return;
      }
      notebookWidget.model?.cells.insert(notebookCellIndex + 1, cell);
    } else {
      this.showErrDialog('Template insert failed: Unsupported widget');
    }
  };

  // Verify if a given widget is a FileEditor
  private isFileEditor = (
    widget: Widget
  ): widget is DocumentWidget<FileEditor> => {
    return (widget as DocumentWidget).content instanceof FileEditor;
  };

  // Return the language of the editor or empty string
  private getEditorLanguage = (
    widget: DocumentWidget<FileEditor>
  ): string | undefined => {
    const editorLanguage =
      widget.context.sessionContext.kernelPreference.language;
    return editorLanguage === 'null' ? '' : editorLanguage;
  };

  // Return the given code wrapped in a markdown code block
  private addMarkdownCodeBlock = (language: string, code: string): string => {
    return '```' + language + '\n' + code + '\n```';
  };

  // Handle language compatibility between template and editor
  private verifyLanguageAndInsert = async (
    temp: IMetadata,
    editorLanguage: string,
    editor: CodeEditor.IEditor
  ): Promise<void> => {
    const template: string = temp.metadata.code.join('\n');
    const tempLanguage = temp.metadata.language;
    if (
      editorLanguage &&
      tempLanguage.toLowerCase() !== editorLanguage.toLowerCase()
    ) {
      const result = await this.showWarnDialog(
        editorLanguage,
        temp.display_name
      );
      if (result.button.accept) {
        editor.replaceSelection?.(template);
      }
    } else {
      // Language match or editorLanguage is unavailable
      editor.replaceSelection?.(template);
    }
  };

  // Display warning dialog when inserting a template incompatible with editor's language
  private showWarnDialog = async (
    editorLanguage: string,
    tempName: string
  ): Promise<Dialog.IResult<string>> => {
    return showDialog({
      title: 'Warning',
      body: `Template "${tempName}" is incompatible with ${editorLanguage}. Continue?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    });
  };

  // Display error dialog when inserting a template into unsupported widget (i.e. not an editor)
  private showErrDialog = (errMsg: string): Promise<Dialog.IResult<string>> => {
    return showDialog({
      title: 'Error',
      body: errMsg,
      buttons: [Dialog.okButton()]
    });
  };

  // Initial setup to handle dragging a template
  private handleDragTemp(
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
      element.classList.add(TEMP_DRAG_IMAGE_CLASS);
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
        title: 'Copy to clipboard',
        icon: pasteIcon,
        feedback: 'Copied!',
        onClick: (): void => {
          Clipboard.copyToSystem(metadata.metadata.code.join('\n'));
        }
      },
      {
        title: 'Insert',
        icon: importIcon,
        onClick: (): void => {
          this.insertTemplate(metadata);
        }
      },
      {
        title: 'Edit',
        icon: editIcon,
        onClick: (): void => {
          this.props.openMetadataEditor({
            onSave: this.props.updateMetadata,
            schemaspace: TEMPLATE_SCHEMASPACE,
            schema: TEMPLATE_SCHEMA,
            name: metadata.name
          });
        }
      },
      {
        title: 'Duplicate',
        icon: copyIcon,
        onClick: (): void => {
          MetadataCommonService.duplicateMetadataInstance(
            TEMPLATE_SCHEMASPACE,
            metadata,
            this.props.metadata
          )
            .then((response: any): void => {
              this.props.updateMetadata();
            })
            .catch(error => RequestErrors.serverError(error));
        }
      },
      {
        title: 'Delete',
        icon: trashIcon,
        onClick: (): void => {
          TemplateService.deleteTemplate(metadata)
            .then((deleted: any): void => {
              if (deleted) {
                this.props.updateMetadata();
                delete this.editors[metadata.name];
                const editorWidget = find(
                  this.props.shell.widgets('main'),
                  (value: Widget, index: number) => {
                    return (
                      value.id ===
                      `${METADATA_EDITOR_ID}:${TEMPLATE_SCHEMASPACE}:${TEMPLATE_SCHEMA}:${metadata.name}`
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
    // True if search string is in name, display_name, or language of temp
    // or if the search string is empty
    return (
      metadata.name.toLowerCase().includes(searchValue) ||
      metadata.display_name.toLowerCase().includes(searchValue) ||
      metadata.metadata.language.toLowerCase().includes(searchValue)
    );
  }

  // Render display of a template
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
            this.handleDragTemp(event, metadata);
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
    this.props.metadata.map((template: IMetadata) => {
      if (template.name in this.editors) {
        // Make sure code is up to date
        this.editors[
          template.name
        ].model.value.text = template.metadata.code.join('\n');
      } else {
        // Add new temps
        const tempElement = document.getElementById(template.name);
        if (tempElement === null) {
          return;
        }
        this.editors[template.name] = editorFactory({
          config: { readOnly: true },
          host: tempElement,
          model: new CodeEditor.Model({
            value: template.metadata.code.join('\n'),
            mimeType: getMimeTypeByLanguage({
              name: template.metadata.language,
              codemirror_mode: template.metadata.language
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

  private _drag: Drag | null;
  private _dragData: {
    pressX: number;
    pressY: number;
    dragImage: HTMLElement | null;
  } | null;
}

/**
 * TemplateWidget props.
 */
export interface ITemplateWidgetProps extends IMetadataWidgetProps {
  app: JupyterFrontEnd;
  display_name: string;
  schemaspace: string;
  schema: string;
  icon: LabIcon;
  getCurrentWidget: () => Widget | null;
  editorServices: IEditorServices;
}

/**
 * A widget for Templates.
 */
export class TemplateWidget extends MetadataWidget {
  constructor(public props: ITemplateWidgetProps) {
    super(props);
  }

  // Request templates from server
  async fetchMetadata(): Promise<any> {
    return TemplateService.findAll().catch(error =>
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
            Click the + button to add {this.props.display_name.toLowerCase()}
          </h6>
        </div>
      );
    }

    return (
      <TemplateDisplay
        metadata={metadata}
        openMetadataEditor={this.openMetadataEditor}
        updateMetadata={this.updateMetadata}
        schemaspace={TEMPLATE_SCHEMASPACE}
        schema={TEMPLATE_SCHEMA}
        getCurrentWidget={this.props.getCurrentWidget}
        className={TEMPLATES_METADATA_CLASS}
        editorServices={this.props.editorServices}
        shell={this.props.app.shell}
        sortMetadata={true}
      />
    );
  }
}
