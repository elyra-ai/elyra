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

import { ReactWidget } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';

import React from 'react';

/**
 * Metadata editor widget
 */
export class MetadataEditor extends ReactWidget {
  displayName: string;
  description: string;
  language: string;
  code: string;
  editorFactory: CodeEditor.Factory;
  editor: CodeEditor.IEditor;

  constructor(
    displayName: string,
    description: string,
    language: string,
    code: string,
    editorFactory: CodeEditor.Factory
  ) {
    super();
    this.displayName = displayName;
    this.description = description;
    this.language = language;
    this.code = code;
    this.editorFactory = editorFactory;
  }

  componentDidMount(): void {
    const editorFactory: CodeEditor.Factory = this.editorFactory;
    this.editor = editorFactory({
      host: document.getElementById('code'),
      model: new CodeEditor.Model({ value: this.code })
    });
  }

  getValue(): any {
    return {
      display_name: (document.getElementById(
        'display_name'
      ) as HTMLInputElement).value,

      description: (document.getElementById('description') as HTMLInputElement)
        .value,

      language: (document.getElementById('language') as HTMLInputElement).value,

      code: this.editor.model.value.text
    };
  }

  render(): React.ReactElement {
    return (
      <div>
        <label htmlFor="display_name">Name:</label>
        <br />
        <input
          id="display_name"
          className="elyra-form-inputtext"
          defaultValue={this.displayName}
        />
        <br />
        <label htmlFor="description">Description (optional):</label>
        <br />
        <input
          id="description"
          className="elyra-form-inputtext"
          defaultValue={this.description}
        />
        <br />
        <label htmlFor="language">Coding language:</label>
        <br />
        <input
          id="language"
          className="elyra-form-inputtext"
          defaultValue={this.language}
        />
        <br />
        <label htmlFor="code">Code snippet:</label>
        <br />
        <div id="code" className="elyra-form-code"></div>
        <br />
      </div>
    );
  }
}
