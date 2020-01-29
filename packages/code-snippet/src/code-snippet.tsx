/*
 * Copyright 2018-2019 IBM Corporation
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

/**
 * A widget for code-snippet.
 */
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

      let jsx = (
          <div className="elyra-CodeSnippets">
            <header>{title}</header>
          </div>
      );

      console.log(">>>");
      console.log(this.node);
      ReactDOM.render(jsx, this.node);
      console.log(this.node);
      console.log(">>><<<");
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

