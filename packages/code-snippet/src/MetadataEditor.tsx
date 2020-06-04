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
import { Select, InputGroup, Button } from '@jupyterlab/ui-components';

import { SubmissionHandler } from '@elyra/application';

import * as React from 'react';

/**
 * API endpoint for code snippets
 */
export const CODE_SNIPPET_ENDPOINT = 'api/metadata/code-snippets';

// const LanguageSelect = Select.ofType<string>();
let defaultLanguages = ['python', 'R'];

/**
 * Metadata editor widget
 */
export class MetadataEditor extends ReactWidget {
  displayName: string;
  description: string;
  language: string;
  code: string;
  newFile: boolean;
  updateSnippets: () => void;
  editorFactory: CodeEditor.Factory;
  editor: CodeEditor.IEditor;

  constructor(
    displayName: string,
    description: string,
    language: string,
    code: string,
    newFile: boolean,
    updateSnippets: () => void,
    editorFactory: CodeEditor.Factory
  ) {
    super();
    this.displayName = displayName;
    this.description = description;
    this.language = language;
    this.code = code;
    this.saveSnippet = this.saveSnippet.bind(this);
    this.updateSnippets = updateSnippets;
    this.editorFactory = editorFactory;
  }

  saveSnippet(): void {
    const newSnippet = {
      schema_name: 'code-snippet',
      name: this.displayName,
      display_name: this.displayName,
      metadata: {
        description: this.description,
        language: this.language,
        code: this.editor.model.value.text.split('\n')
      }
    };
    const newSnippetString = JSON.stringify(newSnippet);

    if (this.newFile) {
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
  }

  onAfterShow(): void {
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

  onItemSelect(language: string, options: any): void {
    this.language = language;
  }

  itemRenderer(language: string, options: any): React.ReactElement {
    console.log('itemRenderer');
    return <p key={language}> language </p>;
  }

  handleChange(event: Event): void {
    console.log(event);
  }

  render(): React.ReactElement {
    const nameInput = <InputGroup value={this.displayName} type="text-input" />;
    const descriptionInput = (
      <InputGroup
        value={this.description}
        type="text-input"
        onChange={this.handleChange}
      />
    );
    const lanaguageSelector = (
      <Select
        items={defaultLanguages}
        onItemSelect={this.onItemSelect}
        itemRenderer={this.itemRenderer}
      />
    );
    return (
      <div>
        <label htmlFor="display_name">Name:</label>
        <br />
        {nameInput}
        <br />
        <label htmlFor="description">Description (optional):</label>
        <br />
        {descriptionInput}
        <br />
        <label htmlFor="language">Coding language:</label>
        <br />
        {lanaguageSelector}
        <br />
        <label htmlFor="code">Code snippet:</label>
        <br />
        <div id="code" className="elyra-form-code"></div>
        <br />
        <Button onClick={this.saveSnippet}> Save snippet </Button>
      </div>
    );
  }
}
