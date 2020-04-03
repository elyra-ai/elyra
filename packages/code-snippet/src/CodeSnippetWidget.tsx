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
import React from 'react';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Message } from '@phosphor/messaging';
import { Signal } from '@phosphor/signaling';

import { CodeSnippetManager, ICodeSnippet } from './CodeSnippet';
import { ExpandableComponent } from './ExpandableComponent';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_CLASS = 'elyra-CodeSnippets';
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPET_ITEM = 'elyra-codeSnippet-item';
const BUTTON_CLASS = 'elyra-button';
const COPY_ICON_CLASS = 'elyra-copy-icon';
const INSERT_ICON_CLASS = 'elyra-add-icon';
const CODE_SNIPPET_NAME_CLASS = 'elyra-codeSnippet-name';
const CODE_SNIPPET_BUTTONS_WRAPPER_CLASS = 'elyra-codeSnippet-buttons';

/**
 * A widget for code-snippet.
 */
interface ICodeSnippetProps {
  codeSnippets: ICodeSnippet[];
}
class CodeSnippetTable extends React.Component<ICodeSnippetProps> {
  // TODO: Use code mirror to display code
  // TODO: implement copy to clipboard command
  // TODO: implement insert code to file editor command (first check for code language matches file editor kernel language)

  render(): React.ReactElement {
    const renderCodeSnippet = (codeSnippet: ICodeSnippet): JSX.Element => {
      const displayName =
        '[' + codeSnippet.language + '] ' + codeSnippet.displayName;

      return (
        <div key={codeSnippet.name} className={CODE_SNIPPET_ITEM}>
          <div
            key={codeSnippet.displayName}
            className={CODE_SNIPPET_NAME_CLASS}
          >
            <ExpandableComponent displayName={displayName}>
              <pre>{codeSnippet.code.join('\n')}</pre>
            </ExpandableComponent>
          </div>
          <div className={CODE_SNIPPET_BUTTONS_WRAPPER_CLASS}>
            <div key="copyButton">
              <button
                className={BUTTON_CLASS + ' ' + COPY_ICON_CLASS}
                onClick={(): void => {
                  console.log('COPY BUTTON CLICKED');
                }}
              ></button>
            </div>
            <div key="insertButton">
              <button
                className={BUTTON_CLASS + ' ' + INSERT_ICON_CLASS}
                onClick={(): void => {
                  console.log('INSERT CODE BUTTON CLICKED');
                }}
              ></button>
            </div>
          </div>
        </div>
      );
    };
    return (
      <div>
        <div id="codeSnippets">
          <div>{this.props.codeSnippets.map(renderCodeSnippet)}</div>
        </div>
      </div>
    );
  }
}

export class CodeSnippetWidget extends ReactWidget {
  // A signal to tell CodeSnippetTable component to render the list of code snippets
  private renderCodeSnippetsSignal = new Signal<this, ICodeSnippet[]>(this);

  // Request code snippets from server
  async fetchData(): Promise<ICodeSnippet[]> {
    const codeSnippetManager = new CodeSnippetManager();
    return await codeSnippetManager.findAll();
  }

  // Triggered when the widget button on side palette is clicked
  onAfterShow(msg: Message): void {
    this.fetchData().then((codeSnippets: ICodeSnippet[]) => {
      this.renderCodeSnippetsSignal.emit(codeSnippets);
    });
  }

  render(): React.ReactElement {
    return (
      <div className={CODE_SNIPPETS_CLASS}>
        <header className={CODE_SNIPPETS_HEADER_CLASS}>
          {'</> Code Snippets'}
        </header>
        <UseSignal signal={this.renderCodeSnippetsSignal} initialArgs={[]}>
          {(_, codeSnippets): React.ReactElement => (
            <CodeSnippetTable codeSnippets={codeSnippets} />
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
