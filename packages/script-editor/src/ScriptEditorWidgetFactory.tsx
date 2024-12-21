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

import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
} from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';

import { ScriptEditor } from './ScriptEditor';

/**
 * A widget factory for script editors.
 */
export class ScriptEditorWidgetFactory extends ABCWidgetFactory<
  ScriptEditor,
  DocumentRegistry.ICodeModel
> {
  private options: ScriptEditorWidgetFactory.IOptions;
  /**
   * Construct a new editor widget factory.
   */
  constructor(options: ScriptEditorWidgetFactory.IOptions) {
    super(options.factoryOptions);
    this._services = options.editorServices;
    this.options = options;
  }

  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(
    context: DocumentRegistry.CodeContext,
  ): ScriptEditor {
    const newDocumentEditor = this._services.factoryService.newDocumentEditor;
    const factory: CodeEditor.Factory = (options) => {
      return newDocumentEditor(options);
    };
    const content = new FileEditor({
      factory,
      context,
      mimeTypeService: this._services.mimeTypeService,
    });

    return this.options.instanceCreator({ content, context });
  }

  private _services: IEditorServices;
}

/**
 * The namespace for `ScriptEditorWidgetFactory` class statics.
 */
export namespace ScriptEditorWidgetFactory {
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
    factoryOptions: DocumentRegistry.IWidgetFactoryOptions<ScriptEditor>;

    /**
     * The function that creates ScriptEditor instances.
     */
    instanceCreator: (
      options: DocumentWidget.IOptions<FileEditor, DocumentRegistry.ICodeModel>,
    ) => ScriptEditor;
  }
}
