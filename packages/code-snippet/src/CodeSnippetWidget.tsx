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

import { SubmissionHandler } from '@elyra/application';
import { addSnippetIcon } from '@elyra/ui-components';

import {
  ReactWidget,
  UseSignal,
  Dialog,
  showDialog
} from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
// import { CodeMirrorEditorFactory } from '@jupyterlab/codemirror';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import React from 'react';

import { CodeSnippetManager, ICodeSnippet } from './CodeSnippet';
import { CodeSnippetDisplay } from './CodeSnippetDisplay';
import { EditorDialog } from './EditorDialog';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_CLASS = 'elyra-CodeSnippets';
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPETS_HEADER_BUTTON_CLASS = 'elyra-codeSnippetHeader-button';

/**
 * API endpoint for code snippets
 */
export const CODE_SNIPPET_ENDPOINT = 'api/metadata/code-snippets';

/**
 * A widget for Code Snippets.
 */
export class CodeSnippetWidget extends ReactWidget {
  codeSnippetManager: CodeSnippetManager;
  renderCodeSnippetsSignal: Signal<this, ICodeSnippet[]>;
  getCurrentWidget: () => Widget;
  editorFactory: CodeEditor.Factory;

  constructor(
    getCurrentWidget: () => Widget,
    editorFactory: CodeEditor.Factory
  ) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.codeSnippetManager = new CodeSnippetManager();
    this.renderCodeSnippetsSignal = new Signal<this, ICodeSnippet[]>(this);
    this.editCodeSnippet = this.editCodeSnippet.bind(this);
    this.editorFactory = editorFactory;
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

  // Triggered when the widget button on side palette is clicked
  onAfterShow(msg: Message): void {
    this.updateSnippets();
  }

  addCodeSnippet(): void {
    this.editCodeSnippet('', '', '', '', true);
  }

  async editCodeSnippet(
    displayName: string,
    description: string,
    language: string,
    code: string,
    newFile: boolean
  ): Promise<void> {
    showDialog({
      title: 'Edit snippet',
      body: new EditorDialog({
        display_name: displayName,
        description: description,
        language: language,
        code: code,
        editorFactory: this.editorFactory
      }),
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result: any) => {
      if (result.value == null) {
        // When Cancel is clicked on the dialog, just return
        return;
      }

      const newSnippet = {
        schema_name: 'code-snippet',
        name: result.value.display_name,
        display_name: result.value.display_name,
        metadata: {
          description: result.value.description,
          language: result.value.language,
          code: result.value.code.split('\n')
        }
      };
      const newSnippetString = JSON.stringify(newSnippet);

      if (newFile) {
        SubmissionHandler.makePostRequest(
          CODE_SNIPPET_ENDPOINT,
          JSON.stringify(newSnippet),
          'code snippets',
          (response: any) => {
            this.updateSnippets();
          }
        );
      } else {
        SubmissionHandler.makeServerRequest(
          CODE_SNIPPET_ENDPOINT + '/' + newSnippet.name,
          { method: 'PUT', body: newSnippetString },
          'code snippets',
          (response: any) => {
            this.updateSnippets();
          }
        );
      }
    });
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
            <addSnippetIcon.react
              tag="span"
              elementPosition="center"
              width="16px"
            />
          </button>
        </header>
        <UseSignal signal={this.renderCodeSnippetsSignal} initialArgs={[]}>
          {(_, codeSnippets): React.ReactElement => (
            <CodeSnippetDisplay
              codeSnippets={codeSnippets}
              editCodeSnippet={this.editCodeSnippet}
              getCurrentWidget={this.getCurrentWidget}
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
