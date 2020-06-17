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

import { FormGroup } from '@blueprintjs/core';

import { FrontendServices } from '@elyra/application';
import { DropDown } from '@elyra/ui-components';

import { ReactWidget, showDialog, Dialog } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { InputGroup, Button } from '@jupyterlab/ui-components';

import { Message } from '@lumino/messaging';

import * as React from 'react';

import { METADATA_EDITOR_ID } from './index';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';
const DIRTY_CLASS = 'jp-mod-dirty';

type FormItemType = 'TextInput' | 'DropDown' | 'Code';

export type FormItem = {
  value: any;
  type: FormItemType;
  label: string;
  schemaField: string;
  description?: string;
};

interface IMetadataEditorProps {
  metadata: FormItem[];
  newFile: boolean;
  updateSignal: any;
  editorFactory: CodeEditor.Factory | null;
  namespace: string;
  name?: string;
}
/**
 * Metadata editor widget
 */
export class MetadataEditor extends ReactWidget {
  metadata: FormItem[];
  newFile: boolean;
  updateSignal: any;
  editorFactory: CodeEditor.Factory;
  editor: CodeEditor.IEditor;
  namespace: string;
  name: string;
  dirty: boolean;

  constructor(props: IMetadataEditorProps) {
    super();
    this.metadata = props.metadata;
    this.editorFactory = props.editorFactory;
    this.namespace = props.namespace;
    this.newFile = props.newFile;
    this.updateSignal = props.updateSignal;
    this.handleTextInputChange = this.handleTextInputChange.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.name = props.name;
  }

  onCloseRequest(msg: Message): void {
    if (this.dirty) {
      showDialog({
        title: 'Close without saving?',
        body: (
          <p>
            {' '}
            {`"${
              this.getFormItem('Name').value
            }" has unsaved changes, close without saving?`}{' '}
          </p>
        ),
        buttons: [Dialog.cancelButton(), Dialog.okButton()]
      }).then((response: any): void => {
        if (response.button.accept) {
          this.dispose();
          super.onCloseRequest(msg);
        }
      });
    } else {
      this.dispose();
      super.onCloseRequest(msg);
    }
  }

  saveMetadata(): void {
    const newMetadata: any = {
      schema_name: 'code-snippet',
      display_name: this.getFormItem('Name').value,
      metadata: {}
    };

    for (const field of this.metadata) {
      if (field.type == 'TextInput') {
        newMetadata.metadata[field.schemaField] = field.value;
      } else if (field.type == 'DropDown') {
        newMetadata.metadata[field.schemaField] = field.value.choice;
      } else if (field.type == 'Code') {
        newMetadata.metadata[field.schemaField] = field.value.split('\n');
      }
    }
    const newMetadataString = JSON.stringify(newMetadata);

    if (this.newFile) {
      FrontendServices.postMetadata(this.namespace, newMetadataString).then(
        (response: any): void => {
          this.name = response.name;
          this.updateSignal();
          this.newFile = false;
          this.title.label = this.getFormItem('Name').value;
          this.id = `${METADATA_EDITOR_ID}:${this.title.label}`;
          this.handleDirtyState(false);
        }
      );
    } else {
      FrontendServices.putMetadata(
        this.namespace,
        this.name,
        newMetadataString
      ).then((response: any): void => {
        this.handleDirtyState(false);
        if (this.updateSignal) {
          this.updateSignal();
        }
      });
    }
  }

  getFormItem(searchLabel: string): FormItem {
    return this.metadata.find(({ value, type, label, schemaField }) => {
      return label == searchLabel;
    });
  }

  handleTextInputChange(event: any, label: string): void {
    this.handleDirtyState(true);
    this.getFormItem(label).value = event.nativeEvent.srcElement.value;
  }

  handleDropdownChange = (label: string, value: string): void => {
    this.handleDirtyState(true);
    this.getFormItem(label).value.choice = value;
    this.update();
  };

  handleDirtyState(dirty: boolean): void {
    this.dirty = dirty;
    if (this.dirty && !this.title.className.includes(DIRTY_CLASS)) {
      this.title.className += ` ${DIRTY_CLASS}`;
    } else if (!this.dirty) {
      this.title.className = this.title.className.replace(DIRTY_CLASS, '');
    }
  }

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
        this.handleDirtyState(true);
      });
    }
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
            helperText={field.description}
          >
            <InputGroup
              onChange={(event: any): void => {
                this.handleTextInputChange(event, field.label);
              }}
              defaultValue={field.value}
              type="text-input"
            />
          </FormGroup>
        );
      } else if (field.type == 'DropDown') {
        inputElements.push(
          <DropDown
            field={field}
            handleDropdownChange={this.handleDropdownChange}
          ></DropDown>
        );
      }
    }
    let headerText = `Edit "${this.getFormItem('Name').value}"`;
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
