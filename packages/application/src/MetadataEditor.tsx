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

import { FormGroup, MenuItem } from '@blueprintjs/core';
import { ItemPredicate } from '@blueprintjs/select';
import { ReactWidget } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Select, InputGroup, Button } from '@jupyterlab/ui-components';

import { FrontendServices } from './services';

import { Message } from '@lumino/messaging';

import * as React from 'react';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';

const defaultLanguages = ['python', 'R', 'C#', 'scala'];

/**
 * Metadata editor widget
 */
export class MetadataEditor extends ReactWidget {
  metadata: any;
  newFile: boolean;
  updateSignal: () => void;
  editorFactory: CodeEditor.Factory;
  editor: CodeEditor.IEditor;
  endpoint: string;

  constructor(
    metadata: any,
    newFile: boolean,
    updateSignal: () => void,
    editorFactory: CodeEditor.Factory | null,
    endpoint: string
  ) {
    super();
    this.metadata = metadata;
    this.metadata.displayName = metadata.name;
    this.editorFactory = editorFactory;
    this.endpoint = endpoint;
    this.newFile = newFile;
    this.updateSignal = updateSignal;
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
  }

  onCloseRequest(msg: Message) {
    this.dispose();
    super.onCloseRequest(msg);
  }

  saveMetadata(): void {
    if (this.newFile) {
      this.metadata.name = this.metadata.displayName.split(' ').join('_');
    }
    const newSnippet = {
      schema_name: 'code-snippet',
      name: this.metadata.name,
      display_name: this.metadata.displayName,
      metadata: {
        description: this.metadata.description,
        language: this.metadata.language,
        code: this.editor.model.value.text.split('\n')
      }
    };
    const newSnippetString = JSON.stringify(newSnippet);

    if (this.newFile) {
      FrontendServices.postMetadata(this.endpoint, newSnippetString).then(
        (response: any): void => {
          this.updateSignal();
        }
      );
      this.newFile = false;
      this.title.label = `[${this.metadata.language}] ${this.metadata.displayName}`;
    } else {
      FrontendServices.putMetadata(
        this.endpoint + newSnippet.name,
        newSnippetString
      ).then((response: any): void => {
        this.updateSignal();
      });
    }
  }

  renderCreateLanguageOption = (
    query: string,
    active: boolean,
    handleClick: React.MouseEventHandler<HTMLElement>
  ): React.ReactElement => (
    <MenuItem
      icon="add"
      text={`Create "${query}"`}
      active={active}
      onClick={handleClick}
      shouldDismissPopover={false}
    />
  );

  filterLanguage: ItemPredicate<string> = (
    query,
    language,
    _index,
    exactMatch
  ) => {
    const normalizedTitle = language.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (normalizedQuery === normalizedTitle) {
      return normalizedTitle === normalizedQuery;
    } else {
      return `${language}`.indexOf(normalizedQuery) >= 0;
    }
  };

  handleNameChange(event: any): void {
    this.metadata.displayName = event.nativeEvent.srcElement.value;
  }

  handleDescriptionChange(event: any): void {
    this.metadata.description = event.nativeEvent.srcElement.value;
  }

  handleLanguageChange = (language: string): void => {
    this.metadata.language = language;
    this.update();
  };

  onAfterShow(): void {
    if (!this.editor) {
      this.editor = this.editorFactory({
        host: document.getElementById('code:' + this.metadata.name),
        model: new CodeEditor.Model({ value: this.metadata.code })
      });
    }
  }

  onItemSelect(language: string, options: any): void {
    this.metadata.language = language;
    this.update();
  }

  itemRenderer(language: string, options: any): React.ReactElement {
    return (
      <Button
        onClick={options.handleClick}
        key={language}
        text={language}
      ></Button>
    );
  }

  render(): React.ReactElement {
    const nameInput = (
      <InputGroup
        onChange={this.handleNameChange}
        defaultValue={this.metadata.name}
        type="text-input"
      />
    );
    const descriptionInput = (
      <InputGroup
        onChange={this.handleDescriptionChange}
        defaultValue={this.metadata.description}
        type="text-input"
      />
    );
    const languageInput = (
      <Select
        items={defaultLanguages}
        itemPredicate={this.filterLanguage}
        createNewItemFromQuery={(newLanguage: string): string => {
          return newLanguage;
        }}
        createNewItemRenderer={this.renderCreateLanguageOption}
        onItemSelect={this.handleLanguageChange}
        itemRenderer={this.itemRenderer}
      >
        <Button
          icon="code"
          rightIcon="caret-down"
          text={
            this.metadata.language != ''
              ? this.metadata.language
              : '(No selection)'
          }
        />
      </Select>
    );
    let headerText = `Edit ${this.metadata.name} Metadata`;
    if (this.newFile) {
      headerText = 'Add new metadata';
    }
    return (
      <div className={ELYRA_METADATA_EDITOR_CLASS}>
        <h3> {headerText} </h3>
        <br />
        <FormGroup label="Name" labelFor="text-input" labelInfo="(required)">
          {nameInput}
        </FormGroup>
        <FormGroup
          label="Description"
          labelFor="text-input"
          labelInfo="(optional)"
        >
          {descriptionInput}
        </FormGroup>
        <FormGroup label="Coding Language" labelInfo="(required)">
          {languageInput}
        </FormGroup>
        <label
          style={{ width: '100%', display: 'flex' }}
          htmlFor={'code:' + this.metadata.name}
        >
          Code:
        </label>
        <br />
        <div
          id={'code:' + this.metadata.name}
          className="elyra-form-code"
        ></div>
        <br />
        <Button
          onClick={(): void => {
            this.saveMetadata();
          }}
        >
          {' '}
          Save{' '}
        </Button>
      </div>
    );
  }
}
