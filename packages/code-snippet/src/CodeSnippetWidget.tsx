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
// import * as ReactDOM from 'react-dom';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '../style/index.css';
import {CodeSnippetManager, ICodeSnippet} from "./CodeSnippet";
import { ReactWidget } from '@jupyterlab/apputils';

/**
 * A widget for code-snippet.
 */

class CodeSnippetTable extends React.Component<{}, any> {
    constructor(props: any) {
        super(props);
        this.state = {codeSnippets:[]};
    }

    async fetchData(): Promise<ICodeSnippet[]> {
      const codeSnippetManager = new CodeSnippetManager();
      const codeSnippets:ICodeSnippet[] = await codeSnippetManager.findAll();
      return codeSnippets;
    }

    renderTableRows() {

      // TODO: Design and implement a nicer output table
      const tableRowElems:Array<JSX.Element> = [];
      
      this.state.codeSnippets.map((codeSnippet:any, index: number) => {

        const tableRowCellElems:Array<JSX.Element> = [];
        for (let prop in codeSnippet) {
          tableRowCellElems.push(<td key={prop}>{prop}: {codeSnippet[prop] }</td>);
        }

        tableRowElems.push(
           <tr key={codeSnippet.name}>
              {tableRowCellElems}
            </tr>
        );
      });
    return <>{tableRowElems}</>;
    }

    componentDidMount() {      
      this.fetchData().then((codeSnippets:ICodeSnippet[] ) => {
        // set this.state in order to trigger new render
        this.setState({codeSnippets: codeSnippets});
      });
    }

    render()  {
      return (
         <div>
            <table id='codeSnippets'>
               <tbody>
                  {this.renderTableRows()}
               </tbody>
            </table>
         </div>
      )
    }
}


export class CodeSnippetWidget extends ReactWidget {
  render() {
    return (
    <div className="elyra-CodeSnippets">
      <header>{"Code Snippets"}</header>
      <CodeSnippetTable/>
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

