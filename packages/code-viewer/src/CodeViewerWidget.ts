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

import { CodeEditor, CodeEditorWrapper } from '@jupyterlab/codeeditor';
import { StackedLayout, Widget } from '@lumino/widgets';

export class CodeViewerWidget extends Widget {
  /**
   * Construct a new code viewer widget.
   */
  constructor(options: CodeViewerWidget.IOptions) {
    super();
    this.model = options.model;

    const editorWidget = new CodeEditorWrapper({
      factory: options.factory,
      model: options.model
    });
    this.editor = editorWidget.editor;
    this.editor.setOption('readOnly', true);

    const layout = (this.layout = new StackedLayout());
    layout.addWidget(editorWidget);
  }

  static getCodeViewer(
    options: CodeViewerWidget.INoModelOptions
  ): CodeViewerWidget {
    const model = new CodeEditor.Model({
      value: options.content,
      mimeType: options.mimeType
    });
    return new CodeViewerWidget({ factory: options.factory, model });
  }

  getContent = (): string => this.model.value.text;
  getMimeType = (): string => this.model.mimeType;

  model: CodeEditor.IModel;
  editor: CodeEditor.IEditor;
}

/**
 * The namespace for code viewer widget.
 */
export namespace CodeViewerWidget {
  /**
   * The options used to create an code viewer widget.
   */
  export interface IOptions {
    /**
     * A code editor factory.
     */
    factory: CodeEditor.Factory;

    /**
     * The content model for the viewer.
     */
    model: CodeEditor.Model;
  }

  /**
   * The options used to create an code viewer widget without a model.
   */
  export interface INoModelOptions {
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
