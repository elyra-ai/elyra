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

import { FormGroup, Intent, ResizeSensor, Tooltip } from '@blueprintjs/core';

import { FrontendServices, IDictionary } from '@elyra/application';
import { DropDown } from '@elyra/ui-components';

import { ILabStatus } from '@jupyterlab/application';
import { ReactWidget, showDialog, Dialog } from '@jupyterlab/apputils';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { InputGroup, Button } from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { IDisposable } from '@lumino/disposable';
import { Message } from '@lumino/messaging';

import { MetadataEditorTags } from './Tags';

import * as React from 'react';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';
const DIRTY_CLASS = 'jp-mod-dirty';

interface IMetadataEditorProps {
  schema: string;
  namespace: string;
  name?: string;
  onSave: () => void;
  editorServices: IEditorServices | null;
  status: ILabStatus;
}

/**
 * Metadata editor widget
 */
export class MetadataEditor extends ReactWidget {
  onSave: () => void;
  displayName: string;
  editorServices: IEditorServices;
  status: ILabStatus;
  editor: CodeEditor.IEditor;
  schemaName: string;
  schemaDisplayName: string;
  namespace: string;
  name: string;
  dirty: boolean;
  allTags: string[];
  clearDirty: IDisposable;
  requiredFields: string[];
  invalidForm: boolean;
  showSecure: IDictionary<boolean>;
  widgetClass: string;

  schema: IDictionary<any> = {};
  schemaPropertiesByCategory: IDictionary<string[]> = {};
  allMetadata: IDictionary<any>[] = [];
  metadata: IDictionary<any> = {};

  constructor(props: IMetadataEditorProps) {
    super();
    this.editorServices = props.editorServices;
    this.status = props.status;
    this.clearDirty = null;
    this.namespace = props.namespace;
    this.schemaName = props.schema;
    this.allTags = [];
    this.onSave = props.onSave;
    this.name = props.name;

    this.widgetClass = `elyra-metadataEditor-${this.name ? this.name : 'new'}`;
    this.addClass(this.widgetClass);

    this.handleTextInputChange = this.handleTextInputChange.bind(this);
    this.handleChangeOnTag = this.handleChangeOnTag.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.renderField = this.renderField.bind(this);

    this.invalidForm = false;

    this.showSecure = {};

    this.initializeMetadata();
  }

