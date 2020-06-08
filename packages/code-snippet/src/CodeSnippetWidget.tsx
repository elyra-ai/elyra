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

import { RequestHandler } from '@elyra/application';
import { codeSnippetIcon, MetadataEditor } from '@elyra/ui-components';

import { JupyterFrontEnd, ILayoutRestorer } from '@jupyterlab/application';
import { ReactWidget, UseSignal, WidgetTracker } from '@jupyterlab/apputils';
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
const METADATA_EDITOR_ID = 'elyra-metadata-editor';

export const CODE_SNIPPET_ENDPOINT = 'elyra/metadata/code-snippets';

/**
 * A widget for Code Snippets.
 */
export class CodeSnippetWidget extends ReactWidget {
  codeSnippetManager: CodeSnippetService;
  renderCodeSnippetsSignal: Signal<this, ICodeSnippet[]>;
  getCurrentWidget: () => Widget;
  editorFactory: CodeEditor.Factory;
  app: JupyterFrontEnd;
  restorer: ILayoutRestorer;
  editorTracker: WidgetTracker<MetadataEditor>;

  constructor(
    getCurrentWidget: () => Widget,
    editorFactory: CodeEditor.Factory,
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer
  ) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.codeSnippetManager = new CodeSnippetService();
    this.renderCodeSnippetsSignal = new Signal<this, ICodeSnippet[]>(this);
    this.editCodeSnippet = this.editCodeSnippet.bind(this);
    this.editorFactory = editorFactory;
    this.app = app;
    this.app.commands.addCommand(METADATA_EDITOR_ID + ':open', {
      isVisible: () => {
        return false;
      },
      execute: (args: any) => {
        this.editCodeSnippet(
          args.name,
          args.description,
          args.language,
          args.code,
          args.newFile
        );
      }
    });
    this.restorer = restorer;
    this.editorTracker = new WidgetTracker<MetadataEditor>({
      namespace: METADATA_EDITOR_ID
    });
    this.restorer.restore(this.editorTracker, {
      name: (metadataEditor: any) => {
        return metadataEditor.name;
      },
      command: METADATA_EDITOR_ID + ':open',
      args: (widget: MetadataEditor) => ({
        name: widget.name,
        description: widget.description,
        language: widget.language,
        code: widget.code,
        newFile: widget.newFile
      })
    });
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
    this.editCodeSnippet('', '', '', '', true);
  }

  saveSnippet(snippetEditor: MetadataEditor): void {
    const newSnippet = {
      schema_name: 'code-snippet',
      name: snippetEditor.name,
      display_name: snippetEditor.name,
      metadata: {
        description: snippetEditor.description,
        language: snippetEditor.language,
        code: snippetEditor.editor.model.value.text.split('\n')
      }
    };
    const newSnippetString = JSON.stringify(newSnippet);

    if (snippetEditor.newFile) {
      RequestHandler.makePostRequest(
        snippetEditor.endpoint,
        JSON.stringify(newSnippet),
        false
      ).then((response: any): void => {
        this.updateSnippets();
      });
      snippetEditor.newFile = false;
    } else {
      RequestHandler.makeServerRequest(
        snippetEditor.endpoint + '/' + newSnippet.name,
        { method: 'PUT', body: newSnippetString },
        false
      ).then((response: any): void => {
        this.updateSnippets();
      });
    }
  }

  async editCodeSnippet(
    displayName: string,
    description: string,
    language: string,
    code: string,
    newFile: boolean
  ): Promise<void> {
    const metadataEditorWidget = new MetadataEditor(
      displayName,
      description,
      language,
      code,
      newFile,
      this.updateSnippets,
      this.saveSnippet,
      this.editorFactory,
      CODE_SNIPPET_ENDPOINT
    );
    metadataEditorWidget.id = METADATA_EDITOR_ID;
    if (newFile) {
      metadataEditorWidget.title.label = 'New Snippet';
    } else {
      metadataEditorWidget.title.label = '[' + language + '] ' + displayName;
    }
    metadataEditorWidget.title.icon = codeSnippetIcon;
    this.app.shell.add(metadataEditorWidget, 'main');
    this.editorTracker.add(metadataEditorWidget);
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
              editCodeSnippet={this.editCodeSnippet}
              editorFactory={this.editorFactory}
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
