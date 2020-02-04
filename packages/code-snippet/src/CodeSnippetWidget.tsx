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
import * as ReactDOM from 'react-dom';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Message } from '@phosphor/messaging';
import {Widget} from '@phosphor/widgets';

import '../style/index.css';
import {CodeSnippetManager} from "./CodeSnippet";

/**
 * A widget for code-snippet.
 */

class CodeSnippetTable extends React.Component<{}, any> {
    constructor(props: any) {
        super(props);

        let codeSnippetManager = new CodeSnippetManager();
        let codeSnippets = codeSnippetManager.findAll();
        codeSnippets = codeSnippets;

        this.state = { //state is by default an object
         students: [
            { id: 1, name: 'Wasif', age: 21, email: 'wasif@email.com' },
            { id: 2, name: 'Ali', age: 19, email: 'ali@email.com' },
            { id: 3, name: 'Saad', age: 16, email: 'saad@email.com' },
            { id: 4, name: 'Asad', age: 25, email: 'asad@email.com' }
         ]
      }
    }


    renderTableRows() {
        /*
        {
          "bloh": {
            "display_name": "blah",
            "metadata": {
              "language": "python",
              "code": [
                "def create_project_temp_dir():",
                "   temp_dir = tempfile.gettempdir()",
                "   project_temp_dir = os.path.join(temp_dir, 'elyra')",
                "   if not os.path.exists(project_temp_dir):",
                "     os.mkdir(project_temp_dir)",
                "   return project_temp_dir"
              ]
            },
            "schema_name": "code-snippet",
            "name": "bloh",
            "resource": "/Users/lresende/Library/Jupyter/metadata/code-snippet/bloh.json"
          }
        }*/
      return this.state.students.map((student:any, index: number) => {
         const { id, name, age, email } = student //destructuring
         return (
            <tr key={id}>
               <td>{id}</td>
               <td>{name}</td>
               <td>{age}</td>
               <td>{email}</td>
            </tr>
         )
      })
    }

    render()  {
      return (
         <div>
            <table id='students'>
               <tbody>
                  {this.renderTableRows()}
               </tbody>
            </table>
         </div>
      )
    }
}

export class CodeSnippetWidget extends Widget {

  constructor(/*options: CodeSnippetWidget.IOptions*/) {
    super();
    this.update();
  }

  /**
   * Callback invoked upon an update request.
   *
   * @param msg - message
   */
  protected onUpdateRequest(msg: Message): void {

      let title = "Code Snippets";

      let tableContentGenerator = new CodeSnippetTable(null);
      let jsx = (
          <div className="elyra-CodeSnippets">
            <header>{title}</header>
            {tableContentGenerator.render()}
          </div>
      );

      ReactDOM.render(jsx, this.node);
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

  /**
   * Interface describing the current widget.
   */
  export interface ICurrentWidget<W extends Widget = Widget> {
    /**
     * Current widget.
     */
    widget: W;

    /**
     * Code Snippet generator for the current widget.
     */
    // generator: Registry.IGenerator<W>;
  }
}

