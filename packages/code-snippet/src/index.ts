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

import { codeSnippetIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';

import { Widget } from '@lumino/widgets';

import {
  CODE_SNIPPET_NAMESPACE,
  CODE_SNIPPET_SCHEMA
} from './CodeSnippetService';
import { CodeSnippetWidget } from './CodeSnippetWidget';

const CODE_SNIPPET_EXTENSION_ID = 'elyra-code-snippet-extension';

/**
 * Initialization data for the code-snippet extension.
 */
export const code_snippet_extension: JupyterFrontEndPlugin<void> = {
  id: CODE_SNIPPET_EXTENSION_ID,
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer, IEditorServices],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    editorServices: IEditorServices
  ) => {
    console.log('Elyra - code-snippet extension is activated!');

    const getCurrentWidget = (): Widget => {
      return app.shell.currentWidget;
    };

    const codeSnippetWidget = new CodeSnippetWidget({
      app,
      display_name: 'Code Snippets',
      namespace: CODE_SNIPPET_NAMESPACE,
      schema: CODE_SNIPPET_SCHEMA,
      icon: codeSnippetIcon,
      getCurrentWidget,
      editorServices
    });
    const codeSnippetWidgetId = `elyra-metadata:${CODE_SNIPPET_NAMESPACE}:${CODE_SNIPPET_SCHEMA}`;
    codeSnippetWidget.id = codeSnippetWidgetId;
    codeSnippetWidget.title.icon = codeSnippetIcon;
    codeSnippetWidget.title.caption = 'Code Snippets';

    restorer.add(codeSnippetWidget, codeSnippetWidgetId);

    // Rank has been chosen somewhat arbitrarily to give priority to the running
    // sessions widget in the sidebar.
    app.shell.add(codeSnippetWidget, 'left', { rank: 900 });
  }
};

export default code_snippet_extension;
