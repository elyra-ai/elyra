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

import { ExpandableComponent, insertCodeSnippet } from '@elyra/ui-components';

import { ReactWidget, UseSignal, Clipboard } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { copyIcon, addIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import React from 'react';

import { CodeSnippetManager, ICodeSnippet } from './CodeSnippet';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_CLASS = 'elyra-CodeSnippets';
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPET_ITEM = 'elyra-codeSnippet-item';

/**
 * CodeSnippetDisplay props.
 */
interface ICodeSnippetDisplayProps {
  codeSnippets: ICodeSnippet[];
  getCurrentWidget: () => Widget;
}

/**
 * A React Component for code-snippets display list.
 */
class CodeSnippetDisplay extends React.Component<ICodeSnippetDisplayProps> {
  // TODO: Use code mirror to display code

  // Render display of code snippet list
  private renderCodeSnippet = (codeSnippet: ICodeSnippet): JSX.Element => {
    const displayName =
      '[' + codeSnippet.language + '] ' + codeSnippet.displayName;

    const actionButtons = [
      {
        title: 'Copy',
        icon: copyIcon,
        onClick: (): void => {
          Clipboard.copyToSystem(codeSnippet.code.join('\n'));
        }
      },
      {
        title: 'Insert',
        icon: addIcon,
        onClick: (): void => {
          insertCodeSnippet(
            codeSnippet.language,
            codeSnippet.code.join('\n'),
            this.props.getCurrentWidget
          );
        }
      }
    ];

    return (
      <div key={codeSnippet.name} className={CODE_SNIPPET_ITEM}>
        <ExpandableComponent
          displayName={displayName}
          tooltip={codeSnippet.description}
          actionButtons={actionButtons}
        >
          <textarea defaultValue={codeSnippet.code.join('\n')}></textarea>
        </ExpandableComponent>
      </div>
    );
  };

  render(): React.ReactElement {
    return (
      <div>
        <div id="codeSnippets">
          <div>{this.props.codeSnippets.map(this.renderCodeSnippet)}</div>
        </div>
      </div>
    );
  }
}

/**
 * A widget for Code Snippets.
 */
export class CodeSnippetWidget extends ReactWidget {
  codeSnippetManager: CodeSnippetManager;
  renderCodeSnippetsSignal: Signal<this, ICodeSnippet[]>;
  getCurrentWidget: () => Widget;

  constructor(getCurrentWidget: () => Widget) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.codeSnippetManager = new CodeSnippetManager();
    this.renderCodeSnippetsSignal = new Signal<this, ICodeSnippet[]>(this);
  }

  // Request code snippets from server
  async fetchData(): Promise<ICodeSnippet[]> {
    return await this.codeSnippetManager.findAll();
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
            <CodeSnippetDisplay
              codeSnippets={codeSnippets}
              getCurrentWidget={this.getCurrentWidget}
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
