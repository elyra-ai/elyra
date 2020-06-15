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
import { FrontendServices } from '@elyra/application';
import { ReactWidget, WidgetTracker } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Select, InputGroup, Button } from '@jupyterlab/ui-components';

import { Message } from '@lumino/messaging';

import * as React from 'react';

import { METADATA_EDITOR_ID } from './index';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';
const DROPDOWN_ITEM_CLASS = 'elyra-form-DropDown-item';

type FormItemType = 'TextInput' | 'DropDown' | 'Code';

export type FormItem = {
  value: any;
  type: FormItemType;
  label: string;
  schemaField: string;
};

/**
 * Metadata editor widget
 */
export class MetadataEditor extends ReactWidget {
  metadata: FormItem[];
  newFile: boolean;
  updateSignal: any;
  fileName: string;
  editorFactory: CodeEditor.Factory;
  editor: CodeEditor.IEditor;
  endpoint: string;
  tracker: WidgetTracker;

  constructor(
    metadata: FormItem[],
    newFile: boolean,
    updateSignal: any,
    editorFactory: CodeEditor.Factory | null,
    endpoint: string,
    tracker: WidgetTracker,
    fileName?: string
  ) {
    super();
    this.metadata = metadata;
    this.editorFactory = editorFactory;
    this.endpoint = endpoint;
    this.newFile = newFile;
    this.updateSignal = updateSignal;
    this.handleTextInputChange = this.handleTextInputChange.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.tracker = tracker;
    if (fileName) {
      this.fileName = fileName;
    }
  }

  onCloseRequest(msg: Message): void {
    this.dispose();
    super.onCloseRequest(msg);
  }

  saveMetadata(): void {
    const newSnippet: any = {
      schema_name: 'code-snippet',
      name: this.fileName,
      display_name: this.getFormItem('Name').value,
      metadata: {}
    };

    for (const field of this.metadata) {
      if (field.type == 'TextInput') {
        newSnippet.metadata[field.schemaField] = field.value;
      } else if (field.type == 'DropDown') {
        newSnippet.metadata[field.schemaField] = field.value.choice;
      } else if (field.type == 'Code') {
        newSnippet.metadata[field.schemaField] = field.value.split('\n');
      }
    }
    const newSnippetString = JSON.stringify(newSnippet);

    if (this.newFile) {
      FrontendServices.postMetadata(this.endpoint, newSnippetString).then(
        (response: any): void => {
          this.updateSignal();
          this.newFile = false;
          this.title.label = this.getFormItem('Name').value;
          this.id = `${METADATA_EDITOR_ID}:${this.title.label}`;
        }
      );
    } else {
      FrontendServices.putMetadata(
        this.endpoint,
        newSnippet.name,
        newSnippetString
      ).then((response: any): void => {
        this.updateSignal();
      });
    }
  }

  renderCreateOption = (
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

  filterDropdown: ItemPredicate<string> = (
    query,
    value,
    _index,
    exactMatch
  ) => {
    const normalizedTitle = value.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (normalizedQuery === normalizedTitle) {
      return normalizedTitle === normalizedQuery;
    } else {
      return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
    }
  };

  getFormItem(searchLabel: string): FormItem {
    return this.metadata.find(({ value, type, label, schemaField }) => {
      return label == searchLabel;
    });
  }

  handleTextInputChange(event: any, label: string): void {
    this.tracker.save(this);
    this.getFormItem(label).value = event.nativeEvent.srcElement.value;
  }

  handleDropdownChange = (label: string, value: string): void => {
    this.tracker.save(this);
    this.getFormItem(label).value.choice = value;
    this.update();
  };

  onAfterShow(): void {
    if (!this.editor) {
      this.editor = this.editorFactory({
        host: document.getElementById('Code:' + this.id),
        model: new CodeEditor.Model({
          value: this.getFormItem('Code').value
        })
      });
      this.editor.model.value.changed.connect((args: any) => {
        this.getFormItem('Code').value = args.text;
        this.tracker.save(this);
      });
    }
  }

  itemRenderer(value: string, options: any): React.ReactElement {
    return (
      <Button
        className={DROPDOWN_ITEM_CLASS}
        onClick={options.handleClick}
        key={value}
        text={value}
      ></Button>
    );
  }

  render(): React.ReactElement {
    const inputElements = [];
    for (const field of this.metadata) {
      if (field.type == 'TextInput') {
        inputElements.push(
          <FormGroup
            key={field.label}
            label={field.label}
            labelInfo="(required)"
          >
            <InputGroup
              onChange={(event: any) => {
                this.handleTextInputChange(event, field.label);
              }}
              defaultValue={field.value}
              type="text-input"
            />
          </FormGroup>
        );
      } else if (field.type == 'DropDown') {
        inputElements.push(
          <FormGroup
            key={field.label}
            label={field.label}
            labelInfo="(required)"
          >
            <Select
              items={field.value.defaultChoices}
              itemPredicate={this.filterDropdown}
              createNewItemFromQuery={newValue => {
                return newValue;
              }}
              createNewItemRenderer={this.renderCreateOption}
              onItemSelect={(value: string): void => {
                this.handleDropdownChange(field.label, value);
              }}
              itemRenderer={this.itemRenderer}
            >
              <Button
                rightIcon="caret-down"
                text={
                  field.value.choice ? field.value.choice : '(No selection)'
                }
              />
            </Select>
          </FormGroup>
        );
      }
    }
    let headerText = `Edit "${this.getFormItem('Name').value}" Metadata`;
    if (this.newFile) {
      headerText = 'Add new metadata';
    }
    return (
      <div className={ELYRA_METADATA_EDITOR_CLASS}>
        <h3> {headerText} </h3>
        <br />
        {inputElements}
        <label
          style={{ width: '100%', display: 'flex' }}
          htmlFor={'Code:' + this.id}
        >
          Code:
        </label>
        <br />
        <div id={'Code:' + this.id} className="elyra-form-code"></div>
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
