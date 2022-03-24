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

import { MetadataService } from '@elyra/services';
import { ThemeProvider, RequestErrors } from '@elyra/ui-components';

import { ILabStatus } from '@jupyterlab/application';
import {
  ReactWidget,
  showDialog,
  Dialog,
  IThemeManager
} from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { IFormComponentRegistry } from '@jupyterlab/ui-components';
import { ITranslator } from '@jupyterlab/translation';

import { find } from '@lumino/algorithm';
import { Message } from '@lumino/messaging';

import * as React from 'react';

import { FormEditor } from './FormEditor';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';
const DIRTY_CLASS = 'jp-mod-dirty';

interface IMetadataEditorProps {
  schemaName: string;
  schemaspace: string;
  name?: string;
  code?: string[];
  onSave: () => void;
  editorServices: IEditorServices | null;
  translator: ITranslator;
  status: ILabStatus;
  componentRegistry?: IFormComponentRegistry;
  themeManager?: IThemeManager;
}

interface IMetadataEditorComponentProps extends IMetadataEditorProps {
  schemaTop: any;
  initialMetadata: any;
  setDirty: (dirty: boolean) => void;
  close: () => void;
  allTags: string[];
  getDefaultChoices: (fieldName: string) => string[];
}

/**
 * Metadata editor widget
 */