  async initializeMetadata(): Promise<void> {
    const schemas = await FrontendServices.getSchema(this.namespace);
    for (const schema of schemas) {
      if (this.schemaName === schema.name) {
        this.schema = schema.properties.metadata.properties;
        this.schemaDisplayName = schema.title;
        this.requiredFields = schema.properties.metadata.required;
        if (!this.name) {
          this.title.label = `New ${this.schemaDisplayName}`;
        }
        // Find categories of all schema properties
        this.schemaPropertiesByCategory = { _noCategory: [] };
        for (const schemaProperty in this.schema) {
          const category =
            this.schema[schemaProperty].uihints &&
            this.schema[schemaProperty].uihints.category;
          if (!category) {
            this.schemaPropertiesByCategory['_noCategory'].push(schemaProperty);
          } else if (this.schemaPropertiesByCategory[category]) {
            this.schemaPropertiesByCategory[category].push(schemaProperty);
          } else {
            this.schemaPropertiesByCategory[category] = [schemaProperty];
          }
        }
        break;
      }
    }

    this.allMetadata = await FrontendServices.getMetadata(this.namespace);
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
          this.title.label = this.displayName;
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
      schemaValue === '(No selection)'
    );
  }

  /**
   * Checks that all required fields have a value before submitting the form.
   * Returns false if the form is valid. Sets any invalid fields' intent to danger
   * so that the form will highlight the input(s) causing issues in red.
   */
  hasInvalidFields(): boolean {
    this.invalidForm = false;
    if (this.displayName === null || this.displayName === '') {
      this.invalidForm = true;
    }
    for (const schemaField in this.schema) {
      if (
        this.requiredFields.includes(schemaField) &&
        this.isValueEmpty(this.metadata[schemaField])
      ) {
        this.invalidForm = true;
        this.schema[schemaField].uihints.intent = Intent.DANGER;
      } else {
        this.schema[schemaField].uihints.intent = Intent.NONE;
      }
    }
    return this.invalidForm;
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

    if (this.hasInvalidFields()) {
      this.update();
      return;
    }

    if (!this.name) {
      FrontendServices.postMetadata(
        this.namespace,
        JSON.stringify(newMetadata)
      ).then((response: any): void => {
        this.handleDirtyState(false);
        this.onSave();
        this.close();
      });
    } else {
      FrontendServices.putMetadata(
        this.namespace,
        this.name,
        JSON.stringify(newMetadata)
      ).then((response: any): void => {
        this.handleDirtyState(false);
        this.onSave();
        this.close();
      });
    }
  }

  handleTextInputChange(event: any, schemaField: string): void {
    this.handleDirtyState(true);
    // Special case because all metadata has a display name
    if (schemaField === 'display_name') {
      this.displayName = event.nativeEvent.target.value;
    } else {
      this.metadata[schemaField] = event.nativeEvent.target.value;
    }
  }

  handleDropdownChange = (schemaField: string, value: string): void => {
    this.handleDirtyState(true);
    this.metadata[schemaField] = value;
    if (schemaField === 'language') {
      const getMimeTypeByLanguage = this.editorServices.mimeTypeService
        .getMimeTypeByLanguage;
      this.editor.model.mimeType = getMimeTypeByLanguage({
        name: value,
        codemirror_mode: value
      });
    }
    this.update();
  };

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

  onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    // If the update request triggered rendering a 'code' input, and the editor hasn't
    // been initialized yet, create the editor and attach it to the 'code' node
    if (!this.editor && document.getElementById('code:' + this.id) != null) {
      let initialCodeValue;
      const getMimeTypeByLanguage = this.editorServices.mimeTypeService
        .getMimeTypeByLanguage;
      // If the file already exists, initialize the code editor with the existing code
      if (this.name) {
        initialCodeValue = this.metadata['code'].join('\n');
      } else {
        initialCodeValue = '';
      }
      this.editor = this.editorServices.factoryService.newInlineEditor({
        host: document.getElementById('code:' + this.id),
        model: new CodeEditor.Model({
          value: initialCodeValue,
          mimeType: getMimeTypeByLanguage({
            name: this.metadata['language'],
            codemirror_mode: this.metadata['language']
          })
        })
      });
      this.editor.model.value.changed.connect((args: any) => {
        this.metadata['code'] = args.text.split('\n');
        this.handleDirtyState(true);
      });
    }
  }

  getDefaultChoices(fieldName: string): any[] {
    let defaultChoices = this.schema[fieldName].uihints.default_choices;
    if (defaultChoices === undefined) {
      defaultChoices = [];
    }
    for (const otherMetadata of this.allMetadata) {
      if (
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
    return defaultChoices;
  }

  renderTextInput(
    label: string,
    description: string,
    fieldName: string,
    defaultValue: string,
    required: string,
    secure: boolean,
    intent?: Intent
  ): React.ReactElement {
    let helperText = description ? description : '';
    if (intent === Intent.DANGER) {
      helperText += '\nThis field is required.';
    }

    const toggleShowPassword = (): void => {
      this.showSecure[fieldName] = !this.showSecure[fieldName];
      this.update();
    };
    let showPassword = false;
    let toggleShowButton;

    if (secure) {
      if (this.showSecure[fieldName]) {
        showPassword = true;
      } else {
        this.showSecure[fieldName] = false;
      }

      toggleShowButton = (
        <Tooltip content={`${showPassword ? 'Hide' : 'Show'} Password`}>
          <Button
            icon={showPassword ? 'eye-open' : 'eye-off'}
            intent={Intent.WARNING}
            minimal={true}
            onClick={toggleShowPassword}
          />
        </Tooltip>
      );
    }

    return (
      <FormGroup
        key={fieldName}
        label={label}
        labelInfo={required}
        helperText={helperText}
        intent={intent}
      >
        <InputGroup
          onChange={(event: any): void => {
            this.handleTextInputChange(event, fieldName);
          }}
          defaultValue={defaultValue}
          rightElement={toggleShowButton}
          type={showPassword || !secure ? 'text' : 'password'}
          className={`elyra-metadataEditor-form-${fieldName}`}
        />
      </FormGroup>
    );
  }

  onAfterShow(msg: Message): void {
    const input = document.querySelector(
      `.${this.widgetClass} .elyra-metadataEditor-form-display_name input`
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  renderField(fieldName: string): React.ReactElement {
    let uihints = this.schema[fieldName].uihints;
    let required = '(optional)';
    if (this.requiredFields && this.requiredFields.includes(fieldName)) {
      required = '(required)';
    }
    if (uihints === undefined) {
      uihints = {};
      this.schema[fieldName].uihints = uihints;
    }
    if (
      uihints.field_type === 'textinput' ||
      uihints.field_type === undefined
    ) {
      return this.renderTextInput(
        this.schema[fieldName].title,
        uihints.description,
        fieldName,
        this.metadata[fieldName],
        required,
        uihints.secure,
        uihints.intent
      );
    } else if (uihints.field_type === 'dropdown') {
      return (
        <DropDown
          label={this.schema[fieldName].title}
          schemaField={fieldName}
          description={uihints.description}
          required={required}
          intent={uihints.intent}
          choice={this.metadata[fieldName]}
          defaultChoices={this.getDefaultChoices(fieldName)}
          handleDropdownChange={this.handleDropdownChange}
        ></DropDown>
      );
    } else if (uihints.field_type === 'code') {
      let helperText: string;
      if (uihints.intent === Intent.DANGER) {
        helperText = 'This field is required.';
      }
      return (
        <FormGroup
          className={'elyra-metadataEditor-code'}
          labelInfo={required}
          label={this.schema[fieldName].title}
          intent={uihints.intent}
          helperText={helperText}
        >
          <ResizeSensor
            onResize={(): void => {
              this.editor.refresh();
            }}
          >
            <div id={'code:' + this.id} className="elyra-form-code va-va"></div>
          </ResizeSensor>
        </FormGroup>
      );
    } else if (uihints.field_type === 'tags') {
      return (
        <FormGroup
          labelInfo={'(optional)'}
          label={'Tags'}
          intent={uihints.intent}
        >
          <MetadataEditorTags
            selectedTags={this.metadata.tags}
            tags={this.allTags}
            handleChange={this.handleChangeOnTag}
          />
        </FormGroup>
      );
    } else {
      return;
    }
  }

  handleChangeOnTag(selectedTags: string[], allTags: string[]): void {
    this.handleDirtyState(true);
    this.metadata.tags = selectedTags;
    this.allTags = allTags;
  }

  render(): React.ReactElement {
    const inputElements = [];
    for (const category in this.schemaPropertiesByCategory) {
      if (category !== '_noCategory') {
        inputElements.push(
          <h4 style={{ flexBasis: '100%', paddingBottom: '10px' }}>
            {category}
          </h4>
        );
      }
      for (const schemaProperty of this.schemaPropertiesByCategory[category]) {
        inputElements.push(this.renderField(schemaProperty));
      }
    }
    let headerText = `Edit "${this.displayName}"`;
    if (!this.name) {
      headerText = `Add new ${this.schemaDisplayName}`;
    }
    let intent: Intent = Intent.NONE;
    if (this.displayName === '' && this.invalidForm) {
      intent = Intent.DANGER;
    }
    return (
      <div className={ELYRA_METADATA_EDITOR_CLASS}>
        <h3> {headerText} </h3>
        {this.displayName !== undefined
          ? this.renderTextInput(
              'Name',
              '',
              'display_name',
              this.displayName,
              '(required)',
              false,
              intent
            )
          : null}
        {inputElements}
        <FormGroup className={'elyra-metadataEditor-saveButton'}>
          <Button
            onClick={(): void => {
              this.saveMetadata();
            }}
          >
            Save & Close
          </Button>
        </FormGroup>
      </div>
    );
  }
}
