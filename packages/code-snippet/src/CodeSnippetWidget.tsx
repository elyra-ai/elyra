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

import '../style/index.css';

import { JupyterFrontEnd, ILayoutRestorer } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { addIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import React from 'react';

import { CodeSnippetDisplay } from './CodeSnippetDisplay';

import { CodeSnippetService, ICodeSnippet } from './CodeSnippetService';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_CLASS = 'elyra-CodeSnippets';
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPETS_HEADER_BUTTON_CLASS = 'elyra-codeSnippetHeader-button';

export const CODE_SNIPPET_ENDPOINT = 'code-snippets/';

const METADATA_EDITOR_ID = 'elyra-metadata-editor';

/**
 * A widget for Code Snippets.
 */
export class CodeSnippetWidget extends ReactWidget {
  codeSnippetManager: CodeSnippetService;
  renderCodeSnippetsSignal: Signal<this, ICodeSnippet[]>;
  getCurrentWidget: () => Widget;
  app: JupyterFrontEnd;
  editorFactory: CodeEditor.Factory;

  constructor(
    getCurrentWidget: () => Widget,
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    editorFactory: CodeEditor.Factory
  ) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.codeSnippetManager = new CodeSnippetService();
    this.renderCodeSnippetsSignal = new Signal<this, ICodeSnippet[]>(this);
    this.openCodeSnippetEditor = this.openCodeSnippetEditor.bind(this);
    this.app = app;
    this.editorFactory = editorFactory;

    this.fetchData = this.fetchData.bind(this);
    this.updateSnippets = this.updateSnippets.bind(this);
  }

  // Request code snippets from server
  async fetchData(): Promise<ICodeSnippet[]> {
    return await this.codeSnippetManager.findAll();
  }

  updateSnippets(): void {
    this.fetchData().then((codeSnippets: ICodeSnippet[]) => {
      this.renderCodeSnippetsSignal.emit(codeSnippets);
    });
  }

  // Triggered when the widget button on side panel is clicked
  onAfterShow(msg: Message): void {
    this.updateSnippets();
  }

  addCodeSnippet(): void {
    this.openCodeSnippetEditor({
      metadata: {
        name: '',
        displayName: '',
        description: '',
        language: '',
        code: ''
      },
      newFile: true,
      endpoint: CODE_SNIPPET_ENDPOINT,
      updateSignal: this.updateSnippets
    });
  }

  openCodeSnippetEditor(args: any): void {
    this.app.commands.execute(`${METADATA_EDITOR_ID}:open`, args);
  }

  render(): React.ReactElement {
    return (
      <div className={CODE_SNIPPETS_CLASS}>
        <header className={CODE_SNIPPETS_HEADER_CLASS}>
          <p> {'</> Code Snippets'} </p>
          <button
            className={CODE_SNIPPETS_HEADER_BUTTON_CLASS}
            onClick={this.addCodeSnippet.bind(this)}
          >
            <addIcon.react tag="span" elementPosition="center" width="16px" />
          </button>
        </header>
        <UseSignal signal={this.renderCodeSnippetsSignal} initialArgs={[]}>
          {(_, codeSnippets): React.ReactElement => (
            <CodeSnippetDisplay
              codeSnippets={codeSnippets}
              openCodeSnippetEditor={this.openCodeSnippetEditor}
              getCurrentWidget={this.getCurrentWidget}
              editorFactory={this.editorFactory}
              updateSnippets={this.updateSnippets}
            />
          )}
        </UseSignal>
      </div>
    );
  }
}

/**
 * A namespace for CodeSnippet statics.
 */
export namespace CodeSnippetWidget {
  /**
   * Interface describing table of contents widget options.
   */
  export interface IOptions {
    /**
     * Application document manager.
     */
    docmanager: IDocumentManager;

    /**
     * Application rendered MIME type.
     */
    rendermime: IRenderMimeRegistry;
  }
}