const MetadataEditor: React.FC<IMetadataEditorComponentProps> = ({
  editorServices,
  schemaspace,
  onSave,
  schemaName,
  schemaTop,
  initialMetadata,
  translator,
  name,
  themeManager,
  setDirty,
  close,
  allTags,
  componentRegistry,
  getDefaultChoices
}: IMetadataEditorComponentProps) => {
  const [invalidForm, setInvalidForm] = React.useState(name === undefined);

  const schema = schemaTop.properties.metadata;

  React.useEffect(() => {
    if (initialMetadata?.metadata) {
      initialMetadata.metadata['display_name'] =
        initialMetadata['display_name'];
    }
    setMetadata(initialMetadata);
  }, [initialMetadata]);
  const [metadata, setMetadata] = React.useState(initialMetadata?.metadata);
  const displayName = initialMetadata?.['display_name'];
  const referenceURL = schemaTop.uihints?.reference_url;
  const saveMetadata = (): void => {
    if (invalidForm) {
      return;
    }

    const newMetadata: any = {
      schema_name: schemaName,
      display_name: metadata?.['_noCategory']?.['display_name'],
      metadata: flattenFormData(metadata)
    };

    if (!name) {
      MetadataService.postMetadata(schemaspace, JSON.stringify(newMetadata))
        .then((response: any): void => {
          setDirty(false);
          onSave();
          close();
        })
        .catch(error => RequestErrors.serverError(error));
    } else {
      MetadataService.putMetadata(
        schemaspace,
        name,
        JSON.stringify(newMetadata)
      )
        .then((response: any): void => {
          setDirty(false);
          onSave();
          close();
        })
        .catch(error => RequestErrors.serverError(error));
    }
  };

  let headerText = `Edit "${displayName}"`;
  if (!displayName) {
    headerText = `Add new ${schemaTop.title}`;
  }

  const flattenFormData = (newFormData: any) => {
    const flattened: { [id: string]: any } = {};
    for (const category in newFormData) {
      for (const property in newFormData[category]) {
        flattened[property] = newFormData[category][property];
      }
    }
    return flattened;
  };

  const onKeyPress: React.KeyboardEventHandler = (
    event: React.KeyboardEvent
  ) => {
    const targetElement = event.nativeEvent.target as HTMLElement;
    if (event.key === 'Enter' && targetElement?.tagName !== 'TEXTAREA') {
      saveMetadata();
    }
  };
  return (
    <ThemeProvider themeManager={themeManager}>
      <div onKeyPress={onKeyPress} className={ELYRA_METADATA_EDITOR_CLASS}>
        <h3> {headerText} </h3>
        <p style={{ width: '100%', marginBottom: '10px' }}>
          All fields marked with an asterisk are required.&nbsp;
          {referenceURL ? (
            <a href={referenceURL} target="_blank" rel="noreferrer noopener">
              [Learn more ...]
            </a>
          ) : null}
        </p>
        <FormEditor
          schema={schema}
          onChange={(formData: any): void => {
            setMetadata(formData);
            setDirty(true);
          }}
          componentRegistry={componentRegistry}
          setInvalid={(invalid: boolean): void => {
            setInvalidForm(invalid);
          }}
          translator={translator}
          editorServices={editorServices}
          originalData={metadata}
          allTags={allTags}
          languageOptions={getDefaultChoices('language')}
        />
        <div
          className={`elyra-metadataEditor-formInput elyra-metadataEditor-saveButton ${
            invalidForm ? 'errorForm' : ''
          }`}
          key={'SaveButton'}
        >
          {invalidForm ? (
            <p className="formError">Cannot save invalid form.</p>
          ) : (
            <div />
          )}
          <button
            onClick={(): void => {
              saveMetadata();
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </ThemeProvider>
  );
};

export class MetadataEditorWidget extends ReactWidget {
  props: IMetadataEditorProps;
  widgetClass: string;
  schema: any = {};
  metadata: any = {};
  loading = true;
  dirty = false;
  clearDirty: any;
  allTags: string[] = [];
  allMetadata: any;

  constructor(props: IMetadataEditorProps) {
    super();
    this.props = props;
    this.widgetClass = `elyra-metadataEditor-${props.name ?? 'new'}`;
    this.addClass(this.widgetClass);

    this.getDefaultChoices = this.getDefaultChoices.bind(this);
    this.handleDirtyState = this.handleDirtyState.bind(this);
    this.close = this.close.bind(this);
    void this.loadSchemaAndMetadata();
  }

  async loadSchemaAndMetadata(): Promise<void> {
    try {
      const allSchema = await MetadataService.getSchema(this.props.schemaspace);
      const allMetadata = (this.allMetadata = await MetadataService.getMetadata(
        this.props.schemaspace
      ));
      this.allTags = allMetadata.reduce((acc: string[], metadata: any) => {
        if (metadata.metadata.tags) {
          acc.push(
            ...metadata.metadata.tags.filter((tag: string) => {
              return !acc.includes(tag);
            })
          );
        }
        return acc;
      }, []);
      const schema =
        allSchema.find((s: any) => {
          return s.name === this.props.schemaName;
        }) ?? {};
      const properties = schema.properties.metadata.properties;
      for (const prop in properties) {
        if (properties[prop].const !== undefined) {
          properties[prop].default = properties[prop].const;
          properties[prop].uihints = {
            'ui:readonly': true
          };
        }
      }
      const metadata = allMetadata.find((m: any) => m.name === this.props.name);
      const metadataWithCategories: { [id: string]: any } = {};
      const schemaPropertiesByCategory: { [id: string]: any } = {
        _noCategory: {
          type: 'object',
          title: ' ',
          properties: {
            display_name: {
              title: 'Name',
              type: 'string'
            }
          },
          required: ['display_name']
        }
      };
      for (const schemaProperty in schema.properties.metadata.properties) {
        const properties =
          schema.properties.metadata.properties[schemaProperty];
        const category =
          (properties.uihints && properties.uihints.category) ?? '_noCategory';

        if (!metadataWithCategories[category]) {
          metadataWithCategories[category] = {};
        }
        metadataWithCategories[category][schemaProperty] =
          metadata?.metadata?.[schemaProperty];
        if (!schemaPropertiesByCategory[category]) {
          schemaPropertiesByCategory[category] = {
            type: 'object',
            properties: {},
            required: []
          };
        }
        if (schema.properties.metadata.required?.includes(schemaProperty)) {
          schemaPropertiesByCategory[category].required.push(schemaProperty);
        }
        schemaPropertiesByCategory[category]['properties'][
          schemaProperty
        ] = properties;
      }
      this.schema = schema;
      this.schema.properties.metadata.properties = schemaPropertiesByCategory;
      this.metadata = metadataWithCategories;
      this.title.label =
        this.metadata?.display_name ?? `New ${this.schema.title}`;
      this.loading = false;
      this.update();
    } catch (error) {
      RequestErrors.serverError(error);
    }
  }

  setFormFocus(): void {
    const isFocused = document
      .querySelector(`.${this.widgetClass}`)
      ?.contains(document.activeElement);

    if (!isFocused) {
      const input = document.querySelector(
        `.${this.widgetClass} .display_nameField input`
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

  handleDirtyState(dirty: boolean): void {
    this.dirty = dirty;
    if (dirty && !this.clearDirty) {
      this.clearDirty = this.props.status.setDirty();
    } else if (!dirty && this.clearDirty) {
      this.clearDirty.dispose();
      this.clearDirty = null;
    }
    if (dirty && !this.title.className.includes(DIRTY_CLASS)) {
      this.title.className += DIRTY_CLASS;
    } else if (!dirty) {
      this.title.className = this.title.className.replace(DIRTY_CLASS, '');
    }
  }

  onCloseRequest(msg: Message): void {
    if (this.dirty) {
      showDialog({
        title: 'Close without saving?',
        body: <p>Metadata has unsaved changes, close without saving?</p>,
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

  getDefaultChoices(fieldName: string): any[] {
    const schema = this.schema.properties.metadata;
    if (!schema.properties?.[fieldName]) {
      return [];
    }
    let defaultChoices = schema.properties[fieldName].enum;
    if (!defaultChoices) {
      defaultChoices =
        Object.assign(
          [],
          schema.properties[fieldName].uihints.default_choices
        ) || [];
      for (const otherMetadata of this.allMetadata) {
        if (
          // Don't include the current metadata
          otherMetadata !== this.metadata?.metadata &&
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

  render(): React.ReactElement {
    if (this.loading) {
      return <p>Loading...</p>;
    }
    return (
      <MetadataEditor
        {...this.props}
        schemaTop={this.schema}
        initialMetadata={this.metadata}
        setDirty={this.handleDirtyState}
        close={this.close}
        allTags={this.allTags}
        getDefaultChoices={this.getDefaultChoices}
      />
    );
  }
}
