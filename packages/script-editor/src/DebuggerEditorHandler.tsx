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

import { CodeEditor } from '@jupyterlab/codeeditor';

import { CodeMirrorEditor } from '@jupyterlab/codemirror';

import { ActivityMonitor } from '@jupyterlab/coreutils';

import { IDebugger } from '@jupyterlab/debugger';

import { IObservableString } from '@jupyterlab/observables';

import { IDisposable } from '@lumino/disposable';

import { Signal } from '@lumino/signaling';

import { Editor } from 'codemirror';

/**
 * The class name added to the current line.
 */
const LINE_HIGHLIGHT_CLASS = 'jp-DebuggerEditor-highlight';

/**
 * The timeout for listening to editor content changes.
 */
const EDITOR_CHANGED_TIMEOUT = 1000;

/**
 * A debugger handler for a CodeEditor.IEditor.
 * Adapted from JupyterLab debugger extension - EditorHandler.
 */
export class DebuggerEditorHandler implements IDisposable {
  /**
   * Instantiate a new DebuggerEditorHandler.
   *
   * @param options The instantiation options for a DebuggerEditorHandler.
   */
  constructor(options: DebuggerEditorHandler.IOptions) {
    this._id = options.debuggerService.session?.connection?.id ?? '';
    this._path = options.path ?? '';
    this._debuggerService = options.debuggerService;
    this._editor = options.editor;

    this._editorMonitor = new ActivityMonitor({
      signal: this._editor.model.value.changed,
      timeout: EDITOR_CHANGED_TIMEOUT
    });
    this._editorMonitor.activityStopped.connect(() => {
      this._sendEditorBreakpoints();
    }, this);

    this._debuggerService.model.breakpoints.changed.connect(async () => {
      if (!this._editor || this._editor.isDisposed) {
        return;
      }
      this._addBreakpointsToEditor();
    });

    this._debuggerService.model.breakpoints.restored.connect(async () => {
      if (!this._editor || this._editor.isDisposed) {
        return;
      }
      this._addBreakpointsToEditor();
    });

    this._debuggerService.model.callstack.currentFrameChanged.connect(() => {
      DebuggerEditorHandler.clearHighlight(this._editor);
    });

    this._setupEditor();
    this.isDisposed = false;
  }

  /**
   * The editor
   */
  get editor(): CodeEditor.IEditor {
    return this._editor;
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
    this._editorMonitor.dispose();
    this._clearEditor();
    this.isDisposed = true;
    Signal.clearData(this);
  }

  /**
   * Refresh the breakpoints display
   */
  refreshBreakpoints(): void {
    this._addBreakpointsToEditor();
  }

  /**
   * Setup the editor.
   */
  private _setupEditor(): void {
    if (!this._editor || this._editor.isDisposed) {
      return;
    }

    this._addBreakpointsToEditor();

    const editor = this._editor as CodeMirrorEditor;
    editor.setOption('lineNumbers', true);
    editor.editor.setOption('gutters', [
      'CodeMirror-linenumbers',
      'breakpoints'
    ]);
    editor.editor.on('gutterClick', this._onGutterClick);
  }

  /**
   * Clear the editor by removing visual elements and handlers.
   */
  private _clearEditor(): void {
    if (!this._editor || this._editor.isDisposed) {
      return;
    }
    const editor = this._editor as CodeMirrorEditor;
    DebuggerEditorHandler.clearHighlight(editor);
    DebuggerEditorHandler.clearGutter(editor);
    editor.setOption('lineNumbers', false);
    editor.editor.setOption('gutters', []);
    editor.editor.off('gutterClick', this._onGutterClick);
  }

  /**
   * Send the breakpoints from the editor UI via the debug service.
   */
  private _sendEditorBreakpoints(): void {
    if (this._editor.isDisposed) {
      return;
    }

    const breakpoints = this._getBreakpointsFromEditor().map(lineInfo => {
      return Private.createBreakpoint(
        this._debuggerService.session?.connection?.name || '',
        lineInfo.line + 1
      );
    });

    void this._debuggerService.updateBreakpoints(
      this._editor.model.value.text,
      breakpoints,
      this._path
    );
  }

  /**
   * Handle a click on the gutter.
   *
   * @param editor The editor from where the click originated.
   * @param lineNumber The line corresponding to the click event.
   */
  private _onGutterClick = (editor: Editor, lineNumber: number): void => {
    const info = editor.lineInfo(lineNumber);
    if (!info || this._id !== this._debuggerService.session?.connection?.id) {
      return;
    }

    const remove = !!info.gutterMarkers;
    let breakpoints: IDebugger.IBreakpoint[] = this._getBreakpoints();
    if (remove) {
      breakpoints = breakpoints.filter(ele => ele.line !== info.line + 1);
    } else {
      breakpoints.push(
        Private.createBreakpoint(
          this._path ?? this._debuggerService.session.connection.name,
          info.line + 1
        )
      );
    }

    void this._debuggerService.updateBreakpoints(
      this._editor.model.value.text,
      breakpoints,
      this._path
    );

    // const remove = !!info.gutterMarkers;
    // if (remove) {
    //   editor.setGutterMarker(lineNumber, 'breakpoints', null);
    // }

    // // DebuggerEditorHandler.clearGutter(this._editor as CodeMirrorEditor);
    // editor.setGutterMarker(
    //   lineNumber,
    //   'breakpoints',
    //   Private.createMarkerNode()
    // );
  };

