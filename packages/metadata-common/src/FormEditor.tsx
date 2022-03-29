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

import { IEditorServices } from '@jupyterlab/codeeditor';
import { ITranslator } from '@jupyterlab/translation';
import { IFormComponentRegistry } from '@jupyterlab/ui-components';
import Form, { ArrayFieldTemplateProps, IChangeEvent } from '@rjsf/core';
import * as React from 'react';

/**
 * Props passed to the FormEditor.
 */
interface IFormEditorProps {
  /**
   * Schema for form fields to be displayed.
   */

  schema: any;

  /**
   * Handler to update form data / error state in parent component.
   */
  onChange: (formData: any, invalid: boolean) => void;

  /**
   * Editor services to create new editors in code fields.
   */
  editorServices: IEditorServices | null;

  /**
   * Translator for internationalization
   */
  translator: ITranslator;

  /**
   * Registry to retrieve custom renderers.
   */
  componentRegistry?: IFormComponentRegistry;

  /**
   * Metadata that already exists (if there is any)
   */
  originalData?: any;

  /**
   * All existing tags to give as options.
   */
  allTags?: string[];

  /**
   * All existing languages to give as options.
   */
  languageOptions?: string[];
}

/**
 * React component that allows for custom add / remove buttons in the array
 * field component.
 */
const ArrayTemplate: React.FC<ArrayFieldTemplateProps> = props => {
  return (
    <div className={props.className}>
      <props.TitleField
        title={props.title}
        required={props.required}
        id={`${props.idSchema.$id}-title`}
      />
      <props.DescriptionField
        id={`${props.idSchema.$id}-description`}
        description={props.schema.description ?? ''}
      />
      {props.items.map(item => {
        return (
          <div key={item.key} className={item.className}>
            {item.children}
            <div className="jp-ArrayOperations">
              <button
                className="jp-mod-styled jp-mod-reject"
                onClick={item.onReorderClick(item.index, item.index - 1)}
                disabled={!item.hasMoveUp}
              >
                {props.formContext?.trans?.__?.('Move Up') ?? 'Move up'}
              </button>
              <button
                className="jp-mod-styled jp-mod-reject"
                onClick={item.onReorderClick(item.index, item.index + 1)}
                disabled={!item.hasMoveDown}
              >
                {props.formContext?.trans?.__?.('Move Down') ?? 'Move down'}
              </button>
              <button
                className="jp-mod-styled jp-mod-warn"
                onClick={item.onDropIndexClick(item.index)}
                disabled={!item.hasRemove}
              >
                {props.formContext?.trans?.__?.('Remove') ?? 'remove'}
              </button>
            </div>
          </div>
        );
      })}
      {props.canAdd && (
        <button
          className="jp-mod-styled jp-mod-reject"
          onClick={props.onAddClick}
        >
          {props.formContext?.trans?.__?.('Add') ?? 'Add'}
        </button>
      )}
    </div>
  );
};

/**
 * React component that wraps the RJSF form editor component.
 * Creates a uiSchema from given uihints and passes relevant information
 * to the custom renderers.
 */
export const FormEditor: React.FC<IFormEditorProps> = ({
  schema,
  onChange,
  editorServices,
  componentRegistry,
  translator,
  originalData,
  allTags,
  languageOptions
}) => {
  const [formData, setFormData] = React.useState(originalData ?? ({} as any));
  const [tags, setTags] = React.useState(allTags);

  /**
   * Generate the uiSchema from uihints in the schema.
   */
  const uiSchema: any = {};
  for (const category in schema?.properties) {
    const properties = schema.properties[category];
    uiSchema[category] = {};
    for (const field in properties.properties) {
      uiSchema[category][field] = properties.properties[field].uihints ?? {};
      uiSchema[category][field]['ui:field'] =
        uiSchema[category][field]['field_type'];
      uiSchema[category][field].classNames = `${field}Field`;
    }
  }

  return (
    <Form
      schema={schema}
      formData={formData}
      formContext={{
        editorServices: editorServices,
        language: formData?.['Source']?.language ?? '',
        allTags: tags,
        updateAllTags: (updatedTags: string[]): void => {
          setTags(updatedTags);
        },
        languageOptions: languageOptions,
        trans: translator
      }}
      fields={componentRegistry?.renderers}
      ArrayFieldTemplate={ArrayTemplate}
      uiSchema={uiSchema}
      noHtml5Validate={true}
      onChange={(e: IChangeEvent<any>): void => {
        setFormData(e.formData);
        onChange(e.formData, e.errors.length > 0 || false);
      }}
      liveValidate={true}
    />
  );
};
