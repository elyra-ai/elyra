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

import React from 'react';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '../style/index.css';
import { CodeSnippetManager, ICodeSnippet } from './CodeSnippet';
import { ReactWidget } from '@jupyterlab/apputils';
import { ExpandableComponent } from './ExpandableComponent';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_CLASS = 'elyra-CodeSnippets';
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPETS_TABLE_ROW_CLASS = 'elyra-codeSnippet-tableRow';
const BUTTON_CLASS = 'elyra-button';
const COPY_ICON_CLASS = 'elyra-copy-icon';
const INSERT_ICON_CLASS = 'elyra-add-icon';

/**
 * A widget for code-snippet.
 */

class CodeSnippetTable extends React.Component<{}, any> {
  constructor(props: any) {
    super(props);
    this.state = { codeSnippets: [] };
  }

  async fetchData(): Promise<ICodeSnippet[]> {
    const codeSnippetManager = new CodeSnippetManager();
    const codeSnippets: ICodeSnippet[] = await codeSnippetManager.findAll();
    return codeSnippets;
  }

  renderTableRows(): Array<JSX.Element> {
    return this.buildCodeSnippetNameList();
  }

  // TODO: Implement flex containers/divs instead of table
  buildCodeSnippetNameList(): Array<JSX.Element> {
    const tableRowElems: Array<JSX.Element> = this.state.codeSnippets.map(
      (codeSnippet: any, index: number) => {
        const tableRowCellElems: Array<JSX.Element> = [];

        //       // Add expand button
        //       const visibleCodeSnippets = this.state.visibleCodeSnippets;
        //       let displayButtonClass = BUTTON_CLASS;
        //       if (visibleCodeSnippets[codeSnippet.name]) {
        //         displayButtonClass = displayButtonClass + ' ' + UP_ICON_CLASS;
        //       } else {
        //         displayButtonClass = displayButtonClass + ' ' + DOWN_ICON_CLASS;
        //       }
        //
        //       tableRowCellElems.push(
        //         <td key="showCodeButton">
        //           <div>
        //             <button
        //               className={displayButtonClass}
        //               onClick={(): void => {
        //                 this.updateCodeDisplayState(codeSnippet.name);
        //               }}
        //             ></button>
        //           </div>
        //         </td>
        //       );

        //       // Add display name
        //       tableRowCellElems.push(
        //         <td
        //           key={codeSnippet.displayName}
        //           className={CODE_SNIPPETS_NAME_CLASS}
        //           onClick={(): void => {
        //             this.updateCodeDisplayState(codeSnippet.name);
        //           }}
        //         >
        //           {'[' + codeSnippet.language + ']'} {codeSnippet.displayName}
        //         </td>
        //       );

        // NEW: Add reusable ExpandableComponent
        const displayName =
          '[' + codeSnippet.language + '] ' + codeSnippet.displayName;

        // TODO: Use code mirror to display code
        tableRowCellElems.push(
          <td key={codeSnippet.displayName}>
            <ExpandableComponent displayName={displayName}>
              <div>{codeSnippet.code.join('\n')}</div>
            </ExpandableComponent>
          </td>
        );

        // Add copy button
        // TODO: implement copy to clipboard command
        tableRowCellElems.push(
          <td key="copyButton">
            <div>
              <button
                className={BUTTON_CLASS + ' ' + COPY_ICON_CLASS}
                onClick={(): void => {
                  console.log('COPY BUTTON CLICKED');
                }}
              ></button>
            </div>
          </td>
        );

        // Add insert button
        // TODO: implement insert code to file editor command (first check for code language matches file editor kernel language)
        tableRowCellElems.push(
          <td key="insertButton">
            <div>
              <button
                className={BUTTON_CLASS + ' ' + INSERT_ICON_CLASS}
                onClick={(): void => {
                  console.log('INSERT CODE BUTTON CLICKED');
                }}
              ></button>
            </div>
          </td>
        );

        return (
          <tr key={codeSnippet.name} className={CODE_SNIPPETS_TABLE_ROW_CLASS}>
            {tableRowCellElems}
          </tr>
        );
      }
    );

    //       tableRowElems.push(
    //         <tr key={codeSnippet.name + 'codeBox'}>
    //           <td
    //             className={
    //               visibleCodeSnippets[codeSnippet.name]
    //                 ? CODE_DISPLAY_VISIBLE_CLASS
    //                 : CODE_DISPLAY_HIDDEN_CLASS
    //             }
    //           >
    //             {codeSnippet.code.join('\n')}
    //           </td>
    //         </tr>
    //       );

    return tableRowElems;
  }

  updateCodeDisplayState(name: string): void {
    const visibleCodeSnippets = this.state.visibleCodeSnippets;

    // Switch boolean flag on visible code snippet
    visibleCodeSnippets[name] = !visibleCodeSnippets[name];
    this.setState({
      codeSnippets: this.state.codeSnippets,
      visibleCodeSnippets: visibleCodeSnippets
    });
  }

  componentDidMount(): void {
    this.fetchData().then((codeSnippets: ICodeSnippet[]) => {
      // Make object to keep track of open code snippets in UI
      let visibleCodeSnippets: { [k: string]: boolean } = {};

      if (!this.state.visibleCodeSnippets) {
        codeSnippets.map((codeSnippet: any, index: number) => {
          visibleCodeSnippets[codeSnippet.name] = false;
        });
      } else {
        visibleCodeSnippets = this.state.visibleCodeSnippets;
      }

      this.setState({
        codeSnippets: codeSnippets,
        visibleCodeSnippets: visibleCodeSnippets
      });
    });
  }

  render(): React.ReactElement {
    return (
      <div>
        <table id="codeSnippets">
          <tbody>{this.renderTableRows()}</tbody>
        </table>
      </div>
    );
  }
}

export class CodeSnippetWidget extends ReactWidget {
  render(): React.ReactElement {
    return (
      <div className={CODE_SNIPPETS_CLASS}>
        <header className={CODE_SNIPPETS_HEADER_CLASS}>
          {'</> Code Snippets'}
        </header>
        <CodeSnippetTable />
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