  /**
   * Add the breakpoints to the editor.
   */
  private _addBreakpointsToEditor(): void {
    const editor = this._editor as CodeMirrorEditor;
    const breakpoints = this._getBreakpoints();
    if (this._id !== this._debuggerService.session?.connection?.id) {
      return;
    }
    DebuggerEditorHandler.clearGutter(editor);
    breakpoints.forEach(breakpoint => {
      if (typeof breakpoint.line === 'number') {
        editor.editor.setGutterMarker(
          breakpoint.line - 1,
          'breakpoints',
          Private.createMarkerNode()
        );
      }
    });
  }

  /**
   * Retrieve the breakpoints from the editor.
   */
  private _getBreakpointsFromEditor(): Private.ILineInfo[] {
    const editor = this._editor as CodeMirrorEditor;
    const lines = [];
    for (let i = 0; i < editor.doc.lineCount(); i++) {
      const info = editor.editor.lineInfo(i);
      if (info.gutterMarkers) {
        lines.push(info);
      }
    }
    return lines;
  }

  /**
   * Get the breakpoints for the editor using its content (code),
   * or its path (if it exists).
   */
  private _getBreakpoints(): IDebugger.IBreakpoint[] {
    const code = this._editor.model.value.text;
    return this._debuggerService.model.breakpoints.getBreakpoints(
      this._path || this._debuggerService.getCodeId(code)
    );
  }

  private _id: string;
  private _path: string;
  private _editor: CodeEditor.IEditor;
  private _debuggerService: IDebugger;
  private _editorMonitor: ActivityMonitor<
    IObservableString,
    IObservableString.IChangedArgs
  >;
}

/**
 * A namespace for DebuggerEditorHandler `statics`.
 */
export namespace DebuggerEditorHandler {
  /**
   * Instantiation options for `DebuggerEditorHandler`.
   */
  export interface IOptions {
    /**
     * The debugger service.
     */
    debuggerService: IDebugger;

    /**
     * The code editor to handle.
     */
    editor: CodeEditor.IEditor;

    /**
     * An optional path to a source file.
     */
    path?: string;
  }

  /**
   * Highlight the current line of the frame in the given editor.
   *
   * @param editor The editor to highlight.
   * @param line The line number.
   */
  export const showCurrentLine = (
    editor: CodeEditor.IEditor,
    line: number
  ): void => {
    clearHighlight(editor);
    const cmEditor = editor as CodeMirrorEditor;
    cmEditor.editor.addLineClass(line - 1, 'wrap', LINE_HIGHLIGHT_CLASS);
    cmEditor.scrollIntoViewCentered({ ch: 0, line: line - 1 });
    // error TS2339: Property 'scrollIntoViewCentered' does not exist on type 'CodeMirrorEditor'
  };

  /**
   * Remove all line highlighting indicators for the given editor.
   *
   * @param editor The editor to cleanup.
   */
  export const clearHighlight = (editor: CodeEditor.IEditor): void => {
    if (!editor || editor.isDisposed) {
      return;
    }
    const cmEditor = editor as CodeMirrorEditor;
    cmEditor.doc.eachLine((line: any) => {
      cmEditor.editor.removeLineClass(line, 'wrap', LINE_HIGHLIGHT_CLASS);
    });
  };

  /**
   * Remove line numbers and all gutters from editor.
   *
   * @param editor The editor to cleanup.
   */
  export const clearGutter = (editor: CodeEditor.IEditor): void => {
    if (!editor) {
      return;
    }
    const cmEditor = editor as CodeMirrorEditor;
    cmEditor.doc.eachLine(line => {
      if (((line as unknown) as Private.ILineInfo).gutterMarkers) {
        cmEditor.editor.setGutterMarker(line, 'breakpoints', null);
      }
    });
  };
}

/**
 * A namespace for module private data.
 */
namespace Private {
  /**
   * Create a marker DOM element for a breakpoint.
   */
  export const createMarkerNode = (): HTMLElement => {
    const marker = document.createElement('div');
    marker.className = 'jp-DebuggerEditor-marker';
    marker.innerHTML = '●';
    return marker;
  };

  /**
   * Remove a breakpoint marker DOM element.
   */
  // export const removeMarkerNode = (): HTMLElement => {
  //   const marker = document.createElement('div');
  //   marker.classList.remove('jp-DebuggerEditor-marker');
  //   marker.innerHTML = '';
  //   return marker;
  // };

  /**
   * Create a new breakpoint.
   *
   * @param session The name of the session.
   * @param line The line number of the breakpoint.
   */
  export const createBreakpoint = (
    session: string,
    line: number
  ): IDebugger.IBreakpoint => {
    return {
      line,
      verified: true,
      source: {
        name: session
      }
    };
  };

  /**
   * An interface for an editor line info.
   */
  export interface ILineInfo {
    line: any;
    handle: any;
    text: string;
    /** Object mapping gutter IDs to marker elements. */
    gutterMarkers: any;
    textClass: string;
    bgClass: string;
    wrapClass: string;
    /** Array of line widgets attached to this line. */
    widgets: any;
  }
}
