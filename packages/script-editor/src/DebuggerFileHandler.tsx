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

import { DocumentWidget } from '@jupyterlab/docregistry';

import { FileEditor } from '@jupyterlab/fileeditor';

import { IDisposable } from '@lumino/disposable';

import { Signal } from '@lumino/signaling';

import { DebuggerEditorHandler } from './DebuggerEditorHandler';

import { IDebugger } from '@jupyterlab/debugger';

/**
 * A handler for files.
 * Adapted from JupyterLab debugger extension - FileHandler.
 */
export class FileHandler implements IDisposable {
  /**
   * Instantiate a new FileHandler.
   *
   * @param options The instantiation options for a FileHandler.
   */
  constructor(options: FileHandler.IOptions) {
    this._debuggerService = options.debuggerService;
    this._fileEditor = options.widget.content;

    this._hasLineNumber = this._fileEditor.editor.getOption('lineNumbers');
    this._editorHandler = new DebuggerEditorHandler({
      debuggerService: this._debuggerService,
      editor: this._fileEditor.editor
    });
  }

  /**
   * Whether the handler is disposed.
   */
  isDisposed: boolean;

  /**
   * Dispose the handler.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this._editorHandler?.dispose();
    // Restore editor options
    this._editorHandler?.editor.setOptions({
      lineNumbers: this._hasLineNumber
    });
    Signal.clearData(this);
  }

  private _fileEditor: FileEditor;
  private _debuggerService: IDebugger;
  private _editorHandler: DebuggerEditorHandler;
  private _hasLineNumber: boolean;
}

/**
 * A namespace for FileHandler `statics`.
 */
export namespace FileHandler {
  /**
   * Instantiation options for `FileHandler`.
   */
  export interface IOptions {
    /**
     * The debugger service.
     */
    debuggerService: IDebugger;

    /**
     * The widget to handle.
     */
    widget: DocumentWidget<FileEditor>;
  }
}
