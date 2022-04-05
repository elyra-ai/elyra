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

import { CodeEditor, CodeEditorWrapper } from '@jupyterlab/codeeditor';
import { StackedLayout, Widget } from '@lumino/widgets';

export class CodeViewerWidget extends Widget {
  /**
   * Construct a new text viewer widget.
   */
  constructor(options: CodeViewerWidget.IOptions) {
    super();

    this.model = new CodeEditor.Model({
      value: options.content,
      mimeType: options.mimeType
    });

    const editorWidget = (this.editorWidget = new CodeEditorWrapper({
      factory: options.factory,
      model: this.model
    }));
    this.editor = editorWidget.editor;
    this.editor.setOption('readOnly', true);

    const layout = (this.layout = new StackedLayout());
    layout.addWidget(editorWidget);
  }

  private editorWidget: CodeEditorWrapper;
  public model: CodeEditor.IModel;
  public editor: CodeEditor.IEditor;
}

/**
 * The namespace for text viewer widget.
 */
export namespace CodeViewerWidget {
  /**
   * The options used to create an text viewer widget.
   */
  export interface IOptions {
    /**
     * A code editor factory.
     */
    factory: CodeEditor.Factory;

    /**
     * The content to display in the viewer.
     */
    content: string;

    /**
     * The mime type for the content.
     */
    mimeType?: string;
  }
}
