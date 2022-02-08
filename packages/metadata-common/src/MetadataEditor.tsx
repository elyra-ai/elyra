/*
 * Copyright 2018-2022 Elyra Authors
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

import { MetadataService, IDictionary } from '@elyra/services';
import { ThemeProvider, RequestErrors, TextInput } from '@elyra/ui-components';

import { ILabStatus } from '@jupyterlab/application';
import {
  ReactWidget,
  showDialog,
  Dialog,
  IThemeManager
} from '@jupyterlab/apputils';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';

import { find } from '@lumino/algorithm';
import { IDisposable } from '@lumino/disposable';
import { Message } from '@lumino/messaging';
import { Button, Link, styled } from '@material-ui/core';

import * as React from 'react';
import { FormEditor } from './FormEditor';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';
const DIRTY_CLASS = 'jp-mod-dirty';

interface IMetadataEditorProps {
  schema: string;
  schemaspace: string;
  name?: string;
  code?: string[];
  onSave: () => void;
  editorServices: IEditorServices | null;
  status: ILabStatus;
  themeManager?: IThemeManager;
}

const SaveButton = styled(Button)({
  borderColor: 'var(--jp-border-color0)',
  color: 'var(--jp-ui-font-color1)',
  '&:hover': {
    borderColor: ' var(--jp-ui-font-color1)'
  }
});

/**
 * Metadata editor widget
 */
export class MetadataEditor extends ReactWidget {
  onSave: () => void;
  editorServices: IEditorServices | null;
  status: ILabStatus;
  schemaName: string;
  schemaspace: string;
  name?: string;
  code?: string[];
  allTags: string[];
  clearDirty: IDisposable | null;
  invalidForm: boolean;
  showSecure: IDictionary<boolean>;
  widgetClass: string;
  themeManager?: IThemeManager;

  displayName?: string;
  editor?: CodeEditor.IEditor;
  schemaDisplayName?: string;
  titleContext?: string;
  dirty?: boolean;
  requiredFields?: string[];
  referenceURL?: string;
  language?: string;

  schema: IDictionary<any> = {};
  allMetadata: IDictionary<any>[] = [];
  metadata: IDictionary<any> = {};

  constructor(props: IMetadataEditorProps) {
    super();
    this.editorServices = props.editorServices;
    this.status = props.status;
    this.clearDirty = null;
    this.schemaspace = props.schemaspace;
    this.schemaName = props.schema;
    this.allTags = [];
    this.onSave = props.onSave;
    this.name = props.name;
    this.code = props.code;
    this.themeManager = props.themeManager;

    this.widgetClass = `elyra-metadataEditor-${this.name ? this.name : 'new'}`;
    this.addClass(this.widgetClass);

    this.handleDisplayNameChange = this.handleDisplayNameChange.bind(this);

    this.invalidForm = false;

    this.showSecure = {};

    this.initializeMetadata();
  }

  async initializeMetadata(): Promise<void> {
    try {
      const schemas = await MetadataService.getSchema(this.schemaspace);
      for (const schema of schemas) {
        if (this.schemaName === schema.name) {
          this.schema = schema.properties.metadata;
          this.referenceURL = schema.uihints?.reference_url;
          this.schemaDisplayName = schema.title;
          this.requiredFields = schema.properties.metadata.required;
          if (!this.name) {
            this.title.label = `New ${this.schemaDisplayName}`;
          }
          break;
        }
      }
    } catch (error) {
      RequestErrors.serverError(error);
    }

    try {
      this.allMetadata = await MetadataService.getMetadata(this.schemaspace);
    } catch (error) {
      RequestErrors.serverError(error);
    }
    if (this.name) {
      for (const metadata of this.allMetadata) {
        if (metadata.metadata.tags) {
          for (const tag of metadata.metadata.tags) {
            if (!this.allTags.includes(tag)) {
              this.allTags.push(tag);
            }
          }
        } else {
          metadata.metadata.tags = [];
        }
        if (this.name === metadata.name) {
          this.metadata = metadata['metadata'];
          this.displayName = metadata['display_name'];
          this.title.label = this.displayName ?? '';
        }
      }
    } else {
      this.displayName = '';
    }

    this.update();
  }

  private isValueEmpty(schemaValue: any): boolean {
    return (
      schemaValue === undefined ||
      schemaValue === null ||
      schemaValue === '' ||
      (Array.isArray(schemaValue) && schemaValue.length === 0) ||
      (Array.isArray(schemaValue) &&
        schemaValue.length === 1 &&
        schemaValue[0] === '') ||
      schemaValue === '(No selection)'
    );
  }

