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
import { ScriptEditor } from '@elyra/script-editor';

import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget
} from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';

import { Widget } from '@lumino/widgets';

export class REditor extends ScriptEditor {
  /**
   * Construct a new R Editor widget.
   */
  constructor(
    options: DocumentWidget.IOptions<FileEditor, DocumentRegistry.ICodeModel>,
    getCurrentWidget: () => Widget | null
  ) {
    super(options, 'R', getCurrentWidget);

    // Add icon to main tab
    this.title.icon = 'rIcon';
  }
}

/**
 * A widget factory for R Editors.
 */
export class REditorFactory extends ABCWidgetFactory<
  REditor,
  DocumentRegistry.ICodeModel
> {
  /**
   * Construct a new editor widget factory.
   */
  constructor(options: REditorFactory.IOptions) {
    super(options.factoryOptions);
    this._services = options.editorServices;
    this.getCurrentWidget = options.getCurrentWidget;
  }

  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.CodeContext): REditor {
    const newDocumentEditor = this._services.factoryService.newDocumentEditor;
    const factory: CodeEditor.Factory = options => {
      return newDocumentEditor(options);
    };
    const content = new FileEditor({
      factory,
      context,
      mimeTypeService: this._services.mimeTypeService
    });
    return new REditor({ content, context }, this.getCurrentWidget);
  }

  private _services: IEditorServices;
  private getCurrentWidget: () => Widget | null;
}

/**
 * The namespace for `REditorFactory` class statics.
 */
export namespace REditorFactory {
  /**
   * The options used to create an editor widget factory.
   */
  export interface IOptions {
    /**
     * The editor services used by the factory.
     */
    editorServices: IEditorServices;

    /**
     * The factory options associated with the factory.
     */
    factoryOptions: DocumentRegistry.IWidgetFactoryOptions<REditor>;

    getCurrentWidget: () => Widget | null;
  }
}
