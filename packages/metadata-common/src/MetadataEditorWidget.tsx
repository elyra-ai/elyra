/*
 * Copyright 2018-2023 Elyra Authors
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
import { RequestErrors } from '@elyra/ui-components';

import { ILabStatus } from '@jupyterlab/application';
import { ReactWidget, showDialog, Dialog } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { TranslationBundle } from '@jupyterlab/translation';
import { IFormComponentRegistry } from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { Message } from '@lumino/messaging';

import * as React from 'react';

import { MetadataEditor } from './MetadataEditor';

const DIRTY_CLASS = 'jp-mod-dirty';

/**
 * Props for the Metadata Editor component.
 */
export interface IMetadataEditorProps {
  /**
   * Schema name used for schema lookup and save
   */
  schemaName: string;

  /**
   * Schemaspace also used for schema lookup and saving.
   */
  schemaspace: string;

  /**
   * Name of metadata to edit (undefined if new metadata)
   */
  name?: string;

  /**
   * Callback to handle updates after saving metadata.
   */
  onSave: () => void;

  /**
   * Editor services to create code editor for code fields.
   */
  editorServices: IEditorServices | null;

  /**
   * Translator for internationalization.
   */
  translator: TranslationBundle;

  /**
   * Status for handling unsaved changes through JupyterLab
   */
  status: ILabStatus;

  /**
   * Component registry to use custom field renderers.
   */
  componentRegistry?: IFormComponentRegistry;

  /**
   * String used to make the title of the editor more readable
   */
  titleContext?: string;

  /**
   * A default value for code fields
   */
  code?: string[];
}

/**
 * Widget wrapper around the metadata editor components. Handles preparing
 * the schema and metadata for the component.
 */
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

  /**
   * Loads schema and metadata and adds categories.
   */
  async loadSchemaAndMetadata(): Promise<void> {
    try {
      // Load all schema and all metadata in schemaspace.
      const allSchema = await MetadataService.getSchema(this.props.schemaspace);
      const allMetadata = (this.allMetadata = await MetadataService.getMetadata(
        this.props.schemaspace,
      ));

      // Loads all tags to display as options in the editor.
      this.allTags = allMetadata.reduce((acc: string[], metadata: any) => {
        if (metadata.metadata.tags) {
          acc.push(
            ...metadata.metadata.tags.filter((tag: string) => {
              return !acc.includes(tag);
            }),
          );
        }
        return acc;
      }, []);

      // Finds schema based on schemaName.
      const schema =
        allSchema.find((s: any) => {
          return s.name === this.props.schemaName;
        }) ?? {};

      // Sets const fields to readonly.
      const properties = schema.properties.metadata.properties;
      for (const prop in properties) {
        if (properties[prop].uihints?.hidden) {
          delete properties[prop];
          continue;
        }
        if (properties[prop].const !== undefined) {
          properties[prop].default = properties[prop].const;
          properties[prop].uihints = {
            'ui:readonly': true,
          };
        }
      }

      const metadata = allMetadata.find((m: any) => m.name === this.props.name);

      // Adds categories as wrapper objects in the schema.
      const metadataWithCategories: { [id: string]: any } = {};
      const schemaPropertiesByCategory: { [id: string]: any } = {
        _noCategory: {
          type: 'object',
          title: ' ',
          properties: {
            display_name: {
              title: this.props.translator.__('Display Name'),
              description: this.props.translator.__(
                'Name used to identify an instance of metadata.',
              ),
              type: 'string',
            },
          },
          required: ['display_name'],
        },
      };

      // Adds required fields to the wrapper required fields.
      const requiredCategories: string[] = [];
      for (const schemaProperty in schema.properties.metadata.properties) {
        const properties =
          schema.properties.metadata.properties[schemaProperty];
        const category =
          (properties.uihints && properties.uihints.category) ?? '_noCategory';

        if (!metadataWithCategories[category]) {
          metadataWithCategories[category] = {};
        }
        metadataWithCategories[category][schemaProperty] =
          metadata?.metadata?.[schemaProperty] ?? properties.default;
        if (schemaProperty === 'code' && this.props.code) {
          metadataWithCategories[category][schemaProperty] = this.props.code;
        }
        if (!schemaPropertiesByCategory[category]) {
          schemaPropertiesByCategory[category] = {
            type: 'object',
            properties: {},
            required: [],
          };
        }
        if (schema.properties.metadata.required?.includes(schemaProperty)) {
          schemaPropertiesByCategory[category].required.push(schemaProperty);
          if (!requiredCategories.includes(category)) {
            requiredCategories.push(category);
          }
        }
        schemaPropertiesByCategory[category]['properties'][schemaProperty] =
          properties;
      }
      if (metadataWithCategories['_noCategory']) {
        metadataWithCategories['_noCategory']['display_name'] =
          metadata?.['display_name'];
      }
      this.schema = schema;
      this.schema.properties.metadata.properties = schemaPropertiesByCategory;
      this.schema.properties.metadata.required = requiredCategories;
      this.metadata = metadataWithCategories;
      this.title.label = metadata?.display_name ?? `New ${this.schema.title}`;
      this.loading = false;
      this.update();
    } catch (error) {
      RequestErrors.serverError(error);
    }
  }

  /**
   * Puts the display name field in focus.
   */
  setFormFocus(): void {
    const isFocused = document
      .querySelector(`.${this.widgetClass}`)
      ?.contains(document.activeElement);

    if (!isFocused) {
      const input = document.querySelector(
        `.${this.widgetClass} .display_nameField input`,
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

  /**
   * Sets the state to dirty to enable changing the display and
   * add warnings when closing with unsaved changes.
   */
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
        title: this.props.translator.__('Close without saving?'),
        body: <p>Metadata has unsaved changes, close without saving?</p>,
        buttons: [Dialog.cancelButton(), Dialog.okButton()],
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
    for (const category in schema.properties) {
      const properties = schema.properties[category].properties[fieldName];
      if (!properties) {
        continue;
      }
      const defaultChoices =
        Object.assign([], properties.uihints.default_choices) || [];
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
      return defaultChoices;
    }
    return [];
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