  onCloseRequest(msg: Message): void {
    if (this.dirty) {
      showDialog({
        title: 'Close without saving?',
        body: (
          <p>
            {' '}
            {`"${this.displayName}" has unsaved changes, close without saving?`}{' '}
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
      schema_name: this.schemaName,
      display_name: this.displayName,
      metadata: this.metadata
    };

    if (this.invalidForm) {
      this.update();
      return;
    }

    if (!this.name) {
      MetadataService.postMetadata(
        this.schemaspace,
        JSON.stringify(newMetadata)
      )
        .then((response: any): void => {
          this.handleDirtyState(false);
          this.onSave();
          this.close();
        })
        .catch(error => RequestErrors.serverError(error));
    } else {
      MetadataService.putMetadata(
        this.schemaspace,
        this.name,
        JSON.stringify(newMetadata)
      )
        .then((response: any): void => {
          this.handleDirtyState(false);
          this.onSave();
          this.close();
        })
        .catch(error => RequestErrors.serverError(error));
    }
  }

  handleDisplayNameChange(value: string): void {
    this.handleDirtyState(true);
    this.displayName = value;
  }

  handleDirtyState(dirty: boolean): void {
    this.dirty = dirty;
    if (this.dirty && !this.clearDirty) {
      this.clearDirty = this.status.setDirty();
    } else if (!this.dirty && this.clearDirty) {
      this.clearDirty.dispose();
      this.clearDirty = null;
    }
    if (this.dirty && !this.title.className.includes(DIRTY_CLASS)) {
      this.title.className += DIRTY_CLASS;
    } else if (!this.dirty) {
      this.title.className = this.title.className.replace(DIRTY_CLASS, '');
    }
  }

  getDefaultChoices(fieldName: string): any[] {
    let defaultChoices = this.schema[fieldName].enum;
    if (!defaultChoices) {
      defaultChoices =
        Object.assign([], this.schema[fieldName].uihints.default_choices) || [];
      for (const otherMetadata of this.allMetadata) {
        if (
          // Don't include the current metadata
          otherMetadata !== this.metadata &&
          // Don't add if otherMetadata hasn't defined field
          otherMetadata.metadata[fieldName] &&
          !find(defaultChoices, (choice: string) => {
            return (
              choice.toLowerCase() ===
              otherMetadata.metadata[fieldName].toLowerCase()
            );
          })
        ) {
          defaultChoices.push(otherMetadata.metadata[fieldName]);
        }
      }
    }
    return defaultChoices;
  }

  setFormFocus(): void {
    const isFocused = document
      .querySelector(`.${this.widgetClass}`)
      ?.contains(document.activeElement);

    if (!isFocused) {
      const input = document.querySelector(
        `.${this.widgetClass} .elyra-metadataEditor-form-display_name input`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  onAfterShow(msg: Message): void {
    this.setFormFocus();
  }

  onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.setFormFocus();
  }

  render(): React.ReactElement {
    let headerText = `Edit "${this.displayName}"`;
    if (!this.name) {
      headerText = `Add new ${this.schemaDisplayName} ${this.titleContext ??
        ''}`;
    }
    const error = this.displayName === '' && this.invalidForm;
    const onKeyPress: React.KeyboardEventHandler = (
      event: React.KeyboardEvent
    ) => {
      const targetElement = event.nativeEvent.target as HTMLElement;
      if (event.key === 'Enter' && targetElement?.tagName !== 'TEXTAREA') {
        this.saveMetadata();
      }
    };
    return (
      <ThemeProvider themeManager={this.themeManager}>
        <div onKeyPress={onKeyPress} className={ELYRA_METADATA_EDITOR_CLASS}>
          <h3> {headerText} </h3>
          <p style={{ width: '100%', marginBottom: '10px' }}>
            All fields marked with an asterisk are required.&nbsp;
            {this.referenceURL ? (
              <Link
                href={this.referenceURL}
                target="_blank"
                rel="noreferrer noopener"
              >
                [Learn more ...]
              </Link>
            ) : null}
          </p>
          {this.displayName !== undefined ? (
            <TextInput
              label="Name"
              key="displayNameTextInput"
              fieldName="display_name"
              defaultValue={this.displayName}
              required={true}
              secure={false}
              defaultError={error}
              onChange={(value): void => {
                this.handleDisplayNameChange(value);
              }}
            />
          ) : null}
          <FormEditor
            schema={this.schema}
            onChange={formData => {
              this.metadata = formData;
              this.handleDirtyState(true);
            }}
            setInvalid={(invalid: boolean) => {
              this.invalidForm = invalid;
            }}
            editorServices={this.editorServices}
            originalData={this.metadata}
            allTags={this.allTags}
          />
          <div
            className={
              'elyra-metadataEditor-formInput elyra-metadataEditor-saveButton'
            }
            key={'SaveButton'}
          >
            <SaveButton
              variant="outlined"
              color="primary"
              onClick={(): void => {
                this.saveMetadata();
              }}
            >
              Save & Close
            </SaveButton>
          </div>
        </div>
      </ThemeProvider>
    );
  }
}
